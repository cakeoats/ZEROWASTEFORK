import React, { useState, useEffect, useCallback } from 'react';
import { TextInput, Button, Alert } from 'flowbite-react';
import { HiUser, HiMail, HiPhone, HiLockClosed, HiInformationCircle, HiHome } from 'react-icons/hi';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import WelcomePopup from '../../components/WelcomePopup';
import { ClipLoader } from 'react-spinners';
import './AuthSlider.css'; // Make sure this import is correct

function AuthSlider() {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    // Determine initial form mode based on the route
    const [isLoginMode, setIsLoginMode] = useState(location.pathname === '/login');

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

    // Update URL when mode changes
    useEffect(() => {
        const newPath = isLoginMode ? '/login' : '/register';
        if (location.pathname !== newPath) {
            navigate(newPath, { replace: true });
        }
    }, [isLoginMode, location, navigate]);

    // Handle login input changes
    const handleLoginChange = (e) => {
        setLoginData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    // Handle register input changes
    const handleRegisterChange = (e) => {
        setRegisterData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    // Login form submit
    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                username: loginData.username,
                password: loginData.password
            });

            const { user, token } = res.data;

            // Store token and user in localStorage
            const userInfo = { token, user };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            console.log('Stored userInfo in localStorage:', userInfo);

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

        if (registerData.password !== registerData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setIsLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', {
                username: registerData.username,
                email: registerData.email,
                password: registerData.password,
                full_name: registerData.full_name,
                phone: registerData.phone,
                address: registerData.address,
            });

            // Redirect to email verification page with email query
            navigate(`/verif-email?email=${encodeURIComponent(registerData.email)}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle between login and register forms with animation
    const toggleMode = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsLoginMode(!isLoginMode);
            setError('');
            setSuccess('');
            setIsAnimating(false);
        }, 300);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-4">
            <div className={`w-full max-w-5xl flex bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-500 transform ${isAnimating ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}`}>
                {/* Left Panel - Form */}
                <div className="w-full md:w-1/2 p-8">
                    <div className="flex justify-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-700">
                            {isLoginMode ? 'Welcome Back' : 'Create Account'}
                        </h1>
                    </div>

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
                                placeholder="Username"
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
                                placeholder="Password"
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
                                    Forgot password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                color="amber"
                                className="w-full py-2 mt-6 font-semibold transition-all flex items-center justify-center hover:bg-amber-600"
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
                        </form>
                    ) : (
                        // Register Form
                        <form onSubmit={handleRegister} className={`space-y-4 ${isAnimating ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextInput id="full_name" type="text" placeholder="Full Name" icon={HiUser} required onChange={handleRegisterChange} value={registerData.full_name} disabled={isLoading} className="focus:ring-blue-500" />
                                <TextInput id="username" type="text" placeholder="Username" icon={HiUser} required onChange={handleRegisterChange} value={registerData.username} disabled={isLoading} className="focus:ring-blue-500" />
                            </div>

                            <TextInput id="email" type="email" placeholder="Email" icon={HiMail} required onChange={handleRegisterChange} value={registerData.email} disabled={isLoading} className="focus:ring-blue-500" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextInput id="phone" type="tel" placeholder="Phone Number" icon={HiPhone} required onChange={handleRegisterChange} value={registerData.phone} disabled={isLoading} className="focus:ring-blue-500" />
                                <TextInput id="address" type="text" placeholder="Address" icon={HiHome} required onChange={handleRegisterChange} value={registerData.address} disabled={isLoading} className="focus:ring-blue-500" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextInput id="password" type="password" placeholder="Password" icon={HiLockClosed} required onChange={handleRegisterChange} value={registerData.password} disabled={isLoading} className="focus:ring-blue-500" />
                                <TextInput id="confirmPassword" type="password" placeholder="Confirm Password" icon={HiLockClosed} required onChange={handleRegisterChange} value={registerData.confirmPassword} disabled={isLoading} className="focus:ring-blue-500" />
                            </div>

                            <Button
                                type="submit"
                                color="blue"
                                className="w-full py-2 font-bold mt-4 hover:bg-blue-700"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <ClipLoader size={20} color="#ffffff" className="mr-2" />
                                        Registering...
                                    </>
                                ) : (
                                    'REGISTER'
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-gray-600">
                        {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className={`font-medium ml-1 ${isLoginMode ? 'text-blue-600 hover:text-blue-700' : 'text-amber-600 hover:text-amber-700'}`}
                        >
                            {isLoginMode ? 'Sign Up' : 'Sign In'}
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
                            {isLoginMode ? 'New here?' : 'Welcome back!'}
                        </h2>
                        <p className="mb-8 text-white/80">
                            {isLoginMode
                                ? 'Sign up to join our sustainable community and start reducing waste today!'
                                : 'Login with your personal details to continue your eco-friendly journey with us.'}
                        </p>
                        <button
                            onClick={toggleMode}
                            className="px-8 py-3 border-2 border-white rounded-full font-bold text-white hover:bg-white hover:text-amber-600 transition-colors duration-300"
                            disabled={isAnimating}
                        >
                            {isLoginMode ? 'SIGN UP' : 'SIGN IN'}
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