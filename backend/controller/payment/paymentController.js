// backend/controller/payment/paymentController.js - UPDATED
const midtransClient = require('midtrans-client');
const Product = require('../../models/product');
const User = require('../../models/User');
const Cart = require('../../models/cart');
const Order = require('../../models/order');

// UPDATED: Dynamic Midtrans configuration dengan production keys
const getMidtransConfig = () => {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  const config = {
    isProduction: isProduction,
    serverKey: isProduction
      ? process.env.MIDTRANS_SERVER_KEY_PRODUCTION
      : process.env.MIDTRANS_SERVER_KEY_SANDBOX,
    clientKey: isProduction
      ? process.env.MIDTRANS_CLIENT_KEY_PRODUCTION
      : process.env.MIDTRANS_CLIENT_KEY_SANDBOX
  };

  // Enhanced logging untuk debugging
  console.log('🔧 Midtrans Configuration:', {
    environment: isProduction ? '🎯 PRODUCTION' : '🧪 SANDBOX',
    merchantId: process.env.MIDTRANS_MERCHANT_ID || 'NOT_SET',
    serverKeyPrefix: config.serverKey ? config.serverKey.substring(0, 15) + '...' : '❌ NOT_SET',
    clientKeyPrefix: config.clientKey ? config.clientKey.substring(0, 15) + '...' : '❌ NOT_SET',
    nodeEnv: process.env.NODE_ENV
  });

  // Validation
  if (!config.serverKey || !config.clientKey) {
    const missing = [];
    if (!config.serverKey) missing.push(isProduction ? 'MIDTRANS_SERVER_KEY_PRODUCTION' : 'MIDTRANS_SERVER_KEY_SANDBOX');
    if (!config.clientKey) missing.push(isProduction ? 'MIDTRANS_CLIENT_KEY_PRODUCTION' : 'MIDTRANS_CLIENT_KEY_SANDBOX');

    throw new Error(`Missing Midtrans environment variables: ${missing.join(', ')}`);
  }

  return config;
};

// UPDATED: Create transaction dengan validation yang lebih baik
exports.createTransaction = async (req, res) => {
  try {
    console.log('🚀 Starting payment transaction creation...');

    const midtransConfig = getMidtransConfig();
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    console.log('📋 Transaction Request:', {
      productId,
      quantity,
      userId: userId.toString(),
      environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'
    });

    // Validate input
    if (!productId) {
      console.log('❌ Product ID missing');
      return res.status(400).json({
        success: false,
        message: 'ID produk diperlukan'
      });
    }

    // Get product data
    console.log('🔍 Fetching product...');
    const product = await Product.findById(productId).populate('seller_id', 'username full_name email');
    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Create Midtrans Snap instance
    console.log('🔧 Creating Midtrans Snap instance...');
    let snap;
    try {
      snap = new midtransClient.Snap(midtransConfig);
      console.log('✅ Midtrans Snap instance created successfully');
    } catch (midtransError) {
      console.error('❌ Failed to create Midtrans instance:', midtransError);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize payment gateway',
        error: midtransError.message
      });
    }

    // Generate unique transaction ID dengan merchant ID
    const transactionId = `ZWM-${process.env.MIDTRANS_MERCHANT_ID || 'DEV'}-${Date.now()}-${userId.toString().substring(0, 5)}`;
    console.log('🆔 Generated transaction ID:', transactionId);

    // Calculate amount
    const grossAmount = Math.round(product.price * quantity);

    // Enhanced transaction parameters
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
        category: product.category || 'general',
        merchant_name: 'ZeroWasteMarket'
      }],
      customer_details: {
        first_name: (user.full_name || user.username || 'Customer').substring(0, 20),
        last_name: '',
        email: user.email,
        phone: user.phone || '',
        billing_address: {
          address: user.address || '',
          city: 'Jakarta', // Default city
          postal_code: '12345', // Default postal code
          country_code: 'IDN'
        }
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'https://zerowaste-frontend-eosin.vercel.app'}/payment/success`,
        error: `${process.env.FRONTEND_URL || 'https://zerowaste-frontend-eosin.vercel.app'}/payment/error`,
        pending: `${process.env.FRONTEND_URL || 'https://zerowaste-frontend-eosin.vercel.app'}/payment/pending`
      },
      credit_card: {
        secure: true,
        // Enable installment for production
        ...(midtransConfig.isProduction && {
          installment: {
            required: false,
            terms: {
              bni: [3, 6, 12],
              mandiri: [3, 6, 12],
              cimb: [3, 6, 12],
              bca: [3, 6, 12]
            }
          }
        })
      },
      expiry: {
        start_time: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' +0700',
        duration: 60,
        unit: 'minutes'
      },
      // Add custom field for tracking
      custom_field1: midtransConfig.isProduction ? 'PROD' : 'SANDBOX',
      custom_field2: product.category,
      custom_field3: user.username
    };

    console.log('📋 Midtrans parameters (sanitized):', {
      order_id: parameter.transaction_details.order_id,
      gross_amount: parameter.transaction_details.gross_amount,
      item_count: parameter.item_details.length,
      customer_email: parameter.customer_details.email,
      environment: parameter.custom_field1
    });

    // Create transaction in Midtrans
    console.log('🚀 Creating Midtrans transaction...');
    let transaction;
    try {
      transaction = await snap.createTransaction(parameter);
      console.log('✅ Midtrans transaction created successfully:', {
        token: transaction.token ? 'TOKEN_RECEIVED' : 'NO_TOKEN',
        redirect_url: transaction.redirect_url ? 'URL_RECEIVED' : 'NO_URL',
        environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'
      });
    } catch (midtransTransactionError) {
      console.error('❌ Midtrans transaction creation failed:', midtransTransactionError);

      // Enhanced error handling for production
      let errorMessage = 'Failed to create payment transaction';
      if (midtransTransactionError.message) {
        if (midtransTransactionError.message.includes('401')) {
          errorMessage = 'Payment gateway authentication failed';
        } else if (midtransTransactionError.message.includes('400')) {
          errorMessage = 'Invalid payment request data';
        }
      }

      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: midtransTransactionError.message,
        environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'
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
        paymentMethod: 'midtrans',
        // Add production flag
        environment: midtransConfig.isProduction ? 'production' : 'sandbox'
      });

      await newOrder.save();
      console.log('✅ Order saved to database:', newOrder._id);
    } catch (orderError) {
      console.error('❌ Failed to save order:', orderError);
      // Don't return error here as Midtrans transaction is already created
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
      error: error.message,
      environment: process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'production' : 'sandbox'
    });
  }
};

// UPDATED: Handle notification dengan validation yang lebih baik
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
      fraudStatus,
      environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'
    });

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

    // Map transaction status to order status
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

    // Update all orders with this transaction ID
    for (const order of orders) {
      order.status = orderStatus;
      order.paymentDetails = {
        transactionStatus,
        fraudStatus,
        updatedAt: new Date(),
        environment: midtransConfig.isProduction ? 'production' : 'sandbox'
      };
      await order.save();
    }

    console.log(`✅ Updated ${orders.length} orders to status: ${orderStatus}`);

    // Return success to Midtrans
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('💥 Notification handling error:', error);

    res.status(500).json({
      success: false,
      message: 'Error handling notification',
      error: error.message
    });
  }
};

// NEW: Configuration verification endpoint
exports.verifyConfiguration = async (req, res) => {
  try {
    const midtransConfig = getMidtransConfig();

    res.json({
      success: true,
      configuration: {
        environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX',
        merchantId: process.env.MIDTRANS_MERCHANT_ID || 'NOT_SET',
        hasServerKey: !!midtransConfig.serverKey,
        hasClientKey: !!midtransConfig.clientKey,
        serverKeyPrefix: midtransConfig.serverKey ? midtransConfig.serverKey.substring(0, 15) + '...' : 'NOT_SET',
        clientKeyPrefix: midtransConfig.clientKey ? midtransConfig.clientKey.substring(0, 15) + '...' : 'NOT_SET',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
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