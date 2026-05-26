const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const SmtpConfig = require('../models/SmtpConfig');
const Log = require('../models/Log');
const { protect, adminOnly } = require('../middleware/auth');

// Helper function to send email using standard Nodemailer
const sendNodemailerEmail = async ({ host, port, user, password, senderName, senderEmail, ccEmail, encryption, to, subject, html }) => {
  const isSecure = encryption === 'SSL/TLS' || Number(port) === 465;

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: isSecure,
    auth: {
      user,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false // Bypasses self-signed certificate issues on private servers
    }
  });

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to,
    subject,
    html,
    ...(ccEmail && ccEmail.trim() !== '' && { cc: ccEmail.trim() })
  };

  return await transporter.sendMail(mailOptions);
};

// @desc    Get SMTP config
// @route   GET /api/smtp/config
// @access  Private/AdminOnly
router.get('/config', protect, adminOnly, async (req, res) => {
  try {
    let config = await SmtpConfig.findOne();
    if (!config) {
      return res.json({
        success: true,
        config: {
          host: '',
          port: 587,
          user: '',
          password: '',
          senderName: 'Deepmind Infotech',
          senderEmail: '',
          ccEmail: '',
          encryption: 'STARTTLS',
        }
      });
    }
    res.json({ success: true, config });
  } catch (error) {
    console.error('Failed to fetch SMTP configuration:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve SMTP settings' });
  }
});

// @desc    Save or update SMTP config
// @route   POST /api/smtp/config
// @access  Private/AdminOnly
router.post('/config', protect, adminOnly, async (req, res) => {
  const { host, port, user, password, senderName, senderEmail, ccEmail, encryption } = req.body;

  if (!host || !port || !user || !password || !senderEmail) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  try {
    let config = await SmtpConfig.findOne();

    if (config) {
      config.host = host;
      config.port = Number(port);
      config.user = user;
      config.password = password;
      config.senderName = senderName || 'Deepmind Infotech';
      config.senderEmail = senderEmail;
      config.ccEmail = ccEmail || '';
      config.encryption = encryption || 'STARTTLS';
      await config.save();
    } else {
      config = await SmtpConfig.create({
        host,
        port: Number(port),
        user,
        password,
        senderName: senderName || 'Deepmind Infotech',
        senderEmail,
        ccEmail: ccEmail || '',
        encryption: encryption || 'STARTTLS',
      });
    }

    await Log.create({
      userId: req.user._id,
      actionType: 'EDIT',
      module: 'User',
      details: `Admin updated SMTP Server settings to ${host}:${port} with CC: ${ccEmail || 'None'}`,
    });

    res.json({ success: true, message: 'SMTP settings updated successfully!', config });
  } catch (error) {
    console.error('Failed to update SMTP settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error while saving SMTP settings' });
  }
});

// @desc    Test SMTP mail delivery
// @route   POST /api/smtp/test
// @access  Private/AdminOnly
router.post('/test', protect, adminOnly, async (req, res) => {
  const { host, port, user, password, senderName, senderEmail, ccEmail, encryption, testRecipient } = req.body;

  if (!host || !port || !user || !password || !senderEmail || !testRecipient) {
    return res.status(400).json({ success: false, message: 'Missing parameters for mail test connection' });
  }

  try {
    const testSubject = '🚀 Deepmind SMTP Connection Test: Successful!';
    const testHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; color: #1e293b; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 22px;">SMTP CONNECTION SUCCESSFUL</h1>
          <p style="color: #64748b; font-size: 11px; margin-top: 5px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">System Testing Services</p>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">This is a real-time SMTP test email sent automatically by your <strong>Panel Ledger Management System</strong>.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; margin: 0 0 10px 0;">SMTP Server Details:</p>
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 35%;">SMTP Host:</td>
              <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${host}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">SMTP Port:</td>
              <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${port}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Sender Address:</td>
              <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${senderEmail}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">CC Address:</td>
              <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${ccEmail || 'None'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Encryption:</td>
              <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${encryption}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">Your SMTP configuration is perfectly verified and ready to be used to deliver billing notifications, receipts, and user account credentials to clients automatically.</p>
        
        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; text-align: center;">
          Sent securely via Deepmind Panel Ledger Services. Please do not reply directly to this email.
        </p>
      </div>
    `;

    // Send Mail using Nodemailer helper
    await sendNodemailerEmail({
      host,
      port,
      user,
      password,
      senderName,
      senderEmail,
      ccEmail,
      encryption,
      to: testRecipient,
      subject: testSubject,
      html: testHtml
    });

    await Log.create({
      userId: req.user._id,
      actionType: 'EDIT',
      module: 'Payment',
      details: `Admin successfully tested and sent test email via ${host} to ${testRecipient} with CC: ${ccEmail || 'None'}`,
    });

    res.json({
      success: true,
      message: `SMTP Connection successful! Test email delivered to ${testRecipient} ${ccEmail ? `and CC'd to ${ccEmail}` : ''}`,
    });
  } catch (error) {
    console.error('SMTP testing failure:', error);

    await Log.create({
      userId: req.user._id,
      actionType: 'EDIT',
      module: 'Payment',
      details: `Admin failed to connect to SMTP server ${host}:${port}. Error: ${error.message}`,
    });

    res.status(500).json({
      success: false,
      message: `SMTP Connection failed: ${error.message}`,
    });
  }
});

module.exports = router;
