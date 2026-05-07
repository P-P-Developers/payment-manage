const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    panelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Panel',
      required: [true, 'Please add a panel'],
    },
    paymentType: {
      type: String,
      required: [true, 'Please add a payment type'],
      enum: ['License', 'IP Charges', 'Maintenance', 'Other'],
    },
    amountReceived: {
      type: Number,
      required: [true, 'Please add an amount received'],
    },
    paymentMode: {
      type: String,
      required: [true, 'Please add a payment mode'],
      enum: ['UPI', 'Cash', 'Bank Transfer', 'Online'],
    },
    bankName: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      default: 0,
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    billAmount: {
      type: Number,
      default: 0,
    },
    remark: {
      type: String,
      default: '',
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please add user who received this payment'],
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

module.exports = mongoose.model('Payment', paymentSchema);
