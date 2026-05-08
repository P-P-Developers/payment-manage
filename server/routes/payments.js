const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Panel = require('../models/Panel');
const Log = require('../models/Log');
const { protect, hasPermission, adminOnly } = require('../middleware/auth');

// @desc    Get all payments (with pagination support)
// @route   GET /api/payments
// @access  Private (view_panels permission)
router.get('/', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limitQuery = req.query.limit;
    const limit = limitQuery === 'all' ? 0 : (parseInt(limitQuery) || 10);
    const skip = limit === 0 ? 0 : (page - 1) * limit;

    let filterQuery = {};

    // Filter by Search Query (searches panelName)
    if (req.query.search) {
      const matchedPanels = await Panel.find({
        panelName: { $regex: req.query.search, $options: 'i' }
      }).select('_id');
      const matchedPanelIds = matchedPanels.map(p => p._id);
      filterQuery.panelId = { $in: matchedPanelIds };
    }

    // Filter by Payment Type
    if (req.query.paymentType && req.query.paymentType !== 'All') {
      filterQuery.paymentType = req.query.paymentType;
    }

    // Filter by Payment Mode
    if (req.query.paymentMode && req.query.paymentMode !== 'All') {
      filterQuery.paymentMode = req.query.paymentMode;
    }

    // Filter by Transaction Category
    if (req.query.transactionType === 'bill') {
      filterQuery.billAmount = { $gt: 0 };
    } else if (req.query.transactionType === 'received') {
      filterQuery.amountReceived = { $gt: 0 };
    }

    // Filter by Date Range
    if (req.query.startDate || req.query.endDate) {
      filterQuery.timestamp = {};
      if (req.query.startDate) {
        filterQuery.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filterQuery.timestamp.$lte = end;
      }
    }

    const total = await Payment.countDocuments(filterQuery);
    const payments = await Payment.find(filterQuery)
      .populate('panelId', 'panelName ownerName ownerEmail phoneNumber')
      .populate('addedBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: payments.length,
      total,
      pages: limit === 0 ? 1 : Math.ceil(total / limit),
      currentPage: page,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a payment
// @route   POST /api/payments
// @access  Private (add_payments permission)
router.post('/', protect, hasPermission('add_payments'), async (req, res) => {
  const { panelId, paymentType, amountReceived, paymentMode, bankName, quantity, remark, unitPrice, billAmount, timestamp } = req.body;

  try {
    if (!panelId || !paymentType || amountReceived === undefined || !paymentMode) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const panel = await Panel.findById(panelId);
    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }
  

    const payment = await Payment.create({
      panelId,
      paymentType,
      amountReceived: Number(amountReceived),
      paymentMode,
      bankName: bankName || '',
      quantity: (quantity !== undefined && quantity !== null && quantity !== '') ? Number(quantity) : 0,
      unitPrice: Number(unitPrice) || 0,
      billAmount: Number(billAmount) || 0,
      remark: remark || '',
      addedBy: req.user._id,
      timestamp: timestamp ? new Date(timestamp) : undefined,
    });

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'ADD',
      module: 'Payment',
      details: `Received payment of ₹${amountReceived} (${paymentType}) from panel ${panel.panelName} via ${paymentMode}`,
    });

    res.status(201).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Edit a payment
// @route   PUT /api/payments/:id
// @access  Private (edit_payments permission)
router.put('/:id', protect, hasPermission('edit_payments'), async (req, res) => {
  const { paymentType, amountReceived, paymentMode, bankName, quantity, remark, timestamp } = req.body;

  try {
    const payment = await Payment.findById(req.params.id).populate('panelId', 'panelName');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const oldAmount = payment.amountReceived;
    const oldType = payment.paymentType;
    const oldMode = payment.paymentMode;
    const oldBank = payment.bankName;
    const oldQty = payment.quantity;
    const oldPrice = payment.unitPrice;
    const oldBill = payment.billAmount;
    const oldRemark = payment.remark;
    const oldTimestamp = payment.timestamp;

    payment.paymentType = paymentType || payment.paymentType;
    payment.amountReceived = amountReceived !== undefined ? Number(amountReceived) : payment.amountReceived;
    payment.paymentMode = paymentMode || payment.paymentMode;
    payment.bankName = bankName !== undefined ? bankName : payment.bankName;
    payment.quantity = quantity !== undefined ? Number(quantity) : payment.quantity;
    payment.unitPrice = req.body.unitPrice !== undefined ? Number(req.body.unitPrice) : payment.unitPrice;
    payment.billAmount = req.body.billAmount !== undefined ? Number(req.body.billAmount) : payment.billAmount;
    payment.remark = remark !== undefined ? remark : payment.remark;
    if (timestamp) {
      payment.timestamp = new Date(timestamp);
    }

    // Track changes
    const changesArray = [];
    if (oldType !== payment.paymentType) changesArray.push(`Type: ${oldType} ➔ ${payment.paymentType}`);
    if (oldAmount !== payment.amountReceived) changesArray.push(`Paid: ₹${oldAmount} ➔ ₹${payment.amountReceived}`);
    if (oldMode !== payment.paymentMode) changesArray.push(`Mode: ${oldMode} ➔ ${payment.paymentMode}`);
    if (oldBank !== payment.bankName) changesArray.push(`Bank: "${oldBank || 'N/A'}" ➔ "${payment.bankName || 'N/A'}"`);
    if (oldQty !== payment.quantity) changesArray.push(`Qty: ${oldQty} ➔ ${payment.quantity}`);
    if (oldPrice !== payment.unitPrice) changesArray.push(`Price: ₹${oldPrice} ➔ ₹${payment.unitPrice}`);
    if (oldBill !== payment.billAmount) changesArray.push(`Bill: ₹${oldBill} ➔ ₹${payment.billAmount}`);
    if (oldRemark !== payment.remark) changesArray.push(`Remark: "${oldRemark || 'N/A'}" ➔ "${payment.remark || 'N/A'}"`);
    if (timestamp && new Date(oldTimestamp).getTime() !== new Date(payment.timestamp).getTime()) {
      changesArray.push(`Date: ${new Date(oldTimestamp).toLocaleDateString()} ➔ ${new Date(payment.timestamp).toLocaleDateString()}`);
    }

    if (changesArray.length > 0) {
      payment.editHistory.push({
        editedBy: req.user._id,
        editedAt: new Date(),
        changes: changesArray.join(' | '),
      });
    }

    let updatedPayment = await payment.save();
    
    // Populate the newly added editHistory's editedBy before returning
    updatedPayment = await Payment.findById(updatedPayment._id)
      .populate('panelId', 'panelName ownerName ownerEmail phoneNumber')
      .populate('addedBy', 'name email')
      .populate('editHistory.editedBy', 'name email');

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'EDIT',
      module: 'Payment',
      details: `Edited payment for panel ${payment.panelId.panelName}. Changes: ${changesArray.join(' | ')}`,
    });

    res.json({ success: true, payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Private (Admin Only - to prevent fraud)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('panelId', 'panelName');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    await Payment.findByIdAndDelete(req.params.id);

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'DELETE',
      module: 'Payment',
      details: `Deleted payment record of ₹${payment.amountReceived} from panel ${payment.panelId.panelName}`,
    });

    res.json({ success: true, message: 'Payment record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
