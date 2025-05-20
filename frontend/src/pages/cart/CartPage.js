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
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const CartPage = () => {
    const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
    const { token } = useAuth();
    const { language } = useLanguage();
    const translate = useTranslate(language);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
            // Format data untuk API request
            const requestData = {
                items: cartItems.map(item => ({
                    productId: item._id,
                    quantity: item.quantity
                })),
                totalAmount: cartTotal
            };

            console.log('Sending to server:', requestData);

            // Create order with all cart items
            const response = await axios.post(
                `${API_URL}/api/payment/create-cart-transaction`,
                requestData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log('Server response:', response.data);

            const { token: snapToken } = response.data;

            if (!snapToken) {
                throw new Error('Payment token not received from server');
            }

            // Process with Midtrans payment
            if (window.snap && typeof window.snap.pay === 'function') {
                window.snap.pay(snapToken, {
                    onSuccess: function (result) {
                        console.log('Payment success:', result);
                        clearCart(); // Clear cart after successful payment
                        navigate('/payment/success?order_id=' + result.order_id + '&transaction_status=' + result.transaction_status);
                    },
                    onPending: function (result) {
                        console.log('Payment pending:', result);
                        navigate('/payment/pending?order_id=' + result.order_id + '&payment_type=' + result.payment_type);
                    },
                    onError: function (result) {
                        console.error('Payment error:', result);
                        setError('Payment failed: ' + (result.status_message || 'Please try again.'));
                        setLoading(false);
                    },
                    onClose: function () {
                        console.log('Payment window closed');
                        setError('Payment canceled. Please try again to complete your purchase.');
                        setLoading(false);
                    }
                });
            } else {
                setError('Payment gateway not loaded. Please refresh the page and try again.');
                setLoading(false);
            }
        } catch (err) {
            console.error('Checkout error:', err);
            console.error('Error response:', err.response?.data);

            setError(
                err.response?.data?.message ||
                err.message ||
                'Failed to process checkout. Please try again.'
            );
            setLoading(false);
        }
    };

    // Get product image URL
    const getImageUrl = (product) => {
        if (!product) return 'https://via.placeholder.com/100';

        if (product.imageUrl) {
            return product.imageUrl;
        }

        if (product.images && product.images.length > 0) {
            if (product.images[0].startsWith('http')) {
                return product.images[0];
            }
            return `${API_URL}/${product.images[0]}`;
        }

        return 'https://via.placeholder.com/100';
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
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', 'SB-Mid-client-D5UY5aGYO_BSvIUk'); // Replace with your actual client key if needed

        document.body.appendChild(script);
    };

    // Load Midtrans script on component mount
    React.useEffect(() => {
        if (cartItems.length > 0) {
            loadMidtransScript();
        }
    }, [cartItems]);

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
                                            <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                                <img
                                                    src={getImageUrl(item)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/100';
                                                    }}
                                                />
                                            </div>

                                            <div className="ml-4 flex-grow">
                                                <h3 className="font-medium text-gray-800">{item.name}</h3>
                                                <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                                                <div className="mt-1 flex items-center justify-between">
                                                    <div className="text-amber-600 font-semibold">
                                                        {formatPrice(item.price)}
                                                    </div>

                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                                                            className="p-1 rounded-md hover:bg-gray-100"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <span className="w-8 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                            className="p-1 rounded-md hover:bg-gray-100"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
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
                                            {language === 'id' ? 'Subtotal' : 'Subtotal'}
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