import i18n from '../config/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationScheduler } from '../services/notifications/notificationScheduler';

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

    // Reschedule all notifications with new language
    try {
      await notificationScheduler.rescheduleAll();
      console.log('[i18n] Notifications rescheduled for language:', language);
    } catch (error) {
      console.warn('[i18n] Failed to reschedule notifications on language change:', error);
      // Don't throw - language change should succeed even if notification rescheduling fails
    }
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

/**
 * Translate a stored text that may be a RAW i18n key instead of a final string.
 *
 * WHY (July 2026 log finding): monthly challenges generated before i18next
 * finished its async init were persisted with the KEY as their title/
 * description (e.g. 'help.challenges.templates.habits_consistency_master.title').
 * This helper heals such data at render time. The root cause is also fixed
 * (generation now awaits i18n readiness), but challenges persisted during the
 * broken window — and any future race — display correctly through this.
 *
 * Single shared implementation — do NOT copy it into components.
 */
export const translateIfKey = (text: string): string => {
  if (!text) return text;

  // Strip hardcoded "First Month: " or "Warm-Up: " prefix (including emoji
  // variations) — legacy challenges created before i18n implementation
  const cleanedText = text.replace(/^(🌱\s*)?(First Month|Warm-Up):\s*/i, '');

  // Check if text contains i18n key patterns
  if (cleanedText.includes('challenges.templates.') || cleanedText.includes('help.challenges.templates.')) {
    const keyMatch = cleanedText.match(/(.*?)(help\.challenges\.templates\.[a-z_]+\.(?:title|description|requirement|bonus\d+)|challenges\.templates\.[a-z_]+\.(?:title|description|requirement|bonus\d+))/);

    if (keyMatch && keyMatch[2]) {
      const prefix = keyMatch[1] || '';
      let key = keyMatch[2];

      // Fix old key format to new format
      if (key.startsWith('challenges.templates.')) {
        key = key.replace('challenges.templates.', 'help.challenges.templates.');
      }

      const translated = i18n.t(key);
      // If translation succeeded, return prefix + translated text
      if (translated !== key) {
        return prefix + translated;
      }
    }
  }

  return cleanedText;
};

// Get all available languages
export const getAvailableLanguages = () => {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code: code as SupportedLanguage,
    name,
  }));
};