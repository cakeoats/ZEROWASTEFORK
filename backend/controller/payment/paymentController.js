// backend/controller/payment/paymentController.js - COMPLETELY FIXED
const midtransClient = require('midtrans-client');
const Product = require('../../models/product');
const User = require('../../models/User');
const Cart = require('../../models/cart');
const Order = require('../../models/order');

// FIXED: Proper Midtrans configuration
const getMidtransConfig = () => {
  console.log('🔧 Checking Midtrans configuration...');

  // PERBAIKAN: Gunakan environment variables dengan fallback yang benar
  const config = {
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY_SANDBOX,
    clientKey: process.env.MIDTRANS_CLIENT_KEY_SANDBOX
  };

  // PERBAIKAN: Jika env variables tidak ada, gunakan hardcoded (untuk testing)
  if (!config.serverKey) {
    console.warn('⚠️ MIDTRANS_SERVER_KEY_SANDBOX tidak ditemukan, menggunakan default');
    config.serverKey = 'SB-Mid-server-BkKF6yfBZF3pjp7nNKLv94Cy';
  }

  if (!config.clientKey) {
    console.warn('⚠️ MIDTRANS_CLIENT_KEY_SANDBOX tidak ditemukan, menggunakan default');
    config.clientKey = 'SB-Mid-client-FHBq0wtUSyCEStlH';
  }

  console.log('🔧 Midtrans Configuration:', {
    environment: '🧪 SANDBOX',
    serverKeyExists: !!config.serverKey,
    clientKeyExists: !!config.clientKey,
    serverKeyPrefix: config.serverKey ? config.serverKey.substring(0, 20) + '...' : '❌ NOT_SET',
    clientKeyPrefix: config.clientKey ? config.clientKey.substring(0, 20) + '...' : '❌ NOT_SET'
  });

  return config;
};

// FIXED: Create transaction with proper error handling and validation
exports.createTransaction = async (req, res) => {
  try {
    console.log('🚀 Starting payment transaction creation...');
    console.log('📦 Request body:', req.body);
    console.log('👤 User:', req.user?.username || req.user?._id);

    // Get and validate Midtrans config
    const midtransConfig = getMidtransConfig();

    if (!midtransConfig.serverKey || !midtransConfig.clientKey) {
      console.error('❌ Midtrans credentials missing');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not properly configured',
        error: 'Missing Midtrans credentials'
      });
    }

    const { productId, quantity = 1, totalAmount } = req.body;
    const userId = req.user._id;

    // Enhanced input validation
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

    // Check product availability
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

    // FIXED: Create Midtrans Snap instance with proper configuration
    console.log('🔧 Creating Midtrans Snap instance...');
    let snap;
    try {
      snap = new midtransClient.Snap({
        isProduction: false, // Always use sandbox
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

    // Generate reliable transaction ID
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 999);
    const transactionId = `ZWM-${timestamp}-${randomId}`;
    console.log('🆔 Generated transaction ID:', transactionId);

    // Calculate amount as integer (Midtrans requirement)
    const grossAmount = Math.round(totalAmount);

    // FIXED: Simplified transaction parameters that work with Midtrans
    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: grossAmount
      },
      item_details: [{
        id: product._id.toString(),
        price: Math.round(product.price),
        quantity: parseInt(quantity),
        name: product.name.length > 50 ? product.name.substring(0, 47) + '...' : product.name,
        category: product.category || 'general'
      }],
      customer_details: {
        first_name: (user.full_name || user.username || 'Customer').split(' ')[0],
        last_name: (user.full_name || '').split(' ').slice(1).join(' ') || 'User',
        email: user.email,
        phone: user.phone || '+628123456789'
      },
      // FIXED: Proper callbacks configuration
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'https://zerowastermarket.web.id'}/payment/success`
      },
      // FIXED: Simplified credit card configuration
      credit_card: {
        secure: true
      }
    };

    console.log('📋 Midtrans parameters:', {
      order_id: parameter.transaction_details.order_id,
      gross_amount: parameter.transaction_details.gross_amount,
      customer_email: parameter.customer_details.email,
      item_name: parameter.item_details[0].name,
      environment: 'SANDBOX'
    });

    // FIXED: Create transaction with better error handling
    console.log('🚀 Creating Midtrans transaction...');
    let transaction;
    try {
      transaction = await snap.createTransaction(parameter);
      console.log('✅ Midtrans transaction created successfully');
      console.log('🎫 Response:', {
        hasToken: !!transaction.token,
        hasRedirectUrl: !!transaction.redirect_url
      });
    } catch (midtransTransactionError) {
      console.error('❌ Midtrans transaction creation failed:');
      console.error('Full error details:', {
        message: midtransTransactionError.message,
        httpStatusCode: midtransTransactionError.httpStatusCode,
        ApiResponse: midtransTransactionError.ApiResponse,
        stack: midtransTransactionError.stack
      });

      // Better error messaging
      let userErrorMessage = 'Failed to create payment transaction';

      if (midtransTransactionError.httpStatusCode === 401) {
        userErrorMessage = 'Payment gateway authentication failed';
      } else if (midtransTransactionError.httpStatusCode === 400) {
        userErrorMessage = 'Invalid payment request parameters';
      } else if (midtransTransactionError.httpStatusCode === 500) {
        userErrorMessage = 'Payment gateway server error';
      }

      return res.status(500).json({
        success: false,
        message: userErrorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          originalError: midtransTransactionError.message,
          httpStatusCode: midtransTransactionError.httpStatusCode,
          environment: 'SANDBOX',
          serverKey: midtransConfig.serverKey ? 'Present' : 'Missing',
          apiResponse: midtransTransactionError.ApiResponse
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
        paymentMethod: 'midtrans',
        isCartOrder: false,
        midtransData: {
          snapToken: transaction.token,
          redirectUrl: transaction.redirect_url
        }
      });

      const savedOrder = await newOrder.save();
      console.log('✅ Order saved to database:', savedOrder._id);
    } catch (orderError) {
      console.error('❌ Failed to save order:', orderError);
      // Continue anyway as Midtrans transaction is already created
    }

    // FIXED: Success response with correct structure
    const responseData = {
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionId,
      environment: 'sandbox',
      message: 'Transaction created successfully'
    };

    console.log('✅ Sending successful response');
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 Payment Controller Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        type: error.name,
        stack: error.stack
      } : 'Internal server error'
    });
  }
};

// FIXED: Cart transaction handler
exports.createCartTransaction = async (req, res) => {
  try {
    console.log('🛒 Starting cart transaction creation...');
    console.log('📦 Request body:', req.body);

    const midtransConfig = getMidtransConfig();
    const { items, totalAmount } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart items are required'
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid total amount is required'
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

    // Fetch and validate all products
    console.log('🔍 Validating cart products...');
    const productIds = items.map(item => item.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      status: 'active'
    }).populate('seller_id', 'username full_name');

    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'Some products are no longer available'
      });
    }

    // Create Midtrans instance
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: midtransConfig.serverKey,
      clientKey: midtransConfig.clientKey
    });

    // Generate transaction ID
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 999);
    const transactionId = `ZWM-CART-${timestamp}-${randomId}`;

    // Prepare item details for Midtrans
    const itemDetails = products.map((product, index) => {
      const item = items.find(i => i.productId === product._id.toString());
      return {
        id: product._id.toString(),
        price: Math.round(product.price),
        quantity: item.quantity || 1,
        name: product.name.length > 50 ? product.name.substring(0, 47) + '...' : product.name,
        category: product.category || 'general'
      };
    });

    // Transaction parameters
    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: Math.round(totalAmount)
      },
      item_details: itemDetails,
      customer_details: {
        first_name: (user.full_name || user.username || 'Customer').split(' ')[0],
        last_name: (user.full_name || '').split(' ').slice(1).join(' ') || 'User',
        email: user.email,
        phone: user.phone || '+628123456789'
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'https://zerowastermarket.web.id'}/payment/success`
      },
      credit_card: {
        secure: true
      }
    };

    console.log('📋 Cart transaction parameters:', {
      order_id: transactionId,
      gross_amount: parameter.transaction_details.gross_amount,
      item_count: itemDetails.length
    });

    // Create Midtrans transaction
    const transaction = await snap.createTransaction(parameter);

    // Save order to database
    const orderProducts = products.map((product, index) => {
      const item = items.find(i => i.productId === product._id.toString());
      return {
        product: product._id,
        quantity: item.quantity || 1,
        price: product.price
      };
    });

    // Assume all products have the same seller for now
    const sellerId = products[0].seller_id._id || products[0].seller_id;

    const newOrder = new Order({
      buyer: userId,
      seller: sellerId,
      products: orderProducts,
      totalAmount: Math.round(totalAmount),
      status: 'pending',
      transactionId: transactionId,
      paymentMethod: 'midtrans',
      isCartOrder: true,
      midtransData: {
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url
      }
    });

    await newOrder.save();

    // Success response
    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionId,
      environment: 'sandbox',
      message: 'Cart transaction created successfully',
      summary: {
        itemCount: items.length,
        totalAmount: Math.round(totalAmount)
      }
    });

  } catch (error) {
    console.error('💥 Cart Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Cart payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// FIXED: Notification handler
exports.handleNotification = async (req, res) => {
  try {
    console.log('📨 Midtrans notification received:', req.body);

    const midtransConfig = getMidtransConfig();
    const notificationJson = req.body;

    // Create Core API instance
    const apiClient = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: midtransConfig.serverKey,
      clientKey: midtransConfig.clientKey
    });

    // Verify notification
    const statusResponse = await apiClient.transaction.notification(notificationJson);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`📋 Transaction notification:`, {
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

    // Determine order status
    let orderStatus;
    if (transactionStatus === 'capture') {
      orderStatus = fraudStatus === 'challenge' ? 'pending' : 'paid';
    } else if (transactionStatus === 'settlement') {
      orderStatus = 'paid';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      orderStatus = 'cancelled';
    } else {
      orderStatus = 'pending';
    }

    // Update order
    await order.updateStatus(orderStatus, {
      midtransData: {
        paymentType: statusResponse.payment_type,
        transactionTime: statusResponse.transaction_time,
        settlementTime: statusResponse.settlement_time,
        statusCode: statusResponse.status_code,
        statusMessage: statusResponse.status_message
      }
    });

    // Mark products as sold if payment successful
    if (orderStatus === 'paid') {
      if (order.isCartOrder && order.products) {
        for (const item of order.products) {
          await Product.findByIdAndUpdate(item.product, {
            status: 'sold',
            soldAt: new Date(),
            soldTo: order.buyer
          });
        }
      } else if (order.product) {
        await Product.findByIdAndUpdate(order.product, {
          status: 'sold',
          soldAt: new Date(),
          soldTo: order.buyer
        });
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

// Configuration verification
exports.verifyConfiguration = async (req, res) => {
  try {
    const midtransConfig = getMidtransConfig();

    res.json({
      success: true,
      configuration: {
        environment: 'SANDBOX',
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