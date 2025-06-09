import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Initialize cart from localStorage if available
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [cartCount, setCartCount] = useState(0);
    const [cartTotal, setCartTotal] = useState(0);

    // Update localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));

        // Calculate total items (each item has quantity of 1)
        setCartCount(cartItems.length);

        // Calculate total price (each item has quantity of 1)
        setCartTotal(cartItems.reduce((total, item) => total + item.price, 0));
    }, [cartItems]);

    // Add item to cart (simplified - no quantity parameter, always 1)
    const addToCart = (product) => {
        setCartItems(prevItems => {
            // Check if item already exists in cart
            const existingItemIndex = prevItems.findIndex(item => item._id === product._id);

            if (existingItemIndex !== -1) {
                // Item already exists - don't add duplicate, just return existing cart
                console.log('Product already in cart:', product.name);
                return prevItems;
            } else {
                // Item doesn't exist, add new item with quantity of 1
                console.log('Adding new product to cart:', product.name);
                return [...prevItems, {
                    ...product,
                    quantity: 1 // Fixed quantity of 1
                }];
            }
        });
    };

    // Remove item from cart
    const removeFromCart = (productId) => {
        console.log('Removing product from cart:', productId);
        setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
    };

    // Clear the entire cart
    const clearCart = () => {
        console.log('Clearing entire cart');
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

    return (
        <CartContext.Provider value={{
            cartItems,
            cartCount,
            cartTotal,
            addToCart,
            removeFromCart,
            clearCart,
            isInCart,
            getCartItem
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