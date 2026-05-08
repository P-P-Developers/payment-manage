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
    const payments = await Payment.find({}).lean();

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

    const totalPaymentsReceived = payments.reduce((sum, p) => sum + (p.amountReceived || 0), 0);
    const totalBillAmount = payments.reduce((sum, p) => sum + (p.billAmount || 0), 0);
    const totalOutstanding = totalOpeningBalance + totalBillAmount - totalPaymentsReceived;

    // Breakdown payments by type for beautiful charts
    const paymentBreakdown = {
      License: 0,
      'IP Charges': 0,
      Maintenance: 0,
      Other: 0,
    };

    payments.forEach((p) => {
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
      },
      paymentBreakdown,
      paymentModeBreakdown,
      counts: {
        totalPanels: panels.length,
        totalPayments: payments.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
