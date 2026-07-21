/**
 * Progress Analyzer
 *
 * Analyzes user's daily progress to generate contextual notification messages
 * Checks: habits completion, journal entries, goals progress
 */

import { DailyTaskProgress } from '../../types/notification';
import { getGratitudeStorageImpl, getHabitStorageImpl } from '../../config/featureFlags';
import { getGoalStorageImpl } from '../../config/featureFlags';

// Goals live in SQLite (USE_SQLITE_GOALS) — reading the legacy AsyncStorage
// singleton here made every goal-based evening reminder see zero goals.
const goalStorage = getGoalStorageImpl();
import { formatDateToString, getDayOfWeek } from '../../utils/date';
import { Habit, HabitCompletion } from '../../types/habit';

// Get storage implementation based on feature flag
const gratitudeStorage = getGratitudeStorageImpl();
const habitStorage = getHabitStorageImpl();

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
  private async analyzeHabitsProgress(today: Date): Promise<Pick<DailyTaskProgress, 'incompletedHabitsCount' | 'scheduledTodayCount'>> {
    try {
      const habits = await habitStorage.getAll();
      const activeHabits = habits.filter((habit: Habit) => habit.isActive);

      // Get today's day of week (e.g., 'monday', 'tuesday')
      const todayDayOfWeek = getDayOfWeek(today);

      // Filter habits that are scheduled for today
      const scheduledTodayHabits = activeHabits.filter((habit: Habit) =>
        habit.scheduledDays.includes(todayDayOfWeek)
      );

      // Count total scheduled for today (for weight calculation)
      const scheduledTodayCount = scheduledTodayHabits.length;

      // ONE indexed query for today's completions instead of one per habit
      // (N-7.3: this runs on every app foreground — the N+1 loop scaled with
      // the number of scheduled habits).
      const todayDateString = formatDateToString(today);
      const todayCompletions = await habitStorage.getCompletionsByDate(todayDateString);

      // N-7.5: a completion belongs to the day in its `date` field — NOT to the
      // day it was tapped (`completedAt`). Using the timestamp silently breaks
      // as soon as completing a past day becomes possible (see
      // projectplan-future-updates.md → "Make-up Past Days").
      const completedHabitIdsToday = new Set(
        todayCompletions
          .filter((completion: HabitCompletion) => completion.completed)
          .map((completion: HabitCompletion) => completion.habitId)
      );

      const incompletedCount = scheduledTodayHabits.filter(
        (habit: Habit) => !completedHabitIdsToday.has(habit.id)
      ).length;

      return {
        incompletedHabitsCount: incompletedCount,
        scheduledTodayCount: scheduledTodayCount,
      };
    } catch (error) {
      console.error('[ProgressAnalyzer] Failed to analyze habits progress:', error);
      return {
        incompletedHabitsCount: 0,
        scheduledTodayCount: 0,
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
      // N-7.4: indexed single-day query instead of getAll() + JS filter
      // (getAll loaded the user's ENTIRE journal history on every foreground).
      // N-7.5: getByDate keys off the entry's `date` field — the day the entry
      // belongs to — not its creation timestamp.
      const todayEntries = await gratitudeStorage.getByDate(formatDateToString(today));

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
  private async analyzeGoalsProgress(today: Date): Promise<Pick<DailyTaskProgress, 'goalProgressAddedToday' | 'hasActiveGoals'>> {
    try {
      const goals = await goalStorage.getAll();
      const activeGoals = goals.filter((goal) => goal.status === 'active');
      const hasActiveGoals = activeGoals.length > 0;

      const todayDateString = formatDateToString(today);

      // Check if any active goal has progress added today
      for (const goal of activeGoals) {
        const progressHistory = await goalStorage.getProgressByGoalId(goal.id);

        // Check if any progress entry is from today
        const hasProgressToday = progressHistory.some((entry) => entry.date === todayDateString);

        if (hasProgressToday) {
          return {
            goalProgressAddedToday: true,
            hasActiveGoals,
          };
        }
      }

      return {
        goalProgressAddedToday: false,
        hasActiveGoals,
      };
    } catch (error) {
      console.error('[ProgressAnalyzer] Failed to analyze goals progress:', error);
      return {
        goalProgressAddedToday: false,
        hasActiveGoals: false,
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
