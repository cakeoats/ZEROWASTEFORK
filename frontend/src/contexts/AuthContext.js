import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // FIXED: Initialize from localStorage with proper error handling
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('user');
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  });

  // FIXED: Enhanced login function with better storage management
  const login = (userData, userToken) => {
    try {
      console.log('🔐 AuthContext login called with:', {
        userData: userData ? 'present' : 'missing',
        token: userToken ? 'present' : 'missing'
      });

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userToken);

      // ADDITIONAL: Store userInfo for backward compatibility
      const userInfo = { user: userData, token: userToken };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      // Update state
      setUser(userData);
      setToken(userToken);

      console.log('✅ AuthContext login successful');
    } catch (error) {
      console.error('❌ Error in login function:', error);
    }
  };

  // FIXED: Enhanced logout function with complete cleanup
  const logout = () => {
    try {
      console.log('🚪 AuthContext logout called');

      // Clear all auth-related items from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');

      // Reset state
      setUser(null);
      setToken(null);

      console.log('✅ AuthContext logout successful');
    } catch (error) {
      console.error('❌ Error in logout function:', error);
    }
  };

  // Simple getter for checking if user is authenticated
  const isAuthenticated = Boolean(token && user);

  // ADDED: Function to get auth headers for API requests
  const getAuthHeaders = () => {
    if (!token) {
      console.warn('⚠️ No token available for auth headers');
      return {};
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // ADDED: Function to refresh token from localStorage (useful for page refresh)
  const refreshFromStorage = () => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        console.log('🔄 Auth refreshed from localStorage');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error refreshing from storage:', error);
      logout(); // Clear corrupted data
      return false;
    }
  };

  // ADDED: Check token validity on mount and storage changes
  useEffect(() => {
    const checkAuthState = () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      console.log('🔍 Checking auth state:', {
        hasToken: !!savedToken,
        hasUser: !!savedUser,
        currentToken: !!token,
        currentUser: !!user
      });

      // If we have data in localStorage but not in state, restore it
      if (savedToken && savedUser && (!token || !user)) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser);
          console.log('🔄 Auth state restored from localStorage');
        } catch (error) {
          console.error('❌ Error restoring auth state:', error);
          logout();
        }
      }
      // If we have state but no localStorage, clear state
      else if ((token || user) && (!savedToken || !savedUser)) {
        console.log('🧹 Clearing inconsistent auth state');
        logout();
      }
    };

    checkAuthState();

    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        console.log('🔄 Storage changed, rechecking auth state');
        checkAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array - only run on mount

  // ADDED: Debug logging for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Auth State Updated:', {
        isAuthenticated,
        hasUser: !!user,
        hasToken: !!token,
        userId: user?.id || user?._id,
        username: user?.username
      });
    }
  }, [user, token, isAuthenticated]);

  const contextValue = {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    getAuthHeaders,
    refreshFromStorage
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};