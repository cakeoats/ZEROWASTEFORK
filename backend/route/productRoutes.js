const express = require('express');
const router = express.Router();
const { uploadProduct, getProductDetail, getAllProducts, updateProduct, deleteProduct } = require('../controller/productController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// pakai middleware upload sebelum controller
router.post('/upload', protect, upload.array('images'), uploadProduct);
router.get('/:id', getProductDetail);
router.get('/', getAllProducts);

// Add these new routes
router.put('/:id', protect, upload.array('images'), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;