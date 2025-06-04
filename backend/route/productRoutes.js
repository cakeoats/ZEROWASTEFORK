// backend/route/productRoutes.js - SUPABASE INTEGRATED VERSION
const express = require('express');
const router = express.Router();

// Import controllers and middleware with comprehensive error handling
let productController, authMiddleware, uploadMiddleware;

try {
    productController = require('../controller/productController');
    console.log('✅ Product controller imported successfully');
} catch (err) {
    console.error('❌ Failed to import product controller:', err.message);
    // Create fallback to prevent crash
    productController = {
        uploadProduct: (req, res) => res.status(500).json({ message: 'Product controller not available' }),
        getProductDetail: (req, res) => res.status(500).json({ message: 'Product controller not available' }),
        getAllProducts: (req, res) => res.status(500).json({ message: 'Product controller not available' }),
        updateProduct: (req, res) => res.status(500).json({ message: 'Product controller not available' }),
        deleteProduct: (req, res) => res.status(500).json({ message: 'Product controller not available' })
    };
}

try {
    authMiddleware = require('../middleware/authMiddleware');
    console.log('✅ Auth middleware imported successfully');
} catch (err) {
    console.error('❌ Failed to import auth middleware:', err.message);
    authMiddleware = {
        protect: (req, res, next) => res.status(500).json({ message: 'Auth middleware not available' })
    };
}

try {
    uploadMiddleware = require('../middleware/uploadMiddleware');
    console.log('✅ Upload middleware imported successfully');
} catch (err) {
    console.error('❌ Failed to import upload middleware:', err.message);
    uploadMiddleware = {
        uploadImages: (req, res, next) => res.status(500).json({ message: 'Upload middleware not available' }),
        createUploadMiddleware: () => (req, res, next) => res.status(500).json({ message: 'Upload middleware not available' })
    };
}

// Destructure with fallbacks
const {
    uploadProduct = (req, res) => res.status(500).json({ message: 'Upload function not available' }),
    getProductDetail = (req, res) => res.status(500).json({ message: 'Get detail function not available' }),
    getAllProducts = (req, res) => res.status(500).json({ message: 'Get all function not available' }),
    updateProduct = (req, res) => res.status(500).json({ message: 'Update function not available' }),
    deleteProduct = (req, res) => res.status(500).json({ message: 'Delete function not available' })
} = productController;

const { protect = (req, res, next) => res.status(500).json({ message: 'Auth not available' }) } = authMiddleware;

// Enhanced upload middleware with Supabase integration
const handleProductUpload = (req, res, next) => {
    console.log('🔄 Processing product upload request...');
    console.log('📊 Request details:', {
        method: req.method,
        url: req.url,
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        userAgent: req.get('User-Agent')
    });

    // Use the enhanced upload middleware
    let uploadHandler;

    try {
        // Try to use the new createUploadMiddleware function if available
        if (uploadMiddleware.createUploadMiddleware) {
            uploadHandler = uploadMiddleware.createUploadMiddleware('images', 5);
        } else if (uploadMiddleware.uploadImages) {
            uploadHandler = uploadMiddleware.uploadImages;
        } else {
            // Fallback to direct multer usage
            uploadHandler = uploadMiddleware.array ? uploadMiddleware.array('images', 5) : uploadMiddleware;
        }

        if (typeof uploadHandler !== 'function') {
            throw new Error('Upload handler is not a function');
        }

        uploadHandler(req, res, (err) => {
            if (err) {
                console.error('❌ Upload processing error:', err);

                // Enhanced error handling for Supabase workflow
                const errorResponse = {
                    success: false,
                    message: 'File upload error',
                    timestamp: new Date().toISOString()
                };

                // Handle specific multer errors
                switch (err.code) {
                    case 'LIMIT_FILE_SIZE':
                        errorResponse.message = 'File too large. Maximum size is 10MB per file.';
                        errorResponse.code = 'FILE_TOO_LARGE';
                        return res.status(400).json(errorResponse);

                    case 'LIMIT_FILE_COUNT':
                        errorResponse.message = 'Too many files. Maximum 5 files allowed.';
                        errorResponse.code = 'TOO_MANY_FILES';
                        return res.status(400).json(errorResponse);

                    case 'INVALID_FILE_TYPE':
                    case 'UNSUPPORTED_FORMAT':
                        errorResponse.message = err.message || 'Invalid file type. Only images allowed.';
                        errorResponse.code = err.code || 'INVALID_FILE_TYPE';
                        return res.status(400).json(errorResponse);

                    case 'LIMIT_UNEXPECTED_FILE':
                        errorResponse.message = 'Unexpected field name. Use "images" for file uploads.';
                        errorResponse.code = 'UNEXPECTED_FIELD';
                        return res.status(400).json(errorResponse);

                    default:
                        errorResponse.message = err.message || 'Unknown upload error';
                        errorResponse.code = err.code || 'UPLOAD_ERROR';
                        console.error('💥 Unhandled upload error:', err);
                        return res.status(500).json(errorResponse);
                }
            }

            // Success logging
            if (req.files && req.files.length > 0) {
                console.log(`✅ Successfully processed ${req.files.length} files`);

                // Log file details for debugging
                req.files.forEach((file, index) => {
                    console.log(`   📄 File ${index + 1}:`, {
                        name: file.originalname,
                        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                        type: file.mimetype
                    });
                });

                // Add metadata for the controller
                req.uploadMetadata = {
                    fileCount: req.files.length,
                    totalSize: req.files.reduce((sum, file) => sum + file.size, 0),
                    avgFileSize: req.files.reduce((sum, file) => sum + file.size, 0) / req.files.length,
                    fileTypes: [...new Set(req.files.map(file => file.mimetype))],
                    uploadTimestamp: Date.now()
                };

                console.log('📈 Upload metadata:', req.uploadMetadata);
            } else {
                console.log('ℹ️ No files uploaded in this request');
            }

            console.log('✅ Upload middleware completed, proceeding to controller...');
            next();
        });

    } catch (middlewareError) {
        console.error('💥 Upload middleware setup error:', middlewareError);
        return res.status(500).json({
            success: false,
            message: 'Upload middleware configuration error',
            error: process.env.NODE_ENV === 'development' ? middlewareError.message : 'Internal server error'
        });
    }
};

// Request logging middleware
const logRequest = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📝 [${timestamp}] ${req.method} ${req.path}`);

    if (req.user) {
        console.log(`👤 User: ${req.user._id} (${req.user.username || req.user.email})`);
    }

    if (req.query && Object.keys(req.query).length > 0) {
        console.log('🔍 Query params:', req.query);
    }

    next();
};

// Validation middleware for product creation
const validateProductData = (req, res, next) => {
    console.log('🔍 Validating product data...');

    const { name, price, category, condition, tipe } = req.body;
    const errors = [];

    if (!name || !name.trim()) {
        errors.push('Product name is required');
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        errors.push('Valid price is required');
    }

    if (!category || !category.trim()) {
        errors.push('Category is required');
    }

    if (!condition || !['new', 'used'].includes(condition)) {
        errors.push('Condition must be "new" or "used"');
    }

    if (!tipe || !['Sell', 'Donation', 'Swap'].includes(tipe)) {
        errors.push('Product type must be "Sell", "Donation", or "Swap"');
    }

    if (errors.length > 0) {
        console.log('❌ Validation errors:', errors);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors
        });
    }

    console.log('✅ Product data validation passed');
    next();
};

// Error handler wrapper for async routes
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        console.error('💥 Async route error:', error);
        next(error);
    });
};

// Routes definition with comprehensive middleware stack

// POST /api/products/upload - Create new product
router.post('/upload',
    logRequest,
    protect,
    handleProductUpload,
    validateProductData,
    asyncHandler(uploadProduct)
);

// GET /api/products/:id - Get single product
router.get('/:id',
    logRequest,
    asyncHandler(getProductDetail)
);

// GET /api/products - Get all products with filtering
router.get('/',
    logRequest,
    asyncHandler(getAllProducts)
);

// PUT /api/products/:id - Update product
router.put('/:id',
    logRequest,
    protect,
    handleProductUpload,
    validateProductData,
    asyncHandler(updateProduct)
);

// DELETE /api/products/:id - Delete product
router.delete('/:id',
    logRequest,
    protect,
    asyncHandler(deleteProduct)
);

// Health check endpoint for products API
router.get('/health/check', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Products API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        features: {
            upload: !!uploadMiddleware,
            auth: !!authMiddleware,
            controller: !!productController
        }
    });
});

// 404 handler for product routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Product endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware specific to products
router.use((error, req, res, next) => {
    console.error('💥 Product route error:', error);

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

console.log('📋 Product routes (Supabase-ready) configured successfully');

module.exports = router;