/**
 * ========================================
 * PHASE 1.1.3 - JOURNAL DATA MIGRATION
 * ========================================
 *
 * Migrates journal entries and streak data from AsyncStorage to SQLite
 * Uses ACID transactions to ensure data integrity
 *
 * CRITICAL: This migration is irreversible once AsyncStorage is cleared
 * Always verify backup exists before running
 */

import { getDatabase } from '../init';
import { getJournalBackup } from './journalBackup';
import type { JournalBackup } from './journalBackup';

export interface MigrationResult {
  success: boolean;
  message: string;
  entriesMigrated: number;
  streakMigrated: boolean;
  paymentsMigrated: number;
  errors: string[];
}

/**
 * Migrates all journal data from AsyncStorage to SQLite
 * Uses single ACID transaction - all or nothing
 */
export async function migrateJournalData(): Promise<MigrationResult> {
  const errors: string[] = [];

  try {
    console.log('========================================');
    console.log('PHASE 1.1.3 - JOURNAL DATA MIGRATION');
    console.log('========================================');

    // 1. Verify backup exists
    console.log('📋 Step 1: Verifying backup...');
    const backup = await getJournalBackup();

    if (!backup) {
      throw new Error('No backup found! Cannot proceed with migration.');
    }

    if (!backup.verified) {
      throw new Error('Backup verification failed! Cannot proceed with migration.');
    }

    console.log(`✅ Backup verified: ${backup.entriesCount} entries, checksum ${backup.entriesChecksum}`);

    // 2. Get database
    console.log('📋 Step 2: Getting SQLite database...');
    const db = getDatabase();
    console.log('✅ Database connection established');

    // 3. Check if already migrated
    console.log('📋 Step 3: Checking if already migrated...');
    const existingCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM journal_entries'
    );

    if (existingCount && existingCount.count > 0) {
      console.log(`⚠️  Database already contains ${existingCount.count} entries`);
      return {
        success: false,
        message: `Database already contains ${existingCount.count} entries. Migration already completed or database not empty.`,
        entriesMigrated: 0,
        streakMigrated: false,
        paymentsMigrated: 0,
        errors: ['Database not empty']
      };
    }

    console.log('✅ Database is empty, proceeding with migration');

    // 4. Migrate data in single transaction
    console.log('📋 Step 4: Starting migration transaction...');

    let entriesMigrated = 0;
    let streakMigrated = false;
    let paymentsMigrated = 0;

    await db.withTransactionAsync(async () => {
      // 4a. Migrate journal entries
      console.log(`📝 Migrating ${backup.entries.length} journal entries...`);

      if (backup.entries.length > 0) {
        const stmt = await db.prepareAsync(
          'INSERT INTO journal_entries (id, text, type, date, gratitude_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );

        let skippedCount = 0;

        for (const entry of backup.entries) {
          // Skip entries with invalid data
          if (!entry.text || typeof entry.text !== 'string' || entry.text.trim() === '') {
            console.log(`⚠️  Skipping invalid entry: id=${entry.id}, text=${entry.text}`);
            skippedCount++;
            continue;
          }

          await stmt.executeAsync([
            entry.id,
            entry.text.trim(), // Ensure no extra whitespace
            entry.type,
            entry.date,
            entry.gratitudeNumber,
            entry.createdAt,
            entry.updatedAt
          ]);
          entriesMigrated++;
        }

        await stmt.finalizeAsync();

        if (skippedCount > 0) {
          console.log(`⚠️  Skipped ${skippedCount} invalid entries`);
        }
        console.log(`✅ Migrated ${entriesMigrated} valid journal entries`);
      }

      // 4b. Migrate streak state
      if (backup.streak) {
        console.log('📝 Migrating streak state...');

        await db.runAsync(
          `UPDATE streak_state SET
            current_streak = ?,
            longest_streak = ?,
            last_entry_date = ?,
            streak_start_date = ?,
            frozen_days = ?,
            is_frozen = ?,
            can_recover_with_ad = ?,
            streak_before_freeze = ?,
            just_unfroze_today = ?,
            star_count = ?,
            flame_count = ?,
            crown_count = ?,
            updated_at = ?
          WHERE id = 1`,
          [
            backup.streak.currentStreak,
            backup.streak.longestStreak,
            backup.streak.lastEntryDate,
            backup.streak.streakStartDate,
            backup.streak.frozenDays,
            backup.streak.isFrozen ? 1 : 0,
            backup.streak.canRecoverWithAd ? 1 : 0,
            backup.streak.streakBeforeFreeze,
            backup.streak.justUnfroze_today ? 1 : 0,
            backup.streak.starCount,
            backup.streak.flameCount,
            backup.streak.crownCount,
            Date.now()
          ]
        );

        streakMigrated = true;
        console.log(`✅ Migrated streak state: ${backup.streak.currentStreak} days`);

        // 4c. Migrate warm-up payments
        if (backup.streak.warmUpPayments && backup.streak.warmUpPayments.length > 0) {
          console.log(`📝 Migrating ${backup.streak.warmUpPayments.length} warm-up payments...`);

          const paymentStmt = await db.prepareAsync(
            'INSERT INTO warm_up_payments (id, missed_date, paid_at, ads_watched) VALUES (?, ?, ?, ?)'
          );

          let skippedPayments = 0;

          for (const payment of backup.streak.warmUpPayments) {
            // Validate payment data
            if (!payment.id || !payment.missedDate || !payment.paidAt) {
              console.log(`⚠️  Skipping invalid payment: id=${payment.id}, missedDate=${payment.missedDate}, paidAt=${payment.paidAt}`);
              skippedPayments++;
              continue;
            }

            await paymentStmt.executeAsync([
              payment.id,
              payment.missedDate,
              payment.paidAt,
              payment.adsWatched || 1
            ]);
            paymentsMigrated++;
          }

          await paymentStmt.finalizeAsync();

          if (skippedPayments > 0) {
            console.log(`⚠️  Skipped ${skippedPayments} invalid payments`);
          }
          console.log(`✅ Migrated ${paymentsMigrated} valid warm-up payments`);
        }
      }
    });

    console.log('✅ Transaction committed successfully');

    // 5. Verify migration
    console.log('📋 Step 5: Verifying migration...');
    const verificationResult = await verifyMigration(backup);

    if (!verificationResult.success) {
      throw new Error(`Migration verification failed: ${verificationResult.errors.join(', ')}`);
    }

    console.log('✅ Migration verification passed');
    console.log('========================================');
    console.log('MIGRATION COMPLETE ✅');
    console.log('========================================');

    return {
      success: true,
      message: `Successfully migrated ${entriesMigrated} entries, streak data, and ${paymentsMigrated} payments`,
      entriesMigrated,
      streakMigrated,
      paymentsMigrated,
      errors: []
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    console.error('❌ Migration failed:', errorMessage);

    return {
      success: false,
      message: `Migration failed: ${errorMessage}`,
      entriesMigrated: 0,
      streakMigrated: false,
      paymentsMigrated: 0,
      errors
    };
  }
}

/**
 * Verifies that migrated data matches backup
 */
async function verifyMigration(backup: JournalBackup): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const db = getDatabase();

  try {
    // 1. Verify entry count
    const entryCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM journal_entries'
    );

    if (!entryCount || entryCount.count !== backup.entriesCount) {
      errors.push(
        `Entry count mismatch: Expected ${backup.entriesCount}, Got ${entryCount?.count || 0}`
      );
    }

    // 2. Verify streak state
    if (backup.streak) {
      const migratedStreak = await db.getFirstAsync<{
        current_streak: number;
        longest_streak: number;
      }>('SELECT current_streak, longest_streak FROM streak_state WHERE id = 1');

      if (!migratedStreak) {
        errors.push('Streak state not found in database');
      } else {
        if (migratedStreak.current_streak !== backup.streak.currentStreak) {
          errors.push(
            `Current streak mismatch: Expected ${backup.streak.currentStreak}, Got ${migratedStreak.current_streak}`
          );
        }
        if (migratedStreak.longest_streak !== backup.streak.longestStreak) {
          errors.push(
            `Longest streak mismatch: Expected ${backup.streak.longestStreak}, Got ${migratedStreak.longest_streak}`
          );
        }
      }

      // 3. Verify warm-up payments
      const paymentCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM warm_up_payments'
      );

      const expectedPayments = backup.streak.warmUpPayments?.length || 0;
      if (!paymentCount || paymentCount.count !== expectedPayments) {
        errors.push(
          `Payment count mismatch: Expected ${expectedPayments}, Got ${paymentCount?.count || 0}`
        );
      }
    }

    if (errors.length > 0) {
      console.error('❌ Verification errors:', errors);
      return { success: false, errors };
    }

    console.log('✅ All verification checks passed');
    return { success: true, errors: [] };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Verification error: ${errorMessage}`);
    return { success: false, errors };
  }
}

/**
 * Gets current migration status
 */
export async function getMigrationStatus(): Promise<{
  isMigrated: boolean;
  entryCount: number;
  hasStreak: boolean;
  paymentCount: number;
}> {
  try {
    const db = getDatabase();

    const entryCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM journal_entries'
    );

    const streak = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM streak_state WHERE id = 1'
    );

    const paymentCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM warm_up_payments'
    );

    return {
      isMigrated: (entryCount?.count || 0) > 0,
      entryCount: entryCount?.count || 0,
      hasStreak: !!streak,
      paymentCount: paymentCount?.count || 0
    };

  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      isMigrated: false,
      entryCount: 0,
      hasStreak: false,
      paymentCount: 0
    };
  }
}
