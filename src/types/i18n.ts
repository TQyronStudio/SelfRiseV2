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
    frozen: string;
    streakActive: string;
    startToday: string;
    bestStreak: string;
    canRecover: string;
    streakFrozen: string;
    streakFrozenTap_one: string;
    streakFrozenTap_other: string;
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
    // Habit Performance Indicators
    habitPerformance: {
      noHabitsDescription: string;
      vsLastWeek: string;
      thisWeek: string;
      buildingHabit: string;
      monthlyFocus: string;
    };
    // Habit Trend Analysis
    habitTrends: {
      noDataDescription: string;
      overallProgress: string;
      improvedByPercent: string;
      needsAttention: string;
      droppedByPercent: string;
      steadyProgress: string;
      consistencyStable: string;
      buildingNewHabits: string;
      newHabitsProgress: string;
      earlyMomentum: string;
      earlyMomentumDescription: string;
      starPerformer: string;
      streakChampions: string;
      streakChampionsDescription: string;
      excellentWeek: string;
      excellentWeekDescription: string;
      last4Weeks: string;
    };
    // Monthly Habit Overview
    monthlyOverview: {
      title: string;
      activeDays: string;
      perActiveDay: string;
      dailyProgress: string;
      topPerformer: string;
      needsFocus: string;
      greatMonth: string;
      reviewHabits: string;
      noDataDescription: string;
    };
    // XP Multiplier Section
    xpMultiplier: {
      sectionTitle: string;
      activeTitle: string;
      harmonyReward: string;
      multiplierActive: string;
      activeDescription: string;
      harmonyStreak: string;
      readyToActivate: string;
      moreDays: string;
      activateButton: string;
    };
    // Monthly 30 Day Chart
    monthly30Day: {
      title30: string;
      titleCustom: string;
      completionRate: string;
      bonus: string;
      completed: string;
      missed: string;
      bonusLabel: string;
    };
    // Weekly Habit Chart
    weeklyChart: {
      title7: string;
      titleCustom: string;
      completionRate: string;
      bonus: string;
      completed: string;
      missed: string;
      bonusLabel: string;
    };
    // Quick Actions (nested)
    quickActionsTitle: string;
    quickActions: {
      addHabit: string;
      gratitude: string;
      selfPraise: string;
      addGoal: string;
    };
    // Yearly Habit Overview
    yearlyOverview: {
      title365: string;
      titleCustom: string;
      activeDays: string;
      yearlyAverage: string;
      dailyAverage: string;
      perActiveDay: string;
      excellentYear: string;
      excellentYearDescription: string;
      roomForImprovement: string;
      noDataDescription: string;
      loading: string;
    };
    // Habit Stats Dashboard
    habitStatsDashboard: {
      week: string;
      month: string;
      year: string;
    };
    // Premium Trophy Icon
    premiumTrophy: {
      label: string;
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
    // Daily Quote
    dailyQuote: string;
    quoteCategories: {
      motivation: string;
      gratitude: string;
      habits: string;
      goals: string;
      achievement: string;
      level: string;
      streak: string;
      consistency: string;
      growth: string;
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
      errors: {
        visibilityFailed: string;
      };
      componentNames: {
        xpProgressBar: string;
        xpMultiplier: string;
        journalStreak: string;
        quickActions: string;
        dailyQuote: string;
        recommendations: string;
        streakHistory: string;
        habitStats: string;
        habitPerformance: string;
        habitTrends: string;
        monthlyChallenges: string;
      };
    };
    // Today's Habits
    todayHabits: string;
    // Level Progress
    yourProgress: string;
    currentLevelSummary: string;
    keepEarningXp: string;
    // Screen labels
    streakHistoryLoading: string;
  };

  // Levels & Navigation screens
  screens: {
    levelOverview: string;
    levelsLoading: string;
    goBack: string;
    backNavigation: string;
    reorderHabits: {
      title: string;
      instructions: string;
    };
    habitStats: {
      activeHabits: string;
      inactiveHabits: string;
      noHabitsFound: string;
      noHabitsSubtext: string;
    };
    goalStats: {
      loading: string;
    };
    trophyRoom: {
      title: string;
    };
  };

  // UI Labels
  ui: {
    progressStep: string;
    skipTutorial: string;
    nextStep: string;
    continue: string;
    next: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    retry: string;
    // Tutorial Completion
    tutorialComplete: string;
    readyToRise: string;
  };

  // Habits screen
  habits: {
    title: string;
    addHabit: string;
    editHabit: string;
    deleteHabit: string;
    activeHabits: string;
    inactiveHabits: string;
    addNewHabit: string;
    done: string;
    reorder: string;
    bonus: string;
    scheduled: string;
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
    emptyState: {
      title: string;
      subtitle: string;
    };
    emptyStateWithCompletion: {
      title: string;
      subtitle: string;
    };
    emptyStateTracker: {
      title: string;
      subtitle: string;
    };
    stats: {
      activeHabits: string;
    };
    calendar: {
      legendScheduled: string;
      legendCompleted: string;
      legendMissed: string;
      legendMakeup: string;
      bonus?: string;
    };
  };

  // Journal screen
  journal: {
    title: string;
    addGratitude: string;
    addGratitudeButton: string;
    addSelfPraiseButton: string;
    gratitudePlaceholder: string;
    minimumRequired: string;
    bonusGratitude: string;
    currentStreak: string;
    longestStreak: string;
    frozenStreak: string;
    history: string;
    statistics: string;
    progress: {
      title: string;
      complete: string;
      bonusAmazing: string;
      dailyComplete: string;
      entriesNeeded_one: string;
      entriesNeeded_other: string;
    };
    // --- BONUS MILESTONE SYSTEM ---
    // Bonus count milestones: 1st, 5th, 10th bonus entries
    bonusMilestone1_title: string;
    bonusMilestone1_text: string;
    bonusMilestone5_title: string;
    bonusMilestone5_text: string;
    bonusMilestone10_title: string;
    bonusMilestone10_text: string;
    // Pro hlavní 'SelfRise Streak'
    streakMilestone_generic_title: string;
    streakMilestone_generic_text: string;
    streakMilestone7_title: string;
    streakMilestone7_text: string;
    streakMilestone14_title: string;
    streakMilestone14_text: string;
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
      epic_crown_announcement: string;
      daily_complete_modal: string;
      streak_milestone_modal: string;
      bonus_milestone_modal: string;
      epic_crown_modal: string;
      streak_badge_accessibility: string;
      bonus_badge_accessibility: string;
      daily_complete_title: string;
      daily_complete_message: string;
      level_up_title: string;
      level_up_message: string;
      default_title: string;
      default_message: string;
      xp_earned: string;
      rewards_title: string;
      milestone_suffix: string;
      unlocked_prefix: string;
      milestone_first: string;
      milestone_fifth: string;
      milestone_tenth: string;
    };
    export: {
      title: string;
      truncated: string;
      error: string;
    };
    errors: {
      searchFailed: string;
      deleteFailed: string;
    };
    searchPlaceholder: string;
    editPlaceholder: string;
    historyTitle: string;
    today: string;
    searchResults_one: string;
    searchResults_other: string;
    noSearchResults: string;
    emptySearch: string;
    emptyHistory: string;
    loadingStats: string;
    deleteConfirm: {
      title: string;
      message: string;
      gratitude: string;
      selfPraise: string;
    };
    stats: {
      title: string;
      totalEntries: string;
      allTime: string;
      activeDays: string;
      daysWithEntries: string;
      currentStreak: string;
      dailyAverage: string;
      entriesPerDay: string;
      milestoneBadges: string;
      bestStreak: string;
      startToday: string;
      personalBest: string;
      best: string;
      motivationTitle: string;
      motivationNoStreak: string;
      motivationDay1: string;
      motivationDays: string;
    };
    input: {
      addGratitudeTitle: string;
      addSelfPraiseTitle: string;
      typeGratitude: string;
      typeSelfPraise: string;
      emptyError: string;
      minLengthError: string;
      frozenStreakError_one: string;
      frozenStreakError_other: string;
      gratitudePlaceholders: string[];
      selfPraisePlaceholders: string[];
    };
    warmUp: {
      title: string;
      frozenDays: string;
      frozenMessage_one: string;
      frozenMessage_other: string;
      streakWarmedUp: string;
      warmingUp: string;
      warmingProgress: string;
      adsProgress: string;
      loadingAd: string;
      warmUpComplete: string;
      warmUpButton: string;
      infoText: string;
      adFailed: {
        title: string;
        message: string;
        ok: string;
      };
      error: {
        title: string;
        message: string;
        ok: string;
      };
      confirmation: {
        title: string;
        message: string;
        cancel: string;
        confirm: string;
      };
      startFresh: {
        title: string;
        message: string;
      };
      modals: {
        success: {
          title: string;
          message: string;
          button: string;
        };
        error: {
          title: string;
          message: string;
          button: string;
        };
        confirmation: {
          title: string;
          message: string;
          cancel: string;
          confirm: string;
        };
        issue: {
          title: string;
          message: string;
          primaryAction: string;
          secondaryAction: string;
        };
        quickWarmUp: {
          title: string;
          message: string;
          cancel: string;
          confirm: string;
        };
      };
    };
    rescue: {
      congratulations: {
        title: string;
        message: string;
        continue: string;
      };
      autoFixed: {
        title: string;
        message: string;
      };
      issueResolved: {
        title: string;
        message: string;
      };
      noDebt: {
        title: string;
        message: string;
      };
      technicalIssue: {
        title: string;
        message: string;
      };
      technicalIssueRetry: {
        title: string;
        message: string;
      };
      criticalError: {
        title: string;
        message: string;
      };
      resetFailed: {
        title: string;
        message: string;
      };
    };
    fallback: {
      success: string;
      operationComplete: string;
      error: string;
      errorMessage: string;
      congratulations: string;
      debtCleared: string;
    };
  };
  
  // Goals screen
  goals: {
    title: string;
    addGoal: string;
    editGoal: string;
    deleteGoal: string;
    noGoals: string;
    error: string;
    goalNotFound: string;
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
    selectTargetDate: string;
    useTemplate: string;
    stats: {
      overview: string;
      trends: string;
      predictions: string;
      sectionStatistics: string;
      labelEntries: string;
      labelDaysActive: string;
      labelAvgDaily: string;
      labelTimelineStatus: string;
      sectionPredictions: string;
      labelEstimatedCompletion: string;
    };
    form: {
      title: string;
      description: string;
      unit: string;
      targetValue: string;
      category: string;
      targetDate: string;
      targetDateHint: string;
      targetDatePlaceholder: string;
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
    sections: {
      activeGoals: string;
      completedGoals: string;
      otherGoals: string;
    };
    actions: {
      reorder: string;
      done: string;
    };
    status: {
      active: string;
      paused: string;
      archived: string;
    };
    detailsCard: {
      title: string;
      status: string;
      progress: string;
      category: string;
      targetDate: string;
      target: string;
      completion: string;
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
    completion: {
      continue: string;
      title: string;
      bonus: string;
      statusComplete: string;
      statusCompleted: string;
      message1: string;
      message2: string;
      message3: string;
      message4: string;
      message5: string;
    };

    // Step-by-step date selection
    selectYear: string;
    selectMonth: string;
    selectDay: string;
  };

  // Monthly Challenge
  monthlyChallenge: {
    // Section title
    title: string;

    // States
    loading: string;
    preparing: string;
    noActiveChallenge: string;
    challengePreparing: string;
    errorLoading: string;
    failedToLoad: string;
    retry: string;

    // Actions
    view: string;
    close: string;
    awesome: string;
    continueJourney: string;

    // Labels
    complete: string;
    completePercentage: string;
    daysLeft: string;
    daysLeftCompact: string;
    level: string;
    difficulty: string;
    difficultyLabel: string;
    activeDays: string;
    maxXP: string;
    milestones: string;
    requirements: string;

    // Progress
    monthlyProgress: string;
    monthStreak: string;
    yourChallengeLevels: string;

    // Completion
    monthComplete: string;
    completed: string;
    endsDate: string;

    // Star rarity labels
    rarity: {
      common: string;
      rare: string;
      epic: string;
      legendary: string;
      master: string;
      unknown: string;
    };

    // Completion Modal
    completionModal: {
      subtitle: string;
      finalResults: string;

      titles: {
        perfect: string;
        outstanding: string;
        great: string;
        completed: string;
        progress: string;
      };

      messages: {
        perfect: string;
        outstanding: string;
        great: string;
        completed: string;
        progress: string;
      };

      rewards: {
        title: string;
        baseXP: string;
        completionBonus: string;
        streakBonus: string;
        perfectBonus: string;
        totalEarned: string;
      };

      starProgression: {
        title: string;
        previous: string;
        newLevel: string;
        description: string;
      };

      streak: {
        title: string;
        month_one: string;
        month_other: string;
        description: string;
      };

      nextMonth: {
        title: string;
        description: string;
        descriptionWithLevel: string;
      };
    };

    // Detail Modal
    detailModal: {
      strategyDescription: string;
      strategyDescriptionAdvance: string;
      rewardTitle: string;
      streakBonus: string;

      tips: {
        habits: string[];
        journal: string[];
        goals: string[];
        consistency: string[];
        default: string[];
      };
    };
  };

  // Achievements screen
  achievements: {
    title: string;
    subtitle: string;
    viewModeTrophyRoom: string;
    viewModeBrowseAll: string;
    loadingTitle: string;
    loadingText: string;
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
    celebration: {
      announcement: string;
      continue_button: string;
      continue_hint: string;
      rarity_common: string;
      rarity_rare: string;
      rarity_epic: string;
      rarity_legendary: string;
      xp_earned: string;
    };
    detail: {
      unlockedYesterday: string;
      unlockedDaysAgo: string;
      unlockedWeeksAgo: string;
      unlockedRecently: string;
      recentlyUnlocked: string;
      titleUnlocked: string;
      titleDetails: string;
      detailsSection: string;
      categoryLabel: string;
      rarityLabel: string;
      xpRewardLabel: string;
      xpPointsUnit: string;
      progressToUnlock: string;
      progressLoading: string;
      howToUnlock: string;
      estimatedDays: string;
      lockedMessage: string;
      requirementFallback: string;
      actionHint: string;
    };
    history: {
      justNow: string;
      today: string;
      yesterday: string;
      thisWeek: string;
      lastWeek: string;
      thisMonth: string;
      aWhileAgo: string;
    };
    filter: {
      showAll: string;
      unlockedOnly: string;
      lockedOnly: string;
      byCategory: string;
      byRarity: string;
      searchPlaceholder: string;
      noResults: string;
      noResultsSubtitle: string;
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
    spotlight: {
      title: string;
      titleWithEmoji: string;
      subtitle: string;
      emptyTitle: string;
      emptySubtitle: string;
      featuredAchievement: string;
      rotationText: string;
      stories: {
        common1: string;
        common2: string;
        common3: string;
        rare1: string;
        rare2: string;
        rare3: string;
        epic1: string;
        epic2: string;
        epic3: string;
        legendary1: string;
        legendary2: string;
        legendary3: string;
      };
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

    trophyRoom: {
      totalTrophies: string;
      collected: string;
      completionRate: string;
      overallProgress: string;
      showingResults: string;
    };

    // Achievement names (78 achievements)
    achievementNames: {
      'first-habit': string;
      'habit-builder': string;
      'century-club': string;
      'consistency-king': string;
      'habit-streak-champion': string;
      'century-streak': string;
      'streak-champion': string;
      'multi-tasker': string;
      'habit-legend': string;
      'first-journal': string;
      'deep-thinker': string;
      'journal-enthusiast': string;
      'grateful-heart': string;
      'gratitude-guru': string;
      'eternal-gratitude': string;
      'journal-streaker': string;
      'bonus-seeker': string;
      'first-star': string;
      'five-stars': string;
      'flame-achiever': string;
      'bonus-week': string;
      'crown-royalty': string;
      'flame-collector': string;
      'golden-bonus-streak': string;
      'triple-crown-master': string;
      'bonus-century': string;
      'star-beginner': string;
      'star-collector': string;
      'star-master': string;
      'star-champion': string;
      'star-legend': string;
      'flame-starter': string;
      'flame-accumulator': string;
      'flame-master': string;
      'flame-champion': string;
      'flame-legend': string;
      'crown-achiever': string;
      'crown-collector': string;
      'crown-master': string;
      'crown-champion': string;
      'crown-emperor': string;
      'first-goal': string;
      'goal-getter': string;
      'ambitious': string;
      'goal-champion': string;
      'progress-tracker': string;
      'mega-dreamer': string;
      'achievement-unlocked': string;
      'million-achiever': string;
      'weekly-warrior': string;
      'monthly-master': string;
      'centurion': string;
      'hundred-days': string;
      'daily-visitor': string;
      'dedicated-user': string;
      'perfect-month': string;
      'triple-crown': string;
      'gratitude-guardian': string;
      'dream-fulfiller': string;
      'goal-achiever': string;
      'level-up': string;
      'selfrise-expert': string;
      'selfrise-master': string;
      'ultimate-selfrise-legend': string;
      'recommendation-master': string;
      'balance-master': string;
      'trophy-collector-basic': string;
      'trophy-collector-master': string;
      'lightning-start': string;
      'seven-wonder': string;
      'persistence-pays': string;
      'legendary-master': string;
      'selfrise-legend': string;
      'loyalty-first-week': string;
      'loyalty-two-weeks-strong': string;
      'loyalty-three-weeks-committed': string;
      'loyalty-month-explorer': string;
      'loyalty-two-month-veteran': string;
      'loyalty-century-user': string;
      'loyalty-half-year-hero': string;
      'loyalty-year-legend': string;
      'loyalty-ultimate-veteran': string;
      'loyalty-master': string;
    };

    // Achievement requirements/descriptions (78 achievements)
    achievementRequirements: {
      'first-habit': string;
      'habit-builder': string;
      'century-club': string;
      'consistency-king': string;
      'habit-streak-champion': string;
      'century-streak': string;
      'streak-champion': string;
      'multi-tasker': string;
      'habit-legend': string;
      'first-journal': string;
      'deep-thinker': string;
      'journal-enthusiast': string;
      'grateful-heart': string;
      'gratitude-guru': string;
      'eternal-gratitude': string;
      'journal-streaker': string;
      'bonus-seeker': string;
      'first-star': string;
      'five-stars': string;
      'flame-achiever': string;
      'bonus-week': string;
      'crown-royalty': string;
      'flame-collector': string;
      'golden-bonus-streak': string;
      'triple-crown-master': string;
      'bonus-century': string;
      'star-beginner': string;
      'star-collector': string;
      'star-master': string;
      'star-champion': string;
      'star-legend': string;
      'flame-starter': string;
      'flame-accumulator': string;
      'flame-master': string;
      'flame-champion': string;
      'flame-legend': string;
      'crown-achiever': string;
      'crown-collector': string;
      'crown-master': string;
      'crown-champion': string;
      'crown-emperor': string;
      'first-goal': string;
      'goal-getter': string;
      'ambitious': string;
      'goal-champion': string;
      'progress-tracker': string;
      'mega-dreamer': string;
      'achievement-unlocked': string;
      'million-achiever': string;
      'weekly-warrior': string;
      'monthly-master': string;
      'centurion': string;
      'hundred-days': string;
      'daily-visitor': string;
      'dedicated-user': string;
      'perfect-month': string;
      'triple-crown': string;
      'gratitude-guardian': string;
      'dream-fulfiller': string;
      'goal-achiever': string;
      'level-up': string;
      'selfrise-expert': string;
      'selfrise-master': string;
      'ultimate-selfrise-legend': string;
      'recommendation-master': string;
      'balance-master': string;
      'trophy-collector-basic': string;
      'trophy-collector-master': string;
      'lightning-start': string;
      'seven-wonder': string;
      'persistence-pays': string;
      'legendary-master': string;
      'selfrise-legend': string;
      'loyalty-first-week': string;
      'loyalty-two-weeks-strong': string;
      'loyalty-three-weeks-committed': string;
      'loyalty-month-explorer': string;
      'loyalty-two-month-veteran': string;
      'loyalty-century-user': string;
      'loyalty-half-year-hero': string;
      'loyalty-year-legend': string;
      'loyalty-ultimate-veteran': string;
      'loyalty-master': string;
    };

    // Individual achievement translations (78 achievements - 156 keys)
    // Each achievement has nameKey and descriptionKey
    [achievementId: string]: {
      name: string;
      description: string;
    } | any; // Allow other properties for backward compatibility
  };
  
  // Settings screen
  settings: {
    title: string;
    appearance: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    themeDescription: string;
    themeSystemDescription: string;
    lightMode: string;
    darkMode: string;
    systemAuto: string;
    systemAutoDescription: string;
    language: string;
    languageDescription: string;
    languageEnglish: string;
    languageGerman: string;
    languageSpanish: string;
    notifications: string;
    morningNotification: string;
    eveningNotification: string;
    notificationSettings: {
      errors: {
        loadFailed: string;
        permissionsTitle: string;
        permissionsMessage: string;
        permissionsFailed: string;
        settingsFailed: string;
        afternoonUpdateFailed: string;
        eveningUpdateFailed: string;
        afternoonTimeFailed: string;
        eveningTimeFailed: string;
      };
      buttons: {
        openSettings: string;
      };
    };
    habitAnalytics: string;
    individualHabitStats: string;
    account: string;
    login: string;
    register: string;
    logout: string;
    about: string;
    version: string;
    privacyPolicy: string;
    termsOfService: string;
    tutorial: string;
    tutorialReset: string;
    tutorialResetDescription: string;
    tutorialResetConfirmTitle: string;
    tutorialResetConfirmMessage: string;
    tutorialResetSuccess: string;
    cancel: string;
    reset: string;
    success: string;
    errorTitle: string;
    resetting: string;
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
    loading: string | { default: string; levels: string; habits: string; progress: string; };
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
    copy: string;
    share: string;
    startFresh: string;
    help: string;
    helpNotAvailable: string;
    tryAgain?: string;
    level?: string;
    totalXP?: string;
    achievements?: string;
    category?: string;
    rarity?: string;
    xpReward?: string;
    completed?: string;
    modals: {
      errorTitle: string;
      confirmTitle: string;
      confirm: string;
      closeButton: string;
    };
    errors: {
      goals: {
        failedToSave: string;
        failedToDelete: string;
        failedToReorder: string;
        failedToAddProgress: string;
        noProgressData: string;
      };
      habits: {
        failedToSave: string;
        failedToDelete: string;
        failedToUpdate: string;
        failedToReorder: string;
        failedToToggleCompletion: string;
        loadingHabits: string;
        activeHabits: string;
        inactiveHabits: string;
        noHabitsFound: string;
        createHabitsFirst: string;
      };
      gratitude: {
        failedToSave: string;
      };
      social: {
        failedToLoadHeroes: string;
      };
    };
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
    shortest: {
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
    disabled: string;
    enableTap: string;
    settingsTap: string;
    afternoonReminder: string;
    afternoonDescription: string;
    eveningReminder: string;
    eveningDescription: string;
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
    reminders: {
      afternoon: {
        variant1: { title: string; body: string };
        variant2: { title: string; body: string };
        variant3: { title: string; body: string };
        variant4: { title: string; body: string };
      };
      evening: {
        incomplete_habits: {
          title: string;
          body_one: string;
          body_other: string;
        };
        missing_journal: {
          title: string;
          body_one: string;
          body_other: string;
        };
        bonus_opportunity: {
          title: string;
          body: string;
        };
        fallback: {
          title: string;
          body: string;
        };
      };
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
        journal_bonus_milestone: string;
        goal_progress: string;
        goal_completion: string;
        habit_streak_milestone: string;
        journal_streak_milestone: string;
        achievement_unlock: string;
        general_activity: string;
        daily_engagement: string;
        monthly_challenge: string;
        XP_MULTIPLIER_BONUS: string;
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
      notifications: {
        completed: string;
        balanced: string;
        reversed: string;
        updated: string;
        and: string;
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
      overview: {
        currentBadge: string;
        xpRequiredSuffix: string;
        rarity: {
          mythic: string;
          legendary: string;
          epic: string;
          rare: string;
          growing: string;
          beginner: string;
        };
      };
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
      journal_bonus_milestone: {
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
      monthly_challenge: {
        icon_description: string;
      };
      general_activity: {
        icon_description: string;
      };
      XP_MULTIPLIER_BONUS: {
        icon_description: string;
      };
    };
    multiplier: {
      continue: string;
      harmonyActivated: string;
      achievementUnlocked: string;
      harmonyStreakLabel: string;
      bonusXP: string;
      duration: string;
      activated: string;
      activateButton: string;
      duration24h: string;
    };
    analysis: {
      title: string;
      overallRating: string;
      trend: string;
      successRate: string;
      strongest: string;
    };
  };

  // Tutorial System
  tutorial: {
    // General Tutorial UI
    skip: string;
    next: string;
    continue: string;
    getStarted: string;
    finish: string;
    progressText: string;
    loading: string;

    // Tutorial Step Content
    steps: {
      welcome: {
        title: string;
        content: string;
        button: string;
      };
      appOverview: {
        title: string;
        content: string;
        button: string;
      };
      quickActions: {
        title: string;
        content: string;
        button: string;
      };
      createHabitButton: {
        title: string;
        content: string;
        button: string;
      };
      habitName: {
        title: string;
        content: string;
        placeholder: string;
        examples: string[];
        button: string;
      };
      habitColor: {
        title: string;
        content: string;
        button: string;
      };
      habitIcon: {
        title: string;
        content: string;
        button: string;
      };
      habitDays: {
        title: string;
        content: string;
        button: string;
      };
      habitCreate: {
        title: string;
        content: string;
        button: string;
      };
      habitComplete: {
        title: string;
        content: string;
        button: string;
      };
      journalIntro: {
        title: string;
        content: string;
        button: string;
      };
      gratitudeEntry: {
        title: string;
        content: string;
        placeholder: string;
        examples: string[];
        button: string;
      };
      journalEncouragement: {
        title: string;
        content: string;
        button: string;
      };
      goalsIntro: {
        title: string;
        content: string;
        button: string;
      };
      goalCategory: {
        title: string;
        content: string;
        button: string;
      };
      goalTitle: {
        title: string;
        content: string;
        placeholder: string;
        examples: string[];
        button: string;
      };
      goalUnit: {
        title: string;
        content: string;
        placeholder: string;
        examples: string[];
        button: string;
      };
      goalTarget: {
        title: string;
        content: string;
        placeholder: string;
        button: string;
      };
      goalDate: {
        title: string;
        content: string;
        placeholder: string;
        button: string;
      };
      goalCreate: {
        title: string;
        content: string;
        button: string;
      };
      goalComplete: {
        title: string;
        content: string;
        button: string;
      };
      navigateHome: {
        title: string;
        content: string;
        button: string;
      };
      trophyRoom: {
        title: string;
        content: string;
        button: string;
      };
      xpIntro: {
        title: string;
        content: string;
        button: string;
      };
      completion: {
        title: string;
        content: string;
        button: string;
      };
      createGoalButton: {
        title: string;
        content: string;
        button: string;
      };
    };

    // Validation Messages
    validation: {
      habitName: {
        required: string;
        tooShort: string;
        tooLong: string;
      };
      habitDays: {
        required: string;
      };
      goalTitle: {
        required: string;
        tooShort: string;
        tooLong: string;
      };
      goalUnit: {
        required: string;
        tooLong: string;
      };
      goalTarget: {
        required: string;
        tooLarge: string;
      };
      gratitudeEntry: {
        required: string;
        tooShort: string;
      };
    };

    // Error Messages
    errors: {
      loadingFailed: string;
      savingFailed: string;
      habitCreationFailed: string;
      goalCreationFailed: string;
      journalEntryFailed: string;
      genericError: string;
      recoveryMode: string;
      reset: string;
      retry: string;
    };

    // Skip Confirmation
    skipConfirmation: {
      title: string;
      message: string;
      skip: string;
      continue: string;
    };

    // Progress Messages
    progress: {
      creatingHabit: string;
      creatingGoal: string;
      savingEntry: string;
      loading: string;
    };

    // Accessibility
    accessibility: {
      tutorialModal: string;
      spotlightArea: string;
      progressIndicator: string;
      skipButton: string;
      nextButton: string;
      formField: string;
      colorSelector: string;
      iconSelector: string;
      daySelector: string;
    };

    // Tutorial Recovery (for crash recovery)
    recovery: {
      title: string;
      message: string;
      continue: string;
      restart: string;
    };
  };

  // Help system
  help: {
    habits: {
      scheduling: { title: string; content: string; };
      bonusConversion: { title: string; content: string; };
      streakTracking: { title: string; content: string; };
      colorAndIcon: { title: string; content: string; };
      makeupFunction: { title: string; content: string; };
    };
    journal: {
      gratitudeStreak: { title: string; content: string; };
      selfRiseStreak: { title: string; content: string; };
      bonusEntries: { title: string; content: string; };
      debtRecovery: { title: string; content: string; };
    };
    goals: {
      overview: { title: string; content: string; };
      predictions: { title: string; content: string; };
      progressTracking: { title: string; content: string; };
      templates: { title: string; content: string; };
    };
    home: {
      recommendations: { title: string; content: string; };
      xpSystem: { title: string; content: string; };
      streakBadges: { title: string; content: string; };
      habitStatistics: { title: string; content: string; };
    };
    achievements: {
      // Removed standard gaming concepts - achievements are intuitive
    };
    challenges: {
      templates?: any; // Challenge templates are dynamic
      detail: {
        tabOverview: string;
        tabCalendar: string;
        tabTips: string;
        sectionDescription: string;
        sectionTimeline: string;
        labelDaysRemaining: string;
        labelActiveDays: string;
        labelTotalDays: string;
        sectionRequirements: string;
        sectionTips: string;
        sectionStrategy: string;
        sectionRewards: string;
        rewardDescription: string;
        completed: string;
      };
      starDifficulty: { title: string; content: string; };
      progressTracking: { title: string; content: string; };
      completionRewards: { title: string; content: string; };
    };
    gamification: {
      levelProgression: { title: string; content: string; };
      xpMultipliers: { title: string; content: string; };
      harmonyStreak: { title: string; content: string; };
    };
  };

  // Social features
  social: {
    // Phase 7: DailyHeroesSection
    dailyHeroes: {
      title: string;
      subtitle: string;
      loading: string;
      tryAgain: string;
      noHeroes: string;
      noHeroesSubtitle: string;
      footer: string;
      inspiring: string;
      daysActive: string;
      today: string;
      yesterday: string;
      recent: string;
    };
    // Phase 8: NotificationSettings & LoyaltyCard
    notifications: {
      disabled: string;
      enableTap: string;
      settingsTap: string;
      afternoonReminder: string;
      afternoonDescription: string;
      eveningReminder: string;
      eveningDescription: string;
    };
    loyalty: {
      loadingData: string;
      unavailableData: string;
      journeyTitle: string;
      activeDays: string;
      daysRemaining: string;
      maxReached: string;
      daysOfDedication: string;
      currentStreak: string;
      longestStreak: string;
      level: string;
    };
    quote: {
      title: string;
      copiedTitle: string;
      copiedMessage: string;
      copyError: string;
      copy: string;
      share: string;
    };
    achievements: {
      shareSuccessTitle: string;
      shareSuccessMessage: string;
      shareError: string;
      copiedTitle: string;
      copiedMessage: string;
      shareAchievementTitle: string;
      shareAchievementDescription: string;
      copyClipboardTitle: string;
      copyClipboardDescription: string;
    };
    achievements_filters: {
      allCategories: string;
      habitsCategory: string;
      journalCategory: string;
      goalsCategory: string;
      consistencyCategory: string;
      categoryLabel: string;
      rarityLabel: string;
      recentLabel: string;
      alphabeticalLabel: string;
      sortByLabel: string;
      unlockedOnlyLabel: string;
      allRarities: string;
      commonRarity: string;
      rareRarity: string;
      epicRarity: string;
      legendaryRarity: string;
    };
    // Achievement Filters
    filterLabels: {
      category: string;
      rarity: string;
      sortBy: string;
    };
    // Trophy combinations
    combinations: {
      collections: string;
      completed: string;
      earned: string;
      collection: string;
      rate: string;
    };
    // Achievement states
    states: {
      new: string;
      keepGrowing: string;
      level: string;
    };
    // Achievement History
    history: {
      newBadge: string;
      emptyTitle: string;
      recentVictories: string;
    };
    // Achievement Tooltip
    tooltip: {
      completed: string;
      progressAndRequirements: string;
      requirement: string;
      currentProgress: string;
      nextSteps: string;
      smartTips: string;
    };
    // Achievement Detail Modal
    detail: {
      category: string;
      rarity: string;
      xpReward: string;
    };
    // Trophy Room
    trophyRoom: {
      title: string;
      subtitle: string;
      qualitySection: string;
    };
    // Share Achievement Modal
    shareModal: {
      title: string;
      subtitle: string;
      preparing: string;
      messagePreview: string;
      sharingOptions: string;
      privacyProtected: string;
    };
    achievements_trophies: {
      habitMastery: string;
      journalMastery: string;
      goalMastery: string;
      legendaryCollector: string;
      epicCollector: string;
      universalBeginning: string;
      consistencyMaster: string;
      timeMaster: string;
    };
    trophy_combinations: {
      title: string;
      subtitle: string;
      collectionsCompleted: string;
      bonusXPEarned: string;
      collectionRate: string;
      collectionComplete: string;
      collections: {
        'habits-master': string;
        'journal-sage': string;
        'goal-champion': string;
        'legendary-collector': string;
        'epic-hunter': string;
        'first-steps': string;
        'consistency-king': string;
        'time-master': string;
      };
    };
    loyalty_progress: {
      keepGrowing: string;
      level: string;
      loadingData: string;
      unavailableData: string;
      journeyTitle: string;
      activeDays: string;
      progressNext: string;
      daysRemaining: string;
      maximumReached: string;
      daysOfDedication: string;
      currentStreak: string;
      longestStreak: string;
      levels: {
        newcomer: {
          name: string;
          description: string;
        };
        explorer: {
          name: string;
          description: string;
        };
        veteran: {
          name: string;
          description: string;
        };
        legend: {
          name: string;
          description: string;
        };
        master: {
          name: string;
          description: string;
        };
      };
    };
    days: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
      sunday: string;
    };
  };

  // Challenges
  challenges: {
    calendar: {
      dailyProgress: string;
      title: string;
      noActivity: string;
      someActivity: string;
      goodProgress: string;
      perfectDay: string;
      weeklyBreakdown: string;
      week: string;
    };
    completion: {
      requirements: string;
      activeDays: string;
      milestones: string;
    };
  };

  // Gratitude/Journal
  gratitude: {
    daily: {
      title: string;
    };
    export: {
      title: string;
      textFormat: string;
      jsonFormat: string;
      exporting: string;
    };
    edit: {
      title: string;
    };
    bonus: {
      label: string;
    };
  };

  // Accessibility labels
  accessibility: {
    activateMultiplier: string;
    tapToContinueTutorial: string;
    achievementGrid: string;
    closeAchievementDetails: string;
    shareAchievement: string;
    shareYourAchievement: string;
    continueWithMultiplier: string;
    multiplierCelebration: string;
    getNewQuote: string;
    copyQuoteToClipboard: string;
    shareQuote: string;
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