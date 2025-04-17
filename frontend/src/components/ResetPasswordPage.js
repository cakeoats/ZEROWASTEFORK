import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TextInput, Button } from 'flowbite-react';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setError('');
      } else {
        setMessage('');
        setError(data.message || 'Error resetting password');
      }
    } catch (err) {
      setMessage('');
      setError('Server error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <form onSubmit={handleReset} className="bg-white p-10 rounded-lg shadow-lg space-y-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Set Your New Password</h2>

        <TextInput
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <TextInput
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="text-center text-red-600 text-sm">{error}</p>}
        {message && <p className="text-center text-green-600 text-sm">{message}</p>}

        <Button type="submit" color="blue" className="w-full">Reset Password</Button>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
