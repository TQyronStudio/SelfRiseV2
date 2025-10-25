/**
 * Phase 3.3.1: Progress Tracking Migration
 *
 * Migrates daily snapshots and weekly breakdowns from AsyncStorage to SQLite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface DailyProgressSnapshot {
  date: string; // DateString "YYYY-MM-DD"
  challengeId: string;
  snapshot: {
    habits_completed: number;
    journal_entries: number;
    goal_progress_updates: number;
    xp_earned_today: number;
    balance_score: number;
  };
  calculatedAt: Date | string;
}

interface WeeklyProgressData {
  weekNumber: 1 | 2 | 3 | 4 | 5;
  startDate: string;
  endDate: string;
  progress: number;
  targetAchieved: boolean;
  daysActive: number;
  contributions: Record<string, number>;
}

// ========================================
// MIGRATION FUNCTIONS
// ========================================

/**
 * Migrate daily snapshots from AsyncStorage to SQLite
 * Source: 'monthly_challenge_daily_snapshots' key
 * Target: challenge_daily_snapshots table
 */
async function migrateDailySnapshots(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  console.log('🔄 Migrating daily snapshots...');

  const stored = await AsyncStorage.getItem('monthly_challenge_daily_snapshots');
  const snapshots: DailyProgressSnapshot[] = stored ? JSON.parse(stored) : [];

  console.log(`📊 Found ${snapshots.length} daily snapshots in AsyncStorage`);

  if (snapshots.length === 0) {
    console.log('ℹ️  No daily snapshots to migrate');
    return 0;
  }

  await db.execAsync('BEGIN TRANSACTION');

  try {
    for (const snapshot of snapshots) {
      const calculatedAtTime = snapshot.calculatedAt instanceof Date
        ? snapshot.calculatedAt.getTime()
        : new Date(snapshot.calculatedAt).getTime();

      await db.runAsync(
        `INSERT INTO challenge_daily_snapshots (
          id, challenge_id, date,
          habits_completed, journal_entries, goal_progress_updates,
          xp_earned_today, balance_score, calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `${snapshot.challengeId}_${snapshot.date}`,
          snapshot.challengeId,
          snapshot.date,
          snapshot.snapshot.habits_completed || 0,
          snapshot.snapshot.journal_entries || 0,
          snapshot.snapshot.goal_progress_updates || 0,
          snapshot.snapshot.xp_earned_today || 0,
          snapshot.snapshot.balance_score || 0,
          calculatedAtTime
        ]
      );

      console.log(`   ✅ Snapshot: ${snapshot.date} (challenge: ${snapshot.challengeId.substring(0, 8)}...)`);
    }

    await db.execAsync('COMMIT');
    console.log(`✅ Migrated ${snapshots.length} daily snapshots`);

    return snapshots.length;

  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error('❌ Daily snapshots migration failed:', error);
    throw new Error(`Daily snapshots migration failed: ${error}`);
  }
}

/**
 * Migrate weekly breakdowns from AsyncStorage to SQLite
 * Source: 'monthly_challenge_weekly_breakdown_{challengeId}_week{N}' keys
 * Target: challenge_weekly_breakdown table
 */
async function migrateWeeklyBreakdowns(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  console.log('🔄 Migrating weekly breakdowns...');

  const allKeys = await AsyncStorage.getAllKeys();
  const weeklyKeys = allKeys.filter(k => k.startsWith('monthly_challenge_weekly_breakdown_'));

  console.log(`📊 Found ${weeklyKeys.length} weekly breakdown keys in AsyncStorage`);

  if (weeklyKeys.length === 0) {
    console.log('ℹ️  No weekly breakdowns to migrate');
    return 0;
  }

  await db.execAsync('BEGIN TRANSACTION');

  try {
    for (const key of weeklyKeys) {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) {
        console.log(`   ⚠️  Empty key: ${key}`);
        continue;
      }

      const breakdown: WeeklyProgressData = JSON.parse(stored);

      // Extract challengeId and weekNumber from key
      // Format: monthly_challenge_weekly_breakdown_{challengeId}_week{N}
      const match = key.match(/monthly_challenge_weekly_breakdown_(.+)_week(\d+)/);
      if (!match) {
        console.log(`   ⚠️  Invalid key format: ${key}`);
        continue;
      }

      const [, challengeId, weekNum] = match;

      await db.runAsync(
        `INSERT INTO challenge_weekly_breakdown (
          id, challenge_id, week_number, start_date, end_date,
          progress, target_achieved, days_active, contributions, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `${challengeId}_week${weekNum}`,
          challengeId,
          parseInt(weekNum, 10),
          breakdown.startDate,
          breakdown.endDate,
          breakdown.progress || 0,
          breakdown.targetAchieved ? 1 : 0,
          breakdown.daysActive || 0,
          JSON.stringify(breakdown.contributions || {}),
          Date.now()
        ]
      );

      console.log(`   ✅ Week ${weekNum}: ${breakdown.progress}% (challenge: ${challengeId.substring(0, 8)}...)`);
    }

    await db.execAsync('COMMIT');
    console.log(`✅ Migrated ${weeklyKeys.length} weekly breakdowns`);

    return weeklyKeys.length;

  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error('❌ Weekly breakdowns migration failed:', error);
    throw new Error(`Weekly breakdowns migration failed: ${error}`);
  }
}

// ========================================
// MAIN MIGRATION FUNCTION
// ========================================

/**
 * Phase 3.3.1: Progress Tracking Migration
 *
 * Migrates daily snapshots and weekly breakdowns to SQLite
 */
export async function migrateProgressTracking331ToSQLite(): Promise<{
  success: boolean;
  summary: {
    dailySnapshots: number;
    weeklyBreakdowns: number;
  };
  errors: string[];
}> {
  console.log('🚀 Starting Phase 3.3.1: Progress Tracking Migration...\n');

  const errors: string[] = [];

  try {
    const { getDatabase } = await import('../init');
    const db = getDatabase();

    // Migrate daily snapshots
    const dailySnapshots = await migrateDailySnapshots(db);

    // Migrate weekly breakdowns
    const weeklyBreakdowns = await migrateWeeklyBreakdowns(db);

    console.log('\n✅ PHASE 3.3.1 MIGRATION COMPLETE!');
    console.log(`📊 Summary:`);
    console.log(`   Daily Snapshots: ${dailySnapshots}`);
    console.log(`   Weekly Breakdowns: ${weeklyBreakdowns}`);

    return {
      success: true,
      summary: {
        dailySnapshots,
        weeklyBreakdowns
      },
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n❌ PHASE 3.3.1 MIGRATION FAILED:', errorMessage);
    errors.push(errorMessage);

    return {
      success: false,
      summary: {
        dailySnapshots: 0,
        weeklyBreakdowns: 0
      },
      errors
    };
  }
}
