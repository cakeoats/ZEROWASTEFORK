// frontend/src/pages/product/WishlistPage.js - FIXED with proper authentication

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert } from 'flowbite-react';
import { HiHeart, HiShoppingCart, HiTrash, HiHome } from 'react-icons/hi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { wishlistApi, debugAuth } from '../../utils/apiUtils';
import { getProductImageUrl } from '../../config/api';

function WishlistPage() {
    const navigate = useNavigate();
    const { isAuthenticated, user, token } = useAuth();
    const { addToCart, isInCart } = useCart();

    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [removingItems, setRemovingItems] = useState(new Set());

    // Debug auth state on component mount
    useEffect(() => {
        console.log('🔍 WishlistPage mounted - Auth state:', {
            isAuthenticated,
            hasUser: !!user,
            hasToken: !!token,
            userId: user?.id || user?._id
        });

        // Debug localStorage
        debugAuth();
    }, [isAuthenticated, user, token]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            console.log('❌ User not authenticated, redirecting to login');
            navigate('/login');
            return;
        }
    }, [isAuthenticated, navigate]);

    // Fetch wishlist items
    const fetchWishlist = async () => {
        if (!isAuthenticated) {
            console.log('⚠️ Cannot fetch wishlist - user not authenticated');
            return;
        }

        try {
            setLoading(true);
            setError('');

            console.log('📤 Fetching wishlist...');
            const data = await wishlistApi.getAll();

            console.log('✅ Wishlist fetched successfully:', data);
            setWishlistItems(data || []);
        } catch (err) {
            console.error('❌ Error fetching wishlist:', err);

            let errorMessage = 'Failed to load wishlist';

            if (err.response?.status === 401) {
                errorMessage = 'Please log in to view your wishlist';
                navigate('/login');
            } else if (err.response?.status === 403) {
                errorMessage = 'Access denied. Please log in again.';
                navigate('/login');
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Remove item from wishlist
    const handleRemoveFromWishlist = async (productId, productName) => {
        try {
            setRemovingItems(prev => new Set([...prev, productId]));

            console.log('🗑️ Removing from wishlist:', { productId, productName });
            await wishlistApi.remove(productId);

            // Update local state
            setWishlistItems(prev => prev.filter(item =>
                item.product_id._id !== productId && item.product_id !== productId
            ));

            console.log('✅ Item removed from wishlist successfully');
        } catch (err) {
            console.error('❌ Error removing from wishlist:', err);

            let errorMessage = 'Failed to remove item from wishlist';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            setError(errorMessage);
        } finally {
            setRemovingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });
        }
    };

    // Add item to cart
    const handleAddToCart = (product) => {
        try {
            console.log('🛒 Adding to cart:', product.name);
            addToCart(product);
            console.log('✅ Item added to cart successfully');
        } catch (err) {
            console.error('❌ Error adding to cart:', err);
            setError('Failed to add item to cart');
        }
    };

    // Initial fetch
    useEffect(() => {
        if (isAuthenticated) {
            fetchWishlist();
        }
    }, [isAuthenticated]);

    // Show loading spinner while checking authentication
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <HiHeart className="text-red-500 mr-3" />
                                My Wishlist
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Items you've saved for later
                            </p>
                        </div>

                        <Link to="/product-list">
                            <Button color="blue" className="flex items-center">
                                <HiHome className="mr-2 h-4 w-4" />
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert color="failure" className="mb-6">
                        <div className="flex items-center">
                            <span>{error}</span>
                            <Button
                                size="sm"
                                color="failure"
                                className="ml-4"
                                onClick={() => setError('')}
                            >
                                Dismiss
                            </Button>
                        </div>
                    </Alert>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Spinner size="xl" />
                        <span className="ml-3 text-gray-600">Loading wishlist...</span>
                    </div>
                ) : (
                    <>
                        {/* Wishlist Items */}
                        {wishlistItems.length === 0 ? (
                            <div className="text-center py-12">
                                <HiHeart className="mx-auto h-24 w-24 text-gray-300 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                    Your wishlist is empty
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    Start adding items you love to your wishlist
                                </p>
                                <Link to="/product-list">
                                    <Button color="blue">
                                        Browse Products
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {wishlistItems.map((item) => {
                                    const product = item.product_id || item.product;
                                    const productId = product._id || product.id;
                                    const isRemoving = removingItems.has(productId);
                                    const inCart = isInCart(productId);

                                    return (
                                        <div key={item._id || productId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                            {/* Product Image */}
                                            <div className="relative">
                                                <img
                                                    src={getProductImageUrl(product)}
                                                    alt={product.name}
                                                    className="w-full h-48 object-cover"
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
                                                    }}
                                                />

                                                {/* Remove button */}
                                                <button
                                                    onClick={() => handleRemoveFromWishlist(productId, product.name)}
                                                    disabled={isRemoving}
                                                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                                                    title="Remove from wishlist"
                                                >
                                                    {isRemoving ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <HiTrash className="h-4 w-4 text-red-500" />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Product Info */}
                                            <div className="p-4">
                                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                                    {product.name}
                                                </h3>

                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-lg font-bold text-green-600">
                                                        Rp {product.price?.toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-sm text-gray-500 capitalize">
                                                        {product.condition}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm text-gray-600">
                                                        {product.category}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${product.tipe === 'Sell' ? 'bg-blue-100 text-blue-800' :
                                                            product.tipe === 'Donation' ? 'bg-green-100 text-green-800' :
                                                                'bg-orange-100 text-orange-800'
                                                        }`}>
                                                        {product.tipe}
                                                    </span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    <Link
                                                        to={`/products/${productId}`}
                                                        className="flex-1"
                                                    >
                                                        <Button
                                                            color="gray"
                                                            size="sm"
                                                            className="w-full"
                                                        >
                                                            View Details
                                                        </Button>
                                                    </Link>

                                                    {product.tipe === 'Sell' && (
                                                        <Button
                                                            color={inCart ? "green" : "blue"}
                                                            size="sm"
                                                            onClick={() => handleAddToCart(product)}
                                                            disabled={inCart}
                                                            className="flex items-center"
                                                        >
                                                            <HiShoppingCart className="h-4 w-4 mr-1" />
                                                            {inCart ? 'In Cart' : 'Add'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Wishlist Summary */}
                        {wishlistItems.length > 0 && (
                            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-4">Wishlist Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {wishlistItems.length}
                                        </div>
                                        <div className="text-sm text-gray-600">Total Items</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {wishlistItems.filter(item =>
                                                (item.product_id || item.product)?.tipe === 'Sell'
                                            ).length}
                                        </div>
                                        <div className="text-sm text-gray-600">For Sale</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {wishlistItems.filter(item =>
                                                (item.product_id || item.product)?.tipe === 'Donation'
                                            ).length}
                                        </div>
                                        <div className="text-sm text-gray-600">Donations</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default WishlistPage;