import { BaseStorage, STORAGE_KEYS, StorageError, STORAGE_ERROR_CODES } from './base';
import { dataMigration } from './migration';
import { habitStorage } from './habitStorage';
import { gratitudeStorage } from './gratitudeStorage';
import { goalStorage } from './goalStorage';
import { userStorage } from './userStorage';
import { generateId } from '../../utils/data';

// Backup data structure
export interface BackupData {
  version: string;
  timestamp: string;
  migrationVersion: number;
  data: {
    habits: any[];
    habitCompletions: any[];
    gratitudes: any[];
    gratitudeStreak: any;
    goals: any[];
    goalProgress: any[];
    user: any;
    userSettings: any;
  };
  metadata: {
    totalHabits: number;
    totalGratitudes: number;
    totalGoals: number;
    exportedBy: string;
  };
}

// Backup options
export interface BackupOptions {
  includeUser?: boolean;
  includeSettings?: boolean;
  includeHabits?: boolean;
  includeGratitudes?: boolean;
  includeGoals?: boolean;
  compress?: boolean;
}

// Restore options
export interface RestoreOptions {
  overwriteExisting?: boolean;
  restoreUser?: boolean;
  restoreSettings?: boolean;
  restoreHabits?: boolean;
  restoreGratitudes?: boolean;
  restoreGoals?: boolean;
}

// Backup result
export interface BackupResult {
  success: boolean;
  backupData?: string;
  size: number;
  timestamp: string;
  error?: string;
}

// Restore result
export interface RestoreResult {
  success: boolean;
  itemsRestored: {
    habits: number;
    gratitudes: number;
    goals: number;
    user: boolean;
    settings: boolean;
  };
  errors: string[];
}

export class DataBackup {
  private readonly APP_VERSION = '1.0.0';

  // Create a complete backup of all data
  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    try {
      const {
        includeUser = true,
        includeSettings = true,
        includeHabits = true,
        includeGratitudes = true,
        includeGoals = true,
      } = options;

      const timestamp = new Date().toISOString();
      
      // Gather all data
      const [
        habits,
        habitCompletions,
        gratitudes,
        gratitudeStreak,
        goals,
        goalProgress,
        user,
        userSettings,
        migrationVersion,
      ] = await Promise.all([
        includeHabits ? habitStorage.getAll() : [],
        includeHabits ? habitStorage.getAllCompletions() : [],
        includeGratitudes ? gratitudeStorage.getAll() : [],
        includeGratitudes ? gratitudeStorage.getStreak() : null,
        includeGoals ? goalStorage.getAll() : [],
        includeGoals ? goalStorage.getAllProgress() : [],
        includeUser ? userStorage.getUser() : null,
        includeSettings ? userStorage.getSettings() : null,
        dataMigration.getCurrentVersion(),
      ]);

      // Create backup data structure
      const backupData: BackupData = {
        version: this.APP_VERSION,
        timestamp,
        migrationVersion,
        data: {
          habits: habits || [],
          habitCompletions: habitCompletions || [],
          gratitudes: gratitudes || [],
          gratitudeStreak: gratitudeStreak,
          goals: goals || [],
          goalProgress: goalProgress || [],
          user: user,
          userSettings: userSettings,
        },
        metadata: {
          totalHabits: habits?.length || 0,
          totalGratitudes: gratitudes?.length || 0,
          totalGoals: goals?.length || 0,
          exportedBy: user?.displayName || 'Unknown User',
        },
      };

      // Serialize backup data
      const backupString = JSON.stringify(backupData, null, 2);
      const size = new Blob([backupString]).size;

      return {
        success: true,
        backupData: backupString,
        size,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        timestamp: new Date().toISOString(),
        error: `Failed to create backup: ${error}`,
      };
    }
  }

  // Restore data from backup
  async restoreFromBackup(backupString: string, options: RestoreOptions = {}): Promise<RestoreResult> {
    const {
      overwriteExisting = false,
      restoreUser = true,
      restoreSettings = true,
      restoreHabits = true,
      restoreGratitudes = true,
      restoreGoals = true,
    } = options;

    const result: RestoreResult = {
      success: false,
      itemsRestored: {
        habits: 0,
        gratitudes: 0,
        goals: 0,
        user: false,
        settings: false,
      },
      errors: [],
    };

    try {
      // Parse backup data
      const backupData: BackupData = JSON.parse(backupString);
      
      // Validate backup format
      if (!this.validateBackupData(backupData)) {
        result.errors.push('Invalid backup data format');
        return result;
      }

      // Create a backup of current data before restore
      if (overwriteExisting) {
        try {
          await dataMigration.backupData();
        } catch (error) {
          result.errors.push(`Failed to backup current data: ${error}`);
        }
      }

      // Restore user data
      if (restoreUser && backupData.data.user) {
        try {
          if (overwriteExisting || !(await userStorage.getUser())) {
            await userStorage.setUser(backupData.data.user);
            result.itemsRestored.user = true;
          }
        } catch (error) {
          result.errors.push(`Failed to restore user: ${error}`);
        }
      }

      // Restore user settings
      if (restoreSettings && backupData.data.userSettings) {
        try {
          if (overwriteExisting || !(await userStorage.getSettings())) {
            await userStorage.setSettings(backupData.data.userSettings);
            result.itemsRestored.settings = true;
          }
        } catch (error) {
          result.errors.push(`Failed to restore settings: ${error}`);
        }
      }

      // Restore habits
      if (restoreHabits && backupData.data.habits) {
        try {
          if (overwriteExisting) {
            await habitStorage.deleteAll();
          }

          for (const habit of backupData.data.habits) {
            try {
              await BaseStorage.set(STORAGE_KEYS.HABITS, [
                ...(await habitStorage.getAll()),
                habit,
              ]);
              result.itemsRestored.habits++;
            } catch (error) {
              result.errors.push(`Failed to restore habit ${habit.id}: ${error}`);
            }
          }

          // Restore habit completions
          if (backupData.data.habitCompletions) {
            await BaseStorage.set(STORAGE_KEYS.HABIT_COMPLETIONS, backupData.data.habitCompletions);
          }
        } catch (error) {
          result.errors.push(`Failed to restore habits: ${error}`);
        }
      }

      // Restore gratitudes
      if (restoreGratitudes && backupData.data.gratitudes) {
        try {
          if (overwriteExisting) {
            await gratitudeStorage.deleteAll();
          }

          for (const gratitude of backupData.data.gratitudes) {
            try {
              await BaseStorage.set(STORAGE_KEYS.GRATITUDES, [
                ...(await gratitudeStorage.getAll()),
                gratitude,
              ]);
              result.itemsRestored.gratitudes++;
            } catch (error) {
              result.errors.push(`Failed to restore gratitude ${gratitude.id}: ${error}`);
            }
          }

          // Restore gratitude streak
          if (backupData.data.gratitudeStreak) {
            await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, backupData.data.gratitudeStreak);
          }
        } catch (error) {
          result.errors.push(`Failed to restore gratitudes: ${error}`);
        }
      }

      // Restore goals
      if (restoreGoals && backupData.data.goals) {
        try {
          if (overwriteExisting) {
            await goalStorage.deleteAll();
          }

          for (const goal of backupData.data.goals) {
            try {
              await BaseStorage.set(STORAGE_KEYS.GOALS, [
                ...(await goalStorage.getAll()),
                goal,
              ]);
              result.itemsRestored.goals++;
            } catch (error) {
              result.errors.push(`Failed to restore goal ${goal.id}: ${error}`);
            }
          }

          // Restore goal progress
          if (backupData.data.goalProgress) {
            await BaseStorage.set(STORAGE_KEYS.GOAL_PROGRESS, backupData.data.goalProgress);
          }
        } catch (error) {
          result.errors.push(`Failed to restore goals: ${error}`);
        }
      }

      // Set migration version if provided
      if (backupData.migrationVersion) {
        try {
          await dataMigration.setCurrentVersion(backupData.migrationVersion);
        } catch (error) {
          result.errors.push(`Failed to set migration version: ${error}`);
        }
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push(`Failed to parse backup data: ${error}`);
      return result;
    }
  }

  // Validate backup data structure
  private validateBackupData(data: any): data is BackupData {
    try {
      return (
        data &&
        typeof data.version === 'string' &&
        typeof data.timestamp === 'string' &&
        typeof data.migrationVersion === 'number' &&
        data.data &&
        typeof data.data === 'object' &&
        data.metadata &&
        typeof data.metadata === 'object'
      );
    } catch (error) {
      return false;
    }
  }

  // Get backup metadata without full parsing
  async getBackupMetadata(backupString: string): Promise<BackupData['metadata'] | null> {
    try {
      const data = JSON.parse(backupString);
      return data.metadata || null;
    } catch (error) {
      return null;
    }
  }

  // Check backup compatibility
  async isBackupCompatible(backupString: string): Promise<{
    compatible: boolean;
    backupVersion: string;
    currentVersion: string;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      const backupData: BackupData = JSON.parse(backupString);
      
      if (!this.validateBackupData(backupData)) {
        issues.push('Invalid backup format');
      }

      // Check version compatibility
      const backupVersion = backupData.version;
      const currentVersion = this.APP_VERSION;
      
      if (backupVersion !== currentVersion) {
        issues.push(`Version mismatch: backup (${backupVersion}) vs current (${currentVersion})`);
      }

      // Check migration version
      const currentMigrationVersion = await dataMigration.getCurrentVersion();
      if (backupData.migrationVersion > currentMigrationVersion) {
        issues.push('Backup was created with a newer app version');
      }

      return {
        compatible: issues.length === 0,
        backupVersion,
        currentVersion,
        issues,
      };
    } catch (error) {
      return {
        compatible: false,
        backupVersion: 'unknown',
        currentVersion: this.APP_VERSION,
        issues: [`Failed to parse backup: ${error}`],
      };
    }
  }

  // Create automatic backup (called periodically)
  async createAutoBackup(): Promise<void> {
    try {
      const settings = await userStorage.getSettings();
      if (!settings.dataBackupEnabled) {
        return;
      }

      const backup = await this.createBackup();
      if (backup.success && backup.backupData) {
        // Store auto backup with timestamp
        const autoBackupKey = `auto_backup_${Date.now()}`;
        await BaseStorage.set(autoBackupKey, backup.backupData);
        
        // Clean up old auto backups (keep only last 3)
        await this.cleanupAutoBackups();
      }
    } catch (error) {
      console.error('Failed to create auto backup:', error);
    }
  }

  // Clean up old auto backups
  private async cleanupAutoBackups(): Promise<void> {
    try {
      const allKeys = await BaseStorage.getAllKeys();
      const autoBackupKeys = allKeys
        .filter(key => key.startsWith('auto_backup_'))
        .sort()
        .reverse(); // Most recent first

      if (autoBackupKeys.length > 3) {
        const toDelete = autoBackupKeys.slice(3);
        await BaseStorage.multiRemove(toDelete);
      }
    } catch (error) {
      console.error('Failed to cleanup auto backups:', error);
    }
  }

  // Get list of auto backups
  async getAutoBackups(): Promise<Array<{ key: string; timestamp: string; size: number }>> {
    try {
      const allKeys = await BaseStorage.getAllKeys();
      const autoBackupKeys = allKeys.filter(key => key.startsWith('auto_backup_'));
      
      const backups: Array<{ key: string; timestamp: string; size: number }> = [];

      for (const key of autoBackupKeys) {
        try {
          const backupData = await BaseStorage.get<string>(key);
          if (backupData) {
            const size = new Blob([backupData]).size;
            const timestamp = new Date(parseInt(key.split('_')[2]!)).toISOString();
            backups.push({ key, timestamp, size });
          }
        } catch (error) {
          console.warn(`Failed to process auto backup ${key}:`, error);
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get auto backups:', error);
      return [];
    }
  }

  // Export backup to file (platform-specific implementation needed)
  async exportBackupToFile(filename: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const backup = await this.createBackup();
      if (!backup.success || !backup.backupData) {
        return {
          success: false,
          error: backup.error || 'Failed to create backup',
        };
      }

      // Note: Actual file export would require platform-specific implementation
      // This is a placeholder for the interface
      console.log(`Would export backup to file: ${filename}`);
      console.log(`Backup size: ${backup.size} bytes`);

      return {
        success: true,
        path: filename,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export backup: ${error}`,
      };
    }
  }

  // Calculate storage usage
  async getStorageUsage(): Promise<{
    total: number;
    byType: Record<string, number>;
    details: Array<{ key: string; size: number; type: string }>;
  }> {
    try {
      const allKeys = await BaseStorage.getAllKeys();
      const details: Array<{ key: string; size: number; type: string }> = [];
      const byType: Record<string, number> = {};

      for (const key of allKeys) {
        try {
          const data = await BaseStorage.get<any>(key);
          if (data !== null) {
            const size = new Blob([JSON.stringify(data)]).size;
            const type = this.getKeyType(key);
            
            details.push({ key, size, type });
            byType[type] = (byType[type] || 0) + size;
          }
        } catch (error) {
          console.warn(`Failed to get size for key ${key}:`, error);
        }
      }

      const total = details.reduce((sum, item) => sum + item.size, 0);

      return {
        total,
        byType,
        details: details.sort((a, b) => b.size - a.size),
      };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return {
        total: 0,
        byType: {},
        details: [],
      };
    }
  }

  private getKeyType(key: string): string {
    if (key.startsWith('auto_backup_')) return 'auto_backup';
    if (key.startsWith('backup_')) return 'backup';
    
    switch (key) {
      case STORAGE_KEYS.HABITS:
      case STORAGE_KEYS.HABIT_COMPLETIONS:
        return 'habits';
      case STORAGE_KEYS.GRATITUDES:
      case STORAGE_KEYS.GRATITUDE_STREAK:
        return 'gratitudes';
      case STORAGE_KEYS.GOALS:
      case STORAGE_KEYS.GOAL_PROGRESS:
        return 'goals';
      case STORAGE_KEYS.USER:
      case STORAGE_KEYS.USER_SETTINGS:
        return 'user';
      default:
        return 'other';
    }
  }
}

// Singleton instance
export const dataBackup = new DataBackup();