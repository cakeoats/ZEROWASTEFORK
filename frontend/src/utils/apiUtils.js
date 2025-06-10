// frontend/src/utils/apiUtils.js - Utility functions for authenticated API requests
import axios from 'axios';
import { getApiUrl } from '../config/api';

// Create an axios instance with default configuration
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'https://zerowaste-backend-theta.vercel.app',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔐 Adding auth token to request:', {
                url: config.url,
                method: config.method?.toUpperCase(),
                hasToken: true,
                tokenPrefix: token.substring(0, 20) + '...'
            });
        } else {
            console.warn('⚠️ No token found for authenticated request:', {
                url: config.url,
                method: config.method?.toUpperCase()
            });
        }

        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            console.error('❌ Authentication failed - clearing stored auth data');

            // Clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userInfo');

            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/auth')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Utility functions for different types of requests

export const apiGet = async (endpoint) => {
    try {
        console.log('📤 GET request:', getApiUrl(endpoint));
        const response = await apiClient.get(`/${endpoint}`);
        return response.data;
    } catch (error) {
        console.error(`❌ GET ${endpoint} failed:`, error.response?.data || error.message);
        throw error;
    }
};

export const apiPost = async (endpoint, data = {}) => {
    try {
        console.log('📤 POST request:', getApiUrl(endpoint), 'Data:', data);
        const response = await apiClient.post(`/${endpoint}`, data);
        return response.data;
    } catch (error) {
        console.error(`❌ POST ${endpoint} failed:`, error.response?.data || error.message);
        throw error;
    }
};

export const apiPut = async (endpoint, data = {}) => {
    try {
        console.log('📤 PUT request:', getApiUrl(endpoint), 'Data:', data);
        const response = await apiClient.put(`/${endpoint}`, data);
        return response.data;
    } catch (error) {
        console.error(`❌ PUT ${endpoint} failed:`, error.response?.data || error.message);
        throw error;
    }
};

export const apiDelete = async (endpoint) => {
    try {
        console.log('📤 DELETE request:', getApiUrl(endpoint));
        const response = await apiClient.delete(`/${endpoint}`);
        return response.data;
    } catch (error) {
        console.error(`❌ DELETE ${endpoint} failed:`, error.response?.data || error.message);
        throw error;
    }
};

// Specific functions for common endpoints

export const wishlistApi = {
    getAll: () => apiGet('api/wishlist'),
    add: (productId) => apiPost('api/wishlist', { productId }),
    remove: (productId) => apiDelete(`api/wishlist/${productId}`),
    check: (productId) => apiGet(`api/wishlist/check/${productId}`)
};

export const cartApi = {
    get: () => apiGet('api/cart'),
    add: (productId, quantity = 1) => apiPost('api/cart/add', { productId, quantity }),
    update: (productId, quantity) => apiPut('api/cart/update', { productId, quantity }),
    remove: (productId) => apiDelete(`api/cart/remove/${productId}`),
    clear: () => apiDelete('api/cart/clear')
};

export const userApi = {
    getProfile: () => apiGet('api/users/profile'),
    updateProfile: (data) => apiPut('api/users/profile', data),
    changePassword: (data) => apiPost('api/users/change-password', data),
    getProducts: () => apiGet('api/users/products')
};

export const orderApi = {
    getHistory: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`api/orders${queryString ? '?' + queryString : ''}`);
    },
    getDetails: (orderId) => apiGet(`api/orders/${orderId}`),
    getStats: () => apiGet('api/orders/stats'),
    cancel: (orderId, reason) => apiPut(`api/orders/${orderId}/cancel`, { reason })
};

// Debug function to check current auth state
export const debugAuth = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userInfo = localStorage.getItem('userInfo');

    console.log('🔍 Auth Debug Info:', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 20) + '...',
        hasUser: !!user,
        hasUserInfo: !!userInfo,
        currentUrl: window.location.href
    });

    return {
        token,
        user: user ? JSON.parse(user) : null,
        userInfo: userInfo ? JSON.parse(userInfo) : null
    };
};

export default apiClient;