import React, { useState } from 'react';
import { Button, Alert } from 'flowbite-react';
import { HiMail, HiArrowRight, HiCheckCircle, HiInformationCircle } from 'react-icons/hi';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');

  const handleResend = async () => {
    if (!email) return;

    setLoading(true);
    setResendSuccess('');
    setResendError('');

    try {
      const res = await axios.post('https://zerowastemarket-production.up.railway.app/api/auth/resend-verification', {
        email,
      });
      setResendSuccess(res.data.message || 'Verification email resent successfully.');
    } catch (err) {
      setResendError(err.response?.data?.message || 'Failed to resend email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg max-w-md w-full border border-amber-200 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <HiCheckCircle className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
          Verify Your Email
        </h1>

        <p className="text-gray-600 mb-6">
          We've sent a verification link to <span className="font-medium">{email || 'your email address'}</span>.
          Please check your inbox and click the link to verify your account.
        </p>

        {resendError && (
          <Alert color="failure" icon={HiInformationCircle} className="mb-4">
            {resendError}
          </Alert>
        )}

        {resendSuccess && (
          <Alert color="success" icon={HiInformationCircle} className="mb-4">
            {resendSuccess}
          </Alert>
        )}

        <Button
          color="gray"
          className="w-full mb-6 py-1 font-semibold"
          onClick={handleResend}
          disabled={loading}
        >
          <HiMail className="mr-2 h-5 w-5" />
          {loading ? 'Resending...' : 'Resend Verification Email'}
        </Button>

        <div className="text-sm text-gray-500">
          Didn't receive the email? Check your spam folder or{' '}
          <Link to="/contact" className="text-blue-800 hover:underline font-medium">
            contact support
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-amber-100">
          <Link to="/login">
            <Button outline color="gray" className="w-full font-medium">
              Continue to Login
              <HiArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationPage;
