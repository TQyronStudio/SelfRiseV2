import { TranslationKeys } from '../../types/i18n';

const en: TranslationKeys = {
  // Navigation
  tabs: {
    home: 'Home',
    habits: 'Habits',
    journal: 'My Journal',
    goals: 'Goals',
    achievements: 'Achievements',
    settings: 'Settings',
  },
  
  // Home screen
  home: {
    title: 'Welcome Back!',
    journalStreak: 'My Journal Streak',
    habitStatistics: 'Habit Statistics',
    weeklyProgress: 'Weekly Progress',
    monthlyProgress: 'Monthly Progress',
    dayDetail: 'Day Detail',
    // Streak display
    day: 'day',
    days: 'days',
    frozen: 'frozen',
    streakActive: 'Streak active!',
    startToday: 'Start today',
    bestStreak: 'Best',
    canRecover: 'Recover with ad',
    streakFrozen: 'Streak Frozen - Warm Up to Continue ❄️🔥',
    streakFrozenTap_one: '❄️ Streak Frozen: {{count}} day - Tap to warm up',
    streakFrozenTap_other: '❄️ Streak Frozen: {{count}} days - Tap to warm up',
    // Streak visualization  
    recentActivity: 'Recent Activity',
    completed: 'Completed',
    bonus: 'Bonus',
    today: 'Today',
    // Streak history graph
    journalHistory: 'My Journal History',
    last30Days: 'Last 30 days - entries per day',
    todayCount: 'Today',
    peakDay: 'Peak Day',
    completeDays: 'Complete',
    bonusDays: 'Bonus',
    // Habit Statistics Dashboard
    habitStats: {
      weeklyChart: 'Weekly Habit Completion',
      monthlyOverview: 'Monthly Overview',
      performanceIndicators: 'Performance',
      trendAnalysis: 'Trends - Habits',
      totalHabits: 'Total Habits',
      activeHabits: 'Active Habits',
      completedToday: 'Completed Today',
      weeklyAverage: 'Weekly Average',
      monthlyAverage: 'Monthly Average',
      bestDay: 'Best Day',
      improvingTrend: 'Improving trend',
      decliningTrend: 'Declining trend',
      steadyProgress: 'Steady progress',
      noData: 'No habit data available',
      chartToggle: 'View',
      week: 'Week',
      month: 'Month',
    },
    // Habit Performance Indicators
    habitPerformance: {
      noHabitsDescription: 'Add habits to see performance indicators',
      vsLastWeek: 'vs. {{percent}}% last week',
      thisWeek: 'This Week',
      buildingHabit: '{{name}} (building)',
      monthlyFocus: '{{month}} Focus',
    },
    // Habit Trend Analysis
    habitTrends: {
      noDataDescription: 'Complete habits for a few weeks to see trend analysis',
      overallProgress: '🚀 Overall Progress',
      improvedByPercent: 'Improved by {{percent}}% over 4 weeks. Keep it up!',
      needsAttention: '⚠️ Needs Attention',
      droppedByPercent: 'Dropped by {{percent}}% recently. Review your routine.',
      steadyProgress: '📈 Steady Progress',
      consistencyStable: 'Consistency stable at {{percent}}% average.',
      buildingNewHabits: '🌱 Building New Habits',
      newHabitsProgress: '{completions, plural, one {# completion} other {# completions}} across {habits, plural, one {# new habit} other {# new habits}}! Great start!',
      earlyMomentum: '🚀 Early Momentum',
      earlyMomentumDescription: '{{percent}}% average completion rate in building habits. You\'re establishing strong patterns!',
      starPerformer: '🏆 Star Performer',
      streakChampions: '🔥 Streak Champions',
      streakChampionsDescription: '{count, plural, one {# habit} other {# habits}} with 7+ day streaks!',
      excellentWeek: '🎯 Excellent Week',
      excellentWeekDescription: '{{percent}}% completion this week. Amazing!',
      last4Weeks: 'Last 4 weeks',
    },
    // Monthly Habit Overview
    monthlyOverview: {
      title: 'Past 30 Days',
      activeDays: '{{active}}/{{total}} active days',
      perActiveDay: 'per active day',
      dailyProgress: 'Daily Progress (Past 30 Days)',
      topPerformer: '🏆 Top Performer',
      needsFocus: '💪 Needs Focus',
      greatMonth: 'Great month! Keep up the excellent work.',
      reviewHabits: 'Consider reviewing your habits and goals.',
      noDataDescription: 'Add some habits to see your monthly overview',
    },
    // XP Multiplier Section
    xpMultiplier: {
      sectionTitle: '⚡ XP Multiplier',
      activeTitle: '2x XP Active! {{time}}',
      harmonyReward: 'Harmony Streak Reward',
      multiplierActive: 'Multiplier Active',
      activeDescription: 'All XP gains are doubled while this multiplier is active',
      harmonyStreak: 'Harmony Streak: {{current}}/7',
      readyToActivate: 'Ready to activate 2x XP!',
      moreDays: '{days, plural, one {# more day} other {# more days}} for 2x XP',
      activateButton: 'Activate 2x XP',
    },
    // Monthly 30 Day Chart
    monthly30Day: {
      title30: 'Past 30 Days Completion',
      titleCustom: 'Past {{days}} Days Completion',
      completionRate: '{{completed}}/{{total}} ({{percent}}%)',
      bonus: '{{count}} bonus',
      completed: 'Completed',
      missed: 'Missed',
      bonusLabel: 'Bonus',
    },
    // Weekly Habit Chart
    weeklyChart: {
      title7: 'Past 7 Days Completion',
      titleCustom: 'Past {{days}} Days Completion',
      completionRate: '{{completed}}/{{total}} ({{percent}}%)',
      bonus: '{{count}} bonus',
      completed: 'Completed',
      missed: 'Missed',
      bonusLabel: 'Bonus',
    },
    // Quick Actions
    quickActionsTitle: 'Quick Actions',
    quickActions: {
      addHabit: 'Add Habit',
      gratitude: 'Gratitude',
      selfPraise: 'Self-Praise',
      addGoal: 'Add Goal',
    },
    // Yearly Habit Overview
    yearlyOverview: {
      title365: 'Past 365 Days Overview',
      titleCustom: 'Past {{days}} Days Overview',
      activeDays: '{{active}}/{{total}} active days',
      yearlyAverage: 'Yearly Average',
      dailyAverage: 'Daily Average',
      perActiveDay: 'per active day',
      excellentYear: '🔥 Excellent Year',
      excellentYearDescription: 'Outstanding yearly performance! Keep it up.',
      roomForImprovement: '📈 Room for Improvement',
      noDataDescription: 'Add some habits to see your yearly overview',
      loading: 'Loading yearly statistics...',
    },
    // Habit Stats Dashboard
    habitStatsDashboard: {
      week: 'Week',
      month: 'Month',
      year: 'Year',
    },
    // Premium Trophy Icon
    premiumTrophy: {
      label: 'Trophies',
    },
    // Streak sharing
    shareStreak: 'Share My Streak',
    shareSubtitle: 'Show off your journal journey!',
    sharePreview: 'Message Preview',
    copyText: 'Copy Text',
    shareNow: 'Share Now',
    sharing: 'Sharing...',
    shareTitle: 'My Journal Streak',
    shareStreakText: 'I\'m on a {{current}}-day journaling streak! 🔥',
    shareBestStreak: 'My best streak: {{best}} days',
    shareBadges: 'Achievements',
    shareAppPromo: '#Journaling #SelfRise #PersonalGrowth',
    copiedToClipboard: 'Copied to clipboard!',
    shareError: 'Failed to share. Please try again.',
    copyError: 'Failed to copy. Please try again.',
    // Daily Quote
    dailyQuote: 'Daily Inspiration',
    quoteCategories: {
      motivation: 'Motivation',
      gratitude: 'Gratitude',
      habits: 'Habits',
      goals: 'Goals',
      achievement: 'Achievement',
      level: 'Level',
      streak: 'Streak',
      consistency: 'Consistency',
      growth: 'Growth',
    },
    // Personalized Recommendations
    recommendations: 'For You',
    noRecommendations: 'Great job! You\'re on track with everything.',
    journalPrompt: 'Try this prompt',
    // Home Customization
    customization: {
      title: 'Customize Home',
      components: 'Home Components',
      componentsDescription: 'Choose which sections to show on your home screen',
      order: 'Position {{order}}',
      actions: 'Actions',
      resetToDefaults: 'Reset to Defaults',
      resetTitle: 'Reset Home Layout',
      resetMessage: 'This will restore the default home screen layout. Are you sure?',
      errors: {
        visibilityFailed: 'Failed to update component visibility. Please try again.',
      },
      componentNames: {
        xpProgressBar: 'XP Progress',
        xpMultiplier: 'XP Multiplier',
        journalStreak: 'Journal Streak',
        quickActions: 'Quick Actions',
        dailyQuote: 'Daily Quote',
        recommendations: 'Recommendations',
        streakHistory: 'Streak History',
        habitStats: 'Habit Statistics',
        habitPerformance: 'Performance',
        habitTrends: 'Trends',
        monthlyChallenges: 'Monthly Challenges',
      },
    },
    // Today's Habits
    todayHabits: "Today's Habits",
    // Screen labels
    streakHistoryLoading: 'Loading...',
    // Level Progress
    yourProgress: 'Your Progress',
    currentLevelSummary: 'You\'re currently level {currentLevel} out of 100 levels',
    keepEarningXp: 'Keep earning XP to unlock higher levels!',
  },

  // Levels & Navigation screens
  screens: {
    levelOverview: 'Level Overview',
    levelsLoading: 'Loading levels...',
    goBack: 'Go back',
    reorderHabits: {
      title: 'Reorder Habits',
      instructions: 'Hold and drag any habit to reorder them',
    },
    habitStats: {
      activeHabits: 'Active Habits',
      inactiveHabits: 'Inactive Habits',
      noHabitsFound: 'No habits found',
      noHabitsSubtext: 'Create some habits first to view their statistics',
    },
    goalStats: {
      loading: 'Loading...',
    },
  },

  // Common labels
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    edit: 'Edit',
    delete: 'Delete',
    retry: 'Retry',
    tryAgain: 'Try Again',
    add: 'Add',
    create: 'Create',
    update: 'Update',
    confirm: 'Confirm',
    error: 'Error',
    success: 'Success',
    done: 'Done',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    close: 'Close',
    continue: 'Continue',
    yes: 'Yes',
    no: 'No',
    copy: 'Copy',
    share: 'Share',
    startFresh: 'Start Fresh',
    level: 'Level',
    totalXP: 'Total XP',
    achievements: 'Achievements',
    category: 'Category',
    rarity: 'Rarity',
    xpReward: 'XP Reward',
    loading: {
      default: 'Loading...',
      levels: 'Loading levels...',
      habits: 'Loading habits...',
      progress: 'Loading progress...',
    },
    modals: {
      errorTitle: 'Error',
      confirmTitle: 'Confirm Action',
      confirm: 'Confirm',
      closeButton: 'Close',
    },
    errors: {
      goals: {
        failedToSave: 'Failed to save goal',
        failedToDelete: 'Failed to delete goal',
        failedToReorder: 'Failed to reorder goals',
        failedToAddProgress: 'Failed to add progress',
        noProgressData: 'No progress data yet. Add some progress to see statistics.',
      },
      habits: {
        failedToSave: 'Failed to save habit',
        failedToDelete: 'Failed to delete habit',
        failedToUpdate: 'Failed to update habit',
        failedToReorder: 'Failed to reorder habits',
        failedToToggleCompletion: 'Failed to toggle completion',
        loadingHabits: 'Loading habits...',
        activeHabits: 'Active Habits',
        inactiveHabits: 'Inactive Habits',
        noHabitsFound: 'No habits found',
        createHabitsFirst: 'Create some habits first to view their statistics',
      },
      gratitude: {
        failedToSave: 'Failed to save gratitude',
      },
      social: {
        failedToLoadHeroes: 'Failed to load daily heroes',
      },
    },
    celebration: {
      general_announcement: 'Congratulations on your achievement!',
      modal: 'Achievement celebration',
    },
    help: 'Help',
    helpNotAvailable: 'Help information not available for this feature.',
  },

  // UI Labels
  ui: {
    progressStep: 'Step {current} of {total}',
    skipTutorial: 'Skip tutorial',
    nextStep: 'Next step',
    continue: 'Continue',
    next: 'Next',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    retry: 'Retry',
    // Tutorial Completion
    tutorialComplete: 'Tutorial Complete',
    readyToRise: 'Ready to Rise',
  },

  // Habits screen
  habits: {
    title: 'My Habits',
    addHabit: 'Add Habit',
    editHabit: 'Edit Habit',
    deleteHabit: 'Delete Habit',
    activeHabits: 'Active Habits',
    inactiveHabits: 'Inactive Habits',
    addNewHabit: 'Add New Habit',
    done: 'Done',
    reorder: 'Reorder',
    bonus: 'Bonus',
    scheduled: 'Scheduled',
    habitName: 'Habit Name',
    habitNamePlaceholder: 'Enter habit name...',
    selectColor: 'Select Color',
    selectIcon: 'Select Icon',
    scheduledDays: 'Scheduled Days',
    markCompleted: 'Mark as Completed',
    viewCalendar: 'View Calendar',
    confirmDelete: 'Confirm Delete',
    deleteMessage: 'Are you sure you want to delete this habit? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    form: {
      name: 'Habit Name',
      namePlaceholder: 'Enter habit name...',
      color: 'Select Color',
      icon: 'Select Icon',
      scheduledDays: 'Scheduled Days',
      description: 'Description (Optional)',
      descriptionPlaceholder: 'Add a description for your habit...',
      errors: {
        nameRequired: 'Habit name is required',
        nameTooShort: 'Habit name must be at least 2 characters',
        nameTooLong: 'Habit name must be less than 50 characters',
        daysRequired: 'Please select at least one day',
        descriptionTooLong: 'Description must be less than 200 characters',
        submitFailed: 'Failed to save habit. Please try again.',
      },
    },
    emptyState: {
      title: 'No habits yet',
      subtitle: 'Start building better habits by creating your first one',
    },
    emptyStateWithCompletion: {
      title: 'No habits created yet',
      subtitle: 'Tap "Add New Habit" to get started!',
    },
    emptyStateTracker: {
      title: 'No active habits',
      subtitle: 'Create your first habit to start tracking!',
    },
    stats: {
      activeHabits: 'Active Habits',
    },
    calendar: {
      legendScheduled: 'Scheduled',
      legendCompleted: 'Completed',
      legendMissed: 'Missed',
      legendMakeup: 'Makeup',
      bonus: 'Bonus',
    },
  },
  
  // Journal screen
  journal: {
    title: 'My Journal',
    addGratitude: 'Add Gratitude',
    addGratitudeButton: '+ Add Gratitude',
    addSelfPraiseButton: '+ Add Self-Praise',
    gratitudePlaceholder: 'What are you grateful for today?',
    minimumRequired: 'Write at least 3 entries to maintain your streak',
    bonusGratitude: 'Bonus Entry',
    currentStreak: 'Current Streak',
    longestStreak: 'Longest Streak',
    history: 'History',
    statistics: 'Statistics',
    // --- BONUS MILESTONE SYSTEM ---
    // Bonus count milestones: 1st, 5th, 10th bonus entries
    bonusMilestone1_title: 'First Bonus Entry! ⭐',
    bonusMilestone1_text: 'Amazing! You\'ve written your first bonus entry today! Keep going!',
    bonusMilestone5_title: 'Fifth Bonus Entry! 🔥',
    bonusMilestone5_text: 'Incredible! You\'ve written 5 bonus entries today. You\'re on fire!',
    bonusMilestone10_title: 'Tenth Bonus Entry! 👑',
    bonusMilestone10_text: 'Legendary! You\'ve written 10 bonus entries today. You are a journaling champion!',
    // Pro hlavní 'SelfRise Streak'
    streakMilestone_generic_title: 'Another Milestone! 🎯',
    streakMilestone_generic_text: 'Congratulations on reaching {{days}} days in a row!',
    streakMilestone7_title: 'One Week Strong! 🔥',
    streakMilestone7_text: '7 days in a row! You\'re building momentum and forming a powerful habit. Keep it going!',
    streakMilestone14_title: 'Two Weeks Strong! 💪',
    streakMilestone14_text: '14 days of dedication! You\'re proving to yourself that consistency is possible. Keep the momentum going!',
    streakMilestone21_title: 'A Habit is Forming! 🌱',
    streakMilestone21_text: '21 days in a row! You\'re building a strong habit of positive self-reflection. Keep going!',
    streakMilestone100_title: 'Welcome to the 100 Club! 💯',
    streakMilestone100_text: 'One hundred days of consistency. This is a lifestyle now. You are a huge inspiration!',
    streakMilestone365_title: 'One Year of Self-Growth! 🎉',
    streakMilestone365_text: 'Incredible. A whole year of discipline and positive thinking. Look back at the huge journey you\'ve traveled.',
    streakMilestone1000_title: 'LEGENDARY! 传奇',
    streakMilestone1000_text: '1000 days. You have reached a goal that proves incredible willpower. You are a SelfRise legend.',
    streakLost: {
      title: 'Streak Lost',
      message: 'Your streak has been broken. What would you like to do?',
      reset: 'Reset Streak',
      recover: 'Recover with Ad',
    },
    
    // Celebration announcements for accessibility
    celebration: {
      daily_complete_announcement: 'Congratulations! You have completed your daily journal practice!',
      streak_milestone_announcement: 'Amazing! You have reached a {{days}} day streak milestone!',
      bonus_milestone_announcement: 'Excellent! You have completed {{count}} bonus journal entries!',
      epic_crown_announcement: 'Legendary achievement! You have reached the ultimate 10th bonus milestone with royal crown celebration!',
      daily_complete_modal: 'Daily journal completion celebration',
      streak_milestone_modal: '{{days}} day streak milestone celebration',
      bonus_milestone_modal: '{{count}} bonus entries celebration',
      epic_crown_modal: 'Epic royal crown celebration for 10th bonus milestone achievement',
      streak_badge_accessibility: '{{days}} day streak achievement badge',
      bonus_badge_accessibility: '{{count}} bonus {{#eq count 1}}entry{{else}}entries{{/eq}} achievement badge',
      // Fallback strings for CelebrationModal (when i18n keys are missing)
      daily_complete_title: 'Congratulations! 🎉',
      daily_complete_message: 'You\'ve completed your daily journal practice!',
      level_up_title: 'Level Up! 🎉',
      level_up_message: 'Congratulations on reaching a new level!',
      default_title: 'Congratulations!',
      default_message: 'Great job!',
      xp_earned: 'XP Earned',
      rewards_title: 'New Rewards:',
      milestone_suffix: ' Milestone!',
      unlocked_prefix: 'You\'ve unlocked',
      milestone_first: 'First',
      milestone_fifth: 'Fifth',
      milestone_tenth: 'Tenth',
    },

    // Export functionality
    export: {
      title: 'Journal Export - {{format}} Format',
      truncated: '[Content truncated for display]',
      error: 'Failed to export journal data',
    },

    // Error messages
    errors: {
      searchFailed: 'Failed to search journal entries',
      deleteFailed: 'Failed to delete journal entry',
    },

    // Journal UI text
    searchPlaceholder: 'Search journal entries...',
    editPlaceholder: 'Edit your journal entry...',
    historyTitle: 'Journal History',
    today: 'Today',
    searchResults_one: 'Found {{count}} result for "{{term}}"',
    searchResults_other: 'Found {{count}} results for "{{term}}"',
    noSearchResults: 'No results found for "{{term}}"',
    emptySearch: 'No journal entries match your search.',
    emptyHistory: 'No journal entries for {{date}}.',
    loadingStats: 'Loading statistics...',

    // Delete confirmation
    deleteConfirm: {
      title: 'Delete Journal Entry',
      message: 'Are you sure you want to delete this {{type}} entry? This action cannot be undone.',
      gratitude: 'gratitude',
      selfPraise: 'self-praise',
    },

    // Journal stats
    stats: {
      title: 'Journal Statistics',
      totalEntries: 'Total Entries',
      allTime: 'All time',
      activeDays: 'Active Days',
      daysWithEntries: '{count, plural, one {# day} other {# days}} with entries',
      currentStreak: 'Current Streak',
      dailyAverage: 'Daily Average',
      entriesPerDay: 'entries per active day',
      milestoneBadges: 'Milestone Badges',
      bestStreak: 'Best streak: {{days}} days',
      startToday: 'Start your streak today!',
      personalBest: 'Personal best! 🎉',
      best: 'Best: {{days}} days',
      motivationTitle: 'Keep Going!',
      motivationNoStreak: "Every journey begins with a single step. Start your journaling streak today!",
      motivationDay1: "Great start! One day down, many more to go. Keep up the momentum!",
      motivationDays: "Amazing {{days}}-day streak! You're building a powerful habit.",
    },

    // Gratitude Input Component
    input: {
      // Header titles
      addGratitudeTitle: 'Add Gratitude',
      addSelfPraiseTitle: 'Add Self-Praise',

      // Error messages
      emptyError: 'Please enter your gratitude',
      minLengthError: 'Gratitude must be at least 3 characters long',
      frozenStreakError_one: 'Your streak is frozen for {{count}} day. Warm it up on the Home screen first, then continue journaling! 🔥',
      frozenStreakError_other: 'Your streak is frozen for {{count}} days. Warm it up on the Home screen first, then continue journaling! 🔥',

      // Gratitude placeholders (rotating)
      gratitudePlaceholders: [
        'What made you smile today?',
        'Who are you thankful for right now?',
        'What small thing brought you joy?',
        'What beautiful thing did you see today?',
        'What skill are you grateful to have?',
        'What part of your day are you most thankful for?',
        'What is something you\'re looking forward to?',
        'What food are you grateful for today?',
        'What song made your day better?',
        'What simple pleasure did you enjoy?',
      ],

      // Self-praise placeholders (rotating)
      selfPraisePlaceholders: [
        'What challenge did you overcome today?',
        'What\'s one thing you did well today?',
        'What did you do today that you\'re proud of?',
        'How did you take a step towards your goals?',
        'What good decision did you make?',
        'When were you disciplined today?',
        'How did you show kindness to yourself?',
        'What did you learn today?',
        'What effort are you proud of, regardless of the outcome?',
        'What did you do today that was just for you?',
      ],
    },

    // Warm-up modals
    warmUp: {
      title: 'Warm Up Your Streak',
      frozenDays: 'Frozen Days',
      frozenMessage_one: 'Your streak has been frozen for {{count}} day. Watch {{adsNeeded}} ad to warm it up, then continue journaling freely! ❄️➡️🔥',
      frozenMessage_other: 'Your streak has been frozen for {{count}} days. Watch {{adsNeeded}} ads to warm it up, then continue journaling freely! ❄️➡️🔥',
      streakWarmedUp: 'Streak warmed up! Go to Journal and continue your journey! ✨',
      warmingUp: 'Warming up: {{current}}/{{total}} 🔥',
      warmingProgress: 'Warming Progress',
      adsProgress: '{{watched}}/{{total}} ads',
      loadingAd: 'Loading Ad...',
      warmUpComplete: 'Warm Up Complete! ✓',
      warmUpButton: 'Warm Up ({{current}}/{{total}})',
      infoText: 'First warm up your frozen streak by watching ads. After your streak is warmed up, you can write journal entries normally without watching more ads.',

      adFailed: {
        title: 'Ad Failed',
        message: 'Failed to load ad. Please try again.',
        ok: 'OK',
      },

      error: {
        title: 'Error',
        message: 'Something went wrong. Please try again.',
        ok: 'OK',
      },

      confirmation: {
        title: 'Watch Ad to Warm Up Streak',
        message: 'This would show a real advertisement. Continue with ad simulation?',
        cancel: 'Cancel',
        confirm: 'Watch Ad',
      },

      startFresh: {
        title: 'Start Fresh?',
        message: '⚠️ This will permanently reset your current streak to 0. You can start fresh without warming up your frozen streak. This action cannot be undone.',
      },

      modals: {
        success: {
          title: 'Success!',
          message: 'Operation completed successfully.',
          button: 'OK',
        },
        error: {
          title: 'Error',
          message: 'Something went wrong. Please try again.',
          button: 'OK',
        },
        confirmation: {
          title: 'Confirmation',
          message: 'Are you sure you want to continue?',
          confirm: 'Confirm',
          cancel: 'Cancel',
        },
        issue: {
          title: 'Issue Detected',
          message: 'There seems to be an issue. Choose how to proceed.',
          primaryAction: 'Try Again',
          secondaryAction: 'Quick Warm Up',
        },
        quickWarmUp: {
          title: 'Quick Warm Up',
          message: 'This will warm up your frozen streak without watching ads. Your streak will continue normally. Continue?',
          confirm: 'Warm Up',
          cancel: 'Cancel',
        },
      },
    },

    // Streak rescue modals
    rescue: {
      congratulations: {
        title: '🎉 Streak Rescued!',
        message: 'Congratulations! Your streak has been successfully rescued. You can now write journal entries normally.',
        continue: 'Continue',
      },
      autoFixed: {
        title: 'Streak Rescued!',
        message: 'Your streak has been successfully rescued! There was a technical issue but we fixed it automatically.',
      },
      issueResolved: {
        title: 'Issue Resolved',
        message: 'We apologize for the technical issue. Your streak has been successfully rescued and you can now continue writing entries normally.',
      },
      noDebt: {
        title: 'No Debt',
        message: 'Your streak appears to be already rescued. Refreshing your streak data...',
      },
      technicalIssue: {
        title: 'Technical Issue',
        message: 'You watched all required ads but we encountered a technical issue. Your streak rescue is complete, please restart the app if needed.',
      },
      technicalIssueRetry: {
        title: 'Technical Issue',
        message: 'We encountered a technical issue while completing your streak rescue (attempt {{attempt}}/2). Please try again.',
      },
      criticalError: {
        title: 'Critical Error',
        message: 'We encountered a critical technical issue. Please restart the app. Your data is safe.',
      },
      resetFailed: {
        title: 'Reset Failed',
        message: 'Failed to reset debt. Please contact support.',
      },
    },

    // Fallback messages
    fallback: {
      success: 'Success!',
      operationComplete: 'Operation completed successfully.',
      error: 'Error',
      errorMessage: 'Something went wrong. Please try again.',
      congratulations: '🎉 Congratulations!',
      debtCleared: 'Your debt has been cleared successfully!',
    },
  },
  
  // Goals screen
  goals: {
    title: 'My Goals',
    addGoal: 'Add Goal',
    editGoal: 'Edit Goal',
    deleteGoal: 'Delete Goal',
    noGoals: 'No goals yet. Start by creating your first goal!',

    // Error states
    error: 'Error',
    goalNotFound: 'Goal not found',
    goalTitleLabel: 'Goal Title',
    goalTitlePlaceholder: 'Enter your goal...',
    unitLabel: 'Unit',
    unitPlaceholder: 'e.g., $, kg, hours...',
    targetValueLabel: 'Target Value',
    addProgressButton: 'Add Progress',
    progressValue: 'Progress Value',
    progressNote: 'Note',
    progressNotePlaceholder: 'Add a note about your progress...',
    completed: 'Completed',
    progressLabel: 'Progress',
    confirmDelete: 'Confirm Delete',
    deleteMessage: 'Are you sure you want to delete this goal? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    selectTargetDate: 'Select Target Date',
    
    // Step-by-step date selection
    selectYear: 'Select Year',
    selectMonth: 'Select Month', 
    selectDay: 'Select Day',
    
    // Goal Analytics
    useTemplate: 'Use Template',
    stats: {
      overview: 'Overview',
      trends: 'Trends',
      predictions: 'Predictions',
      sectionStatistics: 'Statistics',
      labelEntries: 'Entries',
      labelDaysActive: 'Days Active',
      labelAvgDaily: 'Avg Daily',
      labelTimelineStatus: 'Timeline Status',
      sectionPredictions: 'Predictions',
      labelEstimatedCompletion: 'Estimated Completion:',
    },
    
    form: {
      title: 'Goal Title',
      description: 'Description (Optional)',
      unit: 'Unit',
      targetValue: 'Target Value',
      category: 'Category',
      targetDate: 'Target Date (Recommended)',
      targetDateHint: 'Tap to open step-by-step date selector',
      targetDatePlaceholder: 'Select target date (optional)',
      placeholders: {
        title: 'Enter your goal title...',
        description: 'Describe your goal in more detail...',
        unit: 'e.g., $, kg, hours, books...',
        targetValue: '100',
        targetDate: 'YYYY-MM-DD',
      },
      errors: {
        titleRequired: 'Goal title is required',
        titleTooShort: 'Goal title must be at least 2 characters',
        titleTooLong: 'Goal title must be less than 100 characters',
        unitRequired: 'Unit is required',
        unitTooLong: 'Unit must be less than 20 characters',
        targetValueRequired: 'Target value must be greater than 0',
        targetValueTooLarge: 'Target value must be less than 1,000,000',
        descriptionTooLong: 'Description must be less than 300 characters',
        submitFailed: 'Failed to save goal. Please try again.',
      },
    },
    
    progress: {
      addProgress: 'Add Progress',
      progressHistory: 'Progress History',
      noProgress: 'No progress entries yet',
      confirmDelete: 'Delete Progress Entry',
      deleteMessage: 'Are you sure you want to delete this progress entry? This action cannot be undone.',
      form: {
        progressType: 'Progress Type',
        value: 'Value',
        note: 'Note (Optional)',
        date: 'Date',
        preview: 'Preview',
        submit: 'Add Progress',
        placeholders: {
          value: '0',
          note: 'Add a note about your progress...',
          date: 'YYYY-MM-DD',
        },
        types: {
          add: 'Add',
          subtract: 'Subtract',
          set: 'Set To',
        },
        errors: {
          valueRequired: 'Value must be greater than 0',
          valueTooLarge: 'Value must be less than 1,000,000',
          noteTooLong: 'Note must be less than 200 characters',
          submitFailed: 'Failed to add progress. Please try again.',
        },
      },
    },

    details: {
      predictions: 'Completion Predictions',
    },

    categories: {
      personal: 'Personal',
      health: 'Health',
      learning: 'Learning',
      career: 'Career',
      financial: 'Financial',
      other: 'Other',
    },
    
    // Goal Categories
    category: {
      health: 'Health',
      financial: 'Financial',
      learning: 'Learning',
      career: 'Career',
      personal: 'Personal',
      other: 'Other',
    },
    
    // Goal Templates
    templates: {
      title: 'Goal Templates',
      searchPlaceholder: 'Search templates...',
      footerText: 'Select a template to get started quickly with pre-filled goal details.',
      all: 'All',
      target: 'Target',
      noTemplates: 'No templates found matching your search.',
      
      // Health Templates
      loseWeight: 'Lose Weight',
      loseWeightDescription: 'Set a target weight loss goal with healthy progress tracking.',
      
      // Financial Templates
      saveMoney: 'Save Money',
      saveMoneyDescription: 'Build your savings with a specific target amount.',
      payDebt: 'Pay Off Debt',
      payDebtDescription: 'Track progress toward eliminating debt completely.',
      
      // Learning Templates
      readBooks: 'Read Books',
      readBooksDescription: 'Set a goal to read a specific number of books this year.',
      learnLanguage: 'Learn Language',
      learnLanguageDescription: 'Track hours spent learning a new language.',
      onlineCourse: 'Complete Online Course',
      onlineCourseDescription: 'Finish lessons or modules in an online course.',
      
      // Career Templates
      jobApplications: 'Job Applications',
      jobApplicationsDescription: 'Track the number of job applications submitted.',
      networking: 'Professional Networking',
      networkingDescription: 'Build your professional network with new connections.',
      
      // Personal Templates
      meditation: 'Daily Meditation',
      meditationDescription: 'Track minutes spent in daily meditation practice.',
      
      // Other Templates
      artProjects: 'Art Projects',
      artProjectsDescription: 'Complete creative art projects throughout the year.',
      cookingRecipes: 'Try New Recipes',
      cookingRecipesDescription: 'Expand your cooking skills by trying new recipes.',
    },
    
    // Goal Dashboard
    dashboard: {
      overview: 'Overview',
      activeGoals: 'Active Goals',
      completedGoals: 'Completed Goals',
      completionRate: 'Completion Rate',
      onTrack: 'On Track',
      deadlines: 'Deadlines',
      overdue: 'Overdue',
      dueThisWeek: 'Due This Week',
      dueThisMonth: 'Due This Month',
      behindSchedule: 'Behind Schedule',
      categories: 'Categories',
      active: 'Active',
      completed: 'Completed',
      completion: 'Completion',
      quickActions: 'Quick Actions',
      complete: 'Complete',
      // Timeline Status
      wayAhead: 'Way Ahead',
      ahead: 'Ahead',
      behind: 'Behind',
      wayBehind: 'Way Behind',
    },

    // Goal Sections
    sections: {
      activeGoals: 'Active Goals',
      completedGoals: 'Completed Goals',
      otherGoals: 'Other Goals',
    },

    // Goal Screen Actions
    actions: {
      reorder: 'Reorder',
      done: 'Done',
    },

    // Goal Status
    status: {
      active: 'Active',
      paused: 'Paused',
      archived: 'Archived',
    },

    // Goal Details
    detailsCard: {
      title: 'Goal Details',
      status: 'Status:',
      progress: 'Progress:',
      category: 'Category:',
      targetDate: 'Target Date:',
      target: 'Target',
      completion: 'Completion',
    },

    // Goal Analytics
    analysis: {
      progressTrend: 'Progress Trend',
      progressChart: 'Progress Chart',
      statistics: 'Statistics',
      insights: 'Insights',
      totalEntries: 'Total Entries',
      currentProgress: 'Current Progress',
      avgDaily: 'Avg Daily',
      noData: 'No progress data available for analysis.',
      recentProgress: 'Recent Progress',
      positiveProgress: 'Great progress! Average daily increase of {{rate}}%.',
      negativeProgress: 'Progress has declined by {{rate}}% daily. Consider reviewing your approach.',
      upwardTrend: 'Your recent progress shows an upward trend. Keep it up!',
      downwardTrend: 'Recent progress is declining. Time to refocus on your goal.',
      completionPrediction: 'At this rate, you\'ll complete your goal in {{days}} days.',
    },
    
    // Goal Predictions
    predictions: {
      title: 'Goal Completion Predictions',
      methods: 'Prediction Methods',
      insights: 'Insights',
      estimatedDate: 'Estimated Date',
      daysRemaining: 'Days Remaining',
      confidence: 'Confidence',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      basicMethod: 'Basic Estimate',
      linearMethod: 'Linear Progression',
      trendMethod: 'Recent Trend',
      targetMethod: 'Target Date',
      acceleratedMethod: 'Accelerated Progress',
      noDataTitle: 'Insufficient Data',
      noDataDescription: 'Add more progress entries to get accurate predictions.',
      highConfidenceTitle: 'High Confidence Prediction',
      highConfidenceDescription: 'Based on {{method}}, you\'ll complete your goal on {{date}} with {{confidence}}% confidence.',
      inconsistentTitle: 'Inconsistent Predictions',
      inconsistentDescription: 'Predictions vary by {{difference}} days. Consider adding more progress data.',
      behindScheduleTitle: 'Behind Schedule',
      behindScheduleDescription: 'You\'re {{days}} days behind your target date. Consider increasing your progress rate.',
      aheadScheduleTitle: 'Ahead of Schedule',
      aheadScheduleDescription: 'Great job! You\'re {{days}} days ahead of your target date.',
      increaseRateTitle: 'Increase Progress Rate',
      increaseRateDescription: 'You need {{required}} {{unit}} daily vs. your current {{current}} {{unit}} daily to meet your target.',
    },
    
    // Goal Sharing
    sharing: {
      title: 'Share Goal',
      shareOptions: 'Share Options',
      copyOptions: 'Copy Options',
      quickSummary: 'Quick Summary',
      quickSummaryDescription: 'Share a brief overview of your goal progress.',
      detailedReport: 'Detailed Report',
      detailedReportDescription: 'Share comprehensive progress details and insights.',
      dataExport: 'Data Export',
      dataExportDescription: 'Export goal data in JSON format for backup or analysis.',
      copyToClipboard: 'Copy Summary',
      copyToClipboardDescription: 'Copy goal summary to your clipboard.',
      copyDetailed: 'Copy Detailed',
      copyDetailedDescription: 'Copy detailed progress report to clipboard.',
      copyJson: 'Copy JSON',
      copyJsonDescription: 'Copy goal data in JSON format to clipboard.',
      footerText: 'Share your progress with others or export your data for backup.',
      complete: 'Complete',
      summary: 'Goal: {{title}}\nProgress: {{completion}}% ({{current}}/{{target}} {{unit}})\nDays Active: {{daysActive}}\nAverage Daily: {{averageDaily}} {{unit}}',
      progressEntry: '{{date}}: {{type}} {{value}} {{unit}} - {{note}}',
      noNote: 'No note',
      onTrack: '✅ On track to meet target date',
      estimatedCompletion: '📅 Estimated completion: {{date}}',
      noRecentProgress: 'No recent progress entries.',
      noInsights: 'No insights available.',
      detailedReportTemplate: 'GOAL PROGRESS REPORT\n\n{{summary}}\n\nRECENT PROGRESS:\n{{recentProgress}}\n\nINSIGHTS:\n{{insights}}',
      summaryTitle: 'Goal Summary: {{title}}',
      detailedTitle: 'Goal Report: {{title}}',
      jsonTitle: 'Goal Data: {{title}}',
      exportError: 'Failed to export goal data. Please try again.',
      copied: 'Content copied to clipboard!',
      copyError: 'Failed to copy content. Please try again.',
    },

    // Goal Completion Modal
    completion: {
      continue: 'Continue',
      title: 'Goal Completed!',
      bonus: 'Goal Completion Bonus',
      statusComplete: 'Complete',
      statusCompleted: 'Completed',
      message1: 'Congratulations! You\'ve achieved your goal!',
      message2: 'Amazing work! Goal completed successfully!',
      message3: 'Fantastic! You\'ve reached your target!',
      message4: 'Well done! Your dedication paid off!',
      message5: 'Excellent! Another goal conquered!',
    },
  },

  // Monthly Challenge
  monthlyChallenge: {
    // Section title
    title: 'Monthly Challenge',

    // States
    loading: 'Loading challenge...',
    preparing: '🗓️ Preparing your monthly challenge...',
    noActiveChallenge: 'No active challenge',
    challengePreparing: '⏳ Challenge preparing',
    errorLoading: 'Error loading challenge',
    failedToLoad: 'Failed to load monthly challenge',
    retry: 'Retry',

    // Actions
    view: 'View',
    close: 'Close',
    awesome: 'Awesome!',
    continueJourney: 'Continue Journey',

    // Labels
    complete: 'complete',
    completePercentage: 'Complete',
    daysLeft: 'Days Left',
    daysLeftCompact: 'd left',
    level: 'Level',
    difficulty: 'Difficulty',
    activeDays: 'Active Days',
    maxXP: 'Max XP',
    milestones: 'Milestones',
    requirements: 'Requirements',

    // Progress
    monthlyProgress: 'Monthly Progress',
    monthStreak: 'Month Streak',
    yourChallengeLevels: 'Your Challenge Levels',

    // Completion
    monthComplete: '✓ Month Complete',
    completed: 'Monthly Challenge Completed! 🎉',
    endsDate: 'Ends: {date}',

    // Star rarity
    rarity: {
      common: 'Common',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
      master: 'Master',
      unknown: 'Unknown',
    },

    // Completion modal
    completionModal: {
      subtitle: 'Monthly Challenge',
      finalResults: 'Final Results',

      titles: {
        perfect: 'Perfect Completion!',
        outstanding: 'Outstanding Achievement!',
        great: 'Great Progress!',
        completed: 'Challenge Completed!',
        progress: 'Month Progress!',
      },

      messages: {
        perfect: 'Incredible! You\'ve achieved perfect completion on this {rarity} {category} challenge. Your dedication is truly inspiring!',
        outstanding: 'Amazing work! You\'ve nearly mastered this {rarity} {category} challenge with outstanding consistency.',
        great: 'Excellent progress! You\'ve shown great commitment to this {rarity} {category} challenge this month.',
        completed: 'Well done! You\'ve successfully completed this {rarity} {category} challenge and earned your rewards.',
        progress: 'Good effort! You\'ve made meaningful progress on this {rarity} {category} challenge this month.',
      },

      rewards: {
        title: 'XP Rewards Earned',
        baseXP: 'Base Challenge XP',
        completionBonus: 'Completion Bonus',
        streakBonus: 'Monthly Streak Bonus 🔥',
        perfectBonus: 'Perfect Completion 🏆',
        totalEarned: 'Total XP Earned',
      },

      starProgression: {
        title: 'Star Level Progression! 🌟',
        previous: 'Previous',
        newLevel: 'New Level',
        description: 'Your next monthly challenge will be more challenging with higher XP rewards!',
      },

      streak: {
        title: 'Monthly Streak 🔥',
        month_one: 'Month',
        month_other: 'Months',
        description: 'Keep up the momentum! Each consecutive month increases your streak bonuses.',
      },

      nextMonth: {
        title: 'Ready for Next Month?',
        description: 'Your next challenge will be generated automatically on the 1st.',
        descriptionWithLevel: 'Your next challenge will be generated automatically on the 1st. With your new star level, expect a greater challenge and bigger rewards!',
      },
    },

    // Detail modal
    detailModal: {
      strategyDescription: 'This is a {rarity} ({stars}★) difficulty challenge designed to help you grow consistently.',
      strategyDescriptionAdvance: 'Complete this challenge to advance to the next star level and unlock higher XP rewards!',
      rewardTitle: '{xp} Experience Points',
      streakBonus: '🔥 Streak Bonus: +{bonus} XP for {count} month streak',

      tips: {
        habits: [
          'Focus on building sustainable habits that align with your lifestyle.',
          'Start with easier habits and gradually increase difficulty.',
          'Track your habits daily to maintain accountability.',
          'Celebrate small wins to stay motivated throughout the month.',
          'Use habit stacking to link new habits to existing routines.',
        ],
        journal: [
          'Set aside dedicated time each day for journaling.',
          'Write authentically about your experiences and feelings.',
          'Use journal prompts when you feel stuck.',
          'Review past entries to track your growth.',
          'Experiment with different journaling styles to find what works.',
        ],
        goals: [
          'Break large goals into smaller, actionable milestones.',
          'Review and adjust your goals weekly.',
          'Focus on progress, not perfection.',
          'Document lessons learned along the way.',
          'Celebrate milestone achievements to maintain momentum.',
        ],
        consistency: [
          'Show up every day, even if progress feels small.',
          'Build routines that support your consistency goals.',
          'Track your daily activities to identify patterns.',
          'Use reminders and accountability tools.',
          'Remember that consistency compounds over time.',
        ],
        default: [
          'Stay focused on your goals throughout the month.',
          'Track your progress daily to maintain momentum.',
          'Celebrate milestones along the way.',
          'Adjust your approach if needed, but keep moving forward.',
          'Remember why you started when challenges arise.',
        ],
      },
    },
  },

  // Achievements screen
  achievements: {
    title: 'Trophy Room',
    subtitle: 'Your personal hall of fame',

    // View mode toggle
    viewModeTrophyRoom: '🏠 Trophy Room',
    viewModeBrowseAll: '🏆 Browse All',

    // Loading states
    loadingTitle: 'Loading Trophy Room',
    loadingText: 'Polishing your achievements...',

    // Overview Statistics
    overview: {
      unlockedCount: 'Unlocked',
      totalCount: 'Total',
      completionRate: 'Progress',
      totalXP: 'Total XP',
      recentUnlocks: 'Recent',
      nextToUnlock: 'Coming Up',
      noAchievements: 'No achievements unlocked yet',
      getStarted: 'Start completing habits, writing in your journal, and achieving goals to unlock your first achievement!',
    },
    
    // Categories
    categories: {
      all: 'All',
      habits: 'Habits',
      journal: 'Journal',
      goals: 'Goals',
      consistency: 'Consistency',
      mastery: 'Mastery',
      social: 'Social',
      special: 'Special',
    },
    
    // Rarity levels
    rarity: {
      common: 'Common',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
    },

    // Filtering and Search
    filter: {
      showAll: 'Show All',
      unlockedOnly: 'Unlocked Only',
      lockedOnly: 'Locked Only',
      byCategory: 'By Category',
      byRarity: 'By Rarity',
      searchPlaceholder: 'Search achievements...',
      noResults: 'No achievements found',
      noResultsSubtitle: 'Try adjusting your filters or search criteria',
      clearFilters: 'Clear Filters',
    },

    // Trophy Room Stats
    trophyRoom: {
      totalTrophies: 'Total Trophies',
      collected: 'Collected',
      completionRate: 'Completion Rate',
      overallProgress: 'Overall Progress',
    },
    
    // Sorting
    sort: {
      byName: 'Name',
      byUnlockDate: 'Unlock Date',
      byRarity: 'Rarity',
      byCategory: 'Category',
      byProgress: 'Progress',
      ascending: 'A-Z',
      descending: 'Z-A',
    },

    // Achievement Card
    card: {
      locked: 'Locked',
      unlocked: 'Unlocked',
      unlockedOn: 'Unlocked on {{date}}',
      progress: 'Progress: {{current}}/{{target}}',
      xpReward: '+{{xp}} XP',
      viewDetails: 'View Details',
      almostThere: 'Almost there!',
      keepGoing: 'Keep going!',
      accessibility_label: '{{name}}, {{rarity}} rarity achievement. Status: {{status}}. {{description}}',
      accessibility_hint: 'Tap to view more details about this achievement',
    },

    // Achievement Details Modal
    details: {
      title: 'Achievement Details',
      description: 'Description',
      category: 'Category',
      rarity: 'Rarity',
      xpReward: 'XP Reward',
      unlockCondition: 'How to Unlock',
      progress: 'Your Progress',
      unlockedDate: 'Unlocked Date',
      timeToUnlock: 'Time to Unlock',
      tips: 'Tips',
      close: 'Close',
      shareAchievement: 'Share Achievement',
    },
    
    // Interactive Features
    interactive: {
      celebrationHistory: 'Recent Celebrations',
      achievementSpotlight: 'Achievement Spotlight',
      featuredAchievement: 'Featured Achievement',
      dailyChallenge: 'Today\'s Challenge',
      progressPreview: 'Progress Preview',
      upcomingRewards: 'Upcoming Rewards',
    },
    
    // Statistics Panel
    stats: {
      title: 'Achievement Statistics',
      breakdown: 'Category Breakdown',
      rarityDistribution: 'Rarity Distribution',
      unlockTimeline: 'Unlock Timeline',
      averageTimeToUnlock: 'Avg. Time to Unlock',
      totalXPEarned: 'Total XP from Achievements',
      achievementRate: 'Achievement Rate',
      consistencyScore: 'Consistency Score',
      nextMilestone: 'Next Milestone',
      daysActive: '{{days}} days active',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      allTime: 'All Time',
    },
    
    // Empty States
    empty: {
      noAchievements: 'No Achievements Yet',
      noAchievementsSubtitle: 'Complete your first habit, journal entry, or goal to start earning achievements!',
      noSearchResults: 'No Results Found',
      noSearchResultsSubtitle: 'Try adjusting your search terms or filters.',
      noCategory: 'No achievements in this category yet.',
      noCategorySubtitle: 'Keep using the app and achievements will appear here!',
    },

    // Achievement Spotlight
    spotlight: {
      title: 'Achievement Spotlight',
      titleWithEmoji: '🌟 Achievement Spotlight',
      subtitle: 'Celebrating Your Success',
      emptyTitle: 'Achievement Spotlight',
      emptySubtitle: 'Unlock achievements to see them featured here with inspiring stories!',
      featuredAchievement: '✨ Featured Achievement ✨',
      rotationText: 'Rotates every 30 seconds',

      // Inspirational stories by rarity
      stories: {
        common1: 'Every great journey begins with a single step. This achievement marks the start of your transformation.',
        common2: 'Small victories lead to great triumphs. You\'ve taken an important first step.',
        common3: 'The foundation of success is built one achievement at a time. Well done!',

        rare1: 'Dedication and consistency have brought you here. This achievement reflects your growing commitment.',
        rare2: 'You\'re developing the habits of a champion. This rare achievement proves your determination.',
        rare3: 'Excellence is not an act, but a habit. This achievement shows you\'re building that habit.',

        epic1: 'Extraordinary achievements require extraordinary effort. You\'ve proven you have what it takes.',
        epic2: 'This epic achievement places you among the dedicated few who push beyond their limits.',
        epic3: 'Greatness is not given, it\'s earned. This achievement is proof of your exceptional commitment.',

        legendary1: 'Legends are not born, they are forged through relentless pursuit of excellence. You are legendary.',
        legendary2: 'This achievement represents the pinnacle of dedication. You\'ve joined the ranks of the extraordinary.',
        legendary3: 'History will remember those who dared to be great. This legendary achievement is your mark on eternity.',
      },
    },

    // Achievement Names (will be used for individual achievements)
    names: {
      firstSteps: 'First Steps',
      habitBuilder: 'Habit Builder',
      streakMaster: 'Streak Master',
      deepThinker: 'Deep Thinker',
      goalGetter: 'Goal Getter',
      consistent: 'Consistent',
      dedicated: 'Dedicated',
      perfectMonth: 'Perfect Month',
    },
    
    // Achievement Descriptions (will be used for individual achievements)
    descriptions: {
      firstSteps: 'Created your first habit, journal entry, or goal.',
      habitBuilder: 'Created 5 different habits.',
      streakMaster: 'Maintained a 30-day streak.',
      deepThinker: 'Wrote a journal entry with more than 200 characters.',
      goalGetter: 'Completed your first goal.',
      consistent: 'Used the app for 7 consecutive days.',
      dedicated: 'Used the app for 30 consecutive days.',
      perfectMonth: 'Completed all activities for 30 days.',
    },
    
    // Sharing
    sharing: {
      shareTitle: 'I just unlocked an achievement!',
      shareText: 'Just unlocked "{{name}}" in SelfRise! 🏆 {{description}}',
      shareError: 'Failed to share achievement. Please try again.',
      copySuccess: 'Achievement details copied to clipboard!',
      copyError: 'Failed to copy achievement details.',
    },
    
    // Celebration Modal
    celebration: {
      announcement: '{{rarity}} achievement unlocked: {{name}}! You earned {{xp}} experience points.',
      continue_button: 'Continue',
      continue_hint: 'Close achievement celebration and return to app',
      rarity_common: 'Achievement Unlocked!',
      rarity_rare: 'Rare Achievement!',
      rarity_epic: 'Epic Achievement!',
      rarity_legendary: 'Legendary Achievement!',
      xp_earned: 'XP Earned',
    },

    // Achievement Detail Modal
    detail: {
      unlockedYesterday: 'Unlocked yesterday',
      unlockedDaysAgo: 'Unlocked {{days}} days ago',
      unlockedWeeksAgo: 'Unlocked {{weeks}} weeks ago',
      unlockedRecently: 'Unlocked recently',
      titleUnlocked: 'Achievement Unlocked',
      titleDetails: 'Achievement Details',
      detailsSection: 'Achievement Details',
      progressToUnlock: 'Progress to Unlock',
      howToUnlock: 'How to Unlock',
      lockedMessage: 'This achievement is locked. Keep using the app to unlock it!',
    },

    // Accessibility
    accessibility: {
      achievementCard: 'Achievement card for {{name}}',
      lockedAchievement: 'Locked achievement: {{name}}',
      unlockedAchievement: 'Unlocked achievement: {{name}}, earned on {{date}}',
      progressBar: 'Progress: {{progress}} percent complete',
      categoryFilter: 'Filter by {{category}} category',
      rarityBadge: '{{rarity}} rarity achievement',
      searchInput: 'Search achievements by name or description',
      sortButton: 'Sort achievements by {{criteria}}',
      filterButton: 'Filter achievements',
      viewDetails: 'View details for {{name}} achievement',
    },

    // Individual achievement translations (78 achievements - 156 keys)
    // HABITS ACHIEVEMENTS (8 achievements)
    first_habit: {
      name: 'First Steps',
      description: 'Create your very first habit and begin your journey to self-improvement'
    },
    habit_builder: {
      name: 'Habit Builder',
      description: 'Create 5 different habits to diversify your personal development journey'
    },
    century_club: {
      name: 'Century Club',
      description: 'Complete 100 habit tasks - join the elite ranks of consistent achievers'
    },
    consistency_king: {
      name: 'Consistency King',
      description: 'Complete 1000 habit tasks - you are the master of consistency'
    },
    streak_champion: {
      name: 'Habit Streak Champion',
      description: 'Achieve a 21-day streak with any single habit - building lasting change'
    },
    century_streak: {
      name: 'Century Streak',
      description: 'Maintain a 75-day streak with any habit - approaching legendary status'
    },
    multi_tasker: {
      name: 'Multi-Tasker',
      description: 'Complete 5 different habits in a single day - showing diverse commitment'
    },
    habit_legend: {
      name: 'Habit Legend',
      description: 'Reach Level 50 "Specialist V" with XP earned primarily from habit activities - true mastery'
    },

    // JOURNAL ACHIEVEMENTS (33 achievements)
    first_journal: {
      name: 'First Reflection',
      description: 'Write your first gratitude journal entry and start practicing mindfulness'
    },
    deep_thinker: {
      name: 'Deep Thinker',
      description: 'Write a journal entry with at least 200 characters - show your thoughtfulness'
    },
    journal_enthusiast: {
      name: 'Journal Enthusiast',
      description: 'Write 100 journal entries - you are building a beautiful habit of reflection'
    },
    gratitude_guru: {
      name: 'Gratitude Guru',
      description: 'Achieve a 30-day journal writing streak - you are a master of daily reflection'
    },
    eternal_gratitude: {
      name: 'Eternal Gratitude',
      description: 'Maintain a 100-day journal streak - your gratitude practice is legendary'
    },
    bonus_seeker: {
      name: 'Bonus Seeker',
      description: 'Write 50 bonus journal entries - you go above and beyond in your gratitude practice'
    },
    journal_streaker: {
      name: 'Gratitude Guardian',
      description: 'Write in your journal for 21 consecutive days'
    },
    triple_crown: {
      name: 'Triple Crown',
      description: 'Maintain 7+ day streaks in habits, journal, and goals simultaneously'
    },
    lightning_start: {
      name: 'Lightning Start',
      description: 'Create and complete a habit on the same day 3 times - instant action taker'
    },
    first_star: {
      name: 'First Star',
      description: 'Get your first star (first bonus entry of the day) - discovering expanded gratitude'
    },
    five_stars: {
      name: 'Five Stars',
      description: 'Get a star 5 times total - regular expansion of gratitude practice'
    },
    flame_achiever: {
      name: 'Flame Achiever',
      description: 'Get your first flame (5 bonuses in one day) - a day of intensive gratitude and reflection'
    },
    bonus_week: {
      name: 'Bonus Week',
      description: 'At least 1 bonus every day for 7 days in a row - a week of consistent expanded practice'
    },
    crown_royalty: {
      name: 'Crown Royalty',
      description: 'Get your first crown (10 bonuses in one day) - pinnacle day of reflection with royal status'
    },
    flame_collector: {
      name: 'Flame Collector',
      description: 'Get flames 5 times total - master of intensive gratitude days'
    },
    golden_bonus_streak: {
      name: 'Golden Bonus Streak',
      description: 'At least 3 bonuses every day for 7 days in a row - a week of deep and expanded reflection'
    },
    triple_crown_master: {
      name: 'Triple Crown Master',
      description: 'Get crowns 3 times total - legendary master of royal reflection days'
    },
    bonus_century: {
      name: 'Bonus Century',
      description: 'Write 200 bonus entries total - ultimate master of expanded gratitude practice'
    },
    star_beginner: {
      name: 'Star Beginner',
      description: 'Get stars 10 times total - beginning collector of bonus experiences'
    },
    star_collector: {
      name: 'Star Collector',
      description: 'Get stars 25 times total - regular expander of gratitude practice'
    },
    star_master: {
      name: 'Star Master',
      description: 'Get stars 50 times total - master of expanded daily reflection'
    },
    star_champion: {
      name: 'Star Champion',
      description: 'Get stars 100 times total - champion of long-term expanded practice'
    },
    star_legend: {
      name: 'Star Legend',
      description: 'Get stars 200 times total - legendary master of bonus experiences'
    },
    flame_starter: {
      name: 'Flame Starter',
      description: 'Get flames 5 times total - beginning master of intensive days'
    },
    flame_accumulator: {
      name: 'Flame Accumulator',
      description: 'Get flames 10 times total - collector of exceptional gratitude days'
    },
    flame_master: {
      name: 'Flame Master',
      description: 'Get flames 25 times total - master of systematic intensive days'
    },
    flame_champion: {
      name: 'Flame Champion',
      description: 'Get flames 50 times total - champion of deep daily reflection'
    },
    flame_legend: {
      name: 'Flame Legend',
      description: 'Get flames 100 times total - legendary master of intensive gratitude practice'
    },
    crown_achiever: {
      name: 'Crown Achiever',
      description: 'Get crowns 3 times total - achieve royal reflection days'
    },
    crown_collector: {
      name: 'Crown Collector',
      description: 'Get crowns 5 times total - collector of royal gratitude experiences'
    },
    crown_master: {
      name: 'Crown Master',
      description: 'Get crowns 10 times total - master of royal-level reflection'
    },
    crown_champion: {
      name: 'Crown Champion',
      description: 'Get crowns 25 times total - champion of royal gratitude days'
    },
    crown_emperor: {
      name: 'Crown Emperor',
      description: 'Get crowns 50 times total - imperial status in deep reflection practice'
    },

    // GOALS ACHIEVEMENTS (8 achievements)
    first_goal: {
      name: 'First Vision',
      description: 'Set your first goal and define where you want your journey to lead'
    },
    goal_getter: {
      name: 'Goal Getter',
      description: 'Complete your first goal - you turn dreams into reality'
    },
    goal_champion: {
      name: 'Goal Champion',
      description: 'Complete 5 goals - you are becoming a master of achievement'
    },
    ambitious: {
      name: 'Ambitious',
      description: 'Set a goal with target value of 1000 or more - you dream big'
    },
    progress_tracker: {
      name: 'Progress Tracker',
      description: 'Make progress on goals for 7 consecutive days - consistency leads to success'
    },
    mega_dreamer: {
      name: 'Mega Dreamer',
      description: 'Set a goal with target value of 1,000,000 or more - you dream in millions'
    },
    million_achiever: {
      name: 'Million Achiever',
      description: 'Complete a goal with target value of 1,000,000 or more - you turn massive dreams into reality'
    },
    goal_achiever: {
      name: 'Dream Fulfiller',
      description: 'Complete 3 goals - you turn dreams into reality'
    },

    // CONSISTENCY ACHIEVEMENTS (6 achievements)
    weekly_warrior: {
      name: 'Weekly Warrior',
      description: 'Maintain a 7-day streak in any habit - prove your dedication'
    },
    monthly_master: {
      name: 'Monthly Master',
      description: 'Achieve a 30-day streak - you are truly building lasting habits'
    },
    hundred_days: {
      name: 'Centurion',
      description: 'Reach 100 days of consistency - join the elite ranks of habit masters'
    },
    daily_visitor: {
      name: 'Daily Visitor',
      description: 'Use the app for 7 consecutive days - building a healthy habit'
    },
    dedicated_user: {
      name: 'Dedicated User',
      description: 'Use the app for 30 consecutive days - your commitment is inspiring'
    },
    perfect_month: {
      name: 'Perfect Month',
      description: 'Complete activities in all 3 areas (habits, journal, goals) for 28+ days in any month'
    },

    // MASTERY ACHIEVEMENTS (9 achievements)
    level_up: {
      name: 'Level Up',
      description: 'Reach level 10 "Beginner V" - you are growing stronger'
    },
    selfrise_expert: {
      name: 'SelfRise Expert',
      description: 'Reach level 25 "Adept V" - you have mastered the fundamentals'
    },
    selfrise_master: {
      name: 'SelfRise Master',
      description: 'Reach level 50 "Specialist V" - you are a true master of self-improvement'
    },
    recommendation_master: {
      name: 'Recommendation Master',
      description: 'Follow 20 personalized recommendations from the For You section'
    },
    balance_master: {
      name: 'Balance Master',
      description: 'Use all 3 features (habits, journal, goals) in a single day 10 times'
    },
    trophy_collector_basic: {
      name: 'Trophy Collector',
      description: 'Unlock 10 achievements - you are building an impressive collection'
    },
    trophy_collector_master: {
      name: 'Trophy Master',
      description: 'Unlock 25 achievements - your trophy room is legendary'
    },
    ultimate_selfrise_legend: {
      name: 'Ultimate SelfRise Legend',
      description: 'Reach level 100 "Mythic V" - you have achieved the ultimate mastery of self-improvement'
    },
    loyalty_ultimate_veteran: {
      name: 'Ultimate Veteran',
      description: '500 active days total - your dedication is unmatched'
    },

    // SPECIAL ACHIEVEMENTS (14 achievements)
    grateful_heart: {
      name: 'Grateful Heart',
      description: 'Maintain a 7-day journal writing streak - consistency builds gratitude'
    },
    achievement_unlocked: {
      name: 'Achievement Unlocked',
      description: 'Complete 10 goals - you are a legendary goal achiever'
    },
    seven_wonder: {
      name: 'Seven Wonder',
      description: 'Have 7 or more active habits at the same time - master of organization'
    },
    persistence_pays: {
      name: 'Persistence Pays',
      description: 'Resume activity after a 3+ day break and complete 7 activities - comeback champion'
    },
    legendary_master: {
      name: 'SelfRise Legend',
      description: 'Achieve mastery in all areas: 10 goals completed, 500 habits done, 365 journal entries'
    },
    loyalty_first_week: {
      name: 'First Week',
      description: '7 active days total - beginning of your loyalty journey'
    },
    loyalty_two_weeks_strong: {
      name: 'Two Weeks Strong',
      description: '14 active days total - your dedication grows'
    },
    loyalty_three_weeks_committed: {
      name: 'Three Weeks Committed',
      description: '21 active days total - committed to your growth'
    },
    loyalty_month_explorer: {
      name: 'Month Explorer',
      description: '30 active days total - exploring your potential'
    },
    loyalty_two_month_veteran: {
      name: 'Two Month Veteran',
      description: '60 active days total - experienced in personal growth'
    },
    loyalty_century_user: {
      name: 'Century User',
      description: '100 active days total - among the elite users'
    },
    loyalty_half_year_hero: {
      name: 'Half Year Hero',
      description: '183 active days total - your commitment is legendary'
    },
    loyalty_year_legend: {
      name: 'Year Legend',
      description: '365 active days total - you have reached legendary status'
    },
    loyalty_master: {
      name: 'Loyalty Master',
      description: '1000 active days total - you have achieved ultimate loyalty'
    },

    // Achievement Progress Preview Hints (245+ keys for progress tracking)
    preview: {
      // Default fallback
      default: {
        progress: 'Progress towards this achievement',
        action: 'Use the app features to unlock this achievement!'
      },

      // HABITS ACHIEVEMENTS (8 achievements = 24 keys)
      first_habit: {
        progress_incomplete: 'Create your first habit to begin!',
        progress_complete: '✅ First habit created!',
        requirement: 'Create your very first habit',
        action: 'Go to Habits tab and create your first habit!'
      },
      habit_builder: {
        progress: 'Create 5 habits ({{current}}/{{target}})',
        requirement: 'Create 5 different habits to diversify development',
        action: 'Create more habits to diversify your growth!'
      },
      century_club: {
        progress: 'Complete 100 habits ({{current}}/{{target}})',
        requirement: 'Complete 100 habit tasks total',
        action: 'Keep completing your daily habits!'
      },
      consistency_king: {
        progress: 'Complete 1000 habits ({{current}}/{{target}})',
        requirement: 'Complete 1000 habit tasks total',
        action: 'You\'re building amazing consistency!'
      },
      streak_champion: {
        progress: 'Achieve 21-day streak (best: {{current}} days)',
        requirement: 'Achieve a 21-day streak with any single habit',
        action: 'Focus on consistency with one habit!'
      },
      century_streak: {
        progress: 'Achieve 75-day streak (best: {{current}} days)',
        requirement: 'Maintain a 75-day streak with any habit',
        action: 'Incredible dedication! Keep the streak alive!'
      },
      multi_tasker: {
        progress: 'Complete 5 habits in one day (best: {{current}})',
        requirement: 'Complete 5 different habits in a single day',
        action: 'Challenge yourself with multiple habits today!'
      },
      habit_legend: {
        progress: 'Reach Level 50 with 50%+ XP from habits (Level {{level}}, {{xpPercent}}% habit XP)',
        requirement: 'Reach Level 50 with 50%+ XP from habit activities',
        action: 'Focus on habit activities to boost your XP ratio!'
      },

      // JOURNAL ACHIEVEMENTS - Basic (8 achievements = 24 keys)
      first_journal: {
        progress_incomplete: 'Write your first gratitude entry!',
        progress_complete: '✅ First reflection completed!',
        requirement: 'Write your first gratitude journal entry',
        action: 'Go to Journal tab and write your first entry!'
      },
      deep_thinker: {
        progress_checking: 'Checking your thoughtful entries...',
        requirement: 'Write a journal entry with at least 200 characters',
        action: 'Express yourself fully in your next journal entry!'
      },
      journal_enthusiast: {
        progress: 'Write 100 journal entries ({{current}}/{{target}})',
        requirement: 'Write 100 journal entries total',
        action: 'Keep expressing gratitude daily!'
      },
      grateful_heart: {
        progress: 'Maintain 7-day streak (current: {{current}} days)',
        requirement: 'Maintain a 7-day journal writing streak',
        action: 'Keep your streak alive with daily entries!'
      },
      journal_streaker: {
        progress: 'Achieve 21-day streak (best: {{current}} days)',
        requirement: 'Write in your journal for 21 consecutive days',
        action: 'Building a strong gratitude habit!'
      },
      gratitude_guru: {
        progress: 'Achieve 30-day streak (best: {{current}} days)',
        requirement: 'Achieve a 30-day journal writing streak',
        action: 'You\'re becoming a gratitude master!'
      },
      eternal_gratitude: {
        progress: 'Achieve 100-day streak (best: {{current}} days)',
        requirement: 'Maintain a 100-day journal streak',
        action: 'Incredible dedication to gratitude!'
      },
      bonus_seeker: {
        progress: 'Write 50 bonus entries ({{current}}/{{target}})',
        requirement: 'Write 50 bonus journal entries',
        action: 'Go beyond the daily minimum with bonus entries!'
      },

      // JOURNAL BONUS ACHIEVEMENTS - Basic (9 achievements = 27 keys)
      first_star: {
        progress_incomplete: 'Get your first ⭐ bonus milestone!',
        progress_complete: '✅ First star earned!',
        requirement: 'Write your first bonus journal entry to get a star',
        action: 'Write 4+ journal entries today to earn your first ⭐!'
      },
      five_stars: {
        progress: 'Earn 5 stars total ({{current}}/{{target}})',
        requirement: 'Earn ⭐ milestone 5 times total',
        action: 'Keep writing bonus entries to earn more stars!'
      },
      flame_achiever: {
        progress_incomplete: 'Get your first 🔥 flame milestone!',
        progress_complete: '✅ First flame earned!',
        requirement: 'Write 5+ bonus entries in one day to earn a flame',
        action: 'Challenge yourself with 8+ journal entries in one day!'
      },
      bonus_week: {
        progress: 'Bonus streak 7 days ({{current}}/{{target}})',
        requirement: 'Write at least 1 bonus entry for 7 consecutive days',
        action: 'Write 4+ entries daily to maintain your bonus streak!'
      },
      crown_royalty: {
        progress_incomplete: 'Get your first 👑 crown milestone!',
        progress_complete: '✅ First crown earned!',
        requirement: 'Write 10+ bonus entries in one day to earn a crown',
        action: 'Go for royal status with 13+ journal entries in one day!'
      },
      flame_collector: {
        progress: 'Collect 5 flames total ({{current}}/{{target}})',
        requirement: 'Earn 🔥 milestone 5 times total',
        action: 'Keep having intense gratitude days with 5+ bonus entries!'
      },
      golden_bonus_streak: {
        progress: 'Golden bonus streak 7 days ({{current}}/{{target}})',
        requirement: 'Write 3+ bonus entries daily for 7 consecutive days',
        action: 'Write 6+ entries daily for the ultimate bonus streak!'
      },
      triple_crown_master: {
        progress: 'Earn 3 crowns total ({{current}}/{{target}})',
        requirement: 'Earn 👑 milestone 3 times total',
        action: 'Master the art of royal gratitude days!'
      },
      bonus_century: {
        progress: 'Write 200 bonus entries ({{current}}/{{target}})',
        requirement: 'Write 200 bonus journal entries total',
        action: 'Ultimate bonus mastery - keep writing beyond the minimum!'
      },

      // JOURNAL BONUS - Star Milestones (5 achievements = 15 keys)
      star_beginner: {
        progress: 'Earn 10 stars total ({{current}}/{{target}})',
        requirement: 'Earn ⭐ milestone 10 times total',
        action: 'Build your collection of bonus days!'
      },
      star_collector: {
        progress: 'Earn 25 stars total ({{current}}/{{target}})',
        requirement: 'Earn ⭐ milestone 25 times total',
        action: 'You\'re becoming a star collector!'
      },
      star_master: {
        progress: 'Earn 50 stars total ({{current}}/{{target}})',
        requirement: 'Earn ⭐ milestone 50 times total',
        action: 'Star mastery in sight - keep earning bonus milestones!'
      },
      star_champion: {
        progress: 'Earn 75 stars total ({{current}}/{{target}})',
        requirement: 'Earn ⭐ milestone 75 times total',
        action: 'You\'re a true star champion!'
      },
      star_legend: {
        progress: 'Earn 100 stars total ({{current}}/{{target}})',
        requirement: 'Earn ⭐ milestone 100 times total',
        action: 'Legendary star collector status - you\'re unstoppable!'
      },

      // JOURNAL BONUS - Flame Milestones (5 achievements = 15 keys)
      flame_starter: {
        progress: 'Earn 10 flames total ({{current}}/{{target}})',
        requirement: 'Earn 🔥 milestone 10 times total',
        action: 'Keep having those intense journaling days!'
      },
      flame_accumulator: {
        progress: 'Earn 20 flames total ({{current}}/{{target}})',
        requirement: 'Earn 🔥 milestone 20 times total',
        action: 'Your flame collection is growing!'
      },
      flame_master: {
        progress: 'Earn 35 flames total ({{current}}/{{target}})',
        requirement: 'Earn 🔥 milestone 35 times total',
        action: 'Master of intense gratitude sessions!'
      },
      flame_champion: {
        progress: 'Earn 50 flames total ({{current}}/{{target}})',
        requirement: 'Earn 🔥 milestone 50 times total',
        action: 'You\'re a flame champion!'
      },
      flame_legend: {
        progress: 'Earn 75 flames total ({{current}}/{{target}})',
        requirement: 'Earn 🔥 milestone 75 times total',
        action: 'Legendary flame status - your dedication is inspiring!'
      },

      // JOURNAL BONUS - Crown Milestones (5 achievements = 15 keys)
      crown_achiever: {
        progress: 'Earn 5 crowns total ({{current}}/{{target}})',
        requirement: 'Earn 👑 milestone 5 times total',
        action: 'You\'re achieving royal gratitude status!'
      },
      crown_collector: {
        progress: 'Earn 10 crowns total ({{current}}/{{target}})',
        requirement: 'Earn 👑 milestone 10 times total',
        action: 'Building your crown collection!'
      },
      crown_master: {
        progress: 'Earn 15 crowns total ({{current}}/{{target}})',
        requirement: 'Earn 👑 milestone 15 times total',
        action: 'Master of royal journaling days!'
      },
      crown_champion: {
        progress: 'Earn 25 crowns total ({{current}}/{{target}})',
        requirement: 'Earn 👑 milestone 25 times total',
        action: 'You\'re a crown champion!'
      },
      crown_emperor: {
        progress: 'Earn 40 crowns total ({{current}}/{{target}})',
        requirement: 'Earn 👑 milestone 40 times total',
        action: 'Imperial status achieved - you are gratitude royalty!'
      },

      // GOALS ACHIEVEMENTS (8 achievements = 24 keys)
      first_goal: {
        progress_incomplete: 'Create your first goal to start!',
        progress_complete: '✅ First goal created!',
        requirement: 'Create your very first goal',
        action: 'Go to Goals tab and set your first goal!'
      },
      goal_getter: {
        progress: 'Create 5 goals ({{current}}/{{target}})',
        requirement: 'Create 5 different goals',
        action: 'Set more goals to expand your ambitions!'
      },
      goal_achiever: {
        progress: 'Complete 5 goals ({{current}}/{{target}})',
        requirement: 'Complete 5 goals total',
        action: 'Keep completing your goals!'
      },
      goal_champion: {
        progress: 'Complete 20 goals ({{current}}/{{target}})',
        requirement: 'Complete 20 goals total',
        action: 'You\'re a goal-achieving champion!'
      },
      achievement_unlocked: {
        progress_incomplete: 'Complete your first goal!',
        progress_complete: '✅ First goal completed!',
        requirement: 'Complete your first goal',
        action: 'Make progress on your active goals!'
      },
      ambitious: {
        progress_incomplete: 'Create a goal with 1000+ target value!',
        progress_complete: '✅ Large goal created!',
        requirement: 'Create a goal with target value of 1000 or more',
        action: 'Think big and set an ambitious goal!'
      },
      progress_tracker: {
        progress: 'Update goal progress for 10 days ({{current}}/{{target}})',
        requirement: 'Update goal progress for 10 consecutive days',
        action: 'Keep tracking your daily goal progress!'
      },
      goal_explorer: {
        progress: 'Create goals in 3 categories ({{current}}/{{target}})',
        requirement: 'Create goals in 3 different categories',
        action: 'Diversify your goals across categories!'
      },

      // CONSISTENCY ACHIEVEMENTS (8 achievements = 24 keys)
      weekly_warrior: {
        progress: 'Use app for 7 days ({{current}}/{{target}})',
        requirement: 'Use the app for 7 consecutive days',
        action: 'Keep your daily streak alive!'
      },
      monthly_master: {
        progress: 'Use app for 30 days ({{current}}/{{target}})',
        requirement: 'Use the app for 30 consecutive days',
        action: 'You\'re building incredible consistency!'
      },
      hundred_days: {
        progress: 'Use app for 100 days ({{current}}/{{target}})',
        requirement: 'Use the app for 100 consecutive days',
        action: 'Legendary consistency - keep going!'
      },
      daily_visitor: {
        progress: 'Open app {{current}} times',
        requirement: 'Open the app regularly for {{target}} days total',
        action: 'Make the app part of your daily routine!'
      },
      dedicated_user: {
        progress: '{{current}} total active days',
        requirement: 'Be active for {{target}} total days (not consecutive)',
        action: 'Keep coming back and growing!'
      },
      perfect_month: {
        progress: 'Perfect days this month: {{current}}/{{target}}',
        requirement: 'Complete all three activity types every day for 30 days',
        action: 'Complete habits, journal, and goals daily!'
      },
      triple_crown: {
        progress_incomplete: 'Complete habits, journal, and goals today!',
        progress_complete: '✅ Triple crown earned!',
        requirement: 'Complete at least one habit, journal entry, and goal progress in one day',
        action: 'Do all three activity types today for the crown!'
      },
      balance_master: {
        progress: 'Balanced days: {{current}}/{{target}}',
        requirement: 'Use all three features (habits, journal, goals) in one day, {{target}} times total',
        action: 'Keep balancing all areas of growth!'
      },

      // MASTERY ACHIEVEMENTS (9 achievements = 27 keys)
      level_up: {
        progress: 'Reach Level 10 (current: Level {{current}})',
        requirement: 'Reach Level 10',
        action: 'Keep earning XP through activities!'
      },
      selfrise_expert: {
        progress: 'Reach Level 25 (current: Level {{current}})',
        requirement: 'Reach Level 25',
        action: 'You\'re becoming a SelfRise expert!'
      },
      selfrise_master: {
        progress: 'Reach Level 50 (current: Level {{current}})',
        requirement: 'Reach Level 50',
        action: 'Master level approaching - keep growing!'
      },
      ultimate_selfrise_legend: {
        progress: 'Reach Level 100 (current: Level {{current}})',
        requirement: 'Reach the maximum Level 100',
        action: 'The ultimate achievement - legendary status awaits!'
      },
      trophy_collector_basic: {
        progress: 'Unlock 10 achievements ({{current}}/{{target}})',
        requirement: 'Unlock 10 achievements total',
        action: 'Keep unlocking achievements across all categories!'
      },
      trophy_collector_master: {
        progress: 'Unlock 30 achievements ({{current}}/{{target}})',
        requirement: 'Unlock 30 achievements total',
        action: 'Master collector status - find all achievements!'
      },
      recommendation_master: {
        progress: 'Follow {{current}} recommendations',
        requirement: 'Follow {{target}} personalized recommendations',
        action: 'Check the Recommendations section and follow the guidance!'
      },
      balance_master_alt: {
        progress: 'Balanced days: {{current}}/{{target}}',
        requirement: 'Use habits, journal, and goals in one day for {{target}} days',
        action: 'Keep using all three features daily!'
      },
      harmony_streak: {
        progress: 'Current harmony streak: {{current}} days',
        requirement: 'Maintain harmony (all features) for {{target}} consecutive days',
        action: 'Complete habits, journal, and goals every day!'
      },

      // SPECIAL ACHIEVEMENTS (14 achievements = 42 keys)
      lightning_start: {
        progress: 'Quick starts: {{current}}/{{target}}',
        requirement: 'Create and complete a habit on the same day ({{target}} times)',
        action: 'Create a habit and complete it today!'
      },
      seven_wonder: {
        progress: 'Active habits: {{current}}/{{target}}',
        requirement: 'Have {{target}} active habits simultaneously',
        action: 'Create more habits to reach {{target}} active habits!'
      },
      persistence_pays: {
        progress: 'Comebacks: {{current}}/{{target}}',
        requirement: 'Return to the app after 7+ days of inactivity ({{target}} times)',
        action: 'Even if you take a break, coming back is what matters!'
      },
      legendary_master: {
        progress: '{{current}}% towards legendary status',
        requirement: 'Complete all major milestones across all categories',
        action: 'Master every aspect of SelfRise to achieve legendary status!'
      },

      // Loyalty Achievements (10 achievements = 30 keys)
      loyalty_first_week: {
        progress: 'Active days: {{current}}/{{target}}',
        requirement: '7 active days total',
        action: 'Keep using the app daily!'
      },
      loyalty_two_weeks_strong: {
        progress: 'Active days: {{current}}/{{target}}',
        requirement: '14 active days total',
        action: 'Your commitment is growing!'
      },
      loyalty_three_weeks_committed: {
        progress: 'Active days: {{current}}/{{target}}',
        requirement: '21 active days total',
        action: 'Three weeks of dedication!'
      },
      loyalty_month_explorer: {
        progress: 'Active days: {{current}}/{{target}}',
        requirement: '30 active days total',
        action: 'Exploring your potential!'
      },
      loyalty_two_month_veteran: {
        progress: 'Active days: {{current}}/{{target}}',
        requirement: '60 active days total',
        action: 'Experienced in personal growth!'
      },
      loyalty_century_user: {
        progress: 'Active days: {{current}}/{{target}}',
        requirement: '100 active days total',
        action: 'Elite user status approaching!'
      },
      loyalty_half_year_hero: {
        progress: 'Active days: {{current}}/{{target}}',
        requirement: '183 active days total',
        action: 'Your commitment is legendary!'
      },
      loyalty_year_legend: {
        progress: 'Active days: {{current}}/{{target}})',
        requirement: '365 active days total',
        action: 'Legendary status within reach!'
      },
      loyalty_ultimate_veteran: {
        progress: 'Active days: {{current}}/{{target}}',
        requirement: '500 active days total',
        action: 'Ultimate dedication!'
      },
      loyalty_master: {
        progress: 'Active days: {{current}}/{{target}}',
        requirement: '1000 active days total',
        action: 'Master of loyalty - you are unstoppable!'
      },
    },
  },

  // Settings screen
  settings: {
    title: 'Settings',

    // Appearance
    appearance: 'Appearance',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System Auto',
    themeDescription: 'Choose your preferred color scheme',
    themeSystemDescription: 'Matches your device settings',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    systemAuto: 'System Auto',
    systemAutoDescription: 'Matches your device settings',

    // Language
    language: 'Language',
    languageDescription: 'Select your preferred language',
    languageEnglish: 'English',
    languageGerman: 'Deutsch',
    languageSpanish: 'Español',

    // Notifications
    notifications: 'Notifications',
    morningNotification: 'Morning Notification',
    eveningNotification: 'Evening Notification',
    notificationSettings: {
      errors: {
        loadFailed: 'Failed to load notification settings',
        permissionsTitle: 'Permissions Required',
        permissionsMessage: 'Notification permissions are needed to send you reminders. You can enable them in system settings.',
        permissionsFailed: 'Failed to request notification permissions',
        settingsFailed: 'Failed to open system settings',
        afternoonUpdateFailed: 'Failed to update afternoon reminder',
        eveningUpdateFailed: 'Failed to update evening reminder',
        afternoonTimeFailed: 'Failed to update afternoon reminder time',
        eveningTimeFailed: 'Failed to update evening reminder time',
      },
      buttons: {
        openSettings: 'Open Settings',
      },
    },

    // Analytics
    habitAnalytics: 'Habit Analytics',
    individualHabitStats: 'Individual Habit Stats',

    // Account
    account: 'Account',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',

    // About
    about: 'About',
    version: 'Version',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',

    // Tutorial & Onboarding
    tutorial: 'Tutorial',
    tutorialReset: 'Restart Tutorial',
    tutorialResetDescription: 'Restart the tutorial from the beginning',
    tutorialResetConfirmTitle: 'Restart Tutorial?',
    tutorialResetConfirmMessage: 'This will restart the tutorial from the beginning and guide you through the app again. This action cannot be undone.',
    tutorialResetSuccess: 'Tutorial has been restarted successfully! You are now being guided through the app.',

    // Common
    cancel: 'Cancel',
    reset: 'Restart',
    success: 'Success',
    errorTitle: 'Error',
    resetting: 'Resetting...',
  },
  
  // Auth screens
  auth: {
    login: {
      title: 'Welcome Back',
      email: 'Email',
      emailPlaceholder: 'Enter your email...',
      password: 'Password',
      passwordPlaceholder: 'Enter your password...',
      loginButton: 'Login',
      forgotPassword: 'Forgot Password?',
      noAccount: 'Don\'t have an account?',
      signUp: 'Sign Up',
    },
    register: {
      title: 'Create Account',
      displayName: 'Display Name',
      displayNamePlaceholder: 'Enter your name...',
      email: 'Email',
      emailPlaceholder: 'Enter your email...',
      password: 'Password',
      passwordPlaceholder: 'Enter your password...',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm your password...',
      registerButton: 'Register',
      hasAccount: 'Already have an account?',
      signIn: 'Sign In',
    },
  },

  // Gamification System
  gamification: {
    // XP System
    xp: {
      label: 'Experience Points',
      short: 'XP',
      gained: 'XP Gained',
      lost: 'XP Lost',
      total: 'Total XP',
      loading: 'Loading XP...',
      
      // Sources
      sources: {
        habit_completion: 'Habit Completion',
        habit_bonus: 'Habit Bonus',
        journal_entry: 'Journal Entry',
        journal_bonus: 'Journal Bonus',
        journal_bonus_milestone: 'Journal Bonus Milestone', 
        goal_progress: 'Goal Progress',
        goal_completion: 'Goal Completion',
        habit_streak_milestone: 'Habit Streak Milestone',
        journal_streak_milestone: 'Journal Streak Milestone',
        achievement_unlock: 'Achievement Unlock',
        general_activity: 'Activity',
        daily_engagement: 'Daily Engagement',
        monthly_challenge: 'Monthly Challenge',
        XP_MULTIPLIER_BONUS: 'Comeback Bonus',
      },
      
      // Notifications and Announcements
      notification: {
        message: 'Experience points notification: {{message}}',
        amount: 'Experience points {{type}}: {{amount}}',
      },
      
      announcement: {
        balanced: 'No net experience points gained or lost from recent activities',
        decreased: 'Lost {{xp}} experience points from recent activities',
        single: 'Gained {{xp}} experience points from completing {{count}} {{source}}',
        multiple_same: 'Gained {{xp}} experience points from completing {{count}} {{source}}',
        multiple_mixed: 'Gained {{xp}} experience points from completing multiple activities',
      },
      
      // Popup animations
      popup: {
        gained: 'Gained {{amount}} experience points from {{source}}',
        lost: 'Lost {{amount}} experience points from {{source}}',
        amount_label: '{{sign}} {{amount}} experience points',
      },
    },

    // Progress and Levels
    progress: {
      level: 'Level',
      progress: 'Progress',
      to_next_level: 'to Level {{level}}',
      xp_remaining: '{{xp}} XP remaining',
      loading: 'Loading XP...',
      
      accessibility: {
        label: 'Experience level {{currentLevel}}, {{levelTitle}}. {{progress}} percent progress to level {{nextLevel}}. {{xpRemaining}} experience points remaining.{{#isMilestone}} This is a milestone level.{{/isMilestone}}',
        hint: 'Your current experience level and progress toward the next level.{{#isMilestone}} You have reached a special milestone level with unique rewards.{{/isMilestone}}',
      },
      
      badge: {
        accessibility: 'Level {{currentLevel}} badge, {{levelTitle}}{{#isMilestone}}, milestone level{{/isMilestone}}',
      },
      
      bar: {
        accessibility: 'Experience progress bar, {{progress}} percent complete',
      },
      
      milestone: {
        accessibility: 'Milestone level indicator',
      },
    },

    // Level System
    levels: {
      current: 'Current Level',
      next: 'Next Level',
      milestone: 'Milestone Level',
      rewards: 'Level Rewards',
      title: 'Level Title',
      description: 'Level Description',

      // Level Overview Screen
      overview: {
        currentBadge: 'Current',
        xpRequiredSuffix: 'XP required',
        rarity: {
          mythic: 'Mythic',
          legendary: 'Legendary',
          epic: 'Epic',
          rare: 'Rare',
          growing: 'Growing',
          beginner: 'Beginner',
        },
      },
    },

    // Effects and Celebrations
    effects: {
      level_up: 'Level up celebration',
      milestone: 'Milestone achievement celebration',
      achievement: 'Achievement unlock celebration',
      celebration: 'General celebration',
      general: 'Celebration effects',
      accessibility_label: '{{type}} with {{intensity}} intensity particle effects',
    },

    // Celebration Modals
    celebration: {
      level_up_announcement: 'Congratulations! You have reached level {{level}}{{#isMilestone}}, a milestone level{{/isMilestone}}!',
      level_up_modal: 'Level {{level}} achievement{{#isMilestone}} milestone{{/isMilestone}} celebration',
      level_up_section_accessibility: 'Level {{level}} achievement{{#isMilestone}} milestone{{/isMilestone}} details',
      level_badge_accessibility: 'Level {{level}}{{#isMilestone}} milestone{{/isMilestone}} badge',
      level_title_accessibility: 'Level title: {{title}}',
      rewards_section_accessibility: 'New rewards list with {{count}} items',
      rewards_title: 'New Rewards:',
      reward_item_accessibility: 'Reward {{index}}: {{reward}}',
      continue_button_accessibility: 'Continue and close celebration',
      continue_button_hint: 'Tap to close this celebration and return to the app',
      
      emoji: {
        daily_complete: 'Party celebration emoji',
        streak_milestone: 'Trophy celebration emoji',
        bonus_milestone: 'Star celebration emoji',
        level_up: 'Level up celebration emoji',
      },
    },

    // XP Multiplier
    multiplier: {
      continue: 'Continue',
      harmonyActivated: 'Harmony Streak Activated!',
      achievementUnlocked: '🎯 Achievement Unlocked!',
      harmonyStreakLabel: 'Day Harmony Streak',
      bonusXP: 'Bonus XP',
      duration: 'Multiplier Duration',
      activated: '🚀 MULTIPLIER ACTIVATED!',
      activateButton: 'Activate 2x XP',
      duration24h: '24 hours',
    },

    analysis: {
      title: 'Performance Analysis',
      overallRating: 'Overall Rating',
      trend: 'Trend',
      successRate: 'Success Rate',
      strongest: 'Strongest',
    },

    // Achievement System
    achievement: {
      unlocked: 'Achievement Unlocked!',
      locked: 'Locked Achievement',
      progress: 'Progress: {{current}}/{{target}}',
      xp_reward: '+{{xp}} XP',
      requirements: 'Requirements',
      unlock_condition: 'Unlock Condition',

      announcement: {
        unlocked: 'Achievement unlocked: {{name}}! You earned {{xp}} experience points.',
      },
    },

    // Sources with icon descriptions for accessibility
    sources: {
      habit_completion: {
        icon_description: 'Running person icon representing habit completion',
      },
      habit_bonus: {
        icon_description: 'Running person icon representing habit bonus',
      },
      journal_entry: {
        icon_description: 'Writing icon representing journal entry',
      },
      journal_bonus: {
        icon_description: 'Writing icon representing journal bonus',
      },
      journal_bonus_milestone: {
        icon_description: 'Star icon representing journal bonus milestone achievement',
      },
      goal_progress: {
        icon_description: 'Target icon representing goal progress',
      },
      goal_completion: {
        icon_description: 'Target icon representing goal completion',
      },
      goal_milestone: {
        icon_description: 'Star icon representing goal milestone',
      },
      habit_streak_milestone: {
        icon_description: 'Fire icon representing habit streak milestone',
      },
      journal_streak_milestone: {
        icon_description: 'Fire icon representing journal streak milestone',
      },
      achievement_unlock: {
        icon_description: 'Trophy icon representing achievement unlock',
      },
      weekly_challenge: {
        icon_description: 'Trophy icon representing weekly challenge completion',
      },
      general_activity: {
        icon_description: 'Sparkles icon representing general activity',
      },
      monthly_challenge: {
        icon_description: 'Calendar icon representing monthly challenge progress',
      },
      XP_MULTIPLIER_BONUS: {
        icon_description: 'Lightning bolt icon representing comeback bonus multiplier',
      },
    },
  },

  // Days of week
  days: {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    short: {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    },
  },

  // Help system
  help: {
    // Habits screen help
    habits: {
      scheduling: {
        title: 'Habit Scheduling',
        content: 'You\'re in control! Choose which days your habit should be active. Want daily motivation? Go for every day! Prefer weekdays only? You got it! Custom scheduling gives you the freedom to build habits that actually fit your life.'
      },
      bonusConversion: {
        title: 'Bonus Conversion',
        content: 'Going above and beyond? We love that energy! 🔥 When you complete more than your daily goal, those extra efforts turn into bonus XP. It\'s our way of celebrating your amazing dedication!'
      },
      streakTracking: {
        title: 'Habit Streaks',
        content: 'Build incredible streaks by completing your habits day after day! 📅 Watch your numbers grow and feel that momentum building. Plus, you\'ll unlock awesome achievements at major milestones!'
      },
      colorAndIcon: {
        title: 'Habit Customization',
        content: 'Make it yours! Pick colors and icons that speak to you. 🎨 When your habits look amazing, you\'ll actually want to check them off. It\'s like having a personal dashboard that motivates you every day!'
      },
      makeupFunction: {
        title: 'Smart Make-up System',
        content: 'Life happens, and we\'ve got your back! ✨ When you miss a scheduled day, any bonus completions you earn can automatically convert to "make-up" that day. Look for the golden checkmark ✓ in your calendar - it means you recovered a missed day with your extra effort!'
      }
    },

    // Journal screen help
    journal: {
      gratitudeStreak: {
        title: 'Gratitude Streak',
        content: 'You\'re building something beautiful! ✨ Each day you write gratitude entries, your streak grows stronger. Just 3 entries daily keeps your momentum going and unlocks amazing celebration milestones!'
      },
      selfRiseStreak: {
        title: 'SelfRise Streak',
        content: 'This is your overall growth journey! 🌱 To keep your streak going, write at least 3 gratitude entries each day. This tracks your daily engagement across everything - habits, goals, and journal. It\'s the big picture of your awesome progress!'
      },
      bonusEntries: {
        title: 'Bonus Entries',
        content: 'Feeling extra grateful today? Go for it! 💫 Writing more than 3 entries earns you bonus XP and shows your incredible dedication. Plus, you\'ll unlock special celebration moments!'
      },
      debtRecovery: {
        title: 'Streak Recovery',
        content: 'Life happens, and that\'s totally okay! 💪 If you miss a day, watch a quick ad to recover up to 3 missed days. We believe in second chances and getting you back on track!'
      }
    },

    // Goals screen help
    goals: {
      overview: {
        title: 'Create Any Goal',
        content: 'You can create absolutely any goal you want! 🎯 Just enter your custom units (books, miles, hours, pages, kilometers, etc.) and set your target amount. That\'s it - the app will track your progress!'
      },
      predictions: {
        title: 'Smart Goal Predictions',
        content: 'We\'re like your personal progress fortune teller! 🔮 Our smart system analyzes your patterns and gives you realistic timelines. No more guessing - you\'ll know exactly when you\'ll crush that goal!'
      },
      progressTracking: {
        title: 'Track Your Journey',
        content: 'Every step counts! 📈 Add your daily or weekly progress and watch your goal come to life. You can increase, decrease, or set exact amounts. Add notes to remember those proud moments!'
      },
      templates: {
        title: 'Goal Templates',
        content: 'Why start from scratch? We\'ve got you covered! 🎯 Choose from ready-made templates for popular goals and customize them to fit your unique journey. It\'s like having a head start!'
      }
    },

    // Home dashboard help
    home: {
      recommendations: {
        title: 'Your Personal Suggestions',
        content: 'These are made just for you! ⭐ Based on your unique patterns and progress, we suggest ways to stay motivated and discover exciting new opportunities. It\'s like having a personal coach!'
      },
      xpSystem: {
        title: 'Your XP Journey',
        content: 'Level up your life! 🚀 Every habit, journal entry, and goal step earns you XP. Watch your progress bar fill up and celebrate each new level you reach. You\'re literally growing stronger every day!'
      },
      streakBadges: {
        title: 'Your Streak Collection',
        content: 'These badges tell your success story! 🏆 Different colors show how strong your streaks are, and special badges celebrate major milestones. Each one represents your amazing dedication!'
      },
      habitStatistics: {
        title: 'Your Success Dashboard',
        content: 'See how amazing you\'re doing! 📊 Get a complete picture of your habit success with completion rates, trends, and patterns. It\'s proof of your incredible consistency and growth!'
      }
    },

    // Achievements help - removed standard gaming concepts
    achievements: {
      // Removed standard achievement concepts as they're intuitive to users
    },

    // Monthly challenges help
    challenges: {
      templates: {
        // HABITS templates
        habits_consistency_master: {
          title: 'Consistency Master',
          description: 'Complete your scheduled habits consistently throughout the month',
          requirement: 'Complete scheduled habit tasks',
          bonus1: 'Perfect completion (+20% bonus)',
          bonus2: 'Monthly streak continuation (+100 XP per month)',
          bonus3: 'Weekend consistency bonus (+50 XP)'
        },
        habits_variety_champion: {
          title: 'Variety Champion',
          description: 'Explore different habits each week to build a diverse routine',
          requirement: 'Complete different habits each week',
          bonus1: 'New habit discovery (+25 XP per new habit)',
          bonus2: 'Weekly variety milestone (+30 XP per week)',
          bonus3: 'Category balance bonus (+100 XP)'
        },
        habits_streak_builder: {
          title: 'Streak Builder',
          description: 'Maintain consistent habit streaks throughout the month',
          requirement: 'Maintain habit streaks for consecutive days',
          bonus1: 'Streak milestone rewards (+50 XP per 7-day streak)',
          bonus2: 'Multiple habit streaks (+75 XP bonus)',
          bonus3: 'Perfect month streak (+200 XP)'
        },
        habits_bonus_hunter: {
          title: 'Bonus Hunter',
          description: 'Go beyond your scheduled habits with bonus completions',
          requirement: 'Complete bonus habits above your schedule',
          bonus1: 'Bonus completion rewards (+15 XP per bonus)',
          bonus2: 'Daily bonus champion (+50 XP for 5+ bonuses)',
          bonus3: 'Monthly bonus master (+200 XP)'
        },
        // JOURNAL templates
        journal_reflection_expert: {
          title: 'Reflection Expert',
          description: 'Write daily journal entries throughout the month',
          requirement: 'Write journal entries on target number of days',
          bonus1: 'Daily reflection reward (+15 XP per day)',
          bonus2: 'Weekly consistency (+60 XP per week)',
          bonus3: 'Perfect journaling month (+250 XP)'
        },
        journal_gratitude_guru: {
          title: 'Gratitude Guru',
          description: 'Focus on gratitude-themed journal entries',
          requirement: 'Write gratitude-focused journal entries',
          bonus1: 'Gratitude entry bonus (+20 XP per entry)',
          bonus2: 'Weekly gratitude streak (+75 XP)',
          bonus3: 'Monthly gratitude master (+250 XP)'
        },
        journal_consistency_writer: {
          title: 'Consistency Writer',
          description: 'Maintain daily journal writing streak',
          requirement: 'Write journal entries consecutively',
          bonus1: 'Daily streak reward (+25 XP per day)',
          bonus2: 'Weekly streak milestone (+100 XP)',
          bonus3: 'Unbroken month streak (+400 XP)'
        },
        journal_depth_explorer: {
          title: 'Depth Explorer',
          description: 'Write detailed, thoughtful journal entries',
          requirement: 'Write detailed entries (200+ characters)',
          bonus1: 'Detailed entry bonus (+30 XP per entry)',
          bonus2: 'Thoughtful reflection (+100 XP weekly)',
          bonus3: 'Master wordsmith (+350 XP monthly)'
        },
        // GOALS templates
        goals_progress_champion: {
          title: 'Progress Champion',
          description: 'Make consistent daily progress towards your goals',
          requirement: 'Make goal progress on target number of days',
          bonus1: 'Daily progress achievement (+20 XP per day)',
          bonus2: 'Weekly consistency (+50 XP per week)',
          bonus3: 'Perfect progress month (+200 XP)'
        },
        goals_completion_master: {
          title: 'Achievement Unlocked',
          description: 'Complete multiple goals throughout the month',
          requirement: 'Complete target number of goals',
          bonus1: 'Goal completion bonus (+100 XP per goal)',
          bonus2: 'Multi-goal achievement (+150 XP for 3+ goals)',
          bonus3: 'Big goal bonus (+200 XP for 1000+ value goals)'
        },
        // CONSISTENCY templates
        consistency_triple_master: {
          title: 'Triple Master',
          description: 'Use all three features (habits, journal, goals) every day',
          requirement: 'Use habits, journal, and goals daily',
          bonus1: 'Perfect triple day (+30 XP per day)',
          bonus2: 'Weekly triple achievement (+100 XP per week)',
          bonus3: 'Monthly triple master (+300 XP)'
        },
        consistency_perfect_month: {
          title: 'Perfect Month',
          description: 'Achieve daily minimums (1+ habits, 3+ journal entries) consistently',
          requirement: 'Meet daily minimum requirements consistently',
          bonus1: 'Perfect day achievement (+50 XP per day)',
          bonus2: 'Perfect week bonus (+200 XP per week)',
          bonus3: 'Flawless month (+500 XP for 100%)'
        },
        consistency_xp_champion: {
          title: 'XP Champion',
          description: 'Accumulate total XP through consistent monthly engagement',
          requirement: 'Accumulate XP through all app activities monthly',
          bonus1: 'Milestone achievements (+50 XP per milestone)',
          bonus2: 'Consistency bonuses (+100 XP per bonus)',
          bonus3: 'Perfect month completion (+500 XP for reaching 100%)'
        },
        consistency_balance_expert: {
          title: 'Balance Expert',
          description: 'Maintain balanced XP sources (no single source >60% of total)',
          requirement: 'Maintain balanced feature usage',
          bonus1: 'Perfect balance bonus (+100 XP per week)',
          bonus2: 'Variety champion (+150 XP monthly)',
          bonus3: 'Harmony achievement (+200 XP for exceptional balance)'
        }
      },
      detail: {
        tabOverview: 'Overview',
        tabCalendar: 'Calendar',
        tabTips: 'Tips',
        sectionDescription: 'Challenge Description',
        sectionTimeline: 'Timeline',
        labelDaysRemaining: 'Days Remaining',
        labelActiveDays: 'Active Days',
        labelTotalDays: 'Total Days',
        sectionRequirements: 'Requirements Progress',
        sectionTips: 'Tips for Success',
        sectionStrategy: 'Monthly Strategy',
        sectionRewards: 'Rewards',
        rewardDescription: 'Complete all requirements to earn this XP reward. Perfect completion (100%) earns bonus XP!',
        completed: '✓ Completed',
      },
      starDifficulty: {
        title: 'Challenge Star Rating',
        content: 'Ready for a challenge? ⭐ Pick your adventure level! 1-star challenges are perfect for getting started, while 5-star challenges are for the ultimate achievers. Higher stars mean bigger XP rewards and bragging rights!'
      },
      progressTracking: {
        title: 'Watch Your Progress',
        content: 'Stay motivated all month long! 📅 Track your daily wins and see weekly breakdowns that show exactly how you\'re crushing your challenge. You\'ll love watching your progress add up!'
      },
      completionRewards: {
        title: 'Epic Completion Rewards',
        content: 'Finish strong and get rewarded big time! 🎁 Complete monthly challenges for massive XP bonuses and exclusive achievements. The harder the challenge, the sweeter the victory celebration!'
      }
    },

    // Gamification help
    gamification: {
      levelProgression: {
        title: 'Your Level Journey',
        content: 'You\'re on an epic 100-level adventure! 🎮 Each level gets more exciting as you grow stronger. Watch your rank evolve through 6 amazing color tiers from Grey all the way to legendary Red. Every level is a celebration of your progress!'
      },
      xpMultipliers: {
        title: 'Double XP Power-Up',
        content: 'Get ready for XP BOOST mode! ⚡ Achieve Harmony Streak (habits + journal + goals in one day) and unlock 24 hours of double XP! It\'s like finding a power-up that makes everything count twice!'
      },
      harmonyStreak: {
        title: 'The Ultimate Daily Win',
        content: 'This is where the magic happens! ✨ Complete your habits, write in your journal, AND make goal progress all in one day. Boom! You\'ve just unlocked 24 hours of 2x XP. It\'s the perfect day multiplied!'
      }
    }
  },

  // Tutorial System
  tutorial: {
    // General Tutorial UI
    skip: 'Skip Tutorial',
    next: 'Next',
    continue: 'Continue',
    getStarted: 'Get Started',
    finish: 'Finish Tutorial',
    progressText: 'Step {{current}} of {{total}}',
    loading: 'Setting up your tutorial...',

    // Tutorial Step Content
    steps: {
      // Step 1: Welcome & Foundation
      welcome: {
        title: 'Welcome to SelfRise! 🌟',
        content: 'Get ready for an amazing journey of personal growth! We\'ll guide you through creating your first habit, writing in your journal, and setting a meaningful goal. By the end, you\'ll have everything you need to start building the life you want! ✨',
        button: 'Let\'s Begin!',
      },

      // App Overview
      appOverview: {
        title: 'Your Personal Growth Dashboard 📊',
        content: 'This is your home screen where you\'ll see your progress, streaks, and achievements. Check back daily to stay motivated!',
        button: 'Show me around',
      },

      // Quick Actions
      quickActions: {
        title: 'Quick Actions 🚀',
        content: 'These buttons let you quickly add habits, journal entries, or goals. Tap them anytime you want to make progress!',
        button: 'Got it!',
      },

      // Create Habit Button
      createHabitButton: {
        title: 'Let\'s Create Your First Habit! 🌱',
        content: 'Tap this button to start building your first positive habit. We\'ll guide you through the process step by step.',
        button: 'Create habit',
      },

      // Habit Create (Save Button)
      habitCreate: {
        title: 'Save Your Habit 💾',
        content: 'All done customizing? Tap the save button to create your habit and start building your streak!',
        button: 'Continue',
      },

      // Goal Category
      goalCategory: {
        title: 'Choose a Category 🏷️',
        content: 'Pick a category that best describes your goal. This helps organize your goals and track progress in different areas of your life.',
        button: 'Next step',
      },

      // Goal Create (Save Button)
      goalCreate: {
        title: 'Create Your Goal 🎯',
        content: 'Ready to start tracking? Tap the create button to save your goal and begin your journey!',
        button: 'Let\'s do it!',
      },

      // Goal Complete
      goalComplete: {
        title: 'Goal Created! 🎉',
        content: 'Awesome! Your goal is now active. Add progress updates to see predictions and track your journey!',
        button: 'Continue',
      },

      // Navigate Home
      navigateHome: {
        title: 'Let\'s Go Home 🏠',
        content: 'Tap the home tab to see your dashboard with all your progress, habits, and achievements!',
        button: 'Take me home',
      },

      // Trophy Room
      trophyRoom: {
        title: 'Your Trophy Room 🏆',
        content: 'This is where all your achievements live! Complete challenges to unlock badges and celebrate your wins!',
        button: 'Amazing!',
      },

      // Step 2: Habit Name Input
      habitName: {
        title: 'Create Your First Habit 🌱',
        content: 'Let\'s start with something you want to do every day! This could be reading, exercising, meditating, or anything that makes you feel good. What positive habit do you want to build?',
        placeholder: 'e.g., Read for 10 minutes',
        examples: ['Morning meditation', 'Daily walk', 'Drink 8 glasses of water', 'Write in gratitude journal', 'Do 20 push-ups'],
        button: 'Great choice!',
      },

      // Step 3: Habit Color Selection
      habitColor: {
        title: 'Make It Yours! 🎨',
        content: 'Pick a color that makes you excited! Every time you see this color, you\'ll think of your awesome new habit. Choose whatever feels right to you!',
        button: 'Perfect!',
      },

      // Step 4: Habit Icon Selection
      habitIcon: {
        title: 'Choose Your Icon ✨',
        content: 'Time to pick an icon that represents your habit! This visual will help you instantly recognize your habit and make it feel more personal. What speaks to you?',
        button: 'Love it!',
      },

      // Step 5: Habit Schedule Days
      habitDays: {
        title: 'When Will You Do This? 📅',
        content: 'You\'re in control! Choose which days work best for your lifestyle. Want to build momentum with daily practice? Or prefer weekdays only? Whatever you choose, we\'ll help you stick to it!',
        button: 'Sounds good!',
      },

      // Step 6: Habit Creation Complete
      habitComplete: {
        title: 'Habit Created Successfully! 🎉',
        content: 'Amazing! You\'ve just created your first habit. You can see it below with your chosen color and icon. Tomorrow, you\'ll be able to check it off and start building an incredible streak!',
        button: 'What\'s next?',
      },

      // Step 7: Journal Introduction
      journalIntro: {
        title: 'Now Let\'s Try Journaling! 📝',
        content: 'Journaling is one of the most powerful tools for personal growth. It helps you appreciate good things in your life and builds a positive mindset. Let\'s write your first gratitude entry!',
        button: 'I\'m ready!',
      },

      // Step 8: First Gratitude Entry
      gratitudeEntry: {
        title: 'What Are You Grateful For? 🙏',
        content: 'Think of something - big or small - that you appreciate in your life right now. It could be a person, experience, opportunity, or even something as simple as your morning coffee! ☕',
        placeholder: 'I\'m grateful for...',
        examples: ['My family\'s support', 'Having a roof over my head', 'The ability to learn new things', 'A sunny day', 'My health'],
        button: 'Add this entry',
      },

      // Step 9: Journal Encouragement
      journalEncouragement: {
        title: 'You\'re A Natural! ⭐',
        content: 'Beautiful entry! Writing 3 gratitude entries daily helps maintain your SelfRise streak and fills your mind with positivity. You can always add bonus entries for extra XP too!',
        button: 'Got it!',
      },

      // Step 10: Goals Introduction
      goalsIntro: {
        title: 'Time To Set A Goal! 🎯',
        content: 'Goals give your life direction and purpose. Whether it\'s saving money, reading books, losing weight, or learning a skill - we\'ll help you track progress and predict when you\'ll achieve it!',
        button: 'Let\'s create one!',
      },

      // Step 11: Goal Title
      goalTitle: {
        title: 'What\'s Your Goal? 🏆',
        content: 'Think of something meaningful you want to achieve. Make it specific and exciting! This should be something that would make you proud when you complete it.',
        placeholder: 'e.g., Read 24 books this year',
        examples: ['Save $5,000 for vacation', 'Learn Spanish fluently', 'Run a 5K marathon', 'Write a book', 'Learn guitar'],
        button: 'That\'s a great goal!',
      },

      // Step 12: Goal Unit
      goalUnit: {
        title: 'How Will You Measure Progress? 📊',
        content: 'What unit makes sense for tracking your goal? This helps us show your progress clearly and predict when you\'ll succeed!',
        placeholder: 'e.g., books',
        examples: ['books', 'dollars', 'pounds', 'hours', 'kilometers', 'pages', 'days'],
        button: 'Perfect!',
      },

      // Step 13: Goal Target
      goalTarget: {
        title: 'What\'s Your Target Number? 🎯',
        content: 'How many {{unit}} do you want to achieve? Make it challenging but realistic. You can always adjust this later as you learn more about your pace!',
        placeholder: 'e.g., 24',
        button: 'Sounds achievable!',
      },

      // Step 14: Goal Date (Optional)
      goalDate: {
        title: 'When Do You Want To Achieve This? 📅',
        content: 'Setting a target date helps create urgency and allows us to give you smart predictions! Don\'t worry - this is optional and you can always change it later.',
        placeholder: 'Select target date (optional)',
        button: 'All set!',
      },

      // Step 14b: Create Goal Button
      createGoalButton: {
        title: 'Create Your First Goal',
        content: 'Click + Add Goal to set your first meaningful target!',
        button: 'Click Here',
      },

      // Step 15: XP System Introduction
      xpIntro: {
        title: 'You\'re Earning XP! ⚡',
        content: 'Look at that! You\'ve already earned experience points for creating your habit and goal. Every action you take in SelfRise earns XP, helping you level up from Level 1 to Level 100. It\'s like a game, but for your real life! 🎮',
        button: 'So cool!',
      },

      // Step 16: Tutorial Complete
      completion: {
        title: 'You\'re All Set To Rise! 🚀',
        content: 'Congratulations! You\'ve created your first habit, written in your journal, and set a meaningful goal. You\'re now ready to start your incredible journey of personal growth. Check back daily to maintain streaks, earn XP, and unlock achievements! Welcome to the SelfRise community! 🌟',
        button: 'Start My Journey!',
      },
    },

    // Validation Messages
    validation: {
      habitName: {
        required: 'Please enter a habit name to continue',
        tooShort: 'Give your habit a more descriptive name (at least 2 characters)',
        tooLong: 'Keep your habit name under 50 characters',
      },
      habitDays: {
        required: 'Please select at least one day for your habit',
      },
      goalTitle: {
        required: 'Please enter a goal title to continue',
        tooShort: 'Give your goal a more descriptive title (at least 2 characters)',
        tooLong: 'Keep your goal title under 100 characters',
      },
      goalUnit: {
        required: 'Please specify a unit for measuring progress',
        tooLong: 'Keep your unit under 20 characters',
      },
      goalTarget: {
        required: 'Please enter a target value greater than 0',
        tooLarge: 'Target value should be less than 1,000,000',
      },
      gratitudeEntry: {
        required: 'Please write what you\'re grateful for',
        tooShort: 'Share a bit more detail about what you\'re grateful for',
      },
    },

    // Error Messages
    errors: {
      loadingFailed: 'Oops! Something went wrong loading the tutorial. Please try again.',
      savingFailed: 'We couldn\'t save your progress. Please check your connection and try again.',
      habitCreationFailed: 'We couldn\'t create your habit. Please try again.',
      goalCreationFailed: 'We couldn\'t create your goal. Please try again.',
      journalEntryFailed: 'We couldn\'t save your journal entry. Please try again.',
      genericError: 'Something unexpected happened. Please try again.',
      recoveryMode: 'Tutorial experienced issues. Running in simplified mode.',
      reset: 'Tutorial encountered an error and was reset.',
      retry: 'Try Again',
    },

    // Skip Confirmation
    skipConfirmation: {
      title: 'Skip Tutorial?',
      message: 'Are you sure you want to skip the tutorial? You can always access it later from the help section.',
      skip: 'Yes, Skip',
      continue: 'Continue Tutorial',
    },

    // Progress Messages
    progress: {
      creatingHabit: 'Creating your awesome habit...',
      creatingGoal: 'Setting up your goal...',
      savingEntry: 'Saving your gratitude entry...',
      loading: 'Loading next step...',
    },

    // Accessibility
    accessibility: {
      tutorialModal: 'Tutorial step {{step}} of {{total}}: {{title}}',
      spotlightArea: 'Tutorial spotlight highlighting {{target}}',
      progressIndicator: 'Tutorial progress: {{progress}} percent complete',
      skipButton: 'Skip tutorial and go to main app',
      nextButton: 'Continue to next tutorial step',
      formField: 'Tutorial input field for {{field}}',
      colorSelector: 'Color selection for habit customization',
      iconSelector: 'Icon selection for habit customization',
      daySelector: 'Day selection for habit scheduling',
    },

    // Tutorial Recovery (for crash recovery)
    recovery: {
      title: 'Welcome Back! 👋',
      message: 'Looks like you were in the middle of the tutorial. Would you like to continue where you left off or start fresh?',
      continue: 'Continue Tutorial',
      restart: 'Start Over',
    },
  },

  // Notifications
  notifications: {
    disabled: 'Notifications Disabled',
    enableTap: 'Tap to enable notifications',
    settingsTap: 'Tap to open system settings',
    afternoonReminder: 'Afternoon Reminder',
    afternoonDescription: 'Motivational check-in',
    eveningReminder: 'Evening Reminder',
    eveningDescription: 'Smart task reminder',
    morning: {
      variant1: 'Good morning! Start your day with gratitude 🌅',
      variant2: 'Rise and shine! What are you grateful for today? ✨',
      variant3: 'A new day, a new chance to grow! 🌱',
      variant4: 'Morning motivation: check your habits and set your intention! 💪',
    },
    evening: {
      variant1: 'Evening reflection: How did your habits go today? 🌙',
      variant2: 'End your day with gratitude. What went well? 🙏',
      variant3: 'Time to review your progress and plan tomorrow! 📝',
      variant4: 'Good night! Don\'t forget to complete your daily gratitude! 🌟',
    },
    // Daily reminder notifications
    reminders: {
      afternoon: {
        variant1: {
          title: 'SelfRise Check-in ☀️',
          body: "How's your day going? Don't forget your goals and habits! 🚀",
        },
        variant2: {
          title: 'Afternoon Motivation 💪',
          body: 'You still have time! Check your habits and goals 💪',
        },
        variant3: {
          title: 'Progress Time 🎯',
          body: 'Afternoon check-in: How are you doing with your goals? 🎯',
        },
        variant4: {
          title: 'Micro-win Moment ✨',
          body: 'Time for a micro-win! Can you complete one more habit? 🏃‍♂️',
        },
      },
      evening: {
        incomplete_habits: {
          title: 'You still have habits to complete! 🏃‍♂️',
          body_one: 'You have 1 habit left to complete. Let\'s do this!',
          body_other: 'You have {{count}} habits left to complete. Let\'s do this!',
        },
        missing_journal: {
          title: 'Evening reflection time 📝',
          body_one: 'Don\'t forget to write 1 more journal entry!',
          body_other: 'Don\'t forget to write {{count}} more journal entries!',
        },
        bonus_opportunity: {
          title: 'Bonus opportunity! ⭐',
          body: 'You still have time for bonus entries! (currently {{count}}/10)',
        },
        fallback: {
          title: 'Evening check-in 🌙',
          body: 'Time for evening reflection! What did you accomplish today? 📝',
        },
      },
    },
  },

  // Social features
  social: {
    // Phase 7: DailyHeroesSection
    dailyHeroes: {
      title: 'Daily Heroes 🦸‍♀️',
      subtitle: 'Anonymous achievements to inspire you',
      loading: 'Loading inspiring achievements...',
      tryAgain: 'Try Again',
      noHeroes: 'No heroes available right now',
      noHeroesSubtitle: 'Check back later for new inspiration!',
      footer: 'Every achievement shared here is from a real user journey. You\'re not alone! 💪',
      inspiring: 'Inspiring',
      daysActive: 'days active',
      today: '🟢 Today',
      yesterday: '🟡 Yesterday',
      recent: '🔵 Recent',
    },
    // Phase 8: NotificationSettings & LoyaltyCard
    notifications: {
      disabled: 'Notifications Disabled',
      enableTap: 'Tap to enable notifications',
      settingsTap: 'Tap to open system settings',
      afternoonReminder: 'Afternoon Reminder',
      afternoonDescription: 'Motivational check-in',
      eveningReminder: 'Evening Reminder',
      eveningDescription: 'Smart task reminder',
    },
    loyalty: {
      loadingData: 'Loading loyalty data...',
      unavailableData: '⚠️ Loyalty data unavailable',
      journeyTitle: '🏆 Loyalty Journey',
      activeDays: 'Active Days',
      daysRemaining: 'days remaining',
      maxReached: 'You\'ve reached maximum loyalty!',
      daysOfDedication: 'days of dedication',
      currentStreak: 'Current Streak',
      longestStreak: 'Longest Streak',
      level: 'Level',
    },
    quote: {
      copy: 'Copy',
      share: 'Share',
      copiedTitle: '📋 Copied!',
      copiedMessage: 'Quote copied to clipboard.',
      copyError: 'Failed to copy quote. Please try again.',
      title: '✨ Motivational Quote',
    },
    achievements: {
      shareSuccessTitle: '🎉 Shared Successfully!',
      shareSuccessMessage: 'Your achievement has been shared. Keep up the great work!',
      shareError: 'Failed to share achievement. Please try again.',
      copiedTitle: '📋 Copied!',
      copiedMessage: 'Achievement details copied to clipboard. You can now paste it anywhere!',
      shareAchievementTitle: 'Share Achievement',
      shareAchievementDescription: 'Share using your device\'s built-in sharing options',
      copyClipboardTitle: 'Copy to Clipboard',
      copyClipboardDescription: 'Copy achievement details to your clipboard',
    },
    achievements_filters: {
      allCategories: 'All Categories',
      habitsCategory: 'Habits',
      journalCategory: 'Journal',
      goalsCategory: 'Goals',
      consistencyCategory: 'Consistency',
      categoryLabel: 'Category',
      rarityLabel: 'Rarity',
      recentLabel: 'Recent',
      alphabeticalLabel: 'A-Z',
      sortByLabel: 'Sort By',
      unlockedOnlyLabel: 'Unlocked Only',
      allRarities: 'All Rarities',
      commonRarity: 'Common',
      rareRarity: 'Rare',
      epicRarity: 'Epic',
      legendaryRarity: 'Legendary',
    },
    achievements_trophies: {
      habitMastery: 'Complete all habit-related achievements',
      journalMastery: 'Master all aspects of reflective journaling',
      goalMastery: 'Achieve mastery in goal setting and completion',
      legendaryCollector: 'Collect all legendary achievements',
      epicCollector: 'Unlock all epic achievements',
      universalBeginning: 'Take your first steps in all areas',
      consistencyMaster: 'Master the art of consistency',
      timeMaster: 'Excel in time-based achievements',
    },
    trophy_combinations: {
      title: 'Trophy Collections',
      subtitle: 'Complete themed sets for bonus rewards',
      collectionsCompleted: 'Collections\nCompleted',
      bonusXPEarned: 'Bonus XP\nEarned',
      collectionRate: 'Collection\nRate',
    },
    loyalty_progress: {
      keepGrowing: 'Keep growing!',
      level: 'Level',
    },
    days: {
      monday: 'Mo',
      tuesday: 'Tu',
      wednesday: 'We',
      thursday: 'Th',
      friday: 'Fr',
      saturday: 'Sa',
      sunday: 'Su',
    },
    // Filters - labels for header
    filterLabels: {
      category: 'Category',
      rarity: 'Rarity',
      sortBy: 'Sort By',
    },
    // Trophy combinations
    combinations: {
      collections: 'Collections',
      completed: 'Completed',
      earned: 'Earned',
      collection: 'Collection',
      rate: 'Rate',
    },
    // Achievement states
    states: {
      new: 'NEW',
      keepGrowing: 'Keep growing!',
      level: 'Level',
    },
    // Achievement History
    history: {
      newBadge: 'NEW',
      emptyTitle: 'No Trophies Yet',
      recentVictories: 'Recent Victories',
    },
    // Achievement Tooltip
    tooltip: {
      completed: '✅ Achievement Completed',
      progressAndRequirements: '📊 Progress & Requirements',
      requirement: 'Requirement:',
      currentProgress: 'Current Progress:',
      nextSteps: '💡 Next Steps:',
      smartTips: '💡 Smart Tips',
    },
    // Achievement Detail Modal
    detail: {
      category: 'Category:',
      rarity: 'Rarity:',
      xpReward: 'XP Reward:',
    },
    // Trophy Room
    trophyRoom: {
      title: '🏆 Trophy Room',
      subtitle: 'Your Personal Hall of Fame',
      qualitySection: 'Trophy Quality',
    },
    // Share Achievement Modal
    shareModal: {
      title: 'Share Achievement',
      subtitle: 'Celebrate your progress! 🎉',
      preparing: 'Preparing your achievement... 🏆',
      messagePreview: 'Share Message Preview',
      sharingOptions: 'Sharing Options',
      privacyProtected: 'Privacy Protected',
    },
  },

  // Challenges
  challenges: {
    calendar: {
      dailyProgress: 'Daily Progress',
      title: 'Monthly Progress Calendar',
      noActivity: 'No Activity (<10%)',
      someActivity: 'Some Activity (10-50%)',
      goodProgress: 'Good Progress (51-90%)',
      perfectDay: 'Perfect Day (91%+)',
      weeklyBreakdown: 'Weekly Breakdown',
      week: 'Week {week}',
    },
    completion: {
      requirements: 'Requirements',
      activeDays: 'Active Days',
      milestones: 'Milestones',
    },
  },

  // Gratitude/Journal
  gratitude: {
    daily: {
      title: 'Today\'s Journal Progress',
    },
    export: {
      title: 'Export Journal',
      textFormat: 'Text Format',
      jsonFormat: 'JSON Format',
      exporting: 'Exporting your journal...',
    },
    edit: {
      title: 'Edit Journal Entry',
    },
    bonus: {
      label: 'BONUS ⭐',
    },
  },

  // Accessibility labels
  accessibility: {
    activateMultiplier: 'Activate 2x XP multiplier',
    tapToContinueTutorial: 'Tap to continue tutorial',
    achievementGrid: 'Achievement grid',
    closeAchievementDetails: 'Close achievement details',
    shareAchievement: 'Share achievement',
    shareYourAchievement: 'Share your achievement',
    continueWithMultiplier: 'Continue using the app with multiplier active',
    multiplierCelebration: 'XP Multiplier activation celebration',
    getNewQuote: 'Get new quote',
    copyQuoteToClipboard: 'Copy quote to clipboard',
    shareQuote: 'Share quote',
  },

};

export default en;