// frontend/src/config/api.js - FIXED API Configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// FIXED: Better API URL detection
const getApiBaseUrl = () => {
  // Development
  if (isDevelopment) {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  // Production - try multiple backend URLs
  const backendUrls = [
    process.env.REACT_APP_API_URL,
    'https://zerowaste-backend-theta.vercel.app',
    'https://zerowastemarket-production.up.railway.app'
  ].filter(Boolean);

  // Return the first available URL
  return backendUrls[0] || 'https://zerowaste-backend-theta.vercel.app';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Configuration:', {
  environment: process.env.NODE_ENV,
  baseUrl: API_BASE_URL,
  isDevelopment
});

// FIXED: Enhanced API URL builder
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Ensure base URL doesn't end with slash
  const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  
  const fullUrl = `${cleanBaseUrl}/${cleanEndpoint}`;
  
  // Debug logging in development
  if (isDevelopment) {
    console.log('🔗 API URL:', fullUrl);
  }
  
  return fullUrl;
};

// FIXED: Enhanced auth headers with better token handling
export const getAuthHeaders = () => {
  // Try multiple token storage locations
  let token = localStorage.getItem('token');
  
  if (!token) {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        token = parsed.token;
      } catch (e) {
        console.error('Error parsing userInfo:', e);
      }
    }
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Debug logging in development
  if (isDevelopment) {
    console.log('🔐 Auth headers:', {
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });
  }

  return headers;
};

// FIXED: Enhanced image URL handling
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://via.placeholder.com/300?text=No+Image';
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Handle relative paths
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  
  return `${cleanBaseUrl}/${cleanPath}`;
};

// FIXED: Product image URL with fallback
export const getProductImageUrl = (product) => {
  if (!product) {
    return 'https://via.placeholder.com/300?text=No+Product';
  }

  // Check for direct imageUrl property
  if (product.imageUrl) {
    return product.imageUrl;
  }

  // Check for images array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    return getImageUrl(firstImage);
  }

  // Fallback
  return 'https://via.placeholder.com/300?text=No+Image';
};

// FIXED: Midtrans configuration
export const getMidtransConfig = () => {
  const isProduction = process.env.REACT_APP_MIDTRANS_IS_PRODUCTION === 'true';
  
  return {
    clientKey: isProduction 
      ? process.env.REACT_APP_MIDTRANS_CLIENT_KEY_PRODUCTION
      : process.env.REACT_APP_MIDTRANS_CLIENT_KEY_SANDBOX,
    isProduction,
    scriptUrl: isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
  };
};

// FIXED: API request interceptor with retry logic
export const apiRequest = async (url, options = {}) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 API Request (attempt ${attempt}):`, url);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers
        },
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Response (attempt ${attempt}):`, data);
      return data;

    } catch (error) {
      console.error(`❌ API Error (attempt ${attempt}):`, error);
      lastError = error;

      // Don't retry on authentication errors
      if (error.message.includes('401') || error.message.includes('403')) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// FIXED: Health check function
export const checkApiHealth = async () => {
  try {
    const healthUrl = getApiUrl('health');
    const response = await fetch(healthUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('🏥 API Health Check:', data);
    return data;

  } catch (error) {
    console.error('❌ API Health Check Failed:', error);
    throw error;
  }
};

// Export configuration for debugging
export const debugConfig = {
  apiBaseUrl: API_BASE_URL,
  environment: process.env.NODE_ENV,
  isDevelopment,
  envVars: {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    REACT_APP_MIDTRANS_IS_PRODUCTION: process.env.REACT_APP_MIDTRANS_IS_PRODUCTION
  }
};

// Auto-run health check in development
if (isDevelopment) {
  setTimeout(() => {
    checkApiHealth().catch(err => {
      console.warn('🚨 API not reachable:', err.message);
    });
  }, 1000);
}