const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure a user can't add the same product to wishlist multiple times
WishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', WishlistSchema);