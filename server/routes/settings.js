const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const { protect, adminOnly } = require('../middleware/auth');
const Log = require('../models/Log');

// Helper to log administrative actions
const createAuditLog = async (userId, action, details) => {
  try {
    await Log.create({
      user: userId,
      action,
      details,
      ipAddress: '127.0.0.1', // local or default fallback
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
};

// @desc    Get system settings (auto-seeds defaults if empty)
// @route   GET /api/settings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({});

    // Auto-seed default configuration if empty
    if (!settings) {
      settings = await SystemSettings.create({
        orgName: 'DEEP MIND',
        contactEmail: 'billing@company.com',
        supportPhone: '',
        currency: 'INR (₹)',
        invoicePrefix: 'INV-',
        defaultLicense: 0,
        defaultIp: 0,
        defaultMaint: 0,
        logo: '',
        stamp: '',
      });
    }

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin Only)
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      orgName,
      contactEmail,
      supportPhone,
      currency,
      invoicePrefix,
      defaultLicense,
      defaultIp,
      defaultMaint,
      logo,
      stamp,
    } = req.body;

    let settings = await SystemSettings.findOne({});

    if (!settings) {
      settings = new SystemSettings({});
    }

    // Update settings fields
    settings.orgName = orgName !== undefined ? orgName : settings.orgName;
    settings.contactEmail = contactEmail !== undefined ? contactEmail : settings.contactEmail;
    settings.supportPhone = supportPhone !== undefined ? supportPhone : settings.supportPhone;
    settings.currency = currency !== undefined ? currency : settings.currency;
    settings.invoicePrefix = invoicePrefix !== undefined ? invoicePrefix : settings.invoicePrefix;
    settings.defaultLicense = defaultLicense !== undefined ? Number(defaultLicense) : settings.defaultLicense;
    settings.defaultIp = defaultIp !== undefined ? Number(defaultIp) : settings.defaultIp;
    settings.defaultMaint = defaultMaint !== undefined ? Number(defaultMaint) : settings.defaultMaint;
    settings.logo = logo !== undefined ? logo : settings.logo;
    settings.stamp = stamp !== undefined ? stamp : settings.stamp;

    await settings.save();

    // Create audit log for changes
    await createAuditLog(
      req.user._id,
      'UPDATE_SYSTEM_SETTINGS',
      `Admin updated system & branding configurations. Org Name: ${settings.orgName}`
    );

    res.json({ success: true, message: 'System configurations saved successfully to database!', settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
