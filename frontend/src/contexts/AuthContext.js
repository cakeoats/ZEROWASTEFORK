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

    // FIXED: Trigger multiple events to ensure cart context detects user change
    setTimeout(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(userData),
        storageArea: localStorage
      }));

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'token',
        newValue: token,
        storageArea: localStorage
      }));
    }, 100);
  };

  const logout = () => {
    console.log('🚪 User logging out');

    // FIXED: Clear user-specific cart first
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

    // FIXED: Clear all auth-related storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');

    setUser(null);
    setToken(null);

    // FIXED: Trigger multiple events to ensure cart context detects logout
    setTimeout(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user',
        newValue: null,
        storageArea: localStorage
      }));

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'token',
        newValue: null,
        storageArea: localStorage
      }));
    }, 100);

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