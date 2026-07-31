const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const Panel = require('./models/Panel');
const Payment = require('./models/Payment');

async function test() {
    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
    const res = await axios.post('https://soptools.tradestreet.in/superbackend/AmmountDetailsFilter', {
        adminId: '66e1336a9926859dd6cda5b4'
    });
    
    let sopApiData = res.data;
    let sopArray = Array.isArray(sopApiData) ? sopApiData : (sopApiData?.data || sopApiData?.AmmountDetails || []);
    console.log('Total items from API:', sopArray.length);
    
    const cutoffDate = new Date('2026-03-31T18:30:00.000Z');
    sopArray = sopArray.filter(item => {
        const dateStr = item["Payment Date"];
        if (!dateStr) return false;

        const parts = dateStr.split(' ');
        if (parts.length === 2) {
            const dParts = parts[0].split('/');
            if (dParts.length === 3) {
                const itemDate = new Date(`${dParts[2]}-${dParts[1]}-${dParts[0]}T${parts[1]}+05:30`);
                return itemDate >= cutoffDate;
            }
        }
        return false;
    });
    console.log('Items after cutoff filter:', sopArray.length);
    
    if (sopArray.length > 0) {
        console.log('Sample item after cutoff:', sopArray.find(s => s.Companyname.includes('Quantit')));
    }
    
    // Now let's test matching
    const panels = await Panel.find({ category: { $regex: new RegExp('^sop$', 'i') } }).lean();
    const panelIds = panels.map(p => p._id);
    const payments = await Payment.find({
        panelId: { $in: panelIds },
        paymentType: 'License'
    }).lean();
    
    let missingInDB = [];
    
    for (const sopItem of sopArray) {
        const url = (sopItem.Url || "").toLowerCase();
        const matchedPanel = panels.find(p => p.panelName && url.includes(p.panelName.toLowerCase()));

        if (matchedPanel) {
            const panelPayments = payments.filter(pay => pay.panelId.toString() === matchedPanel._id.toString());
            const sopAmount = parseFloat(sopItem.AmountDetails) || 0;

            if (panelPayments.length === 0) {
                missingInDB.push(sopItem);
            } else {
                const isExisting = panelPayments.some(pay => {
                    const bAmt = parseFloat(pay.billAmount) || 0;
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
                        dateMatches = true;
                    }

                    return amtMatches && dateMatches;
                });

                if (!isExisting) {
                    missingInDB.push(sopItem);
                }
            }
        }
    }
    
    console.log('Missing in DB count:', missingInDB.length);
    if (missingInDB.length > 0) {
        console.log('Missing items:', missingInDB.map(i => i.Companyname));
    }
    
    process.exit(0);
}
test().catch(console.error);
