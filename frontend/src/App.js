import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import RegisterPage from "./components/RegisterPage";
import Login from "./components/Login";
import ForgotPasswordPage from "./components/ForgetPasswordPage";
import EmailVerificationPage from "./components/EmailVerificationPage";
import EmailVerificationSuccess from "./components/EmailVerificationSuccess";
import ResetPasswordPage from "./components/ResetPasswordPage";
import { AuthProvider } from "./contexts/AuthContext"; // ⬅️ import AuthProvider
import 'tailwindcss/tailwind.css';
import ProfilePage from "./components/ProfilePage";

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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
