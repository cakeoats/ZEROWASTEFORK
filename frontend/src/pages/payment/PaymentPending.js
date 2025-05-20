import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { HiClock, HiHome, HiDocumentText, HiRefresh } from 'react-icons/hi';
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

  // Function to format payment instructions based on payment type
  const getPaymentInstructions = () => {
    switch (paymentType) {
      case 'bank_transfer':
        return 'Please complete the bank transfer using the account details provided in your email.';
      case 'gopay':
        return 'Please check your GoPay app to complete the payment.';
      case 'shopeepay':
        return 'Please check your ShopeePay app to complete the payment.';
      default:
        return 'Please follow the payment instructions sent to your email to complete the transaction.';
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <NavbarComponent />
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 text-center">
            <div className="inline-flex justify-center items-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
              <HiClock className="h-12 w-12 text-yellow-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Payment Pending
            </h1>
            
            <p className="text-gray-600 mb-4">
              Your order has been placed but we are waiting for your payment to be confirmed.
            </p>
            
            <p className="text-gray-600 mb-6">
              {getPaymentInstructions()}
            </p>
            
            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-medium">{orderId}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium text-yellow-600">Pending</span>
                </div>
                {paymentType && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="font-medium">{paymentType.replace('_', ' ').toUpperCase()}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <Link to="/">
                <Button color="light" className="w-full">
                  <HiHome className="mr-2 h-5 w-5" />
                  Home
                </Button>
              </Link>
              
              <Link to="/orders">
                <Button color="warning" className="w-full">
                  <HiDocumentText className="mr-2 h-5 w-5" />
                  My Orders
                </Button>
              </Link>
            </div>
            
            <div className="mt-4">
              <Button color="light" className="w-full" outline onClick={() => window.location.reload()}>
                <HiRefresh className="mr-2 h-5 w-5" />
                Check Status Again
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PaymentPending;