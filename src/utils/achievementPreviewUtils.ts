// Achievement Preview System Utilities
// Provides progress hints, requirements, and completion information for all achievements

import { Achievement, AchievementRarity, AchievementCategory } from '../types/gamification';

// ========================================
// INTERFACES
// ========================================

export interface UserStats {
  // Habits
  habitsCreated: number;
  totalHabitCompletions: number;
  longestHabitStreak: number;
  maxHabitsInOneDay: number;
  habitLevel: number;
  
  // Journal
  journalEntries: number;
  totalJournalEntries: number;
  currentJournalStreak: number;
  longestJournalStreak: number;
  bonusJournalEntries: number;
  
  // Goals
  goalsCreated: number;
  completedGoals: number;
  goalProgressStreak: number;
  hasLargeGoal: boolean;
  
  // Level & XP
  currentLevel: number;
  totalXP: number;
  xpFromHabits: number;
  
  // Achievements
  totalAchievements: number;
  unlockedAchievements: number;
  
  // Consistency
  appUsageStreak: number;
  multiAreaDays: number;
  
  // Activity
  totalActiveDays: number;
  recommendationsFollowed: number;
}

export interface ProgressHint {
  progressText: string;           // "Complete 100 habits (75/100)"
  progressPercentage: number;     // 75
  isCompleted: boolean;          // false
  requirementText: string;       // "Complete 100 habits total"
  actionHint: string;           // "Keep completing daily habits!"
  estimatedDays?: number;       // 25 days remaining
}

export interface CompletionInfo {
  accomplishment: string;        // "Completed 100 habits total"
  completionDate: string;       // "Unlocked 3 days ago"
  timeToComplete: string;       // "Achieved in 45 days"
  category: string;             // "Habits Category"
  difficultyLevel: string;      // "Challenging"
}

export interface SmartTooltip {
  primaryTip: string;           // Main guidance
  motivationalMessage: string;  // Encouragement
  actionAdvice: string;        // Specific next steps
  estimatedEffort?: string | undefined;    // Time/effort estimate
}

// ========================================
// PROGRESS HINT GENERATION
// ========================================

export const generateProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.category) {
    case AchievementCategory.HABITS:
      return generateHabitProgressHint(achievement, userStats);
    case AchievementCategory.JOURNAL:
      return generateJournalProgressHint(achievement, userStats);
    case AchievementCategory.GOALS:
      return generateGoalProgressHint(achievement, userStats);
    case AchievementCategory.CONSISTENCY:
      return generateConsistencyProgressHint(achievement, userStats);
    case AchievementCategory.MASTERY:
      return generateMasteryProgressHint(achievement, userStats);
    case AchievementCategory.SPECIAL:
      return generateSpecialProgressHint(achievement, userStats);
    default:
      return getDefaultProgressHint(achievement);
  }
};

// ========================================
// CATEGORY-SPECIFIC HINTS
// ========================================

const generateHabitProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'first_steps':
      return {
        progressText: userStats.habitsCreated === 0 ? "Create your first habit to begin!" : "✅ First habit created!",
        progressPercentage: userStats.habitsCreated > 0 ? 100 : 0,
        isCompleted: userStats.habitsCreated > 0,
        requirementText: "Create your very first habit",
        actionHint: "Go to Habits tab and create your first habit!"
      };
      
    case 'habit_builder':
      const created = Math.min(userStats.habitsCreated, 5);
      return {
        progressText: `Create 5 habits (${created}/5)`,
        progressPercentage: (created / 5) * 100,
        isCompleted: created >= 5,
        requirementText: "Create 5 different habits to diversify development",
        actionHint: "Create more habits to diversify your growth!",
        estimatedDays: Math.max(0, 5 - created)
      };
      
    case 'century_club':
      const completed = Math.min(userStats.totalHabitCompletions, 100);
      return {
        progressText: `Complete 100 habits (${completed}/100)`,
        progressPercentage: completed,
        isCompleted: completed >= 100,
        requirementText: "Complete 100 habit tasks total",
        actionHint: "Keep completing your daily habits!",
        estimatedDays: Math.ceil((100 - completed) / 2) // Assuming 2 habits per day
      };
      
    case 'consistency_king':
      const total = Math.min(userStats.totalHabitCompletions, 1000);
      return {
        progressText: `Complete 1000 habits (${total}/1000)`,
        progressPercentage: total / 10, // Scale for display
        isCompleted: total >= 1000,
        requirementText: "Complete 1000 habit tasks total",
        actionHint: "You're building amazing consistency!",
        estimatedDays: Math.ceil((1000 - total) / 3) // Assuming 3 habits per day
      };
      
    case 'habit_streak_champion':
      const streak = Math.min(userStats.longestHabitStreak, 21);
      return {
        progressText: `Achieve 21-day streak (best: ${userStats.longestHabitStreak} days)`,
        progressPercentage: (streak / 21) * 100,
        isCompleted: userStats.longestHabitStreak >= 21,
        requirementText: "Achieve a 21-day streak with any single habit",
        actionHint: "Focus on consistency with one habit!",
        estimatedDays: Math.max(0, 21 - userStats.longestHabitStreak)
      };
      
    case 'century_streak':
      const longStreak = Math.min(userStats.longestHabitStreak, 75);
      return {
        progressText: `Achieve 75-day streak (best: ${userStats.longestHabitStreak} days)`,
        progressPercentage: (longStreak / 75) * 100,
        isCompleted: userStats.longestHabitStreak >= 75,
        requirementText: "Maintain a 75-day streak with any habit",
        actionHint: "Incredible dedication! Keep the streak alive!",
        estimatedDays: Math.max(0, 75 - userStats.longestHabitStreak)
      };
      
    case 'multi_tasker':
      const maxInDay = Math.min(userStats.maxHabitsInOneDay, 5);
      return {
        progressText: `Complete 5 habits in one day (best: ${userStats.maxHabitsInOneDay})`,
        progressPercentage: (maxInDay / 5) * 100,
        isCompleted: userStats.maxHabitsInOneDay >= 5,
        requirementText: "Complete 5 different habits in a single day",
        actionHint: "Challenge yourself with multiple habits today!"
      };
      
    case 'habit_legend':
      const levelProgress = userStats.currentLevel >= 50 && (userStats.xpFromHabits / userStats.totalXP) >= 0.5;
      return {
        progressText: `Reach Level 50 with 50%+ XP from habits (Level ${userStats.currentLevel}, ${Math.round((userStats.xpFromHabits / userStats.totalXP) * 100)}% habit XP)`,
        progressPercentage: levelProgress ? 100 : Math.min((userStats.currentLevel / 50) * 50 + ((userStats.xpFromHabits / userStats.totalXP) * 50), 100),
        isCompleted: levelProgress,
        requirementText: "Reach Level 50 with 50%+ XP from habit activities",
        actionHint: "Focus on habit activities to boost your XP ratio!"
      };
      
    default:
      return getDefaultProgressHint(achievement);
  }
};

const generateJournalProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'first_reflection':
      return {
        progressText: userStats.journalEntries === 0 ? "Write your first gratitude entry!" : "✅ First reflection completed!",
        progressPercentage: userStats.journalEntries > 0 ? 100 : 0,
        isCompleted: userStats.journalEntries > 0,
        requirementText: "Write your first gratitude journal entry",
        actionHint: "Go to Journal tab and write your first entry!"
      };
      
    case 'deep_thinker':
      return {
        progressText: "Write a journal entry with at least 200 characters",
        progressPercentage: 0, // Would need to track character counts
        isCompleted: false,
        requirementText: "Write a journal entry with at least 200 characters",
        actionHint: "Express yourself fully in your next journal entry!"
      };
      
    case 'journal_enthusiast':
      const entries = Math.min(userStats.totalJournalEntries, 100);
      return {
        progressText: `Write 100 journal entries (${entries}/100)`,
        progressPercentage: entries,
        isCompleted: entries >= 100,
        requirementText: "Write 100 journal entries total",
        actionHint: "Keep expressing gratitude daily!",
        estimatedDays: Math.ceil((100 - entries) / 1) // 1 entry per day
      };
      
    case 'grateful_heart':
      const currentStreak = Math.min(userStats.currentJournalStreak, 7);
      return {
        progressText: `Maintain 7-day streak (current: ${userStats.currentJournalStreak} days)`,
        progressPercentage: (currentStreak / 7) * 100,
        isCompleted: userStats.currentJournalStreak >= 7,
        requirementText: "Maintain a 7-day journal writing streak",
        actionHint: "Keep your streak alive with daily entries!",
        estimatedDays: Math.max(0, 7 - userStats.currentJournalStreak)
      };
      
    case 'gratitude_guardian':
      const streak21 = Math.min(userStats.longestJournalStreak, 21);
      return {
        progressText: `Achieve 21-day streak (best: ${userStats.longestJournalStreak} days)`,
        progressPercentage: (streak21 / 21) * 100,
        isCompleted: userStats.longestJournalStreak >= 21,
        requirementText: "Write in your journal for 21 consecutive days",
        actionHint: "Building a strong gratitude habit!",
        estimatedDays: Math.max(0, 21 - userStats.longestJournalStreak)
      };
      
    case 'gratitude_guru':
      const streak30 = Math.min(userStats.longestJournalStreak, 30);
      return {
        progressText: `Achieve 30-day streak (best: ${userStats.longestJournalStreak} days)`,
        progressPercentage: (streak30 / 30) * 100,
        isCompleted: userStats.longestJournalStreak >= 30,
        requirementText: "Achieve a 30-day journal writing streak",
        actionHint: "You're becoming a gratitude master!",
        estimatedDays: Math.max(0, 30 - userStats.longestJournalStreak)
      };
      
    case 'eternal_gratitude':
      const streak100 = Math.min(userStats.longestJournalStreak, 100);
      return {
        progressText: `Achieve 100-day streak (best: ${userStats.longestJournalStreak} days)`,
        progressPercentage: streak100,
        isCompleted: userStats.longestJournalStreak >= 100,
        requirementText: "Maintain a 100-day journal streak",
        actionHint: "Incredible dedication to gratitude!",
        estimatedDays: Math.max(0, 100 - userStats.longestJournalStreak)
      };
      
    case 'bonus_seeker':
      const bonusEntries = Math.min(userStats.bonusJournalEntries, 50);
      return {
        progressText: `Write 50 bonus entries (${bonusEntries}/50)`,
        progressPercentage: (bonusEntries / 50) * 100,
        isCompleted: bonusEntries >= 50,
        requirementText: "Write 50 bonus journal entries",
        actionHint: "Go beyond the daily minimum with bonus entries!",
        estimatedDays: Math.ceil((50 - bonusEntries) / 2) // Assuming 2 bonus per day
      };
      
    default:
      return getDefaultProgressHint(achievement);
  }
};

const generateGoalProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'first_vision':
      return {
        progressText: userStats.goalsCreated === 0 ? "Set your first goal to start!" : "✅ First goal set!",
        progressPercentage: userStats.goalsCreated > 0 ? 100 : 0,
        isCompleted: userStats.goalsCreated > 0,
        requirementText: "Set your first goal",
        actionHint: "Go to Goals tab and create your first goal!"
      };
      
    case 'goal_getter':
      return {
        progressText: userStats.completedGoals === 0 ? "Complete your first goal!" : "✅ First goal completed!",
        progressPercentage: userStats.completedGoals > 0 ? 100 : 0,
        isCompleted: userStats.completedGoals > 0,
        requirementText: "Complete your first goal",
        actionHint: "Finish one of your goals to unlock this!"
      };
      
    case 'dream_fulfiller':
      const completed3 = Math.min(userStats.completedGoals, 3);
      return {
        progressText: `Complete 3 goals (${completed3}/3)`,
        progressPercentage: (completed3 / 3) * 100,
        isCompleted: completed3 >= 3,
        requirementText: "Complete 3 goals",
        actionHint: "Keep working towards your goals!",
        estimatedDays: (3 - completed3) * 30 // Rough estimate
      };
      
    case 'goal_champion':
      const completed5 = Math.min(userStats.completedGoals, 5);
      return {
        progressText: `Complete 5 goals (${completed5}/5)`,
        progressPercentage: (completed5 / 5) * 100,
        isCompleted: completed5 >= 5,
        requirementText: "Complete 5 goals",
        actionHint: "You're becoming a goal champion!",
        estimatedDays: (5 - completed5) * 30
      };
      
    case 'achievement_unlocked':
      const completed10 = Math.min(userStats.completedGoals, 10);
      return {
        progressText: `Complete 10 goals (${completed10}/10)`,
        progressPercentage: (completed10 / 10) * 100,
        isCompleted: completed10 >= 10,
        requirementText: "Complete 10 goals",
        actionHint: "Ultimate goal achievement awaits!",
        estimatedDays: (10 - completed10) * 30
      };
      
    case 'ambitious':
      return {
        progressText: userStats.hasLargeGoal ? "✅ Ambitious goal set!" : "Set a goal with target ≥1000",
        progressPercentage: userStats.hasLargeGoal ? 100 : 0,
        isCompleted: userStats.hasLargeGoal,
        requirementText: "Set a goal with target value of 1000 or more",
        actionHint: "Dream big with an ambitious goal!"
      };
      
    case 'progress_tracker':
      const progressStreak = Math.min(userStats.goalProgressStreak, 7);
      return {
        progressText: `Make progress 7 days straight (${progressStreak}/7)`,
        progressPercentage: (progressStreak / 7) * 100,
        isCompleted: progressStreak >= 7,
        requirementText: "Make progress on goals for 7 consecutive days",
        actionHint: "Update your goal progress daily!",
        estimatedDays: Math.max(0, 7 - progressStreak)
      };
      
    default:
      return getDefaultProgressHint(achievement);
  }
};

const generateConsistencyProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'weekly_warrior':
      const weekStreak = Math.min(userStats.longestHabitStreak, 7);
      return {
        progressText: `Maintain 7-day streak (best: ${userStats.longestHabitStreak} days)`,
        progressPercentage: (weekStreak / 7) * 100,
        isCompleted: userStats.longestHabitStreak >= 7,
        requirementText: "Maintain a 7-day streak in any habit",
        actionHint: "Focus on consistency with one habit!"
      };
      
    case 'monthly_master':
      const monthStreak = Math.min(userStats.longestHabitStreak, 30);
      return {
        progressText: `Achieve 30-day streak (best: ${userStats.longestHabitStreak} days)`,
        progressPercentage: (monthStreak / 30) * 100,
        isCompleted: userStats.longestHabitStreak >= 30,
        requirementText: "Achieve a 30-day streak",
        actionHint: "You're building incredible consistency!"
      };
      
    case 'centurion':
      const centStreak = Math.min(userStats.longestHabitStreak, 100);
      return {
        progressText: `Reach 100 days consistency (best: ${userStats.longestHabitStreak} days)`,
        progressPercentage: centStreak,
        isCompleted: userStats.longestHabitStreak >= 100,
        requirementText: "Reach 100 days of consistency",
        actionHint: "Legendary consistency achievement!"
      };
      
    case 'daily_visitor':
      const appStreak = Math.min(userStats.appUsageStreak, 7);
      return {
        progressText: `Use app 7 days straight (${appStreak}/7)`,
        progressPercentage: (appStreak / 7) * 100,
        isCompleted: appStreak >= 7,
        requirementText: "Use the app for 7 consecutive days",
        actionHint: "Open the app daily!"
      };
      
    case 'dedicated_user':
      const appStreak30 = Math.min(userStats.appUsageStreak, 30);
      return {
        progressText: `Use app 30 days straight (${appStreak30}/30)`,
        progressPercentage: (appStreak30 / 30) * 100,
        isCompleted: appStreak30 >= 30,
        requirementText: "Use the app for 30 consecutive days",
        actionHint: "You're becoming a dedicated user!"
      };
      
    default:
      return getDefaultProgressHint(achievement);
  }
};

const generateMasteryProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'level_up':
      const level10 = Math.min(userStats.currentLevel, 10);
      return {
        progressText: `Reach level 10 (current: Level ${userStats.currentLevel})`,
        progressPercentage: (level10 / 10) * 100,
        isCompleted: userStats.currentLevel >= 10,
        requirementText: "Reach level 10",
        actionHint: "Earn more XP to level up!"
      };
      
    case 'selfrise_expert':
      const level25 = Math.min(userStats.currentLevel, 25);
      return {
        progressText: `Reach level 25 (current: Level ${userStats.currentLevel})`,
        progressPercentage: (level25 / 25) * 100,
        isCompleted: userStats.currentLevel >= 25,
        requirementText: "Reach level 25",
        actionHint: "You're becoming a SelfRise expert!"
      };
      
    case 'selfrise_master':
      const level50 = Math.min(userStats.currentLevel, 50);
      return {
        progressText: `Reach level 50 (current: Level ${userStats.currentLevel})`,
        progressPercentage: (level50 / 50) * 100,
        isCompleted: userStats.currentLevel >= 50,
        requirementText: "Reach level 50",
        actionHint: "Master level achievement awaits!"
      };
      
    case 'ultimate_selfrise_legend':
      const level100 = Math.min(userStats.currentLevel, 100);
      return {
        progressText: `Reach level 100 (current: Level ${userStats.currentLevel})`,
        progressPercentage: level100,
        isCompleted: userStats.currentLevel >= 100,
        requirementText: "Reach level 100",
        actionHint: "Ultimate legend status - incredible!"
      };
      
    case 'trophy_collector':
      const achievements10 = Math.min(userStats.unlockedAchievements, 10);
      return {
        progressText: `Unlock 10 achievements (${achievements10}/10)`,
        progressPercentage: (achievements10 / 10) * 100,
        isCompleted: achievements10 >= 10,
        requirementText: "Unlock 10 achievements",
        actionHint: "Keep unlocking achievements!"
      };
      
    case 'trophy_master':
      const achievements25 = Math.min(userStats.unlockedAchievements, 25);
      return {
        progressText: `Unlock 25 achievements (${achievements25}/25)`,
        progressPercentage: (achievements25 / 25) * 100,
        isCompleted: achievements25 >= 25,
        requirementText: "Unlock 25 achievements",
        actionHint: "You're a true trophy master!"
      };
      
    default:
      return getDefaultProgressHint(achievement);
  }
};

const generateSpecialProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  // For special achievements, provide generic hints
  return getDefaultProgressHint(achievement);
};

// ========================================
// COMPLETION INFORMATION
// ========================================

export const generateCompletionInfo = (achievement: Achievement, userStats: UserStats): CompletionInfo => {
  const accomplishment = getAccomplishmentText(achievement);
  const category = getCategoryDisplayName(achievement.category);
  const difficulty = getDifficultyLevel(achievement.rarity);
  
  return {
    accomplishment,
    completionDate: "Recently unlocked", // Would need actual unlock date
    timeToComplete: "Achieved through dedication", // Would need tracking
    category,
    difficultyLevel: difficulty
  };
};

const getAccomplishmentText = (achievement: Achievement): string => {
  const accomplishments: Record<string, string> = {
    // Habits
    'first_steps': "Created your first habit",
    'habit_builder': "Created 5 different habits", 
    'century_club': "Completed 100 habits total",
    'consistency_king': "Completed 1000 habits total",
    'habit_streak_champion': "Achieved 21-day habit streak",
    'century_streak': "Maintained 75-day habit streak",
    'multi_tasker': "Completed 5 habits in one day",
    'habit_legend': "Reached Level 50 with 50%+ habit XP",
    
    // Journal
    'first_reflection': "Wrote your first journal entry",
    'deep_thinker': "Wrote detailed 200+ character entry",
    'journal_enthusiast': "Wrote 100 journal entries",
    'grateful_heart': "Maintained 7-day journal streak",
    'gratitude_guardian': "Achieved 21-day journal streak", 
    'gratitude_guru': "Maintained 30-day journal streak",
    'eternal_gratitude': "Achieved 100-day journal streak",
    'bonus_seeker': "Wrote 50 bonus journal entries",
    
    // Goals
    'first_vision': "Set your first goal",
    'goal_getter': "Completed your first goal",
    'dream_fulfiller': "Completed 3 goals",
    'goal_champion': "Completed 5 goals",
    'achievement_unlocked': "Completed 10 goals",
    'ambitious': "Set ambitious goal (≥1000 target)",
    'progress_tracker': "Made progress 7 days straight",
    
    // Add more as needed...
  };
  
  return accomplishments[achievement.id] || "Completed achievement requirements";
};

const getCategoryDisplayName = (category: AchievementCategory): string => {
  const names = {
    [AchievementCategory.HABITS]: "Habits Category",
    [AchievementCategory.JOURNAL]: "Journal Category", 
    [AchievementCategory.GOALS]: "Goals Category",
    [AchievementCategory.CONSISTENCY]: "Consistency Category",
    [AchievementCategory.MASTERY]: "Mastery Category",
    [AchievementCategory.SPECIAL]: "Special Category",
    [AchievementCategory.SOCIAL]: "Social Category"
  };
  return names[category] || "Achievement Category";
};

const getDifficultyLevel = (rarity: AchievementRarity): string => {
  const difficulties = {
    [AchievementRarity.COMMON]: "Easy",
    [AchievementRarity.RARE]: "Medium", 
    [AchievementRarity.EPIC]: "Hard",
    [AchievementRarity.LEGENDARY]: "Legendary"
  };
  return difficulties[rarity] || "Unknown";
};

// ========================================
// SMART TOOLTIPS
// ========================================

export const generateSmartTooltip = (achievement: Achievement, progress: number): SmartTooltip => {
  const progressLevel = getProgressLevel(progress);
  
  return {
    primaryTip: getPrimaryTip(achievement, progressLevel),
    motivationalMessage: getMotivationalMessage(progressLevel),
    actionAdvice: getActionAdvice(achievement, progressLevel),
    estimatedEffort: getEffortEstimate(achievement, progress)
  };
};

const getProgressLevel = (progress: number): 'starting' | 'building' | 'advancing' | 'nearly_there' => {
  if (progress < 10) return 'starting';
  if (progress < 50) return 'building';
  if (progress < 85) return 'advancing';
  return 'nearly_there';
};

const getPrimaryTip = (achievement: Achievement, level: 'starting' | 'building' | 'advancing' | 'nearly_there'): string => {
  const categoryTips: Record<AchievementCategory, Record<'starting' | 'building' | 'advancing' | 'nearly_there', string>> = {
    [AchievementCategory.HABITS]: {
      starting: "Start by creating and completing habits daily",
      building: "Focus on consistency with your existing habits",
      advancing: "You're building great habit momentum!",
      nearly_there: "So close to this habit achievement!"
    },
    [AchievementCategory.JOURNAL]: {
      starting: "Begin with daily gratitude entries",
      building: "Keep up your journal writing practice",
      advancing: "Your gratitude practice is growing strong!",
      nearly_there: "Almost unlocked this journal achievement!"
    },
    [AchievementCategory.GOALS]: {
      starting: "Start by setting and working on your goals",
      building: "Keep making progress on your goals",
      advancing: "Excellent goal progress!",
      nearly_there: "Almost completed this goal achievement!"
    },
    [AchievementCategory.CONSISTENCY]: {
      starting: "Focus on building daily consistency",
      building: "Your consistency is improving!",
      advancing: "Great consistency streak building!",
      nearly_there: "So close to mastering consistency!"
    },
    [AchievementCategory.MASTERY]: {
      starting: "Explore all features to gain mastery",
      building: "You're learning the app well!",
      advancing: "Becoming a true SelfRise expert!",
      nearly_there: "Almost achieved mastery level!"
    },
    [AchievementCategory.SPECIAL]: {
      starting: "Explore special app features",
      building: "Making good use of special features!",
      advancing: "Unlocking special capabilities!",
      nearly_there: "Almost earned this special achievement!"
    },
    [AchievementCategory.SOCIAL]: {
      starting: "Engage with social features",
      building: "Building social connections!",
      advancing: "Great social engagement!",
      nearly_there: "Almost unlocked this social achievement!"
    }
  };
  
  return categoryTips[achievement.category]?.[level] || "Keep working towards this achievement!";
};

const getMotivationalMessage = (level: 'starting' | 'building' | 'advancing' | 'nearly_there'): string => {
  const messages: Record<'starting' | 'building' | 'advancing' | 'nearly_there', string> = {
    starting: "Every journey begins with a single step! 🌱",
    building: "You're building great momentum! 💪", 
    advancing: "Excellent progress - keep it up! 🚀",
    nearly_there: "So close to unlocking this achievement! 🎯"
  };
  return messages[level];
};

const getActionAdvice = (achievement: Achievement, level: 'starting' | 'building' | 'advancing' | 'nearly_there'): string => {
  const advice: Record<AchievementCategory, string> = {
    [AchievementCategory.HABITS]: "Complete habits daily to make progress",
    [AchievementCategory.JOURNAL]: "Write journal entries regularly",
    [AchievementCategory.GOALS]: "Set and work towards your goals",
    [AchievementCategory.CONSISTENCY]: "Maintain daily streaks",
    [AchievementCategory.MASTERY]: "Earn XP and level up",
    [AchievementCategory.SPECIAL]: "Explore all app features",
    [AchievementCategory.SOCIAL]: "Engage with community features"
  };
  
  return advice[achievement.category] || "Keep using the app features";
};

const getEffortEstimate = (achievement: Achievement, progress: number): string | undefined => {
  if (progress >= 90) return "Almost there!";
  if (progress >= 70) return "A few more days";
  if (progress >= 40) return "~1-2 weeks";
  if (progress >= 20) return "~2-4 weeks";
  return "Several weeks of effort";
};

// ========================================
// HELPERS
// ========================================

const getDefaultProgressHint = (achievement: Achievement): ProgressHint => {
  return {
    progressText: "Progress towards this achievement",
    progressPercentage: 0,
    isCompleted: false,
    requirementText: achievement.description,
    actionHint: "Use the app features to unlock this achievement!"
  };
};