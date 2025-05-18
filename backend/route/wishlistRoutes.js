const express = require('express');
const router = express.Router();
const wishlistController = require('../controller/WishlistController');
const { protect } = require('../middleware/authMiddleware');

// Semua route wishlist memerlukan autentikasi
router.use(protect);

// Get all wishlist items
router.get('/', wishlistController.getWishlist);

// Add to wishlist
router.post('/', wishlistController.addToWishlist);

// Remove from wishlist
router.delete('/:id', wishlistController.removeFromWishlist);

// Check if product is in wishlist
router.get('/check/:id', wishlistController.checkWishlist);

module.exports = router;