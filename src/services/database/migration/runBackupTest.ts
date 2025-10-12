/**
 * ========================================
 * RUN BACKUP TEST IN APP
 * ========================================
 *
 * Import and call this function from your app to test backup
 * Example: Add a button in dev menu that calls runBackupTest()
 */

import { testJournalBackup, checkBackupStatus } from './testJournalBackup';

/**
 * Run backup test
 * Call this from app to test Phase 1.1.1
 */
export async function runBackupTest(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log('');
    console.log('🚀 Starting backup test from app...');
    console.log('');

    await testJournalBackup();

    return {
      success: true,
      message: 'Backup test passed! Ready for migration.',
    };

  } catch (error) {
    console.error('❌ Backup test failed:', error);

    return {
      success: false,
      message: `Backup test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Quick status check
 * Call this to check if backup exists and is valid
 */
export async function checkBackup(): Promise<{
  exists: boolean;
  valid: boolean;
  message: string;
}> {
  try {
    await checkBackupStatus();

    return {
      exists: true,
      valid: true,
      message: 'Backup is valid',
    };

  } catch (error) {
    return {
      exists: false,
      valid: false,
      message: `Backup check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Create backup only (without full test)
 * Use this when you just want to create backup
 */
export async function createBackupOnly(): Promise<{
  success: boolean;
  message: string;
  entriesCount?: number;
}> {
  try {
    const { createJournalBackup } = await import('./journalBackup');

    console.log('📦 Creating journal backup...');
    const backup = await createJournalBackup();

    return {
      success: true,
      message: `Backup created: ${backup.entriesCount} entries`,
      entriesCount: backup.entriesCount,
    };

  } catch (error) {
    return {
      success: false,
      message: `Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
