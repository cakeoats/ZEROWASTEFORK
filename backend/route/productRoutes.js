// backend/route/productRoutes.js - FIXED UPLOAD MIDDLEWARE INTEGRATION
const express = require('express');
const router = express.Router();

// Import controllers and middleware with comprehensive error handling
let productController, authMiddleware, uploadMiddleware;

try {
    productController = require('../controller/productController');
    console.log('✅ Product controller imported successfully');
} catch (err) {
    console.error('❌ Failed to import product controller:', err.message);
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
        createUploadMiddleware: () => [(req, res, next) => res.status(500).json({ message: 'Upload middleware not available' })],
        uploadProductImages: [(req, res, next) => res.status(500).json({ message: 'Upload middleware not available' })]
    };
}

// Import Product model directly for category stats
let Product;
try {
    Product = require('../models/product');
    console.log('✅ Product model imported successfully');
} catch (err) {
    console.error('❌ Failed to import Product model:', err.message);
    Product = null;
}

const {
    uploadProduct = (req, res) => res.status(500).json({ message: 'Upload function not available' }),
    getProductDetail = (req, res) => res.status(500).json({ message: 'Get detail function not available' }),
    getAllProducts = (req, res) => res.status(500).json({ message: 'Get all function not available' }),
    updateProduct = (req, res) => res.status(500).json({ message: 'Update function not available' }),
    deleteProduct = (req, res) => res.status(500).json({ message: 'Delete function not available' })
} = productController;

const { protect = (req, res, next) => res.status(500).json({ message: 'Auth not available' }) } = authMiddleware;

// FIXED: Enhanced upload middleware with better error handling
const handleProductUpload = (req, res, next) => {
    console.log('🔄 Processing product upload/update request...');
    console.log('📊 Request details:', {
        method: req.method,
        url: req.url,
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        userAgent: req.get('User-Agent')?.substring(0, 50)
    });

    // FIXED: Try multiple approaches to get the upload handler
    let uploadHandler;

    try {
        // Approach 1: Use uploadProductImages if available
        if (uploadMiddleware.uploadProductImages && Array.isArray(uploadMiddleware.uploadProductImages)) {
            console.log('🔧 Using uploadProductImages middleware array');
            
            // Apply each middleware in sequence
            let currentIndex = 0;
            const applyNext = () => {
                if (currentIndex >= uploadMiddleware.uploadProductImages.length) {
                    return next();
                }
                
                const middleware = uploadMiddleware.uploadProductImages[currentIndex++];
                if (typeof middleware === 'function') {
                    middleware(req, res, applyNext);
                } else {
                    console.error('❌ Invalid middleware at index:', currentIndex - 1);
                    applyNext();
                }
            };
            
            return applyNext();
        }
        
        // Approach 2: Use createUploadMiddleware factory
        if (uploadMiddleware.createUploadMiddleware && typeof uploadMiddleware.createUploadMiddleware === 'function') {
            console.log('🔧 Using createUploadMiddleware factory');
            const middlewareArray = uploadMiddleware.createUploadMiddleware('images', 5);
            
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

        // Approach 3: Use legacy uploadImages
        if (uploadMiddleware.uploadImages && typeof uploadMiddleware.uploadImages === 'function') {
            console.log('🔧 Using legacy uploadImages middleware');
            return uploadMiddleware.uploadImages(req, res, next);
        }

        // Approach 4: Direct multer usage if upload instance available
        if (uploadMiddleware.upload) {
            console.log('🔧 Using direct multer instance');
            const multerHandler = uploadMiddleware.upload.array('images', 5);
            
            return multerHandler(req, res, (err) => {
                if (err) {
                    console.error('❌ Multer error:', err);
                    return uploadMiddleware.handleUploadError ? 
                        uploadMiddleware.handleUploadError(err, req, res, next) :
                        res.status(400).json({
                            success: false,
                            message: 'File upload error',
                            error: err.message
                        });
                }
                next();
            });
        }

        // If none of the above work, throw error
        throw new Error('No suitable upload handler found');

    } catch (middlewareError) {
        console.error('💥 Upload middleware setup error:', middlewareError);
        return res.status(500).json({
            success: false,
            message: 'Upload middleware configuration error',
            error: process.env.NODE_ENV === 'development' ? middlewareError.message : 'Internal server error',
            availableMethods: {
                uploadProductImages: !!uploadMiddleware.uploadProductImages,
                createUploadMiddleware: typeof uploadMiddleware.createUploadMiddleware === 'function',
                uploadImages: typeof uploadMiddleware.uploadImages === 'function',
                upload: !!uploadMiddleware.upload
            }
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

    // Log request body for debugging (but don't log files)
    if (req.body && Object.keys(req.body).length > 0) {
        const bodyToLog = { ...req.body };
        // Remove sensitive or large data
        delete bodyToLog.password;
        console.log('📦 Request body:', bodyToLog);
    }

    next();
};

// Validation middleware for product creation/update
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

// FIXED: Validation middleware for product updates (more lenient)
const validateProductUpdateData = (req, res, next) => {
    console.log('🔍 Validating product update data...');

    const { name, price, category, condition, tipe } = req.body;
    const errors = [];

    // For updates, we only validate if fields are provided
    if (name !== undefined && (!name || !name.trim())) {
        errors.push('Product name cannot be empty');
    }

    if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
        errors.push('Valid price is required');
    }

    if (category !== undefined && (!category || !category.trim())) {
        errors.push('Category cannot be empty');
    }

    if (condition !== undefined && !['new', 'used'].includes(condition)) {
        errors.push('Condition must be "new" or "used"');
    }

    if (tipe !== undefined && !['Sell', 'Donation', 'Swap'].includes(tipe)) {
        errors.push('Product type must be "Sell", "Donation", or "Swap"');
    }

    if (errors.length > 0) {
        console.log('❌ Update validation errors:', errors);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors
        });
    }

    console.log('✅ Product update data validation passed');
    next();
};

// Error handler wrapper for async routes
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        console.error('💥 Async route error:', error);
        next(error);
    });
};

// FIXED: Enhanced product detail route with better error handling
const handleGetProductDetail = async (req, res) => {
    try {
        const productId = req.params.id;
        console.log(`🔍 Fetching product detail for ID: ${productId}`);

        if (!productId || productId === 'undefined' || productId === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        // Check if it's a valid MongoDB ObjectId
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        await getProductDetail(req, res);
    } catch (error) {
        console.error('💥 Error in product detail route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product details',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// FIXED: Category Stats Route - MOVED TO TOP BEFORE PARAMETERIZED ROUTES
router.get('/category-stats', asyncHandler(async (req, res) => {
    try {
        console.log('📊 Fetching category statistics from database...');

        if (!Product) {
            return res.status(500).json({
                success: false,
                message: 'Product model not available',
                error: 'Database model not loaded'
            });
        }

        // FIXED: Enhanced aggregation pipeline with better filtering
        const categoryStats = await Product.aggregate([
            {
                // Only count active, visible, non-deleted products
                $match: {
                    status: { $ne: 'deleted' },
                    isVisible: { $ne: false },
                    deletedAt: { $exists: false },
                    category: { $exists: true, $ne: null, $ne: '' }
                }
            },
            {
                // Group by category and count
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                // Sort by category name for consistent ordering
                $sort: { _id: 1 }
            }
        ]);

        console.log('✅ Raw category statistics:', categoryStats);

        // FIXED: Process and normalize category names
        const processedStats = categoryStats.map(stat => ({
            _id: stat._id,
            category: stat._id,
            count: stat.count
        }));

        const totalProducts = processedStats.reduce((total, stat) => total + stat.count, 0);

        console.log('✅ Processed category statistics:', {
            totalCategories: processedStats.length,
            totalProducts: totalProducts,
            categories: processedStats
        });

        res.json({
            success: true,
            stats: processedStats,
            totalCategories: processedStats.length,
            totalProducts: totalProducts,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error fetching category statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}));

// Routes definition with comprehensive middleware stack

// POST /api/products/upload - Create new product
router.post('/upload',
    logRequest,
    protect,
    handleProductUpload, // FIXED upload middleware
    validateProductData,
    asyncHandler(uploadProduct)
);

// GET /api/products/:id - Get single product (FIXED with better error handling)
router.get('/:id',
    logRequest,
    asyncHandler(handleGetProductDetail)
);

// GET /api/products - Get all products with filtering
router.get('/',
    logRequest,
    asyncHandler(getAllProducts)
);

// PUT /api/products/:id - Update product (FIXED with proper validation)
router.put('/:id',
    logRequest,
    protect,
    handleProductUpload, // FIXED upload middleware
    validateProductUpdateData, // Use update-specific validation
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
            controller: !!productController,
            editSupport: true,
            categoryStats: !!Product
        },
        uploadMiddleware: {
            uploadProductImages: !!uploadMiddleware.uploadProductImages,
            createUploadMiddleware: typeof uploadMiddleware.createUploadMiddleware === 'function',
            uploadImages: typeof uploadMiddleware.uploadImages === 'function',
            upload: !!uploadMiddleware.upload
        }
    });
});

// 404 handler for product routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Product endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /api/products/category-stats',
            'POST /api/products/upload',
            'GET /api/products/:id',
            'GET /api/products',
            'PUT /api/products/:id',
            'DELETE /api/products/:id'
        ]
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

    // Handle network/timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return res.status(408).json({
            success: false,
            message: 'Request timeout',
            error: 'Operation took too long to complete'
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

console.log('📋 Product routes (with FIXED Upload Middleware) configured successfully');

module.exports = router;