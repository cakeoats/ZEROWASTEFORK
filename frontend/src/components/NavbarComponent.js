import React, { useState } from 'react';
import {
    HiUser,
    HiOutlineLogin,
    HiOutlineLogout,
    HiOutlineHeart,
    HiOutlineExclamationCircle
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslate } from '../utils/languageUtils';

function NavbarComponent() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { language } = useLanguage();
    const translate = useTranslate(language);

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate('/login');
    };

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
                        </Link>
                    </div>

                    {/* Nav Links with Font Custom */}
                    <div className="hidden md:flex space-x-6">
                        <a href="#" className="text-gray-300 hover:text-white transition-colors font-bold tracking-wide text-sm uppercase">
                            {translate('nav.luxury')}
                        </a>
                        <a href="#" className="text-gray-300 hover:text-white transition-colors font-bold tracking-wide text-sm uppercase">
                            {translate('nav.fashion')}
                        </a>
                        <a href="#" className="text-gray-300 hover:text-white transition-colors font-bold tracking-wide text-sm uppercase">
                            {translate('nav.electronics')}
                        </a>
                        <a href="#" className="text-gray-300 hover:text-white transition-colors font-bold tracking-wide text-sm uppercase">
                            {translate('nav.property')}
                        </a>
                        <a href="#" className="text-gray-300 hover:text-white transition-colors font-bold tracking-wide text-sm uppercase">
                            {translate('nav.cars')}
                        </a>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                        {/* Language Switcher */}
                        <LanguageSwitcher />

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