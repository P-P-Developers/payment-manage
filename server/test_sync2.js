const mongoose = require('mongoose');
require('dotenv').config();
const Panel = require('./models/Panel');
const Payment = require('./models/Payment');

async function test() {
    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
    
    const panels = await Panel.find({ category: { $regex: new RegExp('^sop$', 'i') } }).lean();
    const panelIds = panels.map(p => p._id);
    const payments = await Payment.find({
        panelId: { $in: panelIds },
        paymentType: 'License'
    }).lean();

    const sopItem = {
        "AdminName": "Admin",
        "AmountDetails": 30000.0,
        "Companyname": "Quantit",
        "mobilenumber": "8765432111",
        "Payment Date": "01/04/2026 15:55:39",
        "Url": "https://tools.quantit.live/backend",
        "Status": "On"
    };

    const url = (sopItem.Url || "").toLowerCase();
    const matchedPanel = panels.find(p => p.panelName && url.includes(p.panelName.toLowerCase()));

    if (matchedPanel) {
        const panelPayments = payments.filter(pay => pay.panelId.toString() === matchedPanel._id.toString());
        const sopAmount = parseFloat(sopItem.AmountDetails) || 0;
        console.log(`Found ${panelPayments.length} payments for panel ${matchedPanel.panelName}`);

        const isExisting = panelPayments.some(pay => {
            const amtRecv = parseFloat(pay.amountReceived) || 0;
            const bAmt = parseFloat(pay.billAmount) || 0;
            const uPrice = parseFloat(pay.unitPrice) || 0;
            const amtWithGst = parseFloat((sopAmount + (sopAmount * 0.18)).toFixed(2));
            
            const amtMatches = bAmt === sopAmount || bAmt === amtWithGst ||
                amtRecv === sopAmount || amtRecv === amtWithGst ||
                uPrice === sopAmount || uPrice === amtWithGst;

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

            if (amtMatches && dateMatches) {
                console.log('MATCH FOUND IN DB:', {
                    payId: pay._id,
                    amount: bAmt,
                    date: pay.timestamp
                });
            }
            return amtMatches && dateMatches;
        });
        console.log('isExisting =', isExisting);
    } else {
        console.log('No panel matched.');
    }
    process.exit(0);
}
test().catch(console.error);
