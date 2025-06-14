import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Alert } from 'flowbite-react';
import { HiOutlineShoppingCart, HiOutlineTrash, HiArrowLeft, HiCreditCard } from 'react-icons/hi';
import NavbarComponent from '../../components/NavbarComponent';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import Footer from '../../components/Footer';
import { getApiUrl, getImageUrl, getAuthHeaders, getMidtransConfig } from '../../config/api';
import axios from 'axios';

const CartPage = () => {
    const { cartItems, removeFromCart, clearCart } = useCart();
    const { token } = useAuth();
    const { language } = useLanguage();
    const translate = useTranslate(language);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get Midtrans configuration
    const midtransConfig = getMidtransConfig();

    // Calculate total (simplified since each item has quantity of 1)
    const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);

    // Handle checkout process
    const handleCheckout = async () => {
        if (!token) {
            navigate('/login', { state: { from: '/cart' } });
            return;
        }

        if (cartItems.length === 0) {
            setError('Your cart is empty. Please add items before checkout.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Validate cart items before sending
            const validItems = cartItems.filter(item =>
                item._id &&
                item.price &&
                item.price > 0 &&
                item.name
            );

            if (validItems.length !== cartItems.length) {
                throw new Error('Some cart items are invalid. Please refresh and try again.');
            }

            // Format data untuk API request dengan validation
            const requestData = {
                items: validItems.map(item => ({
                    productId: item._id,
                    quantity: 1 // Fixed quantity of 1 for each item
                })),
                totalAmount: cartTotal
            };

            // Validate total amount
            const calculatedTotal = validItems.reduce((total, item) => total + item.price, 0);
            if (Math.abs(calculatedTotal - cartTotal) > 1) {
                throw new Error('Cart total mismatch. Please refresh and try again.');
            }

            console.log('🛒 Sending cart checkout request:', {
                itemCount: requestData.items.length,
                totalAmount: requestData.totalAmount,
                calculatedTotal
            });

            // Create order with all cart items
            const response = await axios.post(
                getApiUrl('api/payment/create-cart-transaction'),
                requestData,
                {
                    headers: getAuthHeaders(),
                    timeout: 30000 // 30 second timeout
                }
            );

            console.log('✅ Server response:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Transaction creation failed');
            }

            const { token: snapToken, summary } = response.data;

            if (!snapToken) {
                throw new Error('Payment token not received from server');
            }

            // Log transaction summary
            if (summary) {
                console.log('📋 Transaction Summary:', summary);
            }

            // Check if Midtrans script is loaded
            if (!window.snap || typeof window.snap.pay !== 'function') {
                throw new Error('Payment gateway not loaded. Please refresh the page and try again.');
            }

            console.log('💳 Opening Midtrans payment popup...');

            // Process with Midtrans payment
            window.snap.pay(snapToken, {
                onSuccess: function (result) {
                    console.log('✅ Payment success:', result);
                    clearCart(); // Clear cart after successful payment

                    // Navigate with transaction details
                    const successUrl = `/payment/success?order_id=${result.order_id}&transaction_status=${result.transaction_status}`;
                    navigate(successUrl);
                },
                onPending: function (result) {
                    console.log('⏳ Payment pending:', result);

                    // Navigate with pending details
                    const pendingUrl = `/payment/pending?order_id=${result.order_id}&payment_type=${result.payment_type}`;
                    navigate(pendingUrl);
                },
                onError: function (result) {
                    console.error('❌ Payment error:', result);

                    let errorMessage = 'Payment failed. Please try again.';
                    if (result.status_message) {
                        errorMessage = `Payment failed: ${result.status_message}`;
                    }

                    setError(errorMessage);
                    setLoading(false);
                },
                onClose: function () {
                    console.log('🚫 Payment window closed by user');
                    setError('Payment cancelled. Please complete your purchase to continue.');
                    setLoading(false);
                }
            });

        } catch (err) {
            console.error('💥 Checkout error:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                code: err.code
            });

            let errorMessage = 'Failed to process checkout. Please try again.';

            // Handle specific error types
            if (err.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please check your connection and try again.';
            } else if (err.code === 'ERR_NETWORK') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (err.response) {
                const status = err.response.status;
                const serverMessage = err.response.data?.message;

                switch (status) {
                    case 400:
                        errorMessage = serverMessage || 'Invalid cart data. Please refresh and try again.';
                        break;
                    case 401:
                        errorMessage = 'Session expired. Please login again.';
                        // Redirect to login after delay
                        setTimeout(() => {
                            navigate('/login', { state: { from: '/cart' } });
                        }, 2000);
                        break;
                    case 404:
                        errorMessage = 'Some products in your cart are no longer available.';
                        break;
                    case 500:
                        errorMessage = 'Server error. Please try again later or contact support.';
                        break;
                    default:
                        errorMessage = serverMessage || `Server error (${status}). Please try again.`;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setLoading(false);

            // Auto-clear error after 10 seconds
            setTimeout(() => {
                setError(null);
            }, 10000);
        }
    };

    // Get product image URL
    const getProductImageUrl = (product) => {
        if (product.imageUrl) {
            return product.imageUrl;
        }

        if (product.images && product.images.length > 0) {
            return getImageUrl(product.images[0]);
        }

        return 'https://via.placeholder.com/300?text=No+Image';
    };

    // Format price
    const formatPrice = (price) => {
        return `Rp ${price.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}`;
    };

    // Load Midtrans script if it hasn't been loaded yet
    const loadMidtransScript = () => {
        // Check if script is already loaded
        if (document.getElementById('midtrans-snap')) {
            return;
        }

        const script = document.createElement('script');
        script.id = 'midtrans-snap';
        script.src = midtransConfig.scriptUrl;
        script.setAttribute('data-client-key', midtransConfig.clientKey);

        document.body.appendChild(script);
    };

    // Load Midtrans script on component mount
    React.useEffect(() => {
        if (cartItems.length > 0) {
            loadMidtransScript();
        }
    }, [cartItems, midtransConfig]);

    return (
        <div className="min-h-screen bg-gray-50">
            <NavbarComponent />

            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center text-sm text-gray-500">
                    <Link to="/" className="hover:text-gray-700">{translate('footer.home')}</Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-700">{language === 'id' ? 'Keranjang' : 'Cart'}</span>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-12">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                        <HiOutlineShoppingCart className="mr-2 h-6 w-6" />
                        {language === 'id' ? 'Keranjang Belanja' : 'Shopping Cart'}
                    </h1>
                    <p className="text-gray-600">
                        {language === 'id'
                            ? `${cartItems.length} item dalam keranjang Anda.`
                            : `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your cart.`}
                    </p>
                </div>

                {error && (
                    <Alert color="failure" className="mb-6">
                        {error}
                    </Alert>
                )}

                {cartItems.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="inline-flex justify-center items-center w-24 h-24 bg-gray-100 rounded-full mb-4">
                            <HiOutlineShoppingCart className="h-12 w-12 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-medium text-gray-900 mb-2">
                            {language === 'id' ? 'Keranjang Anda kosong' : 'Your cart is empty'}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {language === 'id'
                                ? 'Mulai belanja untuk menambahkan produk ke keranjang.'
                                : 'Start shopping to add products to your cart.'}
                        </p>
                        <Link to="/product-list">
                            <Button color="warning" className="px-6">
                                {language === 'id' ? 'Jelajahi Produk' : 'Browse Products'}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cart Items (Left Side) */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h2 className="font-medium text-gray-800">
                                        {language === 'id' ? 'Item Keranjang' : 'Cart Items'}
                                    </h2>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {cartItems.map((item) => (
                                        <div key={item._id} className="p-4 flex items-center">
                                            <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 mr-4">
                                                <img
                                                    src={getProductImageUrl(item)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/100';
                                                    }}
                                                />
                                            </div>

                                            <div className="flex-grow">
                                                <h3 className="font-medium text-gray-800">{item.name}</h3>
                                                <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                                                <div className="mt-1 flex items-center justify-between">
                                                    <div className="text-amber-600 font-semibold">
                                                        {formatPrice(item.price)}
                                                    </div>
                                                    {/* Removed quantity controls - now showing fixed "1 unit" */}
                                                    <div className="text-sm text-gray-600">
                                                        {language === 'id' ? '1 unit' : '1 unit'}
                                                    </div>
                                                </div>

                                                {/* Product condition and type info */}
                                                <div className="mt-1 flex items-center space-x-2">
                                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                        {item.condition === 'new' ? (language === 'id' ? 'Baru' : 'New') : (language === 'id' ? 'Bekas' : 'Used')}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded ${item.tipe === 'Sell' ? 'bg-green-100 text-green-600' :
                                                        item.tipe === 'Donation' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        {item.tipe === 'Sell' ? (language === 'id' ? 'Jual' : 'Sell') :
                                                            item.tipe === 'Donation' ? (language === 'id' ? 'Donasi' : 'Donation') :
                                                                item.tipe === 'Swap' ? (language === 'id' ? 'Tukar' : 'Swap') : item.tipe}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="ml-4">
                                                <button
                                                    onClick={() => removeFromCart(item._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    aria-label="Remove item"
                                                >
                                                    <HiOutlineTrash className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 border-t border-gray-100 flex justify-between">
                                    <Link to="/product-list" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                                        <HiArrowLeft className="mr-1 h-5 w-5" />
                                        <span>{language === 'id' ? 'Lanjutkan Belanja' : 'Continue Shopping'}</span>
                                    </Link>

                                    <button
                                        onClick={() => clearCart()}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        {language === 'id' ? 'Kosongkan Keranjang' : 'Clear Cart'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary (Right Side) */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                                <h2 className="font-medium text-gray-800 mb-4">
                                    {language === 'id' ? 'Ringkasan Pesanan' : 'Order Summary'}
                                </h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            {language === 'id' ? 'Subtotal' : 'Subtotal'} ({cartItems.length} {language === 'id' ? 'item' : 'items'})
                                        </span>
                                        <span className="font-medium">{formatPrice(cartTotal)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            {language === 'id' ? 'Biaya Pengiriman' : 'Shipping Fee'}
                                        </span>
                                        <span className="text-green-600">
                                            {language === 'id' ? 'Gratis' : 'Free'}
                                        </span>
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 flex justify-between font-medium">
                                        <span className="text-gray-800">
                                            {language === 'id' ? 'Total' : 'Total'}
                                        </span>
                                        <span className="text-amber-600 text-lg">{formatPrice(cartTotal)}</span>
                                    </div>
                                </div>

                                {/* Enhanced Notice about One Item Per Product */}
                                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-blue-700">
                                                {language === 'id'
                                                    ? 'Setiap produk dijual dalam jumlah 1 unit. Produk akan dihapus dari sistem setelah terjual.'
                                                    : 'Each product is sold in quantity of 1 unit. Product will be removed from system after sold.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    color="warning"
                                    className="w-full"
                                    onClick={handleCheckout}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {language === 'id' ? 'Memproses...' : 'Processing...'}
                                        </>
                                    ) : (
                                        <>
                                            <HiCreditCard className="mr-2 h-5 w-5" />
                                            {language === 'id' ? 'Bayar Sekarang' : 'Checkout Now'}
                                        </>
                                    )}
                                </Button>

                                <div className="mt-4 text-xs text-gray-500 text-center">
                                    <p>
                                        {language === 'id'
                                            ? 'Dengan melakukan checkout, Anda menyetujui syarat dan ketentuan kami.'
                                            : 'By checking out, you agree to our terms and conditions.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default CartPage;