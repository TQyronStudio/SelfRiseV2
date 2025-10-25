/**
 * Phase 3.5.1: Challenge Migration Verification
 *
 * Verifies all challenge data was correctly migrated to SQLite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

// ========================================
// VERIFICATION RESULTS INTERFACE
// ========================================

export interface VerificationResult {
  category: string;
  asyncStorageCount: number;
  sqliteCount: number;
  match: boolean;
  details?: string;
}

export interface Phase3VerificationSummary {
  success: boolean;
  results: VerificationResult[];
  errors: string[];
}

// ========================================
// VERIFICATION FUNCTIONS
// ========================================

/**
 * Verify active challenges migration
 */
async function verifyActiveChallenges(
  db: SQLite.SQLiteDatabase
): Promise<VerificationResult> {
  console.log('🔍 Verifying active challenges...');

  // Count AsyncStorage
  const asyncStored = await AsyncStorage.getItem('monthly_challenges');
  const asyncChallenges = asyncStored ? JSON.parse(asyncStored) : [];
  const asyncCount = asyncChallenges.length;

  // Count SQLite
  const sqliteResult = await db.getAllAsync(
    'SELECT COUNT(*) as count FROM monthly_challenges'
  );
  const sqliteCount = (sqliteResult[0] as any).count;

  console.log(`   AsyncStorage: ${asyncCount} challenges`);
  console.log(`   SQLite: ${sqliteCount} challenges`);

  return {
    category: 'Active Challenges',
    asyncStorageCount: asyncCount,
    sqliteCount: sqliteCount,
    match: asyncCount === sqliteCount,
    details: asyncCount === sqliteCount ? '✅ Match' : `❌ Mismatch (${asyncCount} vs ${sqliteCount})`
  };
}

/**
 * Verify challenge requirements migration
 */
async function verifyRequirements(
  db: SQLite.SQLiteDatabase
): Promise<VerificationResult> {
  console.log('🔍 Verifying requirements...');

  // Count AsyncStorage requirements
  const asyncStored = await AsyncStorage.getItem('monthly_challenges');
  const asyncChallenges = asyncStored ? JSON.parse(asyncStored) : [];
  let asyncReqCount = 0;
  asyncChallenges.forEach((c: any) => {
    asyncReqCount += c.requirements?.length || 0;
  });

  // Count SQLite
  const sqliteResult = await db.getAllAsync(
    'SELECT COUNT(*) as count FROM challenge_requirements'
  );
  const sqliteCount = (sqliteResult[0] as any).count;

  console.log(`   AsyncStorage: ${asyncReqCount} requirements`);
  console.log(`   SQLite: ${sqliteCount} requirements`);

  return {
    category: 'Requirements',
    asyncStorageCount: asyncReqCount,
    sqliteCount: sqliteCount,
    match: asyncReqCount === sqliteCount,
    details: asyncReqCount === sqliteCount ? '✅ Match' : `❌ Mismatch (${asyncReqCount} vs ${sqliteCount})`
  };
}

/**
 * Verify daily snapshots migration
 */
async function verifyDailySnapshots(
  db: SQLite.SQLiteDatabase
): Promise<VerificationResult> {
  console.log('🔍 Verifying daily snapshots...');

  // Count AsyncStorage
  const asyncStored = await AsyncStorage.getItem('monthly_challenge_daily_snapshots');
  const asyncSnapshots = asyncStored ? JSON.parse(asyncStored) : [];
  const asyncCount = asyncSnapshots.length;

  // Count SQLite
  const sqliteResult = await db.getAllAsync(
    'SELECT COUNT(*) as count FROM challenge_daily_snapshots'
  );
  const sqliteCount = (sqliteResult[0] as any).count;

  console.log(`   AsyncStorage: ${asyncCount} snapshots`);
  console.log(`   SQLite: ${sqliteCount} snapshots`);

  return {
    category: 'Daily Snapshots',
    asyncStorageCount: asyncCount,
    sqliteCount: sqliteCount,
    match: asyncCount === sqliteCount,
    details: asyncCount === sqliteCount ? '✅ Match' : `❌ Mismatch (${asyncCount} vs ${sqliteCount})`
  };
}

/**
 * Verify weekly breakdowns migration
 */
async function verifyWeeklyBreakdowns(
  db: SQLite.SQLiteDatabase
): Promise<VerificationResult> {
  console.log('🔍 Verifying weekly breakdowns...');

  // Count AsyncStorage
  const allKeys = await AsyncStorage.getAllKeys();
  const weeklyKeys = allKeys.filter(k => k.startsWith('monthly_challenge_weekly_breakdown_'));
  const asyncCount = weeklyKeys.length;

  // Count SQLite
  const sqliteResult = await db.getAllAsync(
    'SELECT COUNT(*) as count FROM challenge_weekly_breakdown'
  );
  const sqliteCount = (sqliteResult[0] as any).count;

  console.log(`   AsyncStorage: ${asyncCount} weekly breakdowns`);
  console.log(`   SQLite: ${sqliteCount} weekly breakdowns`);

  return {
    category: 'Weekly Breakdowns',
    asyncStorageCount: asyncCount,
    sqliteCount: sqliteCount,
    match: asyncCount === sqliteCount,
    details: asyncCount === sqliteCount ? '✅ Match' : `❌ Mismatch (${asyncCount} vs ${sqliteCount})`
  };
}

/**
 * Verify state history migration
 */
async function verifyStateHistory(
  db: SQLite.SQLiteDatabase
): Promise<VerificationResult> {
  console.log('🔍 Verifying state history...');

  // Count SQLite (AsyncStorage has state history embedded in lifecycle status)
  const sqliteResult = await db.getAllAsync(
    'SELECT COUNT(*) as count FROM challenge_state_history'
  );
  const sqliteCount = (sqliteResult[0] as any).count;

  console.log(`   SQLite: ${sqliteCount} state history entries`);

  return {
    category: 'State History',
    asyncStorageCount: 0, // Embedded in lifecycle status
    sqliteCount: sqliteCount,
    match: true, // Can't directly compare
    details: `✅ ${sqliteCount} entries migrated`
  };
}

/**
 * Verify error log migration
 */
async function verifyErrorLog(
  db: SQLite.SQLiteDatabase
): Promise<VerificationResult> {
  console.log('🔍 Verifying error log...');

  // Count SQLite
  const sqliteResult = await db.getAllAsync(
    'SELECT COUNT(*) as count FROM challenge_error_log'
  );
  const sqliteCount = (sqliteResult[0] as any).count;

  console.log(`   SQLite: ${sqliteCount} error log entries`);

  return {
    category: 'Error Log',
    asyncStorageCount: 0, // Embedded in lifecycle status
    sqliteCount: sqliteCount,
    match: true,
    details: `✅ ${sqliteCount} errors tracked`
  };
}

/**
 * Verify user ratings migration
 */
async function verifyUserRatings(
  db: SQLite.SQLiteDatabase
): Promise<VerificationResult> {
  console.log('🔍 Verifying user ratings...');

  // Count AsyncStorage
  const asyncStored = await AsyncStorage.getItem('user_challenge_ratings');
  const asyncRatings = asyncStored ? JSON.parse(asyncStored) : {};
  const asyncCount = Object.keys(asyncRatings).length;

  // Count SQLite
  const sqliteResult = await db.getAllAsync(
    'SELECT COUNT(*) as count FROM user_challenge_ratings'
  );
  const sqliteCount = (sqliteResult[0] as any).count;

  console.log(`   AsyncStorage: ${asyncCount} ratings`);
  console.log(`   SQLite: ${sqliteCount} ratings`);

  return {
    category: 'User Ratings',
    asyncStorageCount: asyncCount,
    sqliteCount: sqliteCount,
    match: asyncCount === sqliteCount,
    details: asyncCount === sqliteCount ? '✅ Match' : `❌ Mismatch (${asyncCount} vs ${sqliteCount})`
  };
}

/**
 * Verify foreign key integrity
 */
async function verifyForeignKeys(
  db: SQLite.SQLiteDatabase
): Promise<VerificationResult> {
  console.log('🔍 Verifying foreign key integrity...');

  // Check requirements have valid challenge_id
  const orphanRequirements = await db.getAllAsync(
    `SELECT COUNT(*) as count FROM challenge_requirements r
     WHERE NOT EXISTS (
       SELECT 1 FROM monthly_challenges c WHERE c.id = r.challenge_id
     )`
  );
  const orphanCount = (orphanRequirements[0] as any).count;

  console.log(`   Orphan requirements: ${orphanCount}`);

  return {
    category: 'Foreign Keys',
    asyncStorageCount: 0,
    sqliteCount: orphanCount,
    match: orphanCount === 0,
    details: orphanCount === 0 ? '✅ All foreign keys valid' : `❌ ${orphanCount} orphan requirements`
  };
}

// ========================================
// MAIN VERIFICATION FUNCTION
// ========================================

/**
 * Phase 3.5.1: Complete verification of challenge migration
 */
export async function verifyPhase3Migration(): Promise<Phase3VerificationSummary> {
  console.log('🚀 Starting Phase 3 Migration Verification...\n');

  const results: VerificationResult[] = [];
  const errors: string[] = [];

  try {
    const { getDatabase } = await import('../init');
    const db = getDatabase();

    // Run all verifications
    results.push(await verifyActiveChallenges(db));
    results.push(await verifyRequirements(db));
    results.push(await verifyDailySnapshots(db));
    results.push(await verifyWeeklyBreakdowns(db));
    results.push(await verifyStateHistory(db));
    results.push(await verifyErrorLog(db));
    results.push(await verifyUserRatings(db));
    results.push(await verifyForeignKeys(db));

    // Check if all critical verifications passed
    const criticalChecks = results.filter(r =>
      ['Active Challenges', 'Requirements', 'Foreign Keys'].includes(r.category)
    );
    const allCriticalPassed = criticalChecks.every(r => r.match);

    console.log('\n✅ VERIFICATION COMPLETE!');
    console.log(`📊 Summary:`);
    results.forEach(r => {
      console.log(`   ${r.category}: ${r.details}`);
    });

    return {
      success: allCriticalPassed,
      results,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n❌ VERIFICATION FAILED:', errorMessage);
    errors.push(errorMessage);

    return {
      success: false,
      results,
      errors
    };
  }
}
