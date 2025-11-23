import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import {
  changeLanguage,
  getCurrentLanguage,
  getAvailableLanguages,
  getLanguageDisplayName,
  type SupportedLanguage
} from '../utils/i18n';

// Custom hook for i18n functionality
export const useI18n = () => {
  const { t, i18n } = useTranslation();

  // Get current language
  const currentLanguage = getCurrentLanguage();

  // Change language handler
  const handleLanguageChange = useCallback(async (language: SupportedLanguage) => {
    try {
      await changeLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, []);

  // Get available languages
  const availableLanguages = getAvailableLanguages();

  // Get display name for current language
  const currentLanguageDisplayName = getLanguageDisplayName(currentLanguage);

  // Check if i18n is ready
  const isReady = i18n.isInitialized;

  return {
    t,
    currentLanguage,
    currentLanguageDisplayName,
    availableLanguages,
    changeLanguage: handleLanguageChange,
    isReady,
  };
};