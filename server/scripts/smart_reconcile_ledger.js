const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Panel = require('../models/Panel');
const Payment = require('../models/Payment');

async function run() {
  await connectDB();
  console.log('Starting Smart Reconciliation...');
  
  const panels = await Panel.find({});
  let totalBillsReconciled = 0;
  
  for (const panel of panels) {
    // 1. Reset all bills for this panel
    await Payment.updateMany(
      { panelId: panel._id, billAmount: { $gt: 0 } },
      { $set: { paidAmount: 0, status: 'Unpaid', appliedPayments: [] } }
    );
    
    // 2. Fetch all bills sorted chronologically (oldest first)
    const bills = await Payment.find({ panelId: panel._id, billAmount: { $gt: 0 } }).sort({ timestamp: 1 });
    
    // 3. Get all actual receipts (exclude System Credit)
    const actualReceipts = await Payment.find({
      panelId: panel._id,
      amountReceived: { $gt: 0 },
      bankName: { $nin: ['System Credit', 'system credit'] },
      remark: { $not: /system credit/i }
    }).sort({ timestamp: 1 });
    
    let generalPool = 0;
    
    // 4. Primary Pass: Match receipts to bills of the SAME paymentType
    for (const receipt of actualReceipts) {
      let amountToDistribute = (receipt.amountReceived || 0) + (receipt.paymentDiscount || 0);
      
      const eligibleBills = bills.filter(b => 
        b.paymentType === receipt.paymentType && 
        ((b.billAmount || 0) - (b.billDiscount || 0) - (b.paidAmount || 0)) > 0
      );
      
      for (const bill of eligibleBills) {
        if (amountToDistribute <= 0) break;
        const remaining = (bill.billAmount || 0) - (bill.billDiscount || 0) - (bill.paidAmount || 0);
        const payAmount = Math.min(remaining, amountToDistribute);
        
        bill.paidAmount += payAmount;
        if (bill.paidAmount >= ((bill.billAmount || 0) - (bill.billDiscount || 0))) {
          bill.status = 'Paid';
        } else {
          bill.status = 'Partial';
        }
        amountToDistribute -= payAmount;
      }
      
      if (amountToDistribute > 0) {
        generalPool += amountToDistribute;
      }
    }
    
    // 5. Adjust General Pool with Opening Balance (oldest debt)
    if (panel.openingBalance && panel.openingBalance > 0) {
      const deduction = Math.min(panel.openingBalance, generalPool);
      generalPool -= deduction;
    } else if (panel.openingBalance && panel.openingBalance < 0) {
      generalPool += Math.abs(panel.openingBalance);
    }
    
    // 6. Secondary Pass: Distribute remaining general pool chronologically to ANY unpaid bill
    for (const bill of bills) {
      if (generalPool <= 0) break;
      const remaining = (bill.billAmount || 0) - (bill.billDiscount || 0) - (bill.paidAmount || 0);
      if (remaining <= 0) continue;
      
      const payAmount = Math.min(remaining, generalPool);
      bill.paidAmount += payAmount;
      if (bill.paidAmount >= ((bill.billAmount || 0) - (bill.billDiscount || 0))) {
        bill.status = 'Paid';
      } else {
        bill.status = 'Partial';
      }
      generalPool -= payAmount;
    }
    
    // 7. Save all updated bills
    for (const bill of bills) {
      await bill.save();
      totalBillsReconciled++;
    }
    
    // 8. Update panel creditBalance
    panel.creditBalance = generalPool > 0 ? generalPool : 0;
    await panel.save();
  }
  
  // 9. Cleanup any remaining System Credit payments
  const deleted = await Payment.deleteMany({
    $or: [
      { bankName: { $in: ['System Credit', 'system credit'] } },
      { remark: /system credit/i }
    ]
  });
  console.log(`Deleted ${deleted.deletedCount} internal System Credit records.`);
  
  console.log(`Smart Reconciliation complete. Processed ${totalBillsReconciled} bills across ${panels.length} panels.`);
  process.exit(0);
}

run().catch(console.error);
