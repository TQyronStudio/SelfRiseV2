// Complete Achievement Catalog - Sub-checkpoint 4.5.10.C
// Complete Achievement Catalog (78 Total Achievements) 📜

import { Achievement, AchievementCategory, AchievementRarity } from '../types/gamification';
import { ACHIEVEMENT_XP_REWARDS } from './achievements';

/**
 * Complete catalog of 78 achievements for SelfRise V2
 * Organized by category with balanced progression and long-term engagement
 * Categories: Habits (8), Journal (31), Goals (8), Consistency (8), Mastery (9), Special (14 including 10 Loyalty)
 * Updated: 2025-08-30 - Added 24 new Journal Bonus achievements for ⭐🔥👑 milestones
 */
export const CORE_ACHIEVEMENTS: Achievement[] = [
  
  // ========================================
  // FIRST STEPS ACHIEVEMENTS (3 achievements)  
  // ========================================
  
  {
    id: 'first-habit',
    nameKey: 'achievements.first_habit.name',
    descriptionKey: 'achievements.first_habit.description',
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
    nameKey: 'achievements.habit_builder.name',
    descriptionKey: 'achievements.habit_builder.description',
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
    nameKey: 'achievements.century_club.name',
    descriptionKey: 'achievements.century_club.description',
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
    nameKey: 'achievements.consistency_king.name',
    descriptionKey: 'achievements.consistency_king.description',
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
    nameKey: 'achievements.streak_champion.name',
    descriptionKey: 'achievements.streak_champion.description',
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
    nameKey: 'achievements.century_streak.name',
    descriptionKey: 'achievements.century_streak.description',
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
    nameKey: 'achievements.multi_tasker.name',
    descriptionKey: 'achievements.multi_tasker.description',
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
    nameKey: 'achievements.habit_legend.name',
    descriptionKey: 'achievements.habit_legend.description',
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
    nameKey: 'achievements.first_journal.name',
    descriptionKey: 'achievements.first_journal.description',
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
    nameKey: 'achievements.deep_thinker.name',
    descriptionKey: 'achievements.deep_thinker.description',
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
    nameKey: 'achievements.journal_enthusiast.name',
    descriptionKey: 'achievements.journal_enthusiast.description',
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
    nameKey: 'achievements.grateful_heart.name',
    descriptionKey: 'achievements.grateful_heart.description',
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
    nameKey: 'achievements.gratitude_guru.name',
    descriptionKey: 'achievements.gratitude_guru.description',
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
    nameKey: 'achievements.eternal_gratitude.name',
    descriptionKey: 'achievements.eternal_gratitude.description',
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
    nameKey: 'achievements.bonus_seeker.name',
    descriptionKey: 'achievements.bonus_seeker.description',
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
    nameKey: 'achievements.first_goal.name',
    descriptionKey: 'achievements.first_goal.description',
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
    nameKey: 'achievements.goal_getter.name',
    descriptionKey: 'achievements.goal_getter.description',
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
    nameKey: 'achievements.goal_champion.name',
    descriptionKey: 'achievements.goal_champion.description',
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
    nameKey: 'achievements.achievement_unlocked.name',
    descriptionKey: 'achievements.achievement_unlocked.description',
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
    nameKey: 'achievements.ambitious.name',
    descriptionKey: 'achievements.ambitious.description',
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
    nameKey: 'achievements.progress_tracker.name',
    descriptionKey: 'achievements.progress_tracker.description',
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

  {
    id: 'mega-dreamer',
    nameKey: 'achievements.mega_dreamer.name',
    descriptionKey: 'achievements.mega_dreamer.description',
    icon: '🌟',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'value',
      target: 1000000,
      source: 'goal_target_value',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-09-06'),
    updatedAt: new Date('2025-09-06')
  },

  {
    id: 'million-achiever',
    nameKey: 'achievements.million_achiever.name',
    descriptionKey: 'achievements.million_achiever.description',
    icon: '💎',
    category: AchievementCategory.GOALS,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'count',
      target: 1,
      source: 'goal_completion_million_plus',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-09-06'),
    updatedAt: new Date('2025-09-06')
  },

  // ========================================
  // CONSISTENCY ACHIEVEMENTS (4 achievements)
  // ========================================

  {
    id: 'weekly-warrior',
    nameKey: 'achievements.weekly_warrior.name',
    descriptionKey: 'achievements.weekly_warrior.description',
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
    nameKey: 'achievements.monthly_master.name',
    descriptionKey: 'achievements.monthly_master.description',
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
    nameKey: 'achievements.hundred_days.name',
    descriptionKey: 'achievements.hundred_days.description',
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
    nameKey: 'achievements.journal_streaker.name',
    descriptionKey: 'achievements.journal_streaker.description',
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
    nameKey: 'achievements.goal_achiever.name',
    descriptionKey: 'achievements.goal_achiever.description',
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
    nameKey: 'achievements.daily_visitor.name',
    descriptionKey: 'achievements.daily_visitor.description',
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
    nameKey: 'achievements.dedicated_user.name',
    descriptionKey: 'achievements.dedicated_user.description',
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
    nameKey: 'achievements.perfect_month.name',
    descriptionKey: 'achievements.perfect_month.description',
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
    nameKey: 'achievements.triple_crown.name',
    descriptionKey: 'achievements.triple_crown.description',
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
    nameKey: 'achievements.level_up.name',
    descriptionKey: 'achievements.level_up.description',
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
    nameKey: 'achievements.selfrise_expert.name',
    descriptionKey: 'achievements.selfrise_expert.description',
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
    nameKey: 'achievements.selfrise_master.name',
    descriptionKey: 'achievements.selfrise_master.description',
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
    nameKey: 'achievements.recommendation_master.name',
    descriptionKey: 'achievements.recommendation_master.description',
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
    nameKey: 'achievements.balance_master.name',
    descriptionKey: 'achievements.balance_master.description',
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
    nameKey: 'achievements.trophy_collector_basic.name',
    descriptionKey: 'achievements.trophy_collector_basic.description',
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
    nameKey: 'achievements.trophy_collector_master.name',
    descriptionKey: 'achievements.trophy_collector_master.description',
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
    nameKey: 'achievements.ultimate_selfrise_legend.name',
    descriptionKey: 'achievements.ultimate_selfrise_legend.description',
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
    nameKey: 'achievements.lightning_start.name',
    descriptionKey: 'achievements.lightning_start.description',
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
    nameKey: 'achievements.seven_wonder.name',
    descriptionKey: 'achievements.seven_wonder.description',
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
    nameKey: 'achievements.persistence_pays.name',
    descriptionKey: 'achievements.persistence_pays.description',
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
    nameKey: 'achievements.legendary_master.name',
    descriptionKey: 'achievements.legendary_master.description',
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
    nameKey: 'achievements.loyalty_first_week.name',
    descriptionKey: 'achievements.loyalty_first_week.description',
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
    nameKey: 'achievements.loyalty_two_weeks_strong.name',
    descriptionKey: 'achievements.loyalty_two_weeks_strong.description',
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
    nameKey: 'achievements.loyalty_three_weeks_committed.name',
    descriptionKey: 'achievements.loyalty_three_weeks_committed.description',
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
    nameKey: 'achievements.loyalty_month_explorer.name',
    descriptionKey: 'achievements.loyalty_month_explorer.description',
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
    nameKey: 'achievements.loyalty_two_month_veteran.name',
    descriptionKey: 'achievements.loyalty_two_month_veteran.description',
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
    nameKey: 'achievements.loyalty_century_user.name',
    descriptionKey: 'achievements.loyalty_century_user.description',
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
    nameKey: 'achievements.loyalty_half_year_hero.name',
    descriptionKey: 'achievements.loyalty_half_year_hero.description',
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
    nameKey: 'achievements.loyalty_year_legend.name',
    descriptionKey: 'achievements.loyalty_year_legend.description',
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
    nameKey: 'achievements.loyalty_ultimate_veteran.name',
    descriptionKey: 'achievements.loyalty_ultimate_veteran.description',
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
    nameKey: 'achievements.loyalty_master.name',
    descriptionKey: 'achievements.loyalty_master.description',
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
  },

  // ========================================
  // JOURNAL BONUS ACHIEVEMENTS (24 achievements)
  // Added: 2025-08-30 - Complete bonus system for ⭐🔥👑 milestones
  // ========================================

  // --- BASIC BONUS ACHIEVEMENTS (9 achievements) ---

  {
    id: 'first-star',
    nameKey: 'achievements.first_star.name',
    descriptionKey: 'achievements.first_star.description',
    icon: '⭐',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.COMMON,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.COMMON], // 50 XP
    condition: {
      type: 'count',
      target: 1,
      source: 'journal_star_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'five-stars',
    nameKey: 'achievements.five_stars.name',
    descriptionKey: 'achievements.five_stars.description',
    icon: '⭐',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 5,
      source: 'journal_star_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'flame-achiever',
    nameKey: 'achievements.flame_achiever.name',
    descriptionKey: 'achievements.flame_achiever.description',
    icon: '🔥',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.RARE,
    xpReward: 125, // Custom XP for this milestone
    condition: {
      type: 'count',
      target: 1,
      source: 'journal_flame_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'bonus-week',
    nameKey: 'achievements.bonus_week.name',
    descriptionKey: 'achievements.bonus_week.description',
    icon: '⭐',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.RARE,
    xpReward: 125, // Custom XP for this milestone
    condition: {
      type: 'streak',
      target: 7,
      source: 'journal_bonus_streak',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'crown-royalty',
    nameKey: 'achievements.crown_royalty.name',
    descriptionKey: 'achievements.crown_royalty.description',
    icon: '👑',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: 150, // Custom XP for this milestone
    condition: {
      type: 'count',
      target: 1,
      source: 'journal_crown_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'flame-collector',
    nameKey: 'achievements.flame_collector.name',
    descriptionKey: 'achievements.flame_collector.description',
    icon: '🔥',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 25,
      source: 'journal_flame_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'golden-bonus-streak',
    nameKey: 'achievements.golden_bonus_streak.name',
    descriptionKey: 'achievements.golden_bonus_streak.description',
    icon: '⭐',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'streak',
      target: 7,
      source: 'journal_golden_bonus_streak',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: false,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'triple-crown-master',
    nameKey: 'achievements.triple_crown_master.name',
    descriptionKey: 'achievements.triple_crown_master.description',
    icon: '👑',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'count',
      target: 3,
      source: 'journal_crown_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'bonus-century',
    nameKey: 'achievements.bonus_century.name',
    descriptionKey: 'achievements.bonus_century.description',
    icon: '💯',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: 750, // Custom high XP for this ultimate milestone
    condition: {
      type: 'count',
      target: 200,
      source: 'journal_bonus_entries',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  // --- STAR MILESTONE ACHIEVEMENTS (5 achievements) ---

  {
    id: 'star-beginner',
    nameKey: 'achievements.star_beginner.name',
    descriptionKey: 'achievements.star_beginner.description',
    icon: '⭐',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.RARE,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE], // 100 XP
    condition: {
      type: 'count',
      target: 10,
      source: 'journal_star_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'star-collector',
    nameKey: 'achievements.star_collector.name',
    descriptionKey: 'achievements.star_collector.description',
    icon: '⭐',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: 150, // Custom XP for this milestone
    condition: {
      type: 'count',
      target: 25,
      source: 'journal_star_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'star-master',
    nameKey: 'achievements.star_master.name',
    descriptionKey: 'achievements.star_master.description',
    icon: '⭐',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 50,
      source: 'journal_star_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'star-champion',
    nameKey: 'achievements.star_champion.name',
    descriptionKey: 'achievements.star_champion.description',
    icon: '⭐',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: 300, // Higher XP for significant milestone
    condition: {
      type: 'count',
      target: 100,
      source: 'journal_star_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'star-legend',
    nameKey: 'achievements.star_legend.name',
    descriptionKey: 'achievements.star_legend.description',
    icon: '⭐',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'count',
      target: 200,
      source: 'journal_star_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  // --- FLAME MILESTONE ACHIEVEMENTS (5 achievements) ---

  {
    id: 'flame-starter',
    nameKey: 'achievements.flame_starter.name',
    descriptionKey: 'achievements.flame_starter.description',
    icon: '🔥',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: 150, // Custom XP for this milestone
    condition: {
      type: 'count',
      target: 5,
      source: 'journal_flame_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'flame-accumulator',
    nameKey: 'achievements.flame_accumulator.name',
    descriptionKey: 'achievements.flame_accumulator.description',
    icon: '🔥',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 10,
      source: 'journal_flame_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'flame-master',
    nameKey: 'achievements.flame_master.name',
    descriptionKey: 'achievements.flame_master.description',
    icon: '🔥',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: 300, // Higher XP for advanced milestone
    condition: {
      type: 'count',
      target: 25,
      source: 'journal_flame_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'flame-champion',
    nameKey: 'achievements.flame_champion.name',
    descriptionKey: 'achievements.flame_champion.description',
    icon: '🔥',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: 400, // Custom high XP for this milestone
    condition: {
      type: 'count',
      target: 50,
      source: 'journal_flame_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'flame-legend',
    nameKey: 'achievements.flame_legend.name',
    descriptionKey: 'achievements.flame_legend.description',
    icon: '🔥',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: 750, // High XP for ultimate flame milestone
    condition: {
      type: 'count',
      target: 100,
      source: 'journal_flame_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  // --- CROWN MILESTONE ACHIEVEMENTS (5 achievements) ---

  {
    id: 'crown-achiever',
    nameKey: 'achievements.crown_achiever.name',
    descriptionKey: 'achievements.crown_achiever.description',
    icon: '👑',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.EPIC,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC], // 200 XP
    condition: {
      type: 'count',
      target: 3,
      source: 'journal_crown_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'crown-collector',
    nameKey: 'achievements.crown_collector.name',
    descriptionKey: 'achievements.crown_collector.description',
    icon: '👑',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: 350, // Custom XP for this rare milestone
    condition: {
      type: 'count',
      target: 5,
      source: 'journal_crown_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'crown-master',
    nameKey: 'achievements.crown_master.name',
    descriptionKey: 'achievements.crown_master.description',
    icon: '👑',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY], // 500 XP
    condition: {
      type: 'count',
      target: 10,
      source: 'journal_crown_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'crown-champion',
    nameKey: 'achievements.crown_champion.name',
    descriptionKey: 'achievements.crown_champion.description',
    icon: '👑',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: 750, // High XP for advanced crown milestone
    condition: {
      type: 'count',
      target: 25,
      source: 'journal_crown_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
  },

  {
    id: 'crown-emperor',
    nameKey: 'achievements.crown_emperor.name',
    descriptionKey: 'achievements.crown_emperor.description',
    icon: '👑',
    category: AchievementCategory.JOURNAL,
    rarity: AchievementRarity.LEGENDARY,
    xpReward: 1000, // Ultimate XP reward for the highest crown achievement
    condition: {
      type: 'count',
      target: 50,
      source: 'journal_crown_count',
      operator: 'gte',
      timeframe: 'all_time'
    },
    isProgressive: true,
    isSecret: false,
    createdAt: new Date('2025-08-30'),
    updatedAt: new Date('2025-08-30')
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