// backend/route/productRoutes.js - UPDATED
const express = require('express');
const router = express.Router();
const { uploadProduct, getProductDetail, getAllProducts, updateProduct, deleteProduct } = require('../controller/productController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Middleware untuk handle multer errors
const handleUploadErrors = (req, res, next) => {
    upload.array('images', 5)(req, res, (err) => {
        if (err) {
            console.error('❌ Upload middleware error:', err);

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File terlalu besar. Maksimal 5MB per file.'
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

        next();
    });
};

// Routes dengan error handling yang lebih baik
router.post('/upload', protect, handleUploadErrors, uploadProduct);
router.get('/:id', getProductDetail);
router.get('/', getAllProducts);
router.put('/:id', protect, handleUploadErrors, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;