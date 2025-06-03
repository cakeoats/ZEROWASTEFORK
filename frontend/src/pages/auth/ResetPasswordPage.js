import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TextInput, Button } from 'flowbite-react';
import { getApiUrl } from '../../config/api';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl('api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Password has been reset successfully!');
        setError('');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage('');
        setError(data.message || 'Error resetting password. Please try again.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setMessage('');
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <form onSubmit={handleReset} className="bg-white p-10 rounded-lg shadow-lg space-y-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Set Your New Password</h2>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">
            {message}
            {message.includes('successfully') && (
              <div className="mt-2 text-xs">
                Redirecting to login page in 3 seconds...
              </div>
            )}
          </div>
        )}

        <TextInput
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading || message.includes('successfully')}
          required
        />

        <TextInput
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading || message.includes('successfully')}
          required
        />

        <Button
          type="submit"
          color="blue"
          className="w-full"
          disabled={loading || message.includes('successfully')}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Resetting...
            </span>
          ) : (
            'Reset Password'
          )}
        </Button>

        <div className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline font-medium"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default ResetPasswordPage;