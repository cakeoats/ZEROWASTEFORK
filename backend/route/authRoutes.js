const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware'); // Impor protect, bukan authenticateUser

// login dan register
router.post('/register', authController.register);
router.post('/login', authController.login);

//forget & reset pasword
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

//resend emil
router.post('/resend-verification', authController.resendVerificationEmail);

// Email verification
router.get('/verify-email', authController.verifyEmail);

// Protected profile route
router.get('/profile', protect, (req, res) => { // Gunakan protect, bukan authenticateUser
  const { username, email, full_name, createdAt } = req.user;

  res.json({
    message: `Welcome to your profile, ${full_name || username}!`,
    user: {
      username,
      email,
      full_name,
      joinedSince: createdAt,
    }
  });
});

module.exports = router;