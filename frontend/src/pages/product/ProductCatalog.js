import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiSearch, HiOutlineHeart, HiOutlineEye } from 'react-icons/hi';
import NavbarComponent from '../../components/NavbarComponent';
import ProductImage from '../../components/ProductImage';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import axios from 'axios';
import Footer from '../../components/Footer';
import { getApiUrl, getAuthHeaders } from '../../config/api';

const ProductCatalog = () => {
    // Hook to get location (URL info)
    const location = useLocation();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { language } = useLanguage();
    const translate = useTranslate(language);

    // Parse URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const categoryFromUrl = queryParams.get('category');

    // State for products and loading
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for UI controls
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'All');
    const [sortBy, setSortBy] = useState('newest');
    const [wishlist, setWishlist] = useState([]);

    // State for category statistics from database
    const [categoryStats, setCategoryStats] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Dynamic categories with real counts (will be updated from API)
    const [categories, setCategories] = useState([
        { name: 'All', icon: '🛍️', count: 0 },
        { name: 'Men Fashion', icon: '👔', count: 0 },
        { name: 'Women Fashion', icon: '👗', count: 0 },
        { name: 'Automotive', icon: '🚗', count: 0 },
        { name: 'Gadget', icon: '📱', count: 0 },
        { name: 'Decoration', icon: '🖼️', count: 0 },
        { name: 'Sport', icon: '⚽', count: 0 },
        { name: 'Health And Beauty', icon: '💄', count: 0 },
        { name: 'Kids', icon: '🪁', count: 0 }
    ]);

    // Effect to update selected category when URL changes
    useEffect(() => {
        if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
        }
    }, [categoryFromUrl]);

    // Fetch category statistics from database - FIXED
    useEffect(() => {
        const fetchCategoryStats = async () => {
            setCategoriesLoading(true);
            try {
                console.log('🔍 Fetching category statistics from database...');

                // FIXED: Use the correct endpoint that matches backend route
                const response = await axios.get(getApiUrl('api/products/category-stats'));

                console.log('✅ Category stats received:', response.data);
                const statsData = response.data.stats || [];
                setCategoryStats(statsData);

                // FIXED: Better category mapping with normalized names
                const updatedCategories = categories.map(category => {
                    if (category.name === 'All') {
                        // Calculate total count for "All" category
                        const totalCount = statsData.reduce((total, stat) => total + stat.count, 0);
                        return { ...category, count: totalCount };
                    } else {
                        // FIXED: Better matching logic for category names
                        const categoryLower = category.name.toLowerCase();
                        const stat = statsData.find(s => {
                            const statLower = s._id?.toLowerCase() || '';

                            // Direct match
                            if (statLower === categoryLower) return true;

                            // Handle space variations
                            const categoryNoSpace = categoryLower.replace(/\s+/g, '');
                            const statNoSpace = statLower.replace(/\s+/g, '');
                            if (statNoSpace === categoryNoSpace) return true;

                            // Handle "health and beauty" vs "health and beauty"
                            if (categoryLower.includes('health') && statLower.includes('health')) return true;
                            if (categoryLower.includes('beauty') && statLower.includes('beauty')) return true;

                            // Handle partial matches for common variations
                            if (categoryLower.includes('men') && statLower.includes('men')) return true;
                            if (categoryLower.includes('women') && statLower.includes('women')) return true;
                            if (categoryLower.includes('fashion') && statLower.includes('fashion')) return true;

                            return false;
                        });

                        const count = stat?.count || 0;
                        console.log(`📊 Category "${category.name}" mapped to count: ${count}`);

                        return { ...category, count };
                    }
                });

                setCategories(updatedCategories);
                console.log('✅ Categories updated with real counts:', updatedCategories);

            } catch (err) {
                console.error('❌ Error fetching category stats:', err);

                // FIXED: Fallback to manual count if API fails
                try {
                    console.log('🔄 Fallback: Manually counting products...');
                    const productsResponse = await axios.get(getApiUrl('api/products'));
                    const allProducts = productsResponse.data || [];

                    // Manual count by category
                    const manualCounts = {};
                    allProducts.forEach(product => {
                        const category = product.category || 'unknown';
                        manualCounts[category] = (manualCounts[category] || 0) + 1;
                    });

                    // Update categories with manual counts
                    const fallbackCategories = categories.map(category => {
                        if (category.name === 'All') {
                            return { ...category, count: allProducts.length };
                        } else {
                            const categoryLower = category.name.toLowerCase();
                            const matchingKey = Object.keys(manualCounts).find(key =>
                                key.toLowerCase() === categoryLower ||
                                key.toLowerCase().replace(/\s+/g, '') === categoryLower.replace(/\s+/g, '')
                            );
                            const count = matchingKey ? manualCounts[matchingKey] : 0;
                            return { ...category, count };
                        }
                    });

                    setCategories(fallbackCategories);
                    console.log('✅ Fallback categories with manual counts:', fallbackCategories);

                } catch (fallbackErr) {
                    console.error('❌ Fallback count also failed:', fallbackErr);
                    // Keep default counts of 0
                }
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategoryStats();
    }, []); // Only run once on component mount

    // Fetch user's wishlist
    useEffect(() => {
        const fetchWishlist = async () => {
            if (!token) {
                setWishlist([]);
                return;
            }

            try {
                const response = await axios.get(getApiUrl('api/wishlist'), {
                    headers: getAuthHeaders()
                });
                // Extract product IDs from wishlist items
                const wishlistIds = response.data.map(item =>
                    item.product_id?._id || item.product_id
                ).filter(Boolean);
                setWishlist(wishlistIds);
                console.log('✅ Wishlist loaded:', wishlistIds.length, 'items');
            } catch (err) {
                console.error('❌ Error fetching wishlist:', err);
                setWishlist([]);
            }
        };

        fetchWishlist();
    }, [token]);

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);

            try {
                // Create query parameters for filter
                const params = new URLSearchParams();

                if (selectedCategory && selectedCategory !== 'All') {
                    params.append('category', selectedCategory);
                }

                if (searchQuery) {
                    params.append('search', searchQuery);
                }

                if (sortBy) {
                    params.append('sort', sortBy);
                }

                console.log('🔍 Fetching products with params:', params.toString());
                const response = await axios.get(getApiUrl(`api/products?${params.toString()}`));

                console.log('✅ Products fetched:', response.data.length, 'items');
                setProducts(response.data);
            } catch (err) {
                console.error('❌ Error fetching products:', err);
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategory, sortBy, searchQuery]);

    // Function to perform search
    const handleSearch = () => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();

                if (selectedCategory && selectedCategory !== 'All') {
                    params.append('category', selectedCategory);
                }

                if (searchQuery) {
                    params.append('search', searchQuery);
                }

                if (sortBy) {
                    params.append('sort', sortBy);
                }

                console.log('🔍 Searching products with params:', params.toString());
                const response = await axios.get(getApiUrl(`api/products?${params.toString()}`));
                setProducts(response.data);
            } catch (err) {
                console.error('❌ Error searching products:', err);
                setError('Failed to search products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    };

    // FIXED: Category selection handler that updates counts
    const handleCategorySelect = async (categoryName) => {
        setSelectedCategory(categoryName);

        // Update URL if needed
        const newParams = new URLSearchParams(location.search);
        if (categoryName === 'All') {
            newParams.delete('category');
        } else {
            newParams.set('category', categoryName);
        }

        const newUrl = `${location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`;
        window.history.replaceState(null, '', newUrl);
    };

    // Simplified price display
    const simplifyPrice = (price) => {
        return `Rp${price.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}`;
    };

    // Handle upload click for users that are not authenticated
    const handleUploadClick = (e) => {
        if (!token) {
            e.preventDefault();
            navigate('/register', { state: { from: '/upload-product' } });
        }
    };

    // Toggle wishlist
    const toggleWishlist = async (productId, e) => {
        // Prevent navigation to product detail page
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!token) {
            // Redirect to login if not authenticated
            navigate('/login', { state: { from: '/product-list' } });
            return;
        }

        try {
            const isInWishlist = wishlist.includes(productId);
            console.log('🔄 Toggling wishlist for product:', productId, 'Currently in wishlist:', isInWishlist);

            if (isInWishlist) {
                // Remove from wishlist
                await axios.delete(getApiUrl(`api/wishlist/${productId}`), {
                    headers: getAuthHeaders()
                });
                setWishlist(wishlist.filter(id => id !== productId));
                console.log('❌ Removed from wishlist:', productId);
            } else {
                // Add to wishlist
                await axios.post(getApiUrl('api/wishlist'), {
                    productId: productId
                }, {
                    headers: getAuthHeaders()
                });
                setWishlist([...wishlist, productId]);
                console.log('✅ Added to wishlist:', productId);
            }
        } catch (err) {
            console.error('❌ Error updating wishlist:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavbarComponent />

            {/* Breadcrumb navigation */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center text-sm text-gray-500">
                    <Link to="/" className="hover:text-gray-700">{translate('footer.home')}</Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-700">{translate('footer.products')}</span>
                </div>
            </div>

            {/* Floating Upload Button for Mobile */}
            <Link
                to={token ? "/upload-product" : "/register"}
                onClick={handleUploadClick}
                className="fixed bottom-6 right-6 z-40 md:hidden bg-amber-500 hover:bg-amber-600 text-white rounded-full p-4 shadow-lg transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </Link>

            {/* Main Content */}
            <div className="container mx-auto px-4 pb-12">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Sidebar - Filters */}
                    <div className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">{translate('product.filter')}</h2>
                            {categoriesLoading && (
                                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </div>

                        {/* Category Filter - FIXED */}
                        <div className="mb-6">
                            <h3 className="font-medium mb-3">{translate('product.categories')}</h3>
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <div
                                        key={category.name}
                                        className={`flex items-center cursor-pointer p-2 rounded-md transition-colors ${selectedCategory === category.name
                                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                                : 'hover:bg-gray-50'
                                            }`}
                                        onClick={() => handleCategorySelect(category.name)}
                                    >
                                        <span className="mr-2 text-lg">{category.icon}</span>
                                        <span className="flex-1 text-sm font-medium">
                                            {category.name === 'All' ? translate('product.allCategories') : category.name}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center ${categoriesLoading
                                                ? 'bg-gray-100 text-gray-400'
                                                : category.count > 0
                                                    ? selectedCategory === category.name
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {categoriesLoading ? '...' : category.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        <button
                            onClick={() => {
                                handleCategorySelect('All');
                                setSearchQuery('');
                                setSortBy('newest');
                                handleSearch();
                            }}
                            className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                        >
                            {translate('product.clearFilters') || 'Clear Filters'}
                        </button>

                        {/* Debug Info for Development */}
                        {process.env.NODE_ENV === 'development' && categoryStats.length > 0 && (
                            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
                                <div className="font-medium mb-2 text-gray-700">Debug - API Stats:</div>
                                <div className="space-y-1">
                                    {categoryStats.map((stat, index) => (
                                        <div key={index} className="flex justify-between text-gray-600">
                                            <span className="truncate">{stat._id || 'unknown'}:</span>
                                            <span className="font-mono font-bold">{stat.count}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-200 font-medium text-gray-700">
                                    Total: {categoryStats.reduce((sum, stat) => sum + stat.count, 0)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Content - Product Grid */}
                    <div className="flex-1">
                        {/* Search and Sort Controls */}
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white rounded-lg shadow-sm p-4">
                            <div className="relative w-full md:w-64 mb-4 md:mb-0">
                                <input
                                    type="text"
                                    placeholder={translate('common.search') || 'Search products...'}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-amber-500 hover:text-amber-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-600 font-medium">
                                    {products.length} {language === 'id' ? 'produk ditemukan' : 'products found'}
                                </span>

                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600 mr-2">{translate('product.sort') || 'Sort'}:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                    >
                                        <option value="newest">{translate('product.newest') || 'Newest'}</option>
                                        <option value="price-desc">{translate('product.priceHighToLow') || 'Price: High to Low'}</option>
                                        <option value="price-asc">{translate('product.priceLowToHigh') || 'Price: Low to High'}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-600 p-4 rounded-lg mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="flex justify-center items-center py-12 bg-white rounded-lg shadow-sm">
                                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="ml-3 text-gray-600">
                                    {language === 'id' ? 'Memuat produk...' : 'Loading products...'}
                                </p>
                            </div>
                        )}

                        {/* Products Grid */}
                        {!loading && products.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {products.map((product) => (
                                    <div key={product._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="relative">
                                            <Link to={`/products/${product._id}`}>
                                                <ProductImage
                                                    product={product}
                                                    className="w-full aspect-square object-cover"
                                                    alt={product.name}
                                                    onImageLoad={(url) => console.log('✅ Image loaded in catalog:', url)}
                                                    onImageError={() => console.log('❌ Image error in catalog for:', product.name)}
                                                />
                                            </Link>

                                            {/* Wishlist Heart Icon */}
                                            <button
                                                onClick={(e) => toggleWishlist(product._id, e)}
                                                className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                                            >
                                                <HiOutlineHeart
                                                    className={`w-5 h-5 ${wishlist.includes(product._id) ? 'text-red-500 fill-red-500' : ''}`}
                                                />
                                            </button>

                                            {/* Sale Badge */}
                                            {product.discount && (
                                                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
                                                    SALE
                                                </div>
                                            )}

                                            {/* Product Type Badge */}
                                            <div className="absolute bottom-2 left-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.tipe === 'Donation' ? 'bg-purple-100 text-purple-800' :
                                                        product.tipe === 'Swap' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {product.tipe === 'Sell' ? (language === 'id' ? 'Jual' : 'Sell') :
                                                        product.tipe === 'Donation' ? (language === 'id' ? 'Donasi' : 'Donation') :
                                                            product.tipe === 'Swap' ? (language === 'id' ? 'Tukar' : 'Swap') : product.tipe}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3">
                                            <Link to={`/products/${product._id}`}>
                                                <h3 className="font-medium text-gray-800 mb-1 truncate" title={product.name}>
                                                    {product.name}
                                                </h3>
                                            </Link>
                                            <p className="text-sm text-gray-500 mb-2 capitalize">{product.category}</p>

                                            <div className="flex items-center justify-between">
                                                <div className="font-semibold text-gray-800">
                                                    {product.tipe === 'Donation' ? (
                                                        <span className="text-purple-600">Free</span>
                                                    ) : product.tipe === 'Swap' ? (
                                                        <span className="text-blue-600">Swap</span>
                                                    ) : (
                                                        simplifyPrice(product.price)
                                                    )}
                                                </div>
                                                <Link
                                                    to={`/products/${product._id}`}
                                                    className="text-amber-500 hover:text-amber-600 p-1"
                                                >
                                                    <HiOutlineEye className="w-5 h-5" />
                                                </Link>
                                            </div>

                                            {/* Product condition and availability */}
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-xs text-gray-500">
                                                    {product.condition === 'new' ?
                                                        (language === 'id' ? 'Baru' : 'New') :
                                                        (language === 'id' ? 'Bekas' : 'Used')
                                                    }
                                                </span>
                                                <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                                                    1 {language === 'id' ? 'unit' : 'unit'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !loading && (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <div className="inline-flex justify-center items-center w-24 h-24 bg-gray-100 rounded-full mb-4">
                                    <HiSearch className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">
                                    {translate('product.noProducts') || 'No products found'}
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    {selectedCategory !== 'All'
                                        ? `No products found in "${selectedCategory}" category.`
                                        : 'Try a different search term or filter'
                                    }
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        handleCategorySelect('All');
                                        setSortBy('newest');
                                        handleSearch();
                                    }}
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    {translate('product.clearFilters') || 'Clear Filters'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ProductCatalog;