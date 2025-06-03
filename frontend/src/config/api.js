// frontend/src/config/api.js
// Centralized API configuration with environment variable support

// Get API URL from environment variable with fallback
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

// Debug logging for development
if (isDevelopment) {
    console.log('🔧 API Configuration:', {
        baseURL: API_BASE_URL,
        environment: process.env.NODE_ENV,
        customEnv: currentEnv,
        isDevelopment,
        isProduction,
        envVariable: process.env.REACT_APP_API_URL,
        midtransConfig: getMidtransConfig(),
        availableEnvVars: {
            REACT_APP_API_URL: process.env.REACT_APP_API_URL,
            REACT_APP_ENV: process.env.REACT_APP_ENV,
            NODE_ENV: process.env.NODE_ENV
        }
    });
}

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

// Axios interceptor setup (optional)
export const setupAxiosInterceptors = (axiosInstance) => {
    // Request interceptor
    axiosInstance.interceptors.request.use(
        (config) => {
            // Add auth headers automatically
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Add base URL if not already present
            if (!config.url.startsWith('http')) {
                config.url = getApiUrl(config.url);
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            // Handle auth errors globally
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }

            return Promise.reject(error);
        }
    );
};

export default {
    API_BASE_URL,
    getApiUrl,
    getImageUrl,
    getAuthHeaders,
    getFormHeaders,
    getMidtransConfig,
    checkApiHealth,
    handleApiError,
    setupAxiosInterceptors
};