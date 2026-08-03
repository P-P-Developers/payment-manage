const express = require('express');
const router = express.Router();
const Panel = require('../models/Panel');
const Payment = require('../models/Payment');
const { protect, hasPermission } = require('../middleware/auth');

// @desc    Get dashboard metrics & aggregation stats (Fast)
// @route   GET /api/stats/metrics
// @access  Private (view_panels permission)
router.get('/metrics', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    // 1. Panel Aggregation
    const panelAgg = await Panel.aggregate([
      {
        $group: {
          _id: null,
          totalOpeningBalance: { $sum: { $ifNull: ["$openingBalance", 0] } },
          totalLicenseCharges: { $sum: { $ifNull: ["$licenseCharges", 0] } },
          totalIpCharges: { $sum: { $ifNull: ["$ipCharges", 0] } },
          totalMaintenanceCharges: { $sum: { $ifNull: ["$maintenanceCharges", 0] } },
          totalPanels: { $sum: 1 }
        }
      }
    ]);

    const pStats = panelAgg[0] || {
      totalOpeningBalance: 0,
      totalLicenseCharges: 0,
      totalIpCharges: 0,
      totalMaintenanceCharges: 0,
      totalPanels: 0
    };

    // 2. Payment Aggregation via $facet
    const paymentAgg = await Payment.aggregate([
      {
        $addFields: {
          isSystemCredit: {
            $or: [
              { $regexMatch: { input: { $ifNull: ["$bankName", ""] }, regex: /^system credit$/i } },
              { $regexMatch: { input: { $ifNull: ["$remark", ""] }, regex: /system credit/i } }
            ]
          }
        }
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalBillAmount: { $sum: { $ifNull: ["$billAmount", 0] } },
                totalBillDiscount: { $sum: { $ifNull: ["$billDiscount", 0] } },
                totalPaymentDiscount: { $sum: { $ifNull: ["$paymentDiscount", 0] } },
                totalPaymentsReceived: {
                  $sum: { $cond: ["$isSystemCredit", 0, { $ifNull: ["$amountReceived", 0] }] }
                },
                totalPayments: { $sum: 1 }
              }
            }
          ],
          byType: [
            { $match: { isSystemCredit: false } },
            {
              $group: {
                _id: "$paymentType",
                total: { $sum: { $ifNull: ["$amountReceived", 0] } }
              }
            }
          ],
          byMode: [
            { $match: { isSystemCredit: false } },
            {
              $group: {
                _id: "$paymentMode",
                total: { $sum: { $ifNull: ["$amountReceived", 0] } }
              }
            }
          ]
        }
      }
    ]);

    const payStats = (paymentAgg[0] && paymentAgg[0].totals[0]) || {
      totalBillAmount: 0,
      totalBillDiscount: 0,
      totalPaymentDiscount: 0,
      totalPaymentsReceived: 0,
      totalPayments: 0
    };

    const totalOutstanding = pStats.totalOpeningBalance + (payStats.totalBillAmount - payStats.totalBillDiscount) - (payStats.totalPaymentsReceived + payStats.totalPaymentDiscount);

    // Format Breakdown by Type
    const paymentBreakdown = {
      License: 0,
      'IP Charges': 0,
      Maintenance: 0,
      Other: 0,
    };
    if (paymentAgg[0] && paymentAgg[0].byType) {
      paymentAgg[0].byType.forEach(item => {
        const type = item._id;
        if (paymentBreakdown[type] !== undefined) {
          paymentBreakdown[type] += item.total;
        } else {
          paymentBreakdown['Other'] += item.total;
        }
      });
    }

    // Format Breakdown by Mode
    const paymentModeBreakdown = {
      Cash: 0,
      UPI: 0,
      'Bank Transfer': 0,
      Online: 0,
    };
    if (paymentAgg[0] && paymentAgg[0].byMode) {
      paymentAgg[0].byMode.forEach(item => {
        const mode = item._id;
        if (paymentModeBreakdown[mode] !== undefined) {
          paymentModeBreakdown[mode] += item.total;
        }
      });
    }

    // Return structured metrics (Lightweight & Blazing Fast)
    res.json({
      success: true,
      metrics: {
        totalPaymentsReceived: payStats.totalPaymentsReceived,
        totalLicenseCharges: pStats.totalLicenseCharges,
        totalIpCharges: pStats.totalIpCharges,
        totalMaintenanceCharges: pStats.totalMaintenanceCharges,
        totalOpeningBalance: pStats.totalOpeningBalance,
        totalOutstanding,
        totalBillDiscount: payStats.totalBillDiscount,
        totalPaymentDiscount: payStats.totalPaymentDiscount,
      },
      paymentBreakdown,
      paymentModeBreakdown,
      counts: {
        totalPanels: pStats.totalPanels,
        totalPayments: payStats.totalPayments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get only panel data
// @route   GET /api/stats/panels
// @access  Private
router.get('/panels', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    const panels = await Panel.find({})
      .select('_id panelName category openingBalance licenseQty licenseCharges ipCharges maintenanceCharges')
      .lean();
    res.json({ success: true, panels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get only historical payment data
// @route   GET /api/stats/payments
// @access  Private
router.get('/payments', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    const payments = await Payment.find({})
      .select('_id timestamp amountReceived billAmount billDiscount paymentDiscount paymentType paymentMode bankName remark panelId')
      .populate('panelId', 'panelName category')
      .lean();
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Legacy fallback just in case
// @route   GET /api/stats
router.get('/', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    res.json({ success: true, message: "Please use /metrics, /panels, or /payments endpoints." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
