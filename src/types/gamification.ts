// Gamification system types and interfaces
import { BaseEntity, DateString } from './common';

// ========================================
// ENUMS
// ========================================

/**
 * Sources of XP in the application
 */
export enum XPSourceType {
  HABIT_COMPLETION = 'habit_completion',
  HABIT_BONUS = 'habit_bonus',
  HABIT_STREAK_MILESTONE = 'habit_streak_milestone',
  JOURNAL_ENTRY = 'journal_entry',
  JOURNAL_BONUS = 'journal_bonus', 
  JOURNAL_BONUS_MILESTONE = 'journal_bonus_milestone', // New: For ⭐🔥👑 milestones
  JOURNAL_STREAK_MILESTONE = 'journal_streak_milestone',
  GOAL_PROGRESS = 'goal_progress',
  GOAL_COMPLETION = 'goal_completion',
  GOAL_MILESTONE = 'goal_milestone',
  DAILY_LAUNCH = 'daily_launch',
  RECOMMENDATION_FOLLOW = 'recommendation_follow',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  WEEKLY_CHALLENGE = 'weekly_challenge',
  XP_MULTIPLIER_BONUS = 'xp_multiplier_bonus',
}

/**
 * Achievement rarity levels
 */
export enum AchievementRarity {
  COMMON = 'common',
  RARE = 'rare', 
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

/**
 * Achievement categories for organization
 */
export enum AchievementCategory {
  HABITS = 'habits',
  JOURNAL = 'journal',
  GOALS = 'goals',
  CONSISTENCY = 'consistency',
  MASTERY = 'mastery',
  SOCIAL = 'social',
  SPECIAL = 'special',
}

/**
 * Notification types for gamification events
 */
export enum NotificationType {
  XP_GAIN = 'xp_gain',
  LEVEL_UP = 'level_up',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  STREAK_MILESTONE = 'streak_milestone',
  WEEKLY_CHALLENGE = 'weekly_challenge',
  XP_MULTIPLIER_ACTIVE = 'xp_multiplier_active',
}

// ========================================
// XP SYSTEM INTERFACES
// ========================================

/**
 * Individual XP transaction record
 */
export interface XPTransaction extends BaseEntity {
  amount: number;
  source: XPSourceType;
  sourceId?: string; // ID of the related entity (habit, goal, etc.)
  description: string;
  date: DateString;
  multiplier?: number; // For XP multiplier events
}

/**
 * Source of XP with metadata
 */
export interface XPSource {
  type: XPSourceType;
  baseAmount: number;
  description: string;
  dailyLimit?: number; // Max XP per day from this source
  requirements?: string[]; // Conditions that must be met
}

/**
 * Overall gamification statistics for a user
 */
export interface GamificationStats {
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpProgress: number; // Percentage progress to next level
  totalTransactions: number;
  xpBySource: Record<XPSourceType, number>;
  achievementsUnlocked: number;
  totalAchievements: number;
  currentStreak: number; // Days with at least one XP gain
  longestStreak: number;
  lastActivity: DateString;
  multiplierActive: boolean;
  multiplierEndTime?: Date;
}

// ========================================
// LEVEL SYSTEM INTERFACES  
// ========================================

/**
 * Information about a specific level
 */
export interface LevelInfo {
  level: number;
  xpRequired: number; // Total XP needed to reach this level
  xpFromPrevious: number; // XP needed from previous level
  title: string; // Level title (e.g., "Novice", "Expert")
  description?: string;
  isMilestone: boolean; // Special milestone levels (10, 25, 50, etc.)
  rewards?: string[]; // Special rewards for reaching this level
}

/**
 * Level requirement calculation parameters
 */
export interface LevelRequirement {
  level: number;
  baseXP: number; // Base XP for level 1
  multiplier: number; // Multiplier for progression
  formula: 'linear' | 'quadratic' | 'exponential';
  phase: 'beginner' | 'intermediate' | 'advanced' | 'master';
}

// ========================================
// ACHIEVEMENT SYSTEM INTERFACES
// ========================================

/**
 * Individual achievement definition
 */
export interface Achievement extends BaseEntity {
  name: string;
  description: string;
  icon: string; // Emoji or icon identifier
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  condition: AchievementCondition;
  isProgressive: boolean; // Can be partially completed
  isSecret: boolean; // Hidden until unlocked
  unlockedAt?: Date;
  progress?: number; // Current progress (0-100)
  maxProgress?: number; // Max value for progressive achievements
}

/**
 * Condition that must be met to unlock an achievement
 */
export interface AchievementCondition {
  type: 'count' | 'streak' | 'value' | 'time' | 'combination';
  target: number; // Target value to reach
  source: XPSourceType | string; // What to count/track
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt'; // Comparison operator
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  additionalConditions?: AchievementCondition[]; // For complex achievements
}

/**
 * User's achievement progress and unlocked achievements
 */
export interface UserAchievements {
  unlockedAchievements: string[]; // Achievement IDs
  achievementProgress: Record<string, number>; // Progress tracking
  lastChecked: DateString;
  totalXPFromAchievements: number;
  rarityCount: Record<AchievementRarity, number>;
  categoryProgress: Record<AchievementCategory, number>;
}

// ========================================
// WEEKLY CHALLENGE INTERFACES
// ========================================

/**
 * Weekly challenge definition
 */
export interface WeeklyChallenge extends BaseEntity {
  title: string;
  description: string;
  startDate: DateString;
  endDate: DateString;
  xpReward: number;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  category: AchievementCategory;
  requirements: ChallengeRequirement[];
  isActive: boolean;
  participantCount?: number;
}

/**
 * Requirement for completing a weekly challenge
 */
export interface ChallengeRequirement {
  type: 'habits' | 'journal' | 'goals' | 'mixed';
  target: number;
  description: string;
  trackingKey: string; // How to track progress
}

/**
 * User's progress on a weekly challenge
 */
export interface ChallengeProgress {
  challengeId: string;
  userId: string;
  progress: Record<string, number>; // Progress by requirement
  isCompleted: boolean;
  completedAt?: Date;
  xpEarned: number;
}

// ========================================
// XP MULTIPLIER INTERFACES
// ========================================

/**
 * XP multiplier activation record
 */
export interface XPMultiplier extends BaseEntity {
  multiplier: number; // e.g., 2.0 for 2x XP
  duration: number; // Duration in hours
  activatedAt: Date;
  expiresAt: Date;
  source: 'harmony_streak' | 'weekly_challenge' | 'achievement' | 'special_event';
  isActive: boolean;
}

/**
 * Conditions for earning XP multipliers
 */
export interface MultiplierCondition {
  type: 'harmony_streak' | 'challenge_completion' | 'achievement_combo';
  requirements: string[];
  multiplier: number;
  duration: number; // Hours
  cooldown?: number; // Hours before can be earned again
}

// ========================================
// NOTIFICATION INTERFACES
// ========================================

/**
 * Gamification notification data
 */
export interface GamificationNotification {
  type: NotificationType;
  title: string;
  message: string;
  xpAmount?: number;
  level?: number;
  achievementId?: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Batched XP notification for multiple gains
 */
export interface BatchedXPNotification {
  totalXP: number;
  sources: Array<{
    type: XPSourceType;
    amount: number;
    count: number;
  }>;
  timeWindow: number; // Milliseconds the batch was collected over
  timestamp: Date;
}