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
      
      // XP rewards now handled via GamificationService integration in UI layer
      // MIGRATION: XP logic moved to enhanced GamificationService for consistency
      console.log(`✅ Habit completion created - XP will be handled by enhanced GamificationService`);
      
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
      
      // XP subtraction now handled via GamificationService integration in UI layer
      // MIGRATION: XP logic moved to enhanced GamificationService for consistency
      console.log(`✅ Habit completion deleted - XP subtraction will be handled by enhanced GamificationService`);
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
   * DEPRECATED: Award XP for habit completion asynchronously (non-blocking)
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   * This method is kept for backward compatibility but no longer used
   * @param habitId ID of completed habit
   * @param isBonus Whether this is a bonus completion
   */
  private awardHabitCompletionXPAsync(habitId: string, isBonus: boolean): void {
    console.log(`🚨 DEPRECATED: awardHabitCompletionXPAsync called for habit ${habitId}, isBonus: ${isBonus}`);
    console.log(`📝 MIGRATION: XP logic moved to enhanced GamificationService - this call is no longer active`);
    
    // XP handling now performed via enhanced GamificationService integration in UI layer
    // This preserves the method signature for any remaining references but delegates to new system
  }

  /**
   * DEPRECATED: Award XP for habit completion
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   * This method is kept for backward compatibility but should not be used
   * @param habitId ID of completed habit
   * @param isBonus Whether this is a bonus completion
   */
  private async awardHabitCompletionXP(habitId: string, isBonus: boolean): Promise<void> {
    console.log(`🚨 DEPRECATED: awardHabitCompletionXP called for habit ${habitId}, isBonus: ${isBonus}`);
    console.log(`📝 MIGRATION: XP logic moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration in UI layer for consistent XP handling`);
    
    // XP handling now performed via enhanced GamificationService integration in UI layer
    // This preserves the method signature for any remaining references but delegates to new system
  }

  /**
   * DEPRECATED: Subtract XP for habit un-completion asynchronously (non-blocking)
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   * @param habitId ID of un-completed habit  
   * @param isBonus Whether this was a bonus completion
   */
  private awardHabitUncompleteXPAsync(habitId: string, isBonus: boolean): void {
    console.log(`🚨 DEPRECATED: awardHabitUncompleteXPAsync called for habit ${habitId}, isBonus: ${isBonus}`);
    console.log(`📝 MIGRATION: XP logic moved to enhanced GamificationService - this call is no longer active`);
  }

  /**
   * DEPRECATED: Subtract XP for habit un-completion
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   * @param habitId ID of un-completed habit
   * @param isBonus Whether this was a bonus completion
   */
  private async awardHabitUncompleteXP(habitId: string, isBonus: boolean): Promise<void> {
    console.log(`🚨 DEPRECATED: awardHabitUncompleteXP called for habit ${habitId}, isBonus: ${isBonus}`);
    console.log(`📝 MIGRATION: XP logic moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration in UI layer for consistent XP handling`);
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
          // MIGRATION: Streak milestone XP now handled via enhanced GamificationService integration in UI layer
          console.log(`🏆 Streak milestone ${milestone} reached for habit ${habitId} - XP will be handled by enhanced GamificationService`);
          break; // Only detect one milestone per completion
        }
      }

    } catch (error) {
      console.error('Error checking streak milestones:', error);
      // Don't throw error - XP is bonus functionality
    }
  }

  /**
   * DEPRECATED: Award XP for reaching a streak milestone
   * MIGRATION: XP logic moved to enhanced GamificationService for consistency
   * Streak milestones should be handled via enhanced GamificationService integration
   * @param habitId ID of the habit
   * @param milestone Streak milestone reached
   */
  private async awardStreakMilestoneXP(habitId: string, milestone: number): Promise<void> {
    console.log(`🚨 DEPRECATED: awardStreakMilestoneXP called for habit ${habitId}, milestone ${milestone}`);
    console.log(`📝 MIGRATION: Streak milestone XP moved to enhanced GamificationService - this call is no longer active`);
    console.log(`💡 USE INSTEAD: Enhanced GamificationService integration with streak milestone detection`);
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

  // ========================================
  // WEEKLY CHALLENGE SUPPORT METHODS
  // ========================================

  /**
   * Get habit completion statistics for challenge tracking
   */
  async getHabitCompletionStats(days: number): Promise<{
    totalScheduled: number;
    completed: number;
    completionRate: number;
  }> {
    try {
      const habits = await this.getAll();
      const activeHabits = habits.filter(h => h.isActive);
      
      if (activeHabits.length === 0) {
        return { totalScheduled: 0, completed: 0, completionRate: 0 };
      }

      // Calculate total scheduled opportunities in last N days
      let totalScheduled = 0;
      let completed = 0;

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0] as DateString;
        
        const dayCompletions = await this.getCompletionsByDate(dateStr);
        const scheduledCompletions = dayCompletions.filter(c => !c.isBonus);
        
        // Count scheduled habits for this day (based on frequency)
        for (const habit of activeHabits) {
          if (this.shouldHabitBeScheduledOnDate(habit, dateStr)) {
            totalScheduled++;
            if (scheduledCompletions.some(c => c.habitId === habit.id)) {
              completed++;
            }
          }
        }
      }

      const completionRate = totalScheduled > 0 ? completed / totalScheduled : 0;

      return { totalScheduled, completed, completionRate };
    } catch (error) {
      console.error('HabitStorage.getHabitCompletionStats error:', error);
      return { totalScheduled: 0, completed: 0, completionRate: 0 };
    }
  }

  /**
   * Get habit completion statistics for a specific date
   */
  async getHabitCompletionStatsForDate(date: DateString): Promise<{
    totalScheduled: number;
    completed: number;
    completionRate: number;
  }> {
    try {
      const habits = await this.getAll();
      const activeHabits = habits.filter(h => h.isActive);
      const dayCompletions = await this.getCompletionsByDate(date);
      const scheduledCompletions = dayCompletions.filter(c => !c.isBonus);

      let totalScheduled = 0;
      let completed = 0;

      for (const habit of activeHabits) {
        if (this.shouldHabitBeScheduledOnDate(habit, date)) {
          totalScheduled++;
          if (scheduledCompletions.some(c => c.habitId === habit.id)) {
            completed++;
          }
        }
      }

      const completionRate = totalScheduled > 0 ? completed / totalScheduled : 0;

      return { totalScheduled, completed, completionRate };
    } catch (error) {
      console.error('HabitStorage.getHabitCompletionStatsForDate error:', error);
      return { totalScheduled: 0, completed: 0, completionRate: 0 };
    }
  }

  /**
   * Get unique habits completed on a specific date
   */
  async getUniqueHabitsCompletedOnDate(date: DateString): Promise<string[]> {
    try {
      const completions = await this.getCompletionsByDate(date);
      const uniqueHabitIds = [...new Set(completions.map(c => c.habitId))];
      return uniqueHabitIds;
    } catch (error) {
      console.error('HabitStorage.getUniqueHabitsCompletedOnDate error:', error);
      return [];
    }
  }

  /**
   * Get journal entries for a specific date (for GratitudeStorage compatibility)
   */
  async getEntriesForDate(date: DateString): Promise<any[]> {
    // This method is for API compatibility with GratitudeStorage
    // Returns empty array since this is HabitStorage
    return [];
  }

  /**
   * Check if a habit should be scheduled on a specific date based on frequency
   */
  private shouldHabitBeScheduledOnDate(habit: Habit, date: DateString): boolean {
    // Simple logic - for daily habits, always true
    // For more complex scheduling, implement frequency logic here
    return true; // Assuming daily habits for now
  }
}

// Singleton instance
export const habitStorage = new HabitStorage();