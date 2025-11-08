/**
 * Goals Migration to SQLite
 * Phase 1.3.3 - Migrate goals data from AsyncStorage to SQLite
 *
 * NOTE: This file uses legacy AsyncStorage data with old property names
 * @ts-nocheck to suppress TypeScript errors for legacy properties
 */
// @ts-nocheck

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../init';
import { Goal, GoalProgress } from '../../../types/goal';

interface GoalMigrationResult {
  success: boolean;
  message: string;
  counts: {
    goals: number;
    progress: number;
    milestones: number;
  };
  errors: string[];
}

/**
 * Migrate goals data from AsyncStorage to SQLite
 */
export async function migrateGoalsToSQLite(): Promise<GoalMigrationResult> {
  const errors: string[] = [];
  let goalsCount = 0;
  let progressCount = 0;
  let milestonesCount = 0;

  try {
    console.log('🔄 Starting Goals migration to SQLite...');

    const db = getDatabase();

    // Read data from AsyncStorage
    const goalsJson = await AsyncStorage.getItem('goals');
    const progressJson = await AsyncStorage.getItem('goal_progress');

    if (!goalsJson) {
      return {
        success: false,
        message: 'No goals data found in AsyncStorage',
        counts: { goals: 0, progress: 0, milestones: 0 },
        errors: ['No goals data found'],
      };
    }

    const goals: Goal[] = JSON.parse(goalsJson);
    const progressRecords: GoalProgress[] = progressJson ? JSON.parse(progressJson) : [];

    console.log(`📦 Found ${goals.length} goals, ${progressRecords.length} progress records`);

    // Migrate in transaction for safety
    await db.withTransactionAsync(async () => {
      // Clear existing data
      await db.runAsync('DELETE FROM goal_progress');
      await db.runAsync('DELETE FROM goal_milestones');
      await db.runAsync('DELETE FROM goals');

      // Migrate goals
      for (const goal of goals) {
        try {
          // Generate start_date from createdAt if not present
          const startDate = goal.startDate || (
            typeof goal.createdAt === 'number'
              ? new Date(goal.createdAt).toISOString().split('T')[0]
              : goal.createdAt instanceof Date
                ? goal.createdAt.toISOString().split('T')[0]
                : new Date(goal.createdAt).toISOString().split('T')[0]
          );

          // Normalize timestamps
          const createdAtTimestamp = typeof goal.createdAt === 'number' ? goal.createdAt : new Date(goal.createdAt).getTime();
          const updatedAtTimestamp = typeof goal.updatedAt === 'number' ? goal.updatedAt : new Date(goal.updatedAt).getTime();
          const completedAtTimestamp = goal.completedDate
            ? (typeof goal.completedDate === 'string' ? new Date(goal.completedDate).getTime() : goal.completedDate)
            : null;

          await db.runAsync(
            `INSERT INTO goals (
              id, title, description, unit, target_value, current_value, target_date,
              category, status, order_index, start_date, created_at, updated_at, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              goal.id,
              goal.title,
              goal.description || null,
              goal.unit,
              goal.targetValue,
              goal.currentValue || 0,
              goal.targetDate || null,
              goal.category,
              goal.status || 'active',
              goal.order || (goal as any).orderIndex || 0,
              startDate,
              createdAtTimestamp,
              updatedAtTimestamp,
              completedAtTimestamp,
            ]
          );

          goalsCount++;

          // Migrate milestones if they exist
          if ((goal as any).milestones && (goal as any).milestones.length > 0) {
            for (const milestone of (goal as any).milestones) {
              try {
                await db.runAsync(
                  `INSERT INTO goal_milestones (
                    id, goal_id, value, description, is_completed, completed_at
                  ) VALUES (?, ?, ?, ?, ?, ?)`,
                  [
                    milestone.id,
                    goal.id,
                    milestone.value,
                    milestone.description,
                    milestone.isCompleted ? 1 : 0,
                    milestone.completedAt || null,
                  ]
                );
                milestonesCount++;
              } catch (error) {
                errors.push(`Failed to migrate milestone ${milestone.id}: ${error}`);
              }
            }
          }
        } catch (error) {
          errors.push(`Failed to migrate goal ${goal.id}: ${error}`);
        }
      }

      // Migrate progress records
      for (const progress of progressRecords) {
        try {
          // Normalize date and timestamps
          const progressDate = progress.date || (
            progress.timestamp
              ? (typeof progress.timestamp === 'number'
                  ? new Date(progress.timestamp).toISOString().split('T')[0]
                  : progress.timestamp)
              : new Date().toISOString().split('T')[0]
          );

          const createdAtTimestamp = progress.createdAt
            ? (typeof progress.createdAt === 'number' ? progress.createdAt : new Date(progress.createdAt).getTime())
            : Date.now();

          const updatedAtTimestamp = progress.updatedAt
            ? (typeof progress.updatedAt === 'number' ? progress.updatedAt : new Date(progress.updatedAt).getTime())
            : createdAtTimestamp;

          await db.runAsync(
            `INSERT INTO goal_progress (
              id, goal_id, value, date, note, progress_type, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              progress.id,
              progress.goalId,
              progress.value,
              progressDate,
              progress.note || null,
              progress.progressType || 'add',
              createdAtTimestamp,
              updatedAtTimestamp,
            ]
          );
          progressCount++;
        } catch (error) {
          errors.push(`Failed to migrate progress ${progress.id}: ${error}`);
        }
      }
    });

    console.log(`✅ Goals migration completed:`);
    console.log(`   📊 Goals: ${goalsCount}/${goals.length}`);
    console.log(`   📊 Progress: ${progressCount}/${progressRecords.length}`);
    console.log(`   📊 Milestones: ${milestonesCount}`);

    if (errors.length > 0) {
      console.warn(`⚠️ Migration completed with ${errors.length} errors`);
      errors.forEach((error) => console.warn(`   - ${error}`));
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0
        ? `Successfully migrated ${goalsCount} goals, ${progressCount} progress records, ${milestonesCount} milestones`
        : `Migrated with ${errors.length} errors`,
      counts: {
        goals: goalsCount,
        progress: progressCount,
        milestones: milestonesCount,
      },
      errors,
    };
  } catch (error) {
    console.error('❌ Goals migration failed:', error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      counts: { goals: goalsCount, progress: progressCount, milestones: milestonesCount },
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Verify goals migration integrity
 */
export async function verifyGoalsMigration(): Promise<{
  valid: boolean;
  message: string;
  counts: { goals: number; progress: number; milestones: number };
  mismatches: string[];
}> {
  const mismatches: string[] = [];

  try {
    console.log('🔍 Verifying Goals migration...');

    const db = getDatabase();

    // Read from AsyncStorage
    const goalsJson = await AsyncStorage.getItem('goals');
    const progressJson = await AsyncStorage.getItem('goal_progress');

    if (!goalsJson) {
      return {
        valid: false,
        message: 'No source data to verify against',
        counts: { goals: 0, progress: 0, milestones: 0 },
        mismatches: ['No AsyncStorage data found'],
      };
    }

    const sourceGoals: Goal[] = JSON.parse(goalsJson);
    const sourceProgress: GoalProgress[] = progressJson ? JSON.parse(progressJson) : [];

    // Count milestones in source data
    const sourceMilestones = sourceGoals.reduce(
      (count, goal) => count + (goal.milestones?.length || 0),
      0
    );

    // Read from SQLite
    const dbGoals = await db.getAllAsync('SELECT * FROM goals');
    const dbProgress = await db.getAllAsync('SELECT * FROM goal_progress');
    const dbMilestones = await db.getAllAsync('SELECT * FROM goal_milestones');

    console.log(`📊 Verification counts:`);
    console.log(`   Goals: ${sourceGoals.length} (AsyncStorage) vs ${dbGoals.length} (SQLite)`);
    console.log(`   Progress: ${sourceProgress.length} (AsyncStorage) vs ${dbProgress.length} (SQLite)`);
    console.log(`   Milestones: ${sourceMilestones} (AsyncStorage) vs ${dbMilestones.length} (SQLite)`);

    // Check counts
    if (sourceGoals.length !== dbGoals.length) {
      mismatches.push(`Goal count mismatch: ${sourceGoals.length} vs ${dbGoals.length}`);
    }
    if (sourceProgress.length !== dbProgress.length) {
      mismatches.push(`Progress count mismatch: ${sourceProgress.length} vs ${dbProgress.length}`);
    }
    if (sourceMilestones !== dbMilestones.length) {
      mismatches.push(`Milestone count mismatch: ${sourceMilestones} vs ${dbMilestones.length}`);
    }

    // Verify each goal exists
    for (const goal of sourceGoals) {
      const dbGoal = dbGoals.find((g: any) => g.id === goal.id);
      if (!dbGoal) {
        mismatches.push(`Goal ${goal.id} not found in SQLite`);
      }
    }

    // Verify each progress record exists
    for (const progress of sourceProgress) {
      const dbRecord = dbProgress.find((p: any) => p.id === progress.id);
      if (!dbRecord) {
        mismatches.push(`Progress ${progress.id} not found in SQLite`);
      }
    }

    console.log(mismatches.length === 0 ? '✅ Verification passed' : `⚠️ Found ${mismatches.length} mismatches`);

    return {
      valid: mismatches.length === 0,
      message: mismatches.length === 0
        ? 'Migration verified successfully'
        : `Found ${mismatches.length} mismatches`,
      counts: {
        goals: dbGoals.length,
        progress: dbProgress.length,
        milestones: dbMilestones.length,
      },
      mismatches,
    };
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return {
      valid: false,
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      counts: { goals: 0, progress: 0, milestones: 0 },
      mismatches: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
