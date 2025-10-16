// Main storage service exports
export * from './base';

// Storage classes (avoid * export to prevent conflicts)
export { HabitStorage, habitStorage } from './habitStorage';
export { GratitudeStorage, gratitudeStorage } from './gratitudeStorage';
export { GoalStorage, goalStorage } from './goalStorage';
export { UserStorage, userStorage } from './userStorage';
export { DataMigration, dataMigration } from './migration';
export { DataBackup, dataBackup } from './backup';

// SQLite storage services
export { SQLiteGratitudeStorage, sqliteGratitudeStorage } from './SQLiteGratitudeStorage';

// Storage service initialization
import { dataMigration } from './migration';
import { dataBackup } from './backup';
import { userStorage } from './userStorage';

export class StorageService {
  private static instance: StorageService;
  private initialized = false;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Initialize storage service
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if migration is needed
      const needsMigration = await dataMigration.isMigrationNeeded();
      if (needsMigration) {
        console.log('Running data migration...');
        const result = await dataMigration.migrate();
        if (!result.success) {
          throw new Error(`Migration failed: ${result.errors.join(', ')}`);
        }
        console.log('Data migration completed successfully');
      }

      // Validate data integrity
      const integrity = await dataMigration.validateDataIntegrity();
      if (!integrity.isValid) {
        console.warn('Data integrity issues found:', integrity.issues);
        
        // Attempt to clean up orphaned data
        const cleanup = await dataMigration.cleanupOrphanedData();
        if (cleanup.cleaned > 0) {
          console.log(`Cleaned up ${cleanup.cleaned} orphaned records`);
        }
      }

      // Initialize auto backup if enabled
      const settings = await userStorage.getSettings();
      if (settings.dataBackupEnabled) {
        // Create initial auto backup
        await dataBackup.createAutoBackup();
        console.log('Auto backup initialized');
      }

      this.initialized = true;
      console.log('Storage service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw error;
    }
  }

  // Get initialization status
  isInitialized(): boolean {
    return this.initialized;
  }

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    try {
      await dataMigration.clearAllData();
      this.initialized = false;
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    usage: Awaited<ReturnType<typeof dataBackup.getStorageUsage>>;
    integrity: Awaited<ReturnType<typeof dataMigration.validateDataIntegrity>>;
    backups: Awaited<ReturnType<typeof dataBackup.getAutoBackups>>;
  }> {
    try {
      const [usage, integrity, backups] = await Promise.all([
        dataBackup.getStorageUsage(),
        dataMigration.validateDataIntegrity(),
        dataBackup.getAutoBackups(),
      ]);

      return { usage, integrity, backups };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    details: {
      initialized: boolean;
      dataIntegrity: boolean;
      migrationUpToDate: boolean;
      totalRecords: number;
      storageSize: number;
    };
  }> {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'error' = 'healthy';

    try {
      // Check initialization
      if (!this.initialized) {
        issues.push('Storage service not initialized');
        status = 'error';
      }

      // Check data integrity
      const integrity = await dataMigration.validateDataIntegrity();
      if (!integrity.isValid) {
        issues.push(`Data integrity issues: ${integrity.issues.join(', ')}`);
        status = integrity.issues.length > 5 ? 'error' : 'warning';
      }

      // Check migration status
      const needsMigration = await dataMigration.isMigrationNeeded();
      if (needsMigration) {
        issues.push('Data migration required');
        status = 'warning';
      }

      // Get storage stats
      const storageStats = await dataBackup.getStorageUsage();
      const totalRecords = Object.values(storageStats.byType).reduce(
        (sum, size) => sum + size, 0
      );

      return {
        status,
        issues,
        details: {
          initialized: this.initialized,
          dataIntegrity: integrity.isValid,
          migrationUpToDate: !needsMigration,
          totalRecords,
          storageSize: storageStats.total,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        issues: [`Health check failed: ${error}`],
        details: {
          initialized: false,
          dataIntegrity: false,
          migrationUpToDate: false,
          totalRecords: 0,
          storageSize: 0,
        },
      };
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();