// Complete Achievement Catalog - Sub-checkpoint 4.5.10.C
// Complete Achievement Catalog (52 Total Achievements) 📜

import { Achievement, AchievementCategory, AchievementRarity } from '../types/gamification';
import { ACHIEVEMENT_XP_REWARDS } from './achievements';

/**
 * Complete catalog of 52 achievements for SelfRise V2
 * Organized by category with balanced progression and long-term engagement
 * Categories: Habits (8), Journal (8), Goals (7), Consistency (8), Mastery (9), Special (14 including 10 Loyalty)
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
    id: 'habit-builder',
    name: 'Habit Builder',
    description: 'Create 5 different habits to diversify your personal development journey',
    icon: '🏗️',
    category: AchievementCategory.HABITS,
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
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Complete 100 habit tasks - join the elite ranks of consistent achievers',
    icon: '💯',
    category: AchievementCategory.HABITS,
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
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Complete 1000 habit tasks - you are the master of consistency',
    icon: '👑',
    category: AchievementCategory.HABITS,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'count',
      target: 1000,
      source: 'habit_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'streak-champion',
    name: 'Habit Streak Champion',
    description: 'Achieve a 21-day streak with any single habit - building lasting change',
    icon: '🏆',
    category: AchievementCategory.HABITS,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'streak',
      target: 21,
      source: 'habit_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'century-streak',
    name: 'Century Streak',
    description: 'Maintain a 75-day streak with any habit - approaching legendary status',
    icon: '⚡',
    category: AchievementCategory.HABITS,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'streak',
      target: 75,
      source: 'habit_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'multi-tasker',
    name: 'Multi-Tasker',
    description: 'Complete 5 different habits in a single day - showing diverse commitment',
    icon: '⚡',
    category: AchievementCategory.HABITS,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 5,
      source: 'daily_habit_variety',
      operator: 'gte',
      timeframe: 'daily'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'habit-legend',
    name: 'Habit Legend',
    description: 'Reach Level 50 "Specialist V" with XP earned primarily from habit activities - true mastery',
    icon: '🏆',
    category: AchievementCategory.HABITS,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'combination',
      target: 2,
      source: 'multi_source',
      operator: 'eq',
      timeframe: 'all_time',
      additionalConditions: [
        {
          type: 'level',
          target: 50,
          source: 'xp_total',
          operator: 'gte',
          timeframe: 'all_time'
        },
        {
          type: 'percentage',
          target: 50,
          source: 'habit_xp_ratio',
          operator: 'gte',
          timeframe: 'all_time'
        }
      ]
    },
    isProgressive: true,
    isSecret: true,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
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
    id: 'deep-thinker',
    name: 'Deep Thinker',
    description: 'Write a journal entry with at least 200 characters - show your thoughtfulness',
    icon: '🤔',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'value',
      target: 200,
      source: 'journal_entry_length',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'journal-enthusiast',
    name: 'Journal Enthusiast',
    description: 'Write 100 journal entries - you are building a beautiful habit of reflection',
    icon: '📖',
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
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },


  {
    id: 'grateful-heart',
    name: 'Grateful Heart',
    description: 'Maintain a 7-day journal writing streak - consistency builds gratitude',
    icon: '💝',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'streak',
      target: 7,
      source: 'journal_entry',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'gratitude-guru',
    name: 'Gratitude Guru',
    description: 'Achieve a 30-day journal writing streak - you are a master of daily reflection',
    icon: '🧘‍♀️',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'streak',
      target: 30,
      source: 'journal_entry',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'eternal-gratitude',
    name: 'Eternal Gratitude',
    description: 'Maintain a 100-day journal streak - your gratitude practice is legendary',
    icon: '🌟',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'streak',
      target: 100,
      source: 'journal_entry',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'bonus-seeker',
    name: 'Bonus Seeker',
    description: 'Write 50 bonus journal entries - you go above and beyond in your gratitude practice',
    icon: '⭐',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 50,
      source: 'journal_bonus_entries',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
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

  {
    id: 'goal-getter',
    name: 'Goal Getter',
    description: 'Complete your first goal - you turn dreams into reality',
    icon: '✅',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 1,
      source: 'goal_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'goal-champion',
    name: 'Goal Champion',
    description: 'Complete 5 goals - you are becoming a master of achievement',
    icon: '🏆',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 5,
      source: 'goal_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'achievement-unlocked',
    name: 'Achievement Unlocked',
    description: 'Complete 10 goals - you are a legendary goal achiever',
    icon: '🎖️',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'count',
      target: 10,
      source: 'goal_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'ambitious',
    name: 'Ambitious',
    description: 'Set a goal with target value of 1000 or more - you dream big',
    icon: '🚀',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'value',
      target: 1000,
      source: 'goal_target_value',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
  },

  {
    id: 'progress-tracker',
    name: 'Progress Tracker',
    description: 'Make progress on goals for 7 consecutive days - consistency leads to success',
    icon: '📈',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'streak',
      target: 7,
      source: 'goal_progress_consecutive_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-05')
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
    category: AchievementCategory.CONSISTENCY,
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
  // MASTERY ACHIEVEMENTS (1 achievement)
  // ========================================


  {
    id: 'goal-achiever',
    name: 'Dream Fulfiller',
    description: 'Complete 3 goals - you turn dreams into reality',
    icon: '🌟',
    category: AchievementCategory.MASTERY,
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
  // CONSISTENCY ACHIEVEMENTS - Advanced (8 achievements)
  // ========================================

  {
    id: 'daily-visitor',
    name: 'Daily Visitor',
    description: 'Use the app for 7 consecutive days - building a healthy habit',
    icon: '📅',
    category: AchievementCategory.CONSISTENCY,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'streak',
      target: 7,
      source: 'app_usage_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'dedicated-user',
    name: 'Dedicated User', 
    description: 'Use the app for 30 consecutive days - your commitment is inspiring',
    icon: '🎯',
    category: AchievementCategory.CONSISTENCY,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'streak',
      target: 30,
      source: 'app_usage_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'perfect-month',
    name: 'Perfect Month',
    description: 'Complete activities in all 3 areas (habits, journal, goals) for 28+ days in any month',
    icon: '🌟',
    category: AchievementCategory.CONSISTENCY,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'count',
      target: 28,
      source: 'daily_feature_combo',
      operator: 'gte',
      timeframe: 'monthly'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'triple-crown',
    name: 'Triple Crown',
    description: 'Maintain 7+ day streaks in habits, journal, and goals simultaneously',
    icon: '👑',
    category: AchievementCategory.CONSISTENCY,
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
          type: 'streak',
          target: 7,
          source: 'habit_completion',
          operator: 'gte',
          timeframe: 'all_time'
        },
        {
          type: 'streak', 
          target: 7,
          source: 'journal_entry',
          operator: 'gte',
          timeframe: 'all_time'
        },
        {
          type: 'streak',
          target: 7,
          source: 'goal_progress_consecutive_days',
          operator: 'gte',
          timeframe: 'all_time'
        }
      ]
    },
    isProgressive: false,
    isSecret: true,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  // ========================================
  // MASTERY ACHIEVEMENTS - Advanced (8 achievements)
  // ========================================

  {
    id: 'level-up',
    name: 'Level Up',
    description: 'Reach level 10 "Beginner V" - you are growing stronger',
    icon: '⬆️',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'level',
      target: 10,
      source: 'xp_total',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'selfrise-expert',
    name: 'SelfRise Expert',
    description: 'Reach level 25 "Adept V" - you have mastered the fundamentals',
    icon: '🎓',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'level',
      target: 25,
      source: 'xp_total',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'selfrise-master',
    name: 'SelfRise Master',
    description: 'Reach level 50 "Specialist V" - you are a true master of self-improvement',
    icon: '🏅',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'level',
      target: 50,
      source: 'xp_total',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'recommendation-master',
    name: 'Recommendation Master',
    description: 'Follow 20 personalized recommendations from the For You section',
    icon: '💡',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 20,
      source: 'recommendations_followed',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'balance-master',
    name: 'Balance Master',
    description: 'Use all 3 features (habits, journal, goals) in a single day 10 times',
    icon: '⚖️',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 10,
      source: 'daily_feature_combo',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'trophy-collector-basic',
    name: 'Trophy Collector',
    description: 'Unlock 10 achievements - you are building an impressive collection',
    icon: '🏆',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 10,
      source: 'achievements_unlocked',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'trophy-collector-master',
    name: 'Trophy Master',
    description: 'Unlock 25 achievements - your trophy room is legendary',
    icon: '🏆',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'count',
      target: 25,
      source: 'achievements_unlocked',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'ultimate-selfrise-legend',
    name: 'Ultimate SelfRise Legend',
    description: 'Reach level 100 "Mythic V" - you have achieved the ultimate mastery of self-improvement',
    icon: '🌟',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'level',
      target: 100,
      source: 'xp_total',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: true,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  // ========================================
  // SPECIAL ACHIEVEMENTS (4 achievements)
  // ========================================

  {
    id: 'lightning-start',
    name: 'Lightning Start',
    description: 'Create and complete a habit on the same day 3 times - instant action taker',
    icon: '⚡',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 3,
      source: 'same_day_habit_creation_completion',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'seven-wonder',
    name: 'Seven Wonder',
    description: 'Have 7 or more active habits at the same time - master of organization',
    icon: '🏛️',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 7,
      source: 'active_habits_simultaneous',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
  },

  {
    id: 'persistence-pays',
    name: 'Persistence Pays',
    description: 'Resume activity after a 3+ day break and complete 7 activities - comeback champion',
    icon: '💪',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 7,
      source: 'comeback_activities',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-06'),
    updatedAt: new Date('2025-08-06')
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
  },

  // ========================================
  // LOYALTY ACHIEVEMENTS (10 achievements) - Sub-checkpoint 4.5.10.C
  // ========================================

  {
    id: 'loyalty-first-week',
    name: 'First Week',
    description: '7 aktivních dní celkem - začátek vaší věrnostní cesty',
    icon: '🌱',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.COMMON,
    xpReward: 75,
    condition: {
      type: 'count',
      target: 7,
      source: 'loyalty_total_active_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-21')
  },

  {
    id: 'loyalty-two-weeks-strong',
    name: 'Two Weeks Strong',
    description: '14 aktivních dní celkem - vaše oddanost roste',
    icon: '💪',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.RARE,
    xpReward: 100,
    condition: {
      type: 'count',
      target: 14,
      source: 'loyalty_total_active_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-21')
  },

  {
    id: 'loyalty-three-weeks-committed',
    name: 'Three Weeks Committed',
    description: '21 aktivních dní celkem - jste oddaný svému růstu',
    icon: '🔥',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.RARE,
    xpReward: 125,
    condition: {
      type: 'count',
      target: 21,
      source: 'loyalty_total_active_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-21')
  },

  {
    id: 'loyalty-month-explorer',
    name: 'Month Explorer',
    description: '30 aktivních dní celkem - objevujete svůj potenciál',
    icon: '🗺️',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    xpReward: 150,
    condition: {
      type: 'count',
      target: 30,
      source: 'loyalty_total_active_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-21')
  },

  {
    id: 'loyalty-two-month-veteran',
    name: 'Two Month Veteran',
    description: '60 aktivních dní celkem - jste zkušený v osobním růstu',
    icon: '⚔️',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    xpReward: 200,
    condition: {
      type: 'count',
      target: 60,
      source: 'loyalty_total_active_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-21')
  },

  {
    id: 'loyalty-century-user',
    name: 'Century User',
    description: '100 aktivních dní celkem - jste mezi elitou uživatelů',
    icon: '💯',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    xpReward: 300,
    condition: {
      type: 'count',
      target: 100,
      source: 'loyalty_total_active_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-21')
  },

  {
    id: 'loyalty-half-year-hero',
    name: 'Half Year Hero',
    description: '183 aktivních dní celkem - váš závazek je legendární',
    icon: '🦸‍♀️',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: 500,
    condition: {
      type: 'count',
      target: 183,
      source: 'loyalty_total_active_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-21')
  },

  {
    id: 'loyalty-year-legend',
    name: 'Year Legend',
    description: '365 aktivních dní celkem - dosáhli jste legendárního statusu',
    icon: '👑',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: 1000,
    condition: {
      type: 'count',
      target: 365,
      source: 'loyalty_total_active_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-21')
  },

  {
    id: 'loyalty-ultimate-veteran',
    name: 'Ultimate Veteran',
    description: '500 aktivních dní celkem - vaše oddanost je nepřekonatelná',
    icon: '🏅',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: 1500,
    condition: {
      type: 'count',
      target: 500,
      source: 'loyalty_total_active_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-21')
  },

  {
    id: 'loyalty-master',
    name: 'Loyalty Master',
    description: '1000 aktivních dní celkem - dosáhli jste ultimátní věrnosti',
    icon: '🏆',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: 2000,
    condition: {
      type: 'count',
      target: 1000,
      source: 'loyalty_total_active_days',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: true,
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-21')
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