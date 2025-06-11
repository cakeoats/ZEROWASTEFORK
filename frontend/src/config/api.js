// frontend/src/config/api.js - FIXED REGISTER CORS ERROR

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// FIXED: Better API URL handling with CORRECT backend URL
const getApiBaseUrl = () => {
  // Check environment variables first
  if (process.env.REACT_APP_API_URL) {
    console.log('🔧 Using API URL from env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  // Fallback URLs based on environment
  if (isDevelopment) {
    console.log('🔧 Using development API URL');
    return 'http://localhost:5000';
  }

  // FIXED: Use YOUR actual backend URL
  console.log('🔧 Using production API URL');
  return 'https://zerowaste-backend-theta.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();

// Log the final API URL for debugging
console.log('🌐 Final API Base URL:', API_BASE_URL);

// FIXED: Export environment detection variables
export { isDevelopment, isProduction };

// FIXED: Simple API URL builder
export const getApiUrl = (endpoint = '') => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Ensure base URL doesn't end with slash
  const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

  const fullUrl = `${cleanBaseUrl}/${cleanEndpoint}`;

  // Debug in development only
  if (isDevelopment) {
    console.log('🔗 API URL built:', fullUrl);
  }

  return fullUrl;
};

// FIXED: Enhanced auth headers
export const getAuthHeaders = () => {
  // Try multiple token storage locations
  let token = localStorage.getItem('token');

  if (!token) {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        token = parsed.token;
      }
    } catch (e) {
      console.warn('Error parsing userInfo from localStorage:', e);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// FIXED: Form headers for file uploads
export const getFormHeaders = () => {
  let token = localStorage.getItem('token');

  if (!token) {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        token = parsed.token;
      }
    } catch (e) {
      console.warn('Error parsing userInfo from localStorage:', e);
    }
  }

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData, let browser handle it
  return headers;
};

// FIXED: Simplified image URL handling
export const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath === null || imagePath === undefined || imagePath.trim() === '') {
    return 'https://via.placeholder.com/400x400?text=No+Image';
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Handle relative paths
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

  return `${cleanBaseUrl}/${cleanPath}`;
};

// FIXED: Product image URL with better fallbacks
export const getProductImageUrl = (product) => {
  if (!product) {
    return 'https://via.placeholder.com/400x400?text=No+Product';
  }

  // Priority order: imageUrl > images[0] > image > placeholder
  if (product.imageUrl && product.imageUrl.trim() !== '') {
    return getImageUrl(product.imageUrl);
  }

  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    if (firstImage && firstImage.trim() !== '') {
      return getImageUrl(firstImage);
    }
  }

  if (product.image && product.image.trim() !== '') {
    return getImageUrl(product.image);
  }

  // Final fallback
  return 'https://via.placeholder.com/400x400?text=No+Image';
};

// FIXED: Midtrans configuration with environment variables
export const getMidtransConfig = () => {
  // PERBAIKAN: PAKSA SANDBOX
  const config = {
    clientKey: process.env.REACT_APP_MIDTRANS_CLIENT_KEY_SANDBOX || 'SB-Mid-client-FHBq0wtUSyCEStlH',
    isProduction: false, // ❌ JANGAN UBAH INI
    scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js', // ✅ SANDBOX URL
    environment: 'SANDBOX' // ✅ SANDBOX
  };

  // Validasi client key
  if (!config.clientKey || !config.clientKey.startsWith('SB-Mid-client-')) {
    console.error('❌ Client key bukan sandbox key!');
    console.error('Expected: SB-Mid-client-xxx');
    console.error('Received:', config.clientKey);
    throw new Error('Midtrans client key harus menggunakan sandbox key');
  }

  if (isDevelopment) {
    console.log('🔧 Midtrans Config (FIXED):', {
      environment: config.environment,
      scriptUrl: config.scriptUrl,
      hasClientKey: !!config.clientKey,
      clientKeyPrefix: config.clientKey.substring(0, 20) + '...'
    });
  }

  return config;
};

// FIXED: Simple API request wrapper with proper error handling
export const apiRequest = async (url, options = {}) => {
  try {
    const requestOptions = {
      method: 'GET',
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    };

    if (isDevelopment) {
      console.log(`🚀 Making API request to: ${url}`);
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (isDevelopment) {
      console.log(`✅ API request successful`);
    }
    return data;

  } catch (error) {
    console.error(`❌ API request failed:`, error);
    throw error;
  }
};

// Legacy alias for backward compatibility
export const makeApiRequest = apiRequest;

// FIXED: API health check
export const checkApiHealth = async () => {
  try {
    const healthUrl = getApiUrl('health');
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (isDevelopment) {
      console.log('🏥 API Health Check passed:', data.status);
    }
    return data;

  } catch (error) {
    console.error('❌ API Health Check failed:', error.message);
    throw error;
  }
};

// FIXED: Error handler
export const handleApiError = (error) => {
  let errorInfo = {
    message: 'An error occurred',
    status: 0,
    category: 'unknown'
  };

  if (error.message.includes('401')) {
    errorInfo = {
      message: 'Authentication required. Please login again.',
      status: 401,
      category: 'auth'
    };
  } else if (error.message.includes('403')) {
    errorInfo = {
      message: 'Access denied. You do not have permission.',
      status: 403,
      category: 'permission'
    };
  } else if (error.message.includes('404')) {
    errorInfo = {
      message: 'Resource not found.',
      status: 404,
      category: 'not_found'
    };
  } else if (error.message.includes('500')) {
    errorInfo = {
      message: 'Server error. Please try again later.',
      status: 500,
      category: 'server'
    };
  } else if (error.message.includes('Network')) {
    errorInfo = {
      message: 'Network error. Please check your internet connection.',
      status: 0,
      category: 'network'
    };
  } else {
    errorInfo = {
      message: error.message || 'An unexpected error occurred',
      status: -1,
      category: 'unknown'
    };
  }

  console.error(`API Error (${errorInfo.category}):`, errorInfo.message);
  return errorInfo;
};

// FIXED: Image validation
export const validateImageUrl = (url, timeout = 5000) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    const timeoutId = setTimeout(() => {
      img.onload = img.onerror = null;
      resolve(false);
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(false);
    };

    img.src = url;
  });
};

// Debug logging in development
if (isDevelopment) {
  console.log('🔧 API Configuration loaded:', {
    baseURL: API_BASE_URL,
    environment: process.env.NODE_ENV,
    isDevelopment,
    isProduction
  });
}