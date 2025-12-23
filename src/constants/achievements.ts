// Achievement system constants and configuration

import { AchievementRarity, AchievementCategory } from '../types/gamification';
import i18next from 'i18next';

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

export const ACHIEVEMENT_CATEGORY_CONFIG: Record<AchievementCategory, {
  nameKey: string;
  icon: string;
  color: string;
  descriptionKey: string;
}> = {
  [AchievementCategory.HABITS]: {
    nameKey: 'achievements.categoryMeta.habits.name',
    icon: '🏃‍♂️',
    color: '#4CAF50',
    descriptionKey: 'achievements.categoryMeta.habits.description',
  },
  [AchievementCategory.JOURNAL]: {
    nameKey: 'achievements.categoryMeta.journal.name',
    icon: '📝',
    color: '#2196F3',
    descriptionKey: 'achievements.categoryMeta.journal.description',
  },
  [AchievementCategory.GOALS]: {
    nameKey: 'achievements.categoryMeta.goals.name',
    icon: '🎯',
    color: '#FF9800',
    descriptionKey: 'achievements.categoryMeta.goals.description',
  },
  [AchievementCategory.CONSISTENCY]: {
    nameKey: 'achievements.categoryMeta.consistency.name',
    icon: '🔥',
    color: '#F44336',
    descriptionKey: 'achievements.categoryMeta.consistency.description',
  },
  [AchievementCategory.MASTERY]: {
    nameKey: 'achievements.categoryMeta.mastery.name',
    icon: '👑',
    color: '#9C27B0',
    descriptionKey: 'achievements.categoryMeta.mastery.description',
  },
  [AchievementCategory.SPECIAL]: {
    nameKey: 'achievements.categoryMeta.special.name',
    icon: '✨',
    color: '#FFD700',
    descriptionKey: 'achievements.categoryMeta.special.description',
  },
} as const;

/**
 * Get localized category metadata
 */
export function getAchievementCategoryMeta(category: AchievementCategory): {
  name: string;
  icon: string;
  color: string;
  description: string;
} {
  const config = ACHIEVEMENT_CATEGORY_CONFIG[category];
  return {
    name: i18next.t(config.nameKey),
    icon: config.icon,
    color: config.color,
    description: i18next.t(config.descriptionKey),
  };
}

// ========================================
// ACHIEVEMENT RARITY METADATA
// ========================================

export const ACHIEVEMENT_RARITY_CONFIG: Record<AchievementRarity, {
  nameKey: string;
  color: string;
  borderColor: string;
  glowColor: string;
  probability: number; // Estimated percentage of users who will unlock
}> = {
  [AchievementRarity.COMMON]: {
    nameKey: 'achievements.rarityMeta.common',
    color: '#9E9E9E',
    borderColor: '#757575',
    glowColor: '#BDBDBD',
    probability: 80, // 80% of users expected to unlock
  },
  [AchievementRarity.RARE]: {
    nameKey: 'achievements.rarityMeta.rare',
    color: '#2196F3',
    borderColor: '#1976D2',
    glowColor: '#64B5F6',
    probability: 40, // 40% of users expected to unlock
  },
  [AchievementRarity.EPIC]: {
    nameKey: 'achievements.rarityMeta.epic',
    color: '#9C27B0',
    borderColor: '#7B1FA2',
    glowColor: '#BA68C8',
    probability: 15, // 15% of users expected to unlock
  },
  [AchievementRarity.LEGENDARY]: {
    nameKey: 'achievements.rarityMeta.legendary',
    color: '#FFD700',
    borderColor: '#FFA000',
    glowColor: '#FFEB3B',
    probability: 5, // 5% of users expected to unlock
  },
} as const;

/**
 * Get localized rarity metadata
 */
export function getAchievementRarityMeta(rarity: AchievementRarity): {
  name: string;
  color: string;
  borderColor: string;
  glowColor: string;
  probability: number;
} {
  const config = ACHIEVEMENT_RARITY_CONFIG[rarity];
  return {
    name: i18next.t(config.nameKey),
    color: config.color,
    borderColor: config.borderColor,
    glowColor: config.glowColor,
    probability: config.probability,
  };
}

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