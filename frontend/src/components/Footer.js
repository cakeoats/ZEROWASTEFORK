import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslate } from "../utils/languageUtils";

function Footer() {
    const { language } = useLanguage();
    const translate = useTranslate(language);

    return (
        <footer className="bg-gray-900 text-white pt-12 pb-8">
            <div className="container mx-auto px-4">
                {/* Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* About Us */}
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-white-400">ZeroWasteMarket</h3>
                        <p className="text-gray-400">
                            {translate('footer.about')}
                        </p>
                        <div className="flex space-x-4 mt-4">
                            <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                                <FaFacebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                                <FaTwitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                                <FaInstagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                                <FaLinkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">{translate('footer.quickLinks')}</h4>
                        <ul className="space-y-2">
                            <li><Link to="/" className="text-gray-400 hover:text-amber-400 transition-colors">{translate('footer.home')}</Link></li>
                            <li><Link to="/product-list" className="text-gray-400 hover:text-amber-400 transition-colors">{translate('footer.products')}</Link></li>
                            <li><Link to="/categories" className="text-gray-400 hover:text-amber-400 transition-colors">{translate('footer.categories')}</Link></li>
                            <li><Link to="/about" className="text-gray-400 hover:text-amber-400 transition-colors">{translate('footer.about')}</Link></li>
                            <li><Link to="/contact" className="text-gray-400 hover:text-amber-400 transition-colors">{translate('footer.contact')}</Link></li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">{translate('product.categories')}</h4>
                        <ul className="space-y-2">
                            <li><Link to="/category/fashion" className="text-gray-400 hover:text-amber-400 transition-colors">{translate('nav.fashion')}</Link></li>
                            <li><Link to="/category/electronics" className="text-gray-400 hover:text-amber-400 transition-colors">{translate('nav.electronics')}</Link></li>
                            <li><Link to="/category/vehicles" className="text-gray-400 hover:text-amber-400 transition-colors">{translate('nav.cars')}</Link></li>
                            <li><Link to="/category/gadgets" className="text-gray-400 hover:text-amber-400 transition-colors">Gadget</Link></li>
                            <li><Link to="/category/furniture" className="text-gray-400 hover:text-amber-400 transition-colors">Furniture</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">{translate('footer.contactUs')}</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li className="flex items-start">
                                <svg className="h-5 w-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Jl. Contoh No. 123, Jakarta, Indonesia</span>
                            </li>
                            <li className="flex items-center">
                                <svg className="h-5 w-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>+62 123 4567 890</span>
                            </li>
                            <li className="flex items-center">
                                <svg className="h-5 w-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>info@zerowastemarket.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 pt-6 text-center text-gray-500">
                    <p>&copy; {new Date().getFullYear()} ZeroWasteMarket. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;