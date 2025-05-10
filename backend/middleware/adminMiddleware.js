const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

// Middleware to protect admin routes
const protect = async (req, res, next) => {
  let token;

  // Check if the request has an authorization header with Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      // Get admin from the token
      const admin = await Admin.findById(decoded.id).select('-password');

      if (!admin) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      // Set admin in request object
      req.admin = admin;
      
      next();
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  // If admin object exists in request, proceed
  if (req.admin) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, isAdmin };