// frontend/src/config/api.js - FIXED for Production Domain

// FIXED: Detect environment and set correct API URL
const getApiBaseUrl = () => {
    // Check if we're in production by domain
    const currentDomain = window.location.hostname;

    if (currentDomain === 'www.zerowastemarket.web.id' ||
        currentDomain === 'zerowastemarket.web.id') {
        // Production environment
        return 'https://zerowaste-backend-theta.vercel.app';
    } else if (currentDomain.includes('vercel.app')) {
        // Staging/preview environment
        return 'https://zerowaste-backend-theta.vercel.app';
    } else {
        // Development environment
        return process.env.REACT_APP_API_URL || 'https://zerowaste-backend-theta.vercel.app';
    }
};

export const API_BASE_URL = getApiBaseUrl();

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const currentEnv = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';

// FIXED: Enhanced API configuration
export const apiConfig = {
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable credentials for CORS
};

// Helper function to get full API URL
export const getApiUrl = (endpoint = '') => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${API_BASE_URL}/${cleanEndpoint}`;

    if (isDevelopment) {
        console.log('🔗 API Call:', url);
        console.log('🌐 Current domain:', window.location.hostname);
        console.log('🎯 Target API:', API_BASE_URL);
    }

    return url;
};

// FIXED: Enhanced auth headers with error handling
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

// Enhanced API request wrapper with retry and better error handling
export const makeApiRequest = async (url, options = {}) => {
    const maxRetries = 3;
    let lastError;

    // Default fetch options
    const defaultOptions = {
        credentials: 'include', // Include credentials for CORS
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
    };

    // Merge options
    const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🚀 API Request (attempt ${attempt}/${maxRetries}):`, {
                url,
                method: requestOptions.method || 'GET',
                headers: requestOptions.headers,
                domain: window.location.hostname
            });

            const response = await fetch(url, requestOptions);

            // Log response details
            console.log(`📥 API Response:`, {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                let errorData;
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    errorData = await response.json();
                } else {
                    errorData = { message: await response.text() };
                }

                const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;

                console.error(`❌ API Error ${response.status}:`, errorData);

                // Don't retry on auth errors
                if (response.status === 401 || response.status === 403) {
                    throw new Error(errorMessage);
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`✅ API Success:`, data);
            return data;

        } catch (error) {
            console.error(`❌ API Error (attempt ${attempt}):`, {
                message: error.message,
                name: error.name,
                stack: error.stack
            });

            lastError = error;

            // Handle CORS errors specifically
            if (error.message.includes('CORS') ||
                error.message.includes('fetch') ||
                error.name === 'TypeError') {
                console.error('🚫 CORS Error detected:', {
                    currentDomain: window.location.hostname,
                    targetAPI: API_BASE_URL,
                    error: error.message
                });
            }

            // Don't retry on certain errors
            if (error.message.includes('401') ||
                error.message.includes('403') ||
                error.message.includes('CORS')) {
                break;
            }

            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`⏱️ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    throw lastError;
};

// FIXED: API health check with CORS handling
export const checkApiHealth = async () => {
    try {
        console.log('🏥 Checking API health...');
        console.log('🌐 Current domain:', window.location.hostname);
        console.log('🎯 API target:', API_BASE_URL);

        const response = await fetch(getApiUrl('health'), {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            timeout: 10000
        });

        if (!response.ok) {
            console.log('❌ API health check failed:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url
            });
            return false;
        }

        const data = await response.json();
        console.log('✅ API health check passed:', data);

        // Log CORS status
        if (data.cors) {
            console.log('🔐 CORS Status:', data.cors);
        }

        return true;
    } catch (error) {
        console.error('💥 API health check error:', {
            message: error.message,
            name: error.name,
            currentDomain: window.location.hostname,
            targetAPI: API_BASE_URL
        });
        return false;
    }
};

// Enhanced image URL handling
export const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath === null || imagePath === undefined || imagePath === '') {
        return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
    }

    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_BASE_URL}/${cleanPath}`;
};

// Enhanced function for product images
export const getProductImageUrl = (product) => {
    if (!product) {
        return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
    }

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

    return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
};

// Multipart form headers helper
export const getFormHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

// Midtrans Configuration - Always use sandbox
export const MIDTRANS_CONFIG = {
    development: {
        scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
        clientKey: 'SB-Mid-client-FHBq0wtUSyCEStlH',
        isProduction: false,
        environment: 'SANDBOX'
    },
    production: {
        scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
        clientKey: 'SB-Mid-client-FHBq0wtUSyCEStlH',
        isProduction: false,
        environment: 'SANDBOX'
    }
};

export const getMidtransConfig = () => {
    const selectedConfig = MIDTRANS_CONFIG.development;

    console.log('🔧 Midtrans Config:', {
        environment: selectedConfig.environment,
        isProduction: selectedConfig.isProduction,
        clientKeyPrefix: selectedConfig.clientKey.substring(0, 15) + '...'
    });

    return selectedConfig;
};

// Error handler for API requests
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
    console.error('🚨 Handling API Error:', error);

    if (error.response) {
        const message = error.response.data?.message || defaultMessage;
        const status = error.response.status;

        if (status === 404) {
            return { message: 'Resource not found', status, category: 'not_found' };
        } else if (status === 401) {
            return { message: 'Authentication required', status, category: 'auth' };
        } else if (status === 403) {
            return { message: 'Access denied', status, category: 'permission' };
        } else if (status >= 500) {
            return { message: 'Server error. Please try again later.', status, category: 'server' };
        }

        return { message, status, category: 'client' };
    } else if (error.request) {
        return {
            message: 'Network error. Please check your connection.',
            status: 0,
            category: 'network'
        };
    } else {
        return {
            message: error.message || defaultMessage,
            status: -1,
            category: 'unknown'
        };
    }
};

// Auto-run health check on load for debugging
if (isDevelopment || window.location.hostname.includes('zerowastemarket')) {
    setTimeout(() => {
        checkApiHealth();
    }, 1000);
}

// Debug logging
console.log('🔧 API Configuration Loaded:', {
    baseURL: API_BASE_URL,
    currentDomain: window.location.hostname,
    environment: currentEnv,
    isDevelopment,
    isProduction,
    corsEnabled: true
});

// Default export
export default {
    API_BASE_URL,
    getApiUrl,
    getImageUrl,
    getProductImageUrl,
    getAuthHeaders,
    getFormHeaders,
    getMidtransConfig,
    makeApiRequest,
    checkApiHealth,
    handleApiError
};