// Star Rating System Migration Utility
// Migrates existing MonthlyChallengeService star ratings to StarRatingService

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserChallengeRatings, StarRatingHistoryEntry, AchievementCategory } from '../types/gamification';
import { StarRatingService } from './starRatingService';

// ========================================
// MIGRATION INTERFACES
// ========================================

interface MigrationResult {
  success: boolean;
  migratedRatings?: UserChallengeRatings;
  migratedHistoryEntries?: number;
  errors?: string[];
  warnings?: string[];
}

interface LegacyStarRatings {
  habits: number;
  journal: number;
  goals: number;
  consistency: number;
  history?: any[];
  lastUpdated?: Date | string;
}

// ========================================
// MIGRATION SERVICE
// ========================================

export class StarRatingMigration {
  // Legacy storage keys from MonthlyChallengeService
  private static readonly LEGACY_RATINGS_KEY = 'user_challenge_ratings';
  
  // Migration status key
  private static readonly MIGRATION_STATUS_KEY = 'star_rating_migration_status';
  
  /**
   * Check if migration has already been completed
   */
  public static async isMigrationCompleted(): Promise<boolean> {
    try {
      const status = await AsyncStorage.getItem(this.MIGRATION_STATUS_KEY);
      return status === 'completed';
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Mark migration as completed
   */
  private static async markMigrationCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.MIGRATION_STATUS_KEY, 'completed');
    } catch (error) {
      console.error('Error marking migration as completed:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Check if legacy data exists
   */
  public static async hasLegacyData(): Promise<boolean> {
    try {
      const legacyData = await AsyncStorage.getItem(this.LEGACY_RATINGS_KEY);
      return legacyData !== null;
    } catch (error) {
      console.error('Error checking for legacy data:', error);
      return false;
    }
  }

  /**
   * Migrate legacy star ratings to new StarRatingService
   */
  public static async migrateLegacyStarRatings(): Promise<MigrationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if migration already completed
      if (await this.isMigrationCompleted()) {
        return {
          success: true,
          warnings: ['Migration already completed']
        };
      }

      // Check for legacy data
      if (!(await this.hasLegacyData())) {
        await this.markMigrationCompleted();
        return {
          success: true,
          warnings: ['No legacy data found - creating fresh star ratings']
        };
      }

      // Load legacy data
      const legacyDataRaw = await AsyncStorage.getItem(this.LEGACY_RATINGS_KEY);
      if (!legacyDataRaw) {
        await this.markMigrationCompleted();
        return {
          success: true,
          warnings: ['Legacy data is empty']
        };
      }

      let legacyData: LegacyStarRatings;
      try {
        legacyData = JSON.parse(legacyDataRaw);
      } catch (parseError) {
        errors.push('Failed to parse legacy star ratings data');
        return { success: false, errors };
      }

      // Validate and normalize legacy data
      const migratedRatings: UserChallengeRatings = {
        habits: this.validateStarLevel(legacyData.habits, 'habits'),
        journal: this.validateStarLevel(legacyData.journal, 'journal'),
        goals: this.validateStarLevel(legacyData.goals, 'goals'),
        consistency: this.validateStarLevel(legacyData.consistency, 'consistency'),
        mastery: 1, // Default value for new category
        special: 1, // Default value for new category
        history: [],
        lastUpdated: new Date()
      };

      // Migrate history if available
      let migratedHistoryEntries = 0;
      if (legacyData.history && Array.isArray(legacyData.history)) {
        const migratedHistory = this.migrateLegacyHistory(legacyData.history);
        migratedRatings.history = migratedHistory;
        migratedHistoryEntries = migratedHistory.length;
      }

      // Check if StarRatingService already has data
      try {
        const existingRatings = await StarRatingService.getCurrentStarRatings();
        if (existingRatings.lastUpdated && existingRatings.history.length > 0) {
          warnings.push('StarRatingService already has data - skipping migration to avoid data loss');
          await this.markMigrationCompleted();
          return {
            success: true,
            warnings,
            migratedRatings: existingRatings
          };
        }
      } catch (error) {
        // StarRatingService doesn't have data yet - proceed with migration
      }

      // Save migrated data using StarRatingService
      try {
        // Clear any existing data first
        await StarRatingService.clearAllStarData();
        
        // Save the migrated ratings
        await AsyncStorage.setItem('user_star_ratings', JSON.stringify(migratedRatings));
        
        // Save history separately if exists
        if (migratedRatings.history.length > 0) {
          await AsyncStorage.setItem('star_rating_history', JSON.stringify(migratedRatings.history));
        }

        // Mark migration as completed
        await this.markMigrationCompleted();

        return {
          success: true,
          migratedRatings,
          migratedHistoryEntries,
          warnings
        };

      } catch (saveError) {
        errors.push(`Failed to save migrated data: ${saveError}`);
        return { success: false, errors };
      }

    } catch (error) {
      errors.push(`Migration failed: ${error}`);
      return { success: false, errors };
    }
  }

  /**
   * Clean up legacy data after successful migration
   */
  public static async cleanupLegacyData(): Promise<void> {
    try {
      // Only cleanup if migration was completed
      if (!(await this.isMigrationCompleted())) {
        console.warn('Migration not completed - skipping legacy data cleanup');
        return;
      }

      // Remove legacy star ratings data
      await AsyncStorage.removeItem(this.LEGACY_RATINGS_KEY);
      
      console.log('Legacy star rating data cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up legacy data:', error);
      // Don't throw - cleanup failure is not critical
    }
  }

  /**
   * Force re-run migration (for development/testing)
   */
  public static async forceMigration(): Promise<MigrationResult> {
    try {
      await AsyncStorage.removeItem(this.MIGRATION_STATUS_KEY);
      return await this.migrateLegacyStarRatings();
    } catch (error) {
      return {
        success: false,
        errors: [`Force migration failed: ${error}`]
      };
    }
  }

  /**
   * Get migration status and information
   */
  public static async getMigrationInfo(): Promise<{
    isCompleted: boolean;
    hasLegacyData: boolean;
    legacyDataPreview?: Partial<LegacyStarRatings>;
  }> {
    const isCompleted = await this.isMigrationCompleted();
    const hasLegacyData = await this.hasLegacyData();
    
    let legacyDataPreview: Partial<LegacyStarRatings> | undefined;
    
    if (hasLegacyData) {
      try {
        const legacyDataRaw = await AsyncStorage.getItem(this.LEGACY_RATINGS_KEY);
        if (legacyDataRaw) {
          const legacyData = JSON.parse(legacyDataRaw);
          legacyDataPreview = {
            habits: legacyData.habits,
            journal: legacyData.journal,
            goals: legacyData.goals,
            consistency: legacyData.consistency,
            lastUpdated: legacyData.lastUpdated
          };
        }
      } catch (error) {
        console.error('Error getting legacy data preview:', error);
      }
    }

    return {
      isCompleted,
      hasLegacyData,
      ...(legacyDataPreview && { legacyDataPreview })
    };
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Validate and normalize star level value
   */
  private static validateStarLevel(value: any, categoryName: string): number {
    if (typeof value === 'number' && value >= 1 && value <= 5) {
      return Math.round(value);
    }
    
    console.warn(`Invalid star level for ${categoryName}: ${value}, defaulting to 1`);
    return 1;
  }

  /**
   * Migrate legacy history entries to new format
   */
  private static migrateLegacyHistory(legacyHistory: any[]): StarRatingHistoryEntry[] {
    const migratedHistory: StarRatingHistoryEntry[] = [];

    for (const entry of legacyHistory) {
      try {
        // Skip invalid entries
        if (!entry || typeof entry !== 'object') continue;
        
        // Map legacy fields to new format
        const migratedEntry: StarRatingHistoryEntry = {
          month: this.normalizeDateToMonth(entry.month || new Date()),
          category: this.mapLegacyCategory(entry.category),
          previousStars: this.validateStarLevel(entry.previousStars, 'previousStars'),
          newStars: this.validateStarLevel(entry.newStars, 'newStars'),
          challengeCompleted: Boolean(entry.challengeCompleted),
          completionPercentage: Math.max(0, Math.min(100, Number(entry.completionPercentage) || 0)),
          reason: this.mapLegacyReason(entry.reason),
          timestamp: new Date(entry.timestamp || entry.createdAt || Date.now())
        };

        migratedHistory.push(migratedEntry);
      } catch (error) {
        console.warn('Failed to migrate history entry:', entry, error);
        // Skip invalid entries
      }
    }

    // Sort by timestamp descending (most recent first)
    return migratedHistory.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 12); // Keep only last 12 entries
  }

  /**
   * Normalize date to YYYY-MM format
   */
  private static normalizeDateToMonth(date: any): string {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return new Date().toISOString().substring(0, 7);
      }
      return dateObj.toISOString().substring(0, 7);
    } catch (error) {
      return new Date().toISOString().substring(0, 7);
    }
  }

  /**
   * Map legacy category names to AchievementCategory enum
   */
  private static mapLegacyCategory(category: any): AchievementCategory {
    if (typeof category === 'string') {
      switch (category.toLowerCase()) {
        case 'habits':
        case 'habit':
          return AchievementCategory.HABITS;
        case 'journal':
        case 'journaling':
        case 'gratitude':
          return AchievementCategory.JOURNAL;
        case 'goals':
        case 'goal':
          return AchievementCategory.GOALS;
        case 'consistency':
        case 'consistent':
          return AchievementCategory.CONSISTENCY;
        default:
          return AchievementCategory.HABITS; // Default fallback
      }
    }
    
    return AchievementCategory.HABITS; // Default fallback
  }

  /**
   * Map legacy reason values to new format
   */
  private static mapLegacyReason(reason: any): StarRatingHistoryEntry['reason'] {
    if (typeof reason === 'string') {
      switch (reason.toLowerCase()) {
        case 'success':
        case 'completed':
        case 'achievement':
          return 'success';
        case 'failure':
        case 'failed':
        case 'incomplete':
          return 'failure';
        case 'double_failure':
        case 'consecutive_failure':
        case 'double_fail':
          return 'double_failure';
        case 'reset':
        case 'manual_reset':
        case 'admin_reset':
          return 'reset';
        default:
          return 'failure'; // Default fallback
      }
    }
    
    return 'failure'; // Default fallback
  }
}