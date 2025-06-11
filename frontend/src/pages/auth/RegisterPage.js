// frontend/src/pages/auth/RegisterPage.js - FIXED API CALL
import React, { useState } from 'react';
import { TextInput, Button, Alert } from 'flowbite-react';
import { HiUser, HiMail, HiPhone, HiLockClosed, HiInformationCircle, HiHome } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config/api'; // FIXED: Use proper API URL helper

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '', // FIXED: Ensure username is included
    email: '',
    phone: '',
    address: '', // FIXED: Ensure address is included
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false); // FIXED: Add loading state

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // FIXED: Enhanced validation
    if (!formData.username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (!formData.full_name.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    if (!formData.address.trim()) {
      setError('Address is required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('🚀 Attempting registration...');
      console.log('📧 Email:', formData.email);
      console.log('👤 Username:', formData.username);
      console.log('🌐 API URL:', getApiUrl('api/auth/register'));
      console.log('🔗 Expected URL: https://zerowaste-backend-theta.vercel.app/api/auth/register');

      // FIXED: Use getApiUrl helper function
      const registrationData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      };

      console.log('📦 Registration data:', registrationData);

      const res = await axios.post(getApiUrl('api/auth/register'), registrationData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });

      console.log('✅ Registration successful:', res.data);

      // Success! Redirect to email verification page with email query
      navigate(`/verif-email?email=${encodeURIComponent(formData.email)}`);

    } catch (err) {
      console.error('❌ Registration error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method
        }
      });

      let errorMessage = 'Registration failed. Please try again.';

      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;

        switch (status) {
          case 400:
            errorMessage = serverMessage || 'Invalid registration data. Please check your inputs.';
            break;
          case 409:
            errorMessage = serverMessage || 'Username or email already exists.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = serverMessage || `Server error (${status}). Please try again.`;
        }
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-amber-50 flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full border border-amber-200">
        <div className="flex justify-center mb-8">
          <span className="text-3xl font-bold text-gray-600">Register Here!</span>
        </div>

        {error && (
          <Alert color="failure" icon={HiInformationCircle} className="mb-4">
            {error}
          </Alert>
        )}
        {success && (
          <Alert color="success" icon={HiInformationCircle} className="mb-4">
            {success}
          </Alert>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextInput
            id="full_name"
            type="text"
            placeholder="Full Name"
            icon={HiUser}
            required
            onChange={handleChange}
            value={formData.full_name}
            disabled={loading}
          />
          <TextInput
            id="username"
            type="text"
            placeholder="Username"
            icon={HiUser}
            required
            onChange={handleChange}
            value={formData.username}
            disabled={loading}
          />
          <TextInput
            id="email"
            type="email"
            placeholder="Email"
            icon={HiMail}
            required
            onChange={handleChange}
            value={formData.email}
            disabled={loading}
          />
          <TextInput
            id="phone"
            type="tel"
            placeholder="Phone Number"
            icon={HiPhone}
            required
            onChange={handleChange}
            value={formData.phone}
            disabled={loading}
          />
          <TextInput
            id="address"
            type="text"
            placeholder="Address"
            icon={HiHome}
            required
            onChange={handleChange}
            value={formData.address}
            disabled={loading}
          />
          <TextInput
            id="password"
            type="password"
            placeholder="Password"
            icon={HiLockClosed}
            required
            onChange={handleChange}
            value={formData.password}
            disabled={loading}
          />
          <TextInput
            id="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            icon={HiLockClosed}
            required
            onChange={handleChange}
            value={formData.confirmPassword}
            disabled={loading}
          />

          <Button
            type="submit"
            color="gray"
            className="w-full py-1.5 font-bold mt-4"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registering...
              </div>
            ) : (
              'REGISTER'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign In
          </Link>
        </div>

        {/* Debug info - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <div>API: {getApiUrl('api/auth/register')}</div>
            <div>Env: {process.env.NODE_ENV}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;