// backend/route/productRoutes.js - DEBUG VERSION
const express = require('express');
const router = express.Router();
const { uploadProduct, getProductDetail, getAllProducts, updateProduct, deleteProduct } = require('../controller/productController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Import debug middleware
const { debugRequest, handleMulterError } = require('../middleware/uploadMiddleware');

// Enhanced upload middleware dengan debugging
const handleUploadErrors = (req, res, next) => {
    console.log('🔍 Starting upload middleware...');

    upload.array('images', 5)(req, res, (err) => {
        console.log('🔍 Upload middleware completed');
        console.log('Files after upload:', req.files ? req.files.length : 'No files');
        console.log('Body after upload:', req.body);

        if (err) {
            console.error('❌ Upload middleware error:', err);

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

        // Additional validation
        if (!req.files || req.files.length === 0) {
            console.log('⚠️ WARNING: No files received after multer processing');
            console.log('Request headers:', req.headers);
            console.log('Request body:', req.body);
        }

        next();
    });
};

// Routes dengan extensive debugging
router.post('/upload',
    debugRequest,              // Debug request pertama
    protect,                   // Authentication
    handleUploadErrors,        // File upload dengan debug
    uploadProduct             // Controller
);

router.get('/:id', getProductDetail);
router.get('/', getAllProducts);
router.put('/:id', protect, handleUploadErrors, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;