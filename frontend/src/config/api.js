// frontend/src/config/api.js - FIXED API Configuration

// FIXED: Proper API URL handling
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://zerowaste-backend-theta.vercel.app';

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const currentEnv = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';

// FIXED: Enhanced API configuration with timeout and retry
export const apiConfig = {
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false, // Set to false for CORS simplicity
};

// Helper function to get full API URL
export const getApiUrl = (endpoint = '') => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${API_BASE_URL}/${cleanEndpoint}`;

    if (isDevelopment) {
        console.log('🔗 API Call:', url);
    }

    return url;
};

// FIXED: Enhanced image URL handling
export const getImageUrl = (imagePath) => {
    console.log('🔍 Processing image path:', imagePath);

    if (!imagePath || imagePath === null || imagePath === undefined || imagePath === '') {
        console.log('🖼️ No image path provided, using placeholder');
        return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
    }

    if (imagePath.startsWith('http')) {
        console.log('🌐 Using full URL:', imagePath);
        return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullUrl = `${API_BASE_URL}/${cleanPath}`;
    console.log('🔗 Constructed image URL:', fullUrl);

    return fullUrl;
};

// Enhanced function for product images
export const getProductImageUrl = (product) => {
    console.log('🖼️ Getting product image for:', product?.name || 'Unknown product');

    if (!product) {
        console.log('❌ No product provided');
        return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
    }

    if (product.imageUrl && product.imageUrl.trim() !== '') {
        console.log('📸 Using product.imageUrl:', product.imageUrl);
        return getImageUrl(product.imageUrl);
    }

    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        if (firstImage && firstImage.trim() !== '') {
            console.log('📸 Using product.images[0]:', firstImage);
            return getImageUrl(firstImage);
        }
    }

    if (product.image && product.image.trim() !== '') {
        console.log('📸 Using product.image:', product.image);
        return getImageUrl(product.image);
    }

    console.log('🖼️ No valid image found for product, using placeholder');
    return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
};

// FIXED: Auth headers helper with proper token handling
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

// Multipart form headers helper
export const getFormHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData, let browser set it

    return headers;
};

// FIXED: Midtrans Configuration - Always use sandbox for consistency
export const MIDTRANS_CONFIG = {
    development: {
        scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
        clientKey: 'SB-Mid-client-FHBq0wtUSyCEStlH',
        isProduction: false,
        environment: 'SANDBOX'
    },
    production: {
        scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js', // FORCE SANDBOX
        clientKey: 'SB-Mid-client-FHBq0wtUSyCEStlH', // FORCE SANDBOX
        isProduction: false, // FORCE SANDBOX
        environment: 'SANDBOX'
    }
};

// FIXED: Always return SANDBOX configuration
export const getMidtransConfig = () => {
    console.log('🔧 Midtrans Config - FORCING SANDBOX MODE');

    // Always use sandbox configuration for consistency
    const selectedConfig = MIDTRANS_CONFIG.development;

    console.log('🔧 Selected Midtrans Config:', {
        environment: selectedConfig.environment,
        scriptUrl: selectedConfig.scriptUrl,
        clientKeyPrefix: selectedConfig.clientKey ? selectedConfig.clientKey.substring(0, 15) + '...' : 'NOT_SET',
        isProduction: selectedConfig.isProduction,
        hostname: window.location.hostname,
        forced: 'SANDBOX_MODE'
    });

    if (!selectedConfig.clientKey || selectedConfig.clientKey.includes('XXXXXXX')) {
        console.error('❌ Midtrans client key not properly configured!');
    }

    return selectedConfig;
};

// FIXED: Enhanced API request wrapper with retry logic
export const makeApiRequest = async (url, options = {}) => {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🚀 API Request (attempt ${attempt}/${maxRetries}):`, url);

            const requestOptions = {
                ...options,
                headers: {
                    ...getAuthHeaders(),
                    ...options.headers
                }
            };

            const response = await fetch(url, requestOptions);

            // Log response details
            console.log(`📥 API Response:`, {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                const errorData = await response.text();
                let errorMessage;

                try {
                    const errorJson = JSON.parse(errorData);
                    errorMessage = errorJson.message || `HTTP ${response.status}: ${response.statusText}`;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`✅ API Success:`, data);
            return data;

        } catch (error) {
            console.error(`❌ API Error (attempt ${attempt}):`, error);
            lastError = error;

            // Don't retry on certain errors
            if (error.message.includes('401') || error.message.includes('403')) {
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

// Image validation helper
export const validateImageUrl = async (url, timeout = 10000, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await new Promise((resolve) => {
                const img = new Image();
                const timer = setTimeout(() => {
                    img.onload = img.onerror = null;
                    console.log(`⏰ Image validation timeout (attempt ${attempt}):`, url);
                    resolve(false);
                }, timeout);

                img.onload = () => {
                    clearTimeout(timer);
                    console.log(`✅ Image validation success (attempt ${attempt}):`, url);
                    resolve(true);
                };

                img.onerror = () => {
                    clearTimeout(timer);
                    console.log(`❌ Image validation failed (attempt ${attempt}):`, url);
                    resolve(false);
                };

                img.src = url;
            });

            if (result) {
                return true;
            }

            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error(`💥 Image validation error (attempt ${attempt}):`, error);
        }
    }

    return false;
};

// FIXED: API health check with proper error handling
export const checkApiHealth = async () => {
    try {
        console.log('🏥 Checking API health...');
        const response = await fetch(getApiUrl('health'), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (!response.ok) {
            console.log('❌ API health check failed:', response.status);
            return false;
        }

        const data = await response.json();
        console.log('✅ API health check passed:', data);
        return true;
    } catch (error) {
        console.error('💥 API health check error:', error);
        return false;
    }
};

// Error handler for API requests
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
    if (error.response) {
        const message = error.response.data?.message || defaultMessage;
        const status = error.response.status;

        console.error(`API Error ${status}:`, message);

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
        console.error('Network Error:', error.message);
        return {
            message: 'Network error. Please check your connection.',
            status: 0,
            category: 'network'
        };
    } else {
        console.error('Request Error:', error.message);
        return {
            message: error.message || defaultMessage,
            status: -1,
            category: 'unknown'
        };
    }
};

// Test API connectivity on load
if (isDevelopment) {
    checkApiHealth();
}

// Debug logging
if (isDevelopment) {
    console.log('🔧 API Configuration:', {
        baseURL: API_BASE_URL,
        environment: process.env.NODE_ENV,
        customEnv: currentEnv,
        isDevelopment,
        isProduction,
        midtransForced: 'SANDBOX',
        corsMode: 'no-credentials'
    });
}

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
    validateImageUrl,
    handleApiError
};