// backend/route/userRoutes.js - UPDATED dengan Supabase Profile Picture Upload
const express = require('express');
const { updateProfile, getProfile, changePassword, updateProfilePicture, getUserProducts } = require('../controller/userController');
const { protect } = require('../middleware/authMiddleware');

// Import upload middleware with error handling
let uploadMiddleware;
try {
    uploadMiddleware = require('../middleware/uploadMiddleware');
    console.log('✅ Upload middleware imported successfully for user routes');
} catch (err) {
    console.error('❌ Failed to import upload middleware:', err.message);
    // Create fallback middleware
    uploadMiddleware = {
        uploadProfilePicture: [(req, res, next) => {
            console.error('❌ Upload middleware not available');
            res.status(500).json({ message: 'Upload functionality not available' });
        }],
        validateProfilePicture: (req, res, next) => next()
    };
}

const router = express.Router();

// Middleware untuk logging requests
const logRequest = (req, res, next) => {
    console.log(`👤 User API: ${req.method} ${req.originalUrl}`);
    if (req.user) {
        console.log(`🔐 Authenticated user: ${req.user._id} (${req.user.username || req.user.email})`);
    }
    next();
};

// GET /api/users/profile - Get user profile
router.get('/profile',
    logRequest,
    protect,
    getProfile
);

// PUT /api/users/profile - Update user profile (basic info)
router.put('/profile',
    logRequest,
    protect,
    updateProfile
);

// POST /api/users/change-password - Change user password
router.post('/change-password',
    logRequest,
    protect,
    changePassword
);

// POST /api/users/profile-picture - Update profile picture with Supabase
router.post('/profile-picture',
    logRequest,
    protect,
    // Use new upload middleware for profile pictures
    ...uploadMiddleware.uploadProfilePicture,
    // Add validation middleware
    uploadMiddleware.validateProfilePicture,
    updateProfilePicture
);

// GET /api/users/products - Get user's products
router.get('/products',
    logRequest,
    protect,
    getUserProducts
);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'User API is running',
        timestamp: new Date().toISOString(),
        features: {
            profileManagement: true,
            profilePictureUpload: !!uploadMiddleware.uploadProfilePicture,
            passwordChange: true,
            productListing: true,
            supabaseIntegration: true
        }
    });
});

// Error handling middleware specific to user routes
router.use((error, req, res, next) => {
    console.error('💥 User route error:', {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        user: req.user?._id
    });

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(error.errors).map(err => err.message)
        });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
            success: false,
            message: `${field} already exists`,
            field: field
        });
    }

    // Handle file upload errors (additional layer)
    if (error.code && error.code.startsWith('LIMIT_')) {
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: error.message
        });
    }

    // Handle bcrypt errors
    if (error.name === 'bcrypt' || error.message.includes('bcrypt')) {
        return res.status(500).json({
            success: false,
            message: 'Password processing error'
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

console.log('👤 User routes configured successfully with Supabase profile picture upload');

module.exports = router;