// backend/route/wishlistRoutes.js - FIXED with Enhanced Error Handling
const express = require('express');
const router = express.Router();

// Import controller and middleware with error handling
let wishlistController, authMiddleware;

try {
  wishlistController = require('../controller/WishlistController');
  console.log('✅ Wishlist controller imported successfully');
} catch (err) {
  console.error('❌ Failed to import wishlist controller:', err.message);
  // Create fallback controller
  wishlistController = {
    getWishlist: (req, res) => res.status(500).json({ success: false, message: 'Wishlist controller not available' }),
    addToWishlist: (req, res) => res.status(500).json({ success: false, message: 'Wishlist controller not available' }),
    removeFromWishlist: (req, res) => res.status(500).json({ success: false, message: 'Wishlist controller not available' }),
    checkWishlist: (req, res) => res.status(500).json({ success: false, message: 'Wishlist controller not available' })
  };
}

try {
  authMiddleware = require('../middleware/authMiddleware');
  console.log('✅ Auth middleware imported successfully');
} catch (err) {
  console.error('❌ Failed to import auth middleware:', err.message);
  authMiddleware = {
    protect: (req, res, next) => res.status(500).json({ success: false, message: 'Auth middleware not available' })
  };
}

const { protect } = authMiddleware;

// Middleware untuk logging requests
const logRequest = (req, res, next) => {
  console.log(`💖 Wishlist API: ${req.method} ${req.originalUrl}`);
  console.log('🌐 Origin:', req.headers.origin);
  console.log('🔐 Auth header:', req.headers.authorization ? 'Present' : 'Missing');
  
  if (req.user) {
    console.log(`👤 User: ${req.user._id} (${req.user.username || req.user.email})`);
  }
  
  next();
};

// FIXED: CORS headers middleware for wishlist routes
const setCorsHeaders = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
};

// Error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Apply CORS headers to all wishlist routes
router.use(setCorsHeaders);

// Apply logging to all routes
router.use(logRequest);

// Apply auth middleware to all wishlist routes
router.use(protect);

// FIXED: Handle OPTIONS requests
router.options('*', (req, res) => {
  console.log('🔧 Handling OPTIONS preflight for wishlist route:', req.path);
  res.sendStatus(200);
});

// GET /api/wishlist - Get all wishlist items
router.get('/', 
  asyncHandler(async (req, res) => {
    console.log('📋 Getting user wishlist...');
    await wishlistController.getWishlist(req, res);
  })
);

// POST /api/wishlist - Add to wishlist
router.post('/', 
  asyncHandler(async (req, res) => {
    console.log('➕ Adding to wishlist:', req.body);
    await wishlistController.addToWishlist(req, res);
  })
);

// DELETE /api/wishlist/:id - Remove from wishlist
router.delete('/:id', 
  asyncHandler(async (req, res) => {
    console.log('➖ Removing from wishlist:', req.params.id);
    await wishlistController.removeFromWishlist(req, res);
  })
);

// GET /api/wishlist/check/:id - Check if product is in wishlist
router.get('/check/:id', 
  asyncHandler(async (req, res) => {
    console.log('🔍 Checking wishlist status for product:', req.params.id);
    await wishlistController.checkWishlist(req, res);
  })
);

// Health check endpoint for wishlist
router.get('/health/check', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Wishlist API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      getWishlist: !!wishlistController.getWishlist,
      addToWishlist: !!wishlistController.addToWishlist,
      removeFromWishlist: !!wishlistController.removeFromWishlist,
      checkWishlist: !!wishlistController.checkWishlist
    }
  });
});

// 404 handler for wishlist routes
router.use('*', (req, res) => {
  console.log('❌ Wishlist endpoint not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Wishlist endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/wishlist',
      'POST /api/wishlist',
      'DELETE /api/wishlist/:id',
      'GET /api/wishlist/check/:id'
    ]
  });
});

// FIXED: Error handling middleware specific to wishlist
router.use((error, req, res, next) => {
  console.error('💥 Wishlist route error:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user?._id,
    origin: req.headers.origin
  });

  // Ensure CORS headers are set for error responses
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle mongoose validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  // Handle MongoDB cast errors (invalid ObjectId)
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format'
    });
  }

  // Handle MongoDB duplicate key errors
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Product already in wishlist'
    });
  }

  // Handle authentication errors
  if (error.message.includes('jwt') || error.message.includes('token')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

console.log('💖 Wishlist routes configured successfully with enhanced error handling');

module.exports = router;