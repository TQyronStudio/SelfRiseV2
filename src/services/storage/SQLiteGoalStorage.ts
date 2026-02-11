/**
 * SQLite implementation of Goal Storage
 * Phase 1.3.4 - Goals storage using SQLite
 */

import { Goal, GoalProgress, CreateGoalInput, GoalStatus, AddGoalProgressInput, GoalStats, GoalTimelineStatus } from '../../types/goal';
import { EntityStorage, StorageError, STORAGE_ERROR_CODES, STORAGE_KEYS } from './base';
import { createGoal, updateEntityTimestamp, updateGoalValue, createBaseEntity } from '../../utils/data';
import { DateString } from '../../types/common';
import { today } from '../../utils/date';
import { GamificationService } from '../gamificationService';
import { XPSourceType } from '../../types/gamification';
import { XP_REWARDS } from '../../constants/gamification';
import { getDatabase } from '../database/init';
import { calculateTimelineStatus } from './goalStorage';

export class SQLiteGoalStorage implements EntityStorage<Goal> {

  // ========================================
  // GOAL CRUD OPERATIONS
  // ========================================

  async getAll(): Promise<Goal[]> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<any>('SELECT * FROM goals ORDER BY order_index ASC');

      const goals: Goal[] = rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        unit: row.unit,
        targetValue: row.target_value,
        currentValue: row.current_value,
        targetDate: row.target_date || undefined,
        category: row.category,
        status: row.status as GoalStatus,
        order: row.order_index,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedDate: row.completed_at || undefined,
        startDate: row.start_date || new Date(row.created_at).toISOString().split('T')[0]!,
      }));

      console.log(`📊 SQLite getAll: Found ${goals.length} goals`);
      return goals;
    } catch (error) {
      console.error('❌ SQLite getAll goals error:', error);
      throw new StorageError(
        'Failed to get all goals',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async getById(id: string): Promise<Goal | null> {
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM goals WHERE id = ?',
        [id]
      );

      if (!row) return null;

      // Get milestones for this goal
      const milestones = await db.getAllAsync<any>(
        'SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY value ASC',
        [id]
      );

      const goal: Goal = {
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        unit: row.unit,
        targetValue: row.target_value,
        currentValue: row.current_value,
        targetDate: row.target_date || undefined,
        category: row.category,
        status: row.status as GoalStatus,
        order: row.order_index,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedDate: row.completed_at || undefined,
        startDate: row.start_date || new Date(row.created_at).toISOString().split('T')[0]!,
      };

      return goal;
    } catch (error) {
      console.error(`❌ SQLite getById goal error (${id}):`, error);
      throw new StorageError(
        `Failed to get goal with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async create(input: CreateGoalInput): Promise<Goal> {
    try {
      const db = getDatabase();

      // Get max order
      const maxOrderRow = await db.getFirstAsync<any>(
        'SELECT MAX(order_index) as max_order FROM goals'
      );
      const maxOrder = maxOrderRow?.max_order ?? -1;

      const newGoal = createGoal(input, maxOrder + 1);

      // Convert timestamps
      const createdAtTimestamp = newGoal.createdAt instanceof Date
        ? newGoal.createdAt.getTime()
        : newGoal.createdAt;
      const updatedAtTimestamp = newGoal.updatedAt instanceof Date
        ? newGoal.updatedAt.getTime()
        : newGoal.updatedAt;

      await db.runAsync(
        `INSERT INTO goals (
          id, title, description, unit, target_value, current_value, target_date,
          category, status, order_index, start_date, created_at, updated_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newGoal.id,
          newGoal.title,
          newGoal.description || null,
          newGoal.unit,
          newGoal.targetValue,
          newGoal.currentValue || 0,
          newGoal.targetDate || null,
          newGoal.category,
          newGoal.status,
          newGoal.order,
          newGoal.startDate,
          createdAtTimestamp,
          updatedAtTimestamp,
          newGoal.completedDate || null,
        ]
      );

      console.log(`✅ SQLite create: Goal created (${newGoal.title})`);
      return newGoal;
    } catch (error) {
      console.error('❌ SQLite create goal error:', error);
      throw new StorageError(
        'Failed to create goal',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      const db = getDatabase();

      const currentGoal = await this.getById(id);
      if (!currentGoal) {
        throw new StorageError(
          `Goal with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GOALS
        );
      }

      const updatedGoal = updateEntityTimestamp({
        ...currentGoal,
        ...updates,
      } as Goal);

      // Convert timestamps
      // Convert updatedAt to timestamp
      let updatedAtTimestamp: number;
      if (typeof updatedGoal.updatedAt === 'number') {
        updatedAtTimestamp = updatedGoal.updatedAt;
      } else if (updatedGoal.updatedAt instanceof Date) {
        updatedAtTimestamp = updatedGoal.updatedAt.getTime();
      } else {
        updatedAtTimestamp = new Date(updatedGoal.updatedAt as any).getTime();
      }

      // Convert completedDate to timestamp
      // Note: completedDate type is DateString | undefined, but in practice can be number | Date | string
      let completedAtTimestamp: number | null = null;
      const completedDate = updatedGoal.completedDate as any;
      if (completedDate !== undefined && completedDate !== null) {
        if (typeof completedDate === 'number') {
          completedAtTimestamp = completedDate;
        } else if (completedDate instanceof Date) {
          completedAtTimestamp = completedDate.getTime();
        } else {
          // It's a string (DateString)
          completedAtTimestamp = new Date(completedDate).getTime();
        }
      }

      await db.runAsync(
        `UPDATE goals SET
          title = ?, description = ?, unit = ?, target_value = ?, current_value = ?,
          target_date = ?, category = ?, status = ?, order_index = ?, start_date = ?,
          updated_at = ?, completed_at = ?
        WHERE id = ?`,
        [
          updatedGoal.title,
          updatedGoal.description || null,
          updatedGoal.unit,
          updatedGoal.targetValue,
          updatedGoal.currentValue,
          updatedGoal.targetDate || null,
          updatedGoal.category,
          updatedGoal.status,
          updatedGoal.order,
          updatedGoal.startDate,
          updatedAtTimestamp,
          completedAtTimestamp,
          id,
        ]
      );

      console.log(`✅ SQLite update: Goal updated (${id})`);
      return updatedGoal;
    } catch (error) {
      console.error(`❌ SQLite update goal error (${id}):`, error);
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to update goal with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = getDatabase();

      const goal = await this.getById(id);
      if (!goal) {
        throw new StorageError(
          `Goal with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GOALS
        );
      }

      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM goal_progress WHERE goal_id = ?', [id]);
        await db.runAsync('DELETE FROM goal_milestones WHERE goal_id = ?', [id]);
        await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
      });

      console.log(`✅ SQLite delete: Goal deleted (${id})`);
    } catch (error) {
      console.error(`❌ SQLite delete goal error (${id}):`, error);
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to delete goal with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async deleteAll(): Promise<void> {
    try {
      const db = getDatabase();

      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM goal_progress');
        await db.runAsync('DELETE FROM goal_milestones');
        await db.runAsync('DELETE FROM goals');
      });

      console.log('✅ SQLite deleteAll: All goals deleted');
    } catch (error) {
      console.error('❌ SQLite deleteAll goals error:', error);
      throw new StorageError(
        'Failed to delete all goals',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async count(): Promise<number> {
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM goals');
      return row?.count || 0;
    } catch (error) {
      console.error('❌ SQLite count goals error:', error);
      throw new StorageError(
        'Failed to count goals',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  // ========================================
  // STATUS-SPECIFIC OPERATIONS
  // ========================================

  async getByStatus(status: GoalStatus): Promise<Goal[]> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM goals WHERE status = ? ORDER BY order_index ASC',
        [status]
      );

      const goals: Goal[] = rows.map(row => ({
        id: row.id,
        title: row.title,
        unit: row.unit,
        targetValue: row.target_value,
        currentValue: row.current_value,
        targetDate: row.target_date || undefined,
        category: row.category,
        status: row.status as GoalStatus,
        order: row.order_index,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedDate: row.completed_at || undefined,
        startDate: new Date(row.created_at).toISOString().split('T')[0]!,
        orderIndex: row.order_index,
        milestones: [],
      }));

      return goals;
    } catch (error) {
      console.error(`❌ SQLite getByStatus goals error (${status}):`, error);
      throw new StorageError(
        `Failed to get goals with status ${status}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async getActiveGoals(): Promise<Goal[]> {
    return this.getByStatus(GoalStatus.ACTIVE);
  }

  async getCompletedGoals(): Promise<Goal[]> {
    return this.getByStatus(GoalStatus.COMPLETED);
  }

  // ========================================
  // GOAL PROGRESS OPERATIONS
  // ========================================

  async getAllProgress(): Promise<GoalProgress[]> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM goal_progress ORDER BY date DESC'
      );

      const progress: GoalProgress[] = rows.map(row => ({
        id: row.id,
        goalId: row.goal_id,
        value: row.value,
        note: row.note,
        date: row.date,
        progressType: row.progress_type || 'add',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      console.log(`📊 SQLite getAllProgress: Found ${progress.length} progress records`);
      return progress;
    } catch (error) {
      console.error('❌ SQLite getAllProgress error:', error);
      return [];
    }
  }

  async getProgressByGoalId(goalId: string): Promise<GoalProgress[]> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM goal_progress WHERE goal_id = ? ORDER BY date DESC',
        [goalId]
      );

      const progress: GoalProgress[] = rows.map(row => ({
        id: row.id,
        goalId: row.goal_id,
        value: row.value,
        note: row.note,
        date: row.date,
        progressType: row.progress_type || 'add',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return progress;
    } catch (error) {
      console.error(`❌ SQLite getProgressByGoalId error (${goalId}):`, error);
      return [];
    }
  }

  async addProgress(input: AddGoalProgressInput): Promise<GoalProgress> {
    try {
      const db = getDatabase();

      // Verify goal exists
      const goal = await this.getById(input.goalId);
      if (!goal) {
        throw new StorageError(
          `Goal with id ${input.goalId} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GOALS
        );
      }

      // Store previous values for milestone detection
      const previousCurrentValue = goal.currentValue;
      const previousCompletionPercentage = goal.targetValue > 0 ? (previousCurrentValue / goal.targetValue) * 100 : 0;

      // Create progress entry
      const baseEntity = createBaseEntity();
      const newProgress: GoalProgress = {
        ...baseEntity,
        goalId: input.goalId,
        value: input.value,
        note: input.note,
        date: input.date,
        progressType: input.progressType,
      };

      // Convert Date objects to timestamps (milliseconds) for SQLite
      const createdAtTimestamp = baseEntity.createdAt instanceof Date
        ? baseEntity.createdAt.getTime()
        : baseEntity.createdAt;
      const updatedAtTimestamp = baseEntity.updatedAt instanceof Date
        ? baseEntity.updatedAt.getTime()
        : baseEntity.updatedAt;

      console.log('🔍 DEBUG addProgress - timestamps:', {
        createdAt: createdAtTimestamp,
        updatedAt: updatedAtTimestamp,
      });

      await db.runAsync(
        `INSERT INTO goal_progress (id, goal_id, value, date, note, progress_type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newProgress.id,
          newProgress.goalId,
          newProgress.value,
          newProgress.date,
          newProgress.note || null,
          newProgress.progressType,
          createdAtTimestamp,
          updatedAtTimestamp,
        ]
      );

      // Update goal's current value
      const updatedGoal = updateGoalValue(goal, input.value, input.progressType);
      const newCompletionPercentage = goal.targetValue > 0 ? (updatedGoal.currentValue / goal.targetValue) * 100 : 0;

      await this.update(input.goalId, {
        currentValue: updatedGoal.currentValue,
        status: updatedGoal.status,
        completedDate: updatedGoal.completedDate || undefined
      });

      // Handle XP for goal progress
      if (input.progressType === 'subtract' && input.value > 0) {
        await GamificationService.subtractXP(XP_REWARDS.GOALS.PROGRESS_ENTRY, {
          source: XPSourceType.GOAL_PROGRESS,
          description: `Goal negative progress: ${goal.title} (-${input.value})`,
          sourceId: input.goalId
        });
        console.log(`🎯 Goal negative progress: ${goal.title} (-${input.value}, -${XP_REWARDS.GOALS.PROGRESS_ENTRY} XP)`);
      } else if (input.progressType === 'add' && input.value > 0) {
        await GamificationService.addXP(XP_REWARDS.GOALS.PROGRESS_ENTRY, {
          source: XPSourceType.GOAL_PROGRESS,
          description: `Goal progress: ${goal.title} (+${input.value})`,
          sourceId: input.goalId
        });
        console.log(`🎯 Goal positive progress: ${goal.title} (+${input.value}, +${XP_REWARDS.GOALS.PROGRESS_ENTRY} XP)`);
      }

      // Check for goal completion
      const isCompleted = updatedGoal.status === GoalStatus.COMPLETED;
      const wasCompleted = goal.status === GoalStatus.COMPLETED;
      const justCompleted = isCompleted && !wasCompleted;

      console.log(`🎯 Goal completion check: ${goal.title}`);
      console.log(`   Previous: ${previousCompletionPercentage}% (${goal.currentValue}/${goal.targetValue})`);
      console.log(`   New: ${newCompletionPercentage}% (${updatedGoal.currentValue}/${goal.targetValue})`);
      console.log(`   Status: ${goal.status} → ${updatedGoal.status}`);

      if (justCompleted) {
        const completionXP = goal.targetValue >= 10000 ? XP_REWARDS.GOALS.BIG_GOAL_COMPLETION : XP_REWARDS.GOALS.GOAL_COMPLETION;
        await GamificationService.addXP(completionXP, {
          source: XPSourceType.GOAL_COMPLETION,
          description: `🎉 Goal completed: ${goal.title}`,
          sourceId: goal.id
        });
        console.log(`🏆 Goal completed: ${goal.title} (+${completionXP} XP${goal.targetValue >= 10000 ? ' BIG GOAL' : ''})`);
      }

      return newProgress;
    } catch (error) {
      console.error(`❌ SQLite addProgress error (${input.goalId}):`, error);
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to add progress to goal ${input.goalId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOAL_PROGRESS
      );
    }
  }

  async updateProgress(id: string, updates: Partial<GoalProgress>): Promise<GoalProgress> {
    try {
      const db = getDatabase();

      const currentProgress = await db.getFirstAsync<any>(
        'SELECT * FROM goal_progress WHERE id = ?',
        [id]
      );

      if (!currentProgress) {
        throw new StorageError(
          `Progress with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GOAL_PROGRESS
        );
      }

      const updatedProgress: GoalProgress = {
        id: currentProgress.id,
        goalId: currentProgress.goal_id,
        value: updates.value ?? currentProgress.value,
        note: updates.note ?? currentProgress.note,
        date: updates.date ?? currentProgress.date,
        progressType: updates.progressType ?? currentProgress.progress_type,
        createdAt: new Date(currentProgress.created_at),
        updatedAt: new Date(),
      };

      await db.runAsync(
        `UPDATE goal_progress SET value = ?, note = ?, date = ?, progress_type = ?, updated_at = ?
         WHERE id = ?`,
        [
          updatedProgress.value,
          updatedProgress.note,
          updatedProgress.date,
          updatedProgress.progressType,
          updatedProgress.updatedAt.getTime(),
          id,
        ]
      );

      // If value changed, recalculate goal's current value
      if (updates.value !== undefined || updates.progressType !== undefined) {
        await this.recalculateGoalValue(updatedProgress.goalId);
      }

      return updatedProgress;
    } catch (error) {
      console.error(`❌ SQLite updateProgress error (${id}):`, error);
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to update progress with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOAL_PROGRESS
      );
    }
  }

  async deleteProgress(id: string): Promise<void> {
    try {
      const db = getDatabase();

      const progressToDelete = await db.getFirstAsync<any>(
        'SELECT * FROM goal_progress WHERE id = ?',
        [id]
      );

      if (!progressToDelete) {
        throw new StorageError(
          `Progress with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GOAL_PROGRESS
        );
      }

      const goal = await this.getById(progressToDelete.goal_id);

      if (goal) {
        console.log(`🗑️ Goal progress deleted: ${goal.title} (${progressToDelete.progress_type}: ${progressToDelete.value})`);

        // Handle XP for deleted progress
        const progressValue = progressToDelete.value;
        const progressType = progressToDelete.progress_type;

        if (progressType === 'add' && progressValue > 0) {
          await GamificationService.subtractXP(XP_REWARDS.GOALS.PROGRESS_ENTRY, {
            source: XPSourceType.GOAL_PROGRESS,
            description: `Deleted goal progress: ${goal.title} (-${progressValue})`,
            sourceId: progressToDelete.goal_id
          });
          console.log(`🔻 Subtracted ${XP_REWARDS.GOALS.PROGRESS_ENTRY} XP for deleted positive progress`);
        } else if (progressType === 'subtract' && progressValue > 0) {
          await GamificationService.addXP(XP_REWARDS.GOALS.PROGRESS_ENTRY, {
            source: XPSourceType.GOAL_PROGRESS,
            description: `Reversed goal subtraction: ${goal.title} (+${progressValue})`,
            sourceId: progressToDelete.goal_id
          });
          console.log(`🔺 Added ${XP_REWARDS.GOALS.PROGRESS_ENTRY} XP for reversing negative progress`);
        }
      }

      await db.runAsync('DELETE FROM goal_progress WHERE id = ?', [id]);
      await this.recalculateGoalValue(progressToDelete.goal_id);

      console.log(`✅ SQLite deleteProgress: Progress deleted (${id})`);
    } catch (error) {
      console.error(`❌ SQLite deleteProgress error (${id}):`, error);
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to delete progress with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOAL_PROGRESS
      );
    }
  }

  async deleteProgressByGoalId(goalId: string): Promise<void> {
    try {
      const db = getDatabase();

      const goal = await this.getById(goalId);
      const progressCount = await db.getFirstAsync<any>(
        'SELECT COUNT(*) as count FROM goal_progress WHERE goal_id = ?',
        [goalId]
      );

      if (goal && progressCount) {
        console.log(`🗑️ Bulk goal progress deletion: ${goal.title} (${progressCount.count} entries)`);
      }

      await db.runAsync('DELETE FROM goal_progress WHERE goal_id = ?', [goalId]);
    } catch (error) {
      console.error(`❌ SQLite deleteProgressByGoalId error (${goalId}):`, error);
      throw new StorageError(
        `Failed to delete progress for goal ${goalId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOAL_PROGRESS
      );
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private async recalculateGoalValue(goalId: string): Promise<void> {
    try {
      const goal = await this.getById(goalId);
      if (!goal) return;

      const progress = await this.getProgressByGoalId(goalId);

      // Recalculate current value from all progress entries
      let currentValue = 0;
      for (const entry of progress.reverse()) {
        switch (entry.progressType) {
          case 'add':
            currentValue += entry.value;
            break;
          case 'subtract':
            currentValue = Math.max(0, currentValue - entry.value);
            break;
          case 'set':
            currentValue = Math.max(0, entry.value);
            break;
        }
      }

      // Update goal status if needed
      const isCompleted = currentValue >= goal.targetValue;
      const wasCompleted = goal.status === GoalStatus.COMPLETED;
      const shouldBeCompleted = isCompleted && goal.status === GoalStatus.ACTIVE;
      const shouldBeActive = !isCompleted && goal.status === GoalStatus.COMPLETED;

      let status = goal.status;
      if (shouldBeCompleted) {
        status = GoalStatus.COMPLETED;
      } else if (shouldBeActive) {
        status = GoalStatus.ACTIVE;
      }

      // Handle XP for goal completion status changes
      const completionXP = goal.targetValue >= 10000 ? XP_REWARDS.GOALS.BIG_GOAL_COMPLETION : XP_REWARDS.GOALS.GOAL_COMPLETION;
      if (shouldBeCompleted) {
        await GamificationService.addXP(completionXP, {
          source: XPSourceType.GOAL_COMPLETION,
          description: `🎉 Goal completed: ${goal.title}`,
          sourceId: goal.id
        });
        console.log(`🏆 Goal completed during recalculation: ${goal.title} (+${completionXP} XP)`);
      } else if (shouldBeActive && wasCompleted) {
        await GamificationService.subtractXP(completionXP, {
          source: XPSourceType.GOAL_COMPLETION,
          description: `📉 Goal dropped below completion: ${goal.title}`,
          sourceId: goal.id
        });
        console.log(`📉 Goal completion reversed: ${goal.title} (-${completionXP} XP)`);
      }

      await this.update(goalId, {
        currentValue,
        status,
        completedDate: isCompleted && !goal.completedDate ? new Date().toISOString().split('T')[0]! : goal.completedDate || undefined
      });
    } catch (error) {
      console.error(`❌ SQLite recalculateGoalValue error (${goalId}):`, error);
      throw new StorageError(
        `Failed to recalculate value for goal ${goalId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async updateGoalOrder(goalOrders: Array<{ id: string; order: number }>): Promise<void> {
    try {
      const db = getDatabase();

      await db.withTransactionAsync(async () => {
        for (const { id, order } of goalOrders) {
          await db.runAsync(
            'UPDATE goals SET order_index = ?, updated_at = ? WHERE id = ?',
            [order, Date.now(), id]
          );
        }
      });

      console.log(`✅ SQLite updateGoalOrder: Updated ${goalOrders.length} goal orders`);
    } catch (error) {
      console.error('❌ SQLite updateGoalOrder error:', error);
      throw new StorageError(
        'Failed to update goal order',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  // ========================================
  // STATISTICS
  // ========================================

  async getCompletionRate(): Promise<number> {
    try {
      const db = getDatabase();
      const totalRow = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM goals');
      const completedRow = await db.getFirstAsync<any>(
        'SELECT COUNT(*) as count FROM goals WHERE status = ?',
        [GoalStatus.COMPLETED]
      );

      const total = totalRow?.count || 0;
      const completed = completedRow?.count || 0;

      if (total === 0) return 0;
      return (completed / total) * 100;
    } catch (error) {
      console.error('❌ SQLite getCompletionRate error:', error);
      throw new StorageError(
        'Failed to get goal completion rate',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async getGoalStats(goalId: string): Promise<GoalStats> {
    try {
      const goal = await this.getById(goalId);
      if (!goal) {
        return {
          goalId,
          totalProgress: 0,
          progressEntries: 0,
          averageDaily: 0,
          daysActive: 0,
          daysWithProgress: 0,
          completionPercentage: 0,
          isOnTrack: false,
          timelineStatus: 'onTrack' as GoalTimelineStatus,
        };
      }

      const progress = await this.getProgressByGoalId(goalId);

      const sortedProgress = progress.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      const totalProgress = sortedProgress.reduce((sum, entry) => {
        switch (entry.progressType) {
          case 'add':
            return sum + entry.value;
          case 'subtract':
            return sum - entry.value;
          case 'set':
            return entry.value;
          default:
            return sum;
        }
      }, 0);

      const progressEntries = sortedProgress.length;
      const startDate = new Date(goal.startDate);
      const todayDate = new Date();
      const daysActive = Math.ceil((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const uniqueProgressDays = new Set(sortedProgress.map(p => p.date)).size;
      const averageDaily = uniqueProgressDays > 0 ? totalProgress / uniqueProgressDays : 0;
      const completionPercentage = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;

      let estimatedCompletionDate: DateString | undefined;
      let isOnTrack = false;

      if (goal.targetDate && averageDaily > 0) {
        const remainingValue = goal.targetValue - totalProgress;
        const daysToComplete = Math.ceil(remainingValue / averageDaily);
        const estimatedDate = new Date(todayDate.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
        estimatedCompletionDate = estimatedDate.toISOString().split('T')[0] as DateString;

        let targetDate: Date;
        if (goal.targetDate.includes('.')) {
          const parts = goal.targetDate.split('.');
          if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
            targetDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            targetDate = new Date(goal.targetDate);
          }
        } else {
          targetDate = new Date(goal.targetDate);
        }
        isOnTrack = estimatedDate <= targetDate;
      }

      const timelineStatus = calculateTimelineStatus(estimatedCompletionDate, goal.targetDate);

      return {
        goalId,
        totalProgress,
        progressEntries,
        averageDaily,
        daysActive,
        daysWithProgress: uniqueProgressDays,
        completionPercentage,
        estimatedCompletionDate: estimatedCompletionDate || undefined,
        isOnTrack,
        timelineStatus,
      };
    } catch (error) {
      console.error(`❌ SQLite getGoalStats error (${goalId}):`, error);
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to get stats for goal ${goalId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async cleanupInvalidData(): Promise<void> {
    // SQLite enforces data integrity at database level, no cleanup needed
    console.log('✅ SQLite cleanupInvalidData: Not needed (database enforces integrity)');
  }

  // ========================================
  // ACHIEVEMENT STATISTICS
  // ========================================

  async getAchievementStats(): Promise<{
    totalGoalsCompleted: number;
    totalGoalsCreated: number;
    bigGoalsCompleted: number;
    averageGoalValue: number;
    goalCompletionRate: number;
    totalProgressEntries: number;
    goalsWithProgressToday: number;
    consecutiveGoalProgressDays: number;
  }> {
    try {
      const db = getDatabase();
      const todayString = today();

      const allGoals = await this.getAll();
      const allProgress = await this.getAllProgress();

      const totalGoalsCreated = allGoals.length;
      const completedGoals = allGoals.filter(g => g.status === GoalStatus.COMPLETED);
      const totalGoalsCompleted = completedGoals.length;
      const bigGoalsCompleted = completedGoals.filter(g => g.targetValue >= 10000).length;

      const averageGoalValue = totalGoalsCreated > 0
        ? allGoals.reduce((sum, g) => sum + g.targetValue, 0) / totalGoalsCreated
        : 0;

      const goalCompletionRate = totalGoalsCreated > 0
        ? (totalGoalsCompleted / totalGoalsCreated) * 100
        : 0;

      const totalProgressEntries = allProgress.length;
      const todayProgress = allProgress.filter(p => p.date === todayString);
      const uniqueGoalsWithProgressToday = new Set(todayProgress.map(p => p.goalId)).size;

      const consecutiveGoalProgressDays = await this.calculateConsecutiveProgressDays();

      return {
        totalGoalsCompleted,
        totalGoalsCreated,
        bigGoalsCompleted,
        averageGoalValue: Math.round(averageGoalValue),
        goalCompletionRate: Math.round(goalCompletionRate * 100) / 100,
        totalProgressEntries,
        goalsWithProgressToday: uniqueGoalsWithProgressToday,
        consecutiveGoalProgressDays,
      };
    } catch (error) {
      console.error('❌ SQLite getAchievementStats error:', error);
      return {
        totalGoalsCompleted: 0,
        totalGoalsCreated: 0,
        bigGoalsCompleted: 0,
        averageGoalValue: 0,
        goalCompletionRate: 0,
        totalProgressEntries: 0,
        goalsWithProgressToday: 0,
        consecutiveGoalProgressDays: 0,
      };
    }
  }

  private async calculateConsecutiveProgressDays(): Promise<number> {
    try {
      const allProgress = await this.getAllProgress();
      if (allProgress.length === 0) return 0;

      const progressDates = [...new Set(allProgress.map(p => p.date))]
        .sort((a, b) => b.localeCompare(a));

      if (progressDates.length === 0) return 0;

      const todayString = today();
      let consecutiveDays = 0;
      let currentDate = new Date(todayString);

      for (const dateString of progressDates) {
        const expectedDateString = currentDate.toISOString().split('T')[0];

        if (dateString === expectedDateString) {
          consecutiveDays++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      return consecutiveDays;
    } catch (error) {
      console.error('❌ SQLite calculateConsecutiveProgressDays error:', error);
      return 0;
    }
  }

  // ========================================
  // WEEKLY CHALLENGE SUPPORT
  // ========================================

  async hasGoalProgressToday(): Promise<boolean> {
    try {
      const db = getDatabase();
      const todayStr = today();

      const row = await db.getFirstAsync<any>(
        'SELECT COUNT(*) as count FROM goal_progress WHERE timestamp = ? AND value > 0',
        [todayStr]
      );

      return (row?.count || 0) > 0;
    } catch (error) {
      console.error('❌ SQLite hasGoalProgressToday error:', error);
      return false;
    }
  }

  async getMaxGoalTargetValue(): Promise<number> {
    try {
      const db = getDatabase();

      const row = await db.getFirstAsync<any>(
        'SELECT MAX(target_value) as max_value FROM goals'
      );

      return row?.max_value || 0;
    } catch (error) {
      console.error('❌ SQLite getMaxGoalTargetValue error:', error);
      return 0;
    }
  }
}

// Singleton instance
export const sqliteGoalStorage = new SQLiteGoalStorage();
