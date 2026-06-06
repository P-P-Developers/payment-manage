require('dotenv').config();
const mongoose = require('mongoose');
const Panel = require('../models/Panel');
const Payment = require('../models/Payment');

mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME })
  .then(async () => {
    console.log("Connected to DB. Starting recalculation...");

    const panels = await Panel.find();
    console.log(`Found ${panels.length} panels to process.`);

    for (let panel of panels) {
      // 1. Get all receipts for this panel
      const receipts = await Payment.find({ panelId: panel._id, amountReceived: { $gt: 0 } });
      let totalPaid = 0;
      for (let r of receipts) {
        totalPaid += (r.amountReceived || 0) + (r.paymentDiscount || 0);
      }

      // 2. Get all bills for this panel, sorted by oldest first
      const bills = await Payment.find({ panelId: panel._id, billAmount: { $gt: 0 } }).sort({ timestamp: 1 });

      let availableCredit = totalPaid;

      for (let bill of bills) {
        const netBillAmount = (bill.billAmount || 0) - (bill.billDiscount || 0);

        if (availableCredit >= netBillAmount) {
          bill.paidAmount = netBillAmount;
          bill.status = 'Paid';
          availableCredit -= netBillAmount;
        } else if (availableCredit > 0) {
          bill.paidAmount = availableCredit;
          bill.status = 'Partial';
          availableCredit = 0;
        } else {
          bill.paidAmount = 0;
          bill.status = 'Unpaid';
        }

        await bill.save();
      }

      // 3. Update the panel's creditBalance with whatever is leftover
      panel.creditBalance = availableCredit;
      await panel.save();

      console.log(`Panel: ${panel.panelName} | Total Received: ₹${totalPaid} | Remaining Credit: ₹${availableCredit}`);
    }

    console.log("Finished recalculating all bills successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Error:", err);
    process.exit(1);
  });
