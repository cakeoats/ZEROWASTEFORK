// backend/middleware/authMiddleware.js - FIXED VERSION
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // FIXED: Enhanced token extraction from multiple sources
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔑 Token found in Authorization header');
    } else if (req.headers.authorization) {
      // Handle case where token is sent without "Bearer " prefix
      token = req.headers.authorization;
      console.log('🔑 Token found in Authorization header (without Bearer prefix)');
    }

    if (!token) {
      console.log('❌ No token provided in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    try {
      // FIXED: Enhanced token verification with better error handling
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔓 Token decoded successfully:', {
        userId: decoded.id,
        username: decoded.username,
        email: decoded.email,
        iat: new Date(decoded.iat * 1000).toISOString(),
        exp: new Date(decoded.exp * 1000).toISOString()
      });

      // FIXED: Enhanced user lookup and verification
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.log('❌ User not found in database for token:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      console.log('✅ User authenticated successfully:', {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      });

      // FIXED: Check if user's email is verified (if verification is required)
      if (!user.isVerified) {
        console.log('⚠️ User email not verified:', user.email);
        return res.status(401).json({
          success: false,
          message: 'Email not verified. Please verify your email before proceeding.'
        });
      }

      // FIXED: Attach complete user object to request
      req.user = {
        _id: user._id,
        id: user._id, // Include both _id and id for compatibility
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      console.log('👤 User object attached to request:', {
        _id: req.user._id.toString(),
        username: req.user.username,
        email: req.user.email
      });

      next();
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError.message);

      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, invalid token',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token verification failed',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
    }
  } catch (err) {
    console.error('💥 Auth middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// FIXED: Alternative authentication method for testing/debugging
const authenticateUser = async (req, res, next) => {
  console.log('🔍 Alternative auth method called');
  return protect(req, res, next);
};

// FIXED: Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (user && user.isVerified) {
          req.user = {
            _id: user._id,
            id: user._id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            address: user.address,
            bio: user.bio,
            profilePicture: user.profilePicture,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          };
          console.log('👤 Optional auth: User authenticated');
        }
      } catch (error) {
        console.log('⚠️ Optional auth: Token invalid, proceeding without auth');
      }
    } else {
      console.log('ℹ️ Optional auth: No token provided, proceeding without auth');
    }

    next();
  } catch (err) {
    console.error('💥 Optional auth error:', err);
    next(); // Continue without authentication
  }
};

// FIXED: Admin check middleware (if needed)
const isAdmin = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Not authorized, admin access required'
    });
  } catch (err) {
    console.error('💥 Admin check error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin verification'
    });
  }
};

module.exports = {
  protect,
  authenticateUser, // Alias for protect
  optionalAuth,
  isAdmin
};