/**
 * Diagnostic tool to analyze backup data structure
 */

import { getJournalBackup } from './journalBackup';
import { BaseStorage, STORAGE_KEYS } from '../../storage/base';
import { Gratitude, GratitudeStreak } from '../../../types/gratitude';

export async function diagnoseBackup(): Promise<void> {
  console.log('========================================');
  console.log('BACKUP DIAGNOSTIC ANALYSIS');
  console.log('========================================');

  try {
    // First check raw AsyncStorage data
    console.log('\n🔍 STEP 1: Checking RAW AsyncStorage data...\n');

    const rawEntries = await BaseStorage.get<Gratitude[]>(STORAGE_KEYS.GRATITUDES);
    const rawStreak = await BaseStorage.get<GratitudeStreak>(STORAGE_KEYS.GRATITUDE_STREAK);

    console.log(`Raw entries count: ${rawEntries?.length || 0}`);
    if (rawEntries && rawEntries.length > 0) {
      console.log('First 3 raw entries:');
      for (let i = 0; i < Math.min(3, rawEntries.length); i++) {
        console.log(`  Entry ${i + 1}:`, JSON.stringify(rawEntries[i], null, 2));
      }
    }

    console.log(`\nRaw streak: ${rawStreak ? 'EXISTS' : 'NULL'}`);
    if (rawStreak) {
      console.log(`  Current streak: ${rawStreak.currentStreak}`);
      console.log(`  Warm-up payments: ${rawStreak.warmUpPayments?.length || 0}`);
      if (rawStreak.warmUpPayments && rawStreak.warmUpPayments.length > 0) {
        console.log('  First payment:', JSON.stringify(rawStreak.warmUpPayments[0], null, 2));
      }
    }

    console.log('\n🔍 STEP 2: Checking BACKUP data...\n');

    const backup = await getJournalBackup();

    if (!backup) {
      console.log('❌ No backup found');
      return;
    }

    console.log(`\n📦 Backup Info:`);
    console.log(`   Version: ${backup.version}`);
    console.log(`   Timestamp: ${new Date(backup.timestamp).toISOString()}`);
    console.log(`   Entries count: ${backup.entriesCount}`);
    console.log(`   Verified: ${backup.verified}`);

    // Analyze first 5 entries
    console.log(`\n📝 First 5 Entries Analysis:`);
    for (let i = 0; i < Math.min(5, backup.entries.length); i++) {
      const entry = backup.entries[i];
      console.log(`\n   Entry ${i + 1}:`);
      console.log(`      id: ${entry.id}`);
      console.log(`      text: "${entry.text}" (type: ${typeof entry.text}, length: ${entry.text?.length || 0})`);
      console.log(`      type: ${entry.type}`);
      console.log(`      date: ${entry.date}`);
      console.log(`      gratitudeNumber: ${entry.gratitudeNumber}`);
      console.log(`      createdAt: ${entry.createdAt}`);
      console.log(`      updatedAt: ${entry.updatedAt}`);
    }

    // Count entries by validation status
    let validCount = 0;
    let invalidCount = 0;
    const invalidReasons: { [key: string]: number } = {};

    for (const entry of backup.entries) {
      if (!entry.text) {
        invalidCount++;
        invalidReasons['text is null/undefined'] = (invalidReasons['text is null/undefined'] || 0) + 1;
      } else if (typeof entry.text !== 'string') {
        invalidCount++;
        invalidReasons['text is not a string'] = (invalidReasons['text is not a string'] || 0) + 1;
      } else if (entry.text.trim() === '') {
        invalidCount++;
        invalidReasons['text is empty string'] = (invalidReasons['text is empty string'] || 0) + 1;
      } else {
        validCount++;
      }
    }

    console.log(`\n📊 Validation Summary:`);
    console.log(`   Valid entries: ${validCount}`);
    console.log(`   Invalid entries: ${invalidCount}`);

    if (invalidCount > 0) {
      console.log(`\n   Invalid reasons breakdown:`);
      for (const [reason, count] of Object.entries(invalidReasons)) {
        console.log(`      - ${reason}: ${count}`);
      }
    }

    // Analyze streak data
    if (backup.streak) {
      console.log(`\n⚡ Streak Data:`);
      console.log(`   Current streak: ${backup.streak.currentStreak}`);
      console.log(`   Longest streak: ${backup.streak.longestStreak}`);
      console.log(`   Last entry date: ${backup.streak.lastEntryDate}`);
      console.log(`   Frozen days: ${backup.streak.frozenDays}`);
      console.log(`   Is frozen: ${backup.streak.isFrozen}`);

      if (backup.streak.warmUpPayments) {
        console.log(`\n💳 Warm-up Payments (${backup.streak.warmUpPayments.length}):`);

        let validPayments = 0;
        let invalidPayments = 0;

        for (const payment of backup.streak.warmUpPayments) {
          if (!payment.id || !payment.missedDate || !payment.paidAt) {
            invalidPayments++;
            console.log(`   ❌ Invalid: id=${payment.id}, missedDate=${payment.missedDate}, paidAt=${payment.paidAt}`);
          } else {
            validPayments++;
          }
        }

        console.log(`   Valid payments: ${validPayments}`);
        console.log(`   Invalid payments: ${invalidPayments}`);
      }
    }

    console.log('\n========================================');
    console.log('DIAGNOSTIC COMPLETE');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}
