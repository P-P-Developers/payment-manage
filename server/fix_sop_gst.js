require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Panel = require('./models/Panel');

async function fixOldSopGst() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected to DB:', process.env.MONGO_URI);

        const panels = await Panel.find({ category: { $regex: new RegExp('^sop$', 'i') } });
        const sopPanels = panels.filter(p => p.takeSopDiscount === true);
        const sopPanelIds = sopPanels.map(p => p._id.toString());
        
        console.log(`Found ${sopPanels.length} SOP panels with GST enabled.`);

        const payments = await Payment.find({ paymentType: 'License', isGstApplied: { $ne: true }, billAmount: { $gt: 0 } });
        console.log(`Found ${payments.length} License bills without GST applied.`);

        let updatedCount = 0;

        for (const payment of payments) {
            if (sopPanelIds.includes(payment.panelId.toString())) {
                const oldBillAmount = payment.billAmount;
                const newBillAmount = Math.round(oldBillAmount * 1.18);
                
                payment.isGstApplied = true;
                payment.billAmount = newBillAmount;
                
                await payment.save();
                updatedCount++;
                console.log(`Updated payment ${payment._id} for panel ${payment.panelId}: ₹${oldBillAmount} -> ₹${newBillAmount}`);
            }
        }
        
        console.log(`Finished fixing. Updated ${updatedCount} payments.`);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

fixOldSopGst();
