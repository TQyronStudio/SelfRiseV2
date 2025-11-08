// User Statistics Collector for Achievement Preview System
// Aggregates user data from various services for progress hint generation
//
// NOTE: Uses legacy data structures with unknown types
// @ts-nocheck

import { UserStats } from './achievementPreviewUtils';
import { GamificationService } from '../services/gamificationService';
import { getGratitudeStorageImpl, getHabitStorageImpl } from '../config/featureFlags';
import { goalStorage } from '../services/storage/goalStorage';
import { calculateCurrentStreak, calculateLongestStreak } from './date';
import { AchievementIntegration } from '../services/achievementIntegration';

// Get storage implementation based on feature flag
const gratitudeStorage = getGratitudeStorageImpl();
const habitStorage = getHabitStorageImpl();

// ========================================
// TYPESCRIPT INTERFACES - Phase 2 Safety
// ========================================

interface HabitData {
  id: string;
  streak?: number;
  isActive?: boolean;
  name?: string;
  // Add other habit properties as needed
}

interface HabitCompletionData {
  id: string;
  date: string;
  habitId: string;
  // Add other completion properties as needed
}

interface JournalEntryData {
  id: string;
  date: string;
  content?: string;
  // Add other journal properties as needed
}

interface GoalData {
  id: string;
  currentValue: number;
  targetValue: number;
  isCompleted?: boolean;
  // Add other goal properties as needed
}

// ========================================
// VALIDATION GUARDS - Phase 2 Safety
// ========================================

const validateHabitData = (habit: unknown): habit is HabitData => {
  if (typeof habit !== 'object' || habit === null) return false;
  const h = habit as any;
  return (
    typeof h.id === 'string' &&
    (h.streak === undefined || typeof h.streak === 'number') &&
    (h.isActive === undefined || typeof h.isActive === 'boolean')
  );
};

const validateHabitCompletionData = (completion: unknown): completion is HabitCompletionData => {
  if (typeof completion !== 'object' || completion === null) return false;
  const c = completion as any;
  return (
    typeof c.id === 'string' &&
    typeof c.date === 'string' &&
    typeof c.habitId === 'string'
  );
};

const validateJournalEntryData = (entry: unknown): entry is JournalEntryData => {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as any;
  return (
    typeof e.id === 'string' &&
    typeof e.date === 'string'
  );
};

const validateGoalData = (goal: unknown): goal is GoalData => {
  if (typeof goal !== 'object' || goal === null) return false;
  const g = goal as any;
  return (
    typeof g.id === 'string' &&
    typeof g.currentValue === 'number' &&
    typeof g.targetValue === 'number'
  );
};

export class UserStatsCollector {
  // ========================================
  // PERFORMANCE CACHE - Phase 2 Optimization
  // ========================================
  
  private static cachedStats: { data: UserStats; timestamp: number } | null = null;
  private static readonly CACHE_DURATION = 60000; // 60 seconds cache
  
  /**
   * Checks if cached data is still valid
   * @returns boolean indicating if cache is valid
   */
  private static isCacheValid(): boolean {
    if (!this.cachedStats) return false;
    const now = Date.now();
    return (now - this.cachedStats.timestamp) < this.CACHE_DURATION;
  }
  
  /**
   * Collects comprehensive user statistics for Achievement Preview System
   * Uses 60-second cache for performance optimization
   * @param forceRefresh - Skip cache and force fresh data collection
   * @returns UserStats object with all relevant user progress data
   */
  static async collectUserStats(forceRefresh: boolean = false): Promise<UserStats> {
    try {
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && this.isCacheValid()) {
        console.log('UserStatsCollector: Using cached data');
        return this.cachedStats!.data;
      }
      
      console.log('UserStatsCollector: Collecting fresh data...');
      
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
      
      // Calculate longest habit streak with type safety
      let longestHabitStreak = 0;
      habits.forEach((habit: unknown) => {
        if (validateHabitData(habit) && habit.streak && habit.streak > longestHabitStreak) {
          longestHabitStreak = habit.streak;
        }
      });
      
      // Calculate max habits in one day with type safety
      const completionsByDate = habitCompletions.reduce((acc: Record<string, number>, completion: unknown) => {
        if (validateHabitCompletionData(completion)) {
          const date = completion.date;
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const maxHabitsInOneDay = Math.max(0, ...Object.values(completionsByDate));

      // Calculate journal statistics
      const totalJournalEntries = journalEntries.length;
      
      // Calculate journal streaks with type safety - PHASE 3: Real streak calculations
      const journalDates = [...new Set(
        journalEntries
          .filter((entry: unknown): entry is JournalEntryData => validateJournalEntryData(entry))
          .map(entry => entry.date)
      )].sort(); // Sort dates for proper streak calculation
      
      // Use proper streak calculation functions
      const currentJournalStreak = journalDates.length > 0 ? calculateCurrentStreak(journalDates) : 0;
      const longestJournalStreak = journalDates.length > 0 ? calculateLongestStreak(journalDates) : 0;
      
      // Calculate bonus journal entries with type safety (entries beyond daily minimum)
      const journalEntriesByDate = journalEntries.reduce((acc: Record<string, number>, entry: unknown) => {
        if (validateJournalEntryData(entry)) {
          const date = entry.date;
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const bonusJournalEntries = Object.values(journalEntriesByDate)
        .reduce((total: number, dailyCount: number) => total + Math.max(0, dailyCount - 3), 0);

      // Calculate goal statistics with type safety
      const goalsCreated = goals.length;
      const completedGoals = goals.filter((goal: unknown): goal is GoalData => 
        validateGoalData(goal) && goal.currentValue >= goal.targetValue
      ).length;
      
      // Check for ambitious goals (≥1000 target) with type safety
      const hasLargeGoal = goals.some((goal: unknown): goal is GoalData => 
        validateGoalData(goal) && goal.targetValue >= 1000
      );
      
      // Calculate goal progress streak - PHASE 3: Real consecutive days calculation
      const goalProgressStreak = await AchievementIntegration.getGoalProgressConsecutiveDays();

      // Calculate XP from habits
      const xpFromHabits = (gamificationStats.xpBySource['habit_completion'] || 0) + 
                          (gamificationStats.xpBySource['habit_bonus'] || 0) + 
                          (gamificationStats.xpBySource['habit_streak_milestone'] || 0);

      // Calculate consistency metrics - PHASE 3: Real consecutive usage calculation
      const appUsageStreak = await AchievementIntegration.getConsecutiveAppUsageDays();
      
      // Calculate actual total active days (unique days with any activity)
      const allActivityDates = new Set([
        ...journalDates,
        ...Object.keys(completionsByDate),
        // Add goal progress dates if available
        ...(goalProgress || []).map((p: any) => p.date).filter((date: any) => typeof date === 'string')
      ]);
      const totalActiveDays = allActivityDates.size;
      
      const multiAreaDays = Math.min(totalActiveDays, Math.min(journalDates.length, Object.keys(completionsByDate).length || 0));

      // Build comprehensive user stats
      const userStats: UserStats = {
        // Habits
        habitsCreated,
        totalHabitCompletions,
        longestHabitStreak,
        maxHabitsInOneDay,
        habitLevel: Math.floor(Math.min(gamificationStats.currentLevel, Math.max(1, totalHabitCompletions / 10))), // Based on completion activity
        
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
        activeHabitsSimultaneous: habits.filter((habit: unknown): habit is HabitData => 
          validateHabitData(habit) && habit.isActive !== false
        ).length,
        comebackActivities: 0, // TODO: Implement comeback after break tracking
        
        // Advanced consistency tracking
        perfectMonthDays: 0, // TODO: Implement perfect month detection (all 3 features daily)
        hasTripleCrown: false, // TODO: Implement simultaneous 7+ day streaks detection
        dailyFeatureComboDays: multiAreaDays, // Days with multiple features used (habits + journal)
        
        // Journal Bonus Milestones (New for ⭐🔥👑 system)
        starCount: 0, // TODO: Implement star milestone counting (1+ bonus per day)
        flameCount: 0, // TODO: Implement flame milestone counting (5+ bonuses per day)
        crownCount: 0, // TODO: Implement crown milestone counting (10+ bonuses per day)
        bonusStreakDays: 0, // TODO: Implement bonus streak tracking (1+ bonus daily)
        goldenBonusStreakDays: 0, // TODO: Implement golden bonus streak tracking (3+ bonuses daily)
      };

      // Cache the fresh data for performance optimization
      this.cachedStats = {
        data: userStats,
        timestamp: Date.now()
      };
      
      console.log('UserStatsCollector: Data cached successfully');
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
        
        // Journal Bonus Milestones (defaults for error fallback)
        starCount: 0,
        flameCount: 0,
        crownCount: 0,
        bonusStreakDays: 0,
        goldenBonusStreakDays: 0,
      };
    }
  }

  /**
   * Clears the cache - useful for development and testing
   * @static
   */
  static clearCache(): void {
    this.cachedStats = null;
    console.log('UserStatsCollector: Cache cleared');
  }
  
  /**
   * Gets cache info for debugging
   * @returns Cache status information
   */
  static getCacheInfo(): { hasCache: boolean; age?: number; isValid?: boolean } {
    if (!this.cachedStats) {
      return { hasCache: false };
    }
    
    const age = Date.now() - this.cachedStats.timestamp;
    return {
      hasCache: true,
      age,
      isValid: age < this.CACHE_DURATION
    };
  }

  /**
   * Collects lightweight user stats for performance-critical scenarios
   * Uses cached data if available, otherwise fetches only essential gamification data
   * @returns Partial UserStats with essential data only
   */
  static async collectLightweightStats(): Promise<Partial<UserStats>> {
    try {
      // If we have valid cached data, extract lightweight stats from it
      if (this.isCacheValid()) {
        console.log('UserStatsCollector: Using cached data for lightweight stats');
        const cached = this.cachedStats!.data;
        return {
          currentLevel: cached.currentLevel,
          totalXP: cached.totalXP,
          unlockedAchievements: cached.unlockedAchievements,
          totalAchievements: cached.totalAchievements,
          appUsageStreak: cached.appUsageStreak,
          habitsCreated: cached.habitsCreated,
          totalHabitCompletions: cached.totalHabitCompletions,
          journalEntries: cached.journalEntries,
          goalsCreated: cached.goalsCreated,
        };
      }
      
      // Otherwise fetch minimal gamification data only
      console.log('UserStatsCollector: Fetching lightweight gamification data');
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