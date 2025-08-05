// Core Achievement Catalog - Sub-checkpoint 4.5.4.B
// Basic Achievement Catalog (15 Core Achievements) 📜

import { Achievement, AchievementCategory, AchievementRarity } from '../types/gamification';
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
      source: 'journal_entry',
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
    name: 'First Vision',
    description: 'Set your first goal and define where you want your journey to lead',
    icon: '🎯',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.COMMON,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.COMMON], // 50 XP
    condition: {
      type: 'count',
      target: 1,
      source: 'goal_creation',
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
    id: 'weekly-warrior',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day streak in any habit - prove your dedication',
    icon: '⚔️',
    category: AchievementCategory.CONSISTENCY,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'streak',
      target: 7,
      source: 'habit_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: 'Achieve a 30-day streak - you are truly building lasting habits',
    icon: '👑',
    category: AchievementCategory.CONSISTENCY,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'streak',
      target: 30,
      source: 'habit_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'hundred-days',
    name: 'Centurion',
    description: 'Reach 100 days of consistency - join the elite ranks of habit masters',
    icon: '🏛️',
    category: AchievementCategory.CONSISTENCY,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'streak',
      target: 100,
      source: 'habit_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'journal-streaker',
    name: 'Gratitude Guardian',
    description: 'Write in your journal for 21 consecutive days',
    icon: '📖',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'streak',
      target: 21,
      source: 'journal_entry',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  // ========================================
  // MASTERY ACHIEVEMENTS (4 achievements)
  // ========================================

  {
    id: 'habit-collector',
    name: 'Habit Collector',
    description: 'Create 5 different habits - diversify your growth',
    icon: '📚',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 5,
      source: 'habit_creation',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'completion-machine',
    name: 'Completion Machine',
    description: 'Complete 100 habit tasks - you are unstoppable',
    icon: '⚡',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 100,
      source: 'habit_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'journal-master',
    name: 'Reflection Sage',
    description: 'Write 100 journal entries - master of self-reflection',
    icon: '🧙‍♂️',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 100,
      source: 'journal_entry',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'goal-achiever',
    name: 'Dream Fulfiller',
    description: 'Complete 3 goals - you turn dreams into reality',
    icon: '🌟',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 3,
      source: 'goal_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  // ========================================
  // SPECIAL ACHIEVEMENTS (4 achievements)
  // ========================================

  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete habits before 8 AM for 7 consecutive days',
    icon: '🌅',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'time',
      target: 8, // 8 AM
      source: 'habit_completion',
      operator: 'lt',
      timeframe: 'weekly',
      additionalConditions: [{
        type: 'streak',
        target: 7,
        source: 'habit_completion',
        operator: 'gte',
        timeframe: 'all_time'
      }]
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Complete all scheduled habits for an entire week',
    icon: '💎',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'percentage',
      target: 100,
      source: 'habit_completion',
      operator: 'eq',
      timeframe: 'weekly'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Stay consistent with habits even on weekends for 4 weeks',
    icon: '🏔️',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'combination',
      target: 4,
      source: 'habit_completion',
      operator: 'gte',
      timeframe: 'monthly',
      metadata: {
        weekendOnly: true,
        consecutiveWeeks: true
      }
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  },

  {
    id: 'legendary-master',
    name: 'SelfRise Legend',
    description: 'Achieve mastery in all areas: 10 goals completed, 500 habits done, 365 journal entries',
    icon: '🏆',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'combination',
      target: 3,
      source: 'multi_source',
      operator: 'eq',
      timeframe: 'all_time',
      additionalConditions: [
        {
          type: 'count',
          target: 10,
          source: 'goal_completion',
          operator: 'gte',
          timeframe: 'all_time'
        },
        {
          type: 'count',
          target: 500,
          source: 'habit_completion',
          operator: 'gte',
          timeframe: 'all_time'
        },
        {
          type: 'count',
          target: 365,
          source: 'journal_entry',
          operator: 'gte',
          timeframe: 'all_time'
        }
      ]
    },
    isProgressive: true,
    isSecret: true,
    createdAt: new Date('2025-08-04'),
    updatedAt: new Date('2025-08-04')
  }
];

/**
 * Get achievements by category for filtering
 */
export const getAchievementsByCategory = (category: AchievementCategory): Achievement[] => {
  return CORE_ACHIEVEMENTS.filter(achievement => achievement.category === category);
};

/**
 * Get achievements by rarity for filtering
 */
export const getAchievementsByRarity = (rarity: AchievementRarity): Achievement[] => {
  return CORE_ACHIEVEMENTS.filter(achievement => achievement.rarity === rarity);
};

/**
 * Get progressive achievements (those that show progress bars)
 */
export const getProgressiveAchievements = (): Achievement[] => {
  return CORE_ACHIEVEMENTS.filter(achievement => achievement.isProgressive);
};

/**
 * Get secret achievements (hidden until unlocked)
 */
export const getSecretAchievements = (): Achievement[] => {
  return CORE_ACHIEVEMENTS.filter(achievement => achievement.isSecret);
};

/**
 * Achievement statistics
 */
export const ACHIEVEMENT_CATALOG_STATS = {
  totalAchievements: CORE_ACHIEVEMENTS.length,
  byCategory: {
    [AchievementCategory.HABITS]: getAchievementsByCategory(AchievementCategory.HABITS).length,
    [AchievementCategory.JOURNAL]: getAchievementsByCategory(AchievementCategory.JOURNAL).length,
    [AchievementCategory.GOALS]: getAchievementsByCategory(AchievementCategory.GOALS).length,
    [AchievementCategory.CONSISTENCY]: getAchievementsByCategory(AchievementCategory.CONSISTENCY).length,
    [AchievementCategory.MASTERY]: getAchievementsByCategory(AchievementCategory.MASTERY).length,
    [AchievementCategory.SOCIAL]: getAchievementsByCategory(AchievementCategory.SOCIAL).length,
    [AchievementCategory.SPECIAL]: getAchievementsByCategory(AchievementCategory.SPECIAL).length,
  },
  byRarity: {
    [AchievementRarity.COMMON]: getAchievementsByRarity(AchievementRarity.COMMON).length,
    [AchievementRarity.RARE]: getAchievementsByRarity(AchievementRarity.RARE).length,
    [AchievementRarity.EPIC]: getAchievementsByRarity(AchievementRarity.EPIC).length,
    [AchievementRarity.LEGENDARY]: getAchievementsByRarity(AchievementRarity.LEGENDARY).length,
  },
  progressiveCount: getProgressiveAchievements().length,
  secretCount: getSecretAchievements().length,
};