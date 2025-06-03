// frontend/src/config/api.js
// Centralized API configuration with environment variable support

// Get API URL from environment variable with fallback to your actual backend
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://zerowaste-backend-theta.vercel.app';

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const currentEnv = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';

// API configuration object
export const apiConfig = {
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint = '') => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${API_BASE_URL}/${cleanEndpoint}`;

    // Log API calls in development
    if (isDevelopment) {
        console.log('🔗 API Call:', url);
    }

    return url;
};

// Helper function to get image URL with comprehensive error handling
export const getImageUrl = (imagePath) => {
    // Return placeholder if no image path
    if (!imagePath) {
        console.log('🖼️ No image path provided, using placeholder');
        return 'https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=No+Image';
    }

    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
        console.log('🌐 Using full URL:', imagePath);
        return imagePath;
    }

    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

    // Construct full URL
    const fullUrl = `${API_BASE_URL}/${cleanPath}`;
    console.log('🔗 Constructed image URL:', fullUrl);

    return fullUrl;
};

// Enhanced function for product images with multiple fallbacks
export const getProductImageUrl = (product) => {
    console.log('🖼️ Getting product image for:', product?.name);

    // Check multiple possible image sources
    if (product?.imageUrl) {
        console.log('📸 Using product.imageUrl:', product.imageUrl);
        return getImageUrl(product.imageUrl);
    }

    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
        console.log('📸 Using product.images[0]:', product.images[0]);
        return getImageUrl(product.images[0]);
    }

    if (product?.image) {
        console.log('📸 Using product.image:', product.image);
        return getImageUrl(product.image);
    }

    // Return placeholder if no image found
    console.log('🖼️ No image found for product, using placeholder');
    return 'https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=No+Image';
};

// Auth headers helper
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    };
};

// Multipart form headers helper (for file uploads)
export const getFormHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? {
        Authorization: `Bearer ${token}`
        // Don't set Content-Type for multipart/form-data, let browser handle it
    } : {};
};

// Midtrans Configuration
export const MIDTRANS_CONFIG = {
    development: {
        scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
        clientKey: process.env.REACT_APP_MIDTRANS_CLIENT_KEY_SANDBOX || 'SB-Mid-client-FHBq0wtUSyCEStlH',
        isProduction: false
    },
    production: {
        scriptUrl: 'https://app.midtrans.com/snap/snap.js',
        clientKey: process.env.REACT_APP_MIDTRANS_CLIENT_KEY_PRODUCTION || 'Mid-client-axaDAjpfCGFhcFrJ',
        isProduction: true
    }
};

// Get current Midtrans config based on environment
export const getMidtransConfig = () => {
    const env = currentEnv;
    return MIDTRANS_CONFIG[env === 'production' ? 'production' : 'development'];
};

// API health check
export const checkApiHealth = async () => {
    try {
        const response = await fetch(getApiUrl('health'));
        return response.ok;
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
};

// Image validation helper
export const validateImageUrl = async (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
};

// Debug logging
console.log('🔧 API Configuration:', {
    baseURL: API_BASE_URL,
    environment: process.env.NODE_ENV,
    customEnv: currentEnv,
    isDevelopment,
    isProduction,
    envVariable: process.env.REACT_APP_API_URL
});

// Error handler for API requests
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
    if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || defaultMessage;
        const status = error.response.status;

        console.error(`API Error ${status}:`, message);
        return { message, status };
    } else if (error.request) {
        // Request was made but no response
        console.error('Network Error:', error.message);
        return {
            message: 'Network error. Please check your connection.',
            status: 0
        };
    } else {
        // Something else happened
        console.error('Request Error:', error.message);
        return {
            message: error.message || defaultMessage,
            status: -1
        };
    }
};

export default {
    API_BASE_URL,
    getApiUrl,
    getImageUrl,
    getProductImageUrl,
    getAuthHeaders,
    getFormHeaders,
    getMidtransConfig,
    checkApiHealth,
    validateImageUrl,
    handleApiError
};