import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { HiClock, HiHome, HiDocumentText, HiRefresh, HiExclamationCircle } from 'react-icons/hi';
import NavbarComponent from '../../components/NavbarComponent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';

const PaymentPending = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const paymentType = searchParams.get('payment_type');
  
  const navigate = useNavigate();
  const { token } = useAuth();
  const { language } = useLanguage();
  const translate = useTranslate(language);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/payment/pending' } });
    }
  }, [token, navigate]);

  // Log pending info for debugging
  useEffect(() => {
    console.log('⏳ Payment Pending Page:', {
      orderId,
      paymentType,
      token: token ? 'Present' : 'Missing'
    });
  }, [orderId, paymentType, token]);

  // Function to format payment instructions based on payment type
  const getPaymentInstructions = () => {
    switch (paymentType) {
      case 'bank_transfer':
        return 'Please complete the bank transfer using the account details provided in your email or payment page.';
      case 'gopay':
        return 'Please check your GoPay app to complete the payment. You may need to approve the transaction.';
      case 'shopeepay':
        return 'Please check your ShopeePay app to complete the payment.';
      case 'cstore':
        return 'Please visit the convenience store and provide your payment code to complete the transaction.';
      case 'bca_va':
      case 'bni_va':
      case 'bri_va':
      case 'permata_va':
        return 'Please complete the payment using Virtual Account number provided. You can pay through ATM, internet banking, or mobile banking.';
      default:
        return 'Please follow the payment instructions to complete the transaction. Check your email for detailed instructions.';
    }
  };

  const getEstimatedTime = () => {
    switch (paymentType) {
      case 'bank_transfer':
      case 'bca_va':
      case 'bni_va':
      case 'bri_va':
        return 'Usually processed within 1-3 hours';
      case 'gopay':
      case 'shopeepay':
        return 'Usually processed within 5-10 minutes';
      case 'cstore':
        return 'Please complete within 24 hours';
      default:
        return 'Processing time varies by payment method';
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <NavbarComponent />
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 text-center">
            {/* Pending Icon with Pulsing Animation */}
            <div className="inline-flex justify-center items-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
              <HiClock className="h-12 w-12 text-yellow-600 animate-pulse" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              ⏳ Payment Pending
            </h1>
            
            <p className="text-gray-600 mb-4">
              Your order has been placed but we are waiting for your payment to be confirmed.
            </p>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
              <div className="flex">
                <HiExclamationCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 mb-2">
                    {getPaymentInstructions()}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {getEstimatedTime()}
                  </p>
                </div>
              </div>
            </div>
            
            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-medium">{orderId}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium text-yellow-600">Pending Payment</span>
                </div>
                {paymentType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="font-medium capitalize">
                      {paymentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Order created at {new Date().toLocaleString()}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Link to="/">
                <Button color="light" className="w-full">
                  <HiHome className="mr-2 h-5 w-5" />
                  Home
                </Button>
              </Link>
              
              <Link to="/my-products">
                <Button color="warning" className="w-full">
                  <HiDocumentText className="mr-2 h-5 w-5" />
                  My Products
                </Button>
              </Link>
            </div>
            
            <Button 
              color="light" 
              className="w-full mb-4" 
              outline 
              onClick={() => window.location.reload()}
            >
              <HiRefresh className="mr-2 h-5 w-5" />
              Check Payment Status
            </Button>
            
            <div className="text-xs text-gray-500">
              Payment not going through? <Link to="/profile" className="text-blue-600 hover:underline">Contact Support</Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PaymentPending;