// backend/controller/payment/paymentController.js - COMPLETE FIXED VERSION
const midtransClient = require('midtrans-client');
const Product = require('../../models/product');
const User = require('../../models/User');
const Cart = require('../../models/cart');
const Order = require('../../models/order');

// Improved Midtrans configuration
const getMidtransConfig = () => {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  console.log('🔧 Environment Variables Check:', {
    MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION,
    NODE_ENV: process.env.NODE_ENV
  });

  // Use SANDBOX keys consistently
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

  if (!config.serverKey || !config.clientKey) {
    const missing = [];
    if (!config.serverKey) missing.push('MIDTRANS_SERVER_KEY_SANDBOX');
    if (!config.clientKey) missing.push('MIDTRANS_CLIENT_KEY_SANDBOX');
    throw new Error(`Missing Midtrans credentials: ${missing.join(', ')}`);
  }

  return config;
};

// Helper function untuk menghilangkan produk setelah payment
const handleProductAfterPayment = async (productId, quantity = 1) => {
  try {
    console.log(`🗑️ Processing product removal after payment: ${productId} (quantity: ${quantity})`);

    const product = await Product.findById(productId);
    if (!product) {
      console.log('❌ Product not found for removal:', productId);
      return;
    }

    // STRATEGY 1: Set status to 'sold' instead of deleting
    // This preserves database integrity and order history
    product.status = 'sold';
    product.soldAt = new Date();

    // Optional: Reduce stock if you're tracking it
    if (product.stock && product.stock > 0) {
      product.stock = Math.max(0, product.stock - quantity);
    }

    await product.save();

    console.log(`✅ Product ${product.name} marked as sold (quantity: ${quantity})`);

    // STRATEGY 2: Alternative - Delete from database (more aggressive)
    // Uncomment this if you prefer to completely remove the product
    /*
    await Product.findByIdAndDelete(productId);
    console.log(`✅ Product ${productId} completely removed from database`);
    */

  } catch (error) {
    console.error('❌ Error handling product after payment:', error);
    // Don't throw error - let the payment continue successfully
  }
};

// Helper function untuk membersihkan cart user
const clearUserCart = async (userId, productId) => {
  try {
    console.log(`🧹 Clearing product ${productId} from user ${userId} cart`);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      console.log('ℹ️ No cart found for user');
      return;
    }

    // Remove the purchased product from cart
    const originalCount = cart.items.length;
    cart.items = cart.items.filter(item =>
      item.product.toString() !== productId.toString()
    );

    if (cart.items.length < originalCount) {
      await cart.save();
      console.log(`✅ Product ${productId} removed from user cart`);
    } else {
      console.log(`ℹ️ Product ${productId} was not in user cart`);
    }

  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    // Don't throw error - this is cleanup, not critical
  }
};

// Helper functions for Indonesian timezone
const getIndonesianTime = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const indonesianTime = new Date(utc + (7 * 3600000)); // UTC+7
  return indonesianTime;
};

const formatMidtransTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0700`;
};

// Create single product transaction
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

    // Check if product is still available (not sold)
    if (product.status === 'sold') {
      console.log('❌ Product already sold:', productId);
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

    // Proper time handling for Indonesian timezone
    const currentTime = getIndonesianTime();
    const expiryTime = new Date(currentTime.getTime() + (60 * 60 * 1000)); // Add 1 hour

    console.log('⏰ Time Details:', {
      currentTimeUTC: new Date().toISOString(),
      currentTimeIndonesia: formatMidtransTime(currentTime),
      expiryTimeIndonesia: formatMidtransTime(expiryTime),
      timeDifferenceMinutes: (expiryTime.getTime() - currentTime.getTime()) / (1000 * 60)
    });

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

    // Save order to database with enhanced data
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
        isCartOrder: false, // Single product order
        // Enhanced order data
        midtransData: {
          snapToken: transaction.token,
          redirectUrl: transaction.redirect_url,
          expiryTime: expiryTime
        },
        shippingAddress: {
          street: user.address || '',
          city: 'Jakarta',
          country: 'Indonesia'
        }
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

// FIXED: Complete cart transaction handler
exports.createCartTransaction = async (req, res) => {
  try {
    console.log('🛒 Creating cart transaction...');
    console.log('📦 Request body:', req.body);

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

    console.log(`📋 Processing cart with ${items.length} items for user ${userId}`);

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fetch and validate all products in cart
    const productIds = items.map(item => item.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      status: { $ne: 'sold' } // Only available products
    }).populate('seller_id', 'username full_name email');

    // Check if all products are available
    if (products.length !== items.length) {
      const foundIds = products.map(p => p._id.toString());
      const missingIds = productIds.filter(id => !foundIds.includes(id.toString()));

      return res.status(400).json({
        success: false,
        message: 'Some products are no longer available',
        unavailableProducts: missingIds
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
    const transactionId = `ZWM-CART-${timestamp}-${randomId}`;
    console.log('🆔 Generated cart transaction ID:', transactionId);

    // Calculate and validate amount
    const calculatedAmount = products.reduce((total, product) => {
      const item = items.find(i => i.productId.toString() === product._id.toString());
      return total + (product.price * (item?.quantity || 1));
    }, 0);

    // Verify amounts match
    if (Math.abs(calculatedAmount - totalAmount) > 1) { // Allow 1 rupiah tolerance for rounding
      console.error('❌ Amount mismatch:', { calculated: calculatedAmount, provided: totalAmount });
      return res.status(400).json({
        success: false,
        message: 'Total amount mismatch',
        calculatedAmount,
        providedAmount: totalAmount
      });
    }

    const grossAmount = Math.round(totalAmount);

    // Proper time handling for Indonesian timezone
    const currentTime = getIndonesianTime();
    const expiryTime = new Date(currentTime.getTime() + (60 * 60 * 1000)); // Add 1 hour

    // Prepare item details for Midtrans
    const itemDetails = products.map(product => {
      const item = items.find(i => i.productId.toString() === product._id.toString());
      return {
        id: product._id.toString(),
        price: Math.round(product.price),
        quantity: parseInt(item?.quantity || 1),
        name: product.name.substring(0, 50), // Midtrans name limit
        category: product.category || 'general'
      };
    });

    // Enhanced transaction parameters for cart
    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: grossAmount
      },
      item_details: itemDetails,
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
      expiry: {
        start_time: formatMidtransTime(currentTime),
        duration: 60, // 60 minutes
        unit: 'minutes'
      }
    };

    console.log('📋 Cart Midtrans parameters:', {
      order_id: parameter.transaction_details.order_id,
      gross_amount: parameter.transaction_details.gross_amount,
      item_count: parameter.item_details.length,
      customer_email: parameter.customer_details.email,
      environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'
    });

    // Create transaction with Midtrans
    console.log('🚀 Creating Midtrans cart transaction...');
    let transaction;
    try {
      transaction = await snap.createTransaction(parameter);
      console.log('✅ Midtrans cart transaction created successfully');
    } catch (midtransTransactionError) {
      console.error('❌ Midtrans cart transaction creation failed:', midtransTransactionError);

      let userErrorMessage = 'Failed to create cart payment transaction';
      if (midtransTransactionError.message) {
        const errorMsg = midtransTransactionError.message.toLowerCase();
        if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          userErrorMessage = 'Payment gateway authentication failed. Please contact support.';
        } else if (errorMsg.includes('400') || errorMsg.includes('bad request')) {
          userErrorMessage = 'Invalid cart payment request. Please check your cart items.';
        }
      }

      return res.status(500).json({
        success: false,
        message: userErrorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          originalError: midtransTransactionError.message,
          environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'
        } : undefined
      });
    }

    // Save cart order to database
    console.log('💾 Saving cart order to database...');
    try {
      // Get primary seller (from first product) for now
      const primarySeller = products[0].seller_id._id || products[0].seller_id;

      const newOrder = new Order({
        buyer: userId,
        seller: primarySeller, // For multiple sellers, you might want to create separate orders
        // For cart orders, save all products
        products: items.map(item => {
          const product = products.find(p => p._id.toString() === item.productId.toString());
          return {
            product: product._id,
            quantity: parseInt(item.quantity || 1),
            price: product.price
          };
        }),
        totalAmount: grossAmount,
        status: 'pending',
        transactionId: transactionId,
        paymentMethod: 'midtrans',
        isCartOrder: true, // Flag to identify cart orders
        // Enhanced order data
        midtransData: {
          snapToken: transaction.token,
          redirectUrl: transaction.redirect_url,
          expiryTime: expiryTime
        },
        shippingAddress: {
          street: user.address || '',
          city: 'Jakarta',
          country: 'Indonesia'
        }
      });

      await newOrder.save();
      console.log('✅ Cart order saved to database:', newOrder._id);
    } catch (orderError) {
      console.error('❌ Failed to save cart order:', orderError);
      // Continue anyway as Midtrans transaction is already created
    }

    // Success response
    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionId,
      environment: midtransConfig.isProduction ? 'production' : 'sandbox',
      message: 'Cart transaction created successfully',
      summary: {
        totalItems: items.length,
        totalAmount: grossAmount,
        products: itemDetails.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      }
    });

    console.log('✅ Cart transaction response sent successfully');

  } catch (error) {
    console.error('💥 Cart Payment Controller Error:', {
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Cart payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// UPDATED: Handle notification with cart order support
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
    const transactionTime = statusResponse.transaction_time;
    const settlementTime = statusResponse.settlement_time;
    const paymentType = statusResponse.payment_type;

    console.log(`📋 Transaction notification processed:`, {
      orderId,
      transactionStatus,
      fraudStatus,
      paymentType
    });

    // Find order (works for both single and cart orders)
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

    console.log(`📦 Order found: ${order.isCartOrder ? 'Cart' : 'Single'} order with ${order.isCartOrder ? order.products?.length : 1} item(s)`);

    // Determine order status and additional data
    let orderStatus;
    let additionalData = {
      midtransData: {
        paymentType: paymentType,
        transactionTime: transactionTime ? new Date(transactionTime) : undefined,
        settlementTime: settlementTime ? new Date(settlementTime) : undefined,
        statusCode: statusResponse.status_code,
        statusMessage: statusResponse.status_message
      }
    };

    if (transactionStatus == 'capture') {
      orderStatus = fraudStatus == 'challenge' ? 'pending' : 'paid';
    } else if (transactionStatus == 'settlement') {
      orderStatus = 'paid';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      orderStatus = 'cancelled';
      additionalData.reason = `Payment ${transactionStatus}`;
    } else if (transactionStatus == 'pending') {
      orderStatus = 'pending';
    }

    // Update order status
    await order.updateStatus(orderStatus, additionalData);

    // Handle product removal after successful payment for BOTH single and cart orders
    if (orderStatus === 'paid') {
      console.log('💰 Payment successful! Processing product removal...');

      if (order.isCartOrder && order.products && order.products.length > 0) {
        // Handle cart order - remove all products
        console.log(`🛒 Processing cart order with ${order.products.length} products`);

        for (const item of order.products) {
          if (item.product && item.product._id) {
            await handleProductAfterPayment(item.product._id, item.quantity);
            await clearUserCart(order.buyer, item.product._id);
            console.log(`✅ Processed product ${item.product._id} (quantity: ${item.quantity})`);
          }
        }

        console.log('✅ All cart products processed after successful payment');

      } else if (order.product) {
        // Handle single product order
        console.log(`📦 Processing single product order`);

        await handleProductAfterPayment(order.product._id, order.quantity);
        await clearUserCart(order.buyer, order.product._id);

        console.log('✅ Single product processed after successful payment');
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
        environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX',
        hasServerKey: !!midtransConfig.serverKey,
        hasClientKey: !!midtransConfig.clientKey,
        serverKeyPrefix: midtransConfig.serverKey ? midtransConfig.serverKey.substring(0, 20) + '...' : 'NOT_SET',
        clientKeyPrefix: midtransConfig.clientKey ? midtransConfig.clientKey.substring(0, 20) + '...' : 'NOT_SET',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        timeZone: 'Asia/Jakarta (UTC+7)',
        features: {
          singleProductPayment: true,
          cartPayment: true,
          orderHistory: true,
          enhancedOrderTracking: true,
          statusUpdates: true,
          productRemovalAfterPurchase: true,
          indonesianTimezone: true,
          cartOrderSupport: true
        }
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

// DEBUG: Cart checkout troubleshooting endpoint (temporary)
exports.debugCartCheckout = async (req, res) => {
  try {
    console.log('🔍 DEBUG - Cart checkout analysis');

    const { items, totalAmount } = req.body;
    const userId = req.user._id;

    // Debug information collection
    const debugInfo = {
      timestamp: new Date().toISOString(),
      user: {
        id: userId.toString(),
        username: req.user.username || 'N/A',
        email: req.user.email || 'N/A'
      },
      request: {
        itemsCount: items ? items.length : 0,
        totalAmount: totalAmount,
        rawItems: items
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        midtransProduction: process.env.MIDTRANS_IS_PRODUCTION,
        hasServerKey: !!process.env.MIDTRANS_SERVER_KEY_SANDBOX,
        hasClientKey: !!process.env.MIDTRANS_CLIENT_KEY_SANDBOX
      },
      validation: {
        hasItems: !!(items && Array.isArray(items) && items.length > 0),
        hasTotalAmount: !!(totalAmount && totalAmount > 0),
        itemsValid: []
      }
    };

    // Validate each item
    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const validation = {
          index: i,
          hasProductId: !!item.productId,
          hasQuantity: !!item.quantity,
          productId: item.productId,
          quantity: item.quantity
        };

        // Check if product exists
        try {
          const product = await Product.findById(item.productId);
          validation.productExists = !!product;
          validation.productName = product ? product.name : 'NOT_FOUND';
          validation.productPrice = product ? product.price : 'N/A';
          validation.productStatus = product ? product.status : 'N/A';
        } catch (productError) {
          validation.productExists = false;
          validation.productError = productError.message;
        }

        debugInfo.validation.itemsValid.push(validation);
      }
    }

    // Check Midtrans configuration
    try {
      const midtransConfig = getMidtransConfig();

      debugInfo.midtrans = {
        configValid: !!(midtransConfig.serverKey && midtransConfig.clientKey),
        environment: midtransConfig.isProduction ? 'PRODUCTION' : 'SANDBOX',
        serverKeyPrefix: midtransConfig.serverKey ? midtransConfig.serverKey.substring(0, 15) + '...' : 'NOT_SET',
        clientKeyPrefix: midtransConfig.clientKey ? midtransConfig.clientKey.substring(0, 15) + '...' : 'NOT_SET'
      };
    } catch (midtransError) {
      debugInfo.midtrans = {
        configValid: false,
        error: midtransError.message
      };
    }

    // Calculate expected total
    let calculatedTotal = 0;
    if (debugInfo.validation.itemsValid.length > 0) {
      calculatedTotal = debugInfo.validation.itemsValid.reduce((total, item) => {
        if (item.productExists && item.productPrice) {
          return total + (item.productPrice * (item.quantity || 1));
        }
        return total;
      }, 0);
    }

    debugInfo.calculation = {
      providedTotal: totalAmount,
      calculatedTotal: calculatedTotal,
      difference: Math.abs(calculatedTotal - (totalAmount || 0)),
      isValid: Math.abs(calculatedTotal - (totalAmount || 0)) <= 1
    };

    // Overall assessment
    debugInfo.assessment = {
      canProceed: debugInfo.validation.hasItems &&
        debugInfo.validation.hasTotalAmount &&
        debugInfo.midtrans.configValid &&
        debugInfo.calculation.isValid,
      issues: []
    };

    // Collect issues
    if (!debugInfo.validation.hasItems) {
      debugInfo.assessment.issues.push('No valid items in cart');
    }
    if (!debugInfo.validation.hasTotalAmount) {
      debugInfo.assessment.issues.push('No total amount provided');
    }
    if (!debugInfo.midtrans.configValid) {
      debugInfo.assessment.issues.push('Midtrans configuration invalid');
    }
    if (!debugInfo.calculation.isValid) {
      debugInfo.assessment.issues.push(`Total amount mismatch (provided: ${totalAmount}, calculated: ${calculatedTotal})`);
    }

    // Check for invalid products
    const invalidProducts = debugInfo.validation.itemsValid.filter(item => !item.productExists);
    if (invalidProducts.length > 0) {
      debugInfo.assessment.issues.push(`${invalidProducts.length} product(s) not found`);
    }

    console.log('🔍 DEBUG INFO:', JSON.stringify(debugInfo, null, 2));

    res.json({
      success: true,
      debug: debugInfo,
      message: debugInfo.assessment.canProceed ?
        'Cart checkout should work' :
        `Issues found: ${debugInfo.assessment.issues.join(', ')}`
    });

  } catch (error) {
    console.error('💥 Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug analysis failed',
      error: error.message
    });
  }
};

// HELPER: Transaction status checker (useful for frontend)
exports.checkTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    // Find order in database
    const order = await Order.findOne({ transactionId })
      .populate('product', 'name')
      .populate('products.product', 'name')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Also check with Midtrans API for real-time status
    try {
      const midtransConfig = getMidtransConfig();
      const apiClient = new midtransClient.CoreApi(midtransConfig);
      const statusResponse = await apiClient.transaction.status(transactionId);

      console.log('📊 Transaction status check:', {
        orderId: transactionId,
        dbStatus: order.status,
        midtransStatus: statusResponse.transaction_status
      });

      res.json({
        success: true,
        transaction: {
          orderId: transactionId,
          status: order.status,
          isCartOrder: order.isCartOrder,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          midtransStatus: statusResponse.transaction_status,
          paymentType: statusResponse.payment_type,
          items: order.isCartOrder ? order.products : [{
            product: order.product,
            quantity: order.quantity
          }]
        }
      });

    } catch (midtransError) {
      console.error('⚠️ Midtrans status check failed:', midtransError.message);

      // Return database status only
      res.json({
        success: true,
        transaction: {
          orderId: transactionId,
          status: order.status,
          isCartOrder: order.isCartOrder,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          midtransStatus: 'unknown',
          items: order.isCartOrder ? order.products : [{
            product: order.product,
            quantity: order.quantity
          }]
        },
        warning: 'Could not verify with payment gateway'
      });
    }

  } catch (error) {
    console.error('💥 Transaction status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check transaction status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// HELPER: Cancel pending transaction
exports.cancelTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    // Find order and verify ownership
    const order = await Order.findOne({
      transactionId,
      buyer: userId,
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pending transaction not found or you do not have permission to cancel it'
      });
    }

    try {
      // Cancel with Midtrans
      const midtransConfig = getMidtransConfig();
      const apiClient = new midtransClient.CoreApi(midtransConfig);
      await apiClient.transaction.cancel(transactionId);

      console.log('✅ Transaction cancelled with Midtrans:', transactionId);
    } catch (midtransError) {
      console.error('⚠️ Midtrans cancellation failed:', midtransError.message);
      // Continue with database update even if Midtrans fails
    }

    // Update order status
    await order.updateStatus('cancelled', {
      reason: reason || 'Cancelled by user'
    });

    console.log('✅ Transaction cancelled in database:', transactionId);

    res.json({
      success: true,
      message: 'Transaction cancelled successfully',
      transactionId: transactionId
    });

  } catch (error) {
    console.error('💥 Transaction cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};