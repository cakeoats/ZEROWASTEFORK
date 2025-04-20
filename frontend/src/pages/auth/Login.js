import React, { useState, useEffect, useCallback } from 'react';
import { TextInput, Button } from 'flowbite-react';
import { HiUser, HiLockClosed } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import WelcomePopup from '../../components/WelcomePopup';
import { ClipLoader } from 'react-spinners';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    // Gunakan useCallback untuk stabilkan fungsi
    const handlePopupClose = useCallback(() => {
        setIsPopupOpen(false);
        navigate('/');
    }, [navigate]);

    // Effect untuk auto close popup
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
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                username,
                password
            });

            const { user, token } = res.data;

            login(user, token);
            setUserData(user);
            setIsPopupOpen(true);

        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            console.error('Login error:', err);
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