import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiSearch, HiOutlineHeart, HiOutlineShoppingCart, HiOutlineEye } from 'react-icons/hi';

const ProductCatalog = () => {
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
            id: 6,
            name: 'Lukisan Kanvas Modern',
            price: 750000,
            category: 'Dekoration',
            image: 'https://images.unsplash.com/photo-1579965342575-16428a7c8881?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 6,
            name: 'Lukisan Kanvas Modern',
            price: 750000,
            category: 'Dekoration',
            image: 'https://images.unsplash.com/photo-1579965342575-16428a7c8881?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
    ];

    // State untuk pencarian
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Format harga
    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    // Filter produk
    const filteredProducts = selectedCategory === 'All'
        ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : products.filter(p =>
            p.category === selectedCategory &&
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-black shadow-sm">
                <div className="container mx-auto px-4 py-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Our Product</h1>
                </div>
            </header>

            {/* Pencarian dan Filter */}
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            className="w-full pl-10 pr-4 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-white border-b border-gray-300 px-3 py-2 focus:outline-none focus:border-gray-900"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categories.map((category) => (
                            <option key={category.name} value={category.name}>
                                {category.name} ({category.count})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Kategori */}
                <div className="mb-12 overflow-x-auto">
                    <div className="flex space-x-4 pb-2">
                        {categories.map((category) => (
                            <button
                                key={category.name}
                                className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors min-w-[80px] ${selectedCategory === category.name ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => setSelectedCategory(category.name)}
                            >
                                <span className="text-xl mb-1">{category.icon}</span>
                                <span className="text-sm whitespace-nowrap">{category.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Produk */}
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="group">
                                <div className="relative overflow-hidden bg-gray-100 aspect-square rounded-lg">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <button className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 transition-colors">
                                        <HiOutlineHeart className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <p className="text-gray-500 text-sm">{product.category}</p>
                                    <h3 className="font-normal text-gray-900 mt-1">{product.name}</h3>
                                    <p className="font-medium text-gray-900 mt-2">{formatPrice(product.price)}</p>
                                    <div className="flex space-x-2 mt-3">
                                        <button className="flex items-center justify-center text-sm text-gray-700 hover:text-gray-900 transition-colors border border-gray-300 rounded px-3 py-1 w-full">
                                            <HiOutlineShoppingCart className="mr-1" />
                                            Beli
                                        </button>
                                        <Link
                                            to={`/products/${product.id}`}
                                            className="flex items-center justify-center text-sm text-gray-700 hover:text-gray-900 transition-colors border border-gray-300 rounded px-3 py-1 w-full"
                                        >
                                            <HiOutlineEye className="mr-1" />
                                            Detail
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Produk tidak ditemukan. Coba kata kunci lain.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCatalog;