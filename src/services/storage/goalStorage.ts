import { Goal, GoalProgress, CreateGoalInput, GoalStatus, AddGoalProgressInput, GoalStats } from '../../types/goal';
import { BaseStorage, STORAGE_KEYS, EntityStorage, StorageError, STORAGE_ERROR_CODES } from './base';
import { createGoal, updateEntityTimestamp, updateGoalValue, createBaseEntity } from '../../utils/data';
import { DateString } from '../../types/common';

export class GoalStorage implements EntityStorage<Goal> {
  // Goal CRUD operations
  async getAll(): Promise<Goal[]> {
    try {
      const goals = await BaseStorage.get<Goal[]>(STORAGE_KEYS.GOALS);
      return goals || [];
    } catch (error) {
      throw new StorageError(
        'Failed to get all goals',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async getById(id: string): Promise<Goal | null> {
    try {
      const goals = await this.getAll();
      return goals.find(goal => goal.id === id) || null;
    } catch (error) {
      throw new StorageError(
        `Failed to get goal with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async create(input: CreateGoalInput): Promise<Goal> {
    try {
      const goals = await this.getAll();
      const maxOrder = goals.length > 0 ? Math.max(...goals.map(g => g.order)) : -1;
      const newGoal = createGoal(input, maxOrder + 1);
      
      goals.push(newGoal);
      await BaseStorage.set(STORAGE_KEYS.GOALS, goals);
      
      return newGoal;
    } catch (error) {
      throw new StorageError(
        'Failed to create goal',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      const goals = await this.getAll();
      const goalIndex = goals.findIndex(goal => goal.id === id);
      
      if (goalIndex === -1) {
        throw new StorageError(
          `Goal with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GOALS
        );
      }

      const updatedGoal = updateEntityTimestamp({
        ...goals[goalIndex],
        ...updates,
      } as Goal);

      goals[goalIndex] = updatedGoal;
      await BaseStorage.set(STORAGE_KEYS.GOALS, goals);

      return updatedGoal;
    } catch (error) {
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
      const goals = await this.getAll();
      const filteredGoals = goals.filter(goal => goal.id !== id);
      
      if (filteredGoals.length === goals.length) {
        throw new StorageError(
          `Goal with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GOALS
        );
      }

      await BaseStorage.set(STORAGE_KEYS.GOALS, filteredGoals);
      
      // Also delete related progress entries
      await this.deleteProgressByGoalId(id);
    } catch (error) {
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
      await BaseStorage.remove(STORAGE_KEYS.GOALS);
      await BaseStorage.remove(STORAGE_KEYS.GOAL_PROGRESS);
    } catch (error) {
      throw new StorageError(
        'Failed to delete all goals',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  async count(): Promise<number> {
    try {
      const goals = await this.getAll();
      return goals.length;
    } catch (error) {
      throw new StorageError(
        'Failed to count goals',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  // Status-specific operations
  async getByStatus(status: GoalStatus): Promise<Goal[]> {
    try {
      const goals = await this.getAll();
      return goals.filter(goal => goal.status === status);
    } catch (error) {
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

  // Goal Progress operations
  async getAllProgress(): Promise<GoalProgress[]> {
    try {
      const progress = await BaseStorage.get<GoalProgress[]>(STORAGE_KEYS.GOAL_PROGRESS);
      if (!progress) return [];
      
      // Validate progress data structure
      if (!Array.isArray(progress)) {
        console.warn('Progress data is not an array, resetting to empty array');
        await BaseStorage.set(STORAGE_KEYS.GOAL_PROGRESS, []);
        return [];
      }
      
      // Filter out invalid entries and clean up data
      const validProgress = progress.filter(p => 
        p && 
        p.id && 
        p.id.trim() !== '' &&
        p.goalId &&
        p.goalId.trim() !== '' &&
        typeof p.value === 'number' &&
        p.progressType &&
        p.date
      );
      
      // If we filtered out some entries, save the cleaned data
      if (validProgress.length !== progress.length) {
        console.log(`Cleaned up ${progress.length - validProgress.length} invalid progress entries`);
        await BaseStorage.set(STORAGE_KEYS.GOAL_PROGRESS, validProgress);
      }
      
      return validProgress;
    } catch (error) {
      console.error('Failed to get all goal progress:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }

  async getProgressByGoalId(goalId: string): Promise<GoalProgress[]> {
    try {
      const progress = await this.getAllProgress();
      return progress
        .filter(p => p.goalId === goalId)
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
    } catch (error) {
      console.error(`Failed to get progress for goal ${goalId}:`, error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }

  async addProgress(input: AddGoalProgressInput): Promise<GoalProgress> {
    try {
      // Verify goal exists
      const goal = await this.getById(input.goalId);
      if (!goal) {
        throw new StorageError(
          `Goal with id ${input.goalId} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GOALS
        );
      }

      // Create progress entry
      const progress = await this.getAllProgress();
      const newProgress: GoalProgress = {
        ...createBaseEntity(),
        goalId: input.goalId,
        value: input.value,
        note: input.note,
        date: input.date,
        progressType: input.progressType,
      };

      progress.push(newProgress);
      await BaseStorage.set(STORAGE_KEYS.GOAL_PROGRESS, progress);

      // Update goal's current value
      const updatedGoal = updateGoalValue(goal, input.value, input.progressType);
      await this.update(input.goalId, { 
        currentValue: updatedGoal.currentValue,
        status: updatedGoal.status,
        completedDate: updatedGoal.completedDate || undefined
      });

      return newProgress;
    } catch (error) {
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
      const progress = await this.getAllProgress();
      const progressIndex = progress.findIndex(p => p.id === id);
      
      if (progressIndex === -1) {
        throw new StorageError(
          `Progress with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GOAL_PROGRESS
        );
      }

      const updatedProgress = updateEntityTimestamp({
        ...progress[progressIndex],
        ...updates,
      } as GoalProgress);

      progress[progressIndex] = updatedProgress;
      await BaseStorage.set(STORAGE_KEYS.GOAL_PROGRESS, progress);

      // If value changed, recalculate goal's current value
      if (updates.value !== undefined || updates.progressType !== undefined) {
        await this.recalculateGoalValue(updatedProgress.goalId);
      }

      return updatedProgress;
    } catch (error) {
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
      const progress = await this.getAllProgress();
      const progressToDelete = progress.find(p => p.id === id);
      
      if (!progressToDelete) {
        throw new StorageError(
          `Progress with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GOAL_PROGRESS
        );
      }

      const filteredProgress = progress.filter(p => p.id !== id);
      await BaseStorage.set(STORAGE_KEYS.GOAL_PROGRESS, filteredProgress);

      // Recalculate goal's current value
      await this.recalculateGoalValue(progressToDelete.goalId);
    } catch (error) {
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
      const progress = await this.getAllProgress();
      const filteredProgress = progress.filter(p => p.goalId !== goalId);
      
      await BaseStorage.set(STORAGE_KEYS.GOAL_PROGRESS, filteredProgress);
    } catch (error) {
      throw new StorageError(
        `Failed to delete progress for goal ${goalId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOAL_PROGRESS
      );
    }
  }

  // Helper methods
  private async recalculateGoalValue(goalId: string): Promise<void> {
    try {
      const goal = await this.getById(goalId);
      if (!goal) return;

      const progress = await this.getProgressByGoalId(goalId);
      
      // Recalculate current value from all progress entries
      let currentValue = 0;
      for (const entry of progress.reverse()) { // Process in chronological order
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
      const status = isCompleted && goal.status === GoalStatus.ACTIVE 
        ? GoalStatus.COMPLETED 
        : goal.status;

      await this.update(goalId, { 
        currentValue,
        status,
        completedDate: isCompleted && !goal.completedDate ? new Date().toISOString().split('T')[0]! : goal.completedDate || undefined
      });
    } catch (error) {
      throw new StorageError(
        `Failed to recalculate value for goal ${goalId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  // Bulk operations
  async updateGoalOrder(goalOrders: Array<{ id: string; order: number }>): Promise<void> {
    try {
      const goals = await this.getAll();
      const updates = new Map(goalOrders.map(item => [item.id, item.order]));
      
      const updatedGoals = goals.map(goal => {
        const newOrder = updates.get(goal.id);
        return newOrder !== undefined 
          ? updateEntityTimestamp({ ...goal, order: newOrder })
          : goal;
      });

      await BaseStorage.set(STORAGE_KEYS.GOALS, updatedGoals);
    } catch (error) {
      throw new StorageError(
        'Failed to update goal order',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  // Statistics
  async getCompletionRate(): Promise<number> {
    try {
      const goals = await this.getAll();
      if (goals.length === 0) return 0;
      
      const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED);
      return (completedGoals.length / goals.length) * 100;
    } catch (error) {
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
        // Return default stats for missing goal instead of throwing
        return {
          goalId,
          totalProgress: 0,
          progressEntries: 0,
          averageDaily: 0,
          daysActive: 0,
          completionPercentage: 0,
          isOnTrack: false,
        };
      }

      const progress = await this.getProgressByGoalId(goalId);
      const totalProgress = progress.reduce((sum, entry) => {
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

      const progressEntries = progress.length;
      const startDate = new Date(goal.startDate);
      const today = new Date();
      const daysActive = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const averageDaily = daysActive > 0 ? totalProgress / daysActive : 0;
      const completionPercentage = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
      
      let estimatedCompletionDate: DateString | undefined;
      let isOnTrack = false;

      if (goal.targetDate && averageDaily > 0) {
        const remainingValue = goal.targetValue - goal.currentValue;
        const daysToComplete = Math.ceil(remainingValue / averageDaily);
        const estimatedDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
        estimatedCompletionDate = estimatedDate.toISOString().split('T')[0] as DateString;
        
        const targetDate = new Date(goal.targetDate);
        isOnTrack = estimatedDate <= targetDate;
      }

      return {
        goalId,
        totalProgress,
        progressEntries,
        averageDaily,
        daysActive,
        completionPercentage,
        estimatedCompletionDate: estimatedCompletionDate || undefined,
        isOnTrack,
      };
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to get stats for goal ${goalId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GOALS
      );
    }
  }

  // Data cleanup utility
  async cleanupInvalidData(): Promise<void> {
    try {
      // This will trigger the cleanup logic in getAllProgress
      await this.getAllProgress();
      console.log('Goal progress data cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup goal progress data:', error);
    }
  }
}

// Singleton instance
export const goalStorage = new GoalStorage();