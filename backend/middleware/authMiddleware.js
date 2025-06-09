const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  console.log('Auth middleware running');
  const authHeader = req.headers.authorization;

  console.log('Auth header received:', authHeader);

  // Check if authorization header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('No token provided or invalid format');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Get token from header
  const token = authHeader.split(' ')[1];

  // Check if token is empty
  if (!token) {
    console.warn('Empty token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token with jwt secret
    console.log('Attempting to verify token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`Token verified for user ID: ${decoded.id}`);

    // Find user by ID from token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.warn(`User not found for ID: ${decoded.id}`);
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err.message);
    console.error('Token causing error:', token);
    return res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
};

module.exports = { protect };