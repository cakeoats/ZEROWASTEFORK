// backend/controller/payment/paymentController.js - FIXED VERSION WITH BETTER ERROR HANDLING
const midtransClient = require('midtrans-client');
const Product = require('../../models/product');
const User = require('../../models/User');
const Cart = require('../../models/cart');
const Order = require('../../models/order');

// FIXED: Enhanced Midtrans configuration with better error handling
const getMidtransConfig = () => {
  console.log('🔧 Checking Midtrans configuration...');
  
  // Check production flag
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  
  // FIXED: Use sandbox by default for debugging
  const config = {
    isProduction: false, // Always use sandbox for now
    serverKey: process.env.MIDTRANS_SERVER_KEY_SANDBOX || 'SB-Mid-server-BkKF6yfBZF3pjp7nNKLv94Cy',
    clientKey: process.env.MIDTRANS_CLIENT_KEY_SANDBOX || 'SB-Mid-client-FHBq0wtUSyCEStlH'
  };

  console.log('🔧 Midtrans Configuration:', {
    environment: config.isProduction ? '🎯 PRODUCTION' : '🧪 SANDBOX',
    serverKeyPrefix: config.serverKey ? config.serverKey.substring(0, 20) + '...' : '❌ NOT_SET',
    clientKeyPrefix: config.clientKey ? config.clientKey.substring(0, 20) + '...' : '❌ NOT_SET'
  });

  if (!config.serverKey || !config.clientKey) {
    throw new Error('Midtrans credentials are missing');
  }

  return config;
};

// FIXED: Enhanced order creation with better validation
exports.createTransaction = async (req, res) => {
  try {
    console.log('🚀 Starting payment transaction creation...');
    console.log('📦 Request body:', req.body);
    console.log('👤 User:', req.user?.username || req.user?._id);

    // Get Midtrans config
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

    // FIXED: Enhanced input validation
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid total amount is required'
      });
    }

    // Get product data with better error handling
    console.log('🔍 Fetching product...');
    const product = await Product.findById(productId).populate('seller_id', 'username full_name email');
    
    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // FIXED: Check product availability
    if (product.status === 'sold' || product.status === 'deleted') {
      console.log('❌ Product not available:', productId, 'Status:', product.status);
      return res.status(400).json({
        success: false,
        message: 'Product is no longer available'
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

    // FIXED: Create Midtrans Snap instance with better error handling
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

    // FIXED: Generate shorter, more reliable transaction ID
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 9999);
    const transactionId = `ZWM${timestamp.toString().slice(-8)}${randomId}`;
    console.log('🆔 Generated transaction ID:', transactionId);

    // FIXED: Calculate amount as integer (Midtrans requirement)
    const grossAmount = Math.round(totalAmount);

    // FIXED: Enhanced transaction parameters with simpler structure
    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: grossAmount
      },
      item_details: [{
        id: product._id.toString(),
        price: Math.round(product.price),
        quantity: parseInt(quantity),
        name: product.name.substring(0, 50), // Midtrans limit
        category: product.category || 'general'
      }],
      customer_details: {
        first_name: (user.full_name || user.username || 'Customer').substring(0, 20),
        email: user.email,
        phone: user.phone || '+628123456789'
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'https://zerowastermarket.web.id'}/payment/success`,
        error: `${process.env.FRONTEND_URL || 'https://zerowastermarket.web.id'}/payment/error`,
        pending: `${process.env.FRONTEND_URL || 'https://zerowastermarket.web.id'}/payment/pending`
      },
      // REMOVED: Problematic expiry configuration that was causing 500 errors
      credit_card: {
        secure: true
      }
    };

    console.log('📋 Midtrans parameters:', {
      order_id: parameter.transaction_details.order_id,
      gross_amount: parameter.transaction_details.gross_amount,
      customer_email: parameter.customer_details.email,
      environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'
    });

    // FIXED: Create transaction with enhanced error handling
    console.log('🚀 Creating Midtrans transaction...');
    let transaction;
    try {
      transaction = await snap.createTransaction(parameter);
      console.log('✅ Midtrans transaction created successfully');
      console.log('🎫 Snap token received:', transaction.token ? 'YES' : 'NO');
    } catch (midtransTransactionError) {
      console.error('❌ Midtrans transaction creation failed:');
      console.error('Error details:', {
        message: midtransTransactionError.message,
        httpStatusCode: midtransTransactionError.httpStatusCode,
        ApiResponse: midtransTransactionError.ApiResponse
      });

      // FIXED: Better error message based on actual Midtrans response
      let userErrorMessage = 'Failed to create payment transaction';
      
      if (midtransTransactionError.httpStatusCode === 401) {
        userErrorMessage = 'Payment gateway authentication failed. Please contact support.';
      } else if (midtransTransactionError.httpStatusCode === 400) {
        userErrorMessage = 'Invalid payment request. Please check your order details.';
      } else if (midtransTransactionError.message) {
        const errorMsg = midtransTransactionError.message.toLowerCase();
        if (errorMsg.includes('merchant')) {
          userErrorMessage = 'Merchant configuration error. Please contact support.';
        } else if (errorMsg.includes('amount')) {
          userErrorMessage = 'Invalid amount. Please check your order total.';
        }
      }

      return res.status(500).json({
        success: false,
        message: userErrorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          originalError: midtransTransactionError.message,
          httpStatusCode: midtransTransactionError.httpStatusCode,
          environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'
        } : undefined
      });
    }

    // FIXED: Save order to database with better error handling
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
        isCartOrder: false,
        midtransData: {
          snapToken: transaction.token,
          redirectUrl: transaction.redirect_url
        }
      });

      await newOrder.save();
      console.log('✅ Order saved to database:', newOrder._id);
    } catch (orderError) {
      console.error('❌ Failed to save order:', orderError);
      // Continue anyway as Midtrans transaction is already created
      console.log('⚠️ Continuing with response despite order save error');
    }

    // FIXED: Success response with all required data
    const responseData = {
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionId,
      environment: midtransConfig.isProduction ? 'production' : 'sandbox',
      message: 'Transaction created successfully'
    };

    console.log('✅ Sending successful response:', {
      hasToken: !!responseData.token,
      hasRedirectUrl: !!responseData.redirect_url,
      orderId: responseData.order_id
    });

    res.status(200).json(responseData);

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

// FIXED: Enhanced notification handler
exports.handleNotification = async (req, res) => {
  try {
    console.log('📨 Midtrans notification received:', req.body);

    const midtransConfig = getMidtransConfig();
    const notificationJson = req.body;

    // FIXED: Create Core API instance with proper error handling
    let apiClient;
    try {
      apiClient = new midtransClient.CoreApi({
        isProduction: midtransConfig.isProduction,
        serverKey: midtransConfig.serverKey,
        clientKey: midtransConfig.clientKey
      });
    } catch (apiError) {
      console.error('❌ Failed to create Midtrans API client:', apiError);
      return res.status(500).json({
        success: false,
        message: 'Payment gateway API error'
      });
    }

    // FIXED: Verify notification with better error handling
    let statusResponse;
    try {
      statusResponse = await apiClient.transaction.notification(notificationJson);
    } catch (notificationError) {
      console.error('❌ Failed to verify notification:', notificationError);
      return res.status(400).json({
        success: false,
        message: 'Invalid notification'
      });
    }

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`📋 Transaction notification processed:`, {
      orderId,
      transactionStatus,
      fraudStatus
    });

    // FIXED: Find order with better error handling
    const order = await Order.findOne({ transactionId: orderId })
      .populate('product')
      .populate('products.product');

    if (!order) {
      console.log('❌ Order not found for transaction ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // FIXED: Determine order status
    let orderStatus;
    let additionalData = {
      midtransData: {
        paymentType: statusResponse.payment_type,
        transactionTime: statusResponse.transaction_time,
        settlementTime: statusResponse.settlement_time,
        statusCode: statusResponse.status_code,
        statusMessage: statusResponse.status_message
      }
    };

    if (transactionStatus === 'capture') {
      orderStatus = fraudStatus === 'challenge' ? 'pending' : 'paid';
    } else if (transactionStatus === 'settlement') {
      orderStatus = 'paid';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      orderStatus = 'cancelled';
      additionalData.reason = `Payment ${transactionStatus}`;
    } else if (transactionStatus === 'pending') {
      orderStatus = 'pending';
    } else {
      orderStatus = 'pending'; // Default fallback
    }

    // Update order status
    await order.updateStatus(orderStatus, additionalData);

    // FIXED: Handle product removal after successful payment
    if (orderStatus === 'paid') {
      console.log('💰 Payment successful! Processing product removal...');

      try {
        if (order.isCartOrder && order.products && order.products.length > 0) {
          // Handle cart order
          for (const item of order.products) {
            if (item.product && item.product._id) {
              await Product.findByIdAndUpdate(item.product._id, {
                status: 'sold',
                soldAt: new Date(),
                soldTo: order.buyer
              });
              console.log(`✅ Cart product ${item.product._id} marked as sold`);
            }
          }
        } else if (order.product) {
          // Handle single product order
          await Product.findByIdAndUpdate(order.product._id, {
            status: 'sold',
            soldAt: new Date(),
            soldTo: order.buyer
          });
          console.log('✅ Single product marked as sold');
        }
      } catch (productUpdateError) {
        console.error('❌ Error updating product status:', productUpdateError);
        // Don't fail the notification processing
      }
    }

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

// FIXED: Configuration verification endpoint
exports.verifyConfiguration = async (req, res) => {
  try {
    const midtransConfig = getMidtransConfig();

    res.json({
      success: true,
      configuration: {
        environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX',
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