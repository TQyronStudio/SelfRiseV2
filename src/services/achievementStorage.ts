// Achievement Storage & Persistence - Sub-checkpoint 4.5.4.D
// Comprehensive achievement data storage and management system

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserAchievements,
  Achievement,
  AchievementProgressHistory,
  AchievementUnlockEvent,
  StreakTrackingData,
  AchievementStats,
  AchievementCategory,
  AchievementRarity,
  XPSourceType
} from '../types/gamification';
import { DateString } from '../types/common';
import { today, formatDateToString } from '../utils/date';

// ========================================
// STORAGE KEYS
// ========================================

export const ACHIEVEMENT_STORAGE_KEYS = {
  USER_ACHIEVEMENTS: 'achievements_user_data',
  PROGRESS_HISTORY: 'achievements_progress_history', 
  UNLOCK_EVENTS: 'achievements_unlock_events',
  STATISTICS_CACHE: 'achievements_statistics_cache',
  STREAK_DATA: 'achievements_streak_data',
  LAST_BATCH_CHECK: 'achievements_last_batch_check',
  DATA_VERSION: 'achievements_data_version',
  MIGRATION_LOG: 'achievements_migration_log',
} as const;

// ========================================
// DATA VERSIONING & MIGRATION
// ========================================

export const ACHIEVEMENT_DATA_VERSION = {
  CURRENT: '1.0.0',
  SCHEMA_VERSION: 1,
  MIGRATION_REQUIRED_FROM: ['0.9.0', '0.8.0'] // Versions that need migration
} as const;

interface MigrationLogEntry {
  fromVersion: string;
  toVersion: string;
  migratedAt: Date;
  migrationType: 'schema' | 'data' | 'cleanup';
  success: boolean;
  notes?: string;
}

// ========================================
// ACHIEVEMENT STORAGE SERVICE
// ========================================

/**
 * Comprehensive achievement storage and persistence service
 * Handles all data operations for the achievement system
 */
export class AchievementStorage {

  // ========================================
  // USER ACHIEVEMENTS MANAGEMENT
  // ========================================

  /**
   * Get user achievements with automatic initialization
   */
  static async getUserAchievements(): Promise<UserAchievements> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.USER_ACHIEVEMENTS);
      
      if (!stored) {
        const emptyData = this.createEmptyUserAchievements();
        await this.saveUserAchievements(emptyData);
        return emptyData;
      }
      
      const data: UserAchievements = JSON.parse(stored);
      
      // Validate and migrate if needed
      const migrated = await this.validateAndMigrateUserAchievements(data);
      if (migrated !== data) {
        await this.saveUserAchievements(migrated);
        return migrated;
      }
      
      return data;
      
    } catch (error) {
      console.error('AchievementStorage.getUserAchievements error:', error);
      const emptyData = this.createEmptyUserAchievements();
      await this.saveUserAchievements(emptyData);
      return emptyData;
    }
  }

  /**
   * Save user achievements data
   */
  static async saveUserAchievements(data: UserAchievements): Promise<void> {
    try {
      // Update timestamp
      data.lastChecked = today();
      
      // Validate data before saving
      const validatedData = this.validateUserAchievementsData(data);
      
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEYS.USER_ACHIEVEMENTS,
        JSON.stringify(validatedData)
      );
      
      // Update statistics cache
      await this.updateStatisticsCache(validatedData);
      
    } catch (error) {
      console.error('AchievementStorage.saveUserAchievements error:', error);
      throw error;
    }
  }

  /**
   * Create empty user achievements structure
   */
  static createEmptyUserAchievements(): UserAchievements {
    return {
      unlockedAchievements: [],
      achievementProgress: {},
      lastChecked: today(),
      totalXPFromAchievements: 0,
      rarityCount: {
        [AchievementRarity.COMMON]: 0,
        [AchievementRarity.RARE]: 0,
        [AchievementRarity.EPIC]: 0,
        [AchievementRarity.LEGENDARY]: 0,
      },
      categoryProgress: {
        [AchievementCategory.HABITS]: 0,
        [AchievementCategory.JOURNAL]: 0,
        [AchievementCategory.GOALS]: 0,
        [AchievementCategory.CONSISTENCY]: 0,
        [AchievementCategory.MASTERY]: 0,
        [AchievementCategory.SOCIAL]: 0,
        [AchievementCategory.SPECIAL]: 0,
      },
      progressHistory: [],
      streakData: {}
    };
  }

  // ========================================
  // UNLOCK TIMESTAMP TRACKING
  // ========================================

  /**
   * Store achievement unlock event with timestamp
   */
  static async storeUnlockEvent(
    achievementId: string,
    achievement: Achievement,
    triggerSource: XPSourceType | string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const unlockEvent: AchievementUnlockEvent = {
        achievementId,
        unlockedAt: new Date(),
        trigger: triggerSource as any,
        xpAwarded: achievement.xpReward,
        previousProgress: 0, // Will be filled by caller
        finalProgress: 100,
        context: {
          achievementName: achievement.name,
          achievementRarity: achievement.rarity,
          achievementCategory: achievement.category,
          ...metadata
        }
      };

      // Get existing events
      const events = await this.getUnlockEvents();
      
      // Check for duplicates
      const isDuplicate = events.some(event => 
        event.achievementId === achievementId
      );
      
      if (isDuplicate) {
        console.warn(`Duplicate unlock prevented for achievement: ${achievementId}`);
        return;
      }

      // Add new event
      events.push(unlockEvent);
      
      // Keep only last 1000 events for performance
      const trimmedEvents = events.slice(-1000);
      
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEYS.UNLOCK_EVENTS,
        JSON.stringify(trimmedEvents)
      );

      console.log(`📦 Stored unlock event for achievement: ${achievement.name}`);
      
    } catch (error) {
      console.error('AchievementStorage.storeUnlockEvent error:', error);
      throw error;
    }
  }

  /**
   * Get all unlock events
   */
  static async getUnlockEvents(): Promise<AchievementUnlockEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.UNLOCK_EVENTS);
      if (!stored) return [];
      
      const events = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      return events.map((event: any) => ({
        ...event,
        unlockedAt: new Date(event.unlockedAt)
      }));
      
    } catch (error) {
      console.error('AchievementStorage.getUnlockEvents error:', error);
      return [];
    }
  }

  /**
   * Get unlock events for specific achievement
   */
  static async getUnlockEventsForAchievement(achievementId: string): Promise<AchievementUnlockEvent[]> {
    try {
      const allEvents = await this.getUnlockEvents();
      return allEvents.filter(event => event.achievementId === achievementId);
    } catch (error) {
      console.error('AchievementStorage.getUnlockEventsForAchievement error:', error);
      return [];
    }
  }

  // ========================================
  // PROGRESSIVE ACHIEVEMENT PROGRESS TRACKING
  // ========================================

  /**
   * Store progress update for achievement
   */
  static async storeProgressUpdate(
    achievementId: string,
    newProgress: number,
    triggerSource: XPSourceType | string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const progressUpdate: AchievementProgressHistory = {
        achievementId,
        progress: Math.max(0, Math.min(100, newProgress)), // Clamp to 0-100
        timestamp: new Date(),
        trigger: triggerSource as any,
        context: {
          source: triggerSource,
          timestamp: Date.now(),
          ...metadata
        }
      };

      // Get existing history
      const history = await this.getProgressHistory();
      history.push(progressUpdate);
      
      // Keep only last 2000 progress updates for performance
      const trimmedHistory = history.slice(-2000);
      
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEYS.PROGRESS_HISTORY,
        JSON.stringify(trimmedHistory)
      );

      // Update user achievements progress
      await this.updateAchievementProgress(achievementId, newProgress);
      
    } catch (error) {
      console.error('AchievementStorage.storeProgressUpdate error:', error);
      throw error;
    }
  }

  /**
   * Get progress history for all achievements
   */
  static async getProgressHistory(): Promise<AchievementProgressHistory[]> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.PROGRESS_HISTORY);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      return history.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
      
    } catch (error) {
      console.error('AchievementStorage.getProgressHistory error:', error);
      return [];
    }
  }

  /**
   * Get progress history for specific achievement
   */
  static async getProgressHistoryForAchievement(achievementId: string): Promise<AchievementProgressHistory[]> {
    try {
      const allHistory = await this.getProgressHistory();
      return allHistory
        .filter(entry => entry.achievementId === achievementId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('AchievementStorage.getProgressHistoryForAchievement error:', error);
      return [];
    }
  }

  /**
   * Update single achievement progress in user data
   */
  static async updateAchievementProgress(achievementId: string, progress: number): Promise<void> {
    try {
      const userAchievements = await this.getUserAchievements();
      userAchievements.achievementProgress[achievementId] = Math.max(0, Math.min(100, progress));
      await this.saveUserAchievements(userAchievements);
    } catch (error) {
      console.error('AchievementStorage.updateAchievementProgress error:', error);
      throw error;
    }
  }

  // ========================================
  // STATISTICS & ANALYTICS COLLECTION
  // ========================================

  /**
   * Generate comprehensive achievement statistics
   */
  static async generateAchievementStatistics(): Promise<AchievementStats> {
    try {
      const userAchievements = await this.getUserAchievements();
      const unlockEvents = await this.getUnlockEvents();
      
      // Get total achievements count (would be from achievement catalog)
      const { CORE_ACHIEVEMENTS } = await import('../constants/achievementCatalog');
      const totalAchievements = CORE_ACHIEVEMENTS.length;
      
      // Calculate completion rate
      const unlockedCount = userAchievements.unlockedAchievements.length;
      const completionRate = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;
      
      // Calculate average time to unlock
      let averageTimeToUnlock = 0;
      if (unlockEvents.length > 0) {
        const firstUnlock = Math.min(...unlockEvents.map(e => e.unlockedAt.getTime()));
        const totalTime = unlockEvents.reduce((sum, event) => {
          return sum + (event.unlockedAt.getTime() - firstUnlock);
        }, 0);
        averageTimeToUnlock = totalTime / (unlockEvents.length * 24 * 60 * 60 * 1000); // Convert to days
      }
      
      // Find most recent unlock
      let mostRecentUnlock: AchievementStats['mostRecentUnlock'];
      if (unlockEvents.length > 0) {
        const latest = unlockEvents.reduce((latest, event) => 
          event.unlockedAt.getTime() > latest.unlockedAt.getTime() ? event : latest
        );
        
        const achievement = CORE_ACHIEVEMENTS.find(a => a.id === latest.achievementId);
        if (achievement) {
          mostRecentUnlock = {
            achievementId: latest.achievementId,
            unlockedAt: latest.unlockedAt,
            rarity: achievement.rarity
          };
        }
      }
      
      // Calculate rarity breakdown
      const rarityBreakdown: AchievementStats['rarityBreakdown'] = {};
      for (const rarity of Object.values(AchievementRarity)) {
        const totalOfRarity = CORE_ACHIEVEMENTS.filter(a => a.rarity === rarity).length;
        const unlockedOfRarity = userAchievements.rarityCount[rarity] || 0;
        
        rarityBreakdown[rarity] = {
          total: totalOfRarity,
          unlocked: unlockedOfRarity,
          completionRate: totalOfRarity > 0 ? (unlockedOfRarity / totalOfRarity) * 100 : 0
        };
      }
      
      // Calculate category breakdown
      const categoryBreakdown: AchievementStats['categoryBreakdown'] = {};
      for (const category of Object.values(AchievementCategory)) {
        const totalOfCategory = CORE_ACHIEVEMENTS.filter(a => a.category === category).length;
        const unlockedOfCategory = userAchievements.categoryProgress[category] || 0;
        
        // Calculate total progress for category
        const categoryAchievements = CORE_ACHIEVEMENTS.filter(a => a.category === category);
        const totalProgress = categoryAchievements.reduce((sum, achievement) => {
          return sum + (userAchievements.achievementProgress[achievement.id] || 0);
        }, 0);
        
        categoryBreakdown[category] = {
          total: totalOfCategory,
          unlocked: unlockedOfCategory,
          totalProgress: totalOfCategory > 0 ? totalProgress / totalOfCategory : 0
        };
      }
      
      const stats: AchievementStats = {
        totalAchievements,
        unlockedAchievements: unlockedCount,
        completionRate,
        averageTimeToUnlock,
        mostRecentUnlock,
        rarityBreakdown,
        categoryBreakdown
      };
      
      // Cache the statistics
      await this.cacheStatistics(stats);
      
      return stats;
      
    } catch (error) {
      console.error('AchievementStorage.generateAchievementStatistics error:', error);
      // Return default stats on error
      return {
        totalAchievements: 0,
        unlockedAchievements: 0,
        completionRate: 0,
        averageTimeToUnlock: 0,
        rarityBreakdown: {} as any,
        categoryBreakdown: {} as any
      };
    }
  }

  /**
   * Cache statistics for performance
   */
  static async cacheStatistics(stats: AchievementStats): Promise<void> {
    try {
      const cacheData = {
        stats,
        cachedAt: new Date(),
        version: ACHIEVEMENT_DATA_VERSION.CURRENT
      };
      
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEYS.STATISTICS_CACHE,
        JSON.stringify(cacheData)
      );
      
    } catch (error) {
      console.error('AchievementStorage.cacheStatistics error:', error);
    }
  }

  /**
   * Get cached statistics (with expiry check)
   */
  static async getCachedStatistics(maxAgeHours: number = 24): Promise<AchievementStats | null> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.STATISTICS_CACHE);
      if (!stored) return null;
      
      const cacheData = JSON.parse(stored);
      const cachedAt = new Date(cacheData.cachedAt);
      const ageInHours = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60);
      
      if (ageInHours > maxAgeHours) {
        return null; // Cache expired
      }
      
      return cacheData.stats;
      
    } catch (error) {
      console.error('AchievementStorage.getCachedStatistics error:', error);
      return null;
    }
  }

  // ========================================
  // DATA MIGRATION & VERSIONING SYSTEM
  // ========================================

  /**
   * Check if data migration is needed
   */
  static async checkMigrationNeeded(): Promise<boolean> {
    try {
      const storedVersion = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.DATA_VERSION);
      if (!storedVersion) return true; // New installation
      
      const currentVersion = ACHIEVEMENT_DATA_VERSION.CURRENT;
      return storedVersion !== currentVersion;
      
    } catch (error) {
      console.error('AchievementStorage.checkMigrationNeeded error:', error);
      return true; // Assume migration needed on error
    }
  }

  /**
   * Perform data migration if needed
   */
  static async performMigrationIfNeeded(): Promise<void> {
    try {
      const migrationNeeded = await this.checkMigrationNeeded();
      if (!migrationNeeded) return;
      
      const storedVersion = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.DATA_VERSION) || '0.0.0';
      
      console.log(`🔄 Migrating achievement data from ${storedVersion} to ${ACHIEVEMENT_DATA_VERSION.CURRENT}`);
      
      // Perform migration based on version
      await this.migrateFromVersion(storedVersion);
      
      // Update version
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEYS.DATA_VERSION,
        ACHIEVEMENT_DATA_VERSION.CURRENT
      );
      
      // Log migration
      await this.logMigration(storedVersion, ACHIEVEMENT_DATA_VERSION.CURRENT, true);
      
      console.log(`✅ Achievement data migration completed successfully`);
      
    } catch (error) {
      console.error('AchievementStorage.performMigrationIfNeeded error:', error);
      await this.logMigration('unknown', ACHIEVEMENT_DATA_VERSION.CURRENT, false, error.message);
      throw error;
    }
  }

  /**
   * Migrate data from specific version
   */
  static async migrateFromVersion(fromVersion: string): Promise<void> {
    switch (fromVersion) {
      case '0.0.0':
      case '0.9.0':
        await this.migrateFromV090();
        break;
      default:
        console.log(`No specific migration needed for version ${fromVersion}`);
        break;
    }
  }

  /**
   * Migration from version 0.9.0
   */
  static async migrateFromV090(): Promise<void> {
    try {
      // Get existing data
      const userAchievements = await this.getUserAchievements();
      
      // Add missing fields if they don't exist
      if (!userAchievements.rarityCount) {
        userAchievements.rarityCount = {
          [AchievementRarity.COMMON]: 0,
          [AchievementRarity.RARE]: 0,
          [AchievementRarity.EPIC]: 0,
          [AchievementRarity.LEGENDARY]: 0,
        };
      }
      
      if (!userAchievements.categoryProgress) {
        userAchievements.categoryProgress = {
          [AchievementCategory.HABITS]: 0,
          [AchievementCategory.JOURNAL]: 0,
          [AchievementCategory.GOALS]: 0,
          [AchievementCategory.CONSISTENCY]: 0,
          [AchievementCategory.MASTERY]: 0,
          [AchievementCategory.SOCIAL]: 0,
          [AchievementCategory.SPECIAL]: 0,
        };
      }
      
      if (!userAchievements.progressHistory) {
        userAchievements.progressHistory = [];
      }
      
      if (!userAchievements.streakData) {
        userAchievements.streakData = {};
      }
      
      // Save migrated data
      await this.saveUserAchievements(userAchievements);
      
    } catch (error) {
      console.error('AchievementStorage.migrateFromV090 error:', error);
      throw error;
    }
  }

  /**
   * Log migration event
   */
  static async logMigration(
    fromVersion: string,
    toVersion: string,
    success: boolean,
    notes?: string
  ): Promise<void> {
    try {
      const migrationEntry: MigrationLogEntry = {
        fromVersion,
        toVersion,
        migratedAt: new Date(),
        migrationType: 'data',
        success,
        notes
      };
      
      const existingLog = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.MIGRATION_LOG);
      const log = existingLog ? JSON.parse(existingLog) : [];
      
      log.push(migrationEntry);
      
      // Keep only last 50 migration entries
      const trimmedLog = log.slice(-50);
      
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEYS.MIGRATION_LOG,
        JSON.stringify(trimmedLog)
      );
      
    } catch (error) {
      console.error('AchievementStorage.logMigration error:', error);
    }
  }

  // ========================================
  // DATA VALIDATION & CLEANUP
  // ========================================

  /**
   * Validate user achievements data
   */
  static validateUserAchievementsData(data: UserAchievements): UserAchievements {
    // Ensure all required fields exist
    const validated = {
      ...this.createEmptyUserAchievements(),
      ...data
    };
    
    // Validate arrays
    if (!Array.isArray(validated.unlockedAchievements)) {
      validated.unlockedAchievements = [];
    }
    
    if (!Array.isArray(validated.progressHistory)) {
      validated.progressHistory = [];
    }
    
    // Validate objects
    if (typeof validated.achievementProgress !== 'object') {
      validated.achievementProgress = {};
    }
    
    if (typeof validated.streakData !== 'object') {
      validated.streakData = {};
    }
    
    // Validate numbers
    if (typeof validated.totalXPFromAchievements !== 'number') {
      validated.totalXPFromAchievements = 0;
    }
    
    // Clamp progress values to 0-100
    for (const [achievementId, progress] of Object.entries(validated.achievementProgress)) {
      validated.achievementProgress[achievementId] = Math.max(0, Math.min(100, progress));
    }
    
    return validated;
  }

  /**
   * Validate and migrate user achievements if needed
   */
  static async validateAndMigrateUserAchievements(data: UserAchievements): Promise<UserAchievements> {
    let migrated = this.validateUserAchievementsData(data);
    
    // Add any additional migration logic here
    
    return migrated;
  }

  /**
   * Update statistics cache after user data changes
   */
  static async updateStatisticsCache(userAchievements: UserAchievements): Promise<void> {
    try {
      // Only update cache if it exists (don't create if it doesn't)
      const existingCache = await this.getCachedStatistics(168); // 7 days
      if (existingCache) {
        // Regenerate statistics in background
        setTimeout(() => {
          this.generateAchievementStatistics().catch(error => {
            console.warn('Background statistics update failed:', error);
          });
        }, 1000);
      }
    } catch (error) {
      console.warn('AchievementStorage.updateStatisticsCache error:', error);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Clear all achievement data (for testing/reset)
   */
  static async clearAllAchievementData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        ACHIEVEMENT_STORAGE_KEYS.USER_ACHIEVEMENTS,
        ACHIEVEMENT_STORAGE_KEYS.PROGRESS_HISTORY,
        ACHIEVEMENT_STORAGE_KEYS.UNLOCK_EVENTS,
        ACHIEVEMENT_STORAGE_KEYS.STATISTICS_CACHE,
        ACHIEVEMENT_STORAGE_KEYS.STREAK_DATA,
        ACHIEVEMENT_STORAGE_KEYS.LAST_BATCH_CHECK,
      ]);
      
      console.log('🧹 All achievement data cleared');
    } catch (error) {
      console.error('AchievementStorage.clearAllAchievementData error:', error);
      throw error;
    }
  }

  /**
   * Get storage size info for debugging
   */
  static async getStorageInfo(): Promise<{
    userAchievements: number;
    progressHistory: number;
    unlockEvents: number;
    statisticsCache: number;
    totalSize: number;
  }> {
    try {
      const getSize = async (key: string): Promise<number> => {
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.stringify(data).length : 0;
      };
      
      const userAchievements = await getSize(ACHIEVEMENT_STORAGE_KEYS.USER_ACHIEVEMENTS);
      const progressHistory = await getSize(ACHIEVEMENT_STORAGE_KEYS.PROGRESS_HISTORY);
      const unlockEvents = await getSize(ACHIEVEMENT_STORAGE_KEYS.UNLOCK_EVENTS);
      const statisticsCache = await getSize(ACHIEVEMENT_STORAGE_KEYS.STATISTICS_CACHE);
      
      return {
        userAchievements,
        progressHistory,
        unlockEvents,
        statisticsCache,
        totalSize: userAchievements + progressHistory + unlockEvents + statisticsCache
      };
      
    } catch (error) {
      console.error('AchievementStorage.getStorageInfo error:', error);
      return {
        userAchievements: 0,
        progressHistory: 0,
        unlockEvents: 0,
        statisticsCache: 0,
        totalSize: 0
      };
    }
  }
}