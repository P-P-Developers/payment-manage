const express = require('express');
const router = express.Router();
const Panel = require('../models/Panel');
const Payment = require('../models/Payment');
const { protect, hasPermission } = require('../middleware/auth');

// @desc    Get dashboard metrics & aggregation stats
// @route   GET /api/stats
// @access  Private (view_panels permission)
router.get('/', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    const panels = await Panel.find({}).lean();
    const payments = await Payment.find({}).populate('panelId', 'panelName').lean();

    // Calculate sum of panel charges
    let totalOpeningBalance = 0;
    let totalLicenseCharges = 0;
    let totalIpCharges = 0;
    let totalMaintenanceCharges = 0;

    panels.forEach((panel) => {
      totalOpeningBalance += panel.openingBalance || 0;
      totalLicenseCharges += panel.licenseCharges || 0;
      totalIpCharges += panel.ipCharges || 0;
      totalMaintenanceCharges += panel.maintenanceCharges || 0;
    });

    const isSystemCredit = (p) => 
      p.bankName === 'System Credit' || 
      (p.bankName && p.bankName.toLowerCase().trim() === 'system credit') ||
      (p.remark && p.remark.toLowerCase().includes('system credit'));

    const totalPaymentsReceived = payments.reduce((sum, p) => isSystemCredit(p) ? sum : sum + (p.amountReceived || 0), 0);
    const totalBillAmount = payments.reduce((sum, p) => sum + (p.billAmount || 0), 0);
    const totalBillDiscount = payments.reduce((sum, p) => sum + (p.billDiscount || 0), 0);
    const totalPaymentDiscount = payments.reduce((sum, p) => sum + (p.paymentDiscount || 0), 0);
    const totalOutstanding = totalOpeningBalance + (totalBillAmount - totalBillDiscount) - (totalPaymentsReceived + totalPaymentDiscount);

    // Breakdown payments by type for beautiful charts
    const paymentBreakdown = {
      License: 0,
      'IP Charges': 0,
      Maintenance: 0,
      Other: 0,
    };

    payments.forEach((p) => {
      if (isSystemCredit(p)) return; // Exclude credit adjustments from new payments received breakdown
      if (paymentBreakdown[p.paymentType] !== undefined) {
        paymentBreakdown[p.paymentType] += p.amountReceived;
      } else {
        paymentBreakdown['Other'] += p.amountReceived;
      }
    });

    // Breakdown payments by mode
    const paymentModeBreakdown = {
      Cash: 0,
      UPI: 0,
      'Bank Transfer': 0,
      Online: 0,
    };

    payments.forEach((p) => {
      if (isSystemCredit(p)) return; // Exclude credit adjustments
      if (paymentModeBreakdown[p.paymentMode] !== undefined) {
        paymentModeBreakdown[p.paymentMode] += p.amountReceived;
      }
    });

    // Return structured metrics
    res.json({
      success: true,
      metrics: {
        totalPaymentsReceived,
        totalLicenseCharges,
        totalIpCharges,
        totalMaintenanceCharges,
        totalOpeningBalance,
        totalOutstanding,
        totalBillDiscount,
        totalPaymentDiscount,
      },
      paymentBreakdown,
      paymentModeBreakdown,
      counts: {
        totalPanels: panels.length,
        totalPayments: payments.length,
      },
      panels,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
