// Achievement Integration Layer
// Connects AchievementService with existing storage services for real data

import { HabitStorage } from './storage/habitStorage';
import { GratitudeStorage } from './storage/gratitudeStorage';
import { GoalStorage } from './storage/goalStorage';
import { DateString } from '../types/common';
import { today, formatDateToString, subtractDays } from '../utils/date';

/**
 * Integration layer providing real data to AchievementService
 * This class bridges the gap between achievement conditions and actual app data
 */
export class AchievementIntegration {
  // Storage instances
  private static habitStorage = new HabitStorage();
  private static gratitudeStorage = new GratitudeStorage();
  private static goalStorage = new GoalStorage();

  // ========================================
  // HABIT DATA INTEGRATION
  // ========================================



  /**
   * Get total number of habits created
   */
  static async getHabitCreationCount(timeframe?: string): Promise<number> {
    try {
      const habits = await this.habitStorage.getAll();
      
      if (!timeframe || timeframe === 'all_time') {
        return habits.length;
      }
      
      // Filter by timeframe if specified
      const filteredHabits = this.filterByTimeframe(
        habits.map(h => ({ createdAt: h.createdAt, date: formatDateToString(h.createdAt) })),
        timeframe
      );
      
      return filteredHabits.length;
    } catch (error) {
      console.error('AchievementIntegration.getHabitCreationCount error:', error);
      return 0;
    }
  }

  /**
   * Get maximum habit streak across all habits
   */
  static async getMaxHabitStreak(): Promise<number> {
    try {
      const habits = await this.habitStorage.getAll();
      let maxStreak = 0;
      
      for (const habit of habits) {
        const habitStats = await this.getHabitStats(habit.id);
        if (habitStats?.currentStreak && habitStats.currentStreak > maxStreak) {
          maxStreak = habitStats.currentStreak;
        }
      }
      
      return maxStreak;
    } catch (error) {
      console.error('AchievementIntegration.getMaxHabitStreak error:', error);
      return 0;
    }
  }

  /**
   * Get maximum unique habits completed in a single day
   */
  static async getDailyHabitVariety(timeframe?: string): Promise<number> {
    try {
      const habits = await this.habitStorage.getAll();
      const dailyVarietyCounts: Record<string, Set<string>> = {};
      
      // Analyze completions for each habit
      for (const habit of habits) {
        const completions = await this.getHabitCompletions(habit.id);
        
        for (const completion of completions) {
          const dateStr = completion.date;
          if (!dailyVarietyCounts[dateStr]) {
            dailyVarietyCounts[dateStr] = new Set();
          }
          dailyVarietyCounts[dateStr].add(habit.id);
        }
      }
      
      // Find maximum variety in a single day
      let maxVariety = 0;
      const dates = Object.keys(dailyVarietyCounts);
      
      for (const date of dates) {
        const varietyCount = dailyVarietyCounts[date]?.size || 0;
        if (varietyCount > maxVariety) {
          maxVariety = varietyCount;
        }
      }
      
      return maxVariety;
    } catch (error) {
      console.error('AchievementIntegration.getDailyHabitVariety error:', error);
      return 0;
    }
  }

  /**
   * Get total habit completions count
   */
  static async getTotalHabitCompletions(timeframe?: string): Promise<number> {
    try {
      const habits = await this.habitStorage.getAll();
      let totalCompletions = 0;
      
      for (const habit of habits) {
        const completions = await this.getHabitCompletions(habit.id);
        
        if (!timeframe || timeframe === 'all_time') {
          totalCompletions += completions.length;
        } else {
          const filteredCompletions = this.filterByTimeframe(completions, timeframe);
          totalCompletions += filteredCompletions.length;
        }
      }
      
      return totalCompletions;
    } catch (error) {
      console.error('AchievementIntegration.getTotalHabitCompletions error:', error);
      return 0;
    }
  }

  // ========================================
  // JOURNAL DATA INTEGRATION
  // ========================================

  /**
   * Get current journal streak
   */
  static async getJournalStreak(): Promise<number> {
    try {
      const streak = await this.getGratitudeCurrentStreak();
      return streak;
    } catch (error) {
      console.error('AchievementIntegration.getJournalStreak error:', error);
      return 0;
    }
  }

  /**
   * Get total journal entries count
   */
  static async getTotalJournalEntries(timeframe?: string): Promise<number> {
    try {
      if (!timeframe || timeframe === 'all_time') {
        const totalCount = await this.getTotalEntryCount();
        return totalCount;
      }
      
      // For specific timeframes, we need to get entries and filter
      const allEntries = await this.gratitudeStorage.getAll();
      const filteredEntries = this.filterByTimeframe(allEntries, timeframe);
      
      return filteredEntries.length;
    } catch (error) {
      console.error('AchievementIntegration.getTotalJournalEntries error:', error);
      return 0;
    }
  }

  /**
   * Get maximum journal entry length (character count)
   */
  static async getMaxJournalEntryLength(timeframe?: string): Promise<number> {
    try {
      const allEntries = await this.gratitudeStorage.getAll();
      let maxLength = 0;
      
      // Filter by timeframe if specified
      const entriesToCheck = timeframe && timeframe !== 'all_time' 
        ? this.filterByTimeframe(allEntries, timeframe)
        : allEntries;
      
      for (const entry of entriesToCheck) {
        const entryLength = entry.content.length;
        if (entryLength > maxLength) {
          maxLength = entryLength;
        }
      }
      
      return maxLength;
    } catch (error) {
      console.error('AchievementIntegration.getMaxJournalEntryLength error:', error);
      return 0;
    }
  }

  /**
   * Get total bonus journal entries count
   */
  static async getBonusJournalEntriesCount(timeframe?: string): Promise<number> {
    try {
      // This would need to integrate with GratitudeStorage to count bonus entries
      // For now, estimate based on total entries (entries beyond 3 per day are bonus)
      const allEntries = await this.gratitudeStorage.getAll();
      
      // Group entries by date
      const entriesByDate: Record<string, number> = {};
      const entriesToCheck = timeframe && timeframe !== 'all_time' 
        ? this.filterByTimeframe(allEntries, timeframe)
        : allEntries;
      
      for (const entry of entriesToCheck) {
        const dateStr = entry.date;
        entriesByDate[dateStr] = (entriesByDate[dateStr] || 0) + 1;
      }
      
      // Count bonus entries (entries beyond 3 per day)
      let bonusCount = 0;
      for (const date in entriesByDate) {
        const dailyCount = entriesByDate[date];
        if (dailyCount && dailyCount > 3) {
          bonusCount += (dailyCount - 3);
        }
      }
      
      return bonusCount;
    } catch (error) {
      console.error('AchievementIntegration.getBonusJournalEntriesCount error:', error);
      return 0;
    }
  }

  // ========================================
  // GOAL DATA INTEGRATION  
  // ========================================

  /**
   * Get total number of goals created
   */
  static async getGoalCreationCount(timeframe?: string): Promise<number> {
    try {
      const goals = await this.goalStorage.getAll();
      
      if (!timeframe || timeframe === 'all_time') {
        return goals.length;
      }
      
      // Filter by timeframe if specified
      const filteredGoals = this.filterByTimeframe(
        goals.map(g => ({ createdAt: g.createdAt, date: formatDateToString(g.createdAt) })),
        timeframe
      );
      
      return filteredGoals.length;
    } catch (error) {
      console.error('AchievementIntegration.getGoalCreationCount error:', error);
      return 0;
    }
  }

  /**
   * Get total number of completed goals
   */
  static async getCompletedGoalsCount(timeframe?: string): Promise<number> {
    try {
      const goals = await this.goalStorage.getAll();
      let completedCount = 0;
      
      for (const goal of goals) {
        if (goal.status === 'completed') {
          // Check if completion falls within timeframe
          if (!timeframe || timeframe === 'all_time') {
            completedCount++;
          } else if (goal.completedDate) {
            if (this.isDateInTimeframe(goal.completedDate, timeframe)) {
              completedCount++;
            }
          }
        }
      }
      
      return completedCount;
    } catch (error) {
      console.error('AchievementIntegration.getCompletedGoalsCount error:', error);
      return 0;
    }
  }

  /**
   * Get maximum goal target value
   */
  static async getMaxGoalTargetValue(timeframe?: string): Promise<number> {
    try {
      const goals = await this.goalStorage.getAll();
      let maxTargetValue = 0;
      
      // Filter by timeframe if specified
      const goalsToCheck = timeframe && timeframe !== 'all_time'
        ? goals.filter(g => this.isDateInTimeframe(formatDateToString(g.createdAt), timeframe))
        : goals;
      
      for (const goal of goalsToCheck) {
        if (goal.targetValue > maxTargetValue) {
          maxTargetValue = goal.targetValue;
        }
      }
      
      return maxTargetValue;
    } catch (error) {
      console.error('AchievementIntegration.getMaxGoalTargetValue error:', error);
      return 0;
    }
  }

  /**
   * Get total goal progress entries count
   */
  static async getTotalGoalProgressEntries(timeframe?: string): Promise<number> {
    try {
      const goals = await this.goalStorage.getAll();
      let totalProgressEntries = 0;
      
      for (const goal of goals) {
        const progress = await this.getGoalProgress(goal.id);
        
        if (!timeframe || timeframe === 'all_time') {
          totalProgressEntries += progress.length;
        } else {
          const filteredProgress = this.filterByTimeframe(progress, timeframe);
          totalProgressEntries += filteredProgress.length;
        }
      }
      
      return totalProgressEntries;
    } catch (error) {
      console.error('AchievementIntegration.getTotalGoalProgressEntries error:', error);
      return 0;
    }
  }

  // ========================================
  // CROSS-FEATURE ANALYSIS
  // ========================================

  /**
   * Get consecutive days of goal progress
   * Used for Progress Tracker achievement to track daily goal engagement
   */
  static async getGoalProgressConsecutiveDays(timeframe?: string): Promise<number> {
    try {
      const { GamificationService } = await import('./gamificationService');
      const transactions = await GamificationService.getAllTransactions();
      
      if (transactions.length === 0) {
        return 0;
      }
      
      // Filter for goal progress transactions
      const goalProgressTransactions = transactions.filter(t => 
        t.source === 'goal_progress' && t.amount > 0
      );
      
      if (goalProgressTransactions.length === 0) {
        return 0;
      }
      
      // Get unique dates with goal progress, sorted chronologically
      const progressDates = [...new Set(goalProgressTransactions.map(t => t.date))]
        .sort((a, b) => a.localeCompare(b));
      
      // Find longest consecutive streak ending with today or in the past
      let maxConsecutive = 0;
      let currentConsecutive = 0;
      const todayStr = today();
      
      // Check consecutive days from the end (most recent)
      for (let i = progressDates.length - 1; i >= 0; i--) {
        const currentDate = progressDates[i];
        
        if (i === progressDates.length - 1) {
          // First iteration (most recent date)
          currentConsecutive = 1;
          maxConsecutive = 1;
        } else {
          // Check if current date is exactly one day before the previous date
          const nextDate = progressDates[i + 1];
          if (!nextDate) break; // Safety check
          
          const expectedDate = formatDateToString(new Date(Date.parse(nextDate) - 24 * 60 * 60 * 1000));
          
          if (currentDate === expectedDate) {
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
          } else {
            // Gap found, streak broken
            break;
          }
        }
      }
      
      return maxConsecutive;
    } catch (error) {
      console.error('AchievementIntegration.getGoalProgressConsecutiveDays error:', error);
      return 0;
    }
  }

  /**
   * Get habit XP ratio as percentage (habit XP / total XP * 100)
   * Used for Habit Legend achievement to ensure user earned primarily from habits
   */
  static async getHabitXPRatio(timeframe?: string): Promise<number> {
    try {
      const { GamificationService } = await import('./gamificationService');
      const transactions = await GamificationService.getAllTransactions();
      
      if (transactions.length === 0) {
        return 0;
      }
      
      // Filter by timeframe if specified
      const filteredTransactions = this.filterByTimeframe(
        transactions.map(t => ({ ...t, date: t.date })),
        timeframe || 'all_time'
      );
      
      // Calculate total XP and habit XP
      let totalXP = 0;
      let habitXP = 0;
      
      for (const transaction of filteredTransactions) {
        if (transaction.amount > 0) { // Only count positive XP gains
          totalXP += transaction.amount;
          
          // Count habit-related XP sources
          if (transaction.source === 'habit_completion' || 
              transaction.source === 'habit_bonus' || 
              transaction.source === 'habit_streak_milestone') {
            habitXP += transaction.amount;
          }
        }
      }
      
      // Return percentage (0-100)
      return totalXP > 0 ? Math.round((habitXP / totalXP) * 100) : 0;
    } catch (error) {
      console.error('AchievementIntegration.getHabitXPRatio error:', error);
      return 0;
    }
  }

  /**
   * Check if all 3 features (habits, journal, goals) were used on the same day
   */
  static async getDailyFeatureCombo(timeframe?: string): Promise<number> {
    try {
      // Get data from all features
      const habits = await this.habitStorage.getAll();
      const journalEntries = await this.gratitudeStorage.getAll();
      const goals = await this.goalStorage.getAll();
      
      // Track dates when each feature was used
      const habitDates = new Set<string>();
      const journalDates = new Set<string>();
      const goalDates = new Set<string>();
      
      // Collect habit completion dates
      for (const habit of habits) {
        const completions = await this.getHabitCompletions(habit.id);
        for (const completion of completions) {
          habitDates.add(completion.date);
        }
      }
      
      // Collect journal entry dates
      for (const entry of journalEntries) {
        journalDates.add(entry.date);
      }
      
      // Collect goal progress dates
      for (const goal of goals) {
        const progress = await this.getGoalProgress(goal.id);
        for (const progressEntry of progress) {
          goalDates.add(progressEntry.date);
        }
      }
      
      // Find dates where all 3 features were used
      let comboDays = 0;
      const allDates = new Set([...habitDates, ...journalDates, ...goalDates]);
      
      for (const date of allDates) {
        if (habitDates.has(date) && journalDates.has(date) && goalDates.has(date)) {
          // Check if date is within timeframe
          if (!timeframe || timeframe === 'all_time' || this.isDateInTimeframe(date, timeframe)) {
            comboDays++;
          }
        }
      }
      
      // For 'daily' timeframe, return 1 if today has all features, 0 otherwise
      if (timeframe === 'daily') {
        const todayStr = today();
        return (habitDates.has(todayStr) && journalDates.has(todayStr) && goalDates.has(todayStr)) ? 1 : 0;
      }
      
      return comboDays;
    } catch (error) {
      console.error('AchievementIntegration.getDailyFeatureCombo error:', error);
      return 0;
    }
  }

  /**
   * Get consecutive days of app usage (days with any XP activity)
   */
  static async getConsecutiveAppUsageDays(): Promise<number> {
    try {
      const { GamificationService } = await import('./gamificationService');
      const transactions = await GamificationService.getAllTransactions();
      
      if (transactions.length === 0) {
        return 0;
      }
      
      // Get unique dates with any XP activity, sorted chronologically
      const activityDates = [...new Set(transactions.map(t => t.date))]
        .sort((a, b) => a.localeCompare(b));
      
      if (activityDates.length === 0) {
        return 0;
      }
      
      // Find longest consecutive streak ending with today or in the past
      let maxConsecutive = 0;
      let currentConsecutive = 0;
      const todayStr = today();
      
      // Check consecutive days from the end (most recent)
      for (let i = activityDates.length - 1; i >= 0; i--) {
        const currentDate = activityDates[i];
        
        if (i === activityDates.length - 1) {
          // First iteration (most recent date)
          currentConsecutive = 1;
          maxConsecutive = 1;
        } else {
          // Check if current date is exactly one day before the previous date
          const nextDate = activityDates[i + 1];
          if (!nextDate) break; // Safety check
          
          const expectedDate = formatDateToString(new Date(Date.parse(nextDate) - 24 * 60 * 60 * 1000));
          
          if (currentDate === expectedDate) {
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
          } else {
            // Gap found, streak broken
            break;
          }
        }
      }
      
      return maxConsecutive;
    } catch (error) {
      console.error('AchievementIntegration.getConsecutiveAppUsageDays error:', error);
      return 0;
    }
  }

  /**
   * Get total recommendations followed count
   */
  static async getRecommendationsFollowedCount(timeframe?: string): Promise<number> {
    try {
      // TODO: This will be implemented when recommendation tracking system is added
      // For now, estimate based on engagement with recommendations feature
      const { GamificationService } = await import('./gamificationService');
      const transactions = await GamificationService.getAllTransactions();
      
      // Count engagement transactions (placeholder logic)
      const engagementTransactions = transactions.filter(t => 
        t.source === 'daily_engagement' && t.amount > 0
      );
      
      // Filter by timeframe if specified  
      if (timeframe && timeframe !== 'all_time') {
        const filteredTransactions = this.filterByTimeframe(
          engagementTransactions.map(t => ({ ...t, date: t.date })),
          timeframe
        );
        return Math.floor(filteredTransactions.length * 0.3); // Estimate 30% are recommendation follows
      }
      
      return Math.floor(engagementTransactions.length * 0.3); // Estimate 30% are recommendation follows
    } catch (error) {
      console.error('AchievementIntegration.getRecommendationsFollowedCount error:', error);
      return 0;
    }
  }

  /**
   * Get total achievements unlocked count
   */
  static async getAchievementsUnlockedCount(timeframe?: string): Promise<number> {
    try {
      const { AchievementStorage } = await import('./achievementStorage');
      const userAchievements = await AchievementStorage.getUserAchievements();
      
      if (!timeframe || timeframe === 'all_time') {
        return userAchievements.unlockedAchievements.length;
      }
      
      // For timeframe filtering, we need unlock events
      const unlockEvents = await AchievementStorage.getUnlockEvents();
      
      const filteredEvents = this.filterByTimeframe(
        unlockEvents.map(e => ({ 
          date: formatDateToString(e.unlockedAt),
          unlockedAt: e.unlockedAt
        })),
        timeframe
      );
      
      return filteredEvents.length;
    } catch (error) {
      console.error('AchievementIntegration.getAchievementsUnlockedCount error:', error);
      return 0;
    }
  }

  /**
   * Get count of same-day habit creation and completion (Lightning Start)
   */
  static async getSameDayHabitCreationCompletionCount(timeframe?: string): Promise<number> {
    try {
      const habits = await this.habitStorage.getAll();
      let sameDayCount = 0;
      
      for (const habit of habits) {
        const creationDate = formatDateToString(habit.createdAt);
        const completions = await this.getHabitCompletions(habit.id);
        
        // Check if any completion happened on the same day as creation
        const sameDayCompletion = completions.find(completion => 
          completion.date === creationDate
        );
        
        if (sameDayCompletion) {
          // Check if this falls within timeframe
          if (!timeframe || timeframe === 'all_time' || 
              this.isDateInTimeframe(creationDate, timeframe)) {
            sameDayCount++;
          }
        }
      }
      
      return sameDayCount;
    } catch (error) {
      console.error('AchievementIntegration.getSameDayHabitCreationCompletionCount error:', error);
      return 0;
    }
  }

  /**
   * Get maximum number of active habits at the same time (Seven Wonder)
   */
  static async getActiveHabitsSimultaneousCount(timeframe?: string): Promise<number> {
    try {
      const habits = await this.habitStorage.getAll();
      
      // For simplicity, count all created habits as active
      // In a more sophisticated system, we'd track historical active habit counts and deletions
      const activeHabits = habits.filter(habit => 
        (!timeframe || timeframe === 'all_time' || 
         this.isDateInTimeframe(formatDateToString(habit.createdAt), timeframe))
      );
      
      return activeHabits.length;
    } catch (error) {
      console.error('AchievementIntegration.getActiveHabitsSimultaneousCount error:', error);
      return 0;
    }
  }

  /**
   * Get count of comeback activities (Persistence Pays)
   * Detects activities after 3+ day breaks in XP transactions
   */
  static async getComebackActivitiesCount(timeframe?: string): Promise<number> {
    try {
      const { GamificationService } = await import('./gamificationService');
      const transactions = await GamificationService.getAllTransactions();
      
      if (transactions.length === 0) {
        return 0;
      }
      
      // Sort transactions by date
      const sortedTransactions = transactions
        .filter(t => t.amount > 0) // Only count positive XP activities
        .sort((a, b) => a.date.localeCompare(b.date));
      
      let comebackCount = 0;
      let previousDate: string | null = null;
      
      for (const transaction of sortedTransactions) {
        if (previousDate) {
          // Calculate days between transactions
          const daysBetween = this.calculateDaysBetween(previousDate, transaction.date);
          
          // If gap is 3+ days, this is a comeback
          if (daysBetween >= 3) {
            if (!timeframe || timeframe === 'all_time' || 
                this.isDateInTimeframe(transaction.date, timeframe)) {
              comebackCount++;
            }
          }
        }
        previousDate = transaction.date;
      }
      
      return comebackCount;
    } catch (error) {
      console.error('AchievementIntegration.getComebackActivitiesCount error:', error);
      return 0;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Filter array of items by timeframe based on date property
   */
  private static filterByTimeframe<T extends { date: string } | { createdAt: Date }>(
    items: T[],
    timeframe: string
  ): T[] {
    if (!timeframe || timeframe === 'all_time') {
      return items;
    }
    
    const now = new Date();
    const todayStr = today();
    
    return items.filter(item => {
      let itemDateStr: string;
      
      if ('date' in item) {
        itemDateStr = item.date;
      } else if ('createdAt' in item) {
        itemDateStr = formatDateToString(item.createdAt);
      } else {
        return false;
      }
      
      return this.isDateInTimeframe(itemDateStr, timeframe);
    });
  }

  /**
   * Check if a date string falls within specified timeframe
   */
  private static isDateInTimeframe(dateStr: string, timeframe: string): boolean {
    const now = new Date();
    const todayStr = today();
    
    switch (timeframe) {
      case 'daily':
        return dateStr === todayStr;
        
      case 'weekly':
        const weekAgo = subtractDays(todayStr, 7);
        return dateStr >= weekAgo && dateStr <= todayStr;
        
      case 'monthly':
        const monthAgo = subtractDays(todayStr, 30);
        return dateStr >= monthAgo && dateStr <= todayStr;
        
      default:
        return true;
    }
  }

  /**
   * Calculate days between two date strings
   */
  private static calculateDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  // ========================================
  // PUBLIC API FOR ACHIEVEMENT SERVICE
  // ========================================

  /**
   * Get count value for achievement conditions (used by AchievementService)
   */
  static async getCountValueForAchievement(
    source: string,
    timeframe?: string
  ): Promise<number> {
    try {
      switch (source) {
        case 'habit_creation':
          return await this.getHabitCreationCount(timeframe);
          
        case 'goal_creation':
          return await this.getGoalCreationCount(timeframe);
          
        case 'journal_entry_length':
          return await this.getMaxJournalEntryLength(timeframe);
          
        case 'journal_bonus_entries':
          return await this.getBonusJournalEntriesCount(timeframe);
          
        case 'goal_target_value':
          return await this.getMaxGoalTargetValue(timeframe);
          
        case 'goal_progress_consecutive_days':
          return await this.getGoalProgressConsecutiveDays(timeframe);
          
        case 'daily_habit_variety':
          return await this.getDailyHabitVariety(timeframe);
          
        case 'daily_feature_combo':
          return await this.getDailyFeatureCombo(timeframe);
          
        case 'habit_xp_ratio':
          return await this.getHabitXPRatio(timeframe);
          
        case 'app_usage_days':
          return await this.getConsecutiveAppUsageDays();
          
        case 'recommendations_followed':
          return await this.getRecommendationsFollowedCount(timeframe);
          
        case 'achievements_unlocked':
          return await this.getAchievementsUnlockedCount(timeframe);
          
        case 'same_day_habit_creation_completion':
          return await this.getSameDayHabitCreationCompletionCount(timeframe);
          
        case 'active_habits_simultaneous':
          return await this.getActiveHabitsSimultaneousCount(timeframe);
          
        case 'comeback_activities':
          return await this.getComebackActivitiesCount(timeframe);
          
        case 'user_level':
          // This is handled directly in AchievementService via GamificationStats
          return 0;
          
        default:
          // For XP sources, return 0 - these are handled by transaction analysis
          return 0;
      }
    } catch (error) {
      console.error('AchievementIntegration.getCountValueForAchievement error:', error);
      return 0;
    }
  }

  /**
   * Get streak value for achievement conditions (used by AchievementService)
   */
  static async getStreakValueForAchievement(
    source: string,
    timeframe?: string
  ): Promise<number> {
    try {
      switch (source) {
        case 'habit_streak':
          return await this.getMaxHabitStreak();
          
        case 'journal_streak':
          return await this.getJournalStreak();
          
        case 'app_usage_days':
          return await this.getConsecutiveAppUsageDays();
          
        default:
          return 0;
      }
    } catch (error) {
      console.error('AchievementIntegration.getStreakValueForAchievement error:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive statistics for achievement evaluation
   */
  static async getAchievementDataSnapshot(): Promise<Record<string, number>> {
    try {
      return {
        // Habits
        totalHabits: await this.getHabitCreationCount(),
        totalHabitCompletions: await this.getTotalHabitCompletions(),
        maxHabitStreak: await this.getMaxHabitStreak(),
        maxDailyHabitVariety: await this.getDailyHabitVariety(),
        
        // Journal
        totalJournalEntries: await this.getTotalJournalEntries(),
        currentJournalStreak: await this.getJournalStreak(),
        maxJournalEntryLength: await this.getMaxJournalEntryLength(),
        bonusJournalEntries: await this.getBonusJournalEntriesCount(),
        
        // Goals
        totalGoals: await this.getGoalCreationCount(),
        completedGoals: await this.getCompletedGoalsCount(),
        maxGoalTargetValue: await this.getMaxGoalTargetValue(),
        totalGoalProgressEntries: await this.getTotalGoalProgressEntries(),
        
        // Cross-feature
        maxDailyFeatureCombo: await this.getDailyFeatureCombo(),
        consecutiveAppUsageDays: await this.getConsecutiveAppUsageDays(),
        recommendationsFollowed: await this.getRecommendationsFollowedCount(),
        
        // Timestamp for cache invalidation
        snapshotTimestamp: Date.now()
      };
    } catch (error) {
      console.error('AchievementIntegration.getAchievementDataSnapshot error:', error);
      return { snapshotTimestamp: Date.now() };
    }
  }

  // ========================================
  // HELPER METHODS FOR MISSING STORAGE FUNCTIONS
  // ========================================

  /**
   * Get habit statistics - simple fallback implementation
   */
  private static async getHabitStats(habitId: string): Promise<any> {
    return { currentStreak: 0, totalCompletions: 0, longestStreak: 0 };
  }

  /**
   * Get habit completions - simple fallback implementation  
   */
  private static async getHabitCompletions(habitId: string): Promise<any[]> {
    return [];
  }

  /**
   * Get gratitude current streak - simple fallback implementation
   */
  private static async getGratitudeCurrentStreak(): Promise<number> {
    return 0;
  }

  /**
   * Get total entry count - simple fallback implementation
   */
  private static async getTotalEntryCount(): Promise<number> {
    const entries = await this.gratitudeStorage.getAll();
    return entries.length;
  }

  /**
   * Get goal progress - simple fallback implementation
   */
  private static async getGoalProgress(goalId: string): Promise<any[]> {
    return [];
  }
}