const express = require('express');
const router = express.Router();

// Import controller dengan error handling
let paymentController;
try {
  paymentController = require('../controller/payment/paymentController');
} catch (err) {
  console.error('❌ Payment controller not found, trying alternative path...');
  try {
    // Try alternative path if the first one fails
    paymentController = require('../controller/paymentController');
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
  const required = ['MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    return res.status(500).json({
      success: false,
      message: 'Payment gateway configuration error',
      error: `Missing: ${missing.join(', ')}`
    });
  }
  
  console.log('✅ Environment variables validated');
  next();
};

// Routes with comprehensive error handling

// POST /api/payment/create-transaction
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

// POST /api/payment/create-cart-transaction
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
      
      await paymentController.createCartTransaction(req, res);
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

// GET /api/payment/health - Health check
router.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      midtransConfigured: !!(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY),
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
    }
  };
  
  res.json(health);
});

// GET /api/payment/config - Get client configuration
router.get('/config', (req, res) => {
  try {
    const config = {
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
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

module.exports = router;