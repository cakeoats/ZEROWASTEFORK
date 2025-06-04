// backend/route/paymentRoutes.js - UPDATED dengan verification endpoint
const express = require('express');
const router = express.Router();

// Import controller dengan error handling
let paymentController;
try {
  paymentController = require('../controller/payment/paymentController');
  console.log('✅ Payment controller imported successfully');
} catch (err) {
  console.error('❌ Failed to import payment controller:', err.message);
  try {
    // Try alternative path if the first one fails
    paymentController = require('../controller/paymentController');
    console.log('✅ Payment controller imported from alternative path');
  } catch (err2) {
    console.error('❌ Failed to import payment controller from both paths:', err2.message);
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
      createCartTransaction: (req, res) => {
        console.error('❌ Cart payment controller not properly configured');
        res.status(500).json({
          success: false,
          message: 'Cart payment controller not available',
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
}

// Import auth middleware dengan error handling
let authMiddleware;
try {
  authMiddleware = require('../middleware/authMiddleware');
  console.log('✅ Auth middleware imported successfully');
} catch (err) {
  console.error('❌ Failed to import auth middleware:', err.message);
  // Create fallback middleware
  authMiddleware = {
    protect: (req, res, next) => {
      res.status(500).json({
        success: false,
        message: 'Authentication middleware not available'
      });
    },
    authenticateToken: (req, res, next) => {
      res.status(500).json({
        success: false,
        message: 'Authentication middleware not available'
      });
    }
  };
}

// Use the appropriate auth function (try both common names)
const authenticate = authMiddleware.protect || authMiddleware.authenticateToken || authMiddleware.auth;

// Middleware untuk logging requests
const logRequest = (req, res, next) => {
  console.log(`🔔 Payment API: ${req.method} ${req.originalUrl}`);
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  console.log('🔐 Auth Header:', req.headers.authorization ? 'Present' : 'Missing');
  next();
};

// Middleware untuk validasi environment variables
const validateEnv = (req, res, next) => {
  const required = ['MIDTRANS_SERVER_KEY_PRODUCTION', 'MIDTRANS_CLIENT_KEY_PRODUCTION'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0 && process.env.MIDTRANS_IS_PRODUCTION === 'true') {
    console.error('❌ Missing production environment variables:', missing);
    return res.status(500).json({
      success: false,
      message: 'Payment gateway configuration error',
      error: `Missing production keys: ${missing.join(', ')}`
    });
  }

  console.log('✅ Environment variables validated');
  next();
};

// Routes with comprehensive error handling

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

// POST /api/payment/create-cart-transaction - Cart/multiple items payment
router.post('/create-cart-transaction',
  logRequest,
  validateEnv,
  authenticate,
  async (req, res) => {
    try {
      console.log('🛒 Creating cart transaction...');
      console.log('👤 Authenticated user:', req.user ? req.user._id : 'No user');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if createCartTransaction function exists
      if (typeof paymentController.createCartTransaction === 'function') {
        await paymentController.createCartTransaction(req, res);
      } else {
        // Fallback: handle cart as single transaction for now
        console.log('⚠️ createCartTransaction not available, using fallback...');

        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Cart items required'
          });
        }

        // For now, process first item only (temporary solution)
        const firstItem = items[0];
        req.body.productId = firstItem.productId;
        req.body.quantity = firstItem.quantity || 1;

        console.log('📦 Processing cart with single item fallback:', {
          productId: firstItem.productId,
          quantity: firstItem.quantity
        });

        await paymentController.createTransaction(req, res);
      }
    } catch (error) {
      console.error('💥 Error in create-cart-transaction route:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal server error in cart payment processing',
          error: process.env.NODE_ENV === 'development' ? {
            message: error.message,
            stack: error.stack
          } : 'Cart payment processing failed'
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

// GET /api/payment/config/verify - NEW: Configuration verification endpoint
router.get('/config/verify', async (req, res) => {
  try {
    console.log('🔍 Configuration verification requested');

    // Check if verifyConfiguration function exists
    if (typeof paymentController.verifyConfiguration === 'function') {
      await paymentController.verifyConfiguration(req, res);
    } else {
      // Fallback verification
      console.log('⚠️ verifyConfiguration not available, using fallback...');

      const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

      const config = {
        environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
        merchantId: process.env.MIDTRANS_MERCHANT_ID || 'NOT_SET',
        hasServerKey: isProduction
          ? !!process.env.MIDTRANS_SERVER_KEY_PRODUCTION
          : !!process.env.MIDTRANS_SERVER_KEY_SANDBOX,
        hasClientKey: isProduction
          ? !!process.env.MIDTRANS_CLIENT_KEY_PRODUCTION
          : !!process.env.MIDTRANS_CLIENT_KEY_SANDBOX,
        serverKeyPrefix: isProduction
          ? (process.env.MIDTRANS_SERVER_KEY_PRODUCTION ? process.env.MIDTRANS_SERVER_KEY_PRODUCTION.substring(0, 15) + '...' : 'NOT_SET')
          : (process.env.MIDTRANS_SERVER_KEY_SANDBOX ? process.env.MIDTRANS_SERVER_KEY_SANDBOX.substring(0, 15) + '...' : 'NOT_SET'),
        clientKeyPrefix: isProduction
          ? (process.env.MIDTRANS_CLIENT_KEY_PRODUCTION ? process.env.MIDTRANS_CLIENT_KEY_PRODUCTION.substring(0, 15) + '...' : 'NOT_SET')
          : (process.env.MIDTRANS_CLIENT_KEY_SANDBOX ? process.env.MIDTRANS_CLIENT_KEY_SANDBOX.substring(0, 15) + '...' : 'NOT_SET'),
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
      midtransConfigured: !!(process.env.MIDTRANS_SERVER_KEY_PRODUCTION && process.env.MIDTRANS_CLIENT_KEY_PRODUCTION),
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
    }
  };

  res.json(health);
});

// GET /api/payment/config - Get client configuration for frontend
router.get('/config', (req, res) => {
  try {
    console.log('🔧 Payment config request received');
    console.log('📋 Environment variables check:', {
      MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION,
      NODE_ENV: process.env.NODE_ENV,
      hasProductionServerKey: !!process.env.MIDTRANS_SERVER_KEY_PRODUCTION,
      hasProductionClientKey: !!process.env.MIDTRANS_CLIENT_KEY_PRODUCTION,
      hasSandboxServerKey: !!process.env.MIDTRANS_SERVER_KEY_SANDBOX,
      hasSandboxClientKey: !!process.env.MIDTRANS_CLIENT_KEY_SANDBOX
    });

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    let config;

    if (isProduction) {
      // Production configuration
      config = {
        clientKey: process.env.MIDTRANS_CLIENT_KEY_PRODUCTION,
        isProduction: true,
        environment: 'PRODUCTION'
      };

      console.log('🎯 Using PRODUCTION configuration');
    } else {
      // Sandbox configuration  
      config = {
        clientKey: process.env.MIDTRANS_CLIENT_KEY_SANDBOX,
        isProduction: false,
        environment: 'SANDBOX'
      };

      console.log('🧪 Using SANDBOX configuration');
    }

    console.log('🔧 Final config:', {
      environment: config.environment,
      isProduction: config.isProduction,
      clientKeyPrefix: config.clientKey ? config.clientKey.substring(0, 15) + '...' : 'NOT_SET'
    });

    // Validation
    if (!config.clientKey) {
      console.error('❌ Client key not found for environment:', config.environment);

      return res.status(500).json({
        success: false,
        message: `Payment configuration not available for ${config.environment} environment`,
        error: 'CLIENT_KEY_MISSING',
        debug: {
          environment: config.environment,
          isProduction: config.isProduction,
          availableKeys: {
            production: !!process.env.MIDTRANS_CLIENT_KEY_PRODUCTION,
            sandbox: !!process.env.MIDTRANS_CLIENT_KEY_SANDBOX
          }
        }
      });
    }

    // Success response
    res.json({
      success: true,
      config: {
        clientKey: config.clientKey,
        isProduction: config.isProduction,
        environment: config.environment
      },
      timestamp: new Date().toISOString(),
      server: {
        nodeEnv: process.env.NODE_ENV,
        platform: 'vercel'
      }
    });

    console.log('✅ Payment config sent successfully');

  } catch (error) {
    console.error('💥 Error getting payment config:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get payment configuration',
      error: error.message,
      timestamp: new Date().toISOString()
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
      'POST /api/payment/create-cart-transaction',
      'POST /api/payment/notification',
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

  // Handle file upload errors
  if (error.code && error.code.startsWith('LIMIT_')) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: error.message
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

console.log('📋 Payment routes configured successfully with verification endpoint');

module.exports = router;