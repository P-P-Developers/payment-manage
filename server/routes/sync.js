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

// Helper: Format Date to IST exact hour string for grouping
function formatIST(d) {
    if (isNaN(d.getTime())) return null;
    const offsetMs = 5.5 * 60 * 60 * 1000;
    const ist = new Date(d.getTime() + offsetMs);
    return ist.toISOString().replace('T', ' ').substring(0, 13) + ':00';
}

// ==========================================
// 1. Helper Function: Check IP Discrepancies
// ==========================================
async function getIpReport(targetDate = null) {
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

    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const todayStr = nowIST.toISOString().split('T')[0];

    const apiAgg = {};
    for (const item of apiData) {
        const panelName = item.panel_name ? item.panel_name.toLowerCase().trim() : 'unknown';
        const dateToUse = item.type === 'ALLOT' ? item.date : item.new_start_date;
        const d = new Date(dateToUse);
        if (isNaN(d.getTime())) continue;
        const dateStr = formatIST(d);
        if (dateStr.substring(0, 10) >= todayStr) continue;
        if (targetDate && !dateStr.startsWith(targetDate)) continue;

        if (!apiAgg[panelName]) apiAgg[panelName] = {};
        if (!apiAgg[panelName][dateStr]) apiAgg[panelName][dateStr] = { count: 0, originalDate: dateToUse, types: new Set() };
        apiAgg[panelName][dateStr].count += (item.count || 0);
        if (item.type) apiAgg[panelName][dateStr].types.add(item.type);
    }

    const dbAgg = {};
    for (const p of dbPayments) {
        const panelId = p.panelId ? p.panelId.toString() : 'unknown';
        const panelName = panelIdToName[panelId] ? panelIdToName[panelId].toLowerCase().trim() : 'unknown';
        const d = new Date(p.timestamp || p.createdAt || p.date);
        if (isNaN(d.getTime())) continue;
        const dateStr = formatIST(d);
        if (dateStr.substring(0, 10) >= todayStr) continue;
        if (targetDate && !dateStr.startsWith(targetDate)) continue;

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
                    originalDate: apiInfo.originalDate,
                    apiCount: apiInfo.count,
                    types: Array.from(apiInfo.types).join(', '),
                    message: 'API has entry for this date but DB has none'
                });
            } else {
                totalDbForPanel += dbInfo.quantity;
                if (dbInfo.quantity !== apiInfo.count) {
                    report.countMismatches.push({
                        panelName: panelIdToName[panelId],
                        date: dateStr,
                        originalDate: apiInfo.originalDate,
                        apiCount: apiInfo.count,
                        dbQuantity: dbInfo.quantity,
                        difference: apiInfo.count - dbInfo.quantity,
                        types: Array.from(apiInfo.types).join(', '),
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
async function getLicenseReport(targetDate = null) {
    const ALGO_URL = 'https://newpenal.deepmindinfotech.com/backend/getall/history';
    const ALGO_PAYLOAD = {
        page: 1, limit: 10000, search: '',
        startDate: '2026-04-01',
        endDate: new Date().toISOString().split('T')[0],
        month: '', licAdd: true
    };

    const response = await axios.post(ALGO_URL, ALGO_PAYLOAD);
    const apiData = response.data.data || [];

    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const todayStr = nowIST.toISOString().split('T')[0];

    const apiAgg = {};
    for (const item of apiData) {
        const panelName = item.panal_name ? item.panal_name.toLowerCase().trim() : 'unknown';
        const number = item.msg ? Number(item.msg.match(/\d+/)?.[0] || 0) : 0;
        if (number <= 0) continue;

        const d = new Date(item.createdAt);
        if (isNaN(d.getTime())) continue;
        const dateStr = formatIST(d);
        if (dateStr.substring(0, 10) >= todayStr) continue;
        if (targetDate && !dateStr.startsWith(targetDate)) continue;

        if (!apiAgg[panelName]) apiAgg[panelName] = {};
        if (!apiAgg[panelName][dateStr]) apiAgg[panelName][dateStr] = { count: 0, originalDate: item.createdAt };
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
        const dateStr = formatIST(d);
        if (dateStr.substring(0, 10) >= todayStr) continue;
        if (targetDate && !dateStr.startsWith(targetDate)) continue;

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
                    originalDate: apiInfo.originalDate,
                    apiCount: apiInfo.count,
                    message: 'API has license entry for this date but DB has none'
                });
            } else {
                totalDbForPanel += dbInfo.quantity;
                if (dbInfo.quantity !== apiInfo.count) {
                    report.countMismatches.push({
                        panelName: panelIdToName[panelId],
                        date: dateStr,
                        originalDate: apiInfo.originalDate,
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
        const targetDate = req.query.date || null;
        const report = await getIpReport(targetDate);
        res.status(200).json({ success: true, data: report });
    } catch (error) {

        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/sync/fix-ip
// @desc    Fix IP billing discrepancies
// @access  Admin
router.post('/fix-ip', protect, adminOnly, async (req, res) => {
    try {
        const targetDate = req.query.date || req.body.date || null;
        const { specificPanelName, specificDate } = req.body || {};
        const report = await getIpReport(targetDate);
        let fixedMissing = 0;
        let fixedMismatch = 0;

        for (const entry of report.missingEntries) {
            if (specificPanelName && entry.panelName !== specificPanelName) continue;
            if (specificDate && entry.date !== specificDate) continue;
            const panel = await Panel.findOne({ panelName: new RegExp(`^${escapeRegex(entry.panelName)}$`, 'i') });
            if (!panel) continue;

            const quantity = entry.apiCount;
            const unitPrice = panel.ipCharges || 1;
            const billAmount = quantity * unitPrice;
            const dateObj = new Date(entry.originalDate);

            await Payment.create({
                panelId: panel._id,
                paymentType: 'IP Charges',
                amountReceived: 0, paymentMode: 'UPI', bankName: '',
                quantity, unitPrice, billAmount, billDiscount: 0, paymentDiscount: 0,
                remark: `Auto-fixed: Synced ${quantity} missing IPs from iphub. Type: ${entry.types || 'Unknown'}`,
                addedBy: req.user._id, timestamp: dateObj
            });
            fixedMissing++;
        }

        for (const mismatch of report.countMismatches) {
            if (specificPanelName && mismatch.panelName !== specificPanelName) continue;
            if (specificDate && mismatch.date !== specificDate) continue;
            const panel = await Panel.findOne({ panelName: new RegExp(`^${escapeRegex(mismatch.panelName)}$`, 'i') });
            if (!panel) continue;

            const diff = mismatch.difference;
            const dateStr = mismatch.date;
            const unitPrice = panel.ipCharges || 1;
            const exactTime = new Date(mismatch.originalDate);
            const startOfRange = new Date(exactTime.getTime()); startOfRange.setMinutes(0, 0, 0);
            const endOfRange = new Date(exactTime.getTime()); endOfRange.setMinutes(59, 59, 999);

            if (diff > 0) {
                const billAmount = diff * unitPrice;
                await Payment.create({
                    panelId: panel._id, paymentType: 'IP Charges',
                    amountReceived: 0, paymentMode: 'UPI', bankName: '',
                    quantity: diff, unitPrice, billAmount, billDiscount: 0, paymentDiscount: 0,
                    remark: `Auto-fixed: Added ${diff} extra IPs to match API count. Type: ${mismatch.types || 'Unknown'}`,
                    addedBy: req.user._id, timestamp: exactTime
                });
                fixedMismatch++;
            } else if (diff < 0) {
                const excess = Math.abs(diff);
                const payments = await Payment.find({
                    panelId: panel._id, paymentType: 'IP Charges',
                    $or: [
                        { timestamp: { $gte: startOfRange, $lte: endOfRange } },
                        { timestamp: null, createdAt: { $gte: startOfRange, $lte: endOfRange } },
                        { timestamp: { $exists: false }, createdAt: { $gte: startOfRange, $lte: endOfRange } }
                    ]
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

        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/sync/check-license
// @desc    Check License billing discrepancies
// @access  Admin
router.get('/check-license', protect, adminOnly, async (req, res) => {
    try {
        const targetDate = req.query.date || null;
        const report = await getLicenseReport(targetDate);
        res.status(200).json({ success: true, data: report });
    } catch (error) {

        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/sync/fix-license
// @desc    Fix License billing discrepancies
// @access  Admin
router.post('/fix-license', protect, adminOnly, async (req, res) => {
    try {
        const targetDate = req.query.date || req.body.date || null;
        const { specificPanelName, specificDate } = req.body || {};
        const report = await getLicenseReport(targetDate);
        let fixedMissing = 0;
        let fixedMismatch = 0;

        for (const entry of report.missingEntries) {
            if (specificPanelName && entry.panelName !== specificPanelName) continue;
            if (specificDate && entry.date !== specificDate) continue;
            const panel = await Panel.findOne({ panelName: new RegExp(`^${escapeRegex(entry.panelName)}$`, 'i') });
            if (!panel) continue;

            const quantity = entry.apiCount;
            const unitPrice = panel.licenseCharges || 1000;
            const billAmount = quantity * unitPrice;
            const dateObj = new Date(entry.originalDate);

            await Payment.create({
                panelId: panel._id, paymentType: 'License',
                amountReceived: 0, paymentMode: 'UPI', bankName: '',
                quantity, unitPrice, billAmount, billDiscount: 0, paymentDiscount: 0,
                isGstApplied: panel.takeSopDiscount || false, remark: `Auto-fixed: Added ${quantity} missing licenses from SmartAlgo (${entry.date})`,
                addedBy: req.user._id, timestamp: dateObj
            });
            await Log.create({
                userId: req.user._id, actionType: 'ADD', module: 'Payment',
                details: `Auto-fixed: Created license bill of ₹${billAmount} for panel "${panel.panelName}" — ${quantity} licenses on ${entry.date}`
            });
            fixedMissing++;
        }

        for (const mismatch of report.countMismatches) {
            if (specificPanelName && mismatch.panelName !== specificPanelName) continue;
            if (specificDate && mismatch.date !== specificDate) continue;
            const panel = await Panel.findOne({ panelName: new RegExp(`^${escapeRegex(mismatch.panelName)}$`, 'i') });
            if (!panel) continue;

            const diff = mismatch.difference;
            const dateStr = mismatch.date;
            const unitPrice = panel.licenseCharges || 1000;
            const exactTime = new Date(mismatch.originalDate);
            const startOfRange = new Date(exactTime.getTime()); startOfRange.setMinutes(0, 0, 0);
            const endOfRange = new Date(exactTime.getTime()); endOfRange.setMinutes(59, 59, 999);

            if (diff > 0) {
                const billAmount = diff * unitPrice;
                await Payment.create({
                    panelId: panel._id, paymentType: 'License',
                    amountReceived: 0, paymentMode: 'UPI', bankName: '',
                    quantity: diff, unitPrice, billAmount, billDiscount: 0, paymentDiscount: 0,
                    isGstApplied: panel.takeSopDiscount || false, remark: `Auto-fixed: Added ${diff} extra licenses to match API count (${dateStr})`,
                    addedBy: req.user._id, timestamp: exactTime
                });
                await Log.create({
                    userId: req.user._id, actionType: 'ADD', module: 'Payment',
                    details: `Auto-fixed: Added ${diff} extra license qty for "${panel.panelName}" on ${dateStr} (mismatch correction)`
                });
                fixedMismatch++;
            } else if (diff < 0) {
                const excess = Math.abs(diff);
                const payments = await Payment.find({
                    panelId: panel._id, paymentType: 'License',
                    $or: [
                        { timestamp: { $gte: startOfRange, $lte: endOfRange } },
                        { timestamp: null, createdAt: { $gte: startOfRange, $lte: endOfRange } },
                        { timestamp: { $exists: false }, createdAt: { $gte: startOfRange, $lte: endOfRange } }
                    ]
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

        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ==========================================
// Helper Function: Check SOP Discrepancies
// ==========================================
async function getSopReport(targetDate = null) {
    try {
        console.log(`[getSopReport] Starting SOP report sync for targetDate: ${targetDate || 'all'}`);
        const apiResponse = await axios.post('https://soptools.tradestreet.in/superbackend/AmmountDetailsFilter', {
            month: null, year: null, Status: 'All'
        }, { headers: { 'Content-Type': 'application/json' } });

    let sopApiData = apiResponse.data?.AmmountDetails;
    if (!sopApiData) sopApiData = apiResponse.data;
    let sopArray = Array.isArray(sopApiData) ? sopApiData : (sopApiData?.data || []);

    const cutoffDate = new Date('2026-03-31T18:30:00.000Z'); // 1 April 2026 00:00:00 IST
    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const todayStr = nowIST.toISOString().split('T')[0];

    sopArray = sopArray.filter(item => {
        const dateStr = item["Payment Date"];
        if (!dateStr) return false;

        const parts = dateStr.split(' ');
        if (parts.length === 2) {
            const dParts = parts[0].split('/');
            if (dParts.length === 3) {
                if (targetDate) {
                    const tParts = targetDate.split('-');
                    if (dParts[0] !== tParts[2] || dParts[1] !== tParts[1] || dParts[2] !== tParts[0]) {
                        return false;
                    }
                }
                // Parse as IST (+05:30)
                const itemDate = new Date(`${dParts[2]}-${dParts[1]}-${dParts[0]}T${parts[1]}+05:30`);
                if (itemDate >= new Date(`${todayStr}T00:00:00+05:30`)) return false;
                return itemDate >= cutoffDate;
            }
        }
        return false;
    });

    const panels = await Panel.find({ category: { $regex: new RegExp('^sop$', 'i') } }).lean();

    const panelIds = panels.map(p => p._id);
    const payments = await Payment.find({
        panelId: { $in: panelIds },
        paymentType: 'License'
    }).lean();

    const matchedData = [];
    const matchedPanelIds = new Set();
    let newMissingCount = 0;

    sopArray.forEach(sopItem => {
        const url = (sopItem.Url || "").toLowerCase();
        const matchedPanel = panels.find(p => p.panelName && url.includes(p.panelName.toLowerCase()));


        if (matchedPanel) {
            matchedPanelIds.add(matchedPanel._id.toString());

            const panelPayments = payments.filter(pay => pay.panelId.toString() === matchedPanel._id.toString());
            const sopAmount = parseFloat(sopItem.AmountDetails) || 0;

            if (panelPayments.length === 0) {
                newMissingCount++;
                matchedData.push({
                    sopItem,
                    localPanel: matchedPanel,
                    status: 'Missing in DB'
                });
            } else {
                const isExisting = panelPayments.some(pay => {
                    const bAmt = parseFloat(pay.billAmount) || 0;
                    const uPrice = parseFloat(pay.unitPrice) || 0;
                    const amtWithGst = parseFloat((sopAmount + (sopAmount * 0.18)).toFixed(2));

                    const amtMatches = bAmt === sopAmount || bAmt === amtWithGst;

                    let dateMatches = false;
                    const dateStr = sopItem["Payment Date"];
                    if (dateStr) {
                        const parts = dateStr.split(' ');
                        if (parts.length >= 1) {
                            const dParts = parts[0].split('/');
                            if (dParts.length === 3) {
                                const sopDateStr = `${dParts[2]}-${dParts[1]}-${dParts[0]}`; // YYYY-MM-DD
                                const payDateObj = new Date(pay.timestamp || pay.createdAt || pay.date);
                                if (!isNaN(payDateObj.getTime())) {
                                    // Convert to IST to compare the date part correctly
                                    const offsetMs = 5.5 * 60 * 60 * 1000;
                                    const istDateObj = new Date(payDateObj.getTime() + offsetMs);
                                    const payDateStr = istDateObj.toISOString().split('T')[0];

                                    if (payDateStr === sopDateStr) {
                                        dateMatches = true;
                                    }
                                }
                            }
                        }
                    } else {
                        dateMatches = true; // Fallback if no date in sopItem
                    }

                    return amtMatches && dateMatches;
                });

                if (!isExisting) {
                    newMissingCount++;
                    matchedData.push({
                        sopItem,
                        localPanel: matchedPanel,
                        status: 'Mismatch Amount'
                    });
                }
                // If isExisting is true, it is perfectly matched, so we don't add it to matchedData
            }
        }
    });

    const unmatchedDbPanels = panels.filter(p => !matchedPanelIds.has(p._id.toString()));

    return {
        total: sopArray.length,
        matchedData,
        unmatchedDbPanels,
        newMissingCount
    };
    } catch (error) {
        console.error("[getSopReport] Error fetching SOP report:", error.response?.data || error.message || error);
        throw error;
    }
}

// @route   GET /api/sync/check-sop
router.get('/check-sop', protect, adminOnly, async (req, res) => {
    try {
        const targetDate = req.query.date || null;
        const report = await getSopReport(targetDate);
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
});

// @route   POST /api/sync/fix-sop
router.post('/fix-sop', protect, adminOnly, async (req, res) => {
    try {
        const targetDate = req.query.date || req.body.date || null;
        const { specificPanelId, specificDate, specificAmount } = req.body || {};

        const report = await getSopReport(targetDate);
        let fixedMissing = 0;

        for (const match of report.matchedData) {
            if (match.status === 'Missing in DB' || match.status === 'Mismatch Amount') {
                if (specificPanelId && match.localPanel._id.toString() !== specificPanelId) continue;
                if (specificDate && match.sopItem["Payment Date"] !== specificDate) continue;
                if (specificAmount && match.sopItem.AmountDetails !== specificAmount) continue;

                const amount = parseFloat(match.sopItem.AmountDetails) || 0;
                let finalBillAmount = amount;

                let gstAmount = 0;

                if (match.localPanel.takeSopDiscount) {
                    gstAmount = amount * 0.18;
                    finalBillAmount = amount + gstAmount;
                }

                const unitPrice = match.localPanel.licenseCharges || amount;
                const quantity = unitPrice > 0 ? Number((amount / unitPrice).toFixed(2)) : 1;

                // Parse "DD/MM/YYYY HH:mm:ss"
                let timestamp = new Date();
                const dateStr = match.sopItem["Payment Date"];
                if (dateStr) {
                    const parts = dateStr.split(' ');
                    if (parts.length === 2) {
                        const dParts = parts[0].split('/');
                        if (dParts.length === 3) {
                            // Save as correct UTC time by parsing it as IST (+05:30)
                            timestamp = new Date(`${dParts[2]}-${dParts[1]}-${dParts[0]}T${parts[1]}+05:30`);
                        }
                    }
                }

                await Payment.create({
                    panelId: match.localPanel._id,
                    paymentType: 'License',
                    amountReceived: 0,
                    paymentMode: 'UPI',
                    bankName: '',
                    quantity: quantity,
                    unitPrice: unitPrice,
                    billAmount: finalBillAmount,
                    billDiscount: 0,
                    paymentDiscount: 0,
                    remark: `Auto-fixed: SOP Sync (${quantity} licenses). ${match.localPanel.takeSopDiscount ? `Amount: ₹${amount} + GST: ₹${gstAmount}` : ''}`.trim(),
                    addedBy: req.user._id,
                    timestamp,
                    isGstApplied: match.localPanel.takeSopDiscount || false
                });

                await Log.create({
                    userId: req.user._id, actionType: 'ADD', module: 'Payment',
                    details: `Auto-fixed: Created SOP license bill of ₹${amount} for panel "${match.localPanel.panelName}"`
                });

                fixedMissing++;
            }
        }

        res.status(200).json({ success: true, fixedMissing, message: `SOP fixes applied. Added ${fixedMissing} payments.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
});

module.exports = router;

