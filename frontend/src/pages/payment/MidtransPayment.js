import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Alert } from 'flowbite-react';
import axios from 'axios';
import NavbarComponent from '../../components/NavbarComponent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';

const API_URL = 'http://localhost:5000';

const MidtransPayment = () => {
  const { id } = useParams(); // Product ID from URL
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
  
  // Get product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProduct();
    }
  }, [id]);
  
  // Load Midtrans script
  useEffect(() => {
    // Check if script is already loaded
    if (document.getElementById('midtrans-snap')) {
      setSnapScriptLoaded(true);
      return;
    }
    
    // Load Midtrans Snap JS when component mounts
    const script = document.createElement('script');
    script.id = 'midtrans-snap';
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'SB-Mid-client-D5UY5aGYO_BSvIUk'); // Replace with your actual Midtrans client key
    
    script.onload = () => {
      console.log('Midtrans Snap script loaded successfully');
      setSnapScriptLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Midtrans Snap script');
      setError('Failed to load payment gateway. Please refresh and try again.');
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Don't remove the script on unmount as it might be needed by other components
      // If you really want to remove it, you can use this:
      // const existingScript = document.getElementById('midtrans-snap');
      // if (existingScript) document.body.removeChild(existingScript);
    };
  }, []);
  
  // Calculate total price
  const totalPrice = product ? product.price * quantity : 0;
  
  // Handle payment process
  const handlePayment = async () => {
    if (!token) {
      navigate('/login', { state: { from: `/payment/${id}` } });
      return;
    }
    
    if (!product) {
      setError('Product information not available');
      return;
    }
    
    if (!snapScriptLoaded || !window.snap) {
      setError('Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }
    
    setPaymentLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      // Create transaction on backend
      const response = await axios.post(
        `${API_URL}/api/payment/create-transaction`,
        {
          productId: product._id,
          quantity: quantity,
          totalAmount: totalPrice,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Get the snap token from response
      const { token: snapToken } = response.data;
      
      console.log('Received token from server:', snapToken);
      
      if (!snapToken) {
        throw new Error('Payment token not received from server');
      }
      
      // Open Midtrans Snap payment page
      window.snap.pay(snapToken, {
        onSuccess: function(result) {
          /* You can process the transaction result here */
          console.log('Payment success:', result);
          navigate('/payment/success?order_id=' + result.order_id + '&transaction_status=' + result.transaction_status);
        },
        onPending: function(result) {
          /* Transaction is pending */
          console.log('Payment pending:', result);
          navigate('/payment/pending?order_id=' + result.order_id + '&payment_type=' + result.payment_type);
        },
        onError: function(result) {
          /* Transaction failed */
          console.error('Payment error:', result);
          setError('Payment failed: ' + (result.status_message || 'Please try again.'));
          setPaymentLoading(false);
        },
        onClose: function() {
          /* Customer closed the payment page without completing payment */
          console.log('Payment window closed');
          setError('Payment canceled. Please try again to complete your purchase.');
          setPaymentLoading(false);
        }
      });
    } catch (err) {
      console.error('Payment error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to process payment. Please try again.'
      );
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
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-amber-50">
        <NavbarComponent />
        <div className="container mx-auto px-4 py-8">
          <Alert color="failure" className="mb-4">
            {error}
          </Alert>
          <div className="text-center">
            <Button color="light" onClick={() => navigate(-1)}>
              Go Back
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
            
            {error && (
              <Alert color="failure" className="mb-4">
                {error}
              </Alert>
            )}
            
            <div className="border-b pb-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>
              <div className="flex items-center">
                <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 mr-4">
                  <img 
                    src={product.imageUrl || (product.images && product.images.length > 0 ? `${API_URL}/${product.images[0]}` : 'https://via.placeholder.com/80')} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">Rp {product.price.toLocaleString('id-ID')}</div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center">
                <div className="mr-auto">Quantity:</div>
                <div className="flex items-center">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2 py-1 border rounded-l-md bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <div className="px-4 py-1 border-t border-b">
                    {quantity}
                  </div>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2 py-1 border rounded-r-md bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            <div className="border-b pb-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Price Details</h2>
              <div className="flex justify-between mb-2">
                <span>Price ({quantity} item{quantity > 1 ? 's' : ''})</span>
                <span>Rp {(product.price * quantity).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Delivery Fee</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t mt-2">
                <span>Total Amount</span>
                <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                color="light" 
                onClick={() => navigate(-1)}
              >
                Continue Shopping
              </Button>
              <Button 
                color="warning" 
                onClick={handlePayment}
                disabled={paymentLoading || !snapScriptLoaded}
              >
                {paymentLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  'Pay with Midtrans'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MidtransPayment;