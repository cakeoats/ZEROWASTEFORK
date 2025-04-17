const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Periksa apakah header authorization ada dan dimulai dengan 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('No token provided or invalid format');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Ambil token dari header
  const token = authHeader.split(' ')[1];

  // Periksa apakah token kosong
  if (!token) {
    console.warn('Empty token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`Token verified for user ID: ${decoded.id}`);

    // Cari user berdasarkan ID dari token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.warn(`User not found for ID: ${decoded.id}`);
      return res.status(401).json({ message: 'User not found' });
    }

    // Tambahkan user ke request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err.message);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { protect };