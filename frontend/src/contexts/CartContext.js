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

        // Calculate total items and price
        setCartCount(cartItems.reduce((total, item) => total + item.quantity, 0));
        setCartTotal(cartItems.reduce((total, item) => total + (item.price * item.quantity), 0));
    }, [cartItems]);

    // Add item to cart
    const addToCart = (product, quantity = 1) => {
        setCartItems(prevItems => {
            // Check if item already exists in cart
            const existingItemIndex = prevItems.findIndex(item => item._id === product._id);

            if (existingItemIndex !== -1) {
                // Item exists, update quantity
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
                return updatedItems;
            } else {
                // Item doesn't exist, add new item
                return [...prevItems, {
                    ...product,
                    quantity
                }];
            }
        });
    };

    // Remove item from cart
    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
    };

    // Update item quantity
    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(item =>
                item._id === productId ? { ...item, quantity } : item
            )
        );
    };

    // Clear the entire cart
    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            cartCount,
            cartTotal,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext);