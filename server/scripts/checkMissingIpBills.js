const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not defined in .env file');
    process.exit(1);
}

const paymentSchema = new mongoose.Schema({}, { strict: false });
const Payment = mongoose.model('Payment', paymentSchema, 'payments');

const panelSchema = new mongoose.Schema({}, { strict: false });
const Panel = mongoose.model('Panel', panelSchema, 'panels');

async function checkMissingData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        console.log('Fetching API Data...');
        const apiResponse = await axios.get('https://iphub.deepmindinfotech.com/backend/admin/ip/billing-summary?limit=2000');
        const apiData = apiResponse.data.data;
        console.log(`Fetched ${apiData.length} records from API.`);

        console.log('Fetching Local DB Data...');
        const dbPayments = await Payment.find({
            billAmount: { $gt: 0 },
            paymentType: "IP Charges"
        }).lean();
        console.log(`Fetched ${dbPayments.length} IP Charge payments from DB.`);

        const panels = await Panel.find({}).lean();
        const panelMap = {}; // name -> id
        const panelIdToName = {}; // id -> name
        panels.forEach(p => {
            if (p.panelName) {
                const lowerName = p.panelName.toLowerCase().trim();
                panelMap[lowerName] = p._id.toString();
                panelIdToName[p._id.toString()] = p.panelName;
            }
        });

        // 1. Aggregate API Data: panelName(lower) -> dateStr -> sum of count
        const apiAgg = {};
        for (const item of apiData) {
            const panelName = item.panel_name ? item.panel_name.toLowerCase().trim() : 'unknown';
            const d = new Date(item.createdAt || item.date);
            const dateStr = d.toISOString().split('T')[0];

            if (!apiAgg[panelName]) apiAgg[panelName] = {};
            if (!apiAgg[panelName][dateStr]) apiAgg[panelName][dateStr] = { count: 0, originalRecords: [] };

            apiAgg[panelName][dateStr].count += (item.count || 0);
            apiAgg[panelName][dateStr].originalRecords.push(item);
        }

        // 2. Aggregate DB Data: panelName(lower) -> dateStr -> sum of quantity
        const dbAgg = {};
        for (const p of dbPayments) {
            const panelId = p.panelId ? p.panelId.toString() : 'unknown';
            const panelName = panelIdToName[panelId] ? panelIdToName[panelId].toLowerCase().trim() : 'unknown';

            const d = new Date(p.timestamp || p.createdAt || p.date);
            const dateStr = d.toISOString().split('T')[0];

            if (!dbAgg[panelName]) dbAgg[panelName] = {};
            if (!dbAgg[panelName][dateStr]) dbAgg[panelName][dateStr] = { quantity: 0, dbRecords: [] };

            dbAgg[panelName][dateStr].quantity += (p.quantity || 0);
            dbAgg[panelName][dateStr].dbRecords.push(p);
        }

        // 3. Compare the two and generate report
        const report = {
            panelsNotFound: [],
            missingEntries: [],
            countMismatches: []
        };

        for (const [panelName, datesMap] of Object.entries(apiAgg)) {
            const panelId = panelMap[panelName];

            if (!panelId) {
                report.panelsNotFound.push({
                    panelName: panelName,
                    message: 'Panel is in API but not found in local Payments DB',
                    totalDatesAffected: Object.keys(datesMap).length
                });
                continue;
            }

            for (const [dateStr, apiInfo] of Object.entries(datesMap)) {
                const dbInfo = dbAgg[panelName] && dbAgg[panelName][dateStr];

                if (!dbInfo) {
                    report.missingEntries.push({
                        panelName: panelIdToName[panelId],
                        date: dateStr,
                        apiCount: apiInfo.count,
                        message: 'API has entry for this date but DB has none'
                    });
                } else if (dbInfo.quantity !== apiInfo.count) {
                    report.countMismatches.push({
                        panelName: panelIdToName[panelId],
                        date: dateStr,
                        apiCount: apiInfo.count,
                        dbQuantity: dbInfo.quantity,
                        difference: apiInfo.count - dbInfo.quantity,
                        message: 'Count mismatch between API and DB'
                    });
                }
            }
        }

        console.log(`\n================ DETAILED SUMMARY ================`);
        console.log(`1. Panels Not Found (In API but no matching Panel in DB): ${report.panelsNotFound.length}`);
        console.log(`2. Missing Entries (Panel exists, but DB has no IP bill for that date): ${report.missingEntries.length}`);
        console.log(`3. Count Mismatches (Both have entries, but counts differ): ${report.countMismatches.length}`);

        fs.writeFileSync('ip_billing_discrepancy_report.json', JSON.stringify(report, null, 2));
        console.log(`\nDetailed report saved to 'ip_billing_discrepancy_report.json'.`);

        console.log(`\n--- Sample of Count Mismatches ---`);
        report.countMismatches.slice(0, 5).forEach(m => {
            console.log(`Panel: ${m.panelName} | Date: ${m.date} | API Count: ${m.apiCount} | DB Quantity: ${m.dbQuantity} | Diff: ${m.difference}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkMissingData();
