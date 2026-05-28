const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionType: {
      type: String,
      enum: ['ADD', 'EDIT', 'DELETE', 'LOGIN', 'LOGOUT'],
      required: true,
    },
    module: {
      type: String,
      enum: ['Panel', 'Payment', 'User', 'Auth'],
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);
