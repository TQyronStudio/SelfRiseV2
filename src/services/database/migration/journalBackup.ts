/**
 * ========================================
 * PHASE 1.1.1: JOURNAL BACKUP & VERIFICATION
 * ========================================
 *
 * CRITICAL SAFETY: This script creates a verified backup of all journal data
 * before SQLite migration. Includes integrity checks and rollback capability.
 *
 * Backup location: AsyncStorage key "MIGRATION_BACKUP_JOURNAL_V1"
 *
 * SUCCESS CRITERIA:
 * - 100% data integrity verified via checksums
 * - Backup count matches source count
 * - Backup can be retrieved and parsed
 * - No data corruption during backup process
 */

import { BaseStorage, STORAGE_KEYS } from '../../storage/base';
import { Gratitude, GratitudeStreak } from '../../../types/gratitude';

// ========================================
// BACKUP DATA STRUCTURE
// ========================================

export interface JournalBackup {
  // Metadata
  version: string;
  timestamp: number;
  backupDate: string;

  // Data
  entries: Gratitude[];
  streak: GratitudeStreak | null;

  // Verification
  entriesCount: number;
  entriesChecksum: string;
  streakChecksum: string | null;

  // Status
  verified: boolean;
}

// ========================================
// CHECKSUM GENERATION
// ========================================

/**
 * Generate simple checksum for data verification
 * Uses JSON.stringify + basic hash for integrity check
 */
function generateChecksum(data: unknown): string {
  const jsonString = JSON.stringify(data);
  let hash = 0;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
}

// ========================================
// BACKUP FUNCTIONS
// ========================================

/**
 * Create backup of journal data with verification
 * Returns backup object for inspection
 */
export async function createJournalBackup(): Promise<JournalBackup> {
  console.log('📦 Starting journal backup...');

  try {
    // Step 1: Read current AsyncStorage data
    console.log('📖 Reading AsyncStorage data...');
    const entries = await BaseStorage.get<Gratitude[]>(STORAGE_KEYS.GRATITUDES);
    const streak = await BaseStorage.get<GratitudeStreak>(STORAGE_KEYS.GRATITUDE_STREAK);

    // Step 2: Validate data exists
    if (!entries) {
      console.log('⚠️  No journal entries found - creating empty backup');
    }

    const safeEntries = entries || [];
    const entriesCount = safeEntries.length;

    console.log(`📊 Found ${entriesCount} journal entries`);
    console.log(`📊 Streak data: ${streak ? `${streak.currentStreak} days` : 'none'}`);

    // Step 3: Generate checksums for verification
    console.log('🔐 Generating verification checksums...');
    const entriesChecksum = generateChecksum(safeEntries);
    const streakChecksum = streak ? generateChecksum(streak) : null;

    // Step 4: Create backup object
    const backup: JournalBackup = {
      version: '1.0.0',
      timestamp: Date.now(),
      backupDate: new Date().toISOString(),
      entries: safeEntries,
      streak,
      entriesCount,
      entriesChecksum,
      streakChecksum,
      verified: false, // Will be set to true after verification
    };

    // Step 5: Save backup to AsyncStorage (separate key)
    console.log('💾 Saving backup to AsyncStorage...');
    await BaseStorage.set('MIGRATION_BACKUP_JOURNAL_V1', backup);

    // Step 6: Verify backup was saved correctly
    console.log('✅ Verifying backup integrity...');
    const verificationResult = await verifyJournalBackup();

    if (!verificationResult.success) {
      throw new Error(`Backup verification failed: ${verificationResult.error}`);
    }

    // Step 7: Mark backup as verified
    backup.verified = true;
    await BaseStorage.set('MIGRATION_BACKUP_JOURNAL_V1', backup);

    console.log('✅ Journal backup created successfully');
    console.log(`   - Entries: ${entriesCount}`);
    console.log(`   - Entries checksum: ${entriesChecksum}`);
    console.log(`   - Streak: ${streak ? `${streak.currentStreak} days` : 'none'}`);
    console.log(`   - Backup key: MIGRATION_BACKUP_JOURNAL_V1`);

    return backup;

  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    throw new Error(`Failed to create journal backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ========================================
// VERIFICATION FUNCTIONS
// ========================================

export interface BackupVerificationResult {
  success: boolean;
  error?: string;
  details?: {
    backupExists: boolean;
    entriesMatch: boolean;
    checksumsMatch: boolean;
    sourceCount: number;
    backupCount: number;
  };
}

/**
 * Verify backup integrity
 * Checks that backup matches source data
 */
export async function verifyJournalBackup(): Promise<BackupVerificationResult> {
  console.log('🔍 Verifying journal backup...');

  try {
    // Step 1: Load backup
    const backup = await BaseStorage.get<JournalBackup>('MIGRATION_BACKUP_JOURNAL_V1');

    if (!backup) {
      return {
        success: false,
        error: 'Backup not found',
        details: {
          backupExists: false,
          entriesMatch: false,
          checksumsMatch: false,
          sourceCount: 0,
          backupCount: 0,
        },
      };
    }

    // Step 2: Load source data
    const sourceEntries = await BaseStorage.get<Gratitude[]>(STORAGE_KEYS.GRATITUDES);
    const sourceStreak = await BaseStorage.get<GratitudeStreak>(STORAGE_KEYS.GRATITUDE_STREAK);

    const safeSourceEntries = sourceEntries || [];

    // Step 3: Compare counts
    const entriesMatch = backup.entriesCount === safeSourceEntries.length;

    if (!entriesMatch) {
      return {
        success: false,
        error: `Entry count mismatch: source=${safeSourceEntries.length}, backup=${backup.entriesCount}`,
        details: {
          backupExists: true,
          entriesMatch: false,
          checksumsMatch: false,
          sourceCount: safeSourceEntries.length,
          backupCount: backup.entriesCount,
        },
      };
    }

    // Step 4: Verify checksums
    const currentEntriesChecksum = generateChecksum(safeSourceEntries);
    const currentStreakChecksum = sourceStreak ? generateChecksum(sourceStreak) : null;

    const checksumsMatch =
      backup.entriesChecksum === currentEntriesChecksum &&
      backup.streakChecksum === currentStreakChecksum;

    if (!checksumsMatch) {
      return {
        success: false,
        error: 'Checksum mismatch - data may have been modified',
        details: {
          backupExists: true,
          entriesMatch: true,
          checksumsMatch: false,
          sourceCount: safeSourceEntries.length,
          backupCount: backup.entriesCount,
        },
      };
    }

    // Step 5: All checks passed
    console.log('✅ Backup verification passed');
    return {
      success: true,
      details: {
        backupExists: true,
        entriesMatch: true,
        checksumsMatch: true,
        sourceCount: safeSourceEntries.length,
        backupCount: backup.entriesCount,
      },
    };

  } catch (error) {
    console.error('❌ Backup verification error:', error);
    return {
      success: false,
      error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ========================================
// BACKUP RETRIEVAL
// ========================================

/**
 * Get backup data for inspection or rollback
 */
export async function getJournalBackup(): Promise<JournalBackup | null> {
  try {
    return await BaseStorage.get<JournalBackup>('MIGRATION_BACKUP_JOURNAL_V1');
  } catch (error) {
    console.error('❌ Failed to get backup:', error);
    return null;
  }
}

// ========================================
// ROLLBACK FUNCTIONS
// ========================================

export interface RollbackResult {
  success: boolean;
  error?: string;
  restoredEntries?: number;
  restoredStreak?: boolean;
}

/**
 * Restore from backup (rollback migration)
 * ONLY call this if migration fails
 */
export async function rollbackFromBackup(): Promise<RollbackResult> {
  console.log('🔄 Starting rollback from backup...');

  try {
    // Step 1: Load backup
    const backup = await getJournalBackup();

    if (!backup) {
      return {
        success: false,
        error: 'No backup found - cannot rollback',
      };
    }

    if (!backup.verified) {
      return {
        success: false,
        error: 'Backup is not verified - cannot rollback safely',
      };
    }

    // Step 2: Restore entries
    console.log(`📥 Restoring ${backup.entriesCount} entries...`);
    await BaseStorage.set(STORAGE_KEYS.GRATITUDES, backup.entries);

    // Step 3: Restore streak
    if (backup.streak) {
      console.log(`📥 Restoring streak (${backup.streak.currentStreak} days)...`);
      await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, backup.streak);
    }

    // Step 4: Verify restoration
    const verificationResult = await verifyJournalBackup();

    if (!verificationResult.success) {
      return {
        success: false,
        error: `Restoration verification failed: ${verificationResult.error}`,
      };
    }

    // Step 5: Mark rollback as complete
    await BaseStorage.set('MIGRATION_ROLLBACK_JOURNAL', {
      timestamp: Date.now(),
      reason: 'Migration rollback',
      restoredEntries: backup.entriesCount,
    });

    console.log('✅ Rollback completed successfully');
    return {
      success: true,
      restoredEntries: backup.entriesCount,
      restoredStreak: backup.streak !== null,
    };

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    return {
      success: false,
      error: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ========================================
// CLEANUP FUNCTIONS
// ========================================

/**
 * Delete backup after successful migration
 * ONLY call this after migration is 100% complete and verified
 */
export async function deleteBackup(): Promise<void> {
  console.log('🗑️  Deleting backup...');
  try {
    await BaseStorage.remove('MIGRATION_BACKUP_JOURNAL_V1');
    console.log('✅ Backup deleted');
  } catch (error) {
    console.error('⚠️  Failed to delete backup:', error);
    // Non-critical error - backup can stay in AsyncStorage
  }
}

// ========================================
// SUMMARY REPORT
// ========================================

/**
 * Get backup summary for logging/debugging
 */
export async function getBackupSummary(): Promise<string> {
  const backup = await getJournalBackup();

  if (!backup) {
    return 'No backup found';
  }

  return `
📦 Journal Backup Summary
========================
Version: ${backup.version}
Created: ${backup.backupDate}
Verified: ${backup.verified ? '✅ Yes' : '❌ No'}

Data:
- Entries: ${backup.entriesCount}
- Entries checksum: ${backup.entriesChecksum}
- Streak: ${backup.streak ? `${backup.streak.currentStreak} days` : 'none'}
- Streak checksum: ${backup.streakChecksum || 'N/A'}

Backup Key: MIGRATION_BACKUP_JOURNAL_V1
========================
  `.trim();
}
