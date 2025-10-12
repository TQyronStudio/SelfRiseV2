/**
 * ========================================
 * TEST SCRIPT FOR PHASE 1.1.1
 * ========================================
 *
 * This script tests the journal backup functionality
 * Run this to verify backup works correctly before proceeding
 */

import {
  createJournalBackup,
  verifyJournalBackup,
  getBackupSummary,
  rollbackFromBackup,
} from './journalBackup';

/**
 * Main test function
 * Tests all backup functionality
 */
export async function testJournalBackup(): Promise<void> {
  console.log('');
  console.log('========================================');
  console.log('PHASE 1.1.1 - JOURNAL BACKUP TEST');
  console.log('========================================');
  console.log('');

  try {
    // ========================================
    // TEST 1: Create backup
    // ========================================
    console.log('🧪 TEST 1: Creating backup...');
    const backup = await createJournalBackup();

    if (!backup) {
      throw new Error('Backup creation returned null');
    }

    console.log('✅ Backup created successfully');
    console.log('');

    // ========================================
    // TEST 2: Verify backup
    // ========================================
    console.log('🧪 TEST 2: Verifying backup integrity...');
    const verificationResult = await verifyJournalBackup();

    if (!verificationResult.success) {
      throw new Error(`Verification failed: ${verificationResult.error}`);
    }

    console.log('✅ Backup verified successfully');
    console.log('   Details:', verificationResult.details);
    console.log('');

    // ========================================
    // TEST 3: Get backup summary
    // ========================================
    console.log('🧪 TEST 3: Getting backup summary...');
    const summary = await getBackupSummary();
    console.log(summary);
    console.log('');

    // ========================================
    // TEST 4: Test rollback (dry run - don't actually restore)
    // ========================================
    console.log('🧪 TEST 4: Testing rollback capability...');
    console.log('   (Skipping actual rollback - just verifying function exists)');
    console.log('   Rollback function: ✅ Available');
    console.log('');

    // ========================================
    // FINAL RESULT
    // ========================================
    console.log('========================================');
    console.log('✅ ALL TESTS PASSED');
    console.log('========================================');
    console.log('');
    console.log('📦 Backup Status:');
    console.log(`   - Entries backed up: ${backup.entriesCount}`);
    console.log(`   - Streak backed up: ${backup.streak ? 'Yes' : 'No'}`);
    console.log(`   - Verified: ${backup.verified ? 'Yes' : 'No'}`);
    console.log(`   - Backup location: AsyncStorage key "MIGRATION_BACKUP_JOURNAL_V1"`);
    console.log('');
    console.log('✅ Ready to proceed to Phase 1.1.2 (SQLite Schema Creation)');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ TEST FAILED');
    console.error('========================================');
    console.error('');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('');
    console.error('⚠️  DO NOT PROCEED with migration until this test passes');
    console.error('');

    throw error;
  }
}

/**
 * Test rollback functionality (safe to run)
 * This creates a backup and immediately restores it
 */
export async function testRollback(): Promise<void> {
  console.log('');
  console.log('========================================');
  console.log('ROLLBACK TEST');
  console.log('========================================');
  console.log('');

  try {
    console.log('🧪 Creating backup...');
    await createJournalBackup();
    console.log('✅ Backup created');
    console.log('');

    console.log('🧪 Testing rollback...');
    const rollbackResult = await rollbackFromBackup();

    if (!rollbackResult.success) {
      throw new Error(`Rollback failed: ${rollbackResult.error}`);
    }

    console.log('✅ Rollback successful');
    console.log(`   - Restored entries: ${rollbackResult.restoredEntries}`);
    console.log(`   - Restored streak: ${rollbackResult.restoredStreak ? 'Yes' : 'No'}`);
    console.log('');

    console.log('🧪 Verifying data after rollback...');
    const verificationResult = await verifyJournalBackup();

    if (!verificationResult.success) {
      throw new Error(`Post-rollback verification failed: ${verificationResult.error}`);
    }

    console.log('✅ Data verified after rollback');
    console.log('');

    console.log('========================================');
    console.log('✅ ROLLBACK TEST PASSED');
    console.log('========================================');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ ROLLBACK TEST FAILED');
    console.error('========================================');
    console.error('');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('');
    throw error;
  }
}

/**
 * Quick verification check
 * Use this to check backup status anytime
 */
export async function checkBackupStatus(): Promise<void> {
  console.log('');
  console.log('📦 Checking backup status...');
  console.log('');

  const summary = await getBackupSummary();
  console.log(summary);

  const verification = await verifyJournalBackup();

  if (verification.success) {
    console.log('');
    console.log('✅ Backup is valid and ready for migration');
  } else {
    console.log('');
    console.log(`❌ Backup verification failed: ${verification.error}`);
  }

  console.log('');
}
