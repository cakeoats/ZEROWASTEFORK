import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const LanguageContext = createContext();

// Languages supported
export const languages = {
  EN: 'en',
  ID: 'id'
};

export const LanguageProvider = ({ children }) => {
  // Get saved language from localStorage or use default (Indonesian)
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || languages.ID;
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language; // Set HTML lang attribute
  }, [language]);

  // Function to change language
  const changeLanguage = (lang) => {
    if (Object.values(languages).includes(lang)) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => useContext(LanguageContext);