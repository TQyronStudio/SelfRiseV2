// Gamification system constants and XP values
import { XPSourceType, AchievementRarity } from '../types/gamification';
import i18next from 'i18next';

// ========================================
// XP REWARD VALUES
// ========================================

/**
 * Base XP rewards for different actions
 * Balanced to encourage diverse engagement without exploitation
 */
export const XP_REWARDS = {
  // Habit System XP
  HABIT: {
    SCHEDULED_COMPLETION: 25,    // Standard scheduled habit completion
    BONUS_COMPLETION: 15,        // Bonus completion on non-scheduled day
    STREAK_7_DAYS: 75,          // Weekly streak milestone
    STREAK_14_DAYS: 100,        // Bi-weekly streak milestone
    STREAK_30_DAYS: 150,        // Monthly streak milestone
    STREAK_50_DAYS: 200,        // Extended streak milestone
    STREAK_100_DAYS: 300,       // Mastery streak milestone
  },

  // Journal System XP (with anti-spam protection)
  JOURNAL: {
    FIRST_ENTRY: 20,            // First daily journal entry
    SECOND_ENTRY: 20,           // Second daily journal entry
    THIRD_ENTRY: 20,            // Third daily journal entry (completes daily goal)
    BONUS_ENTRY: 8,             // Bonus entries 4-13 (reduced but consistent reward)
    FOURTEENTH_PLUS_ENTRY: 0,   // No XP for 14+ entries (spam prevention)
    
    // Bonus milestone rewards (on top of regular entry XP)
    FIRST_BONUS_MILESTONE: 25,  // First bonus entry ⭐ (entry #4)
    FIFTH_BONUS_MILESTONE: 50,  // Fifth bonus entry 🔥 (entry #8) 
    TENTH_BONUS_MILESTONE: 100, // Tenth bonus entry 👑 (entry #13) - Big achievement!
    
    // Streak rewards
    STREAK_7_DAYS: 75,          // Weekly journal streak
    STREAK_21_DAYS: 100,        // Habit-forming streak
    STREAK_30_DAYS: 150,        // Monthly streak milestone
    STREAK_100_DAYS: 250,       // Mastery journal streak
    STREAK_365_DAYS: 500,       // Year-long dedication reward
  },

  // Goal System XP
  GOALS: {
    PROGRESS_ENTRY: 35,         // Adding progress to a goal (max once per goal per day)
    MILESTONE_25_PERCENT: 50,   // Reaching 25% completion
    MILESTONE_50_PERCENT: 75,   // Reaching 50% completion
    MILESTONE_75_PERCENT: 100,  // Reaching 75% completion
    GOAL_COMPLETION: 250,       // Completing a goal entirely
    BIG_GOAL_COMPLETION: 350,   // Completing goal with value ≥ 1000
  },

  // Engagement & Meta Actions XP
  ENGAGEMENT: {
    DAILY_APP_LAUNCH: 10,       // First app launch each day
    RECOMMENDATION_FOLLOW: 30,   // Following a "For You" recommendation
    CUSTOMIZATION_USE: 20,      // Using home screen customization
    SHARING_ACTION: 25,         // Sharing streak or achievement
  },

  // Achievement System Bonuses
  ACHIEVEMENTS: {
    UNLOCK_COMMON: 50,          // Unlocking common achievement
    UNLOCK_RARE: 100,           // Unlocking rare achievement
    UNLOCK_EPIC: 200,           // Unlocking epic achievement
    UNLOCK_LEGENDARY: 500,      // Unlocking legendary achievement
  },

  // Monthly Challenge System (10x multiplier for FULL challenges - drives engagement!)
  MONTHLY_CHALLENGES: {
    ONE_STAR: 5000,      // 1★ Full challenge
    TWO_STAR: 7500,      // 2★ Full challenge
    THREE_STAR: 12000,   // 3★ Full challenge
    FOUR_STAR: 17500,    // 4★ Full challenge
    FIVE_STAR: 25000,    // 5★ Full challenge
  },

  // Warm-Up Challenge XP (original values for new users < 20 days)
  WARM_UP_CHALLENGES: {
    ONE_STAR: 500,      // 1★ Warm-up challenge
    TWO_STAR: 750,      // 2★ Warm-up challenge
    THREE_STAR: 1125,   // 3★ Warm-up challenge
    FOUR_STAR: 1688,    // 4★ Warm-up challenge
    FIVE_STAR: 2532,    // 5★ Warm-up challenge
  },

  // Special Event Bonuses
  SPECIAL: {
    LEVEL_UP_BONUS: 100,        // Bonus XP for leveling up
    PERFECT_DAY: 200,           // All three features used in one day
    HARMONY_STREAK_7: 300,      // 7 days of balanced app usage
    COMEBACK_BONUS: 150,        // Returning after 30+ days absence
  },
} as const;

// ========================================
// ANTI-SPAM PROTECTION LIMITS
// ========================================

/**
 * Daily XP limits to prevent exploitation
 * Encourages balanced usage across all features
 */
export const DAILY_XP_LIMITS = {
  // Per-feature daily maximums
  HABITS_MAX_DAILY: 500,       // Max XP from habits per day
  JOURNAL_MAX_DAILY: 415,      // Max XP from journal per day (3×20 + 10×8 + 25 + 50 + 100 = 415)
  GOALS_MAX_DAILY: 400,        // Max XP from goals per day
  ENGAGEMENT_MAX_DAILY: 200,   // Max XP from engagement per day

  // Global daily limits
  TOTAL_DAILY_MAX: 1500,       // Absolute maximum XP per day (increased for bonus milestones)
  SINGLE_SOURCE_MAX_PERCENT: 80, // Max % of daily XP from one source
} as const;

// ========================================
// XP SOURCE DEFINITIONS
// ========================================

/**
 * Complete XP source definitions with limits and requirements
 */
export const XP_SOURCES = {
  [XPSourceType.HABIT_COMPLETION]: {
    baseAmount: XP_REWARDS.HABIT.SCHEDULED_COMPLETION,
    descriptionKey: 'gamification.xpSources.habitCompletion',
    dailyLimit: undefined, // No limit on habit completions
    requirements: ['habit must be scheduled for today'],
  },

  [XPSourceType.HABIT_BONUS]: {
    baseAmount: XP_REWARDS.HABIT.BONUS_COMPLETION,
    descriptionKey: 'gamification.xpSources.habitBonus',
    dailyLimit: undefined, // No limit on bonus completions
    requirements: ['habit must not be scheduled for today'],
  },

  [XPSourceType.HABIT_STREAK_MILESTONE]: {
    baseAmount: XP_REWARDS.HABIT.STREAK_7_DAYS, // Base value, varies by milestone
    descriptionKey: 'gamification.xpSources.habitStreakMilestone',
    dailyLimit: 1000, // Max one major milestone per day
    requirements: ['consecutive days of habit completion'],
  },

  [XPSourceType.JOURNAL_ENTRY]: {
    baseAmount: XP_REWARDS.JOURNAL.FIRST_ENTRY,
    descriptionKey: 'gamification.xpSources.journalEntry',
    dailyLimit: XP_REWARDS.JOURNAL.FIRST_ENTRY * 3 + XP_REWARDS.JOURNAL.BONUS_ENTRY * 10 +
                XP_REWARDS.JOURNAL.FIRST_BONUS_MILESTONE + XP_REWARDS.JOURNAL.FIFTH_BONUS_MILESTONE +
                XP_REWARDS.JOURNAL.TENTH_BONUS_MILESTONE, // 3 required + 10 bonus + 3 milestones = 415 XP max
    requirements: ['entry must have minimum 10 characters'],
  },

  [XPSourceType.JOURNAL_BONUS]: {
    baseAmount: XP_REWARDS.JOURNAL.BONUS_ENTRY,
    descriptionKey: 'gamification.xpSources.journalBonus',
    dailyLimit: XP_REWARDS.JOURNAL.BONUS_ENTRY * 10, // Just the bonus entries themselves
    requirements: ['already completed 3 daily entries'],
  },

  [XPSourceType.JOURNAL_BONUS_MILESTONE]: {
    baseAmount: XP_REWARDS.JOURNAL.FIRST_BONUS_MILESTONE, // Base value, varies by milestone
    descriptionKey: 'gamification.xpSources.journalBonusMilestone',
    dailyLimit: XP_REWARDS.JOURNAL.FIRST_BONUS_MILESTONE + XP_REWARDS.JOURNAL.FIFTH_BONUS_MILESTONE +
                XP_REWARDS.JOURNAL.TENTH_BONUS_MILESTONE, // All three milestones per day max
    requirements: ['reached specific bonus entry milestone (⭐🔥👑)'],
  },

  [XPSourceType.JOURNAL_STREAK_MILESTONE]: {
    baseAmount: XP_REWARDS.JOURNAL.STREAK_7_DAYS,
    descriptionKey: 'gamification.xpSources.journalStreakMilestone',
    dailyLimit: 1000, // Max one major milestone per day
    requirements: ['consecutive days with 3+ journal entries'],
  },

  [XPSourceType.GOAL_PROGRESS]: {
    baseAmount: XP_REWARDS.GOALS.PROGRESS_ENTRY,
    descriptionKey: 'gamification.xpSources.goalProgress',
    dailyLimit: XP_REWARDS.GOALS.PROGRESS_ENTRY * 10, // Max 10 goals per day
    requirements: ['max once per goal per day'],
  },

  [XPSourceType.GOAL_COMPLETION]: {
    baseAmount: XP_REWARDS.GOALS.GOAL_COMPLETION,
    descriptionKey: 'gamification.xpSources.goalCompletion',
    dailyLimit: undefined, // No limit on completions
    requirements: ['goal progress must reach 100%'],
  },

  [XPSourceType.GOAL_MILESTONE]: {
    baseAmount: XP_REWARDS.GOALS.MILESTONE_25_PERCENT,
    descriptionKey: 'gamification.xpSources.goalMilestone',
    dailyLimit: 500, // Max milestone XP per day
    requirements: ['goal progress crosses milestone threshold'],
  },

  [XPSourceType.DAILY_LAUNCH]: {
    baseAmount: XP_REWARDS.ENGAGEMENT.DAILY_APP_LAUNCH,
    descriptionKey: 'gamification.xpSources.dailyLaunch',
    dailyLimit: XP_REWARDS.ENGAGEMENT.DAILY_APP_LAUNCH, // Once per day
    requirements: ['first app launch of the day'],
  },

  [XPSourceType.RECOMMENDATION_FOLLOW]: {
    baseAmount: XP_REWARDS.ENGAGEMENT.RECOMMENDATION_FOLLOW,
    descriptionKey: 'gamification.xpSources.recommendationFollow',
    dailyLimit: XP_REWARDS.ENGAGEMENT.RECOMMENDATION_FOLLOW * 5, // Max 5 recommendations per day
    requirements: ['acted on personalized recommendation'],
  },

  [XPSourceType.ACHIEVEMENT_UNLOCK]: {
    baseAmount: XP_REWARDS.ACHIEVEMENTS.UNLOCK_COMMON, // Base value, varies by rarity
    descriptionKey: 'gamification.xpSources.achievementUnlock',
    dailyLimit: undefined, // No limit - milestone reward (can unlock multiple achievements)
    requirements: ['achievement conditions must be met'],
  },

  [XPSourceType.MONTHLY_CHALLENGE]: {
    baseAmount: XP_REWARDS.MONTHLY_CHALLENGES.ONE_STAR,
    descriptionKey: 'gamification.xpSources.monthlyChallenge',
    dailyLimit: undefined, // No limit - milestone reward (one per month, Full = 10x XP)
    requirements: ['all challenge requirements must be met'],
  },

  [XPSourceType.XP_MULTIPLIER_BONUS]: {
    baseAmount: 0, // Variable based on multiplied actions
    descriptionKey: 'gamification.xpSources.xpMultiplierBonus',
    dailyLimit: undefined, // No specific limit (naturally limited by base actions)
    requirements: ['active XP multiplier must be present'],
  },
} as const;

/**
 * Get localized XP source description
 */
export function getXPSourceDescription(sourceType: XPSourceType): string {
  const source = (XP_SOURCES as Record<string, { descriptionKey: string }>)[sourceType];
  return source?.descriptionKey ? i18next.t(source.descriptionKey) : '';
}

// ========================================
// LEVEL PROGRESSION CONSTANTS
// ========================================

/**
 * Level progression parameters for mathematical model
 */
export const LEVEL_PROGRESSION = {
  // Base values
  BASE_XP_LEVEL_1: 100,        // XP required to reach level 1
  BASE_XP_LEVEL_2: 250,        // XP required to reach level 2

  // Phase thresholds
  BEGINNER_PHASE_END: 10,      // Levels 1-10: Linear progression
  INTERMEDIATE_PHASE_END: 25,   // Levels 11-25: Quadratic progression
  ADVANCED_PHASE_END: 50,      // Levels 26-50: Exponential progression
  MASTER_PHASE_START: 51,      // Levels 51+: Master progression

  // Multipliers for each phase
  LINEAR_MULTIPLIER: 1.2,      // Gentle increase for beginners
  QUADRATIC_MULTIPLIER: 1.15,  // Moderate increase for intermediate
  EXPONENTIAL_MULTIPLIER: 1.1, // Steep increase for advanced
  MASTER_MULTIPLIER: 1.05,     // Sustainable increase for masters

  // Milestone levels with special rewards
  MILESTONE_LEVELS: [10, 25, 50, 75, 100] as const,
} as const;

// ========================================
// XP MULTIPLIER CONSTANTS
// ========================================

/**
 * XP multiplier system configuration
 */
export const XP_MULTIPLIERS = {
  // Multiplier values
  HARMONY_STREAK_MULTIPLIER: 2.0,    // 2x XP for balanced usage
  CHALLENGE_COMPLETION_MULTIPLIER: 1.5, // 1.5x XP after challenge
  ACHIEVEMENT_COMBO_MULTIPLIER: 2.5,  // 2.5x XP for achievement combos

  // Durations (in hours)
  HARMONY_STREAK_DURATION: 24,       // 24 hours of 2x XP
  CHALLENGE_COMPLETION_DURATION: 12,  // 12 hours of 1.5x XP
  ACHIEVEMENT_COMBO_DURATION: 6,     // 6 hours of 2.5x XP

  // Activation requirements
  HARMONY_STREAK_DAYS_REQUIRED: 7,   // 7 days of all features used
  ACHIEVEMENT_COMBO_COUNT: 3,        // 3 achievements in 24 hours
  
  // Cooldowns (in hours)
  HARMONY_STREAK_COOLDOWN: 168,      // 7 days before next harmony multiplier
  CHALLENGE_COMPLETION_COOLDOWN: 168, // 7 days before next challenge multiplier
  ACHIEVEMENT_COMBO_COOLDOWN: 72,    // 3 days before next combo multiplier
} as const;

// ========================================
// ACHIEVEMENT RARITY XP REWARDS
// ========================================

/**
 * XP rewards based on achievement rarity
 */
export const ACHIEVEMENT_RARITY_XP = {
  [AchievementRarity.COMMON]: XP_REWARDS.ACHIEVEMENTS.UNLOCK_COMMON,
  [AchievementRarity.RARE]: XP_REWARDS.ACHIEVEMENTS.UNLOCK_RARE,
  [AchievementRarity.EPIC]: XP_REWARDS.ACHIEVEMENTS.UNLOCK_EPIC,
  [AchievementRarity.LEGENDARY]: XP_REWARDS.ACHIEVEMENTS.UNLOCK_LEGENDARY,
} as const;

// ========================================
// BALANCE VALIDATION CONSTANTS
// ========================================

/**
 * Constants for validating XP balance and preventing exploitation
 */
export const BALANCE_VALIDATION = {
  // Minimum time between identical XP gains (milliseconds)
  MIN_TIME_BETWEEN_IDENTICAL_GAINS: 100, // 0.1 second - allow fast habit toggling
  
  // Maximum XP gain in single transaction
  MAX_SINGLE_TRANSACTION_XP: 1000,
  
  // Suspicious activity thresholds
  SUSPICIOUS_XP_PER_MINUTE: 200,      // More than 200 XP/minute is suspicious
  SUSPICIOUS_IDENTICAL_GAINS: 10,     // More than 10 identical gains in a row
  
  // Rate limiting
  MAX_XP_TRANSACTIONS_PER_MINUTE: 60, // Max 60 XP transactions per minute
  
  // Feature balance requirements (percentage of daily XP)
  MIN_FEATURE_DIVERSITY_PERCENT: 20,  // At least 20% from different sources
  MAX_SINGLE_FEATURE_PERCENT: 80,     // Max 80% from single feature
} as const;

// ========================================
// NOTIFICATION BATCHING CONSTANTS
// ========================================

/**
 * Configuration for batching XP notifications to reduce spam
 */
export const NOTIFICATION_BATCHING = {
  // Time window for batching (milliseconds)
  BATCH_WINDOW_MS: 3000,              // 3 seconds
  
  // Minimum XP gain to show individual notification
  MIN_XP_FOR_INDIVIDUAL_NOTIFICATION: 50,
  
  // Maximum notifications per batch
  MAX_NOTIFICATIONS_PER_BATCH: 5,
  
  // Priority levels for different XP sources
  NOTIFICATION_PRIORITIES: {
    [XPSourceType.ACHIEVEMENT_UNLOCK]: 'high',
    [XPSourceType.MONTHLY_CHALLENGE]: 'high',
    [XPSourceType.JOURNAL_BONUS_MILESTONE]: 'high', // ⭐🔥👑 milestones are exciting!
    [XPSourceType.GOAL_COMPLETION]: 'medium',
    [XPSourceType.HABIT_STREAK_MILESTONE]: 'medium',
    [XPSourceType.JOURNAL_STREAK_MILESTONE]: 'medium',
    [XPSourceType.HABIT_COMPLETION]: 'low',
    [XPSourceType.JOURNAL_ENTRY]: 'low',
    [XPSourceType.JOURNAL_BONUS]: 'low',
    [XPSourceType.GOAL_PROGRESS]: 'low',
  } as const,
} as const;

// ========================================
// EXPORT ALL CONSTANTS
// ========================================

export const GAMIFICATION_CONSTANTS = {
  XP_REWARDS,
  DAILY_XP_LIMITS,
  XP_SOURCES,
  LEVEL_PROGRESSION,
  XP_MULTIPLIERS,
  ACHIEVEMENT_RARITY_XP,
  BALANCE_VALIDATION,
  NOTIFICATION_BATCHING,
} as const;

// Type exports for use in other files
export type XPRewardValues = typeof XP_REWARDS;
export type DailyXPLimits = typeof DAILY_XP_LIMITS;
export type XPSourceDefinitions = typeof XP_SOURCES;