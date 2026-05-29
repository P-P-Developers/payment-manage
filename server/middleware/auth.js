const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT Token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature and expiry
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Block temporary 2FA tokens from standard protected routes
      if (decoded.isTemp2FA) {
        return res.status(401).json({ success: false, message: 'Not authorized, 2FA verification required' });
      }

      // Get user from DB
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      // Single-session check: verify sessionToken matches DB
      if (decoded.sessionToken && req.user.sessionToken !== decoded.sessionToken) {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Your account was logged in from another device.',
        });
      }

      next();
    } catch (error) {
      console.error('Auth protect error:', error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Protect temporary routes for 2FA Setup/Verify
const protectTemp = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.isTemp2FA) {
        return res.status(401).json({ success: false, message: 'Invalid token, 2FA temporary token required' });
      }

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Auth protectTemp error:', error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Admin Only restriction
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Admin role required' });
  }
};

// Permission check helper (Admins bypass all permission checks)
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.permissions.includes(permission))) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: `Access denied: You do not have the required permission: '${permission}'`,
      });
    }
  };
};

module.exports = { protect, protectTemp, adminOnly, hasPermission };
