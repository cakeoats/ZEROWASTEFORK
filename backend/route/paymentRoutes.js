const express = require('express');
const router = express.Router();
const { createTransaction, createCartTransaction, handleNotification } = require('../controller/payment/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Routes that require authentication
router.post('/create-transaction', protect, createTransaction);
router.post('/create-cart-transaction', protect, createCartTransaction);

// Webhook for Midtrans notifications (no auth required)
router.post('/notification', handleNotification);

module.exports = router;