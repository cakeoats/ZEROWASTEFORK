// frontend/src/config/api.js
// Centralized API configuration

// Get API URL from environment variable with fallback
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://zerowaste-backend-theta.vercel.app';

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

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
    return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300?text=No+Image';

    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // Otherwise, construct full URL
    return `${API_BASE_URL}/${imagePath}`;
};

// Auth headers helper
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Midtrans Configuration
export const MIDTRANS_CONFIG = {
    development: {
        scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
        clientKey: process.env.REACT_APP_MIDTRANS_CLIENT_KEY_SANDBOX || 'SB-Mid-client-D5UY5aGYO_BSvIUk',
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
    const env = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';
    return MIDTRANS_CONFIG[env === 'production' ? 'production' : 'development'];
};

// Console log for debugging in development
if (isDevelopment) {
    console.log('🔧 API Configuration:', {
        baseURL: API_BASE_URL,
        environment: process.env.NODE_ENV,
        isDevelopment,
        isProduction,
        midtransConfig: getMidtransConfig()
    });
}