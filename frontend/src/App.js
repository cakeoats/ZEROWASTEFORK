import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthSlider from "./pages/auth/AuthSlider";
import ForgotPasswordPage from "./pages/auth/ForgetPasswordPage";
import EmailVerificationPage from "./pages/auth/EmailVerificationPage";
import EmailVerificationSuccess from "./pages/auth/EmailVerificationSuccess";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import MyProductsPage from "./pages/MyProductsPage"; // Import the My Products page
import EditProduct from "./pages/product/EditProduct"; // Import the Edit Product page
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import ProductCatalog from "./pages/product/ProductCatalog";
import ProductDetail from "./pages/product/ProductDetail";
import UploadProduct from "./pages/product/UploadProduct";
import RatingUlasan from "./pages/product/RatingUlasan";
import WishlistPage from "./pages/product/WishlistPage";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import 'tailwindcss/tailwind.css';
import AdminProtectedRoute from "./components/AdminProtectedRoute";

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

              {/* My Products route - Protected */}
              <Route
                path="/my-products"
                element={
                  <ProtectedRoute>
                    <MyProductsPage />
                  </ProtectedRoute>
                }
              />

              {/* Edit Product route - Protected */}
              <Route
                path="/edit-product/:id"
                element={
                  <ProtectedRoute>
                    <EditProduct />
                  </ProtectedRoute>
                }
              />

              {/* Wishlist route - Protected */}
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <WishlistPage />
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