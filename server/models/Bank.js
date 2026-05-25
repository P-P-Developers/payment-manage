const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a bank name'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Bank', bankSchema);
