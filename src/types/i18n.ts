// TypeScript definitions for i18n
export interface TranslationKeys {
  // Navigation
  tabs: {
    home: string;
    habits: string;
    journal: string;
    goals: string;
    achievements: string;
    settings: string;
  };
  
  // Home screen
  home: {
    title: string;
    journalStreak: string;
    habitStatistics: string;
    weeklyProgress: string;
    monthlyProgress: string;
    dayDetail: string;
    // Streak display
    day: string;
    days: string;
    streakActive: string;
    startToday: string;
    bestStreak: string;
    canRecover: string;
    // Streak visualization  
    recentActivity: string;
    completed: string;
    bonus: string;
    today: string;
    // Streak history graph
    journalHistory: string;
    last30Days: string;
    todayCount: string;
    peakDay: string;
    completeDays: string;
    bonusDays: string;
    // Habit Statistics Dashboard
    habitStats: {
      weeklyChart: string;
      monthlyOverview: string;
      performanceIndicators: string;
      trendAnalysis: string;
      totalHabits: string;
      activeHabits: string;
      completedToday: string;
      weeklyAverage: string;
      monthlyAverage: string;
      bestDay: string;
      improvingTrend: string;
      decliningTrend: string;
      steadyProgress: string;
      noData: string;
      chartToggle: string;
      week: string;
      month: string;
    };
    // Streak sharing
    shareStreak: string;
    shareSubtitle: string;
    sharePreview: string;
    copyText: string;
    shareNow: string;
    sharing: string;
    shareTitle: string;
    shareStreakText: string;
    shareBestStreak: string;
    shareBadges: string;
    shareAppPromo: string;
    copiedToClipboard: string;
    shareError: string;
    copyError: string;
    // Quick Actions
    quickActions: string;
    addHabit: string;
    addJournal: string;
    addGoal: string;
    todayHabits: string;
    // Daily Quote
    dailyQuote: string;
    quoteCategories: {
      motivation: string;
      gratitude: string;
      habits: string;
      goals: string;
    };
    // Personalized Recommendations
    recommendations: string;
    noRecommendations: string;
    journalPrompt: string;
    // Home Customization
    customization: {
      title: string;
      components: string;
      componentsDescription: string;
      order: string;
      actions: string;
      resetToDefaults: string;
      resetTitle: string;
      resetMessage: string;
    };
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
    celebration: {
      daily_complete_announcement: string;
      streak_milestone_announcement: string;
      bonus_milestone_announcement: string;
      daily_complete_modal: string;
      streak_milestone_modal: string;
      bonus_milestone_modal: string;
      streak_badge_accessibility: string;
      bonus_badge_accessibility: string;
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
      confirmDelete: string;
      deleteMessage: string;
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
    details: {
      predictions: string;
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
  
  // Achievements screen
  achievements: {
    title: string;
    subtitle: string;
    overview: {
      unlockedCount: string;
      totalCount: string;
      completionRate: string;
      totalXP: string;
      recentUnlocks: string;
      nextToUnlock: string;
      noAchievements: string;
      getStarted: string;
    };
    categories: {
      all: string;
      habits: string;
      journal: string;
      goals: string;
      consistency: string;
      mastery: string;
      social: string;
      special: string;
    };
    rarity: {
      common: string;
      rare: string;
      epic: string;
      legendary: string;
    };
    filter: {
      showAll: string;
      unlockedOnly: string;
      lockedOnly: string;
      byCategory: string;
      byRarity: string;
      searchPlaceholder: string;
      noResults: string;
      clearFilters: string;
    };
    sort: {
      byName: string;
      byUnlockDate: string;
      byRarity: string;
      byCategory: string;
      byProgress: string;
      ascending: string;
      descending: string;
    };
    card: {
      locked: string;
      unlocked: string;
      unlockedOn: string;
      progress: string;
      xpReward: string;
      viewDetails: string;
      almostThere: string;
      keepGoing: string;
      accessibility_label: string;
      accessibility_hint: string;
    };
    details: {
      title: string;
      description: string;
      category: string;
      rarity: string;
      xpReward: string;
      unlockCondition: string;
      progress: string;
      unlockedDate: string;
      timeToUnlock: string;
      tips: string;
      close: string;
      shareAchievement: string;
    };
    interactive: {
      celebrationHistory: string;
      achievementSpotlight: string;
      featuredAchievement: string;
      dailyChallenge: string;
      progressPreview: string;
      upcomingRewards: string;
    };
    stats: {
      title: string;
      breakdown: string;
      rarityDistribution: string;
      unlockTimeline: string;
      averageTimeToUnlock: string;
      totalXPEarned: string;
      achievementRate: string;
      consistencyScore: string;
      nextMilestone: string;
      daysActive: string;
      thisWeek: string;
      thisMonth: string;
      allTime: string;
    };
    empty: {
      noAchievements: string;
      noAchievementsSubtitle: string;
      noSearchResults: string;
      noSearchResultsSubtitle: string;
      noCategory: string;
      noCategorySubtitle: string;
    };
    names: {
      firstSteps: string;
      habitBuilder: string;
      streakMaster: string;
      deepThinker: string;
      goalGetter: string;
      consistent: string;
      dedicated: string;
      perfectMonth: string;
    };
    descriptions: {
      firstSteps: string;
      habitBuilder: string;
      streakMaster: string;
      deepThinker: string;
      goalGetter: string;
      consistent: string;
      dedicated: string;
      perfectMonth: string;
    };
    sharing: {
      shareTitle: string;
      shareText: string;
      shareError: string;
      copySuccess: string;
      copyError: string;
    };
    accessibility: {
      achievementCard: string;
      lockedAchievement: string;
      unlockedAchievement: string;
      progressBar: string;
      categoryFilter: string;
      rarityBadge: string;
      searchInput: string;
      sortButton: string;
      filterButton: string;
      viewDetails: string;
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
    ok: string;
    done: string;
    back: string;
    next: string;
    skip: string;
    close: string;
    continue: string;
    yes: string;
    no: string;
    celebration: {
      general_announcement: string;
      modal: string;
    };
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

  // Gamification System
  gamification: {
    xp: {
      label: string;
      short: string;
      gained: string;
      lost: string;
      total: string;
      loading: string;
      sources: {
        habit_completion: string;
        habit_bonus: string;
        journal_entry: string;
        journal_bonus: string;
        goal_progress: string;
        goal_completion: string;
        habit_streak_milestone: string;
        journal_streak_milestone: string;
        achievement_unlock: string;
        general_activity: string;
        daily_engagement: string;
      };
      notification: {
        message: string;
        amount: string;
      };
      announcement: {
        balanced: string;
        decreased: string;
        single: string;
        multiple_same: string;
        multiple_mixed: string;
      };
      popup: {
        gained: string;
        lost: string;
        amount_label: string;
      };
    };
    progress: {
      level: string;
      progress: string;
      to_next_level: string;
      xp_remaining: string;
      loading: string;
      accessibility: {
        label: string;
        hint: string;
      };
      badge: {
        accessibility: string;
      };
      bar: {
        accessibility: string;
      };
      milestone: {
        accessibility: string;
      };
    };
    levels: {
      current: string;
      next: string;
      milestone: string;
      rewards: string;
      title: string;
      description: string;
    };
    effects: {
      level_up: string;
      milestone: string;
      achievement: string;
      celebration: string;
      general: string;
      accessibility_label: string;
    };
    celebration: {
      level_up_announcement: string;
      level_up_modal: string;
      level_up_section_accessibility: string;
      level_badge_accessibility: string;
      level_title_accessibility: string;
      rewards_section_accessibility: string;
      rewards_title: string;
      reward_item_accessibility: string;
      continue_button_accessibility: string;
      continue_button_hint: string;
      emoji: {
        daily_complete: string;
        streak_milestone: string;
        bonus_milestone: string;
        level_up: string;
      };
    };
    achievement: {
      unlocked: string;
      locked: string;
      progress: string;
      xp_reward: string;
      requirements: string;
      unlock_condition: string;
      announcement: {
        unlocked: string;
      };
    };
    sources: {
      habit_completion: {
        icon_description: string;
      };
      habit_bonus: {
        icon_description: string;
      };
      journal_entry: {
        icon_description: string;
      };
      journal_bonus: {
        icon_description: string;
      };
      goal_progress: {
        icon_description: string;
      };
      goal_completion: {
        icon_description: string;
      };
      goal_milestone: {
        icon_description: string;
      };
      habit_streak_milestone: {
        icon_description: string;
      };
      journal_streak_milestone: {
        icon_description: string;
      };
      achievement_unlock: {
        icon_description: string;
      };
      weekly_challenge: {
        icon_description: string;
      };
      general_activity: {
        icon_description: string;
      };
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