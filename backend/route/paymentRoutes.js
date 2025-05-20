const express = require('express');
const router = express.Router();
const { createTransaction } = require('../controller/payment/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Route untuk membuat transaksi Midtrans
router.post('/create-transaction', protect, createTransaction);

// Tambahkan route lainnya jika diperlukan
// Contoh: router.get('/status/:orderId', protect, getTransactionStatus);

module.exports = router;