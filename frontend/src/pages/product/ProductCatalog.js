import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiSearch, HiOutlineHeart, HiOutlineShoppingCart, HiOutlineEye } from 'react-icons/hi';
import NavbarComponent from '../../components/NavbarComponent';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

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
    const [sortBy, setSortBy] = useState('recommended');

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
                
                if (sortBy !== 'recommended') {
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
    }, [selectedCategory, sortBy]);
    
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
                
                if (sortBy !== 'recommended') {
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

    // Format harga
    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    // Handle upload click for users that are not authenticated
    const handleUploadClick = (e) => {
        if (!token) {
            e.preventDefault();
            navigate('/register', { state: { from: '/upload-product' } });
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

            {/* Floating Upload Button for Mobile */}
            <Link
                to={token ? "/upload-product" : "/register"}
                onClick={handleUploadClick}
                className="fixed bottom-6 right-6 z-40 md:hidden bg-blue-700 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </Link>

            {/* Header & Search */}
            <header className="bg-sky-700 shadow-sm">
                <div className="container mx-auto px-4 pt-20 pb-10">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <h1 className="text-3xl font-bold text-white mb-6 md:mb-0">Our Products</h1>

                        <div className="w-full md:w-auto flex">
                            <Link 
                                to={token ? "/upload-product" : "/register"} 
                                onClick={handleUploadClick}
                                className="hidden md:flex items-center bg-white text-blue-700 px-4 py-2 rounded-l-lg font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Upload
                            </Link>
                            <div className="relative flex-1 md:w-64 flex">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full py-2 pl-10 pr-4 bg-white rounded-l-lg md:rounded-l-none md:rounded-none border-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button 
                                    onClick={handleSearch}
                                    className="bg-white px-4 rounded-r-lg border-l border-gray-200 text-blue-700 hover:bg-blue-50"
                                >
                                    <HiSearch className="w-5 h-5" />
                                </button>
                                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Kategori Filter */}
            <div className="bg-white shadow-sm mb-6 sticky top-0 z-30">
                <div className="container mx-auto px-4">
                    <div className="flex items-center overflow-x-auto py-3 scrollbar-hide">
                        {categories.map((category) => (
                            <button
                                key={category.name}
                                className={`flex items-center px-4 py-2 rounded-full transition-colors mr-3 whitespace-nowrap
                                    ${selectedCategory === category.name
                                        ? 'bg-blue-700 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                onClick={() => setSelectedCategory(category.name)}
                            >
                                <span className="mr-2">{category.icon}</span>
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pb-12">
                {/* Sort Bar */}
                <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-500 text-sm">
                        {loading ? 'Memuat produk...' : `Showing ${products.length} products`}
                    </p>

                    <div className="flex items-center">
                        <label className="mr-2 text-gray-600 text-sm">Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-700 py-1 px-3 rounded-md text-sm focus:outline-none"
                        >
                            <option value="recommended">Recommended</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
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
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Products Grid */}
                {!loading && products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map((product) => (
                            <div key={product._id} className="bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow">
                                <div className="relative">
                                    <img
                                        src={getImageUrl(product)}
                                        alt={product.name}
                                        className="w-full aspect-square object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                                        }}
                                    />

                                    <button className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-gray-400 hover:text-gray-700 transition-colors">
                                        <HiOutlineHeart className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-4">
                                    <p className="text-xs text-gray-500 mb-1 capitalize">{product.category}</p>
                                    <h3 className="font-medium text-gray-800 mb-2 truncate">{product.name}</h3>

                                    <div className="mb-3">
                                        <div className="text-gray-800 font-semibold">
                                            {formatPrice(product.price)}
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
    <Link
        to={`/products/${product._id}`}
        className="flex-1 bg-blue-700 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors text-sm flex items-center justify-center"
    >
        <HiOutlineShoppingCart className="mr-1 w-4 h-4" />
        Beli
    </Link>
    <Link
        to={`/products/${product._id}`}
        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
        <HiOutlineEye className="w-4 h-4" />
    </Link>
</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !loading && (
                    <div className="text-center py-12">
                        <div className="inline-flex justify-center items-center w-24 h-24 bg-blue-100 rounded-full mb-4">
                            <HiSearch className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Found</h3>
                        <p className="text-gray-500 mb-6">Try a different search term or category</p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('All');
                                handleSearch();
                            }}
                            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCatalog;