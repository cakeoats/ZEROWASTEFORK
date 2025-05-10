import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/auth/RegisterPage";
import Login from "./pages/auth/Login";
import ForgotPasswordPage from "./pages/auth/ForgetPasswordPage";
import EmailVerificationPage from "./pages/auth/EmailVerificationPage";
import EmailVerificationSuccess from "./pages/auth/EmailVerificationSuccess";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import 'tailwindcss/tailwind.css';
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import ProductCatalog from "./pages/product/ProductCatalog";
import ProductDetail from "./pages/product/ProductDetail";
import UploadProduct from "./pages/product/UploadProduct";
import RatingUlasan from "./pages/product/RatingUlasan";

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
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verif-email" element={<EmailVerificationPage />} />
            <Route path="/success-email" element={<EmailVerificationSuccess />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
            
            <Route path="/product-list" element={<ProductCatalog />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            {/* Protected route for upload product */}
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
    </AuthProvider>
  );
};

export default App;