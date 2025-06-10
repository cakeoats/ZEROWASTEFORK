// frontend/src/pages/auth/RegisterPage.js - FIXED API URL

import React, { useState } from 'react';
import { TextInput, Button, Alert } from 'flowbite-react';
import { HiUser, HiMail, HiPhone, HiLockClosed, HiInformationCircle, HiHome } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// FIXED: Import API configuration
import { getApiUrl } from '../../config/api';

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    if (error) setError('');
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.full_name.trim()) {
      errors.push('Full name is required');
    }

    if (!formData.username.trim()) {
      errors.push('Username is required');
    } else if (formData.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!formData.password) {
      errors.push('Password is required');
    } else if (formData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setIsLoading(true);

    try {
      // FIXED: Use proper API URL from config
      const apiUrl = getApiUrl('api/auth/register');

      console.log('📤 Submitting registration data to:', apiUrl);
      console.log('📦 Data:', {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address
      });

      const res = await axios.post(apiUrl, {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      }, {
        timeout: 30000, // INCREASED: 30 second timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // ADDED: Better error handling
        validateStatus: function (status) {
          return status < 500; // Accept all status codes less than 500
        }
      });

      console.log('✅ Registration response:', res);

      if (res.status === 201 || res.status === 200) {
        console.log('✅ Registration successful');
        setSuccess('Registration successful! Redirecting to email verification...');

        setTimeout(() => {
          navigate(`/verif-email?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else {
        throw new Error(res.data?.message || 'Registration failed');
      }

    } catch (err) {
      console.error('❌ Registration error:', err);

      let errorMessage = 'Registration failed. Please try again.';

      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection or try again later.';
      } else if (err.code === 'ERR_CONNECTION_REFUSED') {
        errorMessage = 'Server is not available. Please try again later.';
      } else if (err.response) {
        // Server responded with error
        if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 400) {
          errorMessage = 'Invalid registration data. Please check your information.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg max-w-md w-full border border-amber-200">
        <div className="flex justify-center mb-8">
          <span className="text-3xl font-bold text-gray-600">Register Here!</span>
        </div>

        {/* ADDED: Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
            <div><strong>Debug Info:</strong></div>
            <div>API URL: {getApiUrl('api/auth/register')}</div>
            <div>Environment: {process.env.NODE_ENV}</div>
            <div>Base URL: {process.env.REACT_APP_API_URL || 'Using default'}</div>
          </div>
        )}

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
            placeholder="Full Name *"
            icon={HiUser}
            required
            onChange={handleChange}
            value={formData.full_name}
            disabled={isLoading}
            className="focus:ring-amber-500"
          />

          <TextInput
            id="username"
            type="text"
            placeholder="Username *"
            icon={HiUser}
            required
            onChange={handleChange}
            value={formData.username}
            disabled={isLoading}
            minLength={3}
            className="focus:ring-amber-500"
          />

          <TextInput
            id="email"
            type="email"
            placeholder="Email Address *"
            icon={HiMail}
            required
            onChange={handleChange}
            value={formData.email}
            disabled={isLoading}
            className="focus:ring-amber-500"
          />

          <TextInput
            id="phone"
            type="tel"
            placeholder="Phone Number (Optional)"
            icon={HiPhone}
            onChange={handleChange}
            value={formData.phone}
            disabled={isLoading}
            className="focus:ring-amber-500"
          />

          <TextInput
            id="address"
            type="text"
            placeholder="Address (Optional)"
            icon={HiHome}
            onChange={handleChange}
            value={formData.address}
            disabled={isLoading}
            className="focus:ring-amber-500"
          />

          <TextInput
            id="password"
            type="password"
            placeholder="Password *"
            icon={HiLockClosed}
            required
            onChange={handleChange}
            value={formData.password}
            disabled={isLoading}
            minLength={6}
            className="focus:ring-amber-500"
          />

          <TextInput
            id="confirmPassword"
            type="password"
            placeholder="Confirm Password *"
            icon={HiLockClosed}
            required
            onChange={handleChange}
            value={formData.confirmPassword}
            disabled={isLoading}
            className="focus:ring-amber-500"
          />

          <Button
            type="submit"
            color="gray"
            className="w-full py-1.5 font-bold mt-6 bg-amber-500 hover:bg-amber-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                REGISTERING...
              </div>
            ) : (
              'REGISTER'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign In
          </Link>
        </div>

        <div className="mt-2 text-center text-xs text-gray-500">
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;