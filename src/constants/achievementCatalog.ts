// Core Achievement Catalog - Sub-checkpoint 4.5.4.B
// Basic Achievement Catalog (15 Core Achievements) 📜

import { Achievement, AchievementCategory, AchievementRarity, XPSourceType } from '../types/gamification';
import { ACHIEVEMENT_XP_REWARDS } from './achievements';

/**
 * Core catalog of 15 essential achievements for SelfRise V2
 * Organized by category with balanced progression and engagement
 */
export const CORE_ACHIEVEMENTS: Achievement[] = [
  
  // ========================================
  // FIRST STEPS ACHIEVEMENTS (3 achievements)  
  // ========================================
  
  {
    id: 'first-habit',
    name: 'First Steps',
    description: 'Create your very first habit and begin your journey to self-improvement',
    icon: '🌱',
    category: AchievementCategory.HABITS,
    rarity: AchievementRarity.COMMON,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.COMMON], // 50 XP
    condition: {
      type: 'count',
      target: 1,
      source: 'habit_creation', // Custom source for habit creation tracking
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'first-journal',
    name: 'First Reflection',
    description: 'Write your first gratitude journal entry and start practicing mindfulness',
    icon: '📝',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.COMMON,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.COMMON], // 50 XP
    condition: {
      type: 'count',
      target: 1,
      source: XPSourceType.JOURNAL_ENTRY,
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'first-goal',
    name: 'Dream Starter',
    description: 'Set your first goal and take the first step toward achieving your dreams',
    icon: '🎯',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.COMMON,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.COMMON], // 50 XP
    condition: {
      type: 'count',
      target: 1,
      source: 'goal_creation', // Custom source for goal creation tracking
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  // ========================================
  // MILESTONE ACHIEVEMENTS (4 achievements)
  // ========================================
  
  {
    id: 'habit-century',
    name: 'Century Club',
    description: 'Complete 100 habit tasks and prove your dedication to consistent improvement',
    icon: '💯',
    category: AchievementCategory.HABITS,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 100,
      source: XPSourceType.HABIT_COMPLETION,
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    maxProgress: 100,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'journal-enthusiast',
    name: 'Chronicle Master',
    description: 'Write 100 journal entries and become a master of self-reflection',
    icon: '📚',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 100,
      source: XPSourceType.JOURNAL_ENTRY,
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    maxProgress: 100,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintain a 30-day habit streak and show incredible consistency',
    icon: '🔥',
    category: AchievementCategory.CONSISTENCY,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'streak',
      target: 30,
      source: 'habit_streak', // Custom source for max habit streak
      operator: 'gte',
      timeframe: 'daily'
    },
    isProgressive: true,
    isSecret: false,
    maxProgress: 30,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'level-milestone',
    name: 'Level Up!',
    description: 'Reach level 10 and prove your commitment to personal growth',
    icon: '🚀',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'level',
      target: 10,
      source: 'user_level', // Custom source for user level tracking
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  // ========================================
  // CONSISTENCY ACHIEVEMENTS (4 achievements)
  // ========================================
  
  {
    id: 'daily-visitor',
    name: 'Daily Visitor',
    description: 'Open SelfRise for 7 consecutive days and build the habit of daily growth',
    icon: '📅',
    category: AchievementCategory.CONSISTENCY,
    rarity: AchievementRarity.COMMON,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.COMMON], // 50 XP
    condition: {
      type: 'streak',
      target: 7,
      source: XPSourceType.DAILY_LAUNCH,
      operator: 'gte',
      timeframe: 'daily'
    },
    isProgressive: true,
    isSecret: false,
    maxProgress: 7,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'grateful-heart',
    name: 'Grateful Heart', 
    description: 'Maintain a 7-day gratitude journal streak and cultivate thankfulness',
    icon: '💖',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.COMMON,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.COMMON], // 50 XP
    condition: {
      type: 'streak',
      target: 7,
      source: 'journal_streak', // Custom source for journal streak tracking
      operator: 'gte',
      timeframe: 'daily'
    },
    isProgressive: true,
    isSecret: false,
    maxProgress: 7,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'goal-getter',
    name: 'Goal Getter',
    description: 'Complete your first goal and experience the joy of achievement',
    icon: '🏆',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 1,
      source: XPSourceType.GOAL_COMPLETION,
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'multi-tasker',
    name: 'Multi-Tasker',
    description: 'Complete 5 different habits in a single day and show your versatility',
    icon: '🎭',
    category: AchievementCategory.HABITS,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 5,
      source: 'daily_habit_variety', // Custom source for unique habits per day
      operator: 'gte',
      timeframe: 'daily'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  // ========================================
  // BALANCE MASTER ACHIEVEMENTS (2 achievements)
  // ========================================
  
  {
    id: 'triple-crown',
    name: 'Triple Crown',
    description: 'Use all 3 features (habits, journal, goals) in a single day - achieve perfect balance',
    icon: '👑',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'combination',
      target: 1,
      source: 'daily_feature_combo', // Custom source for feature combination tracking
      operator: 'gte',
      timeframe: 'daily',
      additionalConditions: [
        {
          type: 'count',
          target: 1,
          source: XPSourceType.HABIT_COMPLETION,
          operator: 'gte',
          timeframe: 'daily'
        },
        {
          type: 'count',
          target: 1,
          source: XPSourceType.JOURNAL_ENTRY,
          operator: 'gte',
          timeframe: 'daily'
        },
        {
          type: 'count',
          target: 1,
          source: XPSourceType.GOAL_PROGRESS,
          operator: 'gte',
          timeframe: 'daily'
        }
      ]
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'recommendation-master',
    name: 'Wise Listener',
    description: 'Follow 20 personalized recommendations and embrace guided growth',
    icon: '🧭',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 20,
      source: XPSourceType.RECOMMENDATION_FOLLOW,
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    maxProgress: 20,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  // ========================================
  // SPECIAL DESIGNED ACHIEVEMENTS (2 achievements)
  // ========================================
  
  {
    id: 'deep-thinker',
    name: 'Deep Thinker',
    description: 'Write a journal entry with 200+ characters and show meaningful reflection',
    icon: '🤔',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.COMMON,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.COMMON], // 50 XP
    condition: {
      type: 'value',
      target: 200,
      source: 'journal_entry_length', // Custom source for entry character count
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'ambitious',
    name: 'Ambitious',
    description: 'Create a goal with target value ≥ 1000 and dream big!',
    icon: '🌟',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.COMMON,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.COMMON], // 50 XP
    condition: {
      type: 'value',
      target: 1000,
      source: 'goal_target_value', // Custom source for goal target tracking
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  }
];

// ========================================
// CATALOG METADATA & STATISTICS
// ========================================

export const CORE_CATALOG_META = {
  totalAchievements: CORE_ACHIEVEMENTS.length,
  version: '1.0.0',
  lastUpdated: new Date('2025-08-04'),
  
  // Category distribution analysis
  categoryDistribution: {
    [AchievementCategory.HABITS]: CORE_ACHIEVEMENTS.filter(a => a.category === AchievementCategory.HABITS).length,
    [AchievementCategory.JOURNAL]: CORE_ACHIEVEMENTS.filter(a => a.category === AchievementCategory.JOURNAL).length,
    [AchievementCategory.GOALS]: CORE_ACHIEVEMENTS.filter(a => a.category === AchievementCategory.GOALS).length,
    [AchievementCategory.CONSISTENCY]: CORE_ACHIEVEMENTS.filter(a => a.category === AchievementCategory.CONSISTENCY).length,
    [AchievementCategory.MASTERY]: CORE_ACHIEVEMENTS.filter(a => a.category === AchievementCategory.MASTERY).length,
    [AchievementCategory.SOCIAL]: CORE_ACHIEVEMENTS.filter(a => a.category === AchievementCategory.SOCIAL).length,
    [AchievementCategory.SPECIAL]: CORE_ACHIEVEMENTS.filter(a => a.category === AchievementCategory.SPECIAL).length,
  },
  
  // Rarity distribution analysis  
  rarityDistribution: {
    [AchievementRarity.COMMON]: CORE_ACHIEVEMENTS.filter(a => a.rarity === AchievementRarity.COMMON).length,
    [AchievementRarity.RARE]: CORE_ACHIEVEMENTS.filter(a => a.rarity === AchievementRarity.RARE).length,
    [AchievementRarity.EPIC]: CORE_ACHIEVEMENTS.filter(a => a.rarity === AchievementRarity.EPIC).length,
    [AchievementRarity.LEGENDARY]: CORE_ACHIEVEMENTS.filter(a => a.rarity === AchievementRarity.LEGENDARY).length,
  },

  // Achievement type analysis
  progressiveCount: CORE_ACHIEVEMENTS.filter(a => a.isProgressive).length,
  oneTimeCount: CORE_ACHIEVEMENTS.filter(a => !a.isProgressive).length,
  secretCount: CORE_ACHIEVEMENTS.filter(a => a.isSecret).length,
  publicCount: CORE_ACHIEVEMENTS.filter(a => !a.isSecret).length,

  // XP reward analysis
  totalXPAvailable: CORE_ACHIEVEMENTS.reduce((total, a) => total + a.xpReward, 0),
  averageXPReward: CORE_ACHIEVEMENTS.reduce((total, a) => total + a.xpReward, 0) / CORE_ACHIEVEMENTS.length
} as const;

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get achievements by category
 */
export const getAchievementsByCategory = (category: AchievementCategory): Achievement[] => {
  return CORE_ACHIEVEMENTS.filter(achievement => achievement.category === category);
};

/**
 * Get achievements by rarity
 */
export const getAchievementsByRarity = (rarity: AchievementRarity): Achievement[] => {
  return CORE_ACHIEVEMENTS.filter(achievement => achievement.rarity === rarity);
};

/**
 * Get progressive achievements only
 */
export const getProgressiveAchievements = (): Achievement[] => {
  return CORE_ACHIEVEMENTS.filter(achievement => achievement.isProgressive);
};

/**
 * Get achievement by ID
 */
export const getAchievementById = (id: string): Achievement | undefined => {
  return CORE_ACHIEVEMENTS.find(achievement => achievement.id === id);
};

/**
 * Get achievements suitable for new users (onboarding)
 */
export const getNewUserAchievements = (): Achievement[] => {
  return CORE_ACHIEVEMENTS.filter(achievement => 
    achievement.rarity === AchievementRarity.COMMON && 
    !achievement.isSecret &&
    (achievement.id.includes('first') || achievement.id === 'daily-visitor' || achievement.id === 'deep-thinker')
  );
};

/**
 * Calculate total XP available from all core achievements
 */
export const getTotalAvailableXP = (): number => {
  return CORE_CATALOG_META.totalXPAvailable;
};

/**
 * Get achievements by difficulty (based on target values)
 */
export const getAchievementsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): Achievement[] => {
  return CORE_ACHIEVEMENTS.filter(achievement => {
    const target = achievement.condition.target;
    switch (difficulty) {
      case 'easy': return target <= 10;
      case 'medium': return target > 10 && target <= 50;
      case 'hard': return target > 50;
      default: return false;
    }
  });
};