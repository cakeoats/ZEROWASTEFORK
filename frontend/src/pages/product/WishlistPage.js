// frontend/src/pages/product/WishlistPage.js - WITHOUT STATISTICS SECTION
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HiOutlineHeart, 
  HiOutlineEye, 
  HiTrash, 
  HiOutlineShoppingCart, 
  HiExclamation
} from 'react-icons/hi';
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

    // Enhanced wishlist fetching with retry logic
    useEffect(() => {
        const fetchWishlist = async () => {
            if (!token) return;

            setLoading(true);
            setError(null);

            const maxRetries = 3;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`🔄 Fetching wishlist (attempt ${attempt}/${maxRetries})...`);
                    
                    const response = await axios.get(getApiUrl('api/wishlist'), {
                        headers: getAuthHeaders(),
                        timeout: 15000
                    });

                    console.log('✅ Wishlist data received:', response.data);
                    setWishlistItems(response.data || []);
                    setLoading(false);
                    return; // Success, exit retry loop

                } catch (err) {
                    console.error(`❌ Wishlist fetch attempt ${attempt} failed:`, err);
                    
                    // If this is the last attempt, set error
                    if (attempt === maxRetries) {
                        let errorMessage = 'Failed to load your wishlist.';
                        
                        if (err.code === 'ECONNABORTED') {
                            errorMessage = 'Request timeout. Please check your connection.';
                        } else if (err.response?.status === 401) {
                            errorMessage = 'Your session has expired. Please login again.';
                            setTimeout(() => {
                                navigate('/login', { state: { from: '/wishlist' } });
                            }, 3000);
                        } else if (err.response?.status === 500) {
                            errorMessage = 'Server error. Please try again later.';
                        } else if (err.message.includes('Network')) {
                            errorMessage = 'Network error. Please check your internet connection.';
                        } else if (err.response?.data?.message) {
                            errorMessage = err.response.data.message;
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
    }, [token, apiHealth, retryCount, navigate]);

    // Enhanced remove from wishlist with better error handling
    const removeFromWishlist = async (productId) => {
        try {
            console.log('🗑️ Removing from wishlist:', productId);

            await axios.delete(getApiUrl(`api/wishlist/${productId}`), {
                headers: getAuthHeaders(),
                timeout: 10000
            });

            // Update local state
            setWishlistItems(wishlistItems.filter(item =>
                item.product_id && item.product_id._id ?
                    item.product_id._id !== productId : true
            ));

            console.log('✅ Item removed from wishlist');

        } catch (err) {
            console.error('❌ Error removing from wishlist:', err);
            
            let errorMessage = 'Failed to remove item from wishlist.';
            if (err.response?.status === 401) {
                errorMessage = 'Session expired. Please login again.';
            } else if (err.response?.status === 404) {
                errorMessage = 'Item not found in wishlist.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
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
        if (!price || isNaN(price)) return 'Price not available';
        return `Rp${price.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}`;
    };

    // Function to get product image URL
    const getProductImageUrl = (product) => {
        if (!product) return 'https://via.placeholder.com/300?text=No+Product';

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
                    <Link to="/" className="hover:text-gray-700">
                        {translate('footer.home') || 'Home'}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-700">
                        {translate('common.myWishlist') || 'My Wishlist'}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pb-12">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {translate('wishlist.title') || 'My Wishlist'}
                    </h1>
                    <p className="text-gray-600">
                        {translate('wishlist.subtitle') || 'Save items you love and want to buy later'}
                    </p>
                    
                    {/* API Health Status (only show if there are issues) */}
                    {apiHealth && apiHealth.status === 'ERROR' && (
                        <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                            <div className="flex items-center">
                                <HiExclamation className="h-5 w-5 mr-2" />
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
                                <HiExclamation className="h-5 w-5 mr-2" />
                                <p>{error}</p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors"
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
                        <h2 className="text-xl font-medium text-gray-900 mb-2">
                            {translate('wishlist.empty') || 'Your wishlist is empty'}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {translate('wishlist.saveItems') || 'Save items you love to your wishlist'}
                        </p>
                        <Link 
                            to="/product-list" 
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors inline-block"
                        >
                            {translate('wishlist.exploreProducts') || 'Explore Products'}
                        </Link>
                    </div>
                ) : (
                    // Wishlist items grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {wishlistItems.map((item) => {
                            // Skip rendering items with missing product data
                            if (!item.product_id || !item.product_id._id) {
                                console.warn('Skipping wishlist item with missing product data:', item);
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
                                            title="Remove from wishlist"
                                        >
                                            <HiTrash className="w-5 h-5" />
                                        </button>

                                        {/* Sale Badge */}
                                        {item.product_id.discount && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
                                                SALE
                                            </div>
                                        )}

                                        {/* Product Type Badge */}
                                        <div className="absolute bottom-2 left-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.product_id.tipe === 'Donation' ? 'bg-purple-100 text-purple-800' :
                                                item.product_id.tipe === 'Swap' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {item.product_id.tipe === 'Sell' ? (language === 'id' ? 'Jual' : 'Sell') :
                                                 item.product_id.tipe === 'Donation' ? (language === 'id' ? 'Donasi' : 'Donation') :
                                                 item.product_id.tipe === 'Swap' ? (language === 'id' ? 'Tukar' : 'Swap') : 
                                                 item.product_id.tipe}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <Link to={`/products/${item.product_id._id}`}>
                                            <h3 className="font-medium text-gray-800 mb-1 truncate" title={item.product_id.name}>
                                                {item.product_id.name || 'Unnamed Product'}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-gray-500 mb-2 capitalize">
                                            {item.product_id.category || 'No category'}
                                        </p>

                                        <div className="flex items-center justify-between mb-3">
                                            <div className="font-semibold text-gray-800">
                                                {item.product_id.tipe === 'Donation' ? (
                                                    <span className="text-purple-600">FREE</span>
                                                ) : item.product_id.tipe === 'Swap' ? (
                                                    <span className="text-blue-600">SWAP</span>
                                                ) : (
                                                    simplifyPrice(item.product_id.price)
                                                )}
                                            </div>
                                            {/* Condition badge */}
                                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                                {item.product_id.condition === 'new' ? 
                                                    (language === 'id' ? 'Baru' : 'New') : 
                                                    (language === 'id' ? 'Bekas' : 'Used')
                                                }
                                            </span>
                                        </div>

                                        <div className="flex space-x-2">
                                            <Link
                                                to={`/products/${item.product_id._id}`}
                                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-colors text-sm flex items-center justify-center"
                                            >
                                                <HiOutlineShoppingCart className="mr-1 w-4 h-4" />
                                                {item.product_id.tipe === 'Donation' ? 
                                                    (language === 'id' ? 'Ambil' : 'Claim') :
                                                 item.product_id.tipe === 'Swap' ? 
                                                    (language === 'id' ? 'Tukar' : 'Swap') :
                                                    (translate('product.buyNow') || 'Buy Now')
                                                }
                                            </Link>
                                            <Link
                                                to={`/products/${item.product_id._id}`}
                                                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                title="View details"
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

                {/* Quick action buttons - Show if wishlist has items */}
                {!loading && wishlistItems.length > 0 && (
                    <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link
                                to="/product-list"
                                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                            >
                                {language === 'id' ? 'Jelajahi Produk Lainnya' : 'Explore More Products'}
                            </Link>
                            <Link
                                to="/upload-product"
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                            >
                                {language === 'id' ? 'Upload Produk' : 'Upload Product'}
                            </Link>
                        </div>
                    </div>
                )}

                {/* Debug info for development */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
                        <h3 className="font-bold mb-2">Debug Information:</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div>API Health: <span className="font-mono">{apiHealth?.status || 'Unknown'}</span></div>
                                <div>Token: <span className="font-mono">{token ? 'Present' : 'Missing'}</span></div>
                                <div>User: <span className="font-mono">{user?.username || 'Unknown'}</span></div>
                                <div>Loading: <span className="font-mono">{loading.toString()}</span></div>
                            </div>
                            <div className="space-y-1">
                                <div>Wishlist Items: <span className="font-mono">{wishlistItems.length}</span></div>
                                <div>Retry Count: <span className="font-mono">{retryCount}</span></div>
                                <div>Error: <span className="font-mono">{error || 'None'}</span></div>
                                <div>Environment: <span className="font-mono">{process.env.NODE_ENV}</span></div>
                            </div>
                        </div>
                        
                        {/* API URLs for debugging */}
                        <div className="mt-4 pt-4 border-t border-gray-300">
                            <div className="text-xs space-y-1">
                                <div>Wishlist API: <code>{getApiUrl('api/wishlist')}</code></div>
                                <div>Health API: <code>{getApiUrl('health')}</code></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default WishlistPage;