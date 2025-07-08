import i18n from '../config/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'user_language';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

// Change language
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error changing language:', error);
    throw error;
  }
};

// Get saved language from storage
export const getSavedLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage as SupportedLanguage | null;
  } catch (error) {
    console.error('Error getting saved language:', error);
    return null;
  }
};

// Get device language
export const getDeviceLanguage = (): SupportedLanguage => {
  const deviceLanguage = i18n.language || 'en';
  const supportedLanguages = Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];
  
  return supportedLanguages.includes(deviceLanguage as SupportedLanguage) 
    ? (deviceLanguage as SupportedLanguage)
    : 'en';
};

// Check if language is supported
export const isLanguageSupported = (language: string): language is SupportedLanguage => {
  return Object.keys(SUPPORTED_LANGUAGES).includes(language);
};

// Get language display name
export const getLanguageDisplayName = (language: SupportedLanguage): string => {
  return SUPPORTED_LANGUAGES[language];
};

// Get all available languages
export const getAvailableLanguages = () => {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code: code as SupportedLanguage,
    name,
  }));
};