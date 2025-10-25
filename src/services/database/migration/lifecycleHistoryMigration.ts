/**
 * Phase 3.4.1: Lifecycle & History Migration
 *
 * Migrates lifecycle state, state history, error log, challenge history, and previews
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface ChallengeLifecycleStatus {
  currentState: 'idle' | 'active' | 'preview' | 'completed' | 'transitioning';
  currentChallenge?: {
    id: string;
    month: string;
  } | null;
  previewChallenge?: {
    previewChallenge: {
      id: string;
    };
  } | null;
  lastStateChange: Date | string;
  pendingActions?: any[];
  stateHistory: Array<{
    state: string;
    timestamp: Date | string;
    metadata?: any;
  }>;
  errors: Array<{
    error: string;
    context: string;
    retryAttempt: number;
    timestamp: Date | string;
  }>;
  metrics?: any;
}

interface MonthlyChallenge {
  id: string;
  month: string;
  status: string;
  progress?: number;
  starLevel: number;
  xpAwarded?: number;
  completedAt?: Date | string;
  templateId?: string;
  [key: string]: any;
}

interface ChallengePreviewData {
  month: string;
  generatedAt: Date | string;
  previewChallenge: {
    id: string;
  };
  alternativeOptions: Array<{
    id: string;
  }>;
  userCanChoose: boolean;
  expiresAt: Date | string;
}

// ========================================
// MIGRATION FUNCTIONS
// ========================================

/**
 * Migrate lifecycle state, state history, and error log
 * Source: 'monthly_challenge_status' key
 * Target: challenge_lifecycle_state, challenge_state_history, challenge_error_log tables
 */
async function migrateLifecycleState(
  db: SQLite.SQLiteDatabase
): Promise<{ stateHistory: number; errors: number }> {
  console.log('🔄 Migrating lifecycle state...');

  const stored = await AsyncStorage.getItem('monthly_challenge_status');
  if (!stored) {
    console.log('⚠️  No lifecycle state to migrate');
    return { stateHistory: 0, errors: 0 };
  }

  const status: ChallengeLifecycleStatus = JSON.parse(stored);

  // Determine current month
  const currentMonth = status.currentChallenge?.month || new Date().toISOString().substring(0, 7);

  console.log(`📊 Migrating lifecycle for month: ${currentMonth}`);
  console.log(`📊 Raw currentState value: "${status.currentState}"`);

  // Normalize state to valid values
  // Valid states: 'idle', 'active', 'preview', 'completed', 'transitioning'
  let normalizedState: string = status.currentState;

  // Map common variations to valid states
  const stateMapping: Record<string, string> = {
    'IDLE': 'idle',
    'ACTIVE': 'active',
    'PREVIEW': 'preview',
    'COMPLETED': 'completed',
    'TRANSITIONING': 'transitioning',
    'in-progress': 'active',
    'pending': 'idle',
    'expired': 'completed',
    'failed': 'completed'
  };

  if (stateMapping[normalizedState]) {
    normalizedState = stateMapping[normalizedState];
  }

  // If still invalid, default to 'idle'
  const validStates = ['idle', 'active', 'preview', 'completed', 'transitioning'];
  if (!validStates.includes(normalizedState)) {
    console.log(`⚠️  Invalid state "${status.currentState}" - defaulting to "idle"`);
    normalizedState = 'idle';
  }

  console.log(`✅ Normalized state: "${normalizedState}"`);

  try {
    // Insert main lifecycle state
    await db.runAsync(
      `INSERT OR REPLACE INTO challenge_lifecycle_state (
        month, current_state, current_challenge_id, preview_challenge_id,
        last_state_change, pending_actions, state_history, error_log, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        currentMonth,
        normalizedState,
        status.currentChallenge?.id || null,
        status.previewChallenge?.previewChallenge?.id || null,
        new Date(status.lastStateChange).getTime(),
        JSON.stringify(status.pendingActions || []),
        JSON.stringify(status.stateHistory || []),
        JSON.stringify(status.errors || []),
        Date.now()
      ]
    );

    console.log(`   ✅ Lifecycle state: ${normalizedState}`);

    // Migrate state history (limit to last 50 entries)
    const recentHistory = status.stateHistory?.slice(-50) || [];

    await db.execAsync('BEGIN TRANSACTION');

    for (const historyEntry of recentHistory) {
      await db.runAsync(
        `INSERT INTO challenge_state_history (
          id, month, state, timestamp, metadata
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          `${currentMonth}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          currentMonth,
          historyEntry.state,
          new Date(historyEntry.timestamp).getTime(),
          historyEntry.metadata ? JSON.stringify(historyEntry.metadata) : null
        ]
      );
    }

    await db.execAsync('COMMIT');
    console.log(`   ✅ State history: ${recentHistory.length} entries`);

    // Migrate error log (only unresolved errors)
    const errors = status.errors || [];

    if (errors.length > 0) {
      await db.execAsync('BEGIN TRANSACTION');

      for (const error of errors) {
        await db.runAsync(
          `INSERT INTO challenge_error_log (
            id, month, error, context, retry_attempt, timestamp, resolved
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `${currentMonth}_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            currentMonth,
            error.error,
            error.context || '',
            error.retryAttempt || 0,
            new Date(error.timestamp).getTime(),
            0  // unresolved
          ]
        );
      }

      await db.execAsync('COMMIT');
      console.log(`   ✅ Error log: ${errors.length} errors`);
    }

    console.log(`✅ Lifecycle state migrated`);

    return { stateHistory: recentHistory.length, errors: errors.length };

  } catch (error) {
    console.error('❌ Lifecycle state migration failed:', error);
    throw new Error(`Lifecycle state migration failed: ${error}`);
  }
}

/**
 * Migrate challenge completion history
 * Source: 'monthly_challenges_history_*' keys
 * Target: challenge_history table
 */
async function migrateChallengeHistory(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  console.log('🔄 Migrating challenge history...');

  const allKeys = await AsyncStorage.getAllKeys();
  const historyKeys = allKeys.filter(k => k.startsWith('monthly_challenges_history_'));

  console.log(`📊 Found ${historyKeys.length} history keys in AsyncStorage`);

  if (historyKeys.length === 0) {
    console.log('ℹ️  No challenge history to migrate');
    return 0;
  }

  await db.execAsync('BEGIN TRANSACTION');

  try {
    let totalMigrated = 0;

    for (const key of historyKeys) {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) {
        console.log(`   ⚠️  Empty key: ${key}`);
        continue;
      }

      const history: MonthlyChallenge[] = JSON.parse(stored);

      for (const challenge of history) {
        // Only migrate completed or failed challenges
        if (challenge.status !== 'completed' && challenge.status !== 'failed') {
          continue;
        }

        await db.runAsync(
          `INSERT OR IGNORE INTO challenge_history (
            id, challenge_id, month, template_id, final_status,
            completion_rate, xp_earned, completed_at, archived_at, summary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `history_${challenge.id}`,
            challenge.id,
            challenge.month || '',
            challenge.templateId || '',
            challenge.status,
            challenge.progress || 0,
            challenge.xpAwarded || 0,
            challenge.completedAt ? new Date(challenge.completedAt).getTime() : null,
            Date.now(),
            null
          ]
        );

        totalMigrated++;
        console.log(`   ✅ History: ${challenge.status} - ${challenge.id.substring(0, 8)}...`);
      }
    }

    await db.execAsync('COMMIT');
    console.log(`✅ Migrated ${totalMigrated} challenge history entries`);

    return totalMigrated;

  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error('❌ Challenge history migration failed:', error);
    throw new Error(`Challenge history migration failed: ${error}`);
  }
}

/**
 * Migrate challenge previews
 * Source: 'monthly_challenge_preview_*' keys
 * Target: challenge_previews table
 */
async function migrateChallengePreview(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  console.log('🔄 Migrating challenge previews...');

  const allKeys = await AsyncStorage.getAllKeys();
  const previewKeys = allKeys.filter(k => k.startsWith('monthly_challenge_preview_'));

  console.log(`📊 Found ${previewKeys.length} preview keys in AsyncStorage`);

  if (previewKeys.length === 0) {
    console.log('ℹ️  No challenge previews to migrate');
    return 0;
  }

  await db.execAsync('BEGIN TRANSACTION');

  try {
    let totalMigrated = 0;

    for (const key of previewKeys) {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) {
        console.log(`   ⚠️  Empty key: ${key}`);
        continue;
      }

      try {
        const preview: ChallengePreviewData = JSON.parse(stored);

        // Validate preview data structure
        if (!preview.month) {
          console.log(`   ⚠️  Skipping preview - missing month: ${key}`);
          continue;
        }

        if (!preview.previewChallenge || !preview.previewChallenge.id) {
          console.log(`   ⚠️  Skipping preview - missing previewChallenge.id: ${key}`);
          console.log(`   📊 Preview data:`, JSON.stringify(preview).substring(0, 200));
          continue;
        }

        await db.runAsync(
          `INSERT OR REPLACE INTO challenge_previews (
            month, generated_at, preview_challenge_id,
            alternative_1_id, alternative_2_id, user_can_choose,
            expires_at, selected_challenge_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            preview.month,
            preview.generatedAt ? new Date(preview.generatedAt).getTime() : Date.now(),
            preview.previewChallenge.id,
            preview.alternativeOptions?.[0]?.id || null,
            preview.alternativeOptions?.[1]?.id || null,
            preview.userCanChoose ? 1 : 0,
            preview.expiresAt ? new Date(preview.expiresAt).getTime() : Date.now() + 86400000,
            null  // No selection yet
          ]
        );

        totalMigrated++;
        console.log(`   ✅ Preview: ${preview.month} - ${preview.previewChallenge.id.substring(0, 8)}...`);
      } catch (parseError) {
        console.log(`   ⚠️  Failed to parse preview: ${key}`);
        console.log(`   Error:`, parseError);
        continue;
      }
    }

    await db.execAsync('COMMIT');
    console.log(`✅ Migrated ${totalMigrated} challenge previews`);

    return totalMigrated;

  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error('❌ Challenge previews migration failed:', error);
    throw new Error(`Challenge previews migration failed: ${error}`);
  }
}

// ========================================
// MAIN MIGRATION FUNCTION
// ========================================

/**
 * Phase 3.4.1: Lifecycle & History Migration
 *
 * Migrates lifecycle state, state history, error log, challenge history, and previews
 */
export async function migrateLifecycleHistory341ToSQLite(): Promise<{
  success: boolean;
  summary: {
    stateHistory: number;
    errorLog: number;
    challengeHistory: number;
    previews: number;
  };
  errors: string[];
}> {
  console.log('🚀 Starting Phase 3.4.1: Lifecycle & History Migration...\n');

  const errors: string[] = [];

  try {
    const { getDatabase } = await import('../init');
    const db = getDatabase();

    // Migrate lifecycle state + state history + error log
    const { stateHistory, errors: errorCount } = await migrateLifecycleState(db);

    // Migrate challenge history
    const challengeHistory = await migrateChallengeHistory(db);

    // Migrate challenge previews
    const previews = await migrateChallengePreview(db);

    console.log('\n✅ PHASE 3.4.1 MIGRATION COMPLETE!');
    console.log(`📊 Summary:`);
    console.log(`   State History Entries: ${stateHistory}`);
    console.log(`   Error Log Entries: ${errorCount}`);
    console.log(`   Challenge History: ${challengeHistory}`);
    console.log(`   Previews: ${previews}`);

    return {
      success: true,
      summary: {
        stateHistory,
        errorLog: errorCount,
        challengeHistory,
        previews
      },
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n❌ PHASE 3.4.1 MIGRATION FAILED:', errorMessage);
    errors.push(errorMessage);

    return {
      success: false,
      summary: {
        stateHistory: 0,
        errorLog: 0,
        challengeHistory: 0,
        previews: 0
      },
      errors
    };
  }
}
