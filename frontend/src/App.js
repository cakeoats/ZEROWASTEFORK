import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthSlider from "./pages/auth/AuthSlider";
import ForgotPasswordPage from "./pages/auth/ForgetPasswordPage";
import EmailVerificationPage from "./pages/auth/EmailVerificationPage";
import EmailVerificationSuccess from "./pages/auth/EmailVerificationSuccess";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import 'tailwindcss/tailwind.css';
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import ProductCatalog from "./pages/product/ProductCatalog";
import ProductDetail from "./pages/product/ProductDetail";
import UploadProduct from "./pages/product/UploadProduct";
import RatingUlasan from "./pages/product/RatingUlasan";
import WishlistPage from "./pages/product/WishlistPage";
import MidtransPayment from "./pages/payment/MidtransPayment";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentPending from "./pages/payment/PaymentPending";

// Admin ProtectedRoute component
const AdminProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const adminId = localStorage.getItem('adminId');

  if (!adminToken || !adminId) {
    // If not logged in, redirect to admin login page
    return <Navigate to="/admin/login" />;
  }

  // If logged in, show the protected component
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div>
            <Routes>
              <Route path="/" element={<LandingPage />} />

              {/* Auth routes - using AuthSlider for both login and register */}
              <Route path="/login" element={<AuthSlider />} />
              <Route path="/register" element={<AuthSlider />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verif-email" element={<EmailVerificationPage />} />
              <Route path="/success-email" element={<EmailVerificationSuccess />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected user routes */}
              <Route path="/profile" element={<ProfilePage />} />

              {/* New Wishlist route - Protected */}
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <WishlistPage />
                  </ProtectedRoute>
                }
              />

              {/* Payment Routes - Protected */}
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
              <Route path="/admin/dashboard" element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />

              {/* Product routes */}
              <Route path="/product-list" element={<ProductCatalog />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route
                path="/upload-product"
                element={
                  <ProtectedRoute>
                    <UploadProduct />
                  </ProtectedRoute>
                }
              />
              <Route path="/rating" element={<RatingUlasan />} />
            </Routes>
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;