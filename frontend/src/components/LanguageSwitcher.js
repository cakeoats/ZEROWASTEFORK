import React, { useState, useRef, useEffect } from 'react';
import { HiTranslate, HiChevronDown } from 'react-icons/hi';
import { useLanguage, languages } from '../contexts/LanguageContext';
import { useTranslate } from '../utils/languageUtils';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const translate = useTranslate(language);

  // Language options with flags
  const languageOptions = [
    { code: languages.ID, name: 'Bahasa Indonesia', flag: 'ID' },
    { code: languages.EN, name: 'English', flag: 'EN' }
  ];

  // Get current language details
  const currentLanguage = languageOptions.find(option => option.code === language) || languageOptions[0];

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle language change
  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <HiTranslate className="h-5 w-5 text-white" />
        <span className="text-white text-sm hidden sm:inline-block">{currentLanguage.flag}</span>
        <HiChevronDown className={`h-4 w-4 text-white transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 language-dropdown">
          <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">
            {translate('common.language')}
          </div>
          {languageOptions.map((option) => (
            <button
              key={option.code}
              onClick={() => handleLanguageChange(option.code)}
              className={`flex items-center w-full text-left px-4 py-2 text-sm transition-colors language-option ${
                language === option.code ? 'active' : ''
              }`}
            >
              <span className="flag-icon">{option.flag}</span>
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;