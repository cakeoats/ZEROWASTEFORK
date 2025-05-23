import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineHeart, HiOutlineEye, HiTrash, HiOutlineShoppingCart } from 'react-icons/hi';
import NavbarComponent from '../../components/NavbarComponent';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import axios from 'axios';
import Footer from '../../components/Footer';

const API_URL = 'https://zerowastemarket-production.up.railway.app';

const WishlistPage = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const { language } = useLanguage();
    const translate = useTranslate(language);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: '/wishlist' } });
        }
    }, [token, navigate]);

    // Fetch wishlist items
    useEffect(() => {
        const fetchWishlist = async () => {
            if (!token) return;

            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/api/wishlist`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWishlistItems(response.data);
            } catch (err) {
                console.error('Error fetching wishlist:', err);
                setError('Failed to load your wishlist. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [token]);

    // Remove item from wishlist
    const removeFromWishlist = async (productId) => {
        try {
            await axios.delete(`${API_URL}/api/wishlist/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state - Fixed to safely check if product_id exists and has _id
            setWishlistItems(wishlistItems.filter(item => 
                item.product_id && item.product_id._id ? 
                item.product_id._id !== productId : true
            ));
        } catch (err) {
            console.error('Error removing from wishlist:', err);
            setError('Failed to remove item from wishlist.');
        }
    };

    // Helper to format price
    const simplifyPrice = (price) => {
        return `Rp${price.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}`;
    };

    // Function to get product image URL
   const getImageUrl = (product) => {
  if (product.imageUrl) {
    return product.imageUrl;
  }

  if (product.images && product.images.length > 0) {
    if (product.images[0].startsWith('http')) {
      return product.images[0];
    }
    return `https://zerowastemarket-production.up.railway.app/${product.images[0]}`;
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
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        <p>{error}</p>
                    </div>
                )}

                {/* Loading state */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : wishlistItems.length === 0 ? (
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
                                                src={getImageUrl(item.product_id)}
                                                alt={item.product_id.name || 'Product'}
                                                className="w-full aspect-square object-cover"
                                                onError={(e) => {
                                                    e.target.src = 'https://zerowastemarket-production.up.railway.app/uploads/default-product.jpg?text=No+Image';
                                                }}
                                            />
                                        </Link>

                                        {/* Remove button */}
                                        <button
                                            onClick={() => removeFromWishlist(item.product_id._id)}
                                            className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-gray-400 hover:text-red-500 transition-colors"
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
            </div>

            <Footer />
        </div>
    );
};

export default WishlistPage;