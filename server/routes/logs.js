const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { protect, adminOnly } = require('../middleware/auth');

// @desc    Get all activity logs
// @route   GET /api/logs
// @access  Private (Admin Only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const query = {};
    if (req.query.userId) {
      query.userId = req.query.userId;
    }

    const logs = await Log.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(200)
      .lean();

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
