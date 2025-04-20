const express = require('express');
const { getProductDetail } = require('../controller/productController');
const router = express.Router();

router.get('/:id', getProductDetail); // Ubah dari '/products/:id' menjadi '/:id'

module.exports = router;