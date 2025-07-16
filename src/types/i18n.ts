// TypeScript definitions for i18n
export interface TranslationKeys {
  // Navigation
  tabs: {
    home: string;
    habits: string;
    journal: string;
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
    form: {
      name: string;
      namePlaceholder: string;
      color: string;
      icon: string;
      scheduledDays: string;
      description: string;
      descriptionPlaceholder: string;
      errors: {
        nameRequired: string;
        nameTooShort: string;
        nameTooLong: string;
        daysRequired: string;
        descriptionTooLong: string;
        submitFailed: string;
      };
    };
  };
  
  // Journal screen
  journal: {
    title: string;
    addGratitude: string;
    gratitudePlaceholder: string;
    minimumRequired: string;
    bonusGratitude: string;
    currentStreak: string;
    longestStreak: string;
    history: string;
    // --- NEW UNIVERSAL MILESTONE SYSTEM ---
    // Pro bonusové záznamy
    bonusMilestone1_title: string;
    bonusMilestone1_text: string;
    bonusMilestone5_title: string;
    bonusMilestone5_text: string;
    bonusMilestone10_title: string;
    bonusMilestone10_text: string;
    // Pro hlavní 'SelfRise Streak'
    streakMilestone_generic_title: string;
    streakMilestone_generic_text: string;
    streakMilestone21_title: string;
    streakMilestone21_text: string;
    streakMilestone100_title: string;
    streakMilestone100_text: string;
    streakMilestone365_title: string;
    streakMilestone365_text: string;
    streakMilestone1000_title: string;
    streakMilestone1000_text: string;
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
    noGoals: string;
    goalTitleLabel: string;
    goalTitlePlaceholder: string;
    unitLabel: string;
    unitPlaceholder: string;
    targetValueLabel: string;
    addProgressButton: string;
    progressValue: string;
    progressNote: string;
    progressNotePlaceholder: string;
    completed: string;
    progressLabel: string;
    confirmDelete: string;
    deleteMessage: string;
    cancel: string;
    delete: string;
    save: string;
    useTemplate: string;
    stats: {
      overview: string;
      trends: string;
      predictions: string;
    };
    form: {
      title: string;
      description: string;
      unit: string;
      targetValue: string;
      category: string;
      targetDate: string;
      placeholders: {
        title: string;
        description: string;
        unit: string;
        targetValue: string;
        targetDate: string;
      };
      errors: {
        titleRequired: string;
        titleTooShort: string;
        titleTooLong: string;
        unitRequired: string;
        unitTooLong: string;
        targetValueRequired: string;
        targetValueTooLarge: string;
        descriptionTooLong: string;
        submitFailed: string;
      };
    };
    progress: {
      addProgress: string;
      progressHistory: string;
      noProgress: string;
      form: {
        progressType: string;
        value: string;
        note: string;
        date: string;
        preview: string;
        submit: string;
        placeholders: {
          value: string;
          note: string;
          date: string;
        };
        types: {
          add: string;
          subtract: string;
          set: string;
        };
        errors: {
          valueRequired: string;
          valueTooLarge: string;
          noteTooLong: string;
          submitFailed: string;
        };
      };
    };
    categories: {
      personal: string;
      health: string;
      learning: string;
      career: string;
      financial: string;
      other: string;
    };
    category: {
      health: string;
      financial: string;
      learning: string;
      career: string;
      personal: string;
      other: string;
    };
    templates: {
      title: string;
      searchPlaceholder: string;
      footerText: string;
      all: string;
      target: string;
      noTemplates: string;
      loseWeight: string;
      loseWeightDescription: string;
      dailySteps: string;
      dailyStepsDescription: string;
      waterIntake: string;
      waterIntakeDescription: string;
      saveMoney: string;
      saveMoneyDescription: string;
      payDebt: string;
      payDebtDescription: string;
      readBooks: string;
      readBooksDescription: string;
      learnLanguage: string;
      learnLanguageDescription: string;
      onlineCourse: string;
      onlineCourseDescription: string;
      jobApplications: string;
      jobApplicationsDescription: string;
      networking: string;
      networkingDescription: string;
      meditation: string;
      meditationDescription: string;
      journalEntries: string;
      journalEntriesDescription: string;
      artProjects: string;
      artProjectsDescription: string;
      cookingRecipes: string;
      cookingRecipesDescription: string;
    };
    dashboard: {
      overview: string;
      activeGoals: string;
      completedGoals: string;
      completionRate: string;
      onTrack: string;
      deadlines: string;
      overdue: string;
      dueThisWeek: string;
      dueThisMonth: string;
      behindSchedule: string;
      categories: string;
      active: string;
      completed: string;
      completion: string;
      quickActions: string;
      complete: string;
      wayAhead: string;
      ahead: string;
      behind: string;
      wayBehind: string;
    };
    analysis: {
      progressTrend: string;
      progressChart: string;
      statistics: string;
      insights: string;
      totalEntries: string;
      currentProgress: string;
      avgDaily: string;
      noData: string;
      recentProgress: string;
      positiveProgress: string;
      negativeProgress: string;
      upwardTrend: string;
      downwardTrend: string;
      completionPrediction: string;
    };
    predictions: {
      title: string;
      methods: string;
      insights: string;
      estimatedDate: string;
      daysRemaining: string;
      confidence: string;
      high: string;
      medium: string;
      low: string;
      basicMethod: string;
      linearMethod: string;
      trendMethod: string;
      targetMethod: string;
      acceleratedMethod: string;
      noDataTitle: string;
      noDataDescription: string;
      highConfidenceTitle: string;
      highConfidenceDescription: string;
      inconsistentTitle: string;
      inconsistentDescription: string;
      behindScheduleTitle: string;
      behindScheduleDescription: string;
      aheadScheduleTitle: string;
      aheadScheduleDescription: string;
      increaseRateTitle: string;
      increaseRateDescription: string;
    };
    sharing: {
      title: string;
      shareOptions: string;
      copyOptions: string;
      quickSummary: string;
      quickSummaryDescription: string;
      detailedReport: string;
      detailedReportDescription: string;
      dataExport: string;
      dataExportDescription: string;
      copyToClipboard: string;
      copyToClipboardDescription: string;
      copyDetailed: string;
      copyDetailedDescription: string;
      copyJson: string;
      copyJsonDescription: string;
      footerText: string;
      complete: string;
      summary: string;
      progressEntry: string;
      noNote: string;
      onTrack: string;
      estimatedCompletion: string;
      noRecentProgress: string;
      noInsights: string;
      detailedReportTemplate: string;
      summaryTitle: string;
      detailedTitle: string;
      jsonTitle: string;
      exportError: string;
      copied: string;
      copyError: string;
    };
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
    saving: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    create: string;
    update: string;
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
    continue: string;
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