const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');
const { protect, protectTemp, adminOnly } = require('../middleware/auth');
const getClientIp = require('../utils/getClientIp');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const crypto = require('crypto');

// Generate a unique session token
const generateSessionToken = () => crypto.randomBytes(32).toString('hex');

// Generate JWT token helper - includes sessionToken for single-session enforcement
const generateToken = (id, sessionToken) => {
  return jwt.sign({ id, sessionToken }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, JunkPassword } = req.body;
  // Note: some systems use password directly, let's accept password or pass
  const password = req.body.password || JunkPassword;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // 2FA Mandatory Step - Return a temporary short-lived token to perform 2FA verification
      const tempToken = jwt.sign({ id: user._id, isTemp2FA: true }, process.env.JWT_SECRET, {
        expiresIn: '5m',
      });

      res.json({
        success: true,
        twoFactorRequired: true,
        twoFactorEnabled: user.twoFactorEnabled,
        tempToken,
        email: user.email,
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Generate 2FA Secret and QR Code
// @route   POST /api/auth/generate-2fa
// @access  Private (Temporary)
router.post('/generate-2fa', protectTemp, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: '2FA is already enabled for this account' });
    }

    // Generate a unique base32 secret
    const secret = speakeasy.generateSecret({
      name: `PanelAccounting:${user.email}`,
    });

    // Save secret to database
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCode: qrCodeDataUrl,
      secret: secret.base32,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Verify 2FA OTP Code & Log In
// @route   POST /api/auth/verify-2fa
// @access  Private (Temporary)
router.post('/verify-2fa', protectTemp, async (req, res) => {
  const { code } = req.body;

  try {
    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide OTP verification code' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: '2FA has not been generated for this account. Please generate first.' });
    }

    // Verify OTP code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1, // allows +/- 30 seconds clock drift
    });

    if (verified) {
      // Mark 2FA as fully enabled
      user.twoFactorEnabled = true;

      // Generate final sessionToken
      const sessionToken = generateSessionToken();
      user.sessionToken = sessionToken;
      await user.save();

      // Capture IP Address robustly
      const ipAddress = getClientIp(req);

      // Create login activity log
      await Log.create({
        userId: user._id,
        actionType: 'LOGIN',
        module: 'Auth',
        details: `User (${user.name}) successfully authenticated using 2FA and logged into the system.`,
        ipAddress,
      });

      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        token: generateToken(user._id, sessionToken),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid 6-digit OTP code. Please try again.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Logout user & invalidate session
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.sessionToken = null;
      await user.save();

      const ipAddress = getClientIp(req);

      await Log.create({
        userId: user._id,
        actionType: 'LOGOUT',
        module: 'Auth',
        details: `User (${user.name}) logged out of the system.`,
        ipAddress,
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Change logged in user password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid current password' });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    // Create activity log
    await Log.create({
      userId: user._id,
      actionType: 'EDIT',
      module: 'User',
      details: `User (${user.name}) updated their account password.`,
      ipAddress: getClientIp(req),
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all users list
// @route   GET /api/auth/users
// @access  Private/AdminOnly
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new user
// @route   POST /api/auth/users
// @access  Private/AdminOnly
router.post('/users', protect, adminOnly, async (req, res) => {
  const { name, email, password, role, permissions } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'User',
      permissions: permissions || [],
    });

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'ADD',
      module: 'User',
      details: `Created user account: ${name} (${email}) with role: ${role || 'User'}`,
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a user
// @route   PUT /api/auth/users/:id
// @access  Private/AdminOnly
router.put('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.permissions = req.body.permissions !== undefined ? req.body.permissions : user.permissions;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'EDIT',
      module: 'User',
      details: `Updated user account: ${user.name} (${user.email}). New role: ${user.role}`,
      ipAddress: getClientIp(req),
    });

    res.json({
      success: true,
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      permissions: updatedUser.permissions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private/AdminOnly
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(req.params.id);

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'DELETE',
      module: 'User',
      details: `Deleted user account: ${user.name} (${user.email})`,
      ipAddress: getClientIp(req),
    });

    res.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Reset 2FA for a user (Admin Only)
// @route   POST /api/auth/users/:id/reset-2fa
// @access  Private/AdminOnly
router.post('/users/:id/reset-2fa', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'EDIT',
      module: 'User',
      details: `Admin (${req.user.name}) reset 2FA settings for user: ${user.name} (${user.email}).`,
      ipAddress: getClientIp(req),
    });

    res.json({ success: true, message: `Successfully reset 2FA settings for user "${user.name}".` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
