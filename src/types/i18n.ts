// TypeScript definitions for i18n
export interface TranslationKeys {
  // Navigation
  tabs: {
    home: string;
    habits: string;
    gratitude: string;
    goals: string;
    settings: string;
  };
  
  // Home screen
  home: {
    title: string;
    gratitudeStreak: string;
    habitStatistics: string;
    weeklyProgress: string;
    monthlyProgress: string;
    dayDetail: string;
  };
  
  // Habits screen
  habits: {
    title: string;
    addHabit: string;
    editHabit: string;
    deleteHabit: string;
    habitName: string;
    habitNamePlaceholder: string;
    selectColor: string;
    selectIcon: string;
    scheduledDays: string;
    markCompleted: string;
    viewCalendar: string;
    confirmDelete: string;
    deleteMessage: string;
    cancel: string;
    delete: string;
    save: string;
  };
  
  // Gratitude screen
  gratitude: {
    title: string;
    addGratitude: string;
    gratitudePlaceholder: string;
    minimumRequired: string;
    bonusGratitude: string;
    currentStreak: string;
    longestStreak: string;
    history: string;
    celebration: {
      title: string;
      message: string;
      bonusPrompt: string;
      continue: string;
    };
    milestone: {
      title: string;
      message: string;
    };
    streakLost: {
      title: string;
      message: string;
      reset: string;
      recover: string;
    };
  };
  
  // Goals screen
  goals: {
    title: string;
    addGoal: string;
    editGoal: string;
    deleteGoal: string;
    goalTitle: string;
    goalTitlePlaceholder: string;
    unit: string;
    unitPlaceholder: string;
    targetValue: string;
    addProgress: string;
    progressValue: string;
    progressNote: string;
    progressNotePlaceholder: string;
    completed: string;
    progress: string;
    confirmDelete: string;
    deleteMessage: string;
    cancel: string;
    delete: string;
    save: string;
  };
  
  // Settings screen
  settings: {
    title: string;
    language: string;
    notifications: string;
    morningNotification: string;
    eveningNotification: string;
    account: string;
    login: string;
    register: string;
    logout: string;
    about: string;
    version: string;
    privacyPolicy: string;
    termsOfService: string;
  };
  
  // Auth screens
  auth: {
    login: {
      title: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      loginButton: string;
      forgotPassword: string;
      noAccount: string;
      signUp: string;
    };
    register: {
      title: string;
      displayName: string;
      displayNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      registerButton: string;
      hasAccount: string;
      signIn: string;
    };
  };
  
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    confirm: string;
    loading: string;
    error: string;
    success: string;
    retry: string;
    done: string;
    back: string;
    next: string;
    skip: string;
    close: string;
    yes: string;
    no: string;
  };
  
  // Days of week
  days: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    short: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
      sunday: string;
    };
  };
  
  // Notifications
  notifications: {
    morning: {
      variant1: string;
      variant2: string;
      variant3: string;
      variant4: string;
    };
    evening: {
      variant1: string;
      variant2: string;
      variant3: string;
      variant4: string;
    };
  };
}

// Extend i18next module for TypeScript support
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: TranslationKeys;
    };
  }
}