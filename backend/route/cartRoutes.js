const express = require('express');
const router = express.Router();
const cartController = require('../controller/cartController');
const { protect } = require('../middleware/authMiddleware');

// Apply auth middleware to all cart routes
router.use(protect);

// Get user's cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.put('/update', cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:productId', cartController.removeFromCart);

// Clear the entire cart
router.delete('/clear', cartController.clearCart);

module.exports = router;