import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files (with explicit index paths for better bundler compatibility)
import en from '../locales/en/index';
import de from '../locales/de/index';
import es from '../locales/es/index';

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'user_language';

// Language detection plugin
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // First check if user has saved language preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Only English is supported for now
      const languageToUse = 'en';
      
      callback(languageToUse);
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en'); // Default to English on error
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

// Validate locale imports
if (!en || typeof en !== 'object') {
  console.error('[i18n] EN locale is invalid:', typeof en, en);
}
if (!de || typeof de !== 'object') {
  console.error('[i18n] DE locale is invalid:', typeof de, de);
}
if (!es || typeof es !== 'object') {
  console.error('[i18n] ES locale is invalid:', typeof es, es);
}

// Initialize i18next
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      es: { translation: es },
    },
    fallbackLng: 'en',
    debug: __DEV__,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Avoid suspense for React Native
    },
    returnObjects: true, // Allow returning objects for complex translations
  });

export default i18n;