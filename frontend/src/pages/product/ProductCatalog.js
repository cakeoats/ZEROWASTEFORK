import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiSearch, HiOutlineHeart, HiOutlineEye } from 'react-icons/hi';
import NavbarComponent from '../../components/NavbarComponent';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import Footer from '../../components/Footer';

const API_URL = 'http://localhost:5000';

const ProductCatalog = () => {
    // Hook to get location (URL info)
    const location = useLocation();
    const navigate = useNavigate();
    const { token } = useAuth();

    // Parse URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const categoryFromUrl = queryParams.get('category');

    // State untuk produk dan loading
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for UI controls
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'All');
    const [sortBy, setSortBy] = useState('newest');
    const [wishlist, setWishlist] = useState([]);

    // Data kategori
    const categories = [
        { name: 'All', icon: '🛍️', count: 42 },
        { name: 'Men Fashion', icon: '👔', count: 120 },
        { name: 'Women Fashion', icon: '👗', count: 85 },
        { name: 'Automotive', icon: '🚗', count: 64 },
        { name: 'Gadget', icon: '📱', count: 42 },
        { name: 'Decoration', icon: '🖼️', count: 42 },
        { name: 'Sport', icon: '⚽', count: 42 },
        { name: 'Health And Beauty', icon: '💄', count: 42 },
        { name: 'Kids', icon: '🪁', count: 42 }
    ];

    // Effect to update selected category when URL changes
    useEffect(() => {
        if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
        }
    }, [categoryFromUrl]);

    // Fetch user's wishlist
    useEffect(() => {
        const fetchWishlist = async () => {
            if (!token) {
                setWishlist([]);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/api/wishlist`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Extract product IDs from wishlist items
                const wishlistIds = response.data.map(item => item.product_id);
                setWishlist(wishlistIds);
            } catch (err) {
                console.error('Error fetching wishlist:', err);
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
                // Buat query parameters untuk filter
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

                const response = await axios.get(`${API_URL}/api/products?${params.toString()}`);
                setProducts(response.data);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Gagal memuat produk. Silakan coba lagi nanti.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategory, sortBy, searchQuery]);

    // Fungsi untuk melakukan pencarian
    const handleSearch = () => {
        // Fungsi pencarian akan dijalankan ketika komponen di-mount ulang
        // dengan searchQuery yang sudah diupdate
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

                const response = await axios.get(`${API_URL}/api/products?${params.toString()}`);
                setProducts(response.data);
            } catch (err) {
                console.error('Error searching products:', err);
                setError('Gagal mencari produk. Silakan coba lagi nanti.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    };

    // Simplified price display without "Rp" prefix
    const simplifyPrice = (price) => {
        return `Rp${price.toLocaleString('id-ID')}`;
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

            if (isInWishlist) {
                // Remove from wishlist
                await axios.delete(`${API_URL}/api/wishlist/${productId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWishlist(wishlist.filter(id => id !== productId));
            } else {
                // Add to wishlist
                await axios.post(`${API_URL}/api/wishlist`, {
                    productId: productId
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWishlist([...wishlist, productId]);
            }
        } catch (err) {
            console.error('Error updating wishlist:', err);
            // You can show an error message here if needed
        }
    };

    // Fungsi untuk mendapatkan URL gambar
    const getImageUrl = (product) => {
        // Jika produk memiliki imageUrl (yang sudah diformat dari backend)
        if (product.imageUrl) {
            return product.imageUrl;
        }

        // Jika produk memiliki images (array)
        if (product.images && product.images.length > 0) {
            // Jika image path sudah berupa URL lengkap
            if (product.images[0].startsWith('http')) {
                return product.images[0];
            }

            // Jika image path relatif, gabungkan dengan BASE_URL
            return `${API_URL}/${product.images[0]}`;
        }

        // Fallback ke image placeholder
        return 'https://via.placeholder.com/300';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavbarComponent />

            {/* Breadcrumb navigation */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center text-sm text-gray-500">
                    <Link to="/" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-700">Product</span>
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
                            <h2 className="text-lg font-medium">Filter</h2>
                        </div>

                        {/* Kategori Filter */}
                        <div className="mb-6">
                            <h3 className="font-medium mb-3">Kategori</h3>
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <div
                                        key={category.name}
                                        className={`flex items-center cursor-pointer p-2 rounded-md ${selectedCategory === category.name
                                                ? 'bg-amber-50 text-amber-600'
                                                : 'hover:bg-gray-50'
                                            }`}
                                        onClick={() => setSelectedCategory(category.name)}
                                    >
                                        <span className="mr-2">{category.icon}</span>
                                        <span>{category.name}</span>
                                        <span className="ml-auto text-xs text-gray-500">{category.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        <button
                            onClick={() => {
                                setSelectedCategory('All');
                                setSearchQuery('');
                                setSortBy('newest');
                                handleSearch();
                            }}
                            className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Right Content - Product Grid */}
                    <div className="flex-1">
                        {/* Search and Sort Controls */}
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white rounded-lg shadow-sm p-4">
                            <div className="relative w-full md:w-64 mb-4 md:mb-0">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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

                            <div className="flex items-center">
                                <span className="text-sm text-gray-600 mr-2">Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="newest">Terbaru</option>
                                    <option value="price-desc">Harga: Tinggi ke Rendah</option>
                                    <option value="price-asc">Harga: Rendah ke Tinggi</option>
                                </select>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="flex justify-center items-center py-12">
                                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        {/* Products Grid */}
                        {!loading && products.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {products.map((product) => (
                                    <div key={product._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="relative">
                                            <Link to={`/products/${product._id}`}>
                                                <img
                                                    src={getImageUrl(product)}
                                                    alt={product.name}
                                                    className="w-full aspect-square object-cover"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                                                    }}
                                                />
                                            </Link>

                                            {/* Wishlist Heart Icon */}
                                            <button
                                                onClick={(e) => toggleWishlist(product._id, e)}
                                                className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-gray-400 hover:text-red-500 transition-colors"
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
                                        </div>

                                        <div className="p-3">
                                            <Link to={`/products/${product._id}`}>
                                                <h3 className="font-medium text-gray-800 mb-1 truncate">{product.name}</h3>
                                            </Link>
                                            <p className="text-sm text-gray-500 mb-2 capitalize">{product.category}</p>

                                            <div className="flex items-center justify-between">
                                                <div className="font-semibold text-gray-800">
                                                    {simplifyPrice(product.price)}
                                                </div>
                                                <Link
                                                    to={`/products/${product._id}`}
                                                    className="text-amber-500 hover:text-amber-600"
                                                >
                                                    <HiOutlineEye className="w-5 h-5" />
                                                </Link>
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
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Found</h3>
                                <p className="text-gray-500 mb-6">Try a different search term or filter</p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('All');
                                        setSortBy('newest');
                                        handleSearch();
                                    }}
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Clear Filters
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