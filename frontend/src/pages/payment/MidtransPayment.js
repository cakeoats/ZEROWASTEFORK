import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Alert } from 'flowbite-react';
import axios from 'axios';
import NavbarComponent from '../../components/NavbarComponent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';
import { API_BASE_URL, getApiUrl, getImageUrl, getAuthHeaders, getMidtransConfig } from '../../config/api';

const MidtransPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const translate = useTranslate(language);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [snapScriptLoaded, setSnapScriptLoaded] = useState(false);
  const [midtransConfig, setMidtransConfig] = useState(null);

  // Fetch Midtrans configuration from backend
  useEffect(() => {
    const fetchMidtransConfig = async () => {
      try {
        console.log('🔧 Fetching Midtrans configuration...');
        const config = await getMidtransConfig();
        setMidtransConfig(config);
        console.log('✅ Midtrans config loaded:', {
          environment: config.environment,
          scriptUrl: config.scriptUrl,
          hasClientKey: !!config.clientKey
        });
      } catch (error) {
        console.error('❌ Failed to load Midtrans config:', error);
        setError('Failed to load payment configuration. Please refresh and try again.');
      }
    };

    fetchMidtransConfig();
  }, []);

  // Get product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        console.log('🔍 Fetching product from:', getApiUrl(`api/products/${id}`));
        setLoading(true);

        const response = await axios.get(getApiUrl(`api/products/${id}`), {
          headers: getAuthHeaders()
        });

        console.log('✅ Product fetched successfully:', response.data);
        setProduct(response.data);
      } catch (err) {
        console.error('❌ Error fetching product:', err);
        console.error('Response:', err.response?.data);
        setError(`Failed to load product details: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, token]);

  // Load Midtrans script
  useEffect(() => {
    if (!midtransConfig) {
      console.log('⏳ Waiting for Midtrans config...');
      return;
    }

    // Check if script is already loaded
    if (document.getElementById('midtrans-snap')) {
      console.log('✅ Midtrans script already loaded');
      setSnapScriptLoaded(true);
      return;
    }

    console.log('🔧 Loading Midtrans Snap script...');
    console.log('🔧 Midtrans Config:', {
      environment: midtransConfig.environment,
      scriptUrl: midtransConfig.scriptUrl,
      clientKeyPrefix: midtransConfig.clientKey ? midtransConfig.clientKey.substring(0, 15) + '...' : 'NOT_SET'
    });

    // Load Midtrans Snap JS when component mounts
    const script = document.createElement('script');
    script.id = 'midtrans-snap';
    script.src = midtransConfig.scriptUrl;
    script.setAttribute('data-client-key', midtransConfig.clientKey);

    script.onload = () => {
      console.log('✅ Midtrans Snap script loaded successfully');
      console.log('🌍 Environment:', midtransConfig.environment);
      setSnapScriptLoaded(true);
    };

    script.onerror = () => {
      console.error('❌ Failed to load Midtrans Snap script');
      console.error('Script URL:', midtransConfig.scriptUrl);
      setError(`Failed to load payment gateway (${midtransConfig.environment}). Please refresh and try again.`);
    };

    document.body.appendChild(script);

    return () => {
      // Clean up on unmount
      const existingScript = document.getElementById('midtrans-snap');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [midtransConfig]);

  // Calculate total price
  const totalPrice = product ? product.price * quantity : 0;

  // Handle payment process
  const handlePayment = async () => {
    console.log('🚀 Starting payment process...');

    if (!token) {
      console.log('❌ No token, redirecting to login');
      navigate('/login', { state: { from: `/payment/${id}` } });
      return;
    }

    if (!product) {
      console.log('❌ No product data');
      setError('Product information not available');
      return;
    }

    if (!snapScriptLoaded || !window.snap) {
      console.log('❌ Snap script not loaded');
      setError('Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }

    if (!midtransConfig) {
      console.log('❌ Midtrans config not loaded');
      setError('Payment configuration not loaded. Please refresh and try again.');
      return;
    }

    setPaymentLoading(true);
    setError(null);

    try {
      console.log('📦 Creating transaction with data:', {
        productId: product._id,
        quantity: quantity,
        totalAmount: totalPrice,
        environment: midtransConfig.environment,
        API_BASE_URL
      });

      // Create transaction on backend
      const response = await axios.post(
        getApiUrl('api/payment/create-transaction'),
        {
          productId: product._id,
          quantity: quantity,
          totalAmount: totalPrice,
        },
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('✅ Transaction created:', response.data);

      // Get the snap token from response
      const { token: snapToken, success, message, environment } = response.data;

      if (!success) {
        throw new Error(message || 'Transaction creation failed');
      }

      if (!snapToken) {
        throw new Error('Payment token not received from server');
      }

      console.log('🎫 Snap token received, opening payment popup...');
      console.log('🌍 Backend environment:', environment);
      console.log('🔧 Frontend config environment:', midtransConfig.environment);

      // Reset loading state before opening snap
      setPaymentLoading(false);

      // Open Midtrans Snap payment page
      window.snap.pay(snapToken, {
        onSuccess: function (result) {
          console.log('✅ Payment success:', result);
          console.log('🌍 Payment completed in:', midtransConfig.environment, 'mode');
          navigate('/payment/success?order_id=' + result.order_id + '&transaction_status=' + result.transaction_status);
        },
        onPending: function (result) {
          console.log('⏳ Payment pending:', result);
          console.log('🌍 Payment pending in:', midtransConfig.environment, 'mode');
          navigate('/payment/pending?order_id=' + result.order_id + '&payment_type=' + result.payment_type);
        },
        onError: function (result) {
          console.error('❌ Payment error:', result);
          console.error('🌍 Payment error in:', midtransConfig.environment, 'mode');
          setError(`Payment failed (${midtransConfig.environment}): ` + (result.status_message || 'Please try again.'));
        },
        onClose: function () {
          console.log('🚫 Payment window closed');
          console.log('🌍 Payment closed in:', midtransConfig.environment, 'mode');
          setError('Payment canceled. Please try again to complete your purchase.');
        }
      });
    } catch (err) {
      console.error('💥 Payment error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        environment: midtransConfig?.environment
      });

      let errorMessage = `Failed to process payment (${midtransConfig?.environment || 'Unknown'}). Please try again.`;

      if (err.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later or contact support.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50">
        <NavbarComponent />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-3 text-gray-600">Loading product details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-amber-50">
        <NavbarComponent />
        <div className="container mx-auto px-4 py-8">
          <Alert color="failure" className="mb-4">
            <div className="font-medium">Error:</div>
            {error}
          </Alert>
          <div className="text-center">
            <Button color="light" onClick={() => navigate(-1)} className="mr-2">
              Go Back
            </Button>
            <Button color="warning" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-amber-50">
        <NavbarComponent />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Product not found</h2>
            <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or has been removed.</p>
            <Button color="light" onClick={() => navigate('/product-list')}>
              Browse Products
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <NavbarComponent />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Complete Your Purchase</h1>

            {/* Environment indicator */}
            {midtransConfig && (
              <div className={`mb-4 p-3 rounded-lg ${midtransConfig.isProduction
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}>
                <div className="font-medium text-sm">
                  🌍 Payment Environment: {midtransConfig.environment}
                  {midtransConfig.isProduction
                    ? ' (Live transactions)'
                    : ' (Test mode)'}
                </div>
              </div>
            )}

            {error && (
              <Alert color="failure" className="mb-4">
                <div className="font-medium">Payment Error:</div>
                {error}
              </Alert>
            )}

            <div className="border-b pb-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>
              <div className="flex items-center">
                <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 mr-4">
                  <img
                    src={getImageUrl(product.imageUrl || product.images?.[0])}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                  <p className="text-xs text-gray-400">
                    Seller: {product.seller_id?.username || product.seller_id?.full_name || 'Unknown'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">Rp {product.price.toLocaleString('id-ID')}</div>
                  <div className="text-sm text-gray-500">per item</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm font-medium">Quantity:</div>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 border rounded-l-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <div className="px-4 py-1 border-t border-b bg-white text-center min-w-12">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 border rounded-r-md bg-gray-100 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b pb-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Price Details</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Price ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span>Rp {(product.price * quantity).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total Amount</span>
                  <span className="text-amber-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button
                color="light"
                onClick={() => navigate(-1)}
                className="px-6"
              >
                ← Continue Shopping
              </Button>

              <div className="text-right">
                <div className="text-sm text-gray-500 mb-2">
                  Config: {midtransConfig ? '✅ Ready' : '⏳ Loading...'}
                  {midtransConfig && ` (${midtransConfig.environment})`}
                  <br />
                  Script: {snapScriptLoaded ? '✅ Ready' : '⏳ Loading...'}
                </div>
                <Button
                  color="warning"
                  onClick={handlePayment}
                  disabled={paymentLoading || !snapScriptLoaded || !midtransConfig}
                  className="px-8"
                >
                  {paymentLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    `💳 Pay with Midtrans ${midtransConfig ? `(${midtransConfig.environment})` : ''}`
                  )}
                </Button>
              </div>
            </div>

            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
                <div className="font-medium mb-2">Debug Info:</div>
                <div>API URL: {API_BASE_URL}</div>
                <div>Product ID: {id}</div>
                <div>Token: {token ? 'Present' : 'Missing'}</div>
                <div>Config Loaded: {midtransConfig ? 'Yes' : 'No'}</div>
                <div>Script Loaded: {snapScriptLoaded ? 'Yes' : 'No'}</div>
                <div>Product Price: {product.price}</div>
                <div>Total Price: {totalPrice}</div>
                {midtransConfig && (
                  <>
                    <div>Environment: {midtransConfig.environment}</div>
                    <div>Script URL: {midtransConfig.scriptUrl}</div>
                    <div>Is Production: {midtransConfig.isProduction ? 'Yes' : 'No'}</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MidtransPayment;