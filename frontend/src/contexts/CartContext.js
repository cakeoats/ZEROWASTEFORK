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

    // FIXED: Get current user ID helper function
    const getCurrentUserId = () => {
        try {
            const token = localStorage.getItem('token');
            const userInfo = localStorage.getItem('userInfo');
            const user = localStorage.getItem('user');

            if (token && userInfo) {
                const parsed = JSON.parse(userInfo);
                return parsed.user?.id || parsed.user?._id;
            } else if (user) {
                const parsed = JSON.parse(user);
                return parsed.id || parsed._id;
            }
        } catch (error) {
            console.error('❌ Error getting user info:', error);
        }
        return null;
    };

    // FIXED: Listen for user changes and switch cart accordingly
    useEffect(() => {
        const userId = getCurrentUserId();
        console.log('👤 Initial user detection:', userId);

        // Set initial user and load cart
        setCurrentUserId(userId);
        loadCartForUser(userId);
    }, []); // Run once on mount

    // FIXED: Watch for user changes in real-time
    useEffect(() => {
        const handleUserChange = () => {
            const userId = getCurrentUserId();
            console.log('🔄 User change detected:', currentUserId, '->', userId);

            if (userId !== currentUserId) {
                // Save current cart for previous user (if any)
                if (currentUserId !== null && cartItems.length > 0) {
                    console.log('💾 Saving cart for previous user:', currentUserId);
                    saveCartForUser(currentUserId, cartItems);
                }

                // Load cart for new user
                console.log('📂 Loading cart for new user:', userId);
                setCurrentUserId(userId);
                loadCartForUser(userId);
            }
        };

        // Listen for storage events (login/logout from other tabs)
        const handleStorageChange = (e) => {
            if (e.key === 'token' || e.key === 'user' || e.key === 'userInfo') {
                console.log('🔄 Storage event detected:', e.key);
                handleUserChange();
            }
        };

        // Listen for custom events (login/logout from same tab)
        const handleCustomStorageEvent = () => {
            console.log('🔄 Custom storage event detected');
            handleUserChange();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('storage', handleCustomStorageEvent);

        // FIXED: Also check periodically for user changes
        const userCheckInterval = setInterval(() => {
            const userId = getCurrentUserId();
            if (userId !== currentUserId) {
                console.log('⏰ Periodic check - user changed:', currentUserId, '->', userId);
                handleUserChange();
            }
        }, 1000); // Check every second

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('storage', handleCustomStorageEvent);
            clearInterval(userCheckInterval);
        };
    }, [currentUserId, cartItems]); // Watch for currentUserId and cartItems changes

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

    // FIXED: Add item to cart with enhanced user validation
    const addToCart = (product) => {
        const userId = getCurrentUserId(); // Get fresh user ID

        console.log('🛒 Adding to cart:', {
            productName: product.name,
            currentUserId: currentUserId,
            freshUserId: userId,
            userLoggedIn: !!userId
        });

        if (!userId) {
            console.warn('⚠️ No user logged in, cannot add to cart');
            alert('Please login to add items to cart');
            return false;
        }

        // Update currentUserId if it's different
        if (userId !== currentUserId) {
            console.log('🔄 Updating current user ID:', currentUserId, '->', userId);
            setCurrentUserId(userId);
        }

        setCartItems(prevItems => {
            // Check if item already exists in cart
            const existingItemIndex = prevItems.findIndex(item => item._id === product._id);

            if (existingItemIndex !== -1) {
                // Item already exists - don't add duplicate, just return existing cart
                console.log('📦 Product already in cart:', product.name);
                alert('Product already in cart!');
                return prevItems;
            } else {
                // Item doesn't exist, add new item with quantity of 1
                console.log('✅ Adding new product to cart:', product.name);
                const newCart = [...prevItems, {
                    ...product,
                    quantity: 1 // Fixed quantity of 1
                }];

                // Save immediately to localStorage
                saveCartForUser(userId, newCart);

                return newCart;
            }
        });

        return true;
    };

    // FIXED: Remove item from cart with enhanced user validation
    const removeFromCart = (productId) => {
        const userId = getCurrentUserId(); // Get fresh user ID

        if (!userId) {
            console.warn('⚠️ No user logged in, cannot remove from cart');
            return;
        }

        console.log('🗑️ Removing product from cart:', productId, 'for user:', userId);

        setCartItems(prevItems => {
            const newCart = prevItems.filter(item => item._id !== productId);
            // Save immediately to localStorage
            saveCartForUser(userId, newCart);
            return newCart;
        });
    };

    // FIXED: Clear the entire cart with enhanced user validation
    const clearCart = () => {
        const userId = getCurrentUserId(); // Get fresh user ID

        if (!userId) {
            console.warn('⚠️ No user logged in, cannot clear cart');
            return;
        }

        console.log('🧹 Clearing entire cart for user:', userId);
        setCartItems([]);
        saveCartForUser(userId, []);
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