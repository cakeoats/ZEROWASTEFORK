// frontend/src/pages/MyProductsPage.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavbarComponent from '../components/NavbarComponent';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslate } from '../utils/languageUtils';
import { HiTrash, HiPencil, HiEye, HiOutlinePlusCircle, HiChevronLeft } from 'react-icons/hi';
import Footer from '../components/Footer';
import { getApiUrl, getImageUrl, getAuthHeaders } from '../config/api';

function MyProductsPage() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const translate = useTranslate(language);

    // States
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState('');
    const [deleteError, setDeleteError] = useState('');

    // FIXED: Enhanced fetch user's products with better error handling
    useEffect(() => {
        const fetchUserProducts = async () => {
            setLoading(true);
            setError(null);

            try {
                // FIXED: Check authentication first
                const token = localStorage.getItem('token');
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

                console.log('🔍 MyProducts: Authentication check:', {
                    hasToken: !!token,
                    hasUserInfo: !!userInfo.user,
                    userId: userInfo.user?.id || userInfo.user?._id,
                    username: userInfo.user?.username
                });

                if (!token) {
                    console.log('❌ No token found, redirecting to login');
                    navigate('/login', { state: { from: '/my-products' } });
                    return;
                }

                // FIXED: Enhanced API call with better headers and error handling
                const headers = getAuthHeaders();
                console.log('🔑 Request headers:', headers);

                const response = await axios({
                    method: 'GET',
                    url: getApiUrl('api/users/products'),
                    headers: headers,
                    timeout: 15000, // 15 second timeout
                    validateStatus: function (status) {
                        return status < 500; // Resolve only if status is less than 500
                    }
                });

                console.log('📦 MyProducts API Response:', {
                    status: response.status,
                    dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
                    data: response.data
                });

                // FIXED: Handle different response statuses
                if (response.status === 401) {
                    console.log('❌ Unauthorized, redirecting to login');
                    localStorage.removeItem('token');
                    localStorage.removeItem('userInfo');
                    navigate('/login', { state: { from: '/my-products' } });
                    return;
                }

                if (response.status === 404) {
                    console.log('❌ Endpoint not found');
                    setError('API endpoint not found. Please check server configuration.');
                    setLoading(false);
                    return;
                }

                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}: ${response.data?.message || 'Request failed'}`);
                }

                // FIXED: Validate response data
                if (!Array.isArray(response.data)) {
                    console.log('⚠️ Response data is not an array:', response.data);
                    throw new Error('Invalid response format from server');
                }

                console.log(`✅ Successfully fetched ${response.data.length} products`);

                // FIXED: Process products to ensure proper image URLs
                const processedProducts = response.data.map(product => {
                    // Ensure product has proper image URLs
                    if (product.images && product.images.length > 0) {
                        product.imageUrls = product.images;
                        product.imageUrl = product.images[0];
                    }
                    return product;
                });

                setProducts(processedProducts);
                setLoading(false);

            } catch (err) {
                console.error('❌ Error fetching user products:', err);
                console.error('Error details:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status,
                    config: err.config
                });

                // FIXED: Enhanced error handling
                let errorMessage = 'Failed to load your products. Please try again.';

                if (err.code === 'ECONNABORTED') {
                    errorMessage = language === 'id' ?
                        'Koneksi timeout. Periksa koneksi internet Anda.' :
                        'Connection timeout. Check your internet connection.';
                } else if (err.code === 'ERR_NETWORK') {
                    errorMessage = language === 'id' ?
                        'Tidak dapat terhubung ke server. Periksa koneksi internet.' :
                        'Cannot connect to server. Check your internet connection.';
                } else if (err.response?.status === 401) {
                    errorMessage = language === 'id' ?
                        'Sesi Anda telah berakhir. Silakan login kembali.' :
                        'Your session has expired. Please login again.';

                    // Clear auth data and redirect
                    localStorage.removeItem('token');
                    localStorage.removeItem('userInfo');
                    setTimeout(() => navigate('/login', { state: { from: '/my-products' } }), 2000);
                } else if (err.response?.status === 403) {
                    errorMessage = language === 'id' ?
                        'Akses ditolak. Anda tidak memiliki izin untuk melihat halaman ini.' :
                        'Access denied. You do not have permission to view this page.';
                } else if (err.response?.status === 404) {
                    errorMessage = language === 'id' ?
                        'Endpoint API tidak ditemukan. Silakan hubungi administrator.' :
                        'API endpoint not found. Please contact administrator.';
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.message) {
                    errorMessage = err.message;
                }

                setError(errorMessage);
                setLoading(false);
            }
        };

        fetchUserProducts();
    }, [navigate, language]);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get product image URL - FIXED
    const getProductImageUrl = (product) => {
        // Try different image sources
        if (product.imageUrl) {
            return product.imageUrl;
        }

        if (product.images && product.images.length > 0) {
            // If it's a full URL, use it directly
            const firstImage = product.images[0];
            if (firstImage.startsWith('http')) {
                return firstImage;
            }
            // Otherwise, construct the URL
            return getImageUrl(firstImage);
        }

        // Fallback to placeholder
        return 'https://via.placeholder.com/300?text=No+Image';
    };

    // Format price
    const formatPrice = (price) => {
        return `Rp ${price.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}`;
    };

    // Handle delete product
    const handleDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            await axios.delete(getApiUrl(`api/products/${productToDelete._id}`), {
                headers: getAuthHeaders()
            });

            // Update local state
            setProducts(products.filter(product => product._id !== productToDelete._id));
            setDeleteSuccess(language === 'id' ?
                `Produk "${productToDelete.name}" berhasil dihapus` :
                `Product "${productToDelete.name}" successfully deleted`);
            setShowDeleteModal(false);
            setProductToDelete(null);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setDeleteSuccess('');
            }, 3000);
        } catch (err) {
            console.error('Error deleting product:', err);
            setDeleteError(err.response?.data?.message || 'Failed to delete product');

            // Clear error message after 3 seconds
            setTimeout(() => {
                setDeleteError('');
            }, 3000);
        }
    };

    // Get status badge color
    const getStatusColor = (condition, tipe) => {
        if (tipe === 'Donation') return 'bg-purple-100 text-purple-800';
        if (tipe === 'Swap') return 'bg-amber-100 text-amber-800';
        return condition === 'new' ?
            'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800';
    };

    // Get translated product type
    const getProductType = (tipe) => {
        switch (tipe) {
            case 'Sell': return language === 'id' ? 'Jual' : 'Sell';
            case 'Donation': return language === 'id' ? 'Donasi' : 'Donation';
            case 'Swap': return language === 'id' ? 'Tukar' : 'Swap';
            default: return tipe;
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
                    <Link to="/profile" className="hover:text-gray-700">{translate('common.profile')}</Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-700">
                        {language === 'id' ? 'Produk Saya' : 'My Products'}
                    </span>
                </div>
            </div>

            {/* Main content */}
            <div className="container mx-auto px-4 pb-12">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div>
                            <Link
                                to="/profile"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2 sm:mb-0"
                            >
                                <HiChevronLeft className="mr-1 h-5 w-5" />
                                <span>{language === 'id' ? 'Kembali ke Profil' : 'Back to Profile'}</span>
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {language === 'id' ? 'Produk Saya' : 'My Products'}
                            </h1>
                        </div>
                        <Link
                            to="/upload-product"
                            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                        >
                            <HiOutlinePlusCircle className="mr-2 h-5 w-5" />
                            <span>{language === 'id' ? 'Jual Produk' : 'Sell Product'}</span>
                        </Link>
                    </div>
                    <p className="text-gray-600">
                        {language === 'id'
                            ? 'Kelola produk yang telah Anda upload di sini.'
                            : 'Manage products you have uploaded here.'}
                    </p>
                </div>

                {/* Success/Error messages */}
                {deleteSuccess && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">{deleteSuccess}</p>
                            </div>
                        </div>
                    </div>
                )}

                {deleteError && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{deleteError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* FIXED: Enhanced loading state with debug info */}
                {loading ? (
                    <div className="flex justify-center items-center py-12 bg-white rounded-lg shadow-sm">
                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="ml-3">
                            <p className="text-gray-600">
                                {language === 'id' ? 'Memuat produk...' : 'Loading products...'}
                            </p>
                            {process.env.NODE_ENV === 'development' && (
                                <p className="text-xs text-gray-400 mt-1">
                                    API: {getApiUrl('api/users/products')}
                                </p>
                            )}
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-medium text-gray-900 mb-2">
                            {language === 'id' ? 'Terjadi Kesalahan' : 'An Error Occurred'}
                        </h2>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <div className="space-x-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors inline-block"
                            >
                                {language === 'id' ? 'Muat Ulang' : 'Reload'}
                            </button>
                            <Link
                                to="/profile"
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors inline-block"
                            >
                                {language === 'id' ? 'Kembali ke Profil' : 'Back to Profile'}
                            </Link>
                        </div>

                        {/* Debug info for development */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
                                <h3 className="font-bold text-sm mb-2">Debug Information:</h3>
                                <p className="text-xs text-gray-600 mb-1">API URL: {getApiUrl('api/users/products')}</p>
                                <p className="text-xs text-gray-600 mb-1">Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
                                <p className="text-xs text-gray-600">User Info: {localStorage.getItem('userInfo') ? 'Present' : 'Missing'}</p>
                            </div>
                        )}
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="inline-flex justify-center items-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-medium text-gray-900 mb-2">
                            {language === 'id' ? 'Belum Ada Produk' : 'No Products Yet'}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {language === 'id'
                                ? 'Anda belum mengunggah produk apapun. Mulai unggah produk Anda sekarang!'
                                : 'You haven\'t uploaded any products yet. Start uploading your products now!'}
                        </p>
                        <Link
                            to="/upload-product"
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors inline-block"
                        >
                            {language === 'id' ? 'Unggah Produk' : 'Upload Product'}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(product => (
                            <div key={product._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="relative">
                                    <Link to={`/products/${product._id}`}>
                                        <img
                                            src={getProductImageUrl(product)}
                                            alt={product.name}
                                            className="w-full h-48 object-cover"
                                            onError={(e) => {
                                                console.log('❌ Image load error for product:', product.name);
                                                e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                                            }}
                                        />
                                    </Link>

                                    {/* Status badge */}
                                    <div className="absolute top-2 left-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.condition, product.tipe)}`}>
                                            {getProductType(product.tipe)} • {product.condition === 'new'
                                                ? (language === 'id' ? 'Baru' : 'New')
                                                : (language === 'id' ? 'Bekas' : 'Used')}
                                        </span>
                                    </div>

                                    {/* Product status (active/sold/inactive) */}
                                    {product.status && product.status !== 'active' && (
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'sold' ? 'bg-red-100 text-red-800' :
                                                    product.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {product.status === 'sold' ? (language === 'id' ? 'Terjual' : 'Sold') :
                                                    product.status === 'inactive' ? (language === 'id' ? 'Tidak Aktif' : 'Inactive') :
                                                        product.status}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <Link to={`/products/${product._id}`}>
                                        <h3 className="font-medium text-gray-800 mb-1 truncate">{product.name}</h3>
                                    </Link>
                                    <p className="text-sm text-gray-500 mb-2 capitalize">{product.category}</p>

                                    <div className="flex items-center justify-between mb-3">
                                        <div className="font-semibold text-gray-800">
                                            {product.tipe === 'Donation' ? (
                                                <span className="text-purple-600">Free</span>
                                            ) : product.tipe === 'Swap' ? (
                                                <span className="text-blue-600">Swap</span>
                                            ) : (
                                                formatPrice(product.price)
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                        <span>{formatDate(product.createdAt)}</span>
                                        <span className="flex items-center">
                                            <svg className="h-4 w-4 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                            {product.viewCount || 0} {language === 'id' ? 'dilihat' : 'views'}
                                        </span>
                                    </div>

                                    <div className="flex space-x-2">
                                        <Link
                                            to={`/products/${product._id}`}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg transition-colors text-sm flex items-center justify-center"
                                        >
                                            <HiEye className="mr-1 w-4 h-4" />
                                            {language === 'id' ? 'Lihat' : 'View'}
                                        </Link>
                                        <Link
                                            to={`/edit-product/${product._id}`}
                                            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 rounded-lg transition-colors text-sm flex items-center justify-center"
                                        >
                                            <HiPencil className="mr-1 w-4 h-4" />
                                            {language === 'id' ? 'Edit' : 'Edit'}
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setProductToDelete(product);
                                                setShowDeleteModal(true);
                                            }}
                                            className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 py-2 rounded-lg transition-colors text-sm flex items-center justify-center"
                                        >
                                            <HiTrash className="mr-1 w-4 h-4" />
                                            {language === 'id' ? 'Hapus' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <HiTrash className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {language === 'id' ? 'Hapus Produk' : 'Delete Product'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {language === 'id'
                                    ? `Apakah Anda yakin ingin menghapus produk "${productToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`
                                    : `Are you sure you want to delete the product "${productToDelete?.name}"? This action cannot be undone.`}
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setProductToDelete(null);
                                    }}
                                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    {language === 'id' ? 'Batal' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleDeleteProduct}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    {language === 'id' ? 'Ya, Hapus' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
}

export default MyProductsPage;