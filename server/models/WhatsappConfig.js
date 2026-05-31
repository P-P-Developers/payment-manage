const mongoose = require('mongoose');

const whatsappConfigSchema = new mongoose.Schema(
  {
    permanentAccessToken: {
      type: String,
      required: [true, 'Please add a Permanent Access Token'],
    },
    phoneNumberId: {
      type: String,
      required: [true, 'Please add a WhatsApp Phone Number ID'],
    },
    wabaId: {
      type: String,
      required: [true, 'Please add a WhatsApp Business Account (WABA) ID'],
    },
    testPhoneNumber: {
      type: String,
      required: [true, 'Please add a Test Phone Number'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WhatsappConfig', whatsappConfigSchema);
