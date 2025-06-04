// frontend/src/config/api.js - VERCEL OPTIMIZED

// FIXED: Use production backend URL untuk Vercel
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://zerowaste-backend-theta.vercel.app';

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const currentEnv = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';

// API configuration object
export const apiConfig = {
    baseURL: API_BASE_URL,
    timeout: 45000, // Increased timeout for Vercel cold starts
    headers: {
        'Content-Type': 'application/json',
    },
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

// Enhanced image URL handling for production
export const getImageUrl = (imagePath) => {
    if (isDevelopment) {
        console.log('🔍 Processing image path:', imagePath);
    }

    if (!imagePath || imagePath === null || imagePath === undefined || imagePath === '') {
        if (isDevelopment) {
            console.log('🖼️ No image path provided, using placeholder');
        }
        return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
    }

    if (imagePath.startsWith('http')) {
        if (isDevelopment) {
            console.log('🌐 Using full URL:', imagePath);
        }
        return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullUrl = `${API_BASE_URL}/${cleanPath}`;

    if (isDevelopment) {
        console.log('🔗 Constructed image URL:', fullUrl);
    }

    return fullUrl;
};

// Enhanced function for product images
export const getProductImageUrl = (product) => {
    if (isDevelopment) {
        console.log('🖼️ Getting product image for:', product?.name || 'Unknown product');
    }

    if (!product) {
        if (isDevelopment) {
            console.log('❌ No product provided');
        }
        return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80';
    }

    if (product.imageUrl && product.imageUrl.trim() !== '') {
        if (isDevelopment) {
            console.log('📸 Using product.imageUrl:', product.imageUrl);
        }
        return getImageUrl(product.imageUrl);
    }

    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        if (firstImage && firstImage.trim() !== '') {
            if (isDevelopment) {
                console.log('📸 Using product.images[0]:', firstImage);
            }
            return getImageUrl(firstImage);
        }
    }

    if (product.image && product.image.trim() !== '') {
        if (isDevelopment) {
            console.log('📸 Using product.image:', product.image);
        }
        return getImageUrl(product.image);
    }

    if (isDevelopment) {
        console.log('🖼️ No valid image found for product, using placeholder');
    }
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

// Multipart form headers helper
export const getFormHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? {
        Authorization: `Bearer ${token}`
    } : {};
};

// VERCEL OPTIMIZED: Dynamic Midtrans Configuration with caching and retry
let cachedMidtransConfig = null;
let configFetchPromise = null;

export const getMidtransConfig = async (maxRetries = 3) => {
    console.log('🔧 Fetching Midtrans config from backend...');

    // Return cached config if available and not expired
    if (cachedMidtransConfig) {
        const cacheAge = Date.now() - (cachedMidtransConfig._cached || 0);
        const maxCacheAge = 5 * 60 * 1000; // 5 minutes

        if (cacheAge < maxCacheAge) {
            console.log('📋 Using cached Midtrans config:', {
                environment: cachedMidtransConfig.environment,
                scriptUrl: cachedMidtransConfig.scriptUrl,
                clientKeyPrefix: cachedMidtransConfig.clientKey ? cachedMidtransConfig.clientKey.substring(0, 15) + '...' : 'NOT_SET',
                cacheAge: Math.round(cacheAge / 1000) + 's'
            });
            return cachedMidtransConfig;
        } else {
            console.log('⏰ Cache expired, fetching fresh config...');
            cachedMidtransConfig = null;
        }
    }

    // Prevent multiple simultaneous requests
    if (configFetchPromise) {
        console.log('⏳ Config fetch already in progress, waiting...');
        return configFetchPromise;
    }

    configFetchPromise = fetchMidtransConfigWithRetry(maxRetries);

    try {
        const result = await configFetchPromise;
        return result;
    } finally {
        configFetchPromise = null;
    }
};

const fetchMidtransConfigWithRetry = async (maxRetries) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Fetching Midtrans config (attempt ${attempt}/${maxRetries})...`);

            // VERCEL OPTIMIZED: Longer timeout and specific headers
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(getApiUrl('api/payment/config'), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache',
                    // Help with Vercel cold starts
                    'x-vercel-warmup': 'true'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Config fetch failed');
            }

            const backendConfig = data.config;

            // Build frontend config based on backend response
            const config = {
                clientKey: backendConfig.clientKey,
                isProduction: backendConfig.isProduction,
                environment: backendConfig.environment,
                scriptUrl: backendConfig.isProduction
                    ? 'https://app.midtrans.com/snap/snap.js'
                    : 'https://app.sandbox.midtrans.com/snap/snap.js',
                _cached: Date.now() // Add cache timestamp
            };

            console.log('✅ Midtrans config fetched from backend:', {
                environment: config.environment,
                scriptUrl: config.scriptUrl,
                clientKeyPrefix: config.clientKey ? config.clientKey.substring(0, 15) + '...' : 'NOT_SET',
                isProduction: config.isProduction,
                attempt: attempt
            });

            // Validation
            if (!config.clientKey) {
                throw new Error('Client key not available from backend');
            }

            // Validate key format
            const expectedPrefix = config.isProduction ? 'Mid-client-' : 'SB-Mid-client-';
            if (!config.clientKey.startsWith(expectedPrefix)) {
                console.warn(`⚠️ Unexpected client key format. Expected: ${expectedPrefix}*, Got: ${config.clientKey.substring(0, 15)}...`);
            }

            // Cache the config
            cachedMidtransConfig = config;

            return config;

        } catch (error) {
            lastError = error;
            console.error(`❌ Attempt ${attempt} failed:`, {
                message: error.message,
                name: error.name,
                code: error.code
            });

            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All retries failed, use fallback
    console.error('❌ All attempts failed, using fallback config');
    console.error('Last error:', lastError?.message);

    const fallbackConfig = {
        scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
        clientKey: 'SB-Mid-client-FHBq0wtUSyCEStlH',
        isProduction: false,
        environment: 'SANDBOX (FALLBACK)',
        _cached: Date.now()
    };

    console.log('⚠️ Using fallback Midtrans config:', {
        environment: fallbackConfig.environment,
        scriptUrl: fallbackConfig.scriptUrl,
        clientKeyPrefix: fallbackConfig.clientKey.substring(0, 15) + '...'
    });

    return fallbackConfig;
};

// Clear cached config (useful for testing or when switching environments)
export const clearMidtransConfigCache = () => {
    cachedMidtransConfig = null;
    configFetchPromise = null;
    console.log('🧹 Midtrans config cache cleared');
};

// VERCEL OPTIMIZED: Image validation with faster timeout
export const validateImageUrl = async (url, timeout = 8000, retries = 2) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await new Promise((resolve) => {
                const img = new Image();
                const timer = setTimeout(() => {
                    img.onload = img.onerror = null;
                    if (isDevelopment) {
                        console.log(`⏰ Image validation timeout (attempt ${attempt}):`, url);
                    }
                    resolve(false);
                }, timeout);

                img.onload = () => {
                    clearTimeout(timer);
                    if (isDevelopment) {
                        console.log(`✅ Image validation success (attempt ${attempt}):`, url);
                    }
                    resolve(true);
                };

                img.onerror = () => {
                    clearTimeout(timer);
                    if (isDevelopment) {
                        console.log(`❌ Image validation failed (attempt ${attempt}):`, url);
                    }
                    resolve(false);
                };

                img.src = url;
            });

            if (result) {
                return true;
            }

            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error(`💥 Image validation error (attempt ${attempt}):`, error);
        }
    }

    return false;
};

// API health check with Vercel optimization
export const checkApiHealth = async () => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(getApiUrl('health'), {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'x-vercel-warmup': 'true'
            }
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
};

// Enhanced error handler for Vercel
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
    } else if (error.name === 'AbortError') {
        console.error('Request Timeout:', error.message);
        return {
            message: 'Request timeout. Server may be starting up.',
            status: 408,
            category: 'timeout'
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

// Debug logging
if (isDevelopment) {
    console.log('🔧 API Configuration (Vercel):', {
        baseURL: API_BASE_URL,
        environment: process.env.NODE_ENV,
        customEnv: currentEnv,
        isDevelopment,
        isProduction,
        midtransMode: 'DYNAMIC_FROM_BACKEND',
        timeout: apiConfig.timeout
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
    clearMidtransConfigCache,
    checkApiHealth,
    validateImageUrl,
    handleApiError
};