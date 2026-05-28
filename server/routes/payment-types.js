const express = require('express');
const router = express.Router();
const PaymentType = require('../models/PaymentType');
const Payment = require('../models/Payment');
const { protect, adminOnly } = require('../middleware/auth');

const DEFAULT_PAYMENT_TYPES = [
  { name: 'License', isDefault: true },
  { name: 'IP Charges', isDefault: true },
  { name: 'Maintenance', isDefault: true },
  { name: 'Other', isDefault: true },
];

// @desc    Get all payment types (auto-seeds defaults if empty)
// @route   GET /api/payment-types
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let types = await PaymentType.find({}).sort({ isDefault: -1, name: 1 }).lean();

    // Auto-seed defaults if database has zero payment types
    if (types.length === 0) {
      await PaymentType.insertMany(DEFAULT_PAYMENT_TYPES);
      types = await PaymentType.find({}).sort({ isDefault: -1, name: 1 }).lean();
    }

    res.json({ success: true, count: types.length, paymentTypes: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new payment type
// @route   POST /api/payment-types
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Payment type name is required' });
    }

    const trimmedName = name.trim();

    // Case-insensitive duplicate check
    const exists = await PaymentType.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Payment type already exists' });
    }

    const paymentType = await PaymentType.create({ name: trimmedName });
    res.status(201).json({ success: true, paymentType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a payment type name
// @route   PUT /api/payment-types/:id
// @access  Private (Admin Only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Payment type name is required' });
    }

    const trimmedName = name.trim();
    const paymentType = await PaymentType.findById(req.params.id);
    if (!paymentType) {
      return res.status(404).json({ success: false, message: 'Payment type not found' });
    }

    if (paymentType.isDefault) {
      return res.status(400).json({ success: false, message: 'Default payment types cannot be renamed' });
    }

    // Duplicate check excluding current ID
    const exists = await PaymentType.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Payment type already exists' });
    }

    paymentType.name = trimmedName;
    await paymentType.save();

    res.json({ success: true, paymentType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a payment type
// @route   DELETE /api/payment-types/:id
// @access  Private (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const paymentType = await PaymentType.findById(req.params.id);
    if (!paymentType) {
      return res.status(404).json({ success: false, message: 'Payment type not found' });
    }

    if (paymentType.isDefault) {
      return res.status(400).json({ success: false, message: 'Default payment types (License, IP Charges, Maintenance, Other) cannot be deleted' });
    }

    // Check if this payment type is assigned to any payment record
    const assignedCount = await Payment.countDocuments({ paymentType: paymentType.name });
    if (assignedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${paymentType.name}" — it is used in ${assignedCount} payment record${assignedCount > 1 ? 's' : ''}. Remove or reassign those payments first.`,
      });
    }

    await PaymentType.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Payment type deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
