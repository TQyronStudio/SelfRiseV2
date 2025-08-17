import { DeviceEventEmitter } from 'react-native';
import { Goal, GoalProgress, CreateGoalInput, GoalStatus, AddGoalProgressInput, GoalStats, GoalTimelineStatus } from '../../types/goal';
import { BaseStorage, STORAGE_KEYS, EntityStorage, StorageError, STORAGE_ERROR_CODES } from './base';
import { createGoal, updateEntityTimestamp, updateGoalValue, createBaseEntity } from '../../utils/data';
import { DateString } from '../../types/common';
import { GamificationService } from '../gamificationService';
import { XP_REWARDS } from '../../constants/gamification';
import { XPSourceType } from '../../types/gamification';
import { today } from '../../utils/date';

// Daily XP tracking per goal
interface GoalDailyXPData {
  date: DateString;
  goalId: string;
  positiveXPCount: number; // How many positive XP awards this goal got today
  negativeXPCount: number; // How many negative XP operations this goal had today  
}

export class GoalStorage implements EntityStorage<Goal> {
  // XP system disabled - XP handling moved to enhanced GamificationService
  // MIGRATION: XP logic moved to enhanced GamificationService for consistency
  private static XP_ENABLED = false;
  // Constants
  private static readonly MAX_DAILY_POSITIVE_XP_PER_GOAL = 3; // Max 3 positive XP per goal per day
  
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

      // MIGRATION: All XP logic moved to enhanced GamificationService integration in UI layer
      if (input.progressType === 'subtract') {
        console.log(`🎯 Goal negative progress: ${goal.title} (-${input.value}) - XP will be handled by enhanced GamificationService`);
      } else {
        // Positive progress (add/set)
        const isCompleted = updatedGoal.status === GoalStatus.COMPLETED;
        console.log(`🎯 Goal progress debug: ${goal.title}`);
        console.log(`   Previous: ${previousCompletionPercentage}% (${goal.currentValue}/${goal.targetValue})`);
        console.log(`   New: ${newCompletionPercentage}% (${updatedGoal.currentValue}/${goal.targetValue})`);
        console.log(`   Status: ${goal.status} → ${updatedGoal.status}`);
        console.log(`   isCompleted: ${isCompleted}`);
        
        // XP rewards now handled via GamificationService integration in UI layer
        // MIGRATION: Goal XP logic moved to enhanced GamificationService for consistency
        console.log(`✅ Goal progress updated - XP will be handled by enhanced GamificationService (${previousCompletionPercentage}% → ${newCompletionPercentage}%, completed: ${isCompleted})`);
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

      // Get goal info for logging  
      const goal = await this.getById(progressToDelete.goalId);
      
      // MIGRATION: XP subtraction for deleted progress now handled via enhanced GamificationService in UI layer
      if (goal) {
        console.log(`🗑️ Goal progress deleted: ${goal.title} (${progressToDelete.progressType}: ${progressToDelete.value}) - XP adjustment will be handled by enhanced GamificationService`);
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
      
      // MIGRATION: XP subtraction for bulk deleted progress now handled via enhanced GamificationService in UI layer
      const goal = await this.getById(goalId);
      if (goal) {
        console.log(`🗑️ Bulk goal progress deletion: ${goal.title} (${progressToDelete.length} entries) - XP adjustments will be handled by enhanced GamificationService`);
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
  // XP INTEGRATION METHODS
  // ========================================

  /**
   * DEPRECATED: Award XP for goal progress, milestones, and completions
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   */
  private async awardGoalProgressXP(
    goal: Goal, 
    previousPercentage: number, 
    newPercentage: number, 
    isCompleted: boolean
  ): Promise<void> {
    console.log(`🚨 DEPRECATED: awardGoalProgressXP called for goal ${goal.title}`);
    console.log(`📝 MIGRATION: Goal XP logic moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration in UI layer for consistent XP handling`);
  }

  /**
   * DEPRECATED: Award XP for goal progress
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   */
  private async awardProgressXP(goal: Goal): Promise<void> {
    console.log(`🚨 DEPRECATED: awardProgressXP called for goal ${goal.title}`);
    console.log(`📝 MIGRATION: Goal progress XP moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration with daily limit tracking`);
  }

  /**
   * DEPRECATED: Award XP for goal milestones
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   */
  private async awardMilestoneXP(goal: Goal, previousPercentage: number, newPercentage: number): Promise<void> {
    console.log(`🚨 DEPRECATED: awardMilestoneXP called for goal ${goal.title}`);
    console.log(`📝 MIGRATION: Goal milestone XP moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration with milestone detection`);
  }

  /**
   * DEPRECATED: Award XP for goal completion
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   */
  private async awardCompletionXP(goal: Goal): Promise<void> {
    console.log(`🚨 DEPRECATED: awardCompletionXP called for goal ${goal.title}`);
    console.log(`📝 MIGRATION: Goal completion XP moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration with big goal detection`);
  }

  /**
   * DEPRECATED: Handle XP for deleted goal progress entry
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   */
  private async subtractGoalProgressXP(goal: Goal, deletedProgress: GoalProgress): Promise<void> {
    console.log(`🚨 DEPRECATED: subtractGoalProgressXP called for goal ${goal.title}`);
    console.log(`📝 MIGRATION: Goal progress deletion XP (${deletedProgress.progressType}: ${deletedProgress.value}) moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration in UI layer for consistent XP handling`);
  }

  /**
   * DEPRECATED: Subtract XP for "subtract" progress type
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   */
  private async subtractGoalProgressXPForSubtract(goal: Goal, subtractValue: number): Promise<void> {
    console.log(`🚨 DEPRECATED: subtractGoalProgressXPForSubtract called for goal ${goal.title}`);
    console.log(`📝 MIGRATION: Goal subtract XP (-${subtractValue}) moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration in UI layer for consistent XP handling`);
  }

  // ========================================
  // DAILY XP TRACKING SYSTEM
  // ========================================

  /**
   * DEPRECATED: Get today's XP tracking data for a specific goal
   * MIGRATION: XP tracking moved to enhanced GamificationService for consistency
   */
  private async getGoalDailyXPData(goalId: string): Promise<GoalDailyXPData> {
    console.log(`🚨 DEPRECATED: getGoalDailyXPData called for goal ${goalId}`);
    console.log(`📝 MIGRATION: Daily XP data tracking moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration with built-in daily limit tracking`);
    
    // Return default data for backward compatibility
    return {
      date: today(),
      goalId,
      positiveXPCount: 0,
      negativeXPCount: 0,
    };
  }

  /**
   * DEPRECATED: Update daily XP tracking for a goal
   * MIGRATION: XP tracking moved to enhanced GamificationService for consistency
   */
  private async updateGoalDailyXPTracking(goalId: string, isPositiveXP: boolean): Promise<void> {
    console.log(`🚨 DEPRECATED: updateGoalDailyXPTracking called for goal ${goalId}`);
    console.log(`📝 MIGRATION: Daily XP tracking (${isPositiveXP ? 'positive' : 'negative'}) moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration with built-in daily limit tracking`);
  }

  /**
   * DEPRECATED: Check if goal can receive positive XP today
   * MIGRATION: XP limit checking moved to enhanced GamificationService for consistency
   */
  private async canGoalReceivePositiveXP(goalId: string): Promise<boolean> {
    console.log(`🚨 DEPRECATED: canGoalReceivePositiveXP called for goal ${goalId}`);
    console.log(`📝 MIGRATION: Daily XP limit checking moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration with built-in daily limit checking`);
    
    // Return true for backward compatibility (limits handled by GamificationService)
    return true;
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