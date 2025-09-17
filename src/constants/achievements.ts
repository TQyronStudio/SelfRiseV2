// Achievement system constants and configuration

import { AchievementRarity, AchievementCategory } from '../types/gamification';

// ========================================
// ACHIEVEMENT XP REWARDS
// ========================================

export const ACHIEVEMENT_XP_REWARDS: Record<AchievementRarity, number> = {
  [AchievementRarity.COMMON]: 50,
  [AchievementRarity.RARE]: 100,
  [AchievementRarity.EPIC]: 200,
  [AchievementRarity.LEGENDARY]: 500,
} as const;

// ========================================
// ACHIEVEMENT EVALUATION SETTINGS
// ========================================

export const ACHIEVEMENT_EVALUATION = {
  // How often to run batch evaluation (milliseconds)
  BATCH_EVALUATION_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  
  // Maximum achievements to evaluate in single batch
  MAX_BATCH_SIZE: 50,
  
  // Cooldown between individual achievement checks (milliseconds)
  INDIVIDUAL_CHECK_COOLDOWN: 5 * 60 * 1000, // 5 minutes
  
  // Maximum progress history entries to keep per achievement
  MAX_PROGRESS_HISTORY_ENTRIES: 100,
  
  // How long to wait before allowing re-evaluation of failed checks
  FAILED_CHECK_COOLDOWN: 60 * 60 * 1000, // 1 hour
} as const;

// ========================================
// ACHIEVEMENT CATEGORIES METADATA
// ========================================

export const ACHIEVEMENT_CATEGORY_META: Record<AchievementCategory, {
  name: string;
  icon: string;
  color: string;
  description: string;
}> = {
  [AchievementCategory.HABITS]: {
    name: 'Habits',
    icon: '🏃‍♂️',
    color: '#4CAF50',
    description: 'Build consistent daily routines',
  },
  [AchievementCategory.JOURNAL]: {
    name: 'Journal',
    icon: '📝',
    color: '#2196F3',
    description: 'Reflect and express gratitude',
  },
  [AchievementCategory.GOALS]: {
    name: 'Goals',
    icon: '🎯',
    color: '#FF9800',
    description: 'Achieve your dreams',
  },
  [AchievementCategory.CONSISTENCY]: {
    name: 'Consistency',
    icon: '🔥',
    color: '#F44336',
    description: 'Show up every day',
  },
  [AchievementCategory.MASTERY]: {
    name: 'Mastery',
    icon: '👑',
    color: '#9C27B0',
    description: 'Become the best version of yourself',
  },
  [AchievementCategory.SPECIAL]: {
    name: 'Special',
    icon: '✨',
    color: '#FFD700',
    description: 'Limited time and unique achievements',
  },
} as const;

// ========================================
// ACHIEVEMENT RARITY METADATA
// ========================================

export const ACHIEVEMENT_RARITY_META: Record<AchievementRarity, {
  name: string;
  color: string;
  borderColor: string;
  glowColor: string;
  probability: number; // Estimated percentage of users who will unlock
}> = {
  [AchievementRarity.COMMON]: {
    name: 'Common',
    color: '#9E9E9E',
    borderColor: '#757575',
    glowColor: '#BDBDBD',
    probability: 80, // 80% of users expected to unlock
  },
  [AchievementRarity.RARE]: {
    name: 'Rare', 
    color: '#2196F3',
    borderColor: '#1976D2',
    glowColor: '#64B5F6',
    probability: 40, // 40% of users expected to unlock
  },
  [AchievementRarity.EPIC]: {
    name: 'Epic',
    color: '#9C27B0',
    borderColor: '#7B1FA2',
    glowColor: '#BA68C8',
    probability: 15, // 15% of users expected to unlock
  },
  [AchievementRarity.LEGENDARY]: {
    name: 'Legendary',
    color: '#FFD700',
    borderColor: '#FFA000',
    glowColor: '#FFEB3B',
    probability: 5, // 5% of users expected to unlock
  },
} as const;

// ========================================
// ACHIEVEMENT UNLOCK CONDITIONS
// ========================================

export const CONDITION_DEFAULTS = {
  // Default timeframes for different condition types
  STREAK_TIMEFRAME: 'daily' as const,
  COUNT_TIMEFRAME: 'all_time' as const,
  VALUE_TIMEFRAME: 'all_time' as const,
  
  // Default operators
  COUNT_OPERATOR: 'gte' as const,
  STREAK_OPERATOR: 'gte' as const,
  VALUE_OPERATOR: 'gte' as const,
  
  // Progressive achievement defaults
  DEFAULT_MILESTONE_COUNT: 5,
  DEFAULT_INCREMENTAL_REWARDS: true,
} as const;

// ========================================
// ACHIEVEMENT SYSTEM LIMITS
// ========================================

export const ACHIEVEMENT_LIMITS = {
  // Maximum achievements per category
  MAX_ACHIEVEMENTS_PER_CATEGORY: 50,
  
  // Maximum total achievements in system
  MAX_TOTAL_ACHIEVEMENTS: 200,
  
  // Maximum conditions per achievement
  MAX_CONDITIONS_PER_ACHIEVEMENT: 10,
  
  // Maximum milestones for progressive achievements
  MAX_MILESTONES_PER_ACHIEVEMENT: 20,
  
  // Maximum length for achievement names/descriptions
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

// ========================================
// VALIDATION CONSTANTS
// ========================================

export const VALIDATION = {
  // Required fields validation
  REQUIRED_FIELDS: ['id', 'name', 'description', 'category', 'rarity', 'condition'] as const,
  
  // XP reward validation ranges
  MIN_XP_REWARD: 10,
  MAX_XP_REWARD: 1000,
  
  // Progress validation
  MIN_PROGRESS: 0,
  MAX_PROGRESS: 100,
  
  // Condition target validation
  MIN_CONDITION_TARGET: 1,
  MAX_CONDITION_TARGET: 999999,
} as const;

// ========================================
// ACHIEVEMENT CATALOG VERSION
// ========================================

export const ACHIEVEMENT_CATALOG = {
  VERSION: '1.0.0',
  LAST_UPDATED: new Date('2025-08-03'),
  SCHEMA_VERSION: 1,
} as const;