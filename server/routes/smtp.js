const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const SmtpConfig = require('../models/SmtpConfig');
const Log = require('../models/Log');
const { protect, adminOnly } = require('../middleware/auth');
const { generateReceiptPDF } = require('../utils/pdfGenerator');

// Helper function to send email using standard Nodemailer
const sendNodemailerEmail = async ({ host, port, user, password, senderName, senderEmail, ccEmail, encryption, to, subject, html, attachments }) => {
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
    ...(ccEmail && ccEmail.trim() !== '' && { cc: ccEmail.trim() }),
    ...(attachments && { attachments })
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

// @desc    Send receipt bill details via SMTP Email
// @route   POST /api/smtp/send-bill
// @access  Private
router.post('/send-bill', protect, async (req, res) => {
  const { paymentId, toEmail, settings } = req.body;

  if (!paymentId || !toEmail) {
    return res.status(400).json({ success: false, message: 'Payment ID and Recipient Email are required' });
  }

  try {
    const Payment = require('../models/Payment');
    const payment = await Payment.findById(paymentId).populate('panelId');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment receipt not found' });
    }

    const panelName = payment.panelId?.panelName || 'Client';
    const ownerName = payment.panelId?.ownerName || 'Client';
    const amountPaid = payment.amountReceived || 0;
    const billAmount = payment.billAmount || 0;
    const discount = (payment.billDiscount || 0) + (payment.paymentDiscount || 0);
    const due = (billAmount - (payment.billDiscount || 0)) - (amountPaid + (payment.paymentDiscount || 0));

    // Get active SMTP configuration
    const config = await SmtpConfig.findOne();
    if (!config || !config.host || !config.user || !config.password) {
      return res.status(400).json({ success: false, message: 'SMTP Server is not configured. Please complete setup in SMTP Settings.' });
    }

    const receiptId = `REC-${payment._id.toString().substring(18).toUpperCase()}`;
    const timestamp = new Date(payment.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Build rich email HTML body
    const emailSubject = `Receipt ${receiptId} - ${panelName} Account Update`;
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); color: #1e293b; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase; color: #ffffff !important;">${config.senderName}</h1>
          <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #e0e7ff;">Official Transaction Invoice</p>
        </div>
        <!-- Body -->
        <div style="padding: 30px;">
          <h2 style="margin-top: 0; font-size: 18px; color: #0f172a; font-weight: 700;">Dear ${ownerName} (${panelName}),</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 25px;">Your transaction receipt for <strong>${payment.paymentType} Fees</strong> is ready. Please find the receipt details summarized below:</p>
          
          <!-- Invoice details table -->
          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 45%;">Receipt Number:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold; text-align: right; font-family: monospace;">${receiptId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Invoice Date:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold; text-align: right;">${timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Description:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold; text-align: right;">${payment.paymentType} Fees (Software Panel Charge)</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 10px 0 6px 0; color: #64748b;">Total Bill:</td>
                <td style="padding: 10px 0 6px 0; color: #0f172a; font-weight: bold; text-align: right;">₹${billAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
                <td style="padding: 6px 0; color: #10b981; font-weight: bold; text-align: right;">₹${amountPaid.toLocaleString()}</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Discount Applied:</td>
                <td style="padding: 6px 0; color: #f59e0b; font-weight: bold; text-align: right;">-₹${discount.toLocaleString()}</td>
              </tr>` : ''}
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 10px 0 0 0; color: #0f172a; font-weight: bold; font-size: 15px;">Balance Outstanding:</td>
                <td style="padding: 10px 0 0 0; color: #ef4444; font-weight: bold; font-size: 16px; text-align: right;">₹${due > 0 ? due.toLocaleString() : '0'}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 0;">If you have any questions or require additional assistance, please reach out to us at <a href="mailto:${config.senderEmail}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">${config.senderEmail}</a>.</p>
        </div>
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; font-weight: 500;">
          This is an automated transactional statement. Thank you for your continued business with ${config.senderName}!
        </div>
      </div>
    `;

    // Generate dynamic PDF Receipt
    const SystemSettings = require('../models/SystemSettings');
    const settingsFromDb = await SystemSettings.findOne({});
    const pdfBuffer = await generateReceiptPDF(payment, settingsFromDb || settings || { orgName: config.senderName });

    // Send using NodeMailer helper with attached PDF
    await sendNodemailerEmail({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      senderName: config.senderName,
      senderEmail: config.senderEmail,
      ccEmail: config.ccEmail,
      encryption: config.encryption,
      to: toEmail,
      subject: emailSubject,
      html: emailHtml,
      attachments: [
        {
          filename: `Receipt_${receiptId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    await Log.create({
      userId: req.user._id,
      actionType: 'EDIT',
      module: 'Payment',
      details: `Successfully sent Invoice Email ${receiptId} to ${toEmail} via SMTP.`,
    });

    res.json({
      success: true,
      message: 'Invoice Receipt sent to client via Email successfully!',
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: `Failed to send email bill: ${error.message}`,
    });
  }
});

module.exports = router;
