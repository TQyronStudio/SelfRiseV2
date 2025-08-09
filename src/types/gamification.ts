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
  type: 'count' | 'streak' | 'value' | 'time' | 'combination' | 'level' | 'percentage';
  target: number; // Target value to reach
  source: XPSourceType | string; // What to count/track
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt'; // Comparison operator
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  additionalConditions?: AchievementCondition[]; // For complex achievements
  metadata?: Record<string, any>; // Additional condition-specific data
}

/**
 * Function type for evaluating achievement conditions
 */
export type ConditionChecker = (
  condition: AchievementCondition,
  userStats: GamificationStats,
  additionalData?: Record<string, any>
) => Promise<{
  isMet: boolean;
  currentValue: number;
  progress: number; // 0-100 percentage
  nextMilestone?: number;
}>;

/**
 * Achievement evaluation result
 */
export interface AchievementEvaluationResult {
  achievementId: string;
  isMet: boolean;
  currentProgress: number; // 0-100
  previousProgress: number;
  isNewlyUnlocked: boolean;
  progressDelta: number;
  nextMilestone?: number;
  evaluatedAt: Date;
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
  progressHistory: AchievementProgressHistory[];
  streakData: Record<string, StreakTrackingData>; // For streak-based achievements
}

/**
 * Historical progress tracking for achievements
 */
export interface AchievementProgressHistory {
  achievementId: string;
  progress: number;
  timestamp: Date;
  trigger: XPSourceType | 'manual_check' | 'daily_batch';
  context?: Record<string, any>; // Additional context for the progress update
}

/**
 * Streak tracking data for streak-based achievements
 */
export interface StreakTrackingData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: DateString;
  streakStartDate: DateString;
  streakType: 'daily' | 'weekly' | 'monthly';
  category: AchievementCategory;
}

/**
 * Progressive achievement milestone definition
 */
export interface AchievementMilestone {
  value: number; // Progress value for this milestone
  xpReward: number; // XP awarded at this milestone
  title?: string; // Special title for this milestone
  description?: string;
  isMainGoal: boolean; // Whether this is the final achievement goal
}

/**
 * Complex achievement with multiple milestones
 */
export interface ProgressiveAchievement extends Achievement {
  milestones: AchievementMilestone[];
  currentMilestone: number; // Index of current milestone
  incrementalRewards: boolean; // Whether to award XP for each milestone
}

// ========================================
// ACHIEVEMENT UTILITY TYPES
// ========================================

/**
 * Achievement unlock trigger event
 */
export interface AchievementUnlockEvent {
  achievementId: string;
  userId?: string;
  unlockedAt: Date;
  trigger: XPSourceType | 'manual_check' | 'daily_batch';
  xpAwarded: number;
  previousProgress: number;
  finalProgress: number;
  context?: Record<string, any>;
}

/**
 * Achievement statistics for analytics
 */
export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  completionRate: number; // 0-100
  averageTimeToUnlock: number; // Days
  mostRecentUnlock?: {
    achievementId: string;
    unlockedAt: Date;
    rarity: AchievementRarity;
  };
  rarityBreakdown: Record<AchievementRarity, {
    total: number;
    unlocked: number;
    completionRate: number;
  }>;
  categoryBreakdown: Record<AchievementCategory, {
    total: number;
    unlocked: number;
    totalProgress: number;
  }>;
}

/**
 * Achievement catalog metadata
 */
export interface AchievementCatalog {
  achievements: Achievement[];
  totalCount: number;
  version: string;
  lastUpdated: Date;
  categoryCount: Record<AchievementCategory, number>;
  rarityDistribution: Record<AchievementRarity, number>;
}

/**
 * Batch achievement evaluation options
 */
export interface BatchEvaluationOptions {
  achievementIds?: string[]; // Specific achievements to check (if not provided, checks all)
  categories?: AchievementCategory[]; // Only check certain categories
  skipRecent?: boolean; // Skip achievements checked recently
  forceUpdate?: boolean; // Force update even if recently checked
  maxBatchSize?: number; // Limit concurrent evaluations
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
  sources: {
    type: XPSourceType;
    amount: number;
    count: number;
  }[];
  timeWindow: number; // Milliseconds the batch was collected over
  timestamp: Date;
}

/**
 * Challenge completion result
 */
export interface ChallengeCompletionResult {
  challengeId: string;
  completed: boolean;
  xpEarned: number;
  completedAt: Date;
  achievementUnlocked?: string;
  celebrationLevel: 'normal' | 'milestone' | 'epic';
}

// ========================================
// MONTHLY CHALLENGE INTERFACES
// ========================================

/**
 * Monthly challenge definition with baseline-driven personalization
 */
export interface MonthlyChallenge extends BaseEntity {
  title: string;
  description: string;
  startDate: DateString; // 1st of month
  endDate: DateString;   // Last day of month
  
  // Enhanced reward system
  baseXPReward: number;     // Star-based: 500/750/1125/1688/2532
  starLevel: 1 | 2 | 3 | 4 | 5;
  category: AchievementCategory;
  
  // Enhanced requirements with baseline scaling
  requirements: MonthlyChallengeRequirement[];
  
  // Baseline-driven generation metadata
  userBaselineSnapshot: {
    month: string;
    analysisStartDate: DateString;
    analysisEndDate: DateString;
    dataQuality: 'minimal' | 'partial' | 'complete';
    totalActiveDays: number;
  };
  
  scalingFormula: string; // e.g., "baseline * 1.15"
  isActive: boolean;
  
  // Generation context
  generationReason: 'scheduled' | 'manual' | 'first_month' | 'retry';
  categoryRotation: AchievementCategory[]; // Last 3 months for variety
}

/**
 * Monthly challenge requirement with baseline context
 */
export interface MonthlyChallengeRequirement {
  type: 'habits' | 'journal' | 'goals' | 'consistency';
  target: number;           // Calculated from baseline
  description: string;
  trackingKey: string;
  
  // Baseline context
  baselineValue: number;    // User's historical average
  scalingMultiplier: number; // Applied scaling (1.05-1.25)
  progressMilestones: number[]; // [25%, 50%, 75%] for celebrations
  
  // Progress tracking configuration
  dailyTarget?: number;     // Optional daily breakdown
  weeklyTarget?: number;    // Optional weekly milestone
}

/**
 * Enhanced monthly challenge progress with weekly breakdown
 */
export interface MonthlyChallengeProgress extends ChallengeProgress {
  // Enhanced weekly breakdown
  weeklyProgress: {
    week1: Record<string, number>;
    week2: Record<string, number>; 
    week3: Record<string, number>;
    week4: Record<string, number>;
    week5?: Record<string, number>; // For months with 31 days
  };
  
  // Milestone celebrations
  milestonesReached: {
    25: { reached: boolean; timestamp?: Date; xpAwarded?: number };
    50: { reached: boolean; timestamp?: Date; xpAwarded?: number };
    75: { reached: boolean; timestamp?: Date; xpAwarded?: number };
  };
  
  // Enhanced completion data
  completionPercentage: number;
  daysActive: number;
  daysRemaining: number;
  projectedCompletion: number; // Based on current pace
  
  // Streak data
  currentStreak: number; // Consecutive months completed
  longestStreak: number;
  streakBonusEligible: boolean;
  
  // Performance tracking
  dailyConsistency: number; // 0-1 score
  weeklyConsistency: number; // 0-1 score
  bestWeek: number; // Week with highest completion rate
}

/**
 * Monthly challenge template for generation
 */
export interface MonthlyChallengeTemplate {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  
  // Baseline integration
  baselineMetricKey: string; // Key from UserActivityBaseline
  baselineMultiplierRange: [number, number]; // Min/max multipliers for scaling
  
  // Requirements template
  requirementTemplates: Omit<MonthlyChallengeRequirement, 'target' | 'baselineValue' | 'scalingMultiplier'>[];
  
  // Difficulty scaling
  starLevelRequirements: {
    minLevel: number; // Minimum user level for this template
    preferredDataQuality: ('minimal' | 'partial' | 'complete')[];
  };
  
  // XP configuration  
  baseXPReward: number; // Will be multiplied by star level
  bonusXPConditions: string[]; // Descriptions of bonus XP opportunities
  
  // Template metadata
  tags: string[];
  priority: number; // Higher = more likely to be selected
  cooldownMonths: number; // Months before this template can be used again
  seasonality?: string[]; // Preferred months (e.g., ['01', '02'] for winter)
}

/**
 * User star ratings per challenge category
 */
export interface UserChallengeRatings {
  habits: number;      // 1-5 stars
  journal: number;     // 1-5 stars  
  goals: number;       // 1-5 stars
  consistency: number; // 1-5 stars
  
  // Progression tracking
  history: StarRatingHistoryEntry[];
  lastUpdated: Date;
}

/**
 * Star rating progression history
 */
export interface StarRatingHistoryEntry {
  month: string; // "YYYY-MM"
  category: AchievementCategory;
  previousStars: number;
  newStars: number;
  challengeCompleted: boolean;
  completionPercentage: number;
  reason: 'success' | 'failure' | 'double_failure' | 'reset';
  timestamp: Date;
}

/**
 * Monthly challenge generation context
 */
export interface MonthlyChallengeGenerationContext {
  month: string; // "YYYY-MM"
  userId: string;
  userBaseline: import('../services/userActivityTracker').UserActivityBaseline;
  currentStarRatings: UserChallengeRatings;
  recentCategoryHistory: AchievementCategory[]; // Last 3 months
  isFirstMonth: boolean;
  forceCategory?: AchievementCategory; // For manual generation
  dryRun?: boolean; // For testing without persistence
}

/**
 * Monthly challenge generation result
 */
export interface MonthlyChallengeGenerationResult {
  challenge: MonthlyChallenge;
  generationMetadata: {
    selectedTemplate: string;
    appliedStarLevel: number;
    baselineUsed: number;
    scalingApplied: number;
    alternativesConsidered: string[];
    generationTimeMs: number;
    warnings: string[];
  };
  success: boolean;
  error?: string;
}

/**
 * Challenge category selection weights
 */
export interface CategorySelectionWeights {
  category: AchievementCategory;
  baseWeight: number;
  userEngagementMultiplier: number;
  recentUsagePenalty: number;
  starLevelBonus: number;
  dataQualityBonus: number;
  finalWeight: number;
}

/**
 * Monthly challenge completion result with enhanced rewards
 */
export interface MonthlyChallengeCompletionResult extends ChallengeCompletionResult {
  // Enhanced reward calculation
  baseXP: number;
  bonusXP: number;
  streakBonus: number;
  perfectCompletionBonus: number;
  totalXPEarned: number;
  
  // Completion statistics
  completionPercentage: number;
  requirementsCompleted: number;
  activeDays: number;
  milestonesReached: number;
  
  // Star progression
  oldStarLevel: number;
  newStarLevel: number;
  starLevelChanged: boolean;
  
  // Streak information
  monthlyStreak: number;
  streakMilestoneReached?: number;
  
  // Next month preparation
  nextMonthEligible: boolean;
  suggestedStarLevel: number;
}