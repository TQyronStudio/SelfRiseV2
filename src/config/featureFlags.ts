/**
 * Feature Flags Configuration
 *
 * Controls progressive rollout of new features with safety fallbacks
 */

export const FEATURE_FLAGS = {
  /**
   * SQLite Migration - Journal Storage
   *
   * When true: Use SQLiteGratitudeStorage for all journal operations
   * When false: Use AsyncStorage gratitudeStorage (legacy system)
   *
   * Rollback strategy: Set to false if critical issues occur
   */
  USE_SQLITE_JOURNAL: true,

  /**
   * SQLite Migration - Habits Storage
   *
   * When true: Use SQLiteHabitStorage for all habit operations
   * When false: Use AsyncStorage habitStorage (legacy system)
   *
   * Rollback strategy: Set to false if critical issues occur
   */
  USE_SQLITE_HABITS: true,

  /**
   * SQLite Migration - Goals Storage
   *
   * When true: Use SQLiteGoalStorage for all goal operations
   * When false: Use AsyncStorage goalStorage (legacy system)
   *
   * Rollback strategy: Set to false if critical issues occur
   */
  USE_SQLITE_GOALS: true,
} as const;

/**
 * Helper to check if feature is enabled
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Storage selection helper for gratitude/journal
 * Returns appropriate storage instance based on feature flag
 */
export function getGratitudeStorageImpl() {
  if (FEATURE_FLAGS.USE_SQLITE_JOURNAL) {
    // Lazy import to avoid circular dependencies
    const { sqliteGratitudeStorage } = require('../services/storage/SQLiteGratitudeStorage');
    return sqliteGratitudeStorage;
  } else {
    const { gratitudeStorage } = require('../services/storage/gratitudeStorage');
    return gratitudeStorage;
  }
}

/**
 * Storage selection helper for habits
 * Returns appropriate storage instance based on feature flag
 */
export function getHabitStorageImpl() {
  if (FEATURE_FLAGS.USE_SQLITE_HABITS) {
    // Lazy import to avoid circular dependencies
    const { sqliteHabitStorage } = require('../services/storage/SQLiteHabitStorage');
    return sqliteHabitStorage;
  } else {
    const { habitStorage } = require('../services/storage/habitStorage');
    return habitStorage;
  }
}

/**
 * Storage selection helper for goals
 * Returns appropriate storage instance based on feature flag
 */
export function getGoalStorageImpl() {
  if (FEATURE_FLAGS.USE_SQLITE_GOALS) {
    // Lazy import to avoid circular dependencies
    const { sqliteGoalStorage } = require('../services/storage/SQLiteGoalStorage');
    return sqliteGoalStorage;
  } else {
    const { goalStorage } = require('../services/storage/goalStorage');
    return goalStorage;
  }
}
