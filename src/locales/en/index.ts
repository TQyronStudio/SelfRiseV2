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
    streakActive: 'Streak active!',
    startToday: 'Start today',
    bestStreak: 'Best',
    canRecover: 'Recover with ad',
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
      trendAnalysis: 'Trends',
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
    // Quick Actions
    quickActions: 'Quick Actions',
    addHabit: 'Add Habit',
    addJournal: 'Add Entry',
    addGoal: 'Add Goal',
    todayHabits: 'Today\'s Habits',
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
    },
  },
  
  // Habits screen
  habits: {
    title: 'My Habits',
    addHabit: 'Add Habit',
    editHabit: 'Edit Habit',
    deleteHabit: 'Delete Habit',
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
  },
  
  // Journal screen
  journal: {
    title: 'My Journal',
    addGratitude: 'Add Gratitude',
    gratitudePlaceholder: 'What are you grateful for today?',
    minimumRequired: 'Write at least 3 entries to maintain your streak',
    bonusGratitude: 'Bonus Entry',
    currentStreak: 'Current Streak',
    longestStreak: 'Longest Streak',
    history: 'History',
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
      daily_complete_modal: 'Daily journal completion celebration',
      streak_milestone_modal: '{{days}} day streak milestone celebration',
      bonus_milestone_modal: '{{count}} bonus entries celebration',
      epic_crown_modal: 'Epic royal crown celebration for 10th bonus milestone achievement',
      streak_badge_accessibility: '{{days}} day streak achievement badge',
      bonus_badge_accessibility: '{{count}} bonus {{#eq count 1}}entry{{else}}entries{{/eq}} achievement badge',
    },
  },
  
  // Goals screen
  goals: {
    title: 'My Goals',
    addGoal: 'Add Goal',
    editGoal: 'Edit Goal',
    deleteGoal: 'Delete Goal',
    noGoals: 'No goals yet. Start by creating your first goal!',
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
    },
    
    form: {
      title: 'Goal Title',
      description: 'Description (Optional)',
      unit: 'Unit',
      targetValue: 'Target Value',
      category: 'Category',
      targetDate: 'Target Date (Recommended)',
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
  },
  
  // Achievements screen
  achievements: {
    title: 'Trophy Room',
    subtitle: 'Your personal hall of fame',
    
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
      clearFilters: 'Clear Filters',
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
  },
  
  // Settings screen
  settings: {
    title: 'Settings',
    language: 'Language',
    notifications: 'Notifications',
    morningNotification: 'Morning Notification',
    eveningNotification: 'Evening Notification',
    account: 'Account',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    about: 'About',
    version: 'Version',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
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
    },
  },
  
  // Common (enhanced with celebration support)
  common: {
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    create: 'Create',
    update: 'Update',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    retry: 'Retry',
    ok: 'OK',
    done: 'Done',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    close: 'Close',
    continue: 'Continue',
    yes: 'Yes',
    no: 'No',
    
    // Celebration support
    celebration: {
      general_announcement: 'Congratulations on your achievement!',
      modal: 'Achievement celebration',
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
  
  // Notifications
  notifications: {
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
  },
};

export default en;