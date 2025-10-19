/**
 * Habits Data Migration to SQLite
 * Phase 1.2.3 - Migrate habits and completions from AsyncStorage to SQLite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../init';
import { Habit, HabitCompletion } from '../../../types/habit';

interface MigrationResult {
  success: boolean;
  message: string;
  habitsMigrated: number;
  completionsMigrated: number;
  scheduleHistoryMigrated: number;
  errors: string[];
}

/**
 * Migrate all habits data from AsyncStorage to SQLite
 */
export async function migrateHabitsData(): Promise<MigrationResult> {
  const errors: string[] = [];
  let habitsMigrated = 0;
  let completionsMigrated = 0;
  let scheduleHistoryMigrated = 0;

  try {
    console.log('🚀 [Habits Migration] Starting migration...');

    const db = getDatabase();

    // 1. Read data from AsyncStorage
    console.log('📖 [Habits Migration] Reading from AsyncStorage...');
    const habitsJson = await AsyncStorage.getItem('habits');
    const completionsJson = await AsyncStorage.getItem('habit_completions');

    if (!habitsJson) {
      return {
        success: false,
        message: 'No habits data found in AsyncStorage',
        habitsMigrated: 0,
        completionsMigrated: 0,
        scheduleHistoryMigrated: 0,
        errors: ['No habits data found'],
      };
    }

    const habits: Habit[] = JSON.parse(habitsJson);
    const completions: HabitCompletion[] = completionsJson ? JSON.parse(completionsJson) : [];

    console.log(`📊 [Habits Migration] Found ${habits.length} habits, ${completions.length} completions`);

    // 2. Start transaction
    await db.execAsync('BEGIN TRANSACTION;');

    try {
      // 3. Migrate habits
      console.log('📝 [Habits Migration] Migrating habits...');
      for (const habit of habits) {
        try {
          // Serialize scheduledDays array to JSON
          const scheduledDaysJson = JSON.stringify(habit.scheduledDays);

          await db.runAsync(
            `INSERT INTO habits (id, name, color, icon, scheduled_days, order_index, is_active, description, created_at, updated_at, is_archived)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              habit.id,
              habit.name,
              habit.color,
              habit.icon,
              scheduledDaysJson,
              habit.order,
              habit.isActive ? 1 : 0,
              habit.description || null,
              habit.createdAt instanceof Date ? habit.createdAt.getTime() : new Date(habit.createdAt).getTime(),
              habit.updatedAt instanceof Date ? habit.updatedAt.getTime() : new Date(habit.updatedAt).getTime(),
              0, // is_archived - assuming all active habits
            ]
          );
          habitsMigrated++;

          // 4. Migrate schedule history if exists
          if (habit.scheduleHistory?.entries && habit.scheduleHistory.entries.length > 0) {
            for (const entry of habit.scheduleHistory.entries) {
              try {
                const entryId = `${habit.id}_${entry.effectiveFromDate}`;
                const entryScheduledDaysJson = JSON.stringify(entry.scheduledDays);

                await db.runAsync(
                  `INSERT INTO habit_schedule_history (id, habit_id, scheduled_days, effective_from_date, created_at)
                   VALUES (?, ?, ?, ?, ?)`,
                  [
                    entryId,
                    habit.id,
                    entryScheduledDaysJson,
                    entry.effectiveFromDate,
                    Date.now(),
                  ]
                );
                scheduleHistoryMigrated++;
              } catch (error) {
                errors.push(`Failed to migrate schedule history for habit ${habit.id}: ${error}`);
              }
            }
          }

        } catch (error) {
          errors.push(`Failed to migrate habit ${habit.id}: ${error}`);
        }
      }

      // 5. Migrate completions
      console.log('📝 [Habits Migration] Migrating completions...');
      for (const completion of completions) {
        try {
          await db.runAsync(
            `INSERT INTO habit_completions (
              id, habit_id, date, completed, is_bonus, completed_at, note,
              is_converted, converted_from_date, converted_to_date, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              completion.id,
              completion.habitId,
              completion.date,
              completion.completed ? 1 : 0,
              completion.isBonus ? 1 : 0,
              completion.completedAt instanceof Date ? completion.completedAt.getTime() : (completion.completedAt ? new Date(completion.completedAt).getTime() : null),
              completion.note || null,
              completion.isConverted ? 1 : 0,
              completion.convertedFromDate || null,
              completion.convertedToDate || null,
              completion.createdAt instanceof Date ? completion.createdAt.getTime() : new Date(completion.createdAt).getTime(),
              completion.updatedAt instanceof Date ? completion.updatedAt.getTime() : new Date(completion.updatedAt).getTime(),
            ]
          );
          completionsMigrated++;
        } catch (error) {
          errors.push(`Failed to migrate completion ${completion.id}: ${error}`);
        }
      }

      // 6. Commit transaction
      await db.execAsync('COMMIT;');
      console.log('✅ [Habits Migration] Transaction committed');

      // 7. Verify migration
      const habitCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habits');
      const completionCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habit_completions');
      const historyCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habit_schedule_history');

      console.log(`✅ [Habits Migration] Verification:`);
      console.log(`   Habits in DB: ${habitCount?.count ?? 0}`);
      console.log(`   Completions in DB: ${completionCount?.count ?? 0}`);
      console.log(`   Schedule history in DB: ${historyCount?.count ?? 0}`);

      return {
        success: true,
        message: `Migration complete: ${habitsMigrated} habits, ${completionsMigrated} completions, ${scheduleHistoryMigrated} schedule entries`,
        habitsMigrated,
        completionsMigrated,
        scheduleHistoryMigrated,
        errors,
      };

    } catch (error) {
      // Rollback on error
      await db.execAsync('ROLLBACK;');
      console.error('❌ [Habits Migration] Transaction rolled back:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ [Habits Migration] Failed:', error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      habitsMigrated,
      completionsMigrated,
      scheduleHistoryMigrated,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Check if habits have already been migrated
 */
export async function getHabitsMigrationStatus(): Promise<{
  isMigrated: boolean;
  habitCount: number;
  completionCount: number;
}> {
  try {
    const db = getDatabase();

    const habitCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habits');
    const completionCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habit_completions');

    return {
      isMigrated: (habitCount?.count ?? 0) > 0,
      habitCount: habitCount?.count ?? 0,
      completionCount: completionCount?.count ?? 0,
    };

  } catch (error) {
    console.error('❌ [Habits Migration] Status check failed:', error);
    return {
      isMigrated: false,
      habitCount: 0,
      completionCount: 0,
    };
  }
}
