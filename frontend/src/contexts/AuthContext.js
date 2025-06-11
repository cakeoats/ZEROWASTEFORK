import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const login = (userData, token) => {
    console.log('🔐 User logging in:', userData?.username || userData?.email);

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
    setToken(token);

    // FIXED: Trigger storage event for cart context to detect user change
    window.dispatchEvent(new Event('storage'));
  };

  const logout = () => {
    console.log('🚪 User logging out');

    // FIXED: Clear all auth-related storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');

    // FIXED: Clear user-specific cart
    try {
      const userId = user?.id || user?._id;
      if (userId) {
        // Clear the cart for this specific user
        localStorage.removeItem(`cart_${userId}`);
        console.log('🗑️ Cleared cart for user:', userId);
      }
    } catch (error) {
      console.error('❌ Error clearing user cart:', error);
    }

    setUser(null);
    setToken(null);

    // FIXED: Trigger storage event for cart context to detect logout
    window.dispatchEvent(new Event('storage'));

    console.log('✅ Logout completed, all data cleared');
  };

  // Simple getter for checking if user is authenticated
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);