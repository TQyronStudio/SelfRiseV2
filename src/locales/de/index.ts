import { TranslationKeys } from '../../types/i18n';

/**
 * German (Deutsch) Translations
 *
 * Status: Work in Progress
 * Coverage: Partial - many keys will fall back to English
 *
 * Translation Strategy:
 * - Keys with [EN] prefix are not yet translated (fallback to English)
 * - Keys without prefix are fully translated
 * - Gradually translate based on priority (see i18n-migration-tracker.md)
 */

const de: Partial<TranslationKeys> = {
  // Navigation
  tabs: {
    home: 'Startseite',
    habits: 'Gewohnheiten',
    journal: 'Mein Tagebuch',
    goals: 'Ziele',
    achievements: 'Erfolge',
    settings: 'Einstellungen',
  },

  // Settings screen - Language section (PRIORITY 1)
  settings: {
    title: 'Einstellungen',

    // Appearance
    appearance: 'Erscheinungsbild',
    theme: 'Theme',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystem: 'System Auto',
    themeDescription: 'Wählen Sie Ihr bevorzugtes Farbschema',
    themeSystemDescription: 'Entspricht Ihren Geräteeinstellungen',

    // Language
    language: 'Sprache',
    languageDescription: 'Wählen Sie Ihre bevorzugte Sprache',
    languageEnglish: 'English',
    languageGerman: 'Deutsch',
    languageSpanish: 'Español',

    // Notifications
    notifications: 'Benachrichtigungen',
    morningNotification: 'Morgenbenachrichtigung',
    eveningNotification: 'Abendbenachrichtigung',

    // Account
    account: 'Konto',
    login: 'Anmelden',
    register: 'Registrieren',
    logout: 'Abmelden',

    // About
    about: 'Über',
    version: 'Version',
    privacyPolicy: 'Datenschutzrichtlinie',
    termsOfService: 'Nutzungsbedingungen',

    // Tutorial
    tutorialReset: 'Tutorial neustarten',
    tutorialResetDescription: 'Tutorial von vorne beginnen',
    tutorialResetConfirmTitle: 'Tutorial neustarten?',
    tutorialResetConfirmMessage: 'Dies startet das Tutorial von Anfang an neu. Diese Aktion kann nicht rückgängig gemacht werden.',
    tutorialResetSuccess: 'Tutorial wurde erfolgreich neu gestartet!',

    // Common
    cancel: 'Abbrechen',
    reset: 'Neustarten',
  } as any,

  // Common
  common: {
    save: 'Speichern',
    saving: 'Speichern...',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    create: 'Erstellen',
    update: 'Aktualisieren',
    confirm: 'Bestätigen',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    retry: 'Wiederholen',
    ok: 'OK',
    done: 'Fertig',
    back: 'Zurück',
    next: 'Weiter',
    skip: 'Überspringen',
    close: 'Schließen',
    continue: 'Fortfahren',
    yes: 'Ja',
    no: 'Nein',
  } as any,

  // Days of week
  days: {
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
    short: {
      monday: 'Mo',
      tuesday: 'Di',
      wednesday: 'Mi',
      thursday: 'Do',
      friday: 'Fr',
      saturday: 'Sa',
      sunday: 'So',
    },
  } as any,

  // TODO: Add remaining translations progressively
  // For now, missing keys will fall back to English
};

export default de;
