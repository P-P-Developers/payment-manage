const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    orgName: {
      type: String,
      default: 'DEEP MIND',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: 'billing@company.com',
      trim: true,
    },
    supportPhone: {
      type: String,
      default: '',
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR (₹)',
      trim: true,
    },
    invoicePrefix: {
      type: String,
      default: 'INV-',
      trim: true,
    },
    defaultLicense: {
      type: Number,
      default: 0,
    },
    defaultIp: {
      type: Number,
      default: 0,
    },
    defaultMaint: {
      type: Number,
      default: 0,
    },
    logo: {
      type: String,
      default: '',
    },
    stamp: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
