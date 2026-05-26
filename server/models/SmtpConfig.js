const mongoose = require('mongoose');

const smtpConfigSchema = new mongoose.Schema(
  {
    host: {
      type: String,
      required: [true, 'Please add an SMTP host'],
    },
    port: {
      type: Number,
      required: [true, 'Please add an SMTP port'],
    },
    user: {
      type: String,
      required: [true, 'Please add an SMTP username/user'],
    },
    password: {
      type: String,
      required: [true, 'Please add an SMTP password'],
    },
    senderName: {
      type: String,
      default: 'Deepmind Infotech',
    },
    senderEmail: {
      type: String,
      required: [true, 'Please add a sender email address'],
    },
    ccEmail: {
      type: String,
      default: '',
    },
    encryption: {
      type: String,
      enum: ['SSL/TLS', 'STARTTLS', 'None'],
      default: 'STARTTLS',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SmtpConfig', smtpConfigSchema);
