const midtransClient = require('midtrans-client');
const Product = require('../../models/product');
const User = require('../../models/User');
const Cart = require('../../models/cart');
const Order = require('../../models/order');

// For single product transactions
exports.createTransaction = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    // Validate input
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
        gross_amount: product.price * quantity
      },
      item_details: [{
        id: product._id,
        price: product.price,
        quantity: quantity,
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

    // Create an order in our database
    const newOrder = new Order({
      buyer: userId,
      seller: product.seller_id,
      product: product._id,
      quantity: quantity,
      totalAmount: product.price * quantity,
      status: 'pending'
    });

    await newOrder.save();

    // Kirim token ke frontend
    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionId,
      orderId: newOrder._id
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

// For cart-based transactions (multiple products)
exports.createCartTransaction = async (req, res) => {
  try {
    const userId = req.user._id;

    // Gunakan data dari request body yang dikirim frontend
    const { items, totalAmount } = req.body;

    console.log('Cart Transaction Request Data:', req.body);

    // Validasi data request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart items required and must be a non-empty array'
      });
    }

    if (!totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Total amount is required'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ambil informasi produk dari database
    const productDetails = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`
        });
      }

      productDetails.push({
        product: product,
        quantity: item.quantity
      });
    }

    // Create Midtrans Snap instance
    let snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    // Create a unique transaction ID
    const transactionId = `CART-${Date.now()}-${userId.toString().substring(0, 5)}`;

    // Prepare Midtrans parameters
    const itemDetails = productDetails.map(item => ({
      id: item.product._id.toString(),
      price: item.product.price,
      quantity: item.quantity,
      name: item.product.name.substring(0, 50) // Midtrans limits name length
    }));

    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: parseInt(totalAmount)
      },
      item_details: itemDetails,
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

    console.log('Creating Midtrans cart transaction with parameters:', parameter);

    // Create transaction in Midtrans
    const transaction = await snap.createTransaction(parameter);

    console.log('Midtrans cart transaction created:', transaction);

    // Group items by seller
    const sellerOrders = {};

    for (const item of productDetails) {
      const sellerId = item.product.seller_id.toString();

      if (!sellerOrders[sellerId]) {
        sellerOrders[sellerId] = {
          items: [],
          totalAmount: 0
        };
      }

      sellerOrders[sellerId].items.push({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      });

      sellerOrders[sellerId].totalAmount += item.product.price * item.quantity;
    }

    // Create an order for each seller
    const orderIds = [];

    for (const [sellerId, orderData] of Object.entries(sellerOrders)) {
      const newOrder = new Order({
        buyer: userId,
        seller: sellerId,
        products: orderData.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: orderData.totalAmount,
        status: 'pending',
        transactionId: transactionId
      });

      await newOrder.save();
      orderIds.push(newOrder._id);
    }

    // Send token to frontend
    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionId,
      orderIds: orderIds
    });

  } catch (error) {
    console.error('Midtrans cart payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cart payment transaction',
      error: error.message
    });
  }
};

// Handle webhook notifications from Midtrans
exports.handleNotification = async (req, res) => {
  try {
    const notificationJson = req.body;

    // Create Core API instance
    let apiClient = new midtransClient.CoreApi({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    // Verify notification
    const statusResponse = await apiClient.transaction.notification(notificationJson);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`);

    // Find orders with this transaction ID
    const orders = await Order.find({
      $or: [
        { transactionId: orderId },
        { _id: orderId }
      ]
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orders not found for this transaction ID'
      });
    }

    // Sample fraud status handling
    let orderStatus;

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        // TODO: handle challenge transaction
        orderStatus = 'pending';
      } else if (fraudStatus == 'accept') {
        // TODO: handle successful transaction
        orderStatus = 'paid';
      }
    } else if (transactionStatus == 'settlement') {
      // TODO: handle successful transaction
      orderStatus = 'paid';
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      // TODO: handle failed transaction
      orderStatus = 'cancelled';
    } else if (transactionStatus == 'pending') {
      // TODO: handle pending transaction
      orderStatus = 'pending';
    }

    // Update all orders with this transaction ID
    for (const order of orders) {
      order.status = orderStatus;
      await order.save();
    }

    // Return success to Midtrans
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error handling Midtrans notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error handling notification',
      error: error.message
    });
  }
};