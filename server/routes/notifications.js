const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get all active global notifications for the logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // Find notifications where user's ID is not in readBy array
        const notifications = await Notification.find({
            isGlobal: true,
            readBy: { $ne: req.user._id }
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error("Fetch Notifications Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.post('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (!notification.readBy.includes(req.user._id)) {
            notification.readBy.push(req.user._id);
            await notification.save();
        }

        res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error("Mark Notification Read Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
