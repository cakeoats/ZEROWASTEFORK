// frontend/src/pages/product/WishlistPage.js - FIXED with Enhanced Error Handling
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineHeart, HiOutlineEye, HiTrash, HiOutlineShoppingCart, HiExclamationTriangle } from 'react-icons/hi';
import NavbarComponent from '../../components/NavbarComponent';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import axios from 'axios';
import Footer from '../../components/Footer';
import { getApiUrl, getImageUrl, getAuthHeaders, apiRequest, checkApiHealth } from '../../config/api';

const WishlistPage = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const { language } = useLanguage();
    const translate = useTranslate(language);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [apiHealth, setApiHealth] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Redirect if not logged in
    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: '/wishlist' } });
        }
    }, [token, navigate]);

    // Check API health first
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const health = await checkApiHealth();
                setApiHealth(health);
                console.log('🏥 API Health Check Success:', health);
            } catch (err) {
                console.error('🚨 API Health Check Failed:', err);
                setApiHealth({ status: 'ERROR', error: err.message });
            }
        };

        checkHealth();
    }, []);

    // FIXED: Enhanced wishlist fetching with retry logic
    useEffect(() => {
        const fetchWishlist = async () => {
            if (!token) return;

            setLoading(true);
            setError(null);

            const maxRetries = 3;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`🔄 Fetching wishlist (attempt ${attempt}/${maxRetries})...`);
                    
                    // Method 1: Using custom apiRequest with retry logic
                    const wishlistUrl = getApiUrl('api/wishlist');
                    const data = await apiRequest(wishlistUrl, {
                        method: 'GET',
                        headers: getAuthHeaders()
                    });

                    console.log('✅ Wishlist data received:', data);
                    setWishlistItems(data || []);
                    setLoading(false);
                    return; // Success, exit retry loop

                } catch (err) {
                    console.error(`❌ Wishlist fetch attempt ${attempt} failed:`, err);
                    
                    // If this is the last attempt, set error
                    if (attempt === maxRetries) {
                        let errorMessage = 'Failed to load your wishlist.';
                        
                        if (err.message.includes('CORS')) {
                            errorMessage = 'Connection blocked by browser. Please check if the website is properly configured.';
                        } else if (err.message.includes('401')) {
                            errorMessage = 'Your session has expired. Please login again.';
                            // Redirect to login after showing error
                            setTimeout(() => {
                                navigate('/login', { state: { from: '/wishlist' } });
                            }, 3000);
                        } else if (err.message.includes('Network')) {
                            errorMessage = 'Network error. Please check your internet connection and try again.';
                        } else if (err.message.includes('500')) {
                            errorMessage = 'Server error. Please try again later.';
                        }
                        
                        setError(errorMessage);
                        setLoading(false);
                    } else {
                        // Wait before next attempt
                        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                        console.log(`⏳ Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
        };

        if (apiHealth && apiHealth.status === 'OK') {
            fetchWishlist();
        } else if (apiHealth && apiHealth.status === 'ERROR') {
            setError('API server is not responding. Please try again later.');
            setLoading(false);
        }
    }, [token, apiHealth, retryCount]);

    // FIXED: Enhanced remove from wishlist with better error handling
    const removeFromWishlist = async (productId) => {
        try {
            console.log('🗑️ Removing from wishlist:', productId);

            const removeUrl = getApiUrl(`api/wishlist/${productId}`);
            await apiRequest(removeUrl, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            // Update local state - Fixed to safely check if product_id exists and has _id
            setWishlistItems(wishlistItems.filter(item =>
                item.product_id && item.product_id._id ?
                    item.product_id._id !== productId : true
            ));

            console.log('✅ Item removed from wishlist');

        } catch (err) {
            console.error('❌ Error removing from wishlist:', err);
            
            let errorMessage = 'Failed to remove item from wishlist.';
            if (err.message.includes('401')) {
                errorMessage = 'Session expired. Please login again.';
            } else if (err.message.includes('404')) {
                errorMessage = 'Item not found in wishlist.';
            }
            
            setError(errorMessage);
            
            // Auto-clear error after 5 seconds
            setTimeout(() => setError(null), 5000);
        }
    };

    // Retry function
    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setError(null);
    };

    // Helper to format price
    const simplifyPrice = (price) => {
        return `Rp${price.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}`;
    };

    // Function to get product image URL
    const getProductImageUrl = (product) => {
        if (product.imageUrl) {
            return product.imageUrl;
        }

        if (product.images && product.images.length > 0) {
            return getImageUrl(product.images[0]);
        }

        return 'https://via.placeholder.com/300?text=No+Image';
    };

    if (!token) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <NavbarComponent />

            {/* Breadcrumb navigation */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center text-sm text-gray-500">
                    <Link to="/" className="hover:text-gray-700">{translate('footer.home')}</Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-700">{translate('common.myWishlist')}</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pb-12">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{translate('wishlist.title')}</h1>
                    <p className="text-gray-600">{translate('wishlist.subtitle')}</p>
                    
                    {/* API Health Status (only show if there are issues) */}
                    {apiHealth && apiHealth.status === 'ERROR' && (
                        <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                            <div className="flex items-center">
                                <HiExclamationTriangle className="h-5 w-5 mr-2" />
                                <span className="text-sm">
                                    API connection issue: {apiHealth.error}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error message with retry option */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <HiExclamationTriangle className="h-5 w-5 mr-2" />
                                <p>{error}</p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">
                                {language === 'id' ? 'Memuat wishlist...' : 'Loading wishlist...'}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Attempt {retryCount + 1}
                            </p>
                        </div>
                    </div>
                ) : wishlistItems.length === 0 && !error ? (
                    // Empty wishlist state
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="inline-flex justify-center items-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                            <HiOutlineHeart className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-medium text-gray-900 mb-2">{translate('wishlist.empty')}</h2>
                        <p className="text-gray-500 mb-6">{translate('wishlist.saveItems')}</p>
                        <Link to="/product-list" className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors inline-block">
                            {translate('wishlist.exploreProducts')}
                        </Link>
                    </div>
                ) : (
                    // Wishlist items grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {wishlistItems.map((item) => {
                            // Skip rendering items with missing product data
                            if (!item.product_id) {
                                return null;
                            }

                            return (
                                <div key={item._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                                    <div className="relative">
                                        <Link to={`/products/${item.product_id._id}`}>
                                            <img
                                                src={getProductImageUrl(item.product_id)}
                                                alt={item.product_id.name || 'Product'}
                                                className="w-full aspect-square object-cover"
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                                                }}
                                            />
                                        </Link>

                                        {/* Remove button */}
                                        <button
                                            onClick={() => removeFromWishlist(item.product_id._id)}
                                            className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                                        >
                                            <HiTrash className="w-5 h-5" />
                                        </button>

                                        {/* Sale Badge */}
                                        {item.product_id.discount && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
                                                SALE
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <Link to={`/products/${item.product_id._id}`}>
                                            <h3 className="font-medium text-gray-800 mb-1 truncate">{item.product_id.name}</h3>
                                        </Link>
                                        <p className="text-sm text-gray-500 mb-2 capitalize">{item.product_id.category}</p>

                                        <div className="flex items-center justify-between mb-3">
                                            <div className="font-semibold text-gray-800">
                                                {simplifyPrice(item.product_id.price)}
                                            </div>
                                        </div>

                                        <div className="flex space-x-2">
                                            <Link
                                                to={`/products/${item.product_id._id}`}
                                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-colors text-sm flex items-center justify-center"
                                            >
                                                <HiOutlineShoppingCart className="mr-1 w-4 h-4" />
                                                {translate('product.buyNow')}
                                            </Link>
                                            <Link
                                                to={`/products/${item.product_id._id}`}
                                                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <HiOutlineEye className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Debug info for development */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
                        <h3 className="font-bold mb-2">Debug Information:</h3>
                        <div className="space-y-1">
                            <div>API Health: {apiHealth?.status || 'Unknown'}</div>
                            <div>Token: {token ? 'Present' : 'Missing'}</div>
                            <div>User: {user?.username || 'Unknown'}</div>
                            <div>Wishlist Items: {wishlistItems.length}</div>
                            <div>Retry Count: {retryCount}</div>
                            <div>Error: {error || 'None'}</div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default WishlistPage;