import React from 'react';
import { Navigate } from 'react-router-dom';

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

export default AdminProtectedRoute;