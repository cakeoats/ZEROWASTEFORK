// backend/route/productRoutes.js - FIXED VERSION
const express = require('express');
const router = express.Router();

// Import functions with error handling
let productController;
try {
    productController = require('../controller/productController');
    console.log('✅ Product controller imported successfully');
} catch (err) {
    console.error('❌ Failed to import product controller:', err.message);
    // Create fallback functions to prevent crash
    productController = {
        uploadProduct: (req, res) => res.status(500).json({ message: 'Product controller not available' }),
        getProductDetail: (req, res) => res.status(500).json({ message: 'Product controller not available' }),
        getAllProducts: (req, res) => res.status(500).json({ message: 'Product controller not available' }),
        updateProduct: (req, res) => res.status(500).json({ message: 'Product controller not available' }),
        deleteProduct: (req, res) => res.status(500).json({ message: 'Product controller not available' })
    };
}

// Import middleware with error handling
let authMiddleware;
try {
    authMiddleware = require('../middleware/authMiddleware');
    console.log('✅ Auth middleware imported successfully');
} catch (err) {
    console.error('❌ Failed to import auth middleware:', err.message);
    authMiddleware = {
        protect: (req, res, next) => {
            res.status(500).json({ message: 'Auth middleware not available' });
        }
    };
}

let uploadMiddleware;
try {
    uploadMiddleware = require('../middleware/uploadMiddleware');
    console.log('✅ Upload middleware imported successfully');
} catch (err) {
    console.error('❌ Failed to import upload middleware:', err.message);
    uploadMiddleware = (req, res, next) => {
        res.status(500).json({ message: 'Upload middleware not available' });
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

// Safe upload handler
const handleUploadErrors = (req, res, next) => {
    try {
        // Check if uploadMiddleware is a function
        if (typeof uploadMiddleware !== 'function') {
            console.error('❌ Upload middleware is not a function:', typeof uploadMiddleware);
            return res.status(500).json({
                success: false,
                message: 'Upload middleware not properly configured'
            });
        }

        // Use array() method if available, otherwise use direct middleware
        const uploader = uploadMiddleware.array ? uploadMiddleware.array('images', 5) : uploadMiddleware;

        uploader(req, res, (err) => {
            if (err) {
                console.error('❌ Upload middleware error:', err);

                // Handle multer-specific errors
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File terlalu besar. Maksimal 10MB per file.'
                    });
                }

                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'Terlalu banyak file. Maksimal 5 file.'
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: err.message || 'Error saat upload file'
                });
            }

            console.log('✅ Upload middleware completed successfully');
            next();
        });
    } catch (error) {
        console.error('❌ Error in upload handler:', error);
        res.status(500).json({
            success: false,
            message: 'Internal upload handler error'
        });
    }
};

// Define routes with comprehensive error handling
try {
    router.post('/upload', protect, handleUploadErrors, uploadProduct);
    console.log('✅ POST /upload route registered');
} catch (err) {
    console.error('❌ Failed to register POST /upload route:', err.message);
}

try {
    router.get('/:id', getProductDetail);
    console.log('✅ GET /:id route registered');
} catch (err) {
    console.error('❌ Failed to register GET /:id route:', err.message);
}

try {
    router.get('/', getAllProducts);
    console.log('✅ GET / route registered');
} catch (err) {
    console.error('❌ Failed to register GET / route:', err.message);
}

try {
    router.put('/:id', protect, handleUploadErrors, updateProduct);
    console.log('✅ PUT /:id route registered');
} catch (err) {
    console.error('❌ Failed to register PUT /:id route:', err.message);
}

try {
    router.delete('/:id', protect, deleteProduct);
    console.log('✅ DELETE /:id route registered');
} catch (err) {
    console.error('❌ Failed to register DELETE /:id route:', err.message);
}

console.log('📋 Product routes configuration completed');

module.exports = router;