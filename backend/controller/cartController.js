const Cart = require('../models/cart');
const Product = require('../models/product');

// Get user's cart
exports.getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find the user's cart and populate product details
        let cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name price images category condition tipe'
            });

        // If cart doesn't exist, create a new empty cart
        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [],
                totalAmount: 0
            });
            await cart.save();
        }

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity = 1 } = req.body;

        // Validate input
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Get product details to verify it exists and get the current price
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({
                user: userId,
                items: []
            });
        }

        // Check if product already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Product exists in cart, update quantity
            cart.items[existingItemIndex].quantity += parseInt(quantity);
        } else {
            // Product doesn't exist in cart, add new item
            cart.items.push({
                product: productId,
                quantity: parseInt(quantity),
                price: product.price
            });
        }

        // Save cart
        await cart.save();

        // Return updated cart
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'name price images category condition tipe'
        });

        res.status(200).json(updatedCart);
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Error adding to cart', error: error.message });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;

        // Validate input
        if (!productId || !quantity) {
            return res.status(400).json({ message: 'Product ID and quantity are required' });
        }

        // Find cart
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find item in cart
        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Update quantity or remove if quantity is 0
        if (parseInt(quantity) <= 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = parseInt(quantity);
        }

        // Save cart
        await cart.save();

        // Return updated cart
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'name price images category condition tipe'
        });

        res.status(200).json(updatedCart);
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Error updating cart item', error: error.message });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        // Find cart
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Filter out the item to remove
        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );

        // Save cart
        await cart.save();

        // Return updated cart
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'name price images category condition tipe'
        });

        res.status(200).json(updatedCart);
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ message: 'Error removing item from cart', error: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find cart
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Clear items
        cart.items = [];

        // Save cart
        await cart.save();

        res.status(200).json({ message: 'Cart cleared successfully', cart });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
};