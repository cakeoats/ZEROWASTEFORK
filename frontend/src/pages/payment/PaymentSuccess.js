// frontend/src/pages/payment/PaymentSuccess.js - FIXED VERSION
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Alert } from 'flowbite-react';
import { HiCheckCircle, HiHome, HiShoppingBag, HiDocumentText, HiExclamation } from 'react-icons/hi';
import NavbarComponent from '../../components/NavbarComponent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';
import axios from 'axios';
import { getApiUrl, getAuthHeaders } from '../../config/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { language } = useLanguage();
  const translate = useTranslate(language);

  // Get URL parameters
  const orderId = searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');
  
  // Component state
  const [verificationStatus, setVerificationStatus] = useState('checking'); // checking, success, error
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/payment/success' } });
    }
  }, [token, navigate]);

  // FIXED: Verify transaction and get order details
  useEffect(() => {
    const verifyTransaction = async () => {
      if (!orderId || !token) return;

      try {
        console.log('🔍 Verifying transaction:', orderId);
        
        // Check transaction status with backend
        const response = await axios.get(
          getApiUrl(`api/payment/transaction-status/${orderId}`),
          { 
            headers: getAuthHeaders(),
            timeout: 10000 // 10 second timeout
          }
        );

        console.log('✅ Transaction verification response:', response.data);

        if (response.data.success) {
          setOrderDetails(response.data.transaction);
          setVerificationStatus('success');
        } else {
          throw new Error(response.data.message || 'Transaction verification failed');
        }

      } catch (err) {
        console.error('❌ Transaction verification error:', err);
        
        // Set error but still show success page if we have orderId
        if (orderId) {
          setError('Could not verify transaction details, but payment appears successful.');
          setVerificationStatus('success');
        } else {
          setError('Transaction verification failed.');
          setVerificationStatus('error');
        }
      }
    };

    verifyTransaction();
  }, [orderId, token]);

  // Log success for debugging
  useEffect(() => {
    console.log('✅ Payment Success Page:', {
      orderId,
      transactionStatus,
      token: token ? 'Present' : 'Missing',
      verificationStatus
    });
  }, [orderId, transactionStatus, token, verificationStatus]);

  // Show loading state while checking
  if (verificationStatus === 'checking') {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col">
        <NavbarComponent />
        
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {language === 'id' ? 'Memverifikasi Pembayaran...' : 'Verifying Payment...'}
            </h2>
            <p className="text-gray-600">
              {language === 'id' ? 'Mohon tunggu sebentar' : 'Please wait a moment'}
            </p>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <NavbarComponent />
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 text-center">
            {/* Success Icon with Animation */}
            <div className="inline-flex justify-center items-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
              <HiCheckCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              🎉 {language === 'id' ? 'Pembayaran Berhasil!' : 'Payment Successful!'}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {language === 'id' 
                ? 'Transaksi Anda telah berhasil diproses. Kami telah mengirim email konfirmasi dengan detail pesanan.' 
                : 'Your transaction has been completed successfully. We\'ve sent a confirmation email with your order details.'}
            </p>
            
            {/* Show error if transaction verification failed but we still have order ID */}
            {error && (
              <Alert color="warning" className="mb-6 text-left">
                <HiExclamation className="h-5 w-5" />
                <span className="ml-2 text-sm">{error}</span>
              </Alert>
            )}
            
            {/* Order Details */}
            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">
                    {language === 'id' ? 'ID Pesanan:' : 'Order ID:'}
                  </span>
                  <span className="font-medium text-green-600">{orderId}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">
                    {language === 'id' ? 'Status:' : 'Status:'}
                  </span>
                  <span className="font-medium text-green-600">
                    {orderDetails?.status === 'paid' 
                      ? (language === 'id' ? 'Dibayar' : 'Paid')
                      : transactionStatus === 'settlement' || transactionStatus === 'capture' 
                        ? (language === 'id' ? 'Dibayar' : 'Paid')
                        : (language === 'id' ? 'Berhasil' : 'Completed')
                    }
                  </span>
                </div>
                
                {orderDetails?.totalAmount && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">
                      {language === 'id' ? 'Total:' : 'Total:'}
                    </span>
                    <span className="font-medium text-green-600">
                      Rp {orderDetails.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2">
                  {language === 'id' ? 'Transaksi selesai pada' : 'Transaction completed at'} {new Date().toLocaleString()}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Link to="/">
                <Button color="light" className="w-full">
                  <HiHome className="mr-2 h-5 w-5" />
                  {language === 'id' ? 'Beranda' : 'Home'}
                </Button>
              </Link>
              
              <Link to="/order-history">
                <Button color="warning" className="w-full">
                  <HiDocumentText className="mr-2 h-5 w-5" />
                  {language === 'id' ? 'Riwayat Pesanan' : 'Order History'}
                </Button>
              </Link>
            </div>
            
            <Link to="/product-list">
              <Button color="light" className="w-full" outline>
                <HiShoppingBag className="mr-2 h-5 w-5" />
                {language === 'id' ? 'Lanjutkan Belanja' : 'Continue Shopping'}
              </Button>
            </Link>
            
            <div className="mt-4 text-xs text-gray-500">
              {language === 'id' ? 'Butuh bantuan?' : 'Need help?'}{' '}
              <Link to="/profile" className="text-blue-600 hover:underline">
                {language === 'id' ? 'Hubungi Dukungan' : 'Contact Support'}
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