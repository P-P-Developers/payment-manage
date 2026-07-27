const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ─── DB Connection ────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file');
    process.exit(1);
}

const paymentSchema = new mongoose.Schema({}, { strict: false });
const Payment = mongoose.model('Payment', paymentSchema, 'payments');

const panelSchema = new mongoose.Schema({}, { strict: false });
const Panel = mongoose.model('Panel', panelSchema, 'panels');

// ─── SmartAlgo API Config ─────────────────────────────────────────────
const ALGO_URL = 'https://newpenal.deepmindinfotech.com/backend/getall/history';

const ALGO_PAYLOAD = {
    page: 1,
    limit: 10000,
    search: '',
    startDate: '2026-04-01',
    endDate: new Date().toISOString().split('T')[0],   // today
    month: '',
    licAdd: true
};

// ─── Main ─────────────────────────────────────────────────────────────
async function checkMissingLicenses() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
        console.log('✅ Connected.');

        // ── 1. Fetch SmartAlgo API data ──────────────────────────────
        console.log(`\nFetching licenses from SmartAlgo API...`);
        const response = await axios.post(ALGO_URL, ALGO_PAYLOAD);

        if (!response.data || !response.data.data) {
            console.error('❌ API response did not contain data. Check API URL or payload.');
            process.exit(1);
        }

        const apiData = response.data.data;
        console.log(`✅ Fetched ${apiData.length} records from SmartAlgo API.`);

        // ── 2. Parse & aggregate API data ────────────────────────────
        // API record shape: { panal_name, msg, createdAt, ... }
        // Extract license qty from msg string e.g. "Added 5 licenses"
        const apiAgg = {};   // panelName(lower) -> dateStr -> { count, records[] }

        for (const item of apiData) {
            const panelName = item.panal_name
                ? item.panal_name.toLowerCase().trim()
                : 'unknown';

            const number = item.msg ? Number(item.msg.match(/\d+/)?.[0] || 0) : 0;
            if (number <= 0) continue;

            const d = new Date(item.createdAt || item.date);
            if (isNaN(d.getTime())) continue;
            const dateStr = d.toISOString().split('T')[0];

            if (!apiAgg[panelName]) apiAgg[panelName] = {};
            if (!apiAgg[panelName][dateStr]) {
                apiAgg[panelName][dateStr] = { count: 0, records: [] };
            }

            apiAgg[panelName][dateStr].count += number;
            apiAgg[panelName][dateStr].records.push({
                panelName: item.panal_name,
                msg: item.msg,
                qty: number,
                createdAt: item.createdAt
            });
        }

        console.log(`\nAPI panels with license entries: ${Object.keys(apiAgg).length}`);

        // ── 3. Fetch DB payments (License type) ─────────────────────
        console.log('Fetching License payments from local DB...');
        const dbPayments = await Payment.find({
            billAmount: { $gt: 0 },
            paymentType: 'License'
        }).lean();
        console.log(`✅ Found ${dbPayments.length} License payments in DB.`);

        // Build panel lookup maps
        const panels = await Panel.find({}).lean();
        const panelMap = {};   // name(lower) -> id
        const panelIdToName = {};   // id -> name

        for (const p of panels) {
            if (p.panelName) {
                const key = p.panelName.toLowerCase().trim();
                panelMap[key] = p._id.toString();
                panelIdToName[p._id.toString()] = p.panelName;
            }
        }

        // Aggregate DB: panelName(lower) -> dateStr -> { quantity, records[] }
        const dbAgg = {};

        for (const pay of dbPayments) {
            const panelId = pay.panelId ? pay.panelId.toString() : 'unknown';
            const panelName = (panelIdToName[panelId] || 'unknown').toLowerCase().trim();

            const d = new Date(pay.timestamp || pay.createdAt);
            if (isNaN(d.getTime())) continue;
            const dateStr = d.toISOString().split('T')[0];

            if (!dbAgg[panelName]) dbAgg[panelName] = {};
            if (!dbAgg[panelName][dateStr]) {
                dbAgg[panelName][dateStr] = { quantity: 0, dbRecords: [] };
            }

            dbAgg[panelName][dateStr].quantity += (pay.quantity || 0);
            dbAgg[panelName][dateStr].dbRecords.push(pay);
        }

        // ── 4. Compare & build report ────────────────────────────────
        const report = {
            generatedAt: new Date().toISOString(),
            missingEntries: [],
            countMismatches: [],
            panelSummaries: [] // To show total API vs DB for each panel
        };

        for (const [panelName, datesMap] of Object.entries(apiAgg)) {
            const panelId = panelMap[panelName];

            // Ignore panels from API that are not registered in our local DB
            if (!panelId) {
                continue;
            }

            let totalApiForPanel = 0;
            let totalDbForPanel = 0;

            for (const [dateStr, apiInfo] of Object.entries(datesMap)) {
                const dbInfo = dbAgg[panelName] && dbAgg[panelName][dateStr];

                totalApiForPanel += apiInfo.count;

                if (!dbInfo) {
                    // Missing entirely
                    report.missingEntries.push({
                        panelName: panelIdToName[panelId],
                        date: dateStr,
                        apiCount: apiInfo.count,
                        message: 'API has license entry for this date but DB has none'
                    });
                } else {
                    totalDbForPanel += dbInfo.quantity;

                    if (dbInfo.quantity !== apiInfo.count) {
                        // Exists but count is different
                        report.countMismatches.push({
                            panelName: panelIdToName[panelId],
                            date: dateStr,
                            apiCount: apiInfo.count,
                            dbQuantity: dbInfo.quantity,
                            difference: apiInfo.count - dbInfo.quantity,
                            message: 'License count mismatch between API and DB'
                        });
                    }
                }
            }

            // Add any DB entries for this panel that are NOT in API to the total DB count
            if (dbAgg[panelName]) {
                for (const [dateStr, dbInfo] of Object.entries(dbAgg[panelName])) {
                    if (!datesMap[dateStr]) {
                        totalDbForPanel += dbInfo.quantity;
                    }
                }
            }

            if (totalApiForPanel !== totalDbForPanel) {
                report.panelSummaries.push({
                    panelName: panelIdToName[panelId],
                    totalApi: totalApiForPanel,
                    totalDb: totalDbForPanel,
                    difference: totalApiForPanel - totalDbForPanel
                });
            }
        }

        // ── 5. Print summary ─────────────────────────────────────────
        console.log(`\n================ LICENSE DISCREPANCY REPORT ================`);
        console.log(`1. Missing Entries  (panel exists in DB, but no License bill for date): ${report.missingEntries.length}`);
        console.log(`2. Count Mismatches (both have entries for date, but quantities differ): ${report.countMismatches.length}`);
        console.log(`3. Panels with Overall Total Differences: ${report.panelSummaries.length}`);

        if (report.panelSummaries.length > 0) {
            console.log('\n--- Overall Total Differences Per Panel ---');
            report.panelSummaries.forEach(p =>
                console.log(`  Panel: "${p.panelName}" | API Total: ${p.totalApi} | DB Total: ${p.totalDb} | Diff: ${p.difference > 0 ? '+' : ''}${p.difference}`)
            );
        }

        if (report.missingEntries.length > 0) {
            console.log('\n--- Missing Entries (first 10) ---');
            report.missingEntries.slice(0, 10).forEach(m =>
                console.log(`  Panel: ${m.panelName} | Date: ${m.date} | API Qty: ${m.apiCount}`)
            );
        }

        if (report.countMismatches.length > 0) {
            console.log('\n--- Count Mismatches (first 10) ---');
            report.countMismatches.slice(0, 10).forEach(m =>
                console.log(`  Panel: ${m.panelName} | Date: ${m.date} | API: ${m.apiCount} | DB: ${m.dbQuantity} | Diff: ${m.difference}`)
            );
        }

        // ── 6. Save report ───────────────────────────────────────────
        const reportPath = path.resolve(__dirname, 'license_discrepancy_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n✅ Full report saved to: ${reportPath}`);
        console.log('Run fixLicenseBills.js to apply fixes.\n');

    } catch (err) {
        console.error('❌ Error:', err.message || err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

checkMissingLicenses();
