import React from 'react';
import { Button } from 'flowbite-react';
import { HiCheckCircle, HiHome } from 'react-icons/hi';
import { Link } from 'react-router-dom';

function EmailVerificationSuccess() {
    return (
        <div className="min-h-screen w-full bg-amber-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg max-w-md w-full border border-amber-200 text-center">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-green-100 p-4 rounded-full animate-bounce">
                        <HiCheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                    Email Verified Successfully!
                </h1>

                {/* Message */}
                <p className="text-gray-600 mb-8">
                    Your email has been successfully verified. You can now enjoy all features of ZeroWasteMarket.
                </p>

                {/* Action Buttons */}
                <div className="space-y-4">
                    <Link to="/" className="block">
                        <Button
                            outline
                            color="gray"
                            className="w-full font-medium"
                        >
                            <HiHome className="mr-2 h-5 w-5" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Additional Help */}
                <div className="mt-2 pt-6 border-t border-amber-100 text-sm text-gray-500">
                    Need help?{' '}
                    <Link to="/contact" className="text-blue-600 hover:underline font-medium">
                        Contact our support team
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default EmailVerificationSuccess;