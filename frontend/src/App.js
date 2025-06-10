// frontend/src/App.js - Updated to use AuthSlider for login/register
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Import semua halaman
import LandingPage from './pages/LandingPage';
import AuthSlider from './pages/auth/AuthSlider'; // Main auth component
import ForgotPasswordPage from './pages/auth/ForgetPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import EmailVerificationPage from './pages/auth/EmailVerificationPage';
import EmailVerificationSuccess from './pages/auth/EmailVerificationSuccess';
import ProfilePage from './pages/ProfilePage';
import ProductCatalog from './pages/product/ProductCatalog';
import ProductDetail from './pages/product/ProductDetail';
import UploadProduct from './pages/product/UploadProduct';
import EditProduct from './pages/product/EditProduct';
import MyProductsPage from './pages/MyProductsPage';
import WishlistPage from './pages/product/WishlistPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import CartPage from './pages/cart/CartPage';
import MidtransPayment from './pages/payment/MidtransPayment';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentPending from './pages/payment/PaymentPending';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/product-list" element={<ProductCatalog />} />
                <Route path="/products/:id" element={<ProductDetail />} />

                {/* UPDATED: Auth Routes - Now using AuthSlider */}
                <Route path="/auth" element={<AuthSlider />} />
                <Route path="/login" element={<AuthSlider />} />
                <Route path="/register" element={<AuthSlider />} />

                {/* Separate auth pages that don't use AuthSlider */}
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verif-email" element={<EmailVerificationPage />} />
                <Route path="/success-email" element={<EmailVerificationSuccess />} />

                {/* Protected User Routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upload-product"
                  element={
                    <ProtectedRoute>
                      <UploadProduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-product/:id"
                  element={
                    <ProtectedRoute>
                      <EditProduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-products"
                  element={
                    <ProtectedRoute>
                      <MyProductsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <WishlistPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-history"
                  element={
                    <ProtectedRoute>
                      <OrderHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <CartPage />
                    </ProtectedRoute>
                  }
                />

                {/* Payment Routes */}
                <Route
                  path="/payment/:id"
                  element={
                    <ProtectedRoute>
                      <MidtransPayment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/success"
                  element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/pending"
                  element={
                    <ProtectedRoute>
                      <PaymentPending />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />

                {/* 404 Route */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <h1 className="text-6xl font-bold text-gray-600 mb-4">404</h1>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                          Halaman Tidak Ditemukan
                        </h2>
                        <p className="text-gray-600 mb-8">
                          Maaf, halaman yang Anda cari tidak dapat ditemukan.
                        </p>
                        <a
                          href="/"
                          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                          Kembali ke Beranda
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;