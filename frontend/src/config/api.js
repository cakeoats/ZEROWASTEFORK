// frontend/src/config/api.js
// Centralized API configuration with enhanced image handling

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

// Debug logging
if (isDevelopment) {
    console.log('🔧 API Configuration:', {
        baseURL: API_BASE_URL,
        environment: process.env.NODE_ENV,
        customEnv: currentEnv,
        isDevelopment,
        isProduction,
        envVariable: process.env.REACT_APP_API_URL
    });
}

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
    handleApiError
};