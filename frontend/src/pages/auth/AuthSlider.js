import React, { useState, useEffect, useCallback } from 'react';
import { TextInput, Button, Alert } from 'flowbite-react';
import { HiUser, HiMail, HiPhone, HiLockClosed, HiInformationCircle, HiHome } from 'react-icons/hi';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import WelcomePopup from '../../components/WelcomePopup';
import { ClipLoader } from 'react-spinners';
import { getApiUrl } from '../../config/api';
import './AuthSlider.css';

function AuthSlider() {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { language } = useLanguage();
    const translate = useTranslate(language);

    // FIXED: Simpler initial state determination
    const [isLoginMode, setIsLoginMode] = useState(() => {
        const path = location.pathname;
        return path === '/login' || path === '/auth';
    });

    // Login state
    const [loginData, setLoginData] = useState({
        username: '',
        password: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [userData, setUserData] = useState(null);

    // Register state
    const [registerData, setRegisterData] = useState({
        full_name: '',
        username: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
    });

    // Shared state
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // For animation
    const [isAnimating, setIsAnimating] = useState(false);

    // Auto close login success popup
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

    // FIXED: Only update mode based on initial route, not on every route change
    useEffect(() => {
        const path = location.pathname;
        const shouldBeLoginMode = path === '/login' || path === '/auth';

        // Only update if it's different from current mode
        if (shouldBeLoginMode !== isLoginMode) {
            console.log('Route changed, updating mode:', { path, shouldBeLoginMode, currentMode: isLoginMode });
            setIsLoginMode(shouldBeLoginMode);
            setError('');
            setSuccess('');
        }
    }, [location.pathname]); // Removed isLoginMode dependency to prevent loop

    // Handle login input changes
    const handleLoginChange = (e) => {
        setLoginData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    // Handle register input changes
    const handleRegisterChange = (e) => {
        setRegisterData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    // Validation function for register form
    const validateRegisterForm = () => {
        const errors = [];

        if (!registerData.full_name.trim()) {
            errors.push('Full name is required');
        }

        if (!registerData.username.trim()) {
            errors.push('Username is required');
        } else if (registerData.username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (!registerData.email.trim()) {
            errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
            errors.push('Please enter a valid email address');
        }

        if (!registerData.password) {
            errors.push('Password is required');
        } else if (registerData.password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        if (registerData.password !== registerData.confirmPassword) {
            errors.push('Passwords do not match');
        }

        return errors;
    };

    // Login form submit
    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const res = await axios.post(getApiUrl('api/auth/login'), {
                username: loginData.username,
                password: loginData.password
            });

            const { user, token } = res.data;

            // Store token and user in localStorage
            const userInfo = { token, user };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Update auth context
            login(user, token);

            setUserData(user);
            setIsPopupOpen(true);
        } catch (err) {
            console.error('Login error:', err);
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
            if (errorMessage.includes('Email not verified')) {
                setError('Email not verified. Please check your email for the verification link.');
            } else if (errorMessage.includes('Invalid username or password')) {
                setError('Invalid username or password. Please check your credentials.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Register form submit
    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSuccess('');

        // Validate form
        const validationErrors = validateRegisterForm();
        if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            return;
        }

        setIsLoading(true);

        try {
            const res = await axios.post(getApiUrl('api/auth/register'), {
                username: registerData.username.trim(),
                email: registerData.email.trim(),
                password: registerData.password,
                full_name: registerData.full_name.trim(),
                phone: registerData.phone.trim(),
                address: registerData.address.trim(),
            });

            // Show success message
            setSuccess('Registration successful! Redirecting to email verification...');

            // Redirect to email verification page with email query
            setTimeout(() => {
                navigate(`/verif-email?email=${encodeURIComponent(registerData.email)}`);
            }, 2000);

        } catch (err) {
            console.error('Registration error:', err);

            let errorMessage = 'Registration failed. Please try again.';

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 400) {
                errorMessage = 'Invalid registration data. Please check your information.';
            } else if (err.response?.status >= 500) {
                errorMessage = 'Server error. Please try again later.';
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // FIXED: Toggle mode and update URL properly
    const toggleMode = () => {
        console.log('Toggle mode clicked, current mode:', isLoginMode);
        setIsAnimating(true);

        const newMode = !isLoginMode;
        const newPath = newMode ? '/login' : '/register';

        console.log('Switching to:', { newMode, newPath });

        // Update URL first
        navigate(newPath, { replace: true });

        // Then update state after a small delay for animation
        setTimeout(() => {
            setIsLoginMode(newMode);
            setError('');
            setSuccess('');
            setIsAnimating(false);
        }, 150);
    };

    // Handle the "Daftar" button click from the right panel
    const handleRightPanelToggle = () => {
        console.log('Right panel toggle clicked');
        toggleMode();
    };

    // FIXED: Clear translation fallback
    const safeTranslate = (key, fallback = key) => {
        try {
            return translate(key) || fallback;
        } catch (e) {
            return fallback;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-4">
            <div className={`w-full max-w-5xl flex bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-500 transform ${isAnimating ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}`}>
                {/* Left Panel - Form */}
                <div className="w-full md:w-1/2 p-8">
                    <div className="flex justify-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-700">
                            {isLoginMode ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
                        </h1>
                    </div>

                    {/* Debug info for development */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                            <div>Current Path: {location.pathname}</div>
                            <div>Mode: {isLoginMode ? 'Login' : 'Register'}</div>
                            <div>API URL: {getApiUrl('api/auth/' + (isLoginMode ? 'login' : 'register'))}</div>
                        </div>
                    )}

                    {error && (
                        <Alert color="failure" icon={HiInformationCircle} className="mb-4 alert-animate">
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert color="success" icon={HiInformationCircle} className="mb-4 alert-animate">
                            {success}
                        </Alert>
                    )}

                    {isLoginMode ? (
                        // Login Form
                        <form onSubmit={handleLogin} className={`space-y-6 ${isAnimating ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}`}>
                            <TextInput
                                id="username"
                                type="text"
                                placeholder="Nama Pengguna"
                                icon={HiUser}
                                required
                                value={loginData.username}
                                onChange={handleLoginChange}
                                disabled={isLoading}
                                className="focus:ring-amber-500"
                            />

                            <TextInput
                                id="password"
                                type="password"
                                placeholder="Kata Sandi"
                                icon={HiLockClosed}
                                required
                                value={loginData.password}
                                onChange={handleLoginChange}
                                disabled={isLoading}
                                className="focus:ring-amber-500"
                            />

                            <div className="flex justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-blue-600 hover:text-amber-800 transition-colors font-medium"
                                >
                                    Lupa Password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-2 mt-6 font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all flex items-center justify-center"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <ClipLoader size={20} color="#ffffff" className="mr-2" />
                                        Masuk...
                                    </>
                                ) : (
                                    'Masuk'
                                )}
                            </Button>
                        </form>
                    ) : (
                        // Register Form
                        <form onSubmit={handleRegister} className={`space-y-4 ${isAnimating ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextInput
                                    id="full_name"
                                    type="text"
                                    placeholder="Nama Lengkap *"
                                    icon={HiUser}
                                    required
                                    onChange={handleRegisterChange}
                                    value={registerData.full_name}
                                    disabled={isLoading}
                                    className="focus:ring-blue-500"
                                />
                                <TextInput
                                    id="username"
                                    type="text"
                                    placeholder="Nama Pengguna *"
                                    icon={HiUser}
                                    required
                                    onChange={handleRegisterChange}
                                    value={registerData.username}
                                    disabled={isLoading}
                                    minLength={3}
                                    className="focus:ring-blue-500"
                                />
                            </div>

                            <TextInput
                                id="email"
                                type="email"
                                placeholder="Email *"
                                icon={HiMail}
                                required
                                onChange={handleRegisterChange}
                                value={registerData.email}
                                disabled={isLoading}
                                className="focus:ring-blue-500"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextInput
                                    id="phone"
                                    type="tel"
                                    placeholder="Nomor Telepon"
                                    icon={HiPhone}
                                    onChange={handleRegisterChange}
                                    value={registerData.phone}
                                    disabled={isLoading}
                                    className="focus:ring-blue-500"
                                />
                                <TextInput
                                    id="address"
                                    type="text"
                                    placeholder="Alamat"
                                    icon={HiHome}
                                    onChange={handleRegisterChange}
                                    value={registerData.address}
                                    disabled={isLoading}
                                    className="focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextInput
                                    id="password"
                                    type="password"
                                    placeholder="Kata Sandi *"
                                    icon={HiLockClosed}
                                    required
                                    onChange={handleRegisterChange}
                                    value={registerData.password}
                                    disabled={isLoading}
                                    minLength={6}
                                    className="focus:ring-blue-500"
                                />
                                <TextInput
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Konfirmasi Kata Sandi *"
                                    icon={HiLockClosed}
                                    required
                                    onChange={handleRegisterChange}
                                    value={registerData.confirmPassword}
                                    disabled={isLoading}
                                    className="focus:ring-blue-500"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-2 font-bold mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <ClipLoader size={20} color="#ffffff" className="mr-2" />
                                        Mendaftar...
                                    </>
                                ) : (
                                    'Daftar'
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-gray-600">
                        {isLoginMode ? 'Belum punya akun?' : 'Sudah punya akun?'}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className={`font-medium ml-1 ${isLoginMode ? 'text-blue-600 hover:text-blue-700' : 'text-amber-600 hover:text-amber-700'}`}
                            disabled={isAnimating}
                        >
                            {isLoginMode ? 'Daftar' : 'Masuk'}
                        </button>
                    </div>
                </div>

                {/* Right Panel - Background Image & Info */}
                <div className={`hidden md:flex md:w-1/2 items-center justify-center transition-all duration-500 ease-in-out ${isLoginMode ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                    <div className="text-center text-white px-8 py-12">
                        <div className="mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                            </svg>
                        </div>

                        <h1 className="text-3xl font-bold mb-4">ZeroWasteMarket</h1>
                        <h2 className="text-2xl font-bold mb-3">
                            {isLoginMode ? 'Belum punya akun?' : 'Sudah punya akun?'}
                        </h2>
                        <p className="mb-8 text-white/80">
                            {isLoginMode
                                ? 'Sign up to join our sustainable community and start reducing waste today!'
                                : 'Login with your personal details to continue your eco-friendly journey with us.'}
                        </p>
                        <button
                            onClick={handleRightPanelToggle}
                            className="px-8 py-3 border-2 border-white rounded-full font-bold text-white hover:bg-white hover:text-gray-800 transition-colors duration-300"
                            disabled={isAnimating}
                        >
                            {isLoginMode ? 'Daftar' : 'Masuk'}
                        </button>
                    </div>
                </div>
            </div>

            <WelcomePopup
                isOpen={isPopupOpen}
                onClose={handlePopupClose}
                username={userData?.full_name || userData?.username || ''}
            />
        </div>
    );
}

export default AuthSlider;