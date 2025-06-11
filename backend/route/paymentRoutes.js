// backend/route/paymentRoutes.js - FIXED WITH TRANSACTION STATUS ENDPOINT
const express = require('express');
const router = express.Router();

// Import controller dengan error handling
let paymentController;
try {
  paymentController = require('../controller/payment/paymentController');
  console.log('✅ Payment controller imported successfully');
} catch (err) {
  console.error('❌ Failed to import payment controller:', err.message);
  // Create fallback controller
  paymentController = {
    createTransaction: (req, res) => {
      console.error('❌ Payment controller not properly configured');
      res.status(500).json({
        success: false,
        message: 'Payment controller not available',
        error: 'Controller import failed'
      });
    },
    handleNotification: (req, res) => {
      console.error('❌ Notification handler not properly configured');
      res.status(500).json({
        success: false,
        message: 'Notification handler not available',
        error: 'Controller import failed'
      });
    },
    verifyConfiguration: (req, res) => {
      console.error('❌ Verification handler not properly configured');
      res.status(500).json({
        success: false,
        message: 'Verification handler not available',
        error: 'Controller import failed'
      });
    }
  };
}

// Import auth middleware dengan error handling
let authMiddleware;
try {
  authMiddleware = require('../middleware/authMiddleware');
  console.log('✅ Auth middleware imported successfully');
} catch (err) {
  console.error('❌ Failed to import auth middleware:', err.message);
  authMiddleware = {
    protect: (req, res, next) => {
      res.status(500).json({
        success: false,
        message: 'Authentication middleware not available'
      });
    }
  };
}

// Import Order model for transaction status checking
let Order;
try {
  Order = require('../models/order');
  console.log('✅ Order model imported successfully');
} catch (err) {
  console.error('❌ Failed to import Order model:', err.message);
  Order = null;
}

const authenticate = authMiddleware.protect || authMiddleware.authenticateToken || authMiddleware.auth;

// Middleware untuk logging requests
const logRequest = (req, res, next) => {
  console.log(`🔔 Payment API: ${req.method} ${req.originalUrl}`);
  console.log('📦 Body size:', JSON.stringify(req.body).length, 'characters');
  console.log('🔐 Auth Header:', req.headers.authorization ? 'Present' : 'Missing');
  next();
};

// Middleware untuk validasi environment variables
const validateEnv = (req, res, next) => {
  const required = ['MIDTRANS_SERVER_KEY_SANDBOX', 'MIDTRANS_CLIENT_KEY_SANDBOX'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing sandbox environment variables:', missing);
    return res.status(500).json({
      success: false,
      message: 'Payment gateway configuration error',
      error: `Missing sandbox keys: ${missing.join(', ')}`
    });
  }

  console.log('✅ Environment variables validated');
  next();
};

// POST /api/payment/create-transaction - Single product payment
router.post('/create-transaction',
  logRequest,
  validateEnv,
  authenticate,
  async (req, res) => {
    try {
      console.log('🚀 Creating single product transaction...');
      console.log('👤 Authenticated user:', req.user ? req.user._id : 'No user');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      await paymentController.createTransaction(req, res);
    } catch (error) {
      console.error('💥 Error in create-transaction route:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal server error in payment processing',
          error: process.env.NODE_ENV === 'development' ? {
            message: error.message,
            stack: error.stack
          } : 'Payment processing failed'
        });
      }
    }
  }
);

// POST /api/payment/notification - Midtrans webhook (no auth needed)
router.post('/notification',
  logRequest,
  validateEnv,
  async (req, res) => {
    try {
      console.log('📨 Processing Midtrans notification...');
      await paymentController.handleNotification(req, res);
    } catch (error) {
      console.error('💥 Error in notification route:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal server error in notification processing',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Notification processing failed'
        });
      }
    }
  }
);

// FIXED: GET /api/payment/transaction-status/:transactionId - Check transaction status
router.get('/transaction-status/:transactionId',
  logRequest,
  authenticate,
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const userId = req.user._id;

      console.log('🔍 Checking transaction status:', transactionId, 'for user:', userId);

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID is required'
        });
      }

      if (!Order) {
        return res.status(500).json({
          success: false,
          message: 'Order model not available'
        });
      }

      // Find order in database and verify ownership
      const order = await Order.findOne({ 
        transactionId,
        buyer: userId 
      })
        .populate('product', 'name price images')
        .populate('products.product', 'name price images')
        .lean();

      if (!order) {
        console.log('❌ Transaction not found or access denied:', transactionId);
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      console.log('✅ Transaction found:', {
        orderId: transactionId,
        status: order.status,
        isCartOrder: order.isCartOrder,
        totalAmount: order.totalAmount
      });

      // Prepare response data
      const responseData = {
        success: true,
        transaction: {
          orderId: transactionId,
          status: order.status,
          isCartOrder: order.isCartOrder || false,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          paymentMethod: order.paymentMethod || 'midtrans',
          midtransData: order.midtransData || {},
          items: order.isCartOrder && order.products 
            ? order.products.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price
              }))
            : order.product 
              ? [{
                  product: order.product,
                  quantity: order.quantity || 1,
                  price: order.totalAmount
                }]
              : []
        }
      };

      res.json(responseData);

    } catch (error) {
      console.error('💥 Transaction status check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check transaction status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// GET /api/payment/config/verify - Configuration verification endpoint
router.get('/config/verify', async (req, res) => {
  try {
    console.log('🔍 Configuration verification requested');

    if (typeof paymentController.verifyConfiguration === 'function') {
      await paymentController.verifyConfiguration(req, res);
    } else {
      // Fallback verification
      const config = {
        environment: 'SANDBOX', // Always sandbox for now
        hasServerKey: !!process.env.MIDTRANS_SERVER_KEY_SANDBOX,
        hasClientKey: !!process.env.MIDTRANS_CLIENT_KEY_SANDBOX,
        serverKeyPrefix: process.env.MIDTRANS_SERVER_KEY_SANDBOX 
          ? process.env.MIDTRANS_SERVER_KEY_SANDBOX.substring(0, 15) + '...' 
          : 'NOT_SET',
        clientKeyPrefix: process.env.MIDTRANS_CLIENT_KEY_SANDBOX 
          ? process.env.MIDTRANS_CLIENT_KEY_SANDBOX.substring(0, 15) + '...' 
          : 'NOT_SET',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      };

      console.log('📋 Configuration check result:', {
        environment: config.environment,
        hasServerKey: config.hasServerKey,
        hasClientKey: config.hasClientKey
      });

      res.json({
        success: true,
        configuration: config
      });
    }
  } catch (error) {
    console.error('💥 Error in config verification route:', error);

    res.status(500).json({
      success: false,
      message: 'Configuration verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/payment/health - Health check
router.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      midtransConfigured: !!(process.env.MIDTRANS_SERVER_KEY_SANDBOX && process.env.MIDTRANS_CLIENT_KEY_SANDBOX),
      orderModelAvailable: !!Order
    },
    features: {
      createTransaction: !!paymentController.createTransaction,
      handleNotification: !!paymentController.handleNotification,
      checkTransactionStatus: !!Order,
      configVerification: true
    }
  };

  res.json(health);
});

// GET /api/payment/config - Get client configuration for frontend
router.get('/config', (req, res) => {
  try {
    const config = {
      clientKey: process.env.MIDTRANS_CLIENT_KEY_SANDBOX,
      isProduction: false, // Always sandbox for now
      environment: 'SANDBOX'
    };

    if (!config.clientKey) {
      return res.status(500).json({
        success: false,
        message: 'Payment configuration not available'
      });
    }

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('💥 Error getting payment config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment configuration'
    });
  }
});

// 404 handler for payment routes
router.use('*', (req, res) => {
  console.log('❌ Payment endpoint not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Payment endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'POST /api/payment/create-transaction',
      'POST /api/payment/notification',
      'GET /api/payment/transaction-status/:transactionId',
      'GET /api/payment/config/verify',
      'GET /api/payment/health',
      'GET /api/payment/config'
    ]
  });
});

// Error handling middleware specific to payments
router.use((error, req, res, next) => {
  console.error('💥 Payment route error:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Handle mongoose/validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  // Handle MongoDB duplicate key errors
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      field: Object.keys(error.keyPattern)[0]
    });
  }

  // Handle authentication errors
  if (error.message && error.message.includes('jwt')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

console.log('📋 Payment routes configured successfully with transaction status endpoint');

module.exports = router;