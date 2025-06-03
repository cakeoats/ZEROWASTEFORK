// frontend/src/pages/auth/Login.js - Updated with better error handling

import React, { useState, useEffect, useCallback } from 'react';
import { TextInput, Button } from 'flowbite-react';
import { HiUser, HiLockClosed } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import WelcomePopup from '../../components/WelcomePopup';
import { ClipLoader } from 'react-spinners';
import { getApiUrl } from '../../config/api';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    // Debug API configuration
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Login - API URL:', getApiUrl('api/auth/login'));
            console.log('🔧 Environment:', process.env.NODE_ENV);
        }
    }, []);

    const handlePopupClose = useCallback(() => {
        setIsPopupOpen(false);
        navigate('/');
    }, [navigate]);

    useEffect(() => {
        let timer;
        if (isPopupOpen) {
            timer = setTimeout(() => {
                handlePopupClose();
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [isPopupOpen, handlePopupClose]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            console.log('🚀 Attempting login with:', {
                username,
                apiUrl: getApiUrl('api/auth/login')
            });

            const requestData = {
                username: username.trim(),
                password: password
            };

            console.log('📤 Request data:', requestData);

            const res = await axios.post(getApiUrl('api/auth/login'), requestData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000, // 15 second timeout
                withCredentials: false // Try without credentials first
            });

            console.log('✅ Login response:', res.data);

            const { user, token } = res.data;

            if (!user || !token) {
                throw new Error('Invalid response format from server');
            }

            // Store token and user in localStorage
            const userInfo = { token, user };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            console.log('💾 Stored userInfo in localStorage:', userInfo);

            // Update auth context
            login(user, token);

            setUserData(user);
            setIsPopupOpen(true);
        } catch (err) {
            console.error('❌ Login error:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                url: err.config?.url
            });

            let errorMessage = 'Login failed. Please try again.';

            if (err.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please check your connection and try again.';
            } else if (err.response) {
                const status = err.response.status;
                const serverMessage = err.response.data?.message;

                switch (status) {
                    case 400:
                    case 401:
                        if (serverMessage?.includes('Email not verified')) {
                            errorMessage = 'Email not verified. Please check your email for the verification link.';
                        } else if (serverMessage?.includes('Invalid username or password')) {
                            errorMessage = 'Invalid username or password. Please check your credentials.';
                        } else {
                            errorMessage = serverMessage || 'Invalid credentials. Please try again.';
                        }
                        break;
                    case 404:
                        errorMessage = 'Login service not found. Please contact support.';
                        break;
                    case 500:
                        errorMessage = 'Server error. Please try again later.';
                        break;
                    default:
                        errorMessage = serverMessage || `Server error (${status}). Please try again.`;
                }
            } else if (err.request) {
                errorMessage = 'Cannot connect to server. Please check your internet connection.';
            } else {
                errorMessage = err.message || 'An unexpected error occurred.';
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-amber-50 flex items-center justify-center">
            <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full border border-amber-200">
                <div className="flex justify-center mb-8">
                    <span className="text-3xl font-bold text-gray-500">
                        Welcome Back
                    </span>
                </div>

                {/* Debug info - only show in development */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                        <div>API: {getApiUrl('api/auth/login')}</div>
                        <div>Env: {process.env.NODE_ENV}</div>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <TextInput
                        id="username"
                        type="text"
                        placeholder="Username"
                        icon={HiUser}
                        iconPosition="left"
                        className="focus:ring-2 focus:ring-amber-500"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                    />

                    <TextInput
                        id="password"
                        type="password"
                        placeholder="Password"
                        icon={HiLockClosed}
                        iconPosition="left"
                        className="focus:ring-2 focus:ring-amber-500"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />

                    <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-blue-600 hover:text-amber-800 transition-colors font-medium"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        color="gray"
                        className="w-full py-1.5 mt-6 font-semibold bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <ClipLoader size={20} color="#ffffff" className="mr-2" />
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </Button>

                    <div className="text-center text-sm text-gray-600 mt-4">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>

            <WelcomePopup
                isOpen={isPopupOpen}
                onClose={handlePopupClose}
                username={userData?.full_name || userData?.username || ''}
            />
        </div>
    );
}

export default LoginPage;