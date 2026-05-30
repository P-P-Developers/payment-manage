const Panel = require('../models/Panel');
const Payment = require('../models/Payment');
const User = require('../models/User');

const applyCreditToUnpaidBills = async (panelId) => {
  try {
    const panel = await Panel.findById(panelId);
    if (!panel || !panel.creditBalance || panel.creditBalance <= 0) return;

    // Find unpaid or partially paid bills, ordered oldest first
    const unpaidBills = await Payment.find({
      panelId,
      billAmount: { $gt: 0 },
      $or: [
        { status: { $in: ['Unpaid', 'Partial'] } },
        { status: { $exists: false } },
        { status: null }
      ]
    }).sort({ timestamp: 1 });

    const admin = await User.findOne({ role: 'Admin' });

    for (const bill of unpaidBills) {
      if (panel.creditBalance <= 0) break;

      const remainingToPay = (bill.billAmount - (bill.billDiscount || 0)) - bill.paidAmount;
      if (remainingToPay <= 0) {
        bill.status = 'Paid';
        await bill.save();
        continue;
      }

      const payAmount = Math.min(panel.creditBalance, remainingToPay);

      // Create credit payment receipt
      const creditPayment = await Payment.create({
        panelId,
        paymentType: bill.paymentType,
        amountReceived: payAmount,
        paymentMode: 'Online',
        bankName: 'System Credit',
        remark: `System Credit adjustment applied automatically to bill dated ${new Date(bill.timestamp).toLocaleDateString()}`,
        addedBy: admin ? admin._id : bill.addedBy,
        timestamp: new Date()
      });

      bill.paidAmount += payAmount;
      if (bill.paidAmount >= (bill.billAmount - (bill.billDiscount || 0))) {
        bill.status = 'Paid';
      } else {
        bill.status = 'Partial';
      }

      bill.appliedPayments.push({
        paymentId: creditPayment._id,
        amount: payAmount
      });

      await bill.save();
      panel.creditBalance -= payAmount;
    }

    await panel.save();
  } catch (error) {
    console.error('Failed to apply credit automatically:', error.message);
  }
};

module.exports = {
  applyCreditToUnpaidBills
};
