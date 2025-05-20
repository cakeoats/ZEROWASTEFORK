const Wishlist = require('../models/Wishlist');
const Product = require('../models/product');

// Get all wishlist items for current user
exports.getWishlist = async (req, res) => {
    try {
        const wishlistItems = await Wishlist.find({ user_id: req.user._id })
            .populate('product_id')
            .sort({ created_at: -1 });

        res.status(200).json(wishlistItems);
    } catch (err) {
        console.error('Error fetching wishlist:', err);
        res.status(500).json({ message: 'Server error fetching wishlist' });
    }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if already in wishlist
        const existingItem = await Wishlist.findOne({
            user_id: req.user._id,
            product_id: productId
        });

        if (existingItem) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        // Add to wishlist
        const newWishlistItem = new Wishlist({
            user_id: req.user._id,
            product_id: productId
        });

        await newWishlistItem.save();

        res.status(201).json({
            message: 'Product added to wishlist',
            wishlistItem: newWishlistItem
        });
    } catch (err) {
        console.error('Error adding to wishlist:', err);
        res.status(500).json({ message: 'Server error adding to wishlist' });
    }
};

exports.removeFromWishlist = async (req, res) => {
    try {
        const productId = req.params.id;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const result = await Wishlist.findOneAndDelete({
            user_id: req.user._id,
            product_id: productId
        });

        if (!result) {
            return res.status(404).json({ message: 'Item not found in wishlist' });
        }

        res.status(200).json({ message: 'Item removed from wishlist' });
    } catch (err) {
        console.error('Error removing from wishlist:', err);
        res.status(500).json({ message: 'Server error removing from wishlist' });
    }
};

exports.checkWishlist = async (req, res) => {
    try {
        const productId = req.params.id;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const item = await Wishlist.findOne({
            user_id: req.user._id,
            product_id: productId
        });

        res.status(200).json({ inWishlist: !!item });
    } catch (err) {
        console.error('Error checking wishlist:', err);
        res.status(500).json({ message: 'Server error checking wishlist' });
    }
};