const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    type: { type: String, enum: ['error', 'info', 'warning', 'success'], default: 'error' },
    isGlobal: { type: Boolean, default: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
