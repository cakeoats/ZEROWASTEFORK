// frontend/src/pages/OrderHistoryPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    HiChevronLeft, HiFilter, HiSearch, HiEye, HiX,
    HiShoppingBag, HiClock, HiCheckCircle, HiXCircle,
    HiCalendar, HiCurrencyDollar
} from 'react-icons/hi';
import NavbarComponent from '../components/NavbarComponent';
import ProductImage from '../components/ProductImage';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslate } from '../utils/languageUtils';
import axios from 'axios';
import Footer from '../components/Footer';
import { getApiUrl, getAuthHeaders } from '../config/api';

const OrderHistoryPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { language } = useLanguage();
    const translate = useTranslate(language);

    // States
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        sort: 'newest'
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Redirect if not authenticated
    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: '/order-history' } });
        }
    }, [token, navigate]);

    // Fetch orders and stats
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;

            setLoading(true);
            try {
                // Fetch orders
                const params = new URLSearchParams({
                    status: filters.status,
                    sort: filters.sort,
                    page: pagination.currentPage,
                    limit: 10
                });

                if (filters.search) {
                    params.append('search', filters.search);
                }

                const [ordersResponse, statsResponse] = await Promise.all([
                    axios.get(getApiUrl(`api/orders?${params.toString()}`), {
                        headers: getAuthHeaders()
                    }),
                    axios.get(getApiUrl('api/orders/stats'), {
                        headers: getAuthHeaders()
                    })
                ]);

                setOrders(ordersResponse.data.orders || []);
                setPagination(ordersResponse.data.pagination || {});
                setStats(statsResponse.data.stats || {});

                console.log('✅ Orders and stats loaded:', {
                    orders: ordersResponse.data.orders?.length || 0,
                    stats: statsResponse.data.stats
                });

            } catch (err) {
                console.error('❌ Error fetching order data:', err);
                setError('Failed to load order history. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, filters, pagination.currentPage]);

    // Get order status info
    const getOrderStatusInfo = (status) => {
        const statusMap = {
            pending: {
                label: language === 'id' ? 'Menunggu' : 'Pending',
                color: 'bg-yellow-100 text-yellow-800',
                icon: HiClock
            },
            paid: {
                label: language === 'id' ? 'Dibayar' : 'Paid',
                color: 'bg-blue-100 text-blue-800',
                icon: HiCheckCircle
            },
            completed: {
                label: language === 'id' ? 'Selesai' : 'Completed',
                color: 'bg-green-100 text-green-800',
                icon: HiCheckCircle
            },
            cancelled: {
                label: language === 'id' ? 'Dibatalkan' : 'Cancelled',
                color: 'bg-red-100 text-red-800',
                icon: HiXCircle
            }
        };
        return statusMap[status] || statusMap.pending;
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format price
    const formatPrice = (price) => {
        return `Rp ${price.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}`;
    };

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // View order details
    const viewOrderDetails = async (orderId) => {
        try {
            const response = await axios.get(getApiUrl(`api/orders/${orderId}`), {
                headers: getAuthHeaders()
            });

            setSelectedOrder(response.data.order);
            setShowOrderDetail(true);
        } catch (err) {
            console.error('❌ Error fetching order details:', err);
            setError('Failed to load order details.');
        }
    };

    // Render order item
    const renderOrderItem = (order) => {
        const statusInfo = getOrderStatusInfo(order.status);
        const StatusIcon = statusInfo.icon;

        // Determine product info (single or multiple products)
        const isCartOrder = order.products && order.products.length > 0;
        const productInfo = isCartOrder ? order.products[0] : { product: order.product, quantity: order.quantity };

        return (
            <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-gray-800">
                            {language === 'id' ? 'Pesanan' : 'Order'} #{order.transactionId}
                        </h3>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                    </span>
                </div>

                <div className="flex items-center space-x-4 mb-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {productInfo.product && (
                            <ProductImage
                                product={productInfo.product}
                                className="w-full h-full object-cover"
                                alt={productInfo.product.name}
                                showPlaceholder={true}
                            />
                        )}
                    </div>

                    <div className="flex-grow">
                        <h4 className="font-medium text-gray-800 truncate">
                            {productInfo.product?.name || 'Product'}
                        </h4>
                        <p className="text-sm text-gray-500">
                            {language === 'id' ? 'Kuantitas' : 'Quantity'}: {productInfo.quantity}
                            {isCartOrder && order.products.length > 1 && (
                                <span className="ml-2 text-blue-600">
                                    +{order.products.length - 1} {language === 'id' ? 'item lainnya' : 'other items'}
                                </span>
                            )}
                        </p>
                        {order.seller && (
                            <p className="text-xs text-gray-400">
                                {language === 'id' ? 'Penjual' : 'Seller'}: {order.seller.username || order.seller.full_name}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-amber-600">
                        {formatPrice(order.totalAmount)}
                    </div>
                    <button
                        onClick={() => viewOrderDetails(order._id)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm"
                    >
                        <HiEye className="w-4 h-4 mr-1" />
                        {language === 'id' ? 'Lihat Detail' : 'View Details'}
                    </button>
                </div>
            </div>
        );
    };

    // Render order detail modal
    const renderOrderDetailModal = () => {
        if (!selectedOrder) return null;

        const statusInfo = getOrderStatusInfo(selectedOrder.status);
        const StatusIcon = statusInfo.icon;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {language === 'id' ? 'Detail Pesanan' : 'Order Details'}
                            </h2>
                            <button
                                onClick={() => setShowOrderDetail(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <HiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Order Info */}
                        <div className="mb-6">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        {language === 'id' ? 'ID Pesanan' : 'Order ID'}
                                    </p>
                                    <p className="font-semibold">{selectedOrder.transactionId}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        {language === 'id' ? 'Status' : 'Status'}
                                    </p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {statusInfo.label}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        {language === 'id' ? 'Tanggal Pesanan' : 'Order Date'}
                                    </p>
                                    <p className="text-sm">{formatDate(selectedOrder.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        {language === 'id' ? 'Total Bayar' : 'Total Amount'}
                                    </p>
                                    <p className="text-lg font-semibold text-amber-600">
                                        {formatPrice(selectedOrder.totalAmount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Products */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-800 mb-3">
                                {language === 'id' ? 'Produk' : 'Products'}
                            </h3>

                            {/* Single product */}
                            {selectedOrder.product && (
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-white">
                                        <ProductImage
                                            product={selectedOrder.product}
                                            className="w-full h-full object-cover"
                                            alt={selectedOrder.product.name}
                                            showPlaceholder={true}
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-medium text-gray-800">{selectedOrder.product.name}</h4>
                                        <p className="text-sm text-gray-500 capitalize">{selectedOrder.product.category}</p>
                                        <p className="text-sm text-gray-600">
                                            {formatPrice(selectedOrder.product.price)} × {selectedOrder.quantity}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Multiple products */}
                            {selectedOrder.products && selectedOrder.products.length > 0 && (
                                <div className="space-y-3">
                                    {selectedOrder.products.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white">
                                                <ProductImage
                                                    product={item.product}
                                                    className="w-full h-full object-cover"
                                                    alt={item.product?.name}
                                                    showPlaceholder={true}
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-medium text-gray-800">{item.product?.name}</h4>
                                                <p className="text-sm text-gray-500 capitalize">{item.product?.category}</p>
                                                <p className="text-sm text-gray-600">
                                                    {formatPrice(item.price)} × {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Seller Info */}
                        {selectedOrder.seller && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3">
                                    {language === 'id' ? 'Informasi Penjual' : 'Seller Information'}
                                </h3>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="font-medium">{selectedOrder.seller.full_name || selectedOrder.seller.username}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.seller.email}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavbarComponent />

            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center text-sm text-gray-500">
                    <Link to="/" className="hover:text-gray-700">{translate('footer.home')}</Link>
                    <span className="mx-2">/</span>
                    <Link to="/profile" className="hover:text-gray-700">{translate('common.profile')}</Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-700">
                        {language === 'id' ? 'Riwayat Pesanan' : 'Order History'}
                    </span>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-12">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <Link
                        to="/profile"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
                    >
                        <HiChevronLeft className="mr-1 h-5 w-5" />
                        <span>{language === 'id' ? 'Kembali ke Profil' : 'Back to Profile'}</span>
                    </Link>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                {language === 'id' ? 'Riwayat Pesanan' : 'Order History'}
                            </h1>
                            <p className="text-gray-600">
                                {language === 'id' ? 'Lihat semua pesanan yang pernah Anda buat' : 'View all orders you have made'}
                            </p>
                        </div>

                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid grid-cols-2 gap-4 mt-4 sm:mt-0">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-amber-600">{stats.totalOrders}</div>
                                    <div className="text-xs text-gray-500">
                                        {language === 'id' ? 'Total Pesanan' : 'Total Orders'}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalSpent)}</div>
                                    <div className="text-xs text-gray-500">
                                        {language === 'id' ? 'Total Belanja' : 'Total Spent'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Status Filter */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <HiFilter className="inline w-4 h-4 mr-1" />
                                {language === 'id' ? 'Status' : 'Status'}
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="all">{language === 'id' ? 'Semua Status' : 'All Status'}</option>
                                <option value="pending">{language === 'id' ? 'Menunggu' : 'Pending'}</option>
                                <option value="paid">{language === 'id' ? 'Dibayar' : 'Paid'}</option>
                                <option value="completed">{language === 'id' ? 'Selesai' : 'Completed'}</option>
                                <option value="cancelled">{language === 'id' ? 'Dibatalkan' : 'Cancelled'}</option>
                            </select>
                        </div>

                        {/* Sort Filter */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {language === 'id' ? 'Urutkan' : 'Sort by'}
                            </label>
                            <select
                                value={filters.sort}
                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="newest">{language === 'id' ? 'Terbaru' : 'Newest'}</option>
                                <option value="oldest">{language === 'id' ? 'Terlama' : 'Oldest'}</option>
                                <option value="amount-high">{language === 'id' ? 'Nilai Tertinggi' : 'Highest Amount'}</option>
                                <option value="amount-low">{language === 'id' ? 'Nilai Terendah' : 'Lowest Amount'}</option>
                            </select>
                        </div>

                        {/* Search */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <HiSearch className="inline w-4 h-4 mr-1" />
                                {language === 'id' ? 'Cari' : 'Search'}
                            </label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder={language === 'id' ? 'Cari pesanan...' : 'Search orders...'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        <p>{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-12 bg-white rounded-lg shadow-sm">
                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="ml-3 text-gray-600">
                            {language === 'id' ? 'Memuat riwayat pesanan...' : 'Loading order history...'}
                        </p>
                    </div>
                ) : orders.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="inline-flex justify-center items-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                            <HiShoppingBag className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-medium text-gray-900 mb-2">
                            {language === 'id' ? 'Belum Ada Pesanan' : 'No Orders Yet'}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {language === 'id' ?
                                'Anda belum pernah melakukan pembelian. Mulai berbelanja sekarang!' :
                                'You haven\'t made any purchases yet. Start shopping now!'}
                        </p>
                        <Link
                            to="/product-list"
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors inline-block"
                        >
                            {language === 'id' ? 'Mulai Belanja' : 'Start Shopping'}
                        </Link>
                    </div>
                ) : (
                    /* Orders List */
                    <>
                        <div className="space-y-4">
                            {orders.map(renderOrderItem)}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center space-x-4 mt-8">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                    disabled={!pagination.hasPrevPage}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {language === 'id' ? 'Sebelumnya' : 'Previous'}
                                </button>

                                <span className="text-sm text-gray-600">
                                    {language === 'id' ? 'Halaman' : 'Page'} {pagination.currentPage} {language === 'id' ? 'dari' : 'of'} {pagination.totalPages}
                                </span>

                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                    disabled={!pagination.hasNextPage}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {language === 'id' ? 'Selanjutnya' : 'Next'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Order Detail Modal */}
            {showOrderDetail && renderOrderDetailModal()}

            <Footer />
        </div>
    );
};

export default OrderHistoryPage;