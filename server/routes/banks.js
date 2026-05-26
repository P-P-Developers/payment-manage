const express = require('express');
const router = express.Router();
const Bank = require('../models/Bank');
const { protect, adminOnly } = require('../middleware/auth');

// @desc    Get all banks (auto-seeds defaults if empty)
// @route   GET /api/banks
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let banks = await Bank.find({}).sort({ name: 1 }).lean();

    // Auto-seed defaults if database has zero banks
    if (banks.length === 0) {
      await Bank.insertMany([
        { name: 'Union Bank' },
        { name: 'Indian Bank' },
      ]);
      banks = await Bank.find({}).sort({ name: 1 }).lean();
    }

    res.json({ success: true, count: banks.length, banks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new bank
// @route   POST /api/banks
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Bank name is required' });
    }

    const trimmedName = name.trim();
    
    // Case-insensitive duplicate check
    const exists = await Bank.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Bank already exists' });
    }

    const bank = await Bank.create({ name: trimmedName });
    res.status(201).json({ success: true, bank });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a bank name
// @route   PUT /api/banks/:id
// @access  Private (Admin Only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Bank name is required' });
    }

    const trimmedName = name.trim();
    const bank = await Bank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({ success: false, message: 'Bank not found' });
    }

    // Duplicate check excluding current ID
    const exists = await Bank.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Bank already exists' });
    }

    bank.name = trimmedName;
    await bank.save();

    res.json({ success: true, bank });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a bank
// @route   DELETE /api/banks/:id
// @access  Private (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({ success: false, message: 'Bank not found' });
    }

    await Bank.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bank deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
