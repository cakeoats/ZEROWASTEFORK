import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiSearch, HiOutlineHeart, HiOutlineShoppingCart, HiOutlineEye } from 'react-icons/hi';
import NavbarComponent from '../../components/NavbarComponent';

const ProductCatalog = () => {
    // Hook to get location (URL info)
    const location = useLocation();

    // Parse URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const categoryFromUrl = queryParams.get('category');

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
        { name: 'Dekoration', icon: '🖼️', count: 42 },
        { name: 'Sport', icon: '⚽', count: 42 },
        { name: 'Health And Beauty', icon: '💄', count: 42 },
        { name: 'Kids', icon: '🪁', count: 42 }
    ];

    // Data produk
    const products = [
        {
            id: 1,
            name: 'Kemeja Pria Slim Fit Premium',
            price: 349000,
            category: 'Men Fashion',
            image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 2,
            name: 'Dress Wanita Modern',
            price: 425000,
            category: 'Women Fashion',
            image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680e956?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 3,
            name: 'Smartphone Flagship 2023',
            price: 12999000,
            category: 'Gadget',
            image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 4,
            name: 'Set Skincare Lengkap',
            price: 899000,
            category: 'Health And Beauty',
            image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 5,
            name: 'Sepatu Running Premium',
            price: 1250000,
            category: 'Sport',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 6,
            name: 'Lukisan Kanvas Modern',
            price: 750000,
            category: 'Dekoration',
            image: 'https://images.unsplash.com/photo-1579965342575-16428a7c8881?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 7,
            name: 'Mainan Edukatif Anak',
            price: 350000,
            category: 'Kids',
            image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 8,
            name: 'Aksesoris Mobil Premium',
            price: 980000,
            category: 'Automotive',
            image: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
    ];

    // Effect to update selected category when URL changes
    useEffect(() => {
        if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
        }
    }, [categoryFromUrl]);

    // Format harga
    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    // Filter and sort produk
    const getFilteredProducts = () => {
        let filtered = selectedCategory === 'All'
            ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : products.filter(p =>
                p.category === selectedCategory &&
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

        // Apply sorting
        if (sortBy === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        }

        return filtered;
    };

    const filteredProducts = getFilteredProducts();

    return (
        <div className="min-h-screen bg-gray-50">
            <NavbarComponent />

            {/* Floating Upload Button for Mobile */}
            <Link
                to="/upload-product"
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
                            <Link to="/upload-product" className="hidden md:flex items-center bg-white text-blue-700 px-4 py-2 rounded-l-lg font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Upload
                            </Link>
                            <div className="relative flex-1 md:w-64">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full py-2 pl-10 pr-4 bg-white rounded-lg md:rounded-l-none md:rounded-r-lg border-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
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
                        Showing {filteredProducts.length} products
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

                {/* Products Grid */}
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow">
                                <div className="relative">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full aspect-square object-cover"
                                    />

                                    <button className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-gray-400 hover:text-gray-700 transition-colors">
                                        <HiOutlineHeart className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-4">
                                    <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                                    <h3 className="font-medium text-gray-800 mb-2 truncate">{product.name}</h3>

                                    <div className="mb-3">
                                        <div className="text-gray-800 font-semibold">
                                            {formatPrice(product.price)}
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        <button className="flex-1 bg-blue-700 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors text-sm flex items-center justify-center">
                                            <HiOutlineShoppingCart className="mr-1 w-4 h-4" />
                                            Buy
                                        </button>
                                        <Link
                                            to={`/products/${product.id}`}
                                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <HiOutlineEye className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
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