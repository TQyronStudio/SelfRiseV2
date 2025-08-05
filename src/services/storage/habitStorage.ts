import { Habit, HabitCompletion, CreateHabitInput } from '../../types/habit';
import { BaseStorage, STORAGE_KEYS, EntityStorage, StorageError, STORAGE_ERROR_CODES } from './base';
import { createHabit, createHabitCompletion, updateEntityTimestamp } from '../../utils/data';
import { DateString } from '../../types/common';
// Gamification imports for XP system
import { GamificationService } from '../gamificationService';
import { XPSourceType } from '../../types/gamification';
import { XP_REWARDS } from '../../constants/gamification';

export class HabitStorage implements EntityStorage<Habit> {
  // XP system enabled for habit completions
  // DISABLED: XP is now handled in UI layer (Home screen) for real-time updates
  private static XP_ENABLED = false;
  // Habit CRUD operations
  async getAll(): Promise<Habit[]> {
    try {
      const habits = await BaseStorage.get<Habit[]>(STORAGE_KEYS.HABITS);
      return habits || [];
    } catch (error) {
      throw new StorageError(
        'Failed to get all habits',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async getById(id: string): Promise<Habit | null> {
    try {
      const habits = await this.getAll();
      return habits.find(habit => habit.id === id) || null;
    } catch (error) {
      throw new StorageError(
        `Failed to get habit with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async create(input: CreateHabitInput): Promise<Habit> {
    try {
      const habits = await this.getAll();
      const maxOrder = habits.length > 0 ? Math.max(...habits.map(h => h.order)) : -1;
      const newHabit = createHabit(input, maxOrder + 1);
      
      habits.push(newHabit);
      await BaseStorage.set(STORAGE_KEYS.HABITS, habits);
      
      return newHabit;
    } catch (error) {
      throw new StorageError(
        `Failed to create habit: ${error instanceof Error ? error.message : 'Unknown error'}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async update(id: string, updates: Partial<Habit>): Promise<Habit> {
    try {
      const habits = await this.getAll();
      const habitIndex = habits.findIndex(habit => habit.id === id);
      
      if (habitIndex === -1) {
        throw new StorageError(
          `Habit with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.HABITS
        );
      }

      const updatedHabit = updateEntityTimestamp({
        ...habits[habitIndex],
        ...updates,
      } as Habit);

      habits[habitIndex] = updatedHabit;
      await BaseStorage.set(STORAGE_KEYS.HABITS, habits);

      return updatedHabit;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to update habit with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const habits = await this.getAll();
      const filteredHabits = habits.filter(habit => habit.id !== id);
      
      if (filteredHabits.length === habits.length) {
        throw new StorageError(
          `Habit with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.HABITS
        );
      }

      await BaseStorage.set(STORAGE_KEYS.HABITS, filteredHabits);
      
      // Also delete related completions
      await this.deleteCompletionsByHabitId(id);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to delete habit with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await BaseStorage.remove(STORAGE_KEYS.HABITS);
      await BaseStorage.remove(STORAGE_KEYS.HABIT_COMPLETIONS);
    } catch (error) {
      throw new StorageError(
        'Failed to delete all habits',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async count(): Promise<number> {
    try {
      const habits = await this.getAll();
      return habits.length;
    } catch (error) {
      throw new StorageError(
        'Failed to count habits',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  // Habit completion operations
  async getAllCompletions(): Promise<HabitCompletion[]> {
    try {
      const completions = await BaseStorage.get<HabitCompletion[]>(STORAGE_KEYS.HABIT_COMPLETIONS);
      return completions || [];
    } catch (error) {
      throw new StorageError(
        'Failed to get all habit completions',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async getCompletionsByHabitId(habitId: string): Promise<HabitCompletion[]> {
    try {
      const completions = await this.getAllCompletions();
      return completions.filter(completion => completion.habitId === habitId);
    } catch (error) {
      throw new StorageError(
        `Failed to get completions for habit ${habitId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async getCompletionsByDate(date: DateString): Promise<HabitCompletion[]> {
    try {
      const completions = await this.getAllCompletions();
      return completions.filter(completion => completion.date === date);
    } catch (error) {
      throw new StorageError(
        `Failed to get completions for date ${date}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async getCompletion(habitId: string, date: DateString): Promise<HabitCompletion | null> {
    try {
      const completions = await this.getAllCompletions();
      return completions.find(
        completion => completion.habitId === habitId && completion.date === date
      ) || null;
    } catch (error) {
      throw new StorageError(
        `Failed to get completion for habit ${habitId} on ${date}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async createCompletion(
    habitId: string,
    date: DateString,
    isBonus: boolean = false,
    note?: string
  ): Promise<HabitCompletion> {
    try {
      // Check if completion already exists
      const existingCompletion = await this.getCompletion(habitId, date);
      if (existingCompletion) {
        throw new StorageError(
          `Completion for habit ${habitId} on ${date} already exists`,
          STORAGE_ERROR_CODES.UNKNOWN,
          STORAGE_KEYS.HABIT_COMPLETIONS
        );
      }

      const completions = await this.getAllCompletions();
      const newCompletion = createHabitCompletion(habitId, date, isBonus, note);
      
      completions.push(newCompletion);
      await BaseStorage.set(STORAGE_KEYS.HABIT_COMPLETIONS, completions);
      
      // Add XP rewards immediately for instant UI feedback - only if enabled
      if (HabitStorage.XP_ENABLED) {
        await this.awardHabitCompletionXP(habitId, isBonus);
      }
      
      return newCompletion;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to create completion for habit ${habitId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async updateCompletion(id: string, updates: Partial<HabitCompletion>): Promise<HabitCompletion> {
    try {
      const completions = await this.getAllCompletions();
      const completionIndex = completions.findIndex(completion => completion.id === id);
      
      if (completionIndex === -1) {
        throw new StorageError(
          `Completion with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.HABIT_COMPLETIONS
        );
      }

      const updatedCompletion = updateEntityTimestamp({
        ...completions[completionIndex],
        ...updates,
      } as HabitCompletion);

      completions[completionIndex] = updatedCompletion;
      await BaseStorage.set(STORAGE_KEYS.HABIT_COMPLETIONS, completions);

      return updatedCompletion;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to update completion with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async deleteCompletion(id: string): Promise<void> {
    try {
      const completions = await this.getAllCompletions();
      const completionToDelete = completions.find(completion => completion.id === id);
      
      if (!completionToDelete) {
        throw new StorageError(
          `Completion with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.HABIT_COMPLETIONS
        );
      }

      // Get habit info for XP calculation
      const habit = await this.getById(completionToDelete.habitId);
      
      // Remove completion from storage first
      const filteredCompletions = completions.filter(completion => completion.id !== id);
      await BaseStorage.set(STORAGE_KEYS.HABIT_COMPLETIONS, filteredCompletions);
      
      // Subtract XP for the removed completion immediately for instant UI feedback (only if XP is enabled)
      if (HabitStorage.XP_ENABLED && habit) {
        await this.awardHabitUncompleteXP(completionToDelete.habitId, completionToDelete.isBonus || false);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to delete completion with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async deleteCompletionsByHabitId(habitId: string): Promise<void> {
    try {
      const completions = await this.getAllCompletions();
      const filteredCompletions = completions.filter(
        completion => completion.habitId !== habitId
      );
      
      await BaseStorage.set(STORAGE_KEYS.HABIT_COMPLETIONS, filteredCompletions);
    } catch (error) {
      throw new StorageError(
        `Failed to delete completions for habit ${habitId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
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
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to toggle completion for habit ${habitId} on ${date}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  // Bulk operations
  async updateHabitOrder(habitOrders: { id: string; order: number }[]): Promise<void> {
    try {
      const habits = await this.getAll();
      const updates = new Map(habitOrders.map(item => [item.id, item.order]));
      
      const updatedHabits = habits.map(habit => {
        const newOrder = updates.get(habit.id);
        return newOrder !== undefined 
          ? updateEntityTimestamp({ ...habit, order: newOrder })
          : habit;
      });

      await BaseStorage.set(STORAGE_KEYS.HABITS, updatedHabits);
    } catch (error) {
      throw new StorageError(
        'Failed to update habit order',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  // ========================================
  // XP SYSTEM INTEGRATION
  // ========================================

  /**
   * Award XP for habit completion asynchronously (non-blocking)
   * @param habitId ID of completed habit
   * @param isBonus Whether this is a bonus completion
   */
  private awardHabitCompletionXPAsync(habitId: string, isBonus: boolean): void {
    console.log(`🚀 DEBUG: awardHabitCompletionXPAsync called for habit ${habitId}, isBonus: ${isBonus}`);
    // Award basic XP immediately for instant UI feedback
    this.awardHabitCompletionXP(habitId, isBonus).catch(error => {
      console.error('Error awarding immediate XP:', error);
    });
    
    // Defer streak milestone checks to next tick (these are heavier operations)
    setTimeout(async () => {
      try {
        await this.checkAndAwardStreakMilestones(habitId);
      } catch (error) {
        console.error('Background streak milestone processing error:', error);
      }
    }, 0);
  }

  /**
   * Award XP for habit completion
   * @param habitId ID of completed habit
   * @param isBonus Whether this is a bonus completion
   */
  private async awardHabitCompletionXP(habitId: string, isBonus: boolean): Promise<void> {
    try {
      console.log(`💰 Attempting to award XP for habit ${habitId}, isBonus: ${isBonus}`);
      const habit = await this.getById(habitId);
      if (!habit) {
        console.log(`❌ Habit ${habitId} not found, no XP awarded`);
        return;
      }

      const xpAmount = isBonus ? XP_REWARDS.HABIT.BONUS_COMPLETION : XP_REWARDS.HABIT.SCHEDULED_COMPLETION;
      const xpSource = isBonus ? XPSourceType.HABIT_BONUS : XPSourceType.HABIT_COMPLETION;
      const description = isBonus ? 
        `Completed bonus habit: ${habit.name}` : 
        `Completed scheduled habit: ${habit.name}`;

      console.log(`💰 Awarding ${xpAmount} XP for ${xpSource}: ${description}`);
      const result = await GamificationService.addXP(xpAmount, {
        source: xpSource,
        sourceId: habitId,
        description
      });

      if (result.success) {
        console.log(`✅ XP successfully awarded: ${result.xpGained} XP (${result.totalXP} total)`);
        
        // Check streak milestones on background (don't block UI)
        setTimeout(async () => {
          try {
            await this.checkAndAwardStreakMilestones(habitId);
          } catch (error) {
            console.error('Background streak milestone processing error:', error);
          }
        }, 0);
      } else {
        console.log(`❌ XP award failed: ${result.error}`);
      }

    } catch (error) {
      console.error('Error awarding habit completion XP:', error);
      // Don't throw error - XP is bonus functionality
    }
  }

  /**
   * Subtract XP for habit un-completion asynchronously (non-blocking)
   * @param habitId ID of un-completed habit  
   * @param isBonus Whether this was a bonus completion
   */
  private awardHabitUncompleteXPAsync(habitId: string, isBonus: boolean): void {
    // Subtract XP immediately for instant UI feedback
    this.awardHabitUncompleteXP(habitId, isBonus).catch(error => {
      console.error('Error subtracting habit XP:', error);
    });
  }

  /**
   * Subtract XP for habit un-completion
   * @param habitId ID of un-completed habit
   * @param isBonus Whether this was a bonus completion
   */
  private async awardHabitUncompleteXP(habitId: string, isBonus: boolean): Promise<void> {
    try {
      const habit = await this.getById(habitId);
      if (!habit) return;

      const xpAmount = isBonus ? XP_REWARDS.HABIT.BONUS_COMPLETION : XP_REWARDS.HABIT.SCHEDULED_COMPLETION;
      const xpSource = isBonus ? XPSourceType.HABIT_BONUS : XPSourceType.HABIT_COMPLETION;

      await GamificationService.subtractXP(xpAmount, {
        source: xpSource,
        sourceId: habitId,
        description: isBonus ? 
          `Removed bonus habit completion: ${habit.name}` : 
          `Removed scheduled habit completion: ${habit.name}`
      });

    } catch (error) {
      console.error('Error subtracting habit completion XP:', error);
      // Don't throw error - XP is bonus functionality
    }
  }

  /**
   * Check for streak milestones and award bonus XP
   * @param habitId ID of the habit to check streaks for
   */
  private async checkAndAwardStreakMilestones(habitId: string): Promise<void> {
    try {
      const habit = await this.getById(habitId);
      if (!habit) return;

      // Get completions once and reuse for calculations
      const completions = await this.getCompletionsByHabitId(habitId);
      const currentStreak = this.calculateStreakFromCompletions(completions);
      const previousStreak = currentStreak - 1; // Previous streak length

      // Check if we've crossed a milestone boundary
      const milestones = [7, 14, 30, 50, 100];
      
      for (const milestone of milestones) {
        if (currentStreak >= milestone && previousStreak < milestone) {
          // We've just achieved this milestone
          await this.awardStreakMilestoneXP(habitId, milestone);
          break; // Only award one milestone per completion
        }
      }

    } catch (error) {
      console.error('Error checking streak milestones:', error);
      // Don't throw error - XP is bonus functionality
    }
  }

  /**
   * Award XP for reaching a streak milestone
   * @param habitId ID of the habit
   * @param milestone Streak milestone reached
   */
  private async awardStreakMilestoneXP(habitId: string, milestone: number): Promise<void> {
    try {
      // Lazy import gamification modules
      const { GamificationService } = await import('../gamificationService');
      const { XPSourceType } = await import('../../types/gamification');
      const { XP_REWARDS } = await import('../../constants/gamification');

      const habit = await this.getById(habitId);
      if (!habit) return;

      let xpAmount: number;
      switch (milestone) {
        case 7:
          xpAmount = XP_REWARDS.HABIT.STREAK_7_DAYS;
          break;
        case 14:
          xpAmount = XP_REWARDS.HABIT.STREAK_14_DAYS;
          break;
        case 30:
          xpAmount = XP_REWARDS.HABIT.STREAK_30_DAYS;
          break;
        case 50:
          xpAmount = XP_REWARDS.HABIT.STREAK_50_DAYS;
          break;
        case 100:
          xpAmount = XP_REWARDS.HABIT.STREAK_100_DAYS;
          break;
        default:
          xpAmount = XP_REWARDS.HABIT.STREAK_100_DAYS; // For 100+ streaks
      }

      await GamificationService.addXP(xpAmount, {
        source: XPSourceType.HABIT_STREAK_MILESTONE,
        sourceId: habitId,
        description: `Reached ${milestone}-day streak for habit: ${habit.name}`
      });

    } catch (error) {
      console.error('Error awarding streak milestone XP:', error);
      // Don't throw error - XP is bonus functionality
    }
  }

  /**
   * Calculate current streak for a habit (public method)
   * @param habitId ID of the habit
   * @returns Current streak length in days
   */
  private async calculateCurrentStreak(habitId: string): Promise<number> {
    try {
      const completions = await this.getCompletionsByHabitId(habitId);
      return this.calculateStreakFromCompletions(completions);
    } catch (error) {
      console.error('Error calculating current streak:', error);
      return 0;
    }
  }

  /**
   * Calculate current streak from completions array (optimized for reuse)
   * @param completions Array of habit completions
   * @returns Current streak length in days
   */
  private calculateStreakFromCompletions(completions: HabitCompletion[]): number {
    try {
      if (completions.length === 0) return 0;

      // Sort completions by date (most recent first)
      const sortedCompletions = completions
        .sort((a, b) => b.date.localeCompare(a.date));

      // Get today's date as string
      const today = new Date().toISOString().split('T')[0] || '';
      
      let streak = 0;
      let currentDate = today;
      
      // Count consecutive days with completions, going backwards from today
      while (true) {
        const hasCompletion = sortedCompletions.some(c => c.date === currentDate);
        
        if (hasCompletion) {
          streak++;
          // Move to previous day
          const prevDate = new Date(currentDate);
          prevDate.setDate(prevDate.getDate() - 1);
          currentDate = prevDate.toISOString().split('T')[0] || '';
        } else {
          break; // Streak broken
        }
      }

      return streak;

    } catch (error) {
      console.error('Error calculating streak from completions:', error);
      return 0;
    }
  }

  /**
   * Get habit statistics for achievements tracking
   * @param habitId ID of the habit
   * @returns Statistics object with completion counts and streaks
   */
  async getHabitStatistics(habitId: string): Promise<{
    totalCompletions: number;
    scheduledCompletions: number;
    bonusCompletions: number;
    currentStreak: number;
    longestStreak: number;
    totalDaysActive: number;
  }> {
    try {
      const completions = await this.getCompletionsByHabitId(habitId);
      
      const totalCompletions = completions.length;
      const scheduledCompletions = completions.filter(c => !c.isBonus).length;
      const bonusCompletions = completions.filter(c => c.isBonus).length;
      const currentStreak = await this.calculateCurrentStreak(habitId);
      const longestStreak = await this.calculateLongestStreak(habitId);
      
      // Calculate total days active (unique dates with completions)
      const uniqueDates = new Set(completions.map(c => c.date));
      const totalDaysActive = uniqueDates.size;

      return {
        totalCompletions,
        scheduledCompletions,
        bonusCompletions,
        currentStreak,
        longestStreak,
        totalDaysActive,
      };

    } catch (error) {
      console.error('Error getting habit statistics:', error);
      return {
        totalCompletions: 0,
        scheduledCompletions: 0,
        bonusCompletions: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalDaysActive: 0,
      };
    }
  }

  /**
   * Calculate the longest streak ever achieved for a habit
   * @param habitId ID of the habit
   * @returns Longest streak length in days
   */
  private async calculateLongestStreak(habitId: string): Promise<number> {
    try {
      const completions = await this.getCompletionsByHabitId(habitId);
      if (completions.length === 0) return 0;

      // Sort completions by date
      const sortedDates = completions
        .map(c => c.date)
        .sort()
        .filter((date, index, array) => array.indexOf(date) === index); // Remove duplicates

      let longestStreak = 0;
      let currentStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]!);
        const currentDate = new Date(sortedDates[i]!);
        
        // Calculate difference in days
        const diffTime = currentDate.getTime() - prevDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day
          currentStreak++;
        } else {
          // Streak broken
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }

      // Check final streak
      longestStreak = Math.max(longestStreak, currentStreak);

      return longestStreak;

    } catch (error) {
      console.error('Error calculating longest streak:', error);
      return 0;
    }
  }

  // ========================================
  // DEBUG & TESTING UTILITIES
  // ========================================

  /**
   * Enable or disable XP operations (for testing/debugging)
   * @param enabled Whether XP operations should be enabled
   */
  static setXPEnabled(enabled: boolean): void {
    HabitStorage.XP_ENABLED = enabled;
    console.log(`HabitStorage XP operations ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Get current XP enabled status
   * @returns Whether XP operations are currently enabled
   */
  static isXPEnabled(): boolean {
    return HabitStorage.XP_ENABLED;
  }
}

// Singleton instance
export const habitStorage = new HabitStorage();