/**
 * SQLiteHabitStorage - SQLite implementation for Habits
 * Phase 1.2.4 - Replace AsyncStorage with SQLite for habits
 */

import { Habit, HabitCompletion, CreateHabitInput, DayOfWeek, ScheduleTimeline } from '../../types/habit';
import { DateString } from '../../types/common';
import { getDatabase } from '../database/init';
import { GamificationService } from '../gamificationService';
import { XPSourceType } from '../../types/gamification';
import { XP_REWARDS } from '../../constants/gamification';

export class SQLiteHabitStorage {
  private db: ReturnType<typeof getDatabase> | null = null;

  private getDb() {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  // ========================================
  // HABITS CRUD
  // ========================================

  async getAll(): Promise<Habit[]> {
    try {
      const db = this.getDb();
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM habits WHERE is_archived = 0 ORDER BY order_index ASC`
      );

      console.log(`📊 SQLite getAll: Found ${rows.length} habits in DB`);
      const habits = rows.map(row => this.rowToHabit(row));
      console.log(`📊 SQLite getAll: Mapped to ${habits.length} Habit objects`);
      if (habits.length > 0) {
        console.log(`📊 First habit:`, habits[0].name, habits[0].id);
      }

      return habits;
    } catch (error) {
      console.error('❌ SQLite getAll habits failed:', error);
      throw new Error(`Failed to get all habits: ${error}`);
    }
  }

  async getById(id: string): Promise<Habit | null> {
    try {
      const db = this.getDb();
      const row = await db.getFirstAsync<any>(
        `SELECT * FROM habits WHERE id = ?`,
        [id]
      );

      if (!row) return null;
      return this.rowToHabit(row);
    } catch (error) {
      console.error(`❌ SQLite getById habit failed (${id}):`, error);
      throw new Error(`Failed to get habit: ${error}`);
    }
  }

  async create(input: CreateHabitInput): Promise<Habit> {
    try {
      const db = this.getDb();

      // Get max order
      const maxOrderRow = await db.getFirstAsync<{ maxOrder: number | null }>(
        `SELECT MAX(order_index) as maxOrder FROM habits`
      );
      const order = (maxOrderRow?.maxOrder ?? -1) + 1;

      const habitId = `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      const scheduledDaysJson = JSON.stringify(input.scheduledDays);

      await db.runAsync(
        `INSERT INTO habits (id, name, color, icon, scheduled_days, order_index, is_active, description, created_at, updated_at, is_archived)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          habitId,
          input.name,
          input.color,
          input.icon,
          scheduledDaysJson,
          order,
          1, // is_active = true
          input.description || null,
          now,
          now,
          0, // is_archived = false
        ]
      );

      const habit = await this.getById(habitId);
      if (!habit) throw new Error('Failed to retrieve created habit');

      return habit;
    } catch (error) {
      console.error('❌ SQLite create habit failed:', error);
      throw new Error(`Failed to create habit: ${error}`);
    }
  }

  async update(id: string, updates: Partial<Habit>): Promise<Habit> {
    try {
      const db = this.getDb();

      // Get current habit
      const currentHabit = await this.getById(id);
      if (!currentHabit) {
        throw new Error(`Habit with id ${id} not found`);
      }

      // Check if scheduledDays changed - create schedule history entry
      if (updates.scheduledDays &&
          JSON.stringify(updates.scheduledDays) !== JSON.stringify(currentHabit.scheduledDays)) {

        const today = new Date().toISOString().split('T')[0] as DateString;
        const entryId = `${id}_${today}_${Date.now()}`;
        const scheduledDaysJson = JSON.stringify(updates.scheduledDays);

        await db.runAsync(
          `INSERT INTO habit_schedule_history (id, habit_id, scheduled_days, effective_from_date, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [entryId, id, scheduledDaysJson, today, Date.now()]
        );
      }

      // Build UPDATE query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }
      if (updates.color !== undefined) {
        updateFields.push('color = ?');
        updateValues.push(updates.color);
      }
      if (updates.icon !== undefined) {
        updateFields.push('icon = ?');
        updateValues.push(updates.icon);
      }
      if (updates.scheduledDays !== undefined) {
        updateFields.push('scheduled_days = ?');
        updateValues.push(JSON.stringify(updates.scheduledDays));
      }
      if (updates.order !== undefined) {
        updateFields.push('order_index = ?');
        updateValues.push(updates.order);
      }
      if (updates.isActive !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(updates.isActive ? 1 : 0);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.description);
      }

      // Always update updated_at
      updateFields.push('updated_at = ?');
      updateValues.push(Date.now());

      if (updateFields.length === 0) {
        return currentHabit;
      }

      updateValues.push(id); // WHERE id = ?

      await db.runAsync(
        `UPDATE habits SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      const updatedHabit = await this.getById(id);
      if (!updatedHabit) throw new Error('Failed to retrieve updated habit');

      return updatedHabit;
    } catch (error) {
      console.error(`❌ SQLite update habit failed (${id}):`, error);
      throw new Error(`Failed to update habit: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = this.getDb();

      // Soft delete - mark as archived
      await db.runAsync(
        `UPDATE habits SET is_archived = 1, updated_at = ? WHERE id = ?`,
        [Date.now(), id]
      );

      // Also delete related completions
      await this.deleteCompletionsByHabitId(id);
    } catch (error) {
      console.error(`❌ SQLite delete habit failed (${id}):`, error);
      throw new Error(`Failed to delete habit: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      const db = this.getDb();
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM habits WHERE is_archived = 0`
      );
      return result?.count || 0;
    } catch (error) {
      console.error('❌ SQLite count habits failed:', error);
      throw new Error(`Failed to count habits: ${error}`);
    }
  }

  // ========================================
  // HABIT COMPLETIONS
  // ========================================

  async getAllCompletions(): Promise<HabitCompletion[]> {
    try {
      const db = this.getDb();
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM habit_completions ORDER BY date DESC, created_at DESC`
      );

      return rows.map(row => this.rowToCompletion(row));
    } catch (error) {
      console.error('❌ SQLite getAllCompletions failed:', error);
      throw new Error(`Failed to get all completions: ${error}`);
    }
  }

  async getCompletionsByHabitId(habitId: string): Promise<HabitCompletion[]> {
    try {
      const db = this.getDb();
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM habit_completions WHERE habit_id = ? ORDER BY date DESC`,
        [habitId]
      );

      return rows.map(row => this.rowToCompletion(row));
    } catch (error) {
      console.error(`❌ SQLite getCompletionsByHabitId failed (${habitId}):`, error);
      throw new Error(`Failed to get completions: ${error}`);
    }
  }

  async getCompletionsByDate(date: DateString): Promise<HabitCompletion[]> {
    try {
      const db = this.getDb();
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM habit_completions WHERE date = ? ORDER BY created_at DESC`,
        [date]
      );

      return rows.map(row => this.rowToCompletion(row));
    } catch (error) {
      console.error(`❌ SQLite getCompletionsByDate failed (${date}):`, error);
      throw new Error(`Failed to get completions: ${error}`);
    }
  }

  async getCompletion(habitId: string, date: DateString): Promise<HabitCompletion | null> {
    try {
      const db = this.getDb();
      const row = await db.getFirstAsync<any>(
        `SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?`,
        [habitId, date]
      );

      if (!row) return null;
      return this.rowToCompletion(row);
    } catch (error) {
      console.error(`❌ SQLite getCompletion failed (${habitId}, ${date}):`, error);
      throw new Error(`Failed to get completion: ${error}`);
    }
  }

  async createCompletion(
    habitId: string,
    date: DateString,
    isBonus: boolean = false,
    note?: string
  ): Promise<HabitCompletion> {
    try {
      const db = this.getDb();

      // Check if completion already exists
      const existing = await this.getCompletion(habitId, date);
      if (existing) {
        throw new Error(`Completion for habit ${habitId} on ${date} already exists`);
      }

      const completionId = `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      await db.runAsync(
        `INSERT INTO habit_completions (
          id, habit_id, date, completed, is_bonus, completed_at, note,
          is_converted, converted_from_date, converted_to_date, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          completionId,
          habitId,
          date,
          1, // completed = true
          isBonus ? 1 : 0,
          now,
          note || null,
          0, // is_converted = false
          null,
          null,
          now,
          now,
        ]
      );

      // Award XP
      const habit = await this.getById(habitId);
      const xpAmount = isBonus ? XP_REWARDS.HABIT.BONUS_COMPLETION : XP_REWARDS.HABIT.SCHEDULED_COMPLETION;
      const xpSource = isBonus ? XPSourceType.HABIT_BONUS : XPSourceType.HABIT_COMPLETION;
      const description = isBonus ?
        `Completed bonus habit: ${habit?.name || 'Unknown'}` :
        `Completed scheduled habit: ${habit?.name || 'Unknown'}`;

      await GamificationService.addXP(xpAmount, {
        source: xpSource,
        description,
        sourceId: habitId
      });

      console.log(`✅ Habit completion created (+${xpAmount} XP)`);

      const completion = await this.getCompletion(habitId, date);
      if (!completion) throw new Error('Failed to retrieve created completion');

      return completion;
    } catch (error) {
      console.error('❌ SQLite createCompletion failed:', error);
      throw new Error(`Failed to create completion: ${error}`);
    }
  }

  async updateCompletion(id: string, updates: Partial<HabitCompletion>): Promise<HabitCompletion> {
    try {
      const db = this.getDb();

      // Build UPDATE query
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.completed !== undefined) {
        updateFields.push('completed = ?');
        updateValues.push(updates.completed ? 1 : 0);
      }
      if (updates.isBonus !== undefined) {
        updateFields.push('is_bonus = ?');
        updateValues.push(updates.isBonus ? 1 : 0);
      }
      if (updates.note !== undefined) {
        updateFields.push('note = ?');
        updateValues.push(updates.note);
      }
      if (updates.isConverted !== undefined) {
        updateFields.push('is_converted = ?');
        updateValues.push(updates.isConverted ? 1 : 0);
      }
      if (updates.convertedFromDate !== undefined) {
        updateFields.push('converted_from_date = ?');
        updateValues.push(updates.convertedFromDate);
      }
      if (updates.convertedToDate !== undefined) {
        updateFields.push('converted_to_date = ?');
        updateValues.push(updates.convertedToDate);
      }

      // Always update updated_at
      updateFields.push('updated_at = ?');
      updateValues.push(Date.now());

      updateValues.push(id);

      await db.runAsync(
        `UPDATE habit_completions SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Get updated completion
      const row = await db.getFirstAsync<any>(
        `SELECT * FROM habit_completions WHERE id = ?`,
        [id]
      );

      if (!row) throw new Error(`Completion with id ${id} not found after update`);
      return this.rowToCompletion(row);
    } catch (error) {
      console.error(`❌ SQLite updateCompletion failed (${id}):`, error);
      throw new Error(`Failed to update completion: ${error}`);
    }
  }

  async deleteCompletion(id: string): Promise<void> {
    try {
      const db = this.getDb();

      // Get completion info for XP calculation
      const row = await db.getFirstAsync<any>(
        `SELECT * FROM habit_completions WHERE id = ?`,
        [id]
      );

      if (!row) {
        throw new Error(`Completion with id ${id} not found`);
      }

      const completion = this.rowToCompletion(row);
      const habit = await this.getById(completion.habitId);

      // Delete completion
      await db.runAsync(`DELETE FROM habit_completions WHERE id = ?`, [id]);

      // Subtract XP
      const xpAmount = completion.isBonus ? XP_REWARDS.HABIT.BONUS_COMPLETION : XP_REWARDS.HABIT.SCHEDULED_COMPLETION;
      const xpSource = completion.isBonus ? XPSourceType.HABIT_BONUS : XPSourceType.HABIT_COMPLETION;
      const description = completion.isBonus ?
        `Uncompleted bonus habit: ${habit?.name || 'Unknown'}` :
        `Uncompleted scheduled habit: ${habit?.name || 'Unknown'}`;

      await GamificationService.subtractXP(xpAmount, {
        source: xpSource,
        description,
        sourceId: completion.habitId
      });

      console.log(`✅ Habit completion deleted (-${xpAmount} XP)`);
    } catch (error) {
      console.error(`❌ SQLite deleteCompletion failed (${id}):`, error);
      throw new Error(`Failed to delete completion: ${error}`);
    }
  }

  async deleteCompletionsByHabitId(habitId: string): Promise<void> {
    try {
      const db = this.getDb();
      await db.runAsync(`DELETE FROM habit_completions WHERE habit_id = ?`, [habitId]);
    } catch (error) {
      console.error(`❌ SQLite deleteCompletionsByHabitId failed (${habitId}):`, error);
      throw new Error(`Failed to delete completions: ${error}`);
    }
  }

  async toggleCompletion(habitId: string, date: DateString, isBonus: boolean = false): Promise<HabitCompletion | null> {
    try {
      const existingCompletion = await this.getCompletion(habitId, date);

      if (existingCompletion) {
        // If completed, remove the completion
        console.log(`🔄 Habit toggle: REMOVING completion for habit ${habitId} (${isBonus ? 'bonus' : 'scheduled'})`);
        await this.deleteCompletion(existingCompletion.id);
        return null;
      } else {
        // If not completed, create completion (XP will be awarded in createCompletion)
        console.log(`🔄 Habit toggle: CREATING completion for habit ${habitId} (${isBonus ? 'bonus' : 'scheduled'})`);
        return await this.createCompletion(habitId, date, isBonus);
      }
    } catch (error) {
      console.error(`❌ SQLite toggleCompletion failed (${habitId}, ${date}):`, error);
      throw new Error(`Failed to toggle completion: ${error}`);
    }
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async updateHabitOrder(habitOrders: { id: string; order: number }[]): Promise<void> {
    try {
      const db = this.getDb();

      await db.execAsync('BEGIN TRANSACTION;');

      try {
        for (const item of habitOrders) {
          await db.runAsync(
            `UPDATE habits SET order_index = ?, updated_at = ? WHERE id = ?`,
            [item.order, Date.now(), item.id]
          );
        }

        await db.execAsync('COMMIT;');
      } catch (error) {
        await db.execAsync('ROLLBACK;');
        throw error;
      }
    } catch (error) {
      console.error('❌ SQLite updateHabitOrder failed:', error);
      throw new Error(`Failed to update habit order: ${error}`);
    }
  }

  async getUniqueHabitsCompletedOnDate(date: DateString): Promise<string[]> {
    try {
      const completions = await this.getCompletionsByDate(date);
      const uniqueHabitIds = [...new Set(completions.map(c => c.habitId))];
      return uniqueHabitIds;
    } catch (error) {
      console.error('❌ SQLite getUniqueHabitsCompletedOnDate error:', error);
      return [];
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private rowToHabit(row: any): Habit {
    const scheduledDays: DayOfWeek[] = JSON.parse(row.scheduled_days);

    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      scheduledDays,
      isActive: row.is_active === 1,
      description: row.description || undefined,
      order: row.order_index,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      // scheduleHistory will be loaded separately if needed
    };
  }

  private rowToCompletion(row: any): HabitCompletion {
    return {
      id: row.id,
      habitId: row.habit_id,
      date: row.date as DateString,
      completed: row.completed === 1,
      isBonus: row.is_bonus === 1,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      note: row.note || undefined,
      isConverted: row.is_converted === 1,
      convertedFromDate: row.converted_from_date as DateString | undefined,
      convertedToDate: row.converted_to_date as DateString | undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // ========================================
  // SCHEDULE HISTORY
  // ========================================

  async getScheduleHistory(habitId: string): Promise<ScheduleTimeline | undefined> {
    try {
      const db = this.getDb();
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM habit_schedule_history WHERE habit_id = ? ORDER BY effective_from_date ASC`,
        [habitId]
      );

      if (rows.length === 0) return undefined;

      const entries = rows.map(row => ({
        scheduledDays: JSON.parse(row.scheduled_days) as DayOfWeek[],
        effectiveFromDate: row.effective_from_date as DateString,
      }));

      return { entries };
    } catch (error) {
      console.error(`❌ SQLite getScheduleHistory failed (${habitId}):`, error);
      return undefined;
    }
  }
}

// Export singleton instance
export const sqliteHabitStorage = new SQLiteHabitStorage();
