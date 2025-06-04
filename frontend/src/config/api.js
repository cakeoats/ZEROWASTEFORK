// frontend/src/config/api.js
// Centralized API configuration with enhanced image handling and Midtrans production support

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

// IMPROVED: Enhanced image URL handling with comprehensive error handling
export const getImageUrl = (imagePath) => {
    console.log('🔍 Processing image path:', imagePath);

    // Return high-quality placeholder if no image path
    if (!imagePath || imagePath === null || imagePath === undefined || imagePath === '') {
        console.log('🖼️ No image path provided, using placeholder');
        return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
    }

    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
        console.log('🌐 Using full URL:', imagePath);
        return imagePath;
    }

    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

    // Construct full URL - ensure no double slash
    const fullUrl = `${API_BASE_URL}/${cleanPath}`;
    console.log('🔗 Constructed image URL:', fullUrl);

    return fullUrl;
};

// IMPROVED: Enhanced function for product images with multiple fallbacks and validation
export const getProductImageUrl = (product) => {
    console.log('🖼️ Getting product image for:', product?.name || 'Unknown product');

    // Return placeholder immediately if no product
    if (!product) {
        console.log('❌ No product provided');
        return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
    }

    // Priority: imageUrl -> images[0] -> image -> placeholder
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

    // Return high-quality placeholder
    console.log('🖼️ No valid image found for product, using placeholder');
    return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
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

// UPDATED: Midtrans Configuration dengan production keys
export const MIDTRANS_CONFIG = {
    development: {
        scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
        clientKey: process.env.REACT_APP_MIDTRANS_CLIENT_KEY_SANDBOX || 'SB-Mid-client-FHBq0wtUSyCEStlH',
        isProduction: false,
        environment: 'SANDBOX'
    },
    production: {
        scriptUrl: 'https://app.midtrans.com/snap/snap.js',
        clientKey: process.env.REACT_APP_MIDTRANS_CLIENT_KEY_PRODUCTION || 'Mid-client-axaDAjpfCGFhcFrJ',
        isProduction: true,
        environment: 'PRODUCTION'
    }
};

// ENHANCED: Environment detection dengan multiple checks
export const getMidtransConfig = () => {
    // Collect all environment indicators
    const envChecks = {
        nodeEnv: process.env.NODE_ENV,
        reactAppEnv: process.env.REACT_APP_ENV,
        midtransFlag: process.env.REACT_APP_MIDTRANS_IS_PRODUCTION,
        hostname: window.location.hostname,
        isVercel: window.location.hostname.includes('vercel.app'),
        isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    };

    console.log('🔍 Frontend Environment Detection:', envChecks);

    // Determine production status dengan prioritas:
    // 1. Explicit flag (REACT_APP_MIDTRANS_IS_PRODUCTION)
    // 2. Environment variables
    // 3. Hostname detection
    const isProductionEnv =
        process.env.REACT_APP_MIDTRANS_IS_PRODUCTION === 'true' ||
        (process.env.NODE_ENV === 'production' && !envChecks.isLocalhost) ||
        (process.env.REACT_APP_ENV === 'production') ||
        (window.location.hostname.includes('vercel.app') && !window.location.hostname.includes('preview'));

    const selectedConfig = MIDTRANS_CONFIG[isProductionEnv ? 'production' : 'development'];

    console.log('🔧 Selected Midtrans Config:', {
        environment: selectedConfig.environment,
        scriptUrl: selectedConfig.scriptUrl,
        clientKeyPrefix: selectedConfig.clientKey ? selectedConfig.clientKey.substring(0, 15) + '...' : 'NOT_SET',
        isProduction: selectedConfig.isProduction,
        hostname: window.location.hostname,
        決定理由: isProductionEnv ? 'Production detected' : 'Development detected'
    });

    // Validation
    if (!selectedConfig.clientKey || selectedConfig.clientKey.includes('XXXXXXX')) {
        console.error('❌ Midtrans client key not properly configured!');
        console.error('💡 Check environment variables in Vercel');
    }

    return selectedConfig;
};

// NEW: Function to verify backend configuration
export const verifyBackendConfig = async () => {
    try {
        const response = await fetch(getApiUrl('api/payment/config/verify'));
        const data = await response.json();

        console.log('🔍 Backend Midtrans Configuration:', data);

        // Check if frontend and backend environments match
        const frontendConfig = getMidtransConfig();
        const environmentMatch = frontendConfig.isProduction === (data.configuration?.environment === 'PRODUCTION');

        if (!environmentMatch) {
            console.warn('⚠️ ENVIRONMENT MISMATCH!');
            console.warn('Frontend:', frontendConfig.environment);
            console.warn('Backend:', data.configuration?.environment);
        }

        return {
            ...data,
            environmentMatch,
            frontendEnvironment: frontendConfig.environment,
            backendEnvironment: data.configuration?.environment
        };
    } catch (error) {
        console.error('❌ Failed to verify backend configuration:', error);
        return null;
    }
};

// ENHANCED: Test Midtrans configuration
export const testMidtransSetup = async () => {
    console.log('🧪 Testing Midtrans Setup...');

    const frontendConfig = getMidtransConfig();
    const backendConfig = await verifyBackendConfig();

    const testResults = {
        frontend: {
            environment: frontendConfig.environment,
            hasClientKey: !!frontendConfig.clientKey && !frontendConfig.clientKey.includes('XXXXXXX'),
            scriptUrl: frontendConfig.scriptUrl,
            status: 'unknown'
        },
        backend: {
            environment: backendConfig?.configuration?.environment || 'unknown',
            hasServerKey: backendConfig?.configuration?.hasServerKey || false,
            hasClientKey: backendConfig?.configuration?.hasClientKey || false,
            status: backendConfig?.success ? 'ok' : 'error'
        },
        environmentMatch: backendConfig?.environmentMatch || false
    };

    // Test script loading
    try {
        const script = document.createElement('script');
        script.src = frontendConfig.scriptUrl;
        script.onload = () => {
            testResults.frontend.status = 'ok';
            console.log('✅ Midtrans script loads successfully');
        };
        script.onerror = () => {
            testResults.frontend.status = 'error';
            console.error('❌ Midtrans script failed to load');
        };
    } catch (error) {
        testResults.frontend.status = 'error';
    }

    console.log('🧪 Midtrans Setup Test Results:', testResults);
    return testResults;
};

// IMPROVED: Image validation helper with timeout and retry logic
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

            // Wait before retry
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error(`💥 Image validation error (attempt ${attempt}):`, error);
        }
    }

    return false;
};

// IMPROVED: Preload image with better error handling
export const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            console.log('✅ Image preloaded successfully:', src);
            resolve(img);
        };
        img.onerror = () => {
            console.log('❌ Image preload failed:', src);
            reject(new Error(`Failed to preload image: ${src}`));
        };
        img.src = src;
    });
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

// IMPROVED: Error handler for API requests with better categorization
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
    if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || defaultMessage;
        const status = error.response.status;

        console.error(`API Error ${status}:`, message);

        // Categorize errors for better user experience
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
        // Request was made but no response
        console.error('Network Error:', error.message);
        return {
            message: 'Network error. Please check your connection.',
            status: 0,
            category: 'network'
        };
    } else {
        // Something else happened
        console.error('Request Error:', error.message);
        return {
            message: error.message || defaultMessage,
            status: -1,
            category: 'unknown'
        };
    }
};

// Production monitoring helpers
export const logProductionPayment = (result, environment) => {
    if (environment === 'PRODUCTION' || process.env.REACT_APP_MIDTRANS_IS_PRODUCTION === 'true') {
        console.log('🎉 PRODUCTION PAYMENT SUCCESS:', {
            orderId: result.order_id,
            status: result.transaction_status,
            amount: result.gross_amount,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            environment: environment
        });

        // Optional: Send to analytics service
        if (window.gtag) {
            window.gtag('event', 'production_payment_success', {
                order_id: result.order_id,
                transaction_status: result.transaction_status,
                value: result.gross_amount
            });
        }
    }
};

export const logProductionError = (error, context) => {
    if (process.env.REACT_APP_MIDTRANS_IS_PRODUCTION === 'true') {
        console.error('🚨 PRODUCTION PAYMENT ERROR:', {
            error: error.message,
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        });

        // Optional: Send to error tracking service
        // if (window.Sentry) {
        //     window.Sentry.captureException(error, {
        //         tags: { 
        //             environment: 'production',
        //             component: 'midtrans-payment'
        //         },
        //         extra: context
        //     });
        // }
    }
};

// Debug logging
if (isDevelopment) {
    console.log('🔧 API Configuration:', {
        baseURL: API_BASE_URL,
        environment: process.env.NODE_ENV,
        customEnv: currentEnv,
        isDevelopment,
        isProduction,
        envVariable: process.env.REACT_APP_API_URL,
        midtransEnv: process.env.REACT_APP_MIDTRANS_IS_PRODUCTION
    });
}

// Default export for backward compatibility
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
    preloadImage,
    handleApiError,
    verifyBackendConfig,
    testMidtransSetup,
    logProductionPayment,
    logProductionError
};