/**
 * Progress Analyzer
 *
 * Analyzes user's daily progress to generate contextual notification messages
 * Checks: habits completion, journal entries, goals progress
 */

import { DailyTaskProgress } from '../../types/notification';
import { habitStorage } from '../storage/habitStorage';
import { getGratitudeStorageImpl } from '../../config/featureFlags';
import { goalStorage } from '../storage/goalStorage';
import { formatDateToString } from '../../utils/date';

// Get storage implementation based on feature flag
const gratitudeStorage = getGratitudeStorageImpl();

/**
 * Helper to check if two dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

class ProgressAnalyzer {
  private static instance: ProgressAnalyzer;

  private constructor() {}

  static getInstance(): ProgressAnalyzer {
    if (!ProgressAnalyzer.instance) {
      ProgressAnalyzer.instance = new ProgressAnalyzer();
    }
    return ProgressAnalyzer.instance;
  }

  /**
   * Analyze user's daily progress
   * Returns counts of incomplete tasks for smart notification generation
   */
  async analyzeDailyProgress(): Promise<DailyTaskProgress> {
    try {
      const today = new Date();

      const [habitsProgress, journalProgress, goalsProgress] = await Promise.all([
        this.analyzeHabitsProgress(today),
        this.analyzeJournalProgress(today),
        this.analyzeGoalsProgress(today),
      ]);

      const progress: DailyTaskProgress = {
        ...habitsProgress,
        ...journalProgress,
        ...goalsProgress,
      };

      console.log('[ProgressAnalyzer] Daily progress analyzed:', progress);

      return progress;
    } catch (error) {
      console.error('[ProgressAnalyzer] Failed to analyze daily progress:', error);
      throw error;
    }
  }

  /**
   * Analyze habits progress for today
   */
  private async analyzeHabitsProgress(today: Date): Promise<Pick<DailyTaskProgress, 'incompletedHabitsCount'>> {
    try {
      const habits = await habitStorage.getAll();
      const activeHabits = habits.filter((habit) => habit.isActive);

      // Count habits that are NOT completed today
      let incompletedCount = 0;

      for (const habit of activeHabits) {
        const completions = await habitStorage.getCompletionsByHabitId(habit.id);
        const completedToday = completions.some((completion) => {
          if (!completion.completedAt) return false;
          const completionDate = completion.completedAt instanceof Date
            ? completion.completedAt
            : new Date(completion.completedAt);
          return isSameDay(completionDate, today);
        });

        if (!completedToday) {
          incompletedCount++;
        }
      }

      return {
        incompletedHabitsCount: incompletedCount,
      };
    } catch (error) {
      console.error('[ProgressAnalyzer] Failed to analyze habits progress:', error);
      return {
        incompletedHabitsCount: 0,
      };
    }
  }

  /**
   * Analyze journal progress for today
   */
  private async analyzeJournalProgress(
    today: Date
  ): Promise<Pick<DailyTaskProgress, 'journalEntriesCount' | 'hasThreeBasicEntries' | 'bonusEntriesCount'>> {
    try {
      const allEntries = await gratitudeStorage.getAll();

      // Filter entries from today
      const todayEntries = allEntries.filter((entry) => {
        const entryDate = entry.createdAt instanceof Date
          ? entry.createdAt
          : new Date(entry.createdAt);
        return isSameDay(entryDate, today);
      });

      const entriesCount = todayEntries.length;
      const hasThreeBasicEntries = entriesCount >= 3;

      // Bonus entries = entries beyond the required 3
      const bonusEntriesCount = Math.max(0, entriesCount - 3);

      return {
        journalEntriesCount: entriesCount,
        hasThreeBasicEntries,
        bonusEntriesCount,
      };
    } catch (error) {
      console.error('[ProgressAnalyzer] Failed to analyze journal progress:', error);
      return {
        journalEntriesCount: 0,
        hasThreeBasicEntries: false,
        bonusEntriesCount: 0,
      };
    }
  }

  /**
   * Analyze goals progress for today
   */
  private async analyzeGoalsProgress(today: Date): Promise<Pick<DailyTaskProgress, 'goalProgressAddedToday'>> {
    try {
      const goals = await goalStorage.getAll();
      const activeGoals = goals.filter((goal) => goal.status === 'active');

      const todayDateString = formatDateToString(today);

      // Check if any active goal has progress added today
      for (const goal of activeGoals) {
        const progressHistory = await goalStorage.getProgressByGoalId(goal.id);

        // Check if any progress entry is from today
        const hasProgressToday = progressHistory.some((entry) => entry.date === todayDateString);

        if (hasProgressToday) {
          return {
            goalProgressAddedToday: true,
          };
        }
      }

      return {
        goalProgressAddedToday: false,
      };
    } catch (error) {
      console.error('[ProgressAnalyzer] Failed to analyze goals progress:', error);
      return {
        goalProgressAddedToday: false,
      };
    }
  }

  /**
   * Check if user has completed all daily tasks
   */
  async hasCompletedAllTasks(): Promise<boolean> {
    try {
      const progress = await this.analyzeDailyProgress();

      const allComplete =
        progress.incompletedHabitsCount === 0 &&
        progress.hasThreeBasicEntries &&
        progress.goalProgressAddedToday;

      return allComplete;
    } catch (error) {
      console.error('[ProgressAnalyzer] Failed to check task completion:', error);
      return false;
    }
  }
}

// Export singleton instance
export const progressAnalyzer = ProgressAnalyzer.getInstance();
