const express = require('express');
const router = express.Router();
const Panel = require('../models/Panel');
const Payment = require('../models/Payment');
const Log = require('../models/Log');
const { protect, hasPermission, adminOnly } = require('../middleware/auth');

// @desc    Get all panels with computed ledger/outstanding
// @route   GET /api/panels
// @access  Private (view_panels permission)
router.get('/', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    const [panels, paymentsSummary] = await Promise.all([
      Panel.find({}).sort({ createdAt: -1 }).lean(),
      Payment.aggregate([
        {
          $group: {
            _id: '$panelId',
            totalPaid: { $sum: '$amountReceived' },
            totalBill: { $sum: '$billAmount' },
            totalBillDiscount: { $sum: '$billDiscount' },
            totalPaymentDiscount: { $sum: '$paymentDiscount' },
          },
        },
      ]),
    ]);

    // Create a lookup map of totalPaid and totalBill by panel ID
    const summaryMap = {};
    paymentsSummary.forEach((item) => {
      if (item._id) {
        summaryMap[item._id.toString()] = {
          totalPaid: item.totalPaid || 0,
          totalBill: item.totalBill || 0,
          totalBillDiscount: item.totalBillDiscount || 0,
          totalPaymentDiscount: item.totalPaymentDiscount || 0,
        };
      }
    });

    // Compute outstanding balance for each panel
    const computedPanels = panels.map((panel) => {
      const summary = summaryMap[panel._id.toString()] || { totalPaid: 0, totalBill: 0, totalBillDiscount: 0, totalPaymentDiscount: 0 };
      const outstanding = (panel.openingBalance || 0) + (summary.totalBill - (summary.totalBillDiscount || 0)) - (summary.totalPaid + (summary.totalPaymentDiscount || 0));

      return {
        ...panel,
        totalPaid: summary.totalPaid,
        outstanding,
      };
    });

    res.json({ success: true, count: computedPanels.length, panels: computedPanels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single panel details & specific history
// @route   GET /api/panels/:id
// @access  Private (view_panels permission)
router.get('/:id', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    const panel = await Panel.findById(req.params.id).lean();
    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    const payments = await Payment.find({ panelId: panel._id })
      .populate('addedBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .sort({ timestamp: -1 })
      .lean();
    const totalPaid = payments.reduce((sum, p) => sum + (p.amountReceived || 0), 0);
    const totalBill = payments.reduce((sum, p) => sum + (p.billAmount || 0), 0);
    const totalBillDiscount = payments.reduce((sum, p) => sum + (p.billDiscount || 0), 0);
    const totalPaymentDiscount = payments.reduce((sum, p) => sum + (p.paymentDiscount || 0), 0);
    const outstanding = (panel.openingBalance || 0) + (totalBill - totalBillDiscount) - (totalPaid + totalPaymentDiscount);

    res.json({
      success: true,
      panel: {
        ...panel,
        totalPaid,
        outstanding,
      },
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new panel (client)
// @route   POST /api/panels
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, async (req, res) => {
  const {
    panelName,
    ownerName,
    ownerEmail,
    phoneNumber,
    licenseCharges,
    ipCharges,
    maintenanceCharges,
    openingBalance,
    category,
  } = req.body;

  try {
    const panelExists = await Panel.findOne({ panelName });
    if (panelExists) {
      return res.status(400).json({ success: false, message: 'Panel with this name already exists' });
    }

    const panel = await Panel.create({
      panelName,
      ownerName,
      ownerEmail,
      phoneNumber,
      licenseCharges: Number(licenseCharges) || 0,
      ipCharges: Number(ipCharges) || 0,
      maintenanceCharges: Number(maintenanceCharges) || 0,
      openingBalance: Number(openingBalance) || 0,
      category: category || 'Algo',
    });

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'ADD',
      module: 'Panel',
      details: `Created new panel client: ${panelName} (Owner: ${ownerName}) with opening balance: ${openingBalance}`,
    });

    res.status(201).json({ success: true, panel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a panel
// @route   PUT /api/panels/:id
// @access  Private (Admin Only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const panel = await Panel.findById(req.params.id);
    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    const updatedFields = {};
    const keys = [
      'panelName',
      'ownerName',
      'ownerEmail',
      'phoneNumber',
      'licenseCharges',
      'ipCharges',
      'maintenanceCharges',
      'openingBalance',
      'category',
    ];

    keys.forEach((key) => {
      if (req.body[key] !== undefined) {
        updatedFields[key] = req.body[key];
      }
    });

    const updatedPanel = await Panel.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true,
      runValidators: true,
    });

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'EDIT',
      module: 'Panel',
      details: `Updated panel client: ${panel.panelName}. Changes made: ${JSON.stringify(updatedFields)}`,
    });

    res.json({ success: true, panel: updatedPanel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a panel
// @route   DELETE /api/panels/:id
// @access  Private (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const panel = await Panel.findById(req.params.id);
    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    // Also delete associated payments to maintain integrity
    await Payment.deleteMany({ panelId: panel._id });
    await Panel.findByIdAndDelete(req.params.id);

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'DELETE',
      module: 'Panel',
      details: `Deleted panel client: ${panel.panelName} and all associated payment receipts`,
    });

    res.json({ success: true, message: 'Panel and associated payments deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
