import { Goal, GoalProgress, CreateGoalInput, GoalStatus, AddGoalProgressInput, GoalStats, GoalTimelineStatus } from '../../types/goal';
import { BaseStorage, STORAGE_KEYS, EntityStorage, StorageError, STORAGE_ERROR_CODES } from './base';
import { createGoal, updateEntityTimestamp, updateGoalValue, createBaseEntity } from '../../utils/data';
import { DateString } from '../../types/common';
import { today } from '../../utils/date';
import { GamificationService } from '../gamificationService';
import { XPSourceType } from '../../types/gamification';
import { XP_REWARDS } from '../../constants/gamification';


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

      // Store previous values for milestone detection
      const previousCurrentValue = goal.currentValue;
      const previousCompletionPercentage = goal.targetValue > 0 ? (previousCurrentValue / goal.targetValue) * 100 : 0;

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
      const newCompletionPercentage = goal.targetValue > 0 ? (updatedGoal.currentValue / goal.targetValue) * 100 : 0;
      
      await this.update(input.goalId, { 
        currentValue: updatedGoal.currentValue,
        status: updatedGoal.status,
        completedDate: updatedGoal.completedDate || undefined
      });

      // Handle XP for goal progress
      if (input.progressType === 'subtract' && input.value > 0) {
        // Subtract XP for negative progress
        await GamificationService.subtractXP(XP_REWARDS.GOALS.PROGRESS_ENTRY, {
          source: XPSourceType.GOAL_PROGRESS,
          description: `Goal negative progress: ${goal.title} (-${input.value})`,
          sourceId: input.goalId
        });
        console.log(`🎯 Goal negative progress: ${goal.title} (-${input.value}, -${XP_REWARDS.GOALS.PROGRESS_ENTRY} XP)`);
      } else if (input.progressType === 'add' && input.value > 0) {
        // Award XP for positive progress
        await GamificationService.addXP(XP_REWARDS.GOALS.PROGRESS_ENTRY, {
          source: XPSourceType.GOAL_PROGRESS,
          description: `Goal progress: ${goal.title} (+${input.value})`,
          sourceId: input.goalId
        });
        console.log(`🎯 Goal positive progress: ${goal.title} (+${input.value}, +${XP_REWARDS.GOALS.PROGRESS_ENTRY} XP)`);
      } else if (input.progressType === 'subtract') {
        console.log(`🎯 Goal negative progress: ${goal.title} (-${input.value})`);
      }

      // ALWAYS check for goal completion (regardless of progress type)
      const isCompleted = updatedGoal.status === GoalStatus.COMPLETED;
      const wasCompleted = goal.status === GoalStatus.COMPLETED;
      const justCompleted = isCompleted && !wasCompleted; // Goal just reached completion

      console.log(`🎯 Goal completion check: ${goal.title}`);
      console.log(`   Previous: ${previousCompletionPercentage}% (${goal.currentValue}/${goal.targetValue})`);
      console.log(`   New: ${newCompletionPercentage}% (${updatedGoal.currentValue}/${goal.targetValue})`);
      console.log(`   Status: ${goal.status} → ${updatedGoal.status}`);
      console.log(`   isCompleted: ${isCompleted}, wasCompleted: ${wasCompleted}, justCompleted: ${justCompleted}`);

      // Award +250 XP for goal completion
      if (justCompleted) {
        await GamificationService.addXP(XP_REWARDS.GOALS.GOAL_COMPLETION, {
          source: XPSourceType.GOAL_COMPLETION,
          description: `🎉 Goal completed: ${goal.title}`,
          sourceId: goal.id
        });
        console.log(`🏆 Goal completed: ${goal.title} (+${XP_REWARDS.GOALS.GOAL_COMPLETION} XP)`);
      }

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

      // Get goal info for logging and XP calculation
      const goal = await this.getById(progressToDelete.goalId);
      
      if (goal) {
        console.log(`🗑️ Goal progress deleted: ${goal.title} (${progressToDelete.progressType}: ${progressToDelete.value})`);
        
        // Handle XP for deleted progress
        const progressValue = progressToDelete.value;
        const progressType = progressToDelete.progressType;
        
        if (progressType === 'add' && progressValue > 0) {
          // Reverse the XP that was given for positive progress
          await GamificationService.subtractXP(XP_REWARDS.GOALS.PROGRESS_ENTRY, {
            source: XPSourceType.GOAL_PROGRESS,
            description: `Deleted goal progress: ${goal.title} (-${progressValue})`,
            sourceId: progressToDelete.goalId
          });
          console.log(`🔻 Subtracted ${XP_REWARDS.GOALS.PROGRESS_ENTRY} XP for deleted positive progress`);
        } else if (progressType === 'subtract' && progressValue > 0) {
          // When deleting a subtract operation, we should give back XP  
          await GamificationService.addXP(XP_REWARDS.GOALS.PROGRESS_ENTRY, {
            source: XPSourceType.GOAL_PROGRESS,
            description: `Reversed goal subtraction: ${goal.title} (+${progressValue})`,
            sourceId: progressToDelete.goalId
          });
          console.log(`🔺 Added ${XP_REWARDS.GOALS.PROGRESS_ENTRY} XP for reversing negative progress`);
        }
        // Note: 'set' type is more complex and would require calculating the net change
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
      const progressToDelete = progress.filter(p => p.goalId === goalId);
      const filteredProgress = progress.filter(p => p.goalId !== goalId);
      
      const goal = await this.getById(goalId);
      if (goal) {
        console.log(`🗑️ Bulk goal progress deletion: ${goal.title} (${progressToDelete.length} entries)`);
      }
      
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
      const wasCompleted = goal.status === GoalStatus.COMPLETED;
      const shouldBeCompleted = isCompleted && goal.status === GoalStatus.ACTIVE;
      const shouldBeActive = !isCompleted && goal.status === GoalStatus.COMPLETED;

      let status = goal.status;
      if (shouldBeCompleted) {
        status = GoalStatus.COMPLETED;
      } else if (shouldBeActive) {
        status = GoalStatus.ACTIVE;
      }

      // Handle XP for goal completion status changes during recalculation
      if (shouldBeCompleted) {
        // Goal just reached completion during recalculation
        await GamificationService.addXP(XP_REWARDS.GOALS.GOAL_COMPLETION, {
          source: XPSourceType.GOAL_COMPLETION,
          description: `🎉 Goal completed: ${goal.title}`,
          sourceId: goal.id
        });
        console.log(`🏆 Goal completed during recalculation: ${goal.title} (+${XP_REWARDS.GOALS.GOAL_COMPLETION} XP)`);
      } else if (shouldBeActive && wasCompleted) {
        // Goal dropped below 100%, subtract completion XP
        await GamificationService.subtractXP(XP_REWARDS.GOALS.GOAL_COMPLETION, {
          source: XPSourceType.GOAL_COMPLETION,
          description: `📉 Goal dropped below completion: ${goal.title}`,
          sourceId: goal.id
        });
        console.log(`📉 Goal completion reversed: ${goal.title} (-${XP_REWARDS.GOALS.GOAL_COMPLETION} XP)`);
      }

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
          daysWithProgress: 0,
          completionPercentage: 0,
          isOnTrack: false,
          timelineStatus: 'onTrack' as GoalTimelineStatus,
        };
      }

      const progress = await this.getProgressByGoalId(goalId);
      
      // Sort progress chronologically before calculating total (critical for 'set' type)
      const sortedProgress = progress.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB; // ASC order for chronological processing
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
      const today = new Date();
      const daysActive = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate average daily based only on days with actual progress
      const uniqueProgressDays = new Set(sortedProgress.map(p => p.date)).size;
      const averageDaily = uniqueProgressDays > 0 ? totalProgress / uniqueProgressDays : 0;
      const completionPercentage = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
      
      let estimatedCompletionDate: DateString | undefined;
      let isOnTrack = false;

      if (goal.targetDate && averageDaily > 0) {
        const remainingValue = goal.targetValue - totalProgress;
        const daysToComplete = Math.ceil(remainingValue / averageDaily);
        const estimatedDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
        estimatedCompletionDate = estimatedDate.toISOString().split('T')[0] as DateString;
        
        
        // Parse target date - handle Czech format (DD.MM.YYYY) and ISO format (YYYY-MM-DD)
        let targetDate: Date;
        if (goal.targetDate.includes('.')) {
          // Czech format: DD.MM.YYYY
          const parts = goal.targetDate.split('.');
          if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
            targetDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            targetDate = new Date(goal.targetDate);
          }
        } else {
          // ISO format: YYYY-MM-DD
          targetDate = new Date(goal.targetDate);
        }
        isOnTrack = estimatedDate <= targetDate;
      }

      // Calculate timeline status
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
      // console.log('Goal progress data cleanup completed'); // Debug log removed
    } catch (error) {
      console.error('Failed to cleanup goal progress data:', error);
    }
  }


  // ========================================
  // GOAL STATISTICS FOR ACHIEVEMENTS
  // ========================================

  /**
   * Get achievement-related statistics for goals
   */
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
      const allGoals = await this.getAll();
      const allProgress = await this.getAllProgress();
      const todayString = today();

      // Basic counts
      const totalGoalsCreated = allGoals.length;
      const completedGoals = allGoals.filter(g => g.status === GoalStatus.COMPLETED);
      const totalGoalsCompleted = completedGoals.length;
      const bigGoalsCompleted = completedGoals.filter(g => g.targetValue >= 1000).length;

      // Average goal value
      const averageGoalValue = totalGoalsCreated > 0 
        ? allGoals.reduce((sum, g) => sum + g.targetValue, 0) / totalGoalsCreated 
        : 0;

      // Completion rate
      const goalCompletionRate = totalGoalsCreated > 0 
        ? (totalGoalsCompleted / totalGoalsCreated) * 100 
        : 0;

      // Progress statistics
      const totalProgressEntries = allProgress.length;
      const todayProgress = allProgress.filter(p => p.date === todayString);
      const uniqueGoalsWithProgressToday = new Set(todayProgress.map(p => p.goalId)).size;

      // Calculate consecutive days with goal progress
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
      console.error('Failed to get goal achievement stats:', error);
      // Return safe defaults
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

  /**
   * Calculate consecutive days with at least one goal progress entry
   */
  private async calculateConsecutiveProgressDays(): Promise<number> {
    try {
      const allProgress = await this.getAllProgress();
      if (allProgress.length === 0) return 0;

      // Get unique dates with progress, sorted in descending order
      const progressDates = [...new Set(allProgress.map(p => p.date))]
        .sort((a, b) => b.localeCompare(a)); // Descending order

      if (progressDates.length === 0) return 0;

      const todayString = today();
      let consecutiveDays = 0;
      let currentDate = new Date(todayString);

      // Count consecutive days from today backwards
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
      console.error('Failed to calculate consecutive progress days:', error);
      return 0;
    }
  }

  // ========================================
  // WEEKLY CHALLENGE SUPPORT METHODS
  // ========================================

  /**
   * Get goals and check if any progress was made today (for challenge tracking)
   */
  async hasGoalProgressToday(): Promise<boolean> {
    try {
      const goals = await this.getAll();
      const todayStr = today();
      
      return goals.some((goal: any) => 
        goal.progressEntries?.some((entry: any) => entry.date === todayStr && entry.amount > 0)
      );
    } catch (error) {
      console.error('GoalStorage.hasGoalProgressToday error:', error);
      return false;
    }
  }

  /**
   * Get maximum goal target value for challenge conditions
   */
  async getMaxGoalTargetValue(): Promise<number> {
    try {
      const goals = await this.getAll();
      if (goals.length === 0) return 0;
      
      return Math.max(...goals.map(goal => goal.targetValue || 0));
    } catch (error) {
      console.error('GoalStorage.getMaxGoalTargetValue error:', error);
      return 0;
    }
  }
}

// Timeline status calculation function
export function calculateTimelineStatus(estimatedCompletionDate: DateString | undefined, targetDate: DateString | undefined): GoalTimelineStatus {
  if (!estimatedCompletionDate || !targetDate) {
    return 'onTrack'; // Default when no dates available
  }

  const estimated = new Date(estimatedCompletionDate);
  
  // Parse target date - handle Czech format (DD.MM.YYYY) and ISO format (YYYY-MM-DD)
  let target: Date;
  if (targetDate.includes('.')) {
    // Czech format: DD.MM.YYYY
    const parts = targetDate.split('.');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      target = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      target = new Date(targetDate);
    }
  } else {
    // ISO format: YYYY-MM-DD
    target = new Date(targetDate);
  }
  
  // Calculate difference in days
  const diffTime = estimated.getTime() - target.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Apply the new logic based on requirements
  if (diffDays <= -30) {
    return 'wayAhead'; // More than 30 days early
  } else if (diffDays <= -1) {
    return 'ahead'; // 1-30 days early
  } else if (diffDays <= 1) {
    return 'onTrack'; // Approximately same (±1 day)
  } else if (diffDays <= 30) {
    return 'behind'; // 1-30 days late
  } else {
    return 'wayBehind'; // More than 30 days late
  }
}

// Singleton instance
export const goalStorage = new GoalStorage();