const midtransClient = require('midtrans-client');
const Product = require('../../models/product');
const User = require('../../models/User');

exports.createTransaction = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;
    
    // Validasi input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'ID produk diperlukan'
      });
    }
    
    // Ambil data produk dari database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }
    
    // Ambil data user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    // Buat instance Snap dari Midtrans
    let snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });
    
    // Buat ID transaksi unik
    const transactionId = `ORDER-${Date.now()}-${userId.toString().substring(0, 5)}`;
    
    // Parameter untuk Midtrans
    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: product.price
      },
      item_details: [{
        id: product._id,
        price: product.price,
        quantity: 1,
        name: product.name.substring(0, 50) // Midtrans membatasi panjang nama
      }],
      customer_details: {
        first_name: user.full_name || user.username,
        email: user.email,
        phone: user.phone || ''
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
        error: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/error`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/pending`
      }
    };
    
    console.log('Creating Midtrans transaction with parameters:', parameter);
    
    // Buat transaksi di Midtrans
    const transaction = await snap.createTransaction(parameter);
    
    console.log('Midtrans transaction created:', transaction);
    
    // Kirim token ke frontend
    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionId
    });
    
  } catch (error) {
    console.error('Midtrans payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat transaksi pembayaran',
      error: error.message
    });
  }
};