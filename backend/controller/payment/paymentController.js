// backend/controller/payment/paymentController.js - FIXED EXPIRY TIME ISSUE
const midtransClient = require('midtrans-client');
const Product = require('../../models/product');
const User = require('../../models/User');
const Cart = require('../../models/cart');
const Order = require('../../models/order');

// FIXED: Improved Midtrans configuration
const getMidtransConfig = () => {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  console.log('🔧 Environment Variables Check:', {
    MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION,
    NODE_ENV: process.env.NODE_ENV
  });

  // Use SANDBOX keys consistently (since production keys are not properly set)
  const config = {
    isProduction: false, // FORCE SANDBOX for now
    serverKey: process.env.MIDTRANS_SERVER_KEY_SANDBOX,
    clientKey: process.env.MIDTRANS_CLIENT_KEY_SANDBOX
  };

  console.log('🔧 Final Midtrans Configuration:', {
    environment: config.isProduction ? '🎯 PRODUCTION' : '🧪 SANDBOX',
    serverKeyPrefix: config.serverKey ? config.serverKey.substring(0, 20) + '...' : '❌ NOT_SET',
    clientKeyPrefix: config.clientKey ? config.clientKey.substring(0, 20) + '...' : '❌ NOT_SET'
  });

  // Enhanced validation
  if (!config.serverKey || !config.clientKey) {
    const missing = [];
    if (!config.serverKey) missing.push('MIDTRANS_SERVER_KEY_SANDBOX');
    if (!config.clientKey) missing.push('MIDTRANS_CLIENT_KEY_SANDBOX');
    throw new Error(`Missing Midtrans credentials: ${missing.join(', ')}`);
  }

  return config;
};

// FIXED: Helper function to get proper timezone time
const getIndonesianTime = () => {
  // Get current time in Indonesian timezone (UTC+7)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const indonesianTime = new Date(utc + (7 * 3600000)); // UTC+7
  return indonesianTime;
};

// FIXED: Helper function to format time for Midtrans
const formatMidtransTime = (date) => {
  // Format: YYYY-MM-DD HH:mm:ss +0700
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0700`;
};

// FIXED: Create transaction with proper expiry time handling
exports.createTransaction = async (req, res) => {
  try {
    console.log('🚀 Starting payment transaction creation...');
    console.log('📦 Request body:', req.body);
    console.log('👤 User:', req.user?.username || req.user?._id);

    let midtransConfig;
    try {
      midtransConfig = getMidtransConfig();
    } catch (configError) {
      console.error('❌ Midtrans configuration error:', configError.message);
      return res.status(500).json({
        success: false,
        message: 'Payment gateway configuration error',
        error: configError.message
      });
    }

    const { productId, quantity = 1, totalAmount } = req.body;
    const userId = req.user._id;

    console.log('📋 Transaction Request:', {
      productId,
      quantity,
      totalAmount,
      userId: userId.toString(),
      environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'
    });

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Get product data
    console.log('🔍 Fetching product...');
    const product = await Product.findById(productId).populate('seller_id', 'username full_name email');
    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create Midtrans Snap instance
    console.log('🔧 Creating Midtrans Snap instance...');
    let snap;
    try {
      snap = new midtransClient.Snap({
        isProduction: midtransConfig.isProduction,
        serverKey: midtransConfig.serverKey,
        clientKey: midtransConfig.clientKey
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

    // Generate unique transaction ID
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 1000);
    const transactionId = `ZWM-${timestamp}-${randomId}`;
    console.log('🆔 Generated transaction ID:', transactionId);

    // Calculate amount - ensure it's an integer
    const grossAmount = Math.round(totalAmount || (product.price * quantity));

    // FIXED: Proper time handling for Indonesian timezone
    const currentTime = getIndonesianTime();
    const expiryTime = new Date(currentTime.getTime() + (60 * 60 * 1000)); // Add 1 hour

    console.log('⏰ Time Details:', {
      currentTimeUTC: new Date().toISOString(),
      currentTimeIndonesia: formatMidtransTime(currentTime),
      expiryTimeIndonesia: formatMidtransTime(expiryTime),
      timeDifferenceMinutes: (expiryTime.getTime() - currentTime.getTime()) / (1000 * 60)
    });

    // FIXED: Enhanced transaction parameters with proper expiry handling
    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: grossAmount
      },
      item_details: [{
        id: product._id.toString(),
        price: Math.round(product.price),
        quantity: parseInt(quantity),
        name: product.name.substring(0, 50), // Midtrans name limit
        category: product.category || 'general'
      }],
      customer_details: {
        first_name: (user.full_name || user.username || 'Customer').substring(0, 20),
        last_name: '',
        email: user.email,
        phone: user.phone || '+628123456789',
        billing_address: {
          address: user.address || 'Jakarta',
          city: 'Jakarta',
          postal_code: '12345',
          country_code: 'IDN'
        }
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'https://zerowaste-frontend-eosin.vercel.app'}/payment/success`,
        error: `${process.env.FRONTEND_URL || 'https://zerowaste-frontend-eosin.vercel.app'}/payment/error`,
        pending: `${process.env.FRONTEND_URL || 'https://zerowaste-frontend-eosin.vercel.app'}/payment/pending`
      },
      credit_card: {
        secure: true
      },
      // FIXED: Proper expiry time format
      expiry: {
        start_time: formatMidtransTime(currentTime),
        duration: 60, // 60 minutes
        unit: 'minutes'
      }
    };

    console.log('📋 Midtrans parameters:', {
      order_id: parameter.transaction_details.order_id,
      gross_amount: parameter.transaction_details.gross_amount,
      customer_email: parameter.customer_details.email,
      start_time: parameter.expiry.start_time,
      expiry_duration: `${parameter.expiry.duration} ${parameter.expiry.unit}`,
      environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'
    });

    // Create transaction with better error handling
    console.log('🚀 Creating Midtrans transaction...');
    let transaction;
    try {
      transaction = await snap.createTransaction(parameter);
      console.log('✅ Midtrans transaction created successfully');
      console.log('🎫 Token received:', transaction.token ? 'YES' : 'NO');
      console.log('🔗 Redirect URL received:', transaction.redirect_url ? 'YES' : 'NO');
    } catch (midtransTransactionError) {
      console.error('❌ Midtrans transaction creation failed:');
      console.error('Error message:', midtransTransactionError.message);
      console.error('Full error:', midtransTransactionError);

      // Enhanced error messages based on Midtrans API response
      let userErrorMessage = 'Failed to create payment transaction';

      if (midtransTransactionError.message) {
        const errorMsg = midtransTransactionError.message.toLowerCase();

        if (errorMsg.includes('expiry')) {
          userErrorMessage = 'Payment expiry time error. Please try again.';
          console.error('⏰ Expiry time issue detected. Current parameter:', parameter.expiry);
        } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          userErrorMessage = 'Payment gateway authentication failed. Please contact support.';
        } else if (errorMsg.includes('400') || errorMsg.includes('bad request')) {
          userErrorMessage = 'Invalid payment request. Please check your order details.';
        } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
          userErrorMessage = 'Payment method not allowed. Please try a different payment method.';
        }
      }

      return res.status(500).json({
        success: false,
        message: userErrorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          originalError: midtransTransactionError.message,
          environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX',
          serverKeyPrefix: midtransConfig.serverKey.substring(0, 20) + '...',
          timeDetails: {
            currentTime: formatMidtransTime(currentTime),
            expiryTime: formatMidtransTime(expiryTime)
          }
        } : undefined
      });
    }

    // Save order to database
    console.log('💾 Saving order to database...');
    try {
      const newOrder = new Order({
        buyer: userId,
        seller: product.seller_id._id || product.seller_id,
        product: product._id,
        quantity: parseInt(quantity),
        totalAmount: grossAmount,
        status: 'pending',
        transactionId: transactionId,
        paymentMethod: 'midtrans'
      });

      await newOrder.save();
      console.log('✅ Order saved to database:', newOrder._id);
    } catch (orderError) {
      console.error('❌ Failed to save order:', orderError);
      // Continue anyway as Midtrans transaction is already created
    }

    // Success response
    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionId,
      environment: midtransConfig.isProduction ? 'production' : 'sandbox',
      message: 'Transaction created successfully'
    });

    console.log('✅ Transaction response sent successfully');

  } catch (error) {
    console.error('💥 Payment Controller Error:', {
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// FIXED: Cart transaction handler
exports.createCartTransaction = async (req, res) => {
  try {
    console.log('🛒 Creating cart transaction...');
    console.log('📦 Request body:', req.body);

    const { items, totalAmount } = req.body;
    const userId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart items are required'
      });
    }

    // For now, process first item (can be enhanced later for multiple items)
    const firstItem = items[0];

    // Redirect to single product transaction
    req.body = {
      productId: firstItem.productId,
      quantity: firstItem.quantity || 1,
      totalAmount: totalAmount
    };

    console.log('🔄 Processing cart as single transaction:', req.body);

    // Call the single transaction handler
    return await exports.createTransaction(req, res);

  } catch (error) {
    console.error('💥 Cart transaction error:', error);

    res.status(500).json({
      success: false,
      message: 'Cart payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Handle notification (unchanged)
exports.handleNotification = async (req, res) => {
  try {
    console.log('📨 Midtrans notification received:', req.body);

    const midtransConfig = getMidtransConfig();
    const notificationJson = req.body;

    // Create Core API instance
    let apiClient = new midtransClient.CoreApi(midtransConfig);

    // Verify notification
    const statusResponse = await apiClient.transaction.notification(notificationJson);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`📋 Transaction notification processed:`, {
      orderId,
      transactionStatus,
      fraudStatus
    });

    // Find order
    const order = await Order.findOne({ transactionId: orderId });

    if (!order) {
      console.log('❌ Order not found for transaction ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    let orderStatus;
    if (transactionStatus == 'capture') {
      orderStatus = fraudStatus == 'challenge' ? 'pending' : 'paid';
    } else if (transactionStatus == 'settlement') {
      orderStatus = 'paid';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      orderStatus = 'cancelled';
    } else if (transactionStatus == 'pending') {
      orderStatus = 'pending';
    }

    order.status = orderStatus;
    await order.save();

    console.log(`✅ Order updated to status: ${orderStatus}`);

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('💥 Notification handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Error handling notification'
    });
  }
};

// Configuration verification
exports.verifyConfiguration = async (req, res) => {
  try {
    const midtransConfig = getMidtransConfig();

    res.json({
      success: true,
      configuration: {
        environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX',
        hasServerKey: !!midtransConfig.serverKey,
        hasClientKey: !!midtransConfig.clientKey,
        serverKeyPrefix: midtransConfig.serverKey ? midtransConfig.serverKey.substring(0, 20) + '...' : 'NOT_SET',
        clientKeyPrefix: midtransConfig.clientKey ? midtransConfig.clientKey.substring(0, 20) + '...' : 'NOT_SET',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        timeZone: 'Asia/Jakarta (UTC+7)'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Configuration verification failed',
      error: error.message
    });
  }
};