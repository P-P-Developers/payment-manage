const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Panel = require('../models/Panel');
const Payment = require('../models/Payment');

async function run() {
  await connectDB();
  console.log('Starting reconciliation...');
  
  const panels = await Panel.find({});
  let totalBillsReconciled = 0;
  
  for (const panel of panels) {
    // 1. Reset all bills for this panel
    await Payment.updateMany(
      { panelId: panel._id, billAmount: { $gt: 0 } },
      { $set: { paidAmount: 0, status: 'Unpaid', appliedPayments: [] } }
    );
    
    // 2. Get total actual received pool
    const actualReceipts = await Payment.find({
      panelId: panel._id,
      amountReceived: { $gt: 0 },
      bankName: { $nin: ['System Credit', 'system credit'] },
      remark: { $not: /system credit/i }
    }).lean();
    
    let totalPool = 0;
    for (const r of actualReceipts) {
      totalPool += (r.amountReceived || 0) + (r.paymentDiscount || 0);
    }
    
    // Adjust pool with opening balance
    totalPool -= (panel.openingBalance || 0);
    
    let availableForBills = totalPool;
    if (availableForBills < 0) availableForBills = 0;
    
    // 3. Fetch all bills sorted chronologically (oldest first)
    const bills = await Payment.find({ panelId: panel._id, billAmount: { $gt: 0 } }).sort({ timestamp: 1 });
    
    for (const bill of bills) {
      const remaining = (bill.billAmount || 0) - (bill.billDiscount || 0);
      if (remaining <= 0) {
        bill.status = 'Paid';
        bill.paidAmount = 0;
        await bill.save();
        continue;
      }
      
      if (availableForBills <= 0) {
        bill.status = 'Unpaid';
        bill.paidAmount = 0;
        await bill.save();
        continue;
      }
      
      const payAmount = Math.min(remaining, availableForBills);
      bill.paidAmount = payAmount;
      if (payAmount >= remaining) {
        bill.status = 'Paid';
      } else {
        bill.status = 'Partial';
      }
      
      availableForBills -= payAmount;
      totalBillsReconciled++;
      await bill.save();
    }
    
    // 4. Update panel creditBalance
    panel.creditBalance = availableForBills > 0 ? availableForBills : 0;
    await panel.save();
  }
  
  // 5. Cleanup any System Credit payments since they are no longer needed
  const deleted = await Payment.deleteMany({
    $or: [
      { bankName: { $in: ['System Credit', 'system credit'] } },
      { remark: /system credit/i }
    ]
  });
  console.log("Deleted  internal System Credit records.");
  
  console.log("Reconciliation complete. Processed  bills across  panels.");
  process.exit(0);
}

run().catch(console.error);
