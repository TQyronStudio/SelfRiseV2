import { TranslationKeys } from '../../types/i18n';

const de: TranslationKeys = {
  // Navigation
  tabs: {
    home: 'Start',
    habits: 'Gewohnheiten',
    gratitude: 'Meine Dankbarkeit',
    goals: 'Ziele',
    settings: 'Einstellungen',
  },
  
  // Home screen
  home: {
    title: 'Willkommen zurück!',
    gratitudeStreak: 'Dankbarkeits-Serie',
    habitStatistics: 'Gewohnheiten-Statistik',
    weeklyProgress: 'Wöchentlicher Fortschritt',
    monthlyProgress: 'Monatlicher Fortschritt',
    dayDetail: 'Tagesdetail',
  },
  
  // Habits screen
  habits: {
    title: 'Meine Gewohnheiten',
    addHabit: 'Gewohnheit hinzufügen',
    editHabit: 'Gewohnheit bearbeiten',
    deleteHabit: 'Gewohnheit löschen',
    habitName: 'Gewohnheitsname',
    habitNamePlaceholder: 'Gewohnheitsname eingeben...',
    selectColor: 'Farbe wählen',
    selectIcon: 'Symbol wählen',
    scheduledDays: 'Geplante Tage',
    markCompleted: 'Als erledigt markieren',
    viewCalendar: 'Kalender anzeigen',
    confirmDelete: 'Löschen bestätigen',
    deleteMessage: 'Sind Sie sicher, dass Sie diese Gewohnheit löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    save: 'Speichern',
  },
  
  // Gratitude screen
  gratitude: {
    title: 'Meine Dankbarkeit',
    addGratitude: 'Dankbarkeit hinzufügen',
    gratitudePlaceholder: 'Wofür sind Sie heute dankbar?',
    minimumRequired: 'Schreiben Sie mindestens 3 Dankbarkeiten, um Ihre Serie aufrechtzuerhalten',
    bonusGratitude: 'Bonus-Dankbarkeit',
    currentStreak: 'Aktuelle Serie',
    longestStreak: 'Längste Serie',
    history: 'Geschichte',
    celebration: {
      title: 'Gratulation! 🎉',
      message: 'Sie haben Ihre tägliche Dankbarkeitspraxis abgeschlossen!',
      bonusPrompt: 'Möchten Sie eine Bonus-Dankbarkeit hinzufügen?',
      continue: 'Weiter',
    },
    milestone: {
      title: 'Fantastische Leistung! 🏆',
      message: 'Sie haben eine {{days}}-Tage-Serie erreicht!',
    },
    streakLost: {
      title: 'Serie unterbrochen',
      message: 'Ihre Dankbarkeits-Serie wurde unterbrochen. Was möchten Sie tun?',
      reset: 'Serie zurücksetzen',
      recover: 'Mit Werbung wiederherstellen',
    },
  },
  
  // Goals screen
  goals: {
    title: 'Meine Ziele',
    addGoal: 'Ziel hinzufügen',
    editGoal: 'Ziel bearbeiten',
    deleteGoal: 'Ziel löschen',
    goalTitle: 'Zieltitel',
    goalTitlePlaceholder: 'Ihr Ziel eingeben...',
    unit: 'Einheit',
    unitPlaceholder: 'z.B. €, kg, Stunden...',
    targetValue: 'Zielwert',
    addProgress: 'Fortschritt hinzufügen',
    progressValue: 'Fortschrittswert',
    progressNote: 'Notiz',
    progressNotePlaceholder: 'Notiz zu Ihrem Fortschritt hinzufügen...',
    completed: 'Abgeschlossen',
    progress: 'Fortschritt',
    confirmDelete: 'Löschen bestätigen',
    deleteMessage: 'Sind Sie sicher, dass Sie dieses Ziel löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    save: 'Speichern',
  },
  
  // Settings screen
  settings: {
    title: 'Einstellungen',
    language: 'Sprache',
    notifications: 'Benachrichtigungen',
    morningNotification: 'Morgen-Benachrichtigung',
    eveningNotification: 'Abend-Benachrichtigung',
    account: 'Konto',
    login: 'Anmelden',
    register: 'Registrieren',
    logout: 'Abmelden',
    about: 'Über',
    version: 'Version',
    privacyPolicy: 'Datenschutzrichtlinie',
    termsOfService: 'Nutzungsbedingungen',
  },
  
  // Auth screens
  auth: {
    login: {
      title: 'Willkommen zurück',
      email: 'E-Mail',
      emailPlaceholder: 'E-Mail eingeben...',
      password: 'Passwort',
      passwordPlaceholder: 'Passwort eingeben...',
      loginButton: 'Anmelden',
      forgotPassword: 'Passwort vergessen?',
      noAccount: 'Haben Sie kein Konto?',
      signUp: 'Registrieren',
    },
    register: {
      title: 'Konto erstellen',
      displayName: 'Anzeigename',
      displayNamePlaceholder: 'Ihren Namen eingeben...',
      email: 'E-Mail',
      emailPlaceholder: 'E-Mail eingeben...',
      password: 'Passwort',
      passwordPlaceholder: 'Passwort eingeben...',
      confirmPassword: 'Passwort bestätigen',
      confirmPasswordPlaceholder: 'Passwort bestätigen...',
      registerButton: 'Registrieren',
      hasAccount: 'Haben Sie bereits ein Konto?',
      signIn: 'Anmelden',
    },
  },
  
  // Common
  common: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    confirm: 'Bestätigen',
    loading: 'Wird geladen...',
    error: 'Fehler',
    success: 'Erfolg',
    retry: 'Wiederholen',
    done: 'Fertig',
    back: 'Zurück',
    next: 'Weiter',
    skip: 'Überspringen',
    close: 'Schließen',
    yes: 'Ja',
    no: 'Nein',
  },
  
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
  },
  
  // Notifications
  notifications: {
    morning: {
      variant1: 'Guten Morgen! Starten Sie Ihren Tag mit Dankbarkeit 🌅',
      variant2: 'Aufstehen und strahlen! Wofür sind Sie heute dankbar? ✨',
      variant3: 'Ein neuer Tag, eine neue Chance zu wachsen! 🌱',
      variant4: 'Morgendliche Motivation: Überprüfen Sie Ihre Gewohnheiten und setzen Sie Ihre Absicht! 💪',
    },
    evening: {
      variant1: 'Abendliche Reflexion: Wie sind Ihre Gewohnheiten heute gelaufen? 🌙',
      variant2: 'Beenden Sie Ihren Tag mit Dankbarkeit. Was ist gut gelaufen? 🙏',
      variant3: 'Zeit, Ihren Fortschritt zu überprüfen und morgen zu planen! 📝',
      variant4: 'Gute Nacht! Vergessen Sie nicht, Ihre tägliche Dankbarkeit zu vervollständigen! 🌟',
    },
  },
};

export default de;