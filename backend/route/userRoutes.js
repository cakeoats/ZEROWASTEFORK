// backend/route/userRoutes.js - FIXED UPLOAD MIDDLEWARE INTEGRATION
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
            res.status(500).json({ success: false, message: 'Upload functionality not available' });
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

// FIXED: Enhanced profile picture upload middleware
const handleProfilePictureUpload = (req, res, next) => {
    console.log('📷 Processing profile picture upload...');

    // Try multiple approaches to get the upload handler
    try {
        // Approach 1: Use uploadProfilePicture if available
        if (uploadMiddleware.uploadProfilePicture && Array.isArray(uploadMiddleware.uploadProfilePicture)) {
            console.log('🔧 Using uploadProfilePicture middleware array');
            
            // Apply each middleware in sequence
            let currentIndex = 0;
            const applyNext = () => {
                if (currentIndex >= uploadMiddleware.uploadProfilePicture.length) {
                    return next();
                }
                
                const middleware = uploadMiddleware.uploadProfilePicture[currentIndex++];
                if (typeof middleware === 'function') {
                    middleware(req, res, applyNext);
                } else {
                    console.error('❌ Invalid middleware at index:', currentIndex - 1);
                    applyNext();
                }
            };
            
            return applyNext();
        }
        
        // Approach 2: Use createUploadMiddleware factory for single file
        if (uploadMiddleware.createUploadMiddleware && typeof uploadMiddleware.createUploadMiddleware === 'function') {
            console.log('🔧 Using createUploadMiddleware factory for profile picture');
            const middlewareArray = uploadMiddleware.createUploadMiddleware('profilePicture', 1);
            
            if (Array.isArray(middlewareArray)) {
                let currentIndex = 0;
                const applyNext = () => {
                    if (currentIndex >= middlewareArray.length) {
                        return next();
                    }
                    
                    const middleware = middlewareArray[currentIndex++];
                    if (typeof middleware === 'function') {
                        middleware(req, res, applyNext);
                    } else {
                        console.error('❌ Invalid middleware at index:', currentIndex - 1);
                        applyNext();
                    }
                };
                
                return applyNext();
            }
        }

        // Approach 3: Direct multer usage if upload instance available
        if (uploadMiddleware.upload) {
            console.log('🔧 Using direct multer instance for profile picture');
            const multerHandler = uploadMiddleware.upload.single('profilePicture');
            
            return multerHandler(req, res, (err) => {
                if (err) {
                    console.error('❌ Multer error:', err);
                    return uploadMiddleware.handleUploadError ? 
                        uploadMiddleware.handleUploadError(err, req, res, next) :
                        res.status(400).json({
                            success: false,
                            message: 'Profile picture upload error',
                            error: err.message
                        });
                }
                next();
            });
        }

        // If none of the above work, throw error
        throw new Error('No suitable upload handler found for profile picture');

    } catch (middlewareError) {
        console.error('💥 Profile picture upload middleware setup error:', middlewareError);
        return res.status(500).json({
            success: false,
            message: 'Profile picture upload middleware configuration error',
            error: process.env.NODE_ENV === 'development' ? middlewareError.message : 'Internal server error'
        });
    }
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
    // Use enhanced upload middleware for profile pictures
    handleProfilePictureUpload,
    // Add validation middleware if available
    uploadMiddleware.validateProfilePicture || ((req, res, next) => {
        // Fallback validation
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Profile picture file is required'
            });
        }
        next();
    }),
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
            profilePictureUpload: !!uploadMiddleware.uploadProfilePicture || !!uploadMiddleware.upload,
            passwordChange: true,
            productListing: true,
            supabaseIntegration: true
        },
        uploadMiddleware: {
            uploadProfilePicture: !!uploadMiddleware.uploadProfilePicture,
            createUploadMiddleware: typeof uploadMiddleware.createUploadMiddleware === 'function',
            upload: !!uploadMiddleware.upload,
            validateProfilePicture: !!uploadMiddleware.validateProfilePicture
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

console.log('👤 User routes configured successfully with fixed profile picture upload');

module.exports = router;