import { BaseStorage, STORAGE_KEYS, CURRENT_MIGRATION_VERSION, StorageError, STORAGE_ERROR_CODES } from './base';
import { Habit, HabitCompletion } from '../../types/habit';
import { Gratitude, GratitudeStreak } from '../../types/gratitude';
import { Goal, GoalProgress } from '../../types/goal';
import { User, UserSettings } from '../../types/user';

// Migration interface
interface Migration {
  version: number;
  description: string;
  migrate: () => Promise<void>;
}

// Migration result
interface MigrationResult {
  success: boolean;
  migratedFrom: number;
  migratedTo: number;
  errors: string[];
}

export class DataMigration {
  private migrations: Migration[] = [
    {
      version: 1,
      description: 'Initial data structure setup',
      migrate: async () => {
        // This is the initial version, no migration needed
        console.log('Setting up initial data structure...');
      },
    },
    // Future migrations will be added here
    // {
    //   version: 2,
    //   description: 'Add new field to habits',
    //   migrate: async () => {
    //     // Migration logic for version 2
    //   },
    // },
  ];

  // Get current migration version from storage
  async getCurrentVersion(): Promise<number> {
    try {
      const version = await BaseStorage.get<number>(STORAGE_KEYS.MIGRATION_VERSION);
      return version || 0;
    } catch (error) {
      console.warn('Failed to get migration version, assuming 0:', error);
      return 0;
    }
  }

  // Set migration version in storage
  async setCurrentVersion(version: number): Promise<void> {
    try {
      await BaseStorage.set(STORAGE_KEYS.MIGRATION_VERSION, version);
    } catch (error) {
      throw new StorageError(
        `Failed to set migration version to ${version}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.MIGRATION_VERSION
      );
    }
  }

  // Check if migration is needed
  async isMigrationNeeded(): Promise<boolean> {
    try {
      const currentVersion = await this.getCurrentVersion();
      return currentVersion < CURRENT_MIGRATION_VERSION;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  // Run all pending migrations
  async migrate(): Promise<MigrationResult> {
    const errors: string[] = [];
    let success = true;
    
    try {
      const currentVersion = await this.getCurrentVersion();
      let migratedTo = currentVersion;

      console.log(`Starting migration from version ${currentVersion} to ${CURRENT_MIGRATION_VERSION}`);

      // Run migrations in order
      for (const migration of this.migrations) {
        if (migration.version > currentVersion && migration.version <= CURRENT_MIGRATION_VERSION) {
          try {
            console.log(`Running migration ${migration.version}: ${migration.description}`);
            await migration.migrate();
            migratedTo = migration.version;
            await this.setCurrentVersion(migration.version);
            console.log(`Migration ${migration.version} completed successfully`);
          } catch (error) {
            const errorMessage = `Migration ${migration.version} failed: ${error}`;
            console.error(errorMessage);
            errors.push(errorMessage);
            success = false;
            break; // Stop on first failure
          }
        }
      }

      return {
        success,
        migratedFrom: currentVersion,
        migratedTo,
        errors,
      };
    } catch (error) {
      const errorMessage = `Migration process failed: ${error}`;
      console.error(errorMessage);
      return {
        success: false,
        migratedFrom: 0,
        migratedTo: 0,
        errors: [errorMessage],
      };
    }
  }

  // Backup data before migration
  async backupData(): Promise<string> {
    try {
      const allKeys = await BaseStorage.getAllKeys();
      const backup: Record<string, any> = {};

      for (const key of allKeys) {
        if (Object.values(STORAGE_KEYS).includes(key as any)) {
          const data = await BaseStorage.get(key);
          backup[key] = data;
        }
      }

      const backupString = JSON.stringify({
        timestamp: new Date().toISOString(),
        version: await this.getCurrentVersion(),
        data: backup,
      });

      // Store backup in a special key
      const backupKey = `backup_${Date.now()}`;
      await BaseStorage.set(backupKey, backupString);

      return backupKey;
    } catch (error) {
      throw new StorageError(
        'Failed to create data backup',
        STORAGE_ERROR_CODES.UNKNOWN,
        'backup'
      );
    }
  }

  // Restore data from backup
  async restoreFromBackup(backupKey: string): Promise<void> {
    try {
      const backupData = await BaseStorage.get<string>(backupKey);
      if (!backupData) {
        throw new StorageError(
          'Backup data not found',
          STORAGE_ERROR_CODES.NOT_FOUND,
          backupKey
        );
      }

      const backup = JSON.parse(backupData);
      
      // Clear current data
      await this.clearAllData();

      // Restore backed up data
      for (const [key, value] of Object.entries(backup.data)) {
        if (value !== null) {
          await BaseStorage.set(key, value);
        }
      }

      // Restore migration version
      if (backup.version !== undefined) {
        await this.setCurrentVersion(backup.version);
      }

      console.log(`Data restored from backup: ${backupKey}`);
    } catch (error) {
      throw new StorageError(
        `Failed to restore from backup: ${error}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        backupKey
      );
    }
  }

  // Clear all application data
  async clearAllData(): Promise<void> {
    try {
      const appKeys = Object.values(STORAGE_KEYS);
      await BaseStorage.multiRemove(appKeys);
    } catch (error) {
      throw new StorageError(
        'Failed to clear application data',
        STORAGE_ERROR_CODES.UNKNOWN,
        'clear_data'
      );
    }
  }

  // Validate data integrity after migration
  async validateDataIntegrity(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Validate habits
      const habits = await BaseStorage.get<Habit[]>(STORAGE_KEYS.HABITS);
      if (habits) {
        for (const habit of habits) {
          if (!habit.id || !habit.name || !habit.color || !habit.icon) {
            issues.push(`Invalid habit: ${habit.id || 'unknown'}`);
          }
        }
      }

      // Validate habit completions
      const completions = await BaseStorage.get<HabitCompletion[]>(STORAGE_KEYS.HABIT_COMPLETIONS);
      if (completions && habits) {
        const habitIds = new Set(habits.map(h => h.id));
        for (const completion of completions) {
          if (!habitIds.has(completion.habitId)) {
            issues.push(`Orphaned habit completion: ${completion.id}`);
          }
        }
      }

      // Validate gratitudes
      const gratitudes = await BaseStorage.get<Gratitude[]>(STORAGE_KEYS.GRATITUDES);
      if (gratitudes) {
        for (const gratitude of gratitudes) {
          if (!gratitude.id || !gratitude.content || !gratitude.date) {
            issues.push(`Invalid gratitude: ${gratitude.id || 'unknown'}`);
          }
        }
      }

      // Validate goals
      const goals = await BaseStorage.get<Goal[]>(STORAGE_KEYS.GOALS);
      if (goals) {
        for (const goal of goals) {
          if (!goal.id || !goal.title || !goal.unit || goal.targetValue <= 0) {
            issues.push(`Invalid goal: ${goal.id || 'unknown'}`);
          }
        }
      }

      // Validate goal progress
      const progress = await BaseStorage.get<GoalProgress[]>(STORAGE_KEYS.GOAL_PROGRESS);
      if (progress && goals) {
        const goalIds = new Set(goals.map(g => g.id));
        for (const entry of progress) {
          if (!goalIds.has(entry.goalId)) {
            issues.push(`Orphaned goal progress: ${entry.id}`);
          }
        }
      }

      // Validate user data
      const user = await BaseStorage.get<User>(STORAGE_KEYS.USER);
      if (user) {
        if (!user.id || !user.email || !user.displayName) {
          issues.push('Invalid user data');
        }
      }

      // Validate user settings
      const settings = await BaseStorage.get<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
      if (settings) {
        if (!settings.language || !['en', 'de', 'es'].includes(settings.language)) {
          issues.push('Invalid user settings: language');
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
      };
    } catch (error) {
      issues.push(`Validation error: ${error}`);
      return {
        isValid: false,
        issues,
      };
    }
  }

  // Clean up orphaned data
  async cleanupOrphanedData(): Promise<{ cleaned: number; issues: string[] }> {
    const issues: string[] = [];
    let cleaned = 0;

    try {
      // Get all data
      const [habits, completions, goals, progress] = await Promise.all([
        BaseStorage.get<Habit[]>(STORAGE_KEYS.HABITS),
        BaseStorage.get<HabitCompletion[]>(STORAGE_KEYS.HABIT_COMPLETIONS),
        BaseStorage.get<Goal[]>(STORAGE_KEYS.GOALS),
        BaseStorage.get<GoalProgress[]>(STORAGE_KEYS.GOAL_PROGRESS),
      ]);

      // Clean up orphaned habit completions
      if (completions && habits) {
        const habitIds = new Set(habits.map(h => h.id));
        const validCompletions = completions.filter(completion => {
          const isValid = habitIds.has(completion.habitId);
          if (!isValid) {
            cleaned++;
            issues.push(`Removed orphaned habit completion: ${completion.id}`);
          }
          return isValid;
        });

        if (validCompletions.length !== completions.length) {
          await BaseStorage.set(STORAGE_KEYS.HABIT_COMPLETIONS, validCompletions);
        }
      }

      // Clean up orphaned goal progress
      if (progress && goals) {
        const goalIds = new Set(goals.map(g => g.id));
        const validProgress = progress.filter(entry => {
          const isValid = goalIds.has(entry.goalId);
          if (!isValid) {
            cleaned++;
            issues.push(`Removed orphaned goal progress: ${entry.id}`);
          }
          return isValid;
        });

        if (validProgress.length !== progress.length) {
          await BaseStorage.set(STORAGE_KEYS.GOAL_PROGRESS, validProgress);
        }
      }

      return { cleaned, issues };
    } catch (error) {
      issues.push(`Cleanup error: ${error}`);
      return { cleaned, issues };
    }
  }

  // Get migration history (from backup keys)
  async getMigrationHistory(): Promise<{ version: number; timestamp: string; backupKey: string }[]> {
    try {
      const allKeys = await BaseStorage.getAllKeys();
      const backupKeys = allKeys.filter(key => key.startsWith('backup_'));
      
      const history: { version: number; timestamp: string; backupKey: string }[] = [];

      for (const key of backupKeys) {
        try {
          const backupData = await BaseStorage.get<string>(key);
          if (backupData) {
            const backup = JSON.parse(backupData);
            history.push({
              version: backup.version || 0,
              timestamp: backup.timestamp,
              backupKey: key,
            });
          }
        } catch (error) {
          console.warn(`Failed to parse backup ${key}:`, error);
        }
      }

      return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get migration history:', error);
      return [];
    }
  }

  // Clean up old backups (keep only last 5)
  async cleanupOldBackups(): Promise<number> {
    try {
      const history = await this.getMigrationHistory();
      
      if (history.length <= 5) {
        return 0;
      }

      const toDelete = history.slice(5);
      const keysToDelete = toDelete.map(h => h.backupKey);
      
      await BaseStorage.multiRemove(keysToDelete);
      
      return keysToDelete.length;
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      return 0;
    }
  }
}

// Singleton instance
export const dataMigration = new DataMigration();