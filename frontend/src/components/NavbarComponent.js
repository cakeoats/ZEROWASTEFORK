// frontend/src/components/NavbarComponent.js - FIXED CART INTEGRATION
import React, { useState } from 'react';
import {
    HiUser,
    HiOutlineLogin,
    HiOutlineLogout,
    HiOutlineHeart,
    HiOutlineShoppingCart,
    HiOutlineExclamationCircle
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslate } from '../utils/languageUtils';
import { API_BASE_URL, isDevelopment } from '../config/api';

function NavbarComponent() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const { user, logout } = useAuth();
    const { cartCount, clearCartOnLogout } = useCart(); // FIXED: Get clearCartOnLogout
    const navigate = useNavigate();
    const { language } = useLanguage();
    const translate = useTranslate(language);

    // Log API configuration for debugging in development
    React.useEffect(() => {
        if (isDevelopment) {
            console.log('🔧 Navbar - API Configuration:', {
                baseURL: API_BASE_URL,
                environment: process.env.NODE_ENV,
                customEnv: process.env.REACT_APP_ENV,
                envVariable: process.env.REACT_APP_API_URL
            });
        }
    }, []);

    // FIXED: Enhanced logout handler with cart clearing
    const handleLogout = () => {
        console.log('🚪 User logging out from navbar...');

        // FIXED: Clear cart first, then auth data
        if (clearCartOnLogout) {
            clearCartOnLogout();
            console.log('🛒 Cart cleared on logout');
        }

        // Clear all auth data
        logout();

        // Close modal
        setShowLogoutModal(false);

        // FIXED: Redirect to landing page
        console.log('🏠 Redirecting to landing page after logout');
        navigate('/');

        // FIXED: Force page reload to ensure all contexts are reset
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    // FIXED: Debug cart count in development
    React.useEffect(() => {
        if (isDevelopment) {
            console.log('🛒 Navbar - Cart count updated:', cartCount, 'for user:', user?.username || 'guest');
        }
    }, [cartCount, user]);

    return (
        <div className="w-full bg-gray-800 font-poppins">
            {/* Custom Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-fadeIn">
                        <div className="text-center">
                            <HiOutlineExclamationCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
                            <h3 className="mb-5 text-lg font-medium text-gray-700">
                                {translate('common.logout')}?
                            </h3>
                            <p className="mb-5 text-sm text-gray-500">
                                {language === 'id'
                                    ? 'Anda akan keluar dari akun dan keranjang akan dikosongkan.'
                                    : 'You will be logged out and your cart will be cleared.'}
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="px-5 py-2 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                                >
                                    {translate('profile.cancel')}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors"
                                >
                                    {translate('common.logout')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto">
                <nav className="flex items-center justify-between py-4 px-4">
                    {/* Brand Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="text-xl font-bold text-white">
                            ZeroWasteMarket
                            {isDevelopment && (
                                <span className="text-xs text-amber-300 ml-2">
                                    DEV ({process.env.REACT_APP_ENV || 'local'})
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                        {/* Language Switcher */}
                        <LanguageSwitcher />

                        {/* Cart Button - FIXED: Show count based on authenticated user */}
                        <Link
                            to="/cart"
                            className="p-2 rounded-full hover:bg-gray-700 transition-colors relative"
                            title={user ? `Cart (${cartCount} items)` : 'Login to view cart'}
                        >
                            <HiOutlineShoppingCart className="h-5 w-5 text-white" />
                            {/* FIXED: Only show count if user is logged in and has items */}
                            {user && cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Wishlist Button - only shown when logged in */}
                        {user && (
                            <Link to="/wishlist" className="p-2 rounded-full hover:bg-gray-700 transition-colors relative">
                                <HiOutlineHeart className="h-5 w-5 text-white" />
                            </Link>
                        )}

                        {/* User Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                            >
                                <HiUser className="h-5 w-5 text-white" />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                    {user ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    navigate('/profile');
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-amber-50 transition-colors text-sm font-medium"
                                            >
                                                {user.username}
                                                {/* FIXED: Show cart info in dropdown */}
                                                {cartCount > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        🛒 {cartCount} {cartCount === 1 ? 'item' : 'items'} in cart
                                                    </div>
                                                )}
                                            </button>
                                            <div className="border-t border-gray-200 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    setShowLogoutModal(true);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-amber-50 transition-colors text-sm font-medium"
                                            >
                                                <HiOutlineLogout className="mr-2" />
                                                {translate('common.logout')}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                navigate('/login');
                                                setIsDropdownOpen(false);
                                            }}
                                            className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-amber-50 transition-colors text-sm font-medium"
                                        >
                                            <HiOutlineLogin className="mr-2" />
                                            {translate('common.login')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
            </div>
        </div>
    );
}

export default NavbarComponent;