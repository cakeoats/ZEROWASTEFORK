// frontend/src/components/ProtectedRoute.js - FIXED REDIRECT
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  const location = useLocation();

  // FIXED: If not authenticated, redirect to login page instead of register
  if (!token) {
    console.log('🔒 User not authenticated, redirecting to login with return URL:', location.pathname);

    // Store the return URL so user can be redirected back after login
    return <Navigate to="/login" state={{ from: location.pathname }} />;
  }

  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;