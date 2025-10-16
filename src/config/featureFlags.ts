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
   * SQLite Migration - Habits Storage (Future)
   * Placeholder for Phase 1.2
   */
  USE_SQLITE_HABITS: false,

  /**
   * SQLite Migration - Goals Storage (Future)
   * Placeholder for Phase 1.3
   */
  USE_SQLITE_GOALS: false,
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
