import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/auth/RegisterPage";
import Login from "./pages/auth/Login";
import ForgotPasswordPage from "./pages/auth/ForgetPasswordPage";
import EmailVerificationPage from "./pages/auth/EmailVerificationPage";
import EmailVerificationSuccess from "./pages/auth/EmailVerificationSuccess";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import { AuthProvider } from "./contexts/AuthContext";
import 'tailwindcss/tailwind.css';
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductCatalog from "./pages/product/ProductCatalog";
import ProductDetail from "./pages/product/ProductDetail";
import UploadProduct from "./pages/product/UploadProduct";
import RatingUlasan from "./pages/product/RatingUlasan";

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
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/product-list" element={<ProductCatalog />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/upload-product" element={<UploadProduct />} />
            <Route path="/rating-ulasan" element={<RatingUlasan />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;