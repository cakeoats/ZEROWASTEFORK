import React, { useState } from 'react';
import {
    HiUser,
    HiOutlineLogin,
    HiOutlineLogout,
    HiShoppingCart,
    HiOutlineExclamationCircle
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; 

function NavbarComponent() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
                                Are you sure you want to logout?
                            </h3>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="px-5 py-2 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors"
                                >
                                    Yes, Logout
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


                    {/* Nav Links dengan Font Kustom */}
                    <div className="hidden md:flex space-x-6">
                        <a href="#" className="text-gray-300 hover:text-white transition-colors font-bold tracking-wide text-sm uppercase">
                            Luxury
                        </a>
                        <a href="#" className="text-gray-300 hover:text-white transition-colors font-bold tracking-wide text-sm uppercase">
                            Fashion
                        </a>
                        <a href="#" className="text-gray-300 hover:text-white transition-colors font-bold tracking-wide text-sm uppercase">
                            Electronics
                        </a>
                        <a href="#" className="text-gray-300 hover:text-white transition-colors font-bold tracking-wide text-sm uppercase">
                            Property
                        </a>
                        <a href="#" className="text-gray-300 hover:text-white transition-colors font-bold tracking-wide text-sm uppercase">
                            Cars
                        </a>
                    </div>

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
                                            onClick={() => navigate('/profile')}
                                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-amber-50 transition-colors text-sm font-medium"
                                        >
                                            {user.username}
                                        </button>
                                        <button
                                            onClick={() => navigate('/cart')}
                                            className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-amber-50 transition-colors text-sm font-medium"
                                        >
                                            <HiShoppingCart className="mr-2" />
                                            My Cart
                                        </button>
                                        <div className="border-t border-gray-200 my-1"></div>
                                        <button
                                            onClick={() => setShowLogoutModal(true)}
                                            className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-amber-50 transition-colors text-sm font-medium"
                                        >
                                            <HiOutlineLogout className="mr-2" />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-amber-50 transition-colors text-sm font-medium"
                                    >
                                        <HiOutlineLogin className="mr-2" />
                                        Login
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </nav>
            </div>
        </div>
    );
}

export default NavbarComponent;