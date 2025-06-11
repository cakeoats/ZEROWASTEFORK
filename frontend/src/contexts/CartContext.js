import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // FIXED: Initialize cart as empty - will be loaded based on current user
    const [cartItems, setCartItems] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [cartTotal, setCartTotal] = useState(0);
    const [currentUserId, setCurrentUserId] = useState(null);

    // FIXED: Get user-specific cart key
    const getCartKey = (userId) => {
        return userId ? `cart_${userId}` : 'cart_guest';
    };

    // FIXED: Load cart for specific user
    const loadCartForUser = (userId) => {
        console.log('🛒 Loading cart for user:', userId);

        const cartKey = getCartKey(userId);
        const savedCart = localStorage.getItem(cartKey);

        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                console.log('✅ Cart loaded:', parsedCart.length, 'items');
                setCartItems(parsedCart);
            } catch (error) {
                console.error('❌ Error parsing cart:', error);
                setCartItems([]);
            }
        } else {
            console.log('📭 No cart found for user, starting empty');
            setCartItems([]);
        }
    };

    // FIXED: Save cart for specific user
    const saveCartForUser = (userId, items) => {
        console.log('💾 Saving cart for user:', userId, 'Items:', items.length);

        const cartKey = getCartKey(userId);
        localStorage.setItem(cartKey, JSON.stringify(items));
    };

    // FIXED: Clear cart for specific user
    const clearCartForUser = (userId) => {
        console.log('🗑️ Clearing cart for user:', userId);

        const cartKey = getCartKey(userId);
        localStorage.removeItem(cartKey);

        // If it's the current user, also clear state
        if (userId === currentUserId) {
            setCartItems([]);
        }
    };

    // FIXED: Listen for user changes and switch cart accordingly
    useEffect(() => {
        // Get current user from localStorage
        let userId = null;

        try {
            const token = localStorage.getItem('token');
            const userInfo = localStorage.getItem('userInfo');
            const user = localStorage.getItem('user');

            if (token && userInfo) {
                const parsed = JSON.parse(userInfo);
                userId = parsed.user?.id || parsed.user?._id;
            } else if (user) {
                const parsed = JSON.parse(user);
                userId = parsed.id || parsed._id;
            }
        } catch (error) {
            console.error('❌ Error getting user info:', error);
        }

        console.log('👤 Current user changed to:', userId);

        // If user changed, save current cart and load new user's cart
        if (userId !== currentUserId) {
            // Save current cart for previous user (if any)
            if (currentUserId !== null && cartItems.length > 0) {
                saveCartForUser(currentUserId, cartItems);
            }

            // Load cart for new user
            setCurrentUserId(userId);
            loadCartForUser(userId);
        }
    }, []); // Run once on mount

    // FIXED: Re-run when localStorage changes (user login/logout)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'token' || e.key === 'user' || e.key === 'userInfo') {
                console.log('🔄 Auth storage changed, reloading cart...');

                // Small delay to ensure auth context updates first
                setTimeout(() => {
                    window.location.reload(); // Simple approach to ensure clean state
                }, 100);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Update localStorage whenever cart changes for current user
    useEffect(() => {
        if (currentUserId !== null) {
            saveCartForUser(currentUserId, cartItems);
        }

        // Calculate total items (each item has quantity of 1)
        setCartCount(cartItems.length);

        // Calculate total price (each item has quantity of 1)
        setCartTotal(cartItems.reduce((total, item) => total + item.price, 0));
    }, [cartItems, currentUserId]);

    // FIXED: Add item to cart with user validation
    const addToCart = (product) => {
        if (!currentUserId) {
            console.warn('⚠️ No user logged in, cannot add to cart');
            return false;
        }

        setCartItems(prevItems => {
            // Check if item already exists in cart
            const existingItemIndex = prevItems.findIndex(item => item._id === product._id);

            if (existingItemIndex !== -1) {
                // Item already exists - don't add duplicate, just return existing cart
                console.log('📦 Product already in cart:', product.name);
                return prevItems;
            } else {
                // Item doesn't exist, add new item with quantity of 1
                console.log('✅ Adding new product to cart:', product.name);
                return [...prevItems, {
                    ...product,
                    quantity: 1 // Fixed quantity of 1
                }];
            }
        });

        return true;
    };

    // FIXED: Remove item from cart with user validation
    const removeFromCart = (productId) => {
        if (!currentUserId) {
            console.warn('⚠️ No user logged in, cannot remove from cart');
            return;
        }

        console.log('🗑️ Removing product from cart:', productId);
        setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
    };

    // FIXED: Clear the entire cart with user validation
    const clearCart = () => {
        if (!currentUserId) {
            console.warn('⚠️ No user logged in, cannot clear cart');
            return;
        }

        console.log('🧹 Clearing entire cart for user:', currentUserId);
        setCartItems([]);
    };

    // Check if item is in cart
    const isInCart = (productId) => {
        return cartItems.some(item => item._id === productId);
    };

    // Get cart item by product ID
    const getCartItem = (productId) => {
        return cartItems.find(item => item._id === productId);
    };

    // FIXED: Method to manually clear cart for user (for logout)
    const clearCartOnLogout = () => {
        console.log('🚪 User logging out, clearing cart');

        if (currentUserId) {
            // Optionally save cart before clearing (uncomment if you want to persist cart after logout)
            // saveCartForUser(currentUserId, cartItems);

            // Or clear cart from storage entirely (current behavior)
            clearCartForUser(currentUserId);
        }

        setCartItems([]);
        setCurrentUserId(null);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            cartCount,
            cartTotal,
            currentUserId,
            addToCart,
            removeFromCart,
            clearCart,
            clearCartOnLogout, // FIXED: Add method for logout
            isInCart,
            getCartItem,
            // FIXED: Add utility methods
            loadCartForUser,
            saveCartForUser,
            clearCartForUser
        }}>
            {children}
        </CartContext.Provider>
    );
};

// Custom hook to use the cart context
export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};