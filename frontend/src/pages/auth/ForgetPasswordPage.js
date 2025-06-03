import React, { useState } from 'react';
import { TextInput, Button } from 'flowbite-react';
import { HiMail, HiArrowLeft } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../../config/api';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await fetch(getApiUrl('api/auth/forgot-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || 'Password reset link has been sent to your email.');
            } else {
                setError(data.message || 'Failed to send password reset email.');
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-amber-50 flex items-center justify-center">
            <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full border border-amber-200">
                <div className="flex flex-col items-center mb-8">
                    <Link to="/login" className="self-start mb-4 flex items-center text-gray-600 hover:text-blue-800">
                        <HiArrowLeft className="mr-1" />
                        Back to Login
                    </Link>

                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
                        <p className="text-gray-600">Enter your email to receive reset instructions</p>
                    </div>
                </div>

                {message && (
                    <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <TextInput
                        id="email"
                        type="email"
                        placeholder="Your Email"
                        icon={HiMail}
                        iconPosition="left"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="focus:ring-2 focus:ring-amber-500"
                        disabled={loading}
                        required
                    />
                    <Button
                        color="blue"
                        type="submit"
                        className="w-full py-1.5 font-bold"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </span>
                        ) : (
                            'Send Reset Link'
                        )}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                        Need help?{' '}
                        <Link to="/contact" className="text-blue-600 hover:underline font-medium">
                            Contact Support
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;