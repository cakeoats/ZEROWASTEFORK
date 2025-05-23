import React, { useState } from 'react';
import { TextInput, Button, Alert } from 'flowbite-react';
import { HiUser, HiMail, HiPhone, HiLockClosed, HiInformationCircle, HiHome } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      const res = await axios.post('https://zerowastemarket-production.up.railway.app/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
      });

      // Redirect to email verification page with email query
      navigate(`/verif-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          <TextInput id="full_name" type="text" placeholder="Full Name" icon={HiUser} required onChange={handleChange} value={formData.full_name} />
          <TextInput id="username" type="text" placeholder="Username" icon={HiUser} required onChange={handleChange} value={formData.username} />
          <TextInput id="email" type="email" placeholder="Email" icon={HiMail} required onChange={handleChange} value={formData.email} />
          <TextInput id="phone" type="tel" placeholder="Phone Number" icon={HiPhone} required onChange={handleChange} value={formData.phone} />
          <TextInput id="address" type="text" placeholder="Address" icon={HiHome} required onChange={handleChange} value={formData.address} />
          <TextInput id="password" type="password" placeholder="Password" icon={HiLockClosed} required onChange={handleChange} value={formData.password} />
          <TextInput id="confirmPassword" type="password" placeholder="Confirm Password" icon={HiLockClosed} required onChange={handleChange} value={formData.confirmPassword} />

          <Button type="submit" color="gray" className="w-full py-1.5 font-bold mt-4">
            REGISTER
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
