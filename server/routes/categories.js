const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, adminOnly } = require('../middleware/auth');

// @desc    Get all categories (auto-seeds defaults if empty)
// @route   GET /api/categories
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let categories = await Category.find({}).sort({ name: 1 }).lean();

    // Auto-seed defaults if database has zero categories
    if (categories.length === 0) {
      await Category.insertMany([
        { name: 'Algo' },
        { name: 'Sop' },
        { name: 'crypto' },
      ]);
      categories = await Category.find({}).sort({ name: 1 }).lean();
    }

    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    
    // Case-insensitive duplicate check
    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({ name: trimmedName });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a category name
// @route   PUT /api/categories/:id
// @access  Private (Admin Only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Duplicate check excluding current ID
    const exists = await Category.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    category.name = trimmedName;
    await category.save();

    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
