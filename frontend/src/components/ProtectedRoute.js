import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to register page with the return URL
  if (!token) {
    return <Navigate to="/register" state={{ from: location.pathname }} />;
  }

  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;