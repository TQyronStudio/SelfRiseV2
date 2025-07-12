import { TranslationKeys } from '../../types/i18n';

const en: TranslationKeys = {
  // Navigation
  tabs: {
    home: 'Home',
    habits: 'Habits',
    gratitude: 'My Gratitude',
    goals: 'Goals',
    settings: 'Settings',
  },
  
  // Home screen
  home: {
    title: 'Welcome Back!',
    gratitudeStreak: 'Gratitude Streak',
    habitStatistics: 'Habit Statistics',
    weeklyProgress: 'Weekly Progress',
    monthlyProgress: 'Monthly Progress',
    dayDetail: 'Day Detail',
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
  
  // Gratitude screen
  gratitude: {
    title: 'My Gratitude',
    addGratitude: 'Add Gratitude',
    gratitudePlaceholder: 'What are you grateful for today?',
    minimumRequired: 'Write at least 3 gratitudes to maintain your streak',
    bonusGratitude: 'Bonus Gratitude',
    currentStreak: 'Current Streak',
    longestStreak: 'Longest Streak',
    history: 'History',
    celebration: {
      title: 'Congratulations! 🎉',
      message: 'You\'ve completed your daily gratitude practice!',
      bonusPrompt: 'Would you like to add a bonus gratitude?',
      continue: 'Continue',
    },
    milestone: {
      title: 'Amazing Achievement! 🏆',
      message: 'You\'ve reached a {{days}} day streak!',
    },
    milestone1_title: 'One Step Further! ✨',
    milestone1_text: 'First bonus gratitude! Great work, keep it up.',
    milestone5_title: 'Nice Combo! 🔥',
    milestone5_text: 'Five bonus gratitudes! That\'s great!',
    milestone10_title: 'Incredible Milestone! 🏆',
    milestone10_text: '10 bonus gratitudes! You must be having an amazing day!',
    streakLost: {
      title: 'Streak Lost',
      message: 'Your gratitude streak has been broken. What would you like to do?',
      reset: 'Reset Streak',
      recover: 'Recover with Ad',
    },
  },
  
  // Goals screen
  goals: {
    title: 'My Goals',
    addGoal: 'Add Goal',
    editGoal: 'Edit Goal',
    deleteGoal: 'Delete Goal',
    goalTitle: 'Goal Title',
    goalTitlePlaceholder: 'Enter your goal...',
    unit: 'Unit',
    unitPlaceholder: 'e.g., $, kg, hours...',
    targetValue: 'Target Value',
    addProgress: 'Add Progress',
    progressValue: 'Progress Value',
    progressNote: 'Note',
    progressNotePlaceholder: 'Add a note about your progress...',
    completed: 'Completed',
    progress: 'Progress',
    confirmDelete: 'Confirm Delete',
    deleteMessage: 'Are you sure you want to delete this goal? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
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
  
  // Common
  common: {
    save: 'Save',
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
    done: 'Done',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
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