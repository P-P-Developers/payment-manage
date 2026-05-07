const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema(
  {
    panelName: {
      type: String,
      required: [true, 'Please add a panel name'],
      unique: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Please add owner name'],
    },
    ownerEmail: {
      type: String,
      required: [true, 'Please add owner email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please add phone number'],
    },
    licenseCharges: {
      type: Number,
      required: [true, 'Please add license charges'],
      default: 0,
    },
    ipCharges: {
      type: Number,
      required: [true, 'Please add IP charges'],
      default: 0,
    },
    maintenanceCharges: {
      type: Number,
      required: [true, 'Please add maintenance charges'],
      default: 0,
    },
    openingBalance: {
      type: Number,
      required: [true, 'Please add opening balance'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Panel', panelSchema);
