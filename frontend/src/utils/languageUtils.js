import enTranslations from '../translations/en.json';
import idTranslations from '../translations/id.json';
import { languages } from '../contexts/LanguageContext';

// All translations
const translations = {
  [languages.EN]: enTranslations,
  [languages.ID]: idTranslations
};

/**
 * Get translated text based on current language and key path
 * @param {string} language - Current language code ('en' or 'id')
 * @param {string} key - Dot notation path to translation key (e.g., 'home.hero.title')
 * @param {object} params - Optional parameters to replace in translation string
 * @returns {string} - Translated text or key if translation not found
 */
export const getTranslation = (language, key, params = {}) => {
  // Default to Indonesian if language not supported
  const languageToUse = Object.values(languages).includes(language) ? language : languages.ID;
  
  // Split the key by dots to navigate through the translations object
  const keys = key.split('.');
  
  // Start with the language's translation object
  let result = translations[languageToUse];
  
  // Navigate through the keys
  for (const k of keys) {
    if (result && result[k] !== undefined) {
      result = result[k];
    } else {
      // Return the key if translation not found
      return key;
    }
  }
  
  // If the result is not a string, return the key
  if (typeof result !== 'string') {
    return key;
  }
  
  // Replace any parameters in the translation string
  let translatedText = result;
  Object.keys(params).forEach(param => {
    translatedText = translatedText.replace(`{${param}}`, params[param]);
  });
  
  return translatedText;
};

/**
 * A hook to get translated text
 * @param {string} language - Current language code
 * @returns {Function} - Function to get translated text
 */
export const useTranslate = (language) => {
  return (key, params = {}) => getTranslation(language, key, params);
};