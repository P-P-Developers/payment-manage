const mongoose = require('mongoose');

const paymentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a payment type name'],
      unique: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PaymentType', paymentTypeSchema);
