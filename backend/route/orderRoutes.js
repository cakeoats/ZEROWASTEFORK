// backend/route/orderRoutes.js
const express = require('express');
const router = express.Router();

// Import controller with error handling
let orderController;
try {
    orderController = require('../controller/orderController');
    console.log('✅ Order controller imported successfully');
} catch (err) {
    console.error('❌ Failed to import order controller:', err.message);
    // Create fallback controller
    orderController = {
        getUserOrders: (req, res) => res.status(500).json({ message: 'Order controller not available' }),
        getOrderDetails: (req, res) => res.status(500).json({ message: 'Order controller not available' }),
        getOrderStats: (req, res) => res.status(500).json({ message: 'Order controller not available' }),
        cancelOrder: (req, res) => res.status(500).json({ message: 'Order controller not available' })
    };
}

// Import auth middleware
let authMiddleware;
try {
    authMiddleware = require('../middleware/authMiddleware');
    console.log('✅ Auth middleware imported successfully');
} catch (err) {
    console.error('❌ Failed to import auth middleware:', err.message);
    authMiddleware = {
        protect: (req, res, next) => res.status(500).json({ message: 'Auth middleware not available' })
    };
}

const { protect } = authMiddleware;

// Middleware untuk logging
const logRequest = (req, res, next) => {
    console.log(`📋 Order API: ${req.method} ${req.originalUrl}`);
    if (req.user) {
        console.log(`👤 User: ${req.user._id} (${req.user.username || req.user.email})`);
    }
    next();
};

// Error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes dengan proteksi autentikasi

// GET /api/orders - Get user's order history
router.get('/',
    logRequest,
    protect,
    asyncHandler(orderController.getUserOrders)
);

// GET /api/orders/stats - Get user's order statistics
router.get('/stats',
    logRequest,
    protect,
    asyncHandler(orderController.getOrderStats)
);

// GET /api/orders/:orderId - Get specific order details
router.get('/:orderId',
    logRequest,
    protect,
    asyncHandler(orderController.getOrderDetails)
);

// PUT /api/orders/:orderId/cancel - Cancel order
router.put('/:orderId/cancel',
    logRequest,
    protect,
    asyncHandler(orderController.cancelOrder)
);

// Health check endpoint
router.get('/health/check', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Orders API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 handler for order routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Order endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /api/orders',
            'GET /api/orders/stats',
            'GET /api/orders/:orderId',
            'PUT /api/orders/:orderId/cancel'
        ]
    });
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('💥 Order route error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(error.errors).map(err => err.message)
        });
    }

    // Handle MongoDB cast errors
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({
            success: false,
            message: 'Invalid order ID format'
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

console.log('📋 Order routes configured successfully');

module.exports = router;