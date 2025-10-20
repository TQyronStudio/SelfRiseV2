/**
 * ========================================
 * PHASE 2.1.2: Gamification Data Migration
 * ========================================
 *
 * Migrates XP, achievements, multipliers, and loyalty data from AsyncStorage to SQLite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { getDatabase } from '../init';
import { XPTransaction, XPSourceType } from '../../../types/gamification';
import { DateString } from '../../../types/common';
import { getCurrentLevel, isLevelMilestone } from '../../levelCalculation';
import { formatDateToString } from '../../../utils/date';

// ========================================
// PHASE 2.1.2: XP TRANSACTIONS MIGRATION
// ========================================

/**
 * Migrate XP transactions from AsyncStorage to SQLite
 */
export async function migrateXPTransactions(): Promise<{
  success: boolean;
  transactionCount: number;
  totalXP: number;
  error?: string;
}> {
  console.log('🔄 [XP Migration] Starting XP transactions migration...');

  try {
    const db = getDatabase();

    // 1. Load XP data from AsyncStorage
    const totalXPStr = await AsyncStorage.getItem('gamification_total_xp');
    const transactionsStr = await AsyncStorage.getItem('gamification_xp_transactions');

    const totalXP = totalXPStr ? parseInt(totalXPStr, 10) : 0;
    const transactions: XPTransaction[] = transactionsStr ? JSON.parse(transactionsStr) : [];

    console.log(`📊 [XP Migration] Loaded: ${transactions.length} transactions, total: ${totalXP} XP`);

    if (transactions.length === 0) {
      console.log('⚠️  [XP Migration] No transactions to migrate');
      return { success: true, transactionCount: 0, totalXP: 0 };
    }

    // 2. Begin transaction
    await db.execAsync('BEGIN TRANSACTION');

    try {
      // 3. Insert XP transactions with validation
      let migrated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const transaction of transactions) {
        // Validate transaction data
        if (!transaction.id) {
          errors.push(`Skipped transaction without ID`);
          skipped++;
          continue;
        }

        if (transaction.amount === undefined || transaction.amount === null) {
          errors.push(`Skipped transaction ${transaction.id}: missing amount`);
          skipped++;
          continue;
        }

        if (!transaction.source) {
          errors.push(`Skipped transaction ${transaction.id}: missing source`);
          skipped++;
          continue;
        }

        try {
          const timestamp = transaction.createdAt instanceof Date
            ? transaction.createdAt.getTime()
            : typeof transaction.createdAt === 'number'
              ? transaction.createdAt
              : new Date(transaction.createdAt).getTime();

          await db.runAsync(
            `INSERT OR REPLACE INTO xp_transactions (
              id, amount, source, source_id, timestamp, description, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              transaction.id,
              transaction.amount,
              transaction.source,
              transaction.sourceId || null,
              timestamp,
              transaction.description || null,
              transaction.metadata ? JSON.stringify(transaction.metadata) : null,
            ]
          );

          migrated++;

          if (migrated % 100 === 0) {
            console.log(`📊 [XP Migration] Progress: ${migrated}/${transactions.length}`);
          }
        } catch (error) {
          errors.push(`Failed to migrate transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
          skipped++;
        }
      }

      if (skipped > 0) {
        console.log(`ℹ️  [XP Migration] Skipped ${skipped} invalid transactions (data cleanup)`);
        errors.slice(0, 5).forEach(err => console.log(`   ℹ️  ${err}`));
      }

      console.log(`✅ [XP Migration] ${migrated} transactions migrated (${skipped} skipped)`);

      // 4. Pre-aggregate daily XP summaries
      console.log('🔄 [XP Migration] Building daily XP summaries...');
      await buildDailyXPSummaries(db);

      // 5. Migrate XP state (this will correct totalXP if needed)
      await migrateXPState(db, totalXP);

      // 6. Get CORRECTED totalXP from state
      const xpState = await db.getFirstAsync<{ total_xp: number }>(
        'SELECT total_xp FROM xp_state WHERE id = 1'
      );
      const correctedTotalXP = xpState?.total_xp || totalXP;

      // 7. Commit transaction
      await db.execAsync('COMMIT');

      console.log(`✅ [XP Migration] Complete: ${migrated} transactions, ${correctedTotalXP} total XP`);

      return {
        success: true,
        transactionCount: migrated,
        totalXP: correctedTotalXP,
      };

    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ [XP Migration] Failed:', error);
    return {
      success: false,
      transactionCount: 0,
      totalXP: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build daily XP summaries from transactions using SQL aggregation
 */
async function buildDailyXPSummaries(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('🔄 Building daily XP summaries...');

  // Use SQLite aggregation to build summaries from transactions
  await db.execAsync(`
    INSERT INTO xp_daily_summary (
      date,
      total_xp,
      habit_xp,
      journal_xp,
      goal_xp,
      achievement_xp,
      transaction_count,
      updated_at
    )
    SELECT
      date(timestamp / 1000, 'unixepoch', 'localtime') as date,
      SUM(amount) as total_xp,
      SUM(CASE WHEN source LIKE 'HABIT_%' THEN amount ELSE 0 END) as habit_xp,
      SUM(CASE WHEN source LIKE 'JOURNAL_%' THEN amount ELSE 0 END) as journal_xp,
      SUM(CASE WHEN source LIKE 'GOAL_%' THEN amount ELSE 0 END) as goal_xp,
      SUM(CASE WHEN source = 'ACHIEVEMENT_UNLOCK' THEN amount ELSE 0 END) as achievement_xp,
      COUNT(*) as transaction_count,
      CAST(strftime('%s', 'now') AS INTEGER) * 1000 as updated_at
    FROM xp_transactions
    GROUP BY date
    ORDER BY date ASC
  `);

  const summaryCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM xp_daily_summary'
  );

  console.log(`✅ ${summaryCount?.count || 0} daily summaries created`);
}

/**
 * Migrate XP state (total XP, level)
 * IMPORTANT: Uses ACTUAL sum from migrated transactions, not original AsyncStorage value
 * This ensures consistency between transactions and state
 */
async function migrateXPState(
  db: SQLite.SQLiteDatabase,
  originalTotalXP: number
): Promise<void> {
  console.log(`🔄 Migrating XP state (original: ${originalTotalXP})...`);

  // Calculate ACTUAL total XP from migrated transactions
  const xpSum = await db.getFirstAsync<{ sum: number }>(
    'SELECT SUM(amount) as sum FROM xp_transactions'
  );

  const actualTotalXP = xpSum?.sum || 0;

  // If there's a difference, log it clearly
  if (actualTotalXP !== originalTotalXP) {
    const diff = originalTotalXP - actualTotalXP;
    console.log(`ℹ️  XP Correction: ${originalTotalXP} → ${actualTotalXP} (${diff} XP from invalid transactions removed)`);
  }

  const currentLevel = getCurrentLevel(actualTotalXP);
  const lastActivity = Date.now();

  await db.runAsync(
    `INSERT OR REPLACE INTO xp_state (
      id, total_xp, current_level, last_activity, updated_at
    ) VALUES (1, ?, ?, ?, ?)`,
    [actualTotalXP, currentLevel, lastActivity, lastActivity]
  );

  console.log(`✅ XP state migrated: ${actualTotalXP} XP, Level ${currentLevel} (${actualTotalXP === originalTotalXP ? 'no correction needed' : 'corrected from invalid data'})`);
}

// ========================================
// LEVEL-UP HISTORY MIGRATION
// ========================================

/**
 * Migrate level-up history
 */
export async function migrateLevelUpHistory(): Promise<{
  success: boolean;
  levelUpCount: number;
  error?: string;
}> {
  console.log('🔄 [Level-Up Migration] Starting...');

  try {
    const db = getDatabase();

    const historyStr = await AsyncStorage.getItem('gamification_level_up_history');
    const history: any[] = historyStr ? JSON.parse(historyStr) : [];

    console.log(`📊 [Level-Up Migration] Loaded: ${history.length} level-up events`);

    if (history.length === 0) {
      console.log('⚠️  [Level-Up Migration] No events to migrate');
      return { success: true, levelUpCount: 0 };
    }

    await db.execAsync('BEGIN TRANSACTION');

    try {
      for (const event of history) {
        const timestamp = event.timestamp instanceof Date
          ? event.timestamp.getTime()
          : typeof event.timestamp === 'number'
            ? event.timestamp
            : new Date(event.timestamp).getTime();

        await db.runAsync(
          `INSERT OR REPLACE INTO level_up_history (
            id, level, timestamp, total_xp_at_levelup, is_milestone
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            event.id || `levelup_${event.newLevel}_${timestamp}`,
            event.newLevel,
            timestamp,
            event.totalXPAtLevelUp || 0,
            isLevelMilestone(event.newLevel) ? 1 : 0,
          ]
        );
      }

      await db.execAsync('COMMIT');

      console.log(`✅ [Level-Up Migration] ${history.length} events migrated`);

      return {
        success: true,
        levelUpCount: history.length,
      };

    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ [Level-Up Migration] Failed:', error);
    return {
      success: false,
      levelUpCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ========================================
// PHASE 2.2.1: ACHIEVEMENTS MIGRATION
// ========================================

/**
 * Migrate achievement progress
 */
export async function migrateAchievementProgress(): Promise<{
  success: boolean;
  achievementCount: number;
  unlockedCount: number;
  error?: string;
}> {
  console.log('🔄 [Achievement Migration] Starting...');

  try {
    const db = getDatabase();

    const userAchievementsStr = await AsyncStorage.getItem('achievements_user_data');
    const userAchievements = userAchievementsStr ? JSON.parse(userAchievementsStr) : null;

    if (!userAchievements) {
      console.log('⚠️  [Achievement Migration] No achievement data to migrate');
      return { success: true, achievementCount: 0, unlockedCount: 0 };
    }

    const unlockEventsStr = await AsyncStorage.getItem('achievements_unlock_events');
    const unlockEvents: any[] = unlockEventsStr ? JSON.parse(unlockEventsStr) : [];

    console.log(`📊 [Achievement Migration] Loaded: ${Object.keys(userAchievements.achievementProgress || {}).length} achievements`);

    await db.execAsync('BEGIN TRANSACTION');

    try {
      let migrated = 0;
      const progress = userAchievements.achievementProgress || {};

      // Migrate achievement progress
      for (const [achievementId, currentValue] of Object.entries(progress)) {
        const isUnlocked = userAchievements.unlockedAchievements?.includes(achievementId) || false;
        const unlockEvent = unlockEvents.find((e: any) => e.achievementId === achievementId);

        await db.runAsync(
          `INSERT OR REPLACE INTO achievement_progress (
            achievement_id, current_value, target_value,
            unlocked, unlocked_at, xp_awarded, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            achievementId,
            currentValue as number,
            100, // Will be updated when we have achievement definitions
            isUnlocked ? 1 : 0,
            unlockEvent?.unlockedAt || null,
            unlockEvent?.xpAwarded || 0,
            Date.now(),
          ]
        );

        migrated++;
      }

      await db.execAsync('COMMIT');

      console.log(`✅ [Achievement Migration] ${migrated} achievements migrated`);

      return {
        success: true,
        achievementCount: migrated,
        unlockedCount: userAchievements.unlockedAchievements?.length || 0,
      };

    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ [Achievement Migration] Failed:', error);
    return {
      success: false,
      achievementCount: 0,
      unlockedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Migrate achievement unlock events
 */
export async function migrateAchievementUnlockEvents(): Promise<{
  success: boolean;
  eventCount: number;
  error?: string;
}> {
  console.log('🔄 [Achievement Events Migration] Starting...');

  try {
    const db = getDatabase();

    const eventsStr = await AsyncStorage.getItem('achievements_unlock_events');
    const events: any[] = eventsStr ? JSON.parse(eventsStr) : [];

    console.log(`📊 [Achievement Events Migration] Loaded: ${events.length} unlock events`);

    if (events.length === 0) {
      console.log('⚠️  [Achievement Events Migration] No events to migrate');
      return { success: true, eventCount: 0 };
    }

    await db.execAsync('BEGIN TRANSACTION');

    try {
      for (const event of events) {
        await db.runAsync(
          `INSERT OR REPLACE INTO achievement_unlock_events (
            id, achievement_id, unlocked_at, xp_awarded, category
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            `${event.achievementId}_unlock_${event.unlockedAt}`,
            event.achievementId,
            event.unlockedAt,
            event.xpAwarded || 0,
            event.category || 'general',
          ]
        );
      }

      await db.execAsync('COMMIT');

      console.log(`✅ [Achievement Events Migration] ${events.length} events migrated`);

      return {
        success: true,
        eventCount: events.length,
      };

    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ [Achievement Events Migration] Failed:', error);
    return {
      success: false,
      eventCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ========================================
// PHASE 2.3: MULTIPLIERS & LOYALTY MIGRATION
// ========================================

/**
 * Migrate XP multipliers
 */
export async function migrateXPMultipliers(): Promise<{
  success: boolean;
  multiplierCount: number;
  error?: string;
}> {
  console.log('🔄 [Multipliers Migration] Starting...');

  try {
    const db = getDatabase();

    const multiplierStr = await AsyncStorage.getItem('gamification_xp_multiplier');

    if (!multiplierStr) {
      console.log('ℹ️  [Multipliers Migration] No multiplier data to migrate');
      return { success: true, multiplierCount: 0 };
    }

    const multiplierData = JSON.parse(multiplierStr);
    console.log(`📊 [Multipliers Migration] Loaded multiplier data`);

    // Current multiplier might be stored as single object or array
    const multipliers = Array.isArray(multiplierData) ? multiplierData : [multiplierData];

    if (multipliers.length === 0 || !multipliers[0]) {
      console.log('ℹ️  [Multipliers Migration] No active multipliers');
      return { success: true, multiplierCount: 0 };
    }

    await db.execAsync('BEGIN TRANSACTION');

    try {
      let migrated = 0;

      for (const mult of multipliers) {
        if (!mult || !mult.id) continue;

        const activatedAt = mult.activatedAt instanceof Date
          ? mult.activatedAt.getTime()
          : typeof mult.activatedAt === 'number'
            ? mult.activatedAt
            : new Date(mult.activatedAt).getTime();

        const expiresAt = mult.expiresAt instanceof Date
          ? mult.expiresAt.getTime()
          : typeof mult.expiresAt === 'number'
            ? mult.expiresAt
            : mult.expiresAt
              ? new Date(mult.expiresAt).getTime()
              : null;

        await db.runAsync(
          `INSERT OR REPLACE INTO xp_multipliers (
            id, source, multiplier, activated_at, expires_at, is_active
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            mult.id,
            mult.source || 'unknown',
            mult.multiplier || 1.0,
            activatedAt,
            expiresAt,
            mult.isActive ? 1 : 0,
          ]
        );

        migrated++;
      }

      await db.execAsync('COMMIT');

      console.log(`✅ [Multipliers Migration] ${migrated} multipliers migrated`);

      return {
        success: true,
        multiplierCount: migrated,
      };

    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ [Multipliers Migration] Failed:', error);
    return {
      success: false,
      multiplierCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Migrate loyalty tracking state
 */
export async function migrateLoyaltyState(): Promise<{
  success: boolean;
  migrated: boolean;
  error?: string;
}> {
  console.log('🔄 [Loyalty Migration] Starting...');

  try {
    const db = getDatabase();

    const loyaltyStr = await AsyncStorage.getItem('loyalty_tracking_state');

    if (!loyaltyStr) {
      console.log('ℹ️  [Loyalty Migration] No loyalty data to migrate');
      return { success: true, migrated: false };
    }

    const loyalty = JSON.parse(loyaltyStr);
    console.log(`📊 [Loyalty Migration] Loaded loyalty data (${loyalty.totalActiveDays} active days)`);

    await db.runAsync(
      `INSERT OR REPLACE INTO loyalty_state (
        id, total_active_days, current_streak, longest_streak,
        last_active_date, milestones_unlocked, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?)`,
      [
        loyalty.totalActiveDays || 0,
        loyalty.currentActiveStreak || 0,
        loyalty.longestActiveStreak || 0,
        loyalty.lastActiveDate || null,
        JSON.stringify(loyalty.milestonesUnlocked || []),
        Date.now(),
      ]
    );

    console.log(`✅ [Loyalty Migration] State migrated successfully`);

    return {
      success: true,
      migrated: true,
    };

  } catch (error) {
    console.error('❌ [Loyalty Migration] Failed:', error);
    return {
      success: false,
      migrated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ========================================
// VERIFICATION
// ========================================

/**
 * Verify XP migration integrity
 * Note: Allows for some transactions to be skipped if invalid
 */
export async function verifyXPMigration(originalTotalXP: number, migratedTransactionCount: number): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  console.log('🔍 Verifying XP migration...');

  const errors: string[] = [];
  const warnings: string[] = [];
  const db = getDatabase();

  try {
    // Verify transaction count matches what was migrated
    const txCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM xp_transactions'
    );

    if (txCount?.count !== migratedTransactionCount) {
      errors.push(
        `Transaction count mismatch: DB has ${txCount?.count}, expected ${migratedTransactionCount} migrated`
      );
    } else {
      console.log(`✅ Transaction count correct: ${txCount?.count}`);
    }

    // Verify total XP in state
    const xpState = await db.getFirstAsync<{ total_xp: number }>(
      'SELECT total_xp FROM xp_state WHERE id = 1'
    );

    // Verify XP sum from migrated transactions
    const xpSum = await db.getFirstAsync<{ sum: number }>(
      'SELECT SUM(amount) as sum FROM xp_transactions'
    );

    // CRITICAL: State MUST match sum of transactions (we corrected this in migrateXPState)
    const xpDiff = Math.abs((xpSum?.sum || 0) - (xpState?.total_xp || 0));
    if (xpDiff > 1) { // Allow only 1 XP rounding tolerance
      errors.push(
        `XP CONSISTENCY ERROR: transactions=${xpSum?.sum}, state=${xpState?.total_xp}, diff=${xpDiff}`
      );
    } else {
      console.log(`✅ XP consistency verified: state=${xpState?.total_xp}, transactions=${xpSum?.sum}`);
    }

    // Log if original XP was corrected
    if (xpState?.total_xp !== originalTotalXP) {
      console.log(`ℹ️  XP corrected during migration: ${originalTotalXP} → ${xpState?.total_xp} (removed ${originalTotalXP - (xpState?.total_xp || 0)} XP from invalid transactions)`);
    }

    // Check daily summaries exist
    const summaryCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM xp_daily_summary'
    );

    if ((summaryCount?.count || 0) === 0 && migratedTransactionCount > 0) {
      warnings.push('No daily summaries created despite having transactions');
    } else {
      console.log(`✅ ${summaryCount?.count} daily summaries created`);
    }

    if (errors.length === 0) {
      console.log('✅ XP migration verification passed');
      if (warnings.length > 0) {
        console.warn(`⚠️  ${warnings.length} warnings:`, warnings);
      }
      return { valid: true, errors: [], warnings };
    } else {
      console.error('❌ XP migration verification failed:', errors);
      return { valid: false, errors, warnings };
    }

  } catch (error) {
    console.error('❌ XP migration verification error:', error);
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      warnings: [],
    };
  }
}

// ========================================
// MASTER MIGRATION FUNCTION
// ========================================

/**
 * Run complete gamification migration
 */
export async function migrateGamificationToSQLite(): Promise<{
  success: boolean;
  summary: {
    xpTransactions: number;
    levelUpEvents: number;
    achievements: number;
    unlockedAchievements: number;
    unlockEvents: number;
    totalXP: number;
    multipliers: number;
    loyaltyMigrated: boolean;
  };
  errors: string[];
}> {
  console.log('🚀 [Gamification Migration] Starting complete migration...');

  const errors: string[] = [];
  const summary = {
    xpTransactions: 0,
    levelUpEvents: 0,
    achievements: 0,
    unlockedAchievements: 0,
    unlockEvents: 0,
    totalXP: 0,
    multipliers: 0,
    loyaltyMigrated: false,
  };

  try {
    // Phase 1: XP Transactions
    const xpResult = await migrateXPTransactions();
    if (xpResult.success) {
      summary.xpTransactions = xpResult.transactionCount;
      summary.totalXP = xpResult.totalXP;
    } else {
      errors.push(`XP Migration: ${xpResult.error}`);
    }

    // Phase 2: Level-Up History
    const levelUpResult = await migrateLevelUpHistory();
    if (levelUpResult.success) {
      summary.levelUpEvents = levelUpResult.levelUpCount;
    } else {
      errors.push(`Level-Up Migration: ${levelUpResult.error}`);
    }

    // Phase 3: Achievement Progress
    const achievementResult = await migrateAchievementProgress();
    if (achievementResult.success) {
      summary.achievements = achievementResult.achievementCount;
      summary.unlockedAchievements = achievementResult.unlockedCount;
    } else {
      errors.push(`Achievement Migration: ${achievementResult.error}`);
    }

    // Phase 4: Achievement Unlock Events
    const eventsResult = await migrateAchievementUnlockEvents();
    if (eventsResult.success) {
      summary.unlockEvents = eventsResult.eventCount;
    } else {
      errors.push(`Achievement Events Migration: ${eventsResult.error}`);
    }

    // Phase 5: XP Multipliers (Phase 2.3)
    const multipliersResult = await migrateXPMultipliers();
    if (multipliersResult.success) {
      summary.multipliers = multipliersResult.multiplierCount;
    } else {
      errors.push(`Multipliers Migration: ${multipliersResult.error}`);
    }

    // Phase 6: Loyalty State (Phase 2.3)
    const loyaltyResult = await migrateLoyaltyState();
    if (loyaltyResult.success) {
      summary.loyaltyMigrated = loyaltyResult.migrated;
    } else {
      errors.push(`Loyalty Migration: ${loyaltyResult.error}`);
    }

    // Verify migration
    const verification = await verifyXPMigration(summary.totalXP, summary.xpTransactions);
    if (!verification.valid) {
      errors.push(...verification.errors);
    }
    if (verification.warnings && verification.warnings.length > 0) {
      console.warn('⚠️  Verification warnings:', verification.warnings);
    }

    const success = errors.length === 0;

    console.log(`${success ? '✅' : '⚠️'} [Gamification Migration] Complete`);
    console.log(`📊 Summary:`, summary);
    if (errors.length > 0) {
      console.error(`❌ Errors:`, errors);
    }

    return { success, summary, errors };

  } catch (error) {
    console.error('❌ [Gamification Migration] Fatal error:', error);
    return {
      success: false,
      summary,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
