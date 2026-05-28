const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');
const { protect, adminOnly } = require('../middleware/auth');

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
      // Generate a new sessionToken - this invalidates any other active sessions
      const sessionToken = generateSessionToken();
      user.sessionToken = sessionToken;
      await user.save();

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
      res.status(401).json({ success: false, message: 'Invalid email or password' });
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
    });

    res.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
