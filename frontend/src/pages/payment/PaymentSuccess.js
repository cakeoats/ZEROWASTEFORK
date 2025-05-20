import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { HiCheckCircle, HiHome, HiShoppingBag, HiDocumentText } from 'react-icons/hi';
import NavbarComponent from '../../components/NavbarComponent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');
  
  const navigate = useNavigate();
  const { token } = useAuth();
  const { language } = useLanguage();
  const translate = useTranslate(language);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/payment/success' } });
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <NavbarComponent />
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 text-center">
            <div className="inline-flex justify-center items-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <HiCheckCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Payment Successful!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Your transaction has been completed successfully. We've sent a confirmation email with your order details.
            </p>
            
            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-medium">{orderId}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium text-green-600">
                    {transactionStatus || 'Completed'}
                  </span>
                </div>
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
              <Link to="/product-list">
                <Button color="light" className="w-full" outline>
                  <HiShoppingBag className="mr-2 h-5 w-5" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PaymentSuccess;