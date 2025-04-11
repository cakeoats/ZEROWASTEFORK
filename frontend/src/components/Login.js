import React, { useState } from 'react';
import { TextInput, Button } from 'flowbite-react';
import { HiUser, HiLockClosed } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // ⬅️ import context

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth(); // ⬅️ ambil login() dari context

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                username,
                password
            });

            const { user, token, message } = res.data;

            // Simpan ke context
            login(user, token); // ⬅️ simpan user & token ke global state

            alert(message); // bisa diganti toast juga
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
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
                    />

                    <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-blue-600 hover:text-amber-800 transition-colors font-medium"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <Button
                        color="gray"
                        className="w-full py-1.5 mt-6 font-semibold"
                        type="submit"
                    >
                        Login
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
        </div>
    );
}

export default LoginPage;
