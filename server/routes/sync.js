const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../models/Payment');
const Panel = require('../models/Panel');
const User = require('../models/User');
const Log = require('../models/Log');
const { protect, adminOnly } = require('../middleware/auth');

// Helper: Escape regex
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==========================================
// 1. Helper Function: Check IP Discrepancies
// ==========================================
async function getIpReport() {
    const apiResponse = await axios.get('https://iphub.deepmindinfotech.com/backend/admin/ip/billing-summary?limit=2000');
    const apiData = apiResponse.data.data;

    const dbPayments = await Payment.find({
        billAmount: { $gt: 0 },
        paymentType: "IP Charges"
    }).lean();

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

    const apiAgg = {};
    for (const item of apiData) {
        const panelName = item.panel_name ? item.panel_name.toLowerCase().trim() : 'unknown';
        const d = new Date(item.createdAt || item.date);
        const dateStr = d.toISOString().split('T')[0];

        if (!apiAgg[panelName]) apiAgg[panelName] = {};
        if (!apiAgg[panelName][dateStr]) apiAgg[panelName][dateStr] = { count: 0 };
        apiAgg[panelName][dateStr].count += (item.count || 0);
    }

    const dbAgg = {};
    for (const p of dbPayments) {
        const panelId = p.panelId ? p.panelId.toString() : 'unknown';
        const panelName = panelIdToName[panelId] ? panelIdToName[panelId].toLowerCase().trim() : 'unknown';
        const d = new Date(p.timestamp || p.createdAt || p.date);
        if (isNaN(d.getTime())) continue;
        const dateStr = d.toISOString().split('T')[0];

        if (!dbAgg[panelName]) dbAgg[panelName] = {};
        if (!dbAgg[panelName][dateStr]) dbAgg[panelName][dateStr] = { quantity: 0 };
        dbAgg[panelName][dateStr].quantity += (p.quantity || 0);
    }

    const report = {
        generatedAt: new Date().toISOString(),
        missingEntries: [],
        countMismatches: [],
        panelSummaries: []
    };

    for (const [panelName, datesMap] of Object.entries(apiAgg)) {
        const panelId = panelMap[panelName];
        if (!panelId) continue; // Ignore non-DB panels

        let totalApiForPanel = 0;
        let totalDbForPanel = 0;

        for (const [dateStr, apiInfo] of Object.entries(datesMap)) {
            const dbInfo = dbAgg[panelName] && dbAgg[panelName][dateStr];
            totalApiForPanel += apiInfo.count;

            if (!dbInfo) {
                report.missingEntries.push({
                    panelName: panelIdToName[panelId],
                    date: dateStr,
                    apiCount: apiInfo.count,
                    message: 'API has entry for this date but DB has none'
                });
            } else {
                totalDbForPanel += dbInfo.quantity;
                if (dbInfo.quantity !== apiInfo.count) {
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

        // Add DB entries not in API
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
    return report;
}

// ===============================================
// 2. Helper Function: Check License Discrepancies
// ===============================================
async function getLicenseReport() {
    const ALGO_URL = 'https://newpenal.deepmindinfotech.com/backend/getall/history';
    const ALGO_PAYLOAD = {
        page: 1, limit: 10000, search: '',
        startDate: '2020-05-25',
        endDate: new Date().toISOString().split('T')[0],
        month: '', licAdd: true
    };

    const response = await axios.post(ALGO_URL, ALGO_PAYLOAD);
    const apiData = response.data.data || [];

    const apiAgg = {};
    for (const item of apiData) {
        const panelName = item.panal_name ? item.panal_name.toLowerCase().trim() : 'unknown';
        const number = item.msg ? Number(item.msg.match(/\d+/)?.[0] || 0) : 0;
        if (number <= 0) continue;

        const d = new Date(item.createdAt || item.date);
        if (isNaN(d.getTime())) continue;
        const dateStr = d.toISOString().split('T')[0];

        if (!apiAgg[panelName]) apiAgg[panelName] = {};
        if (!apiAgg[panelName][dateStr]) apiAgg[panelName][dateStr] = { count: 0 };
        apiAgg[panelName][dateStr].count += number;
    }

    const dbPayments = await Payment.find({
        billAmount: { $gt: 0 },
        paymentType: 'License'
    }).lean();

    const panels = await Panel.find({}).lean();
    const panelMap = {}; 
    const panelIdToName = {}; 
    for (const p of panels) {
        if (p.panelName) {
            const key = p.panelName.toLowerCase().trim();
            panelMap[key] = p._id.toString();
            panelIdToName[p._id.toString()] = p.panelName;
        }
    }

    const dbAgg = {};
    for (const pay of dbPayments) {
        const panelId = pay.panelId ? pay.panelId.toString() : 'unknown';
        const panelName = (panelIdToName[panelId] || 'unknown').toLowerCase().trim();
        const d = new Date(pay.timestamp || pay.createdAt);
        if (isNaN(d.getTime())) continue;
        const dateStr = d.toISOString().split('T')[0];

        if (!dbAgg[panelName]) dbAgg[panelName] = {};
        if (!dbAgg[panelName][dateStr]) dbAgg[panelName][dateStr] = { quantity: 0 };
        dbAgg[panelName][dateStr].quantity += (pay.quantity || 0);
    }

    const report = {
        generatedAt: new Date().toISOString(),
        missingEntries: [],
        countMismatches: [],
        panelSummaries: []
    };

    for (const [panelName, datesMap] of Object.entries(apiAgg)) {
        const panelId = panelMap[panelName];
        if (!panelId) continue;

        let totalApiForPanel = 0;
        let totalDbForPanel = 0;

        for (const [dateStr, apiInfo] of Object.entries(datesMap)) {
            const dbInfo = dbAgg[panelName] && dbAgg[panelName][dateStr];
            totalApiForPanel += apiInfo.count;

            if (!dbInfo) {
                report.missingEntries.push({
                    panelName: panelIdToName[panelId],
                    date: dateStr,
                    apiCount: apiInfo.count,
                    message: 'API has license entry for this date but DB has none'
                });
            } else {
                totalDbForPanel += dbInfo.quantity;
                if (dbInfo.quantity !== apiInfo.count) {
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

        if (dbAgg[panelName]) {
            for (const [dateStr, dbInfo] of Object.entries(dbAgg[panelName])) {
                if (!datesMap[dateStr]) totalDbForPanel += dbInfo.quantity;
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
    return report;
}


// ==========================================
// API Endpoints
// ==========================================

// @route   GET /api/sync/check-ip
// @desc    Check IP billing discrepancies
// @access  Admin
router.get('/check-ip', protect, adminOnly, async (req, res) => {
    try {
        const report = await getIpReport();
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        console.error('Check IP error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/sync/fix-ip
// @desc    Fix IP billing discrepancies
// @access  Admin
router.post('/fix-ip', protect, adminOnly, async (req, res) => {
    try {
        const report = await getIpReport();
        let fixedMissing = 0;
        let fixedMismatch = 0;

        for (const entry of report.missingEntries) {
            const panel = await Panel.findOne({ panelName: new RegExp(`^${escapeRegex(entry.panelName)}$`, 'i') });
            if (!panel) continue;

            const quantity = entry.apiCount;
            const unitPrice = panel.ipCharges || 1;
            const billAmount = quantity * unitPrice;
            const dateObj = new Date(entry.date + 'T12:00:00Z');

            await Payment.create({
                panelId: panel._id,
                paymentType: 'IP Charges',
                amountReceived: 0, paymentMode: 'UPI', bankName: '',
                quantity, unitPrice, billAmount, billDiscount: 0, paymentDiscount: 0,
                remark: `Auto-fixed: Synced ${quantity} missing IPs from iphub`,
                addedBy: req.user._id, timestamp: dateObj
            });
            fixedMissing++;
        }

        for (const mismatch of report.countMismatches) {
            const panel = await Panel.findOne({ panelName: new RegExp(`^${escapeRegex(mismatch.panelName)}$`, 'i') });
            if (!panel) continue;

            const diff = mismatch.difference;
            const dateStr = mismatch.date;
            const unitPrice = panel.ipCharges || 1;
            const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
            const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

            if (diff > 0) {
                const billAmount = diff * unitPrice;
                await Payment.create({
                    panelId: panel._id, paymentType: 'IP Charges',
                    amountReceived: 0, paymentMode: 'UPI', bankName: '',
                    quantity: diff, unitPrice, billAmount, billDiscount: 0, paymentDiscount: 0,
                    remark: `Auto-fixed: Added ${diff} extra IPs to match API count`,
                    addedBy: req.user._id, timestamp: new Date(dateStr + 'T12:00:00Z')
                });
                fixedMismatch++;
            } else if (diff < 0) {
                const excess = Math.abs(diff);
                const payments = await Payment.find({
                    panelId: panel._id, paymentType: 'IP Charges', timestamp: { $gte: startOfDay, $lte: endOfDay }
                }).sort({ createdAt: -1 });

                let remaining = excess;
                for (let p of payments) {
                    if (remaining <= 0) break;
                    if (p.quantity > remaining) {
                        const newQty = p.quantity - remaining;
                        await Payment.updateOne({ _id: p._id }, {
                            $set: { quantity: newQty, billAmount: newQty * unitPrice, remark: (p.remark || '') + ` | Auto-fixed: reduced by ${remaining}` }
                        });
                        remaining = 0;
                    } else {
                        await Payment.deleteOne({ _id: p._id });
                        remaining -= p.quantity;
                    }
                }
                fixedMismatch++;
            }
        }
        res.status(200).json({ success: true, fixedMissing, fixedMismatch, message: 'IP fixes applied successfully' });
    } catch (error) {
        console.error('Fix IP error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/sync/check-license
// @desc    Check License billing discrepancies
// @access  Admin
router.get('/check-license', protect, adminOnly, async (req, res) => {
    try {
        const report = await getLicenseReport();
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        console.error('Check License error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/sync/fix-license
// @desc    Fix License billing discrepancies
// @access  Admin
router.post('/fix-license', protect, adminOnly, async (req, res) => {
    try {
        const report = await getLicenseReport();
        let fixedMissing = 0;
        let fixedMismatch = 0;

        for (const entry of report.missingEntries) {
            const panel = await Panel.findOne({ panelName: new RegExp(`^${escapeRegex(entry.panelName)}$`, 'i') });
            if (!panel) continue;

            const quantity = entry.apiCount;
            const unitPrice = panel.licenseCharges || 1000;
            const billAmount = quantity * unitPrice;
            const dateObj = new Date(entry.date + 'T12:00:00Z');

            await Payment.create({
                panelId: panel._id, paymentType: 'License',
                amountReceived: 0, paymentMode: 'UPI', bankName: '',
                quantity, unitPrice, billAmount, billDiscount: 0, paymentDiscount: 0,
                remark: `Auto-fixed: Added ${quantity} missing licenses from SmartAlgo (${entry.date})`,
                addedBy: req.user._id, timestamp: dateObj
            });
            await Log.create({
                userId: req.user._id, actionType: 'ADD', module: 'Payment',
                details: `Auto-fixed: Created license bill of ₹${billAmount} for panel "${panel.panelName}" — ${quantity} licenses on ${entry.date}`
            });
            fixedMissing++;
        }

        for (const mismatch of report.countMismatches) {
            const panel = await Panel.findOne({ panelName: new RegExp(`^${escapeRegex(mismatch.panelName)}$`, 'i') });
            if (!panel) continue;

            const diff = mismatch.difference;
            const dateStr = mismatch.date;
            const unitPrice = panel.licenseCharges || 1000;
            const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
            const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

            if (diff > 0) {
                const billAmount = diff * unitPrice;
                await Payment.create({
                    panelId: panel._id, paymentType: 'License',
                    amountReceived: 0, paymentMode: 'UPI', bankName: '',
                    quantity: diff, unitPrice, billAmount, billDiscount: 0, paymentDiscount: 0,
                    remark: `Auto-fixed: Added ${diff} extra licenses to match API count (${dateStr})`,
                    addedBy: req.user._id, timestamp: new Date(dateStr + 'T12:00:00Z')
                });
                await Log.create({
                    userId: req.user._id, actionType: 'ADD', module: 'Payment',
                    details: `Auto-fixed: Added ${diff} extra license qty for "${panel.panelName}" on ${dateStr} (mismatch correction)`
                });
                fixedMismatch++;
            } else if (diff < 0) {
                const excess = Math.abs(diff);
                const payments = await Payment.find({
                    panelId: panel._id, paymentType: 'License', timestamp: { $gte: startOfDay, $lte: endOfDay }
                }).sort({ createdAt: -1 });

                let remaining = excess;
                for (const pay of payments) {
                    if (remaining <= 0) break;
                    if (pay.quantity > remaining) {
                        const newQty = pay.quantity - remaining;
                        await Payment.updateOne({ _id: pay._id }, {
                            $set: { quantity: newQty, billAmount: newQty * unitPrice, remark: (pay.remark || '') + ` | Auto-fixed: reduced by ${remaining}` }
                        });
                        remaining = 0;
                    } else {
                        await Payment.deleteOne({ _id: pay._id });
                        remaining -= pay.quantity;
                    }
                }
                fixedMismatch++;
            }
        }
        res.status(200).json({ success: true, fixedMissing, fixedMismatch, message: 'License fixes applied successfully' });
    } catch (error) {
        console.error('Fix License error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
