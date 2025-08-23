// User Statistics Collector for Achievement Preview System
// Aggregates user data from various services for progress hint generation

import { UserStats } from './achievementPreviewUtils';
import { GamificationService } from '../services/gamificationService';
import { habitStorage } from '../services/storage/habitStorage';
import { gratitudeStorage } from '../services/storage/gratitudeStorage';
import { goalStorage } from '../services/storage/goalStorage';

export class UserStatsCollector {
  /**
   * Collects comprehensive user statistics for Achievement Preview System
   * @returns UserStats object with all relevant user progress data
   */
  static async collectUserStats(): Promise<UserStats> {
    try {
      // Collect data from all services in parallel for performance
      const [
        gamificationStats,
        habits,
        habitCompletions,
        journalEntries,
        goals,
        goalProgress
      ] = await Promise.all([
        GamificationService.getGamificationStats(),
        habitStorage.getAll(),
        habitStorage.getAllCompletions(),
        gratitudeStorage.getAll(),
        goalStorage.getAll(),
        goalStorage.getAllProgress()
      ]);

      // Calculate habit statistics
      const habitsCreated = habits.length;
      const totalHabitCompletions = habitCompletions.length;
      
      // Calculate longest habit streak
      let longestHabitStreak = 0;
      habits.forEach((habit: any) => {
        if (habit.streak && habit.streak > longestHabitStreak) {
          longestHabitStreak = habit.streak;
        }
      });
      
      // Calculate max habits in one day
      const completionsByDate = habitCompletions.reduce((acc: Record<string, number>, completion: any) => {
        const date = completion.date;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const maxHabitsInOneDay = Math.max(0, ...Object.values(completionsByDate));

      // Calculate journal statistics
      const totalJournalEntries = journalEntries.length;
      
      // Calculate journal streaks (simplified - would need date analysis for accurate streaks)
      const journalDates = [...new Set(journalEntries.map((entry: any) => entry.date))];
      const currentJournalStreak = journalDates.length > 0 ? 1 : 0; // Simplified
      const longestJournalStreak = journalDates.length; // Simplified
      
      // Calculate bonus journal entries (entries beyond daily minimum)
      const journalEntriesByDate = journalEntries.reduce((acc: Record<string, number>, entry: any) => {
        const date = entry.date;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const bonusJournalEntries = Object.values(journalEntriesByDate)
        .reduce((total: number, dailyCount: number) => total + Math.max(0, dailyCount - 3), 0);

      // Calculate goal statistics
      const goalsCreated = goals.length;
      const completedGoals = goals.filter((goal: any) => goal.currentValue >= goal.targetValue).length;
      
      // Check for ambitious goals (≥1000 target)
      const hasLargeGoal = goals.some((goal: any) => goal.targetValue >= 1000);
      
      // Calculate goal progress streak (simplified)
      const goalProgressStreak = goalProgress.length > 0 ? 1 : 0; // Would need date analysis

      // Calculate XP from habits
      const xpFromHabits = (gamificationStats.xpBySource['habit_completion'] || 0) + 
                          (gamificationStats.xpBySource['habit_bonus'] || 0) + 
                          (gamificationStats.xpBySource['habit_streak_milestone'] || 0);

      // Calculate consistency metrics
      const appUsageStreak = gamificationStats.currentStreak;
      const totalActiveDays = gamificationStats.longestStreak; // Approximation
      const multiAreaDays = Math.min(totalActiveDays, Math.min(journalDates.length, Object.keys(completionsByDate).length || 0));

      // Build comprehensive user stats
      const userStats: UserStats = {
        // Habits
        habitsCreated,
        totalHabitCompletions,
        longestHabitStreak,
        maxHabitsInOneDay,
        habitLevel: Math.floor(gamificationStats.currentLevel * 0.3), // Approximation
        
        // Journal
        journalEntries: journalEntries.length,
        totalJournalEntries,
        currentJournalStreak,
        longestJournalStreak,
        bonusJournalEntries,
        
        // Goals
        goalsCreated,
        completedGoals,
        goalProgressStreak,
        hasLargeGoal,
        
        // Level & XP
        currentLevel: gamificationStats.currentLevel,
        totalXP: gamificationStats.totalXP,
        xpFromHabits,
        
        // Achievements
        totalAchievements: gamificationStats.totalAchievements,
        unlockedAchievements: gamificationStats.achievementsUnlocked,
        
        // Consistency
        appUsageStreak,
        multiAreaDays,
        
        // Activity
        totalActiveDays,
        recommendationsFollowed: 0, // Would need tracking
        
        // Special achievements tracking
        samedayHabitCreationCompletions: 0, // TODO: Implement same-day habit creation+completion tracking
        activeHabitsSimultaneous: habits.filter((habit: any) => habit.isActive !== false).length,
        comebackActivities: 0, // TODO: Implement comeback after break tracking
        
        // Advanced consistency tracking
        perfectMonthDays: 0, // TODO: Implement perfect month detection (all 3 features daily)
        hasTripleCrown: false, // TODO: Implement simultaneous 7+ day streaks detection
        dailyFeatureComboDays: multiAreaDays, // Approximation: days with multiple features used
      };

      return userStats;
    } catch (error) {
      console.error('UserStatsCollector.collectUserStats error:', error);
      
      // Return default stats on error
      return {
        habitsCreated: 0,
        totalHabitCompletions: 0,
        longestHabitStreak: 0,
        maxHabitsInOneDay: 0,
        habitLevel: 0,
        journalEntries: 0,
        totalJournalEntries: 0,
        currentJournalStreak: 0,
        longestJournalStreak: 0,
        bonusJournalEntries: 0,
        goalsCreated: 0,
        completedGoals: 0,
        goalProgressStreak: 0,
        hasLargeGoal: false,
        currentLevel: 1,
        totalXP: 0,
        xpFromHabits: 0,
        totalAchievements: 0,
        unlockedAchievements: 0,
        appUsageStreak: 0,
        multiAreaDays: 0,
        totalActiveDays: 0,
        recommendationsFollowed: 0,
        
        // Special achievements tracking (defaults)
        samedayHabitCreationCompletions: 0,
        activeHabitsSimultaneous: 0,
        comebackActivities: 0,
        
        // Advanced consistency tracking (defaults)
        perfectMonthDays: 0,
        hasTripleCrown: false,
        dailyFeatureComboDays: 0,
      };
    }
  }

  /**
   * Collects lightweight user stats for performance-critical scenarios
   * @returns Partial UserStats with essential data only
   */
  static async collectLightweightStats(): Promise<Partial<UserStats>> {
    try {
      const gamificationStats = await GamificationService.getGamificationStats();
      
      return {
        currentLevel: gamificationStats.currentLevel,
        totalXP: gamificationStats.totalXP,
        unlockedAchievements: gamificationStats.achievementsUnlocked,
        totalAchievements: gamificationStats.totalAchievements,
        appUsageStreak: gamificationStats.currentStreak,
      };
    } catch (error) {
      console.error('UserStatsCollector.collectLightweightStats error:', error);
      return {
        currentLevel: 1,
        totalXP: 0,
        unlockedAchievements: 0,
        totalAchievements: 0,
        appUsageStreak: 0,
      };
    }
  }
}