const midtransClient = require('midtrans-client');
const Product = require('../../models/product');
const User = require('../../models/User');
const Cart = require('../../models/cart');
const Order = require('../../models/order');

// For single product transactions
exports.createTransaction = async (req, res) => {
  try {
    // Debug log untuk environment variables
    console.log('Environment Variables Check:', {
      MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY ? `SET (${process.env.MIDTRANS_SERVER_KEY.substring(0, 20)}...)` : 'NOT SET',
      MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY ? `SET (${process.env.MIDTRANS_CLIENT_KEY.substring(0, 20)}...)` : 'NOT SET',
      MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION,
      NODE_ENV: process.env.NODE_ENV,
      FRONTEND_URL: process.env.FRONTEND_URL
    });

    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    console.log('Request data:', { productId, quantity, userId: userId.toString() });

    // Validate input
    if (!productId) {
      console.log('❌ Product ID missing');
      return res.status(400).json({
        success: false,
        message: 'ID produk diperlukan'
      });
    }

    // Check if Midtrans keys are available
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      console.error('❌ Midtrans API keys not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured properly. Please contact support.'
      });
    }

    // Ambil data produk dari database
    console.log('🔍 Fetching product...');
    const product = await Product.findById(productId);
    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }
    console.log('✅ Product found:', { id: product._id, name: product.name, price: product.price });

    // Ambil data user
    console.log('🔍 Fetching user...');
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    console.log('✅ User found:', { id: user._id, username: user.username, email: user.email });

    // Buat instance Snap dari Midtrans
    console.log('🔧 Creating Midtrans Snap instance...');
    let snap;
    try {
      snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY
      });
      console.log('✅ Midtrans Snap instance created successfully');
    } catch (midtransError) {
      console.error('❌ Failed to create Midtrans instance:', midtransError);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize payment gateway',
        error: midtransError.message
      });
    }

    // Buat ID transaksi unik
    const transactionId = `ORDER-${Date.now()}-${userId.toString().substring(0, 5)}`;
    console.log('🆔 Generated transaction ID:', transactionId);

    // Parameter untuk Midtrans
    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: product.price * quantity
      },
      item_details: [{
        id: product._id.toString(),
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
        finish: `${process.env.FRONTEND_URL || 'https://frontend-a61sij8us-dafiibras-projects.vercel.app'}/payment/success`,
        error: `${process.env.FRONTEND_URL || 'https://frontend-a61sij8us-dafiibras-projects.vercel.app'}/payment/error`,
        pending: `${process.env.FRONTEND_URL || 'https://frontend-a61sij8us-dafiibras-projects.vercel.app'}/payment/pending`
      }
    };

    console.log('📋 Midtrans parameters:', JSON.stringify(parameter, null, 2));

    // Buat transaksi di Midtrans
    console.log('🚀 Creating Midtrans transaction...');
    const transaction = await snap.createTransaction(parameter);

    console.log('✅ Midtrans transaction created successfully:', {
      token: transaction.token ? 'TOKEN_RECEIVED' : 'NO_TOKEN',
      redirect_url: transaction.redirect_url ? 'URL_RECEIVED' : 'NO_URL'
    });

    // Create an order in our database
    console.log('💾 Saving order to database...');
    const newOrder = new Order({
      buyer: userId,
      seller: product.seller_id,
      product: product._id,
      quantity: quantity,
      totalAmount: product.price * quantity,
      status: 'pending'
    });

    await newOrder.save();
    console.log('✅ Order saved to database:', newOrder._id);

    // Kirim token ke frontend
    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionId,
      orderId: newOrder._id
    });

    console.log('✅ Response sent to frontend successfully');

  } catch (error) {
    console.error('💥 Payment Controller Error Details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    res.status(500).json({
      success: false,
      message: 'Gagal membuat transaksi pembayaran',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error'
    });
  }
};

// For cart-based transactions (multiple products)
exports.createCartTransaction = async (req, res) => {
  try {
    console.log('🛒 Starting cart transaction...');
    
    const userId = req.user._id;
    const { items, totalAmount } = req.body;

    console.log('Cart Transaction Request Data:', {
      userId: userId.toString(),
      itemsCount: items?.length || 0,
      totalAmount,
      items: items
    });

    // Debug environment variables
    console.log('Environment Check for Cart:', {
      MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY ? 'SET' : 'NOT SET',
      MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY ? 'SET' : 'NOT SET'
    });

    // Validasi data request
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('❌ Invalid items data');
      return res.status(400).json({
        success: false,
        message: 'Cart items required and must be a non-empty array'
      });
    }

    if (!totalAmount) {
      console.log('❌ Total amount missing');
      return res.status(400).json({
        success: false,
        message: 'Total amount is required'
      });
    }

    // Check Midtrans keys
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      console.error('❌ Midtrans keys not configured for cart transaction');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found for cart transaction');
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
        console.log('❌ Product not found in cart:', item.productId);
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

    console.log('✅ All products found for cart transaction');

    // Create Midtrans Snap instance
    let snap;
    try {
      snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY
      });
      console.log('✅ Midtrans Snap instance created for cart');
    } catch (midtransError) {
      console.error('❌ Failed to create Midtrans instance for cart:', midtransError);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize payment gateway',
        error: midtransError.message
      });
    }

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
        finish: `${process.env.FRONTEND_URL || 'https://frontend-a61sij8us-dafiibras-projects.vercel.app'}/payment/success`,
        error: `${process.env.FRONTEND_URL || 'https://frontend-a61sij8us-dafiibras-projects.vercel.app'}/payment/error`,
        pending: `${process.env.FRONTEND_URL || 'https://frontend-a61sij8us-dafiibras-projects.vercel.app'}/payment/pending`
      }
    };

    console.log('Creating Midtrans cart transaction with parameters:', JSON.stringify(parameter, null, 2));

    // Create transaction in Midtrans
    const transaction = await snap.createTransaction(parameter);

    console.log('Midtrans cart transaction created:', {
      token: transaction.token ? 'TOKEN_RECEIVED' : 'NO_TOKEN',
      redirect_url: transaction.redirect_url ? 'URL_RECEIVED' : 'NO_URL'
    });

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

    console.log('✅ Cart orders saved to database:', orderIds);

    // Send token to frontend
    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionId,
      orderIds: orderIds
    });

    console.log('✅ Cart transaction response sent successfully');

  } catch (error) {
    console.error('💥 Cart Payment Error Details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create cart payment transaction',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error'
    });
  }
};

// Handle webhook notifications from Midtrans
exports.handleNotification = async (req, res) => {
  try {
    console.log('📨 Midtrans notification received:', req.body);
    
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

    console.log(`📋 Transaction notification processed - Order ID: ${orderId}, Status: ${transactionStatus}, Fraud: ${fraudStatus}`);

    // Find orders with this transaction ID
    const orders = await Order.find({
      $or: [
        { transactionId: orderId },
        { _id: orderId }
      ]
    });

    if (orders.length === 0) {
      console.log('❌ No orders found for transaction ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Orders not found for this transaction ID'
      });
    }

    // Sample fraud status handling
    let orderStatus;

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        orderStatus = 'pending';
      } else if (fraudStatus == 'accept') {
        orderStatus = 'paid';
      }
    } else if (transactionStatus == 'settlement') {
      orderStatus = 'paid';
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      orderStatus = 'cancelled';
    } else if (transactionStatus == 'pending') {
      orderStatus = 'pending';
    }

    // Update all orders with this transaction ID
    for (const order of orders) {
      order.status = orderStatus;
      await order.save();
    }

    console.log(`✅ Updated ${orders.length} orders to status: ${orderStatus}`);

    // Return success to Midtrans
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('💥 Notification handling error:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error handling notification',
      error: error.message
    });
  }
};