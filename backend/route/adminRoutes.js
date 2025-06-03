const express = require('express');
const router = express.Router();

// Import controller
const adminController = require('../controller/Admin/adminController');

// Import middleware
const { protect, isAdmin } = require('../middleware/adminMiddleware');

// Auth route - tidak memerlukan middleware auth
router.post('/login', adminController.login);


// Protected admin routes
router.get('/products', protect, isAdmin, adminController.getProducts);
router.delete('/products/:id', protect, isAdmin, adminController.deleteProduct);
router.get('/users/count', protect, isAdmin, adminController.getUsersCount);

module.exports = router;