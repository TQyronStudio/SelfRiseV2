// User Activity Tracker Service - Monthly baseline analysis for personalized challenges
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateString } from '../types/common';
import { AchievementCategory, XPSourceType } from '../types/gamification';
import { formatDateToString, today, addDays, subtractDays, parseDate } from '../utils/date';
import { GamificationService } from './gamificationService';
import { HabitStorage } from './storage/habitStorage';
import { GratitudeStorage } from './storage/gratitudeStorage';
import { GoalStorage } from './storage/goalStorage';

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * User's monthly activity baseline for challenge personalization
 */
export interface UserActivityBaseline {
  month: string; // "YYYY-MM" format
  userId: string;
  
  // Habit metrics (30-day analysis)
  avgDailyHabitCompletions: number;
  avgDailyBonusHabits: number;
  avgHabitVariety: number; // Different habits per day
  longestHabitStreak: number;
  totalHabitCompletions: number;
  habitConsistencyDays: number; // Days with 1+ habit completions
  
  // Journal metrics (30-day analysis)  
  avgDailyJournalEntries: number;
  avgDailyBonusEntries: number;
  avgEntryLength: number;
  journalConsistencyDays: number; // Days with 3+ entries
  totalJournalEntries: number;
  longestJournalStreak: number;
  
  // Goal metrics (30-day analysis)
  avgDailyGoalProgress: number;
  totalGoalProgressDays: number;
  goalsCompleted: number;
  avgGoalTargetValue: number;
  goalConsistencyDays: number; // Days with goal progress
  longestGoalStreak: number;
  
  // Consistency metrics
  appUsageDays: number; // Days with XP earned
  tripleFeatureDays: number; // All 3 features used
  perfectDays: number; // All minimums met
  longestEngagementStreak: number;
  balanceScore: number; // 0-1, how balanced feature usage is
  
  // Generation context
  generatedAt: Date;
  dataQuality: 'minimal' | 'partial' | 'complete'; // Based on data availability
  isFirstMonth: boolean;
  totalActiveDays: number;
  analysisStartDate: DateString;
  analysisEndDate: DateString;
}

/**
 * Daily activity summary for baseline analysis
 */
interface DailyActivitySummary {
  date: DateString;
  
  // Habit activity
  habitCompletions: number;
  bonusHabits: number;
  uniqueHabits: number;
  hasMinimumHabits: boolean; // 1+ completions
  
  // Journal activity
  journalEntries: number;
  bonusEntries: number;
  avgEntryLength: number;
  hasMinimumJournal: boolean; // 3+ entries
  
  // Goal activity  
  goalProgressCount: number;
  goalCompletions: number;
  hasGoalActivity: boolean;
  
  // Consistency
  earnedXP: number;
  hasTripleFeature: boolean;
  hasPerfectDay: boolean;
  hasAppUsage: boolean;
}

/**
 * Star-level scaling configuration
 */
interface StarScalingConfig {
  starLevel: 1 | 2 | 3 | 4 | 5;
  scalingMultiplier: number; // 1.05 to 1.25
  description: string;
}

/**
 * Baseline calculation options
 */
interface BaselineCalculationOptions {
  userId?: string;
  analysisStartDate?: DateString;
  analysisEndDate?: DateString;
  minDaysForQuality?: number; // Minimum days of data for 'complete' quality
  cacheResults?: boolean;
  ignoreCachedData?: boolean;
}

// ========================================
// STORAGE CONSTANTS
// ========================================

const STORAGE_KEYS = {
  MONTHLY_BASELINES: 'monthly_baselines',
  BASELINE_CACHE: 'baseline_cache',
  USER_ACTIVITY_SUMMARY: 'user_activity_summary'
} as const;

// ========================================
// USER ACTIVITY TRACKER SERVICE
// ========================================

export class UserActivityTracker {
  
  // Star scaling configuration
  private static readonly STAR_SCALING: Record<number, StarScalingConfig> = {
    1: { starLevel: 1, scalingMultiplier: 1.05, description: 'Easy (+5%)' },
    2: { starLevel: 2, scalingMultiplier: 1.10, description: 'Medium (+10%)' },
    3: { starLevel: 3, scalingMultiplier: 1.15, description: 'Hard (+15%)' },
    4: { starLevel: 4, scalingMultiplier: 1.20, description: 'Expert (+20%)' },
    5: { starLevel: 5, scalingMultiplier: 1.25, description: 'Master (+25%)' }
  };
  
  // Data quality thresholds
  private static readonly QUALITY_THRESHOLDS = {
    MINIMAL: 5,   // < 5 days of data
    PARTIAL: 15,  // 5-15 days of data  
    COMPLETE: 20  // 20+ days of data
  };

  // ========================================
  // PUBLIC API METHODS
  // ========================================

  /**
   * Calculate user's activity baseline for challenge generation
   */
  static async calculateMonthlyBaseline(
    options: BaselineCalculationOptions = {}
  ): Promise<UserActivityBaseline> {
    try {
      console.log('🔄 Starting monthly baseline calculation...');
      
      // Set default analysis period (last 30 days)
      const endDate = options.analysisEndDate || today();
      const startDate = options.analysisStartDate || 
        formatDateToString(addDays(parseDate(endDate), -30));
      
      const userId = options.userId || 'local_user';
      const currentMonth = endDate.substring(0, 7); // "YYYY-MM"
      
      console.log(`📊 Analyzing activity from ${startDate} to ${endDate}`);
      
      // Check for cached baseline if not ignoring cache
      if (!options.ignoreCachedData) {
        const cached = await this.getCachedBaseline(currentMonth, userId);
        if (cached && options.cacheResults !== false) {
          console.log('📦 Using cached baseline data');
          return cached;
        }
      }
      
      // Gather daily activity summaries
      const dailySummaries = await this.gatherDailyActivitySummaries(startDate, endDate);
      const activeDays = dailySummaries.filter(day => day.hasAppUsage);
      
      console.log(`📈 Analyzed ${dailySummaries.length} days (${activeDays.length} active days)`);
      
      // Calculate metrics from daily summaries
      const baseline = await this.calculateBaselineFromSummaries(
        dailySummaries,
        {
          month: currentMonth,
          userId,
          analysisStartDate: startDate,
          analysisEndDate: endDate,
          totalActiveDays: activeDays.length
        }
      );
      
      // Cache results if requested
      if (options.cacheResults !== false) {
        await this.cacheBaseline(baseline);
      }
      
      console.log(`✅ Baseline calculation complete: ${baseline.dataQuality} quality, ${baseline.totalActiveDays} active days`);
      return baseline;
      
    } catch (error) {
      console.error('UserActivityTracker.calculateMonthlyBaseline error:', error);
      // Return minimal baseline as fallback
      return this.createMinimalBaseline(options.userId || 'local_user');
    }
  }

  /**
   * Get historical baseline for a specific month
   */
  static async getHistoricalBaseline(
    month: string, // "YYYY-MM"
    userId: string = 'local_user'
  ): Promise<UserActivityBaseline | null> {
    try {
      const allBaselines = await this.getAllBaselines();
      return allBaselines.find(b => b.month === month && b.userId === userId) || null;
    } catch (error) {
      console.error('UserActivityTracker.getHistoricalBaseline error:', error);
      return null;
    }
  }

  /**
   * Apply star-level scaling to baseline values
   */
  static applyStarScaling(
    baselineValue: number,
    starLevel: 1 | 2 | 3 | 4 | 5,
    roundUp: boolean = true
  ): number {
    const scaling = this.STAR_SCALING[starLevel];
    if (!scaling) {
      console.warn(`Invalid star level: ${starLevel}, using level 1`);
      return Math.ceil(baselineValue * 1.05);
    }
    
    const scaledValue = baselineValue * scaling.scalingMultiplier;
    return roundUp ? Math.ceil(scaledValue) : Math.round(scaledValue);
  }

  /**
   * Get star scaling configuration
   */
  static getStarScaling(starLevel: 1 | 2 | 3 | 4 | 5): StarScalingConfig {
    return this.STAR_SCALING[starLevel] || this.STAR_SCALING[1];
  }

  /**
   * Get all stored baselines
   */
  static async getAllBaselines(): Promise<UserActivityBaseline[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_BASELINES);
      if (!stored) return [];
      
      const baselines = JSON.parse(stored);
      return baselines.map((b: any) => ({
        ...b,
        generatedAt: new Date(b.generatedAt)
      }));
    } catch (error) {
      console.error('UserActivityTracker.getAllBaselines error:', error);
      return [];
    }
  }

  /**
   * Clear all baseline data (for testing/development)
   */
  static async clearAllBaselineData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.MONTHLY_BASELINES,
        STORAGE_KEYS.BASELINE_CACHE,
        STORAGE_KEYS.USER_ACTIVITY_SUMMARY
      ]);
      console.log('🧹 All baseline data cleared');
    } catch (error) {
      console.error('UserActivityTracker.clearAllBaselineData error:', error);
    }
  }

  // ========================================
  // PRIVATE IMPLEMENTATION METHODS
  // ========================================

  /**
   * Gather daily activity summaries for the analysis period
   */
  private static async gatherDailyActivitySummaries(
    startDate: DateString,
    endDate: DateString
  ): Promise<DailyActivitySummary[]> {
    try {
      const summaries: DailyActivitySummary[] = [];
      
      // Use static imports for storage services
      const habitStorage = new HabitStorage();
      const gratitudeStorage = new GratitudeStorage();
      const goalStorage = new GoalStorage();
      
      // Iterate through each day in the analysis period
      let currentDate = startDate;
      while (currentDate <= endDate) {
        console.log(`🔍 Analyzing day: ${currentDate}`);
        
        // Gather habit data for this day
        const habitCompletions = await habitStorage.getCompletionsByDate(currentDate);
        const scheduledHabits = habitCompletions.filter(c => !c.isBonus);
        const bonusHabits = habitCompletions.filter(c => c.isBonus);
        const uniqueHabits = await habitStorage.getUniqueHabitsCompletedOnDate(currentDate);
        
        // Gather journal data for this day
        const journalEntries = await gratitudeStorage.getEntriesForDate(currentDate);
        const regularEntries = journalEntries.slice(0, 3); // First 3 are regular
        const bonusEntries = journalEntries.slice(3); // Rest are bonus
        const avgLength = journalEntries.length > 0 ? 
          journalEntries.reduce((sum, e) => sum + e.content.length, 0) / journalEntries.length : 0;
        
        // Gather goal data for this day
        const xpTransactions = await GamificationService.getTransactionsByDateRange(currentDate, currentDate);
        const goalProgressTxs = xpTransactions.filter(tx => tx.source === XPSourceType.GOAL_PROGRESS);
        const goalCompletionTxs = xpTransactions.filter(tx => tx.source === XPSourceType.GOAL_COMPLETION);
        
        // Calculate daily totals
        const totalXP = xpTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const hasHabits = scheduledHabits.length > 0;
        const hasJournal = journalEntries.length >= 3;
        const hasGoals = goalProgressTxs.length > 0 || goalCompletionTxs.length > 0;
        
        const summary: DailyActivitySummary = {
          date: currentDate,
          
          // Habit metrics
          habitCompletions: scheduledHabits.length,
          bonusHabits: bonusHabits.length,
          uniqueHabits: uniqueHabits.length,
          hasMinimumHabits: scheduledHabits.length >= 1,
          
          // Journal metrics
          journalEntries: journalEntries.length,
          bonusEntries: bonusEntries.length,
          avgEntryLength: avgLength,
          hasMinimumJournal: journalEntries.length >= 3,
          
          // Goal metrics
          goalProgressCount: goalProgressTxs.length,
          goalCompletions: goalCompletionTxs.length,
          hasGoalActivity: goalProgressTxs.length > 0 || goalCompletionTxs.length > 0,
          
          // Consistency metrics
          earnedXP: totalXP,
          hasTripleFeature: hasHabits && hasJournal && hasGoals,
          hasPerfectDay: hasHabits && hasJournal, // Goals optional for perfect day
          hasAppUsage: totalXP > 0
        };
        
        summaries.push(summary);
        
        // Move to next day
        currentDate = formatDateToString(addDays(parseDate(currentDate), 1));
      }
      
      console.log(`📊 Gathered ${summaries.length} daily summaries`);
      return summaries;
      
    } catch (error) {
      console.error('UserActivityTracker.gatherDailyActivitySummaries error:', error);
      return [];
    }
  }

  /**
   * Calculate baseline metrics from daily summaries
   */
  private static async calculateBaselineFromSummaries(
    summaries: DailyActivitySummary[],
    context: {
      month: string;
      userId: string;
      analysisStartDate: DateString;
      analysisEndDate: DateString;
      totalActiveDays: number;
    }
  ): Promise<UserActivityBaseline> {
    try {
      const activeSummaries = summaries.filter(s => s.hasAppUsage);
      const totalDays = summaries.length;
      
      // Calculate habit metrics
      const totalHabitCompletions = summaries.reduce((sum, s) => sum + s.habitCompletions, 0);
      const totalBonusHabits = summaries.reduce((sum, s) => sum + s.bonusHabits, 0);
      const totalUniqueHabits = summaries.reduce((sum, s) => sum + s.uniqueHabits, 0);
      const habitConsistencyDays = summaries.filter(s => s.hasMinimumHabits).length;
      const longestHabitStreak = this.calculateLongestStreak(summaries, 'hasMinimumHabits');
      
      // Calculate journal metrics
      const totalJournalEntries = summaries.reduce((sum, s) => sum + s.journalEntries, 0);
      const totalBonusEntries = summaries.reduce((sum, s) => sum + s.bonusEntries, 0);
      const totalEntryLength = summaries.reduce((sum, s) => sum + (s.avgEntryLength * s.journalEntries), 0);
      const journalConsistencyDays = summaries.filter(s => s.hasMinimumJournal).length;
      const longestJournalStreak = this.calculateLongestStreak(summaries, 'hasMinimumJournal');
      
      // Calculate goal metrics
      const totalGoalProgress = summaries.reduce((sum, s) => sum + s.goalProgressCount, 0);
      const totalGoalCompletions = summaries.reduce((sum, s) => sum + s.goalCompletions, 0);
      const goalProgressDays = summaries.filter(s => s.hasGoalActivity).length;
      const goalConsistencyDays = goalProgressDays;
      const longestGoalStreak = this.calculateLongestStreak(summaries, 'hasGoalActivity');
      
      // Calculate consistency metrics
      const tripleFeatureDays = summaries.filter(s => s.hasTripleFeature).length;
      const perfectDays = summaries.filter(s => s.hasPerfectDay).length;
      const appUsageDays = activeSummaries.length;
      const longestEngagementStreak = this.calculateLongestStreak(summaries, 'hasAppUsage');
      
      // Calculate balance score (how evenly distributed XP sources are)
      const balanceScore = await this.calculateBalanceScore(context.analysisStartDate, context.analysisEndDate);
      
      // Get average goal target value from existing goals
      const avgGoalTargetValue = await this.calculateAverageGoalTargetValue();
      
      // Determine data quality
      const dataQuality = this.determineDataQuality(context.totalActiveDays, totalDays);
      
      const baseline: UserActivityBaseline = {
        month: context.month,
        userId: context.userId,
        
        // Habit metrics (normalized to daily averages)
        avgDailyHabitCompletions: totalDays > 0 ? totalHabitCompletions / totalDays : 0,
        avgDailyBonusHabits: totalDays > 0 ? totalBonusHabits / totalDays : 0,
        avgHabitVariety: totalDays > 0 ? totalUniqueHabits / totalDays : 0,
        longestHabitStreak,
        totalHabitCompletions,
        habitConsistencyDays,
        
        // Journal metrics (normalized to daily averages)
        avgDailyJournalEntries: totalDays > 0 ? totalJournalEntries / totalDays : 0,
        avgDailyBonusEntries: totalDays > 0 ? totalBonusEntries / totalDays : 0,
        avgEntryLength: totalJournalEntries > 0 ? totalEntryLength / totalJournalEntries : 0,
        journalConsistencyDays,
        totalJournalEntries,
        longestJournalStreak,
        
        // Goal metrics (normalized to daily averages)
        avgDailyGoalProgress: totalDays > 0 ? totalGoalProgress / totalDays : 0,
        totalGoalProgressDays: goalProgressDays,
        goalsCompleted: totalGoalCompletions,
        avgGoalTargetValue,
        goalConsistencyDays,
        longestGoalStreak,
        
        // Consistency metrics
        appUsageDays,
        tripleFeatureDays,
        perfectDays,
        longestEngagementStreak,
        balanceScore,
        
        // Generation context
        generatedAt: new Date(),
        dataQuality,
        isFirstMonth: context.totalActiveDays < this.QUALITY_THRESHOLDS.PARTIAL,
        totalActiveDays: context.totalActiveDays,
        analysisStartDate: context.analysisStartDate,
        analysisEndDate: context.analysisEndDate
      };
      
      console.log(`✅ Baseline calculated: ${baseline.dataQuality} quality, ${Math.round(baseline.avgDailyHabitCompletions * 10) / 10} avg habits/day`);
      return baseline;
      
    } catch (error) {
      console.error('UserActivityTracker.calculateBaselineFromSummaries error:', error);
      throw error;
    }
  }

  // To be continued in next part...
  
  /**
   * Calculate longest consecutive streak for a given condition
   */
  private static calculateLongestStreak(
    summaries: DailyActivitySummary[],
    condition: keyof DailyActivitySummary
  ): number {
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (const summary of summaries) {
      if (summary[condition] as boolean) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return longestStreak;
  }
  
  /**
   * Calculate feature usage balance score (0-1)
   */
  private static async calculateBalanceScore(
    startDate: DateString,
    endDate: DateString
  ): Promise<number> {
    try {
      const transactions = await GamificationService.getTransactionsByDateRange(startDate, endDate);
      
      if (transactions.length === 0) return 0;
      
      // Group XP by feature category
      let habitXP = 0;
      let journalXP = 0;
      let goalXP = 0;
      let otherXP = 0;
      
      for (const tx of transactions) {
        switch (tx.source) {
          case XPSourceType.HABIT_COMPLETION:
          case XPSourceType.HABIT_BONUS:
          case XPSourceType.HABIT_STREAK_MILESTONE:
            habitXP += tx.amount;
            break;
          case XPSourceType.JOURNAL_ENTRY:
          case XPSourceType.JOURNAL_BONUS:
          case XPSourceType.JOURNAL_STREAK_MILESTONE:
          case XPSourceType.JOURNAL_BONUS_MILESTONE:
            journalXP += tx.amount;
            break;
          case XPSourceType.GOAL_PROGRESS:
          case XPSourceType.GOAL_COMPLETION:
          case XPSourceType.GOAL_MILESTONE:
            goalXP += tx.amount;
            break;
          default:
            otherXP += tx.amount;
            break;
        }
      }
      
      const totalXP = habitXP + journalXP + goalXP + otherXP;
      if (totalXP === 0) return 0;
      
      // Calculate balance score (1.0 = perfect balance, 0.0 = completely unbalanced)
      const habitRatio = habitXP / totalXP;
      const journalRatio = journalXP / totalXP;
      const goalRatio = goalXP / totalXP;
      
      // Perfect balance would be ~33% each, calculate deviation
      const idealRatio = 1/3;
      const deviation = Math.abs(habitRatio - idealRatio) + 
                       Math.abs(journalRatio - idealRatio) + 
                       Math.abs(goalRatio - idealRatio);
      
      // Convert deviation to score (lower deviation = higher score)
      const maxDeviation = 2/3; // Maximum possible deviation
      const balanceScore = Math.max(0, 1 - (deviation / maxDeviation));
      
      return Math.round(balanceScore * 100) / 100;
      
    } catch (error) {
      console.error('UserActivityTracker.calculateBalanceScore error:', error);
      return 0.5; // Default to medium balance
    }
  }
  
  /**
   * Calculate average goal target value from existing goals
   */
  private static async calculateAverageGoalTargetValue(): Promise<number> {
    try {
      const goalStorage = new GoalStorage();
      const goals = await goalStorage.getAll();
      
      const activeGoals = goals.filter(g => g.status === 'active');
      if (activeGoals.length === 0) return 100; // Default target value
      
      const totalValue = activeGoals.reduce((sum, goal) => sum + goal.targetValue, 0);
      return Math.round(totalValue / activeGoals.length);
      
    } catch (error) {
      console.error('UserActivityTracker.calculateAverageGoalTargetValue error:', error);
      return 100; // Default target value
    }
  }
  
  /**
   * Determine data quality based on available data
   */
  private static determineDataQuality(activeDays: number, totalDays: number): 'minimal' | 'partial' | 'complete' {
    if (activeDays < this.QUALITY_THRESHOLDS.MINIMAL) return 'minimal';
    if (activeDays < this.QUALITY_THRESHOLDS.COMPLETE) return 'partial';
    return 'complete';
  }
  
  /**
   * Create minimal baseline for new users
   */
  private static createMinimalBaseline(userId: string): UserActivityBaseline {
    const currentMonth = today().substring(0, 7);
    const todayDate = today();
    const thirtyDaysAgo = formatDateToString(addDays(parseDate(todayDate), -30));
    
    return {
      month: currentMonth,
      userId,
      
      // Conservative defaults for new users
      avgDailyHabitCompletions: 1.0,
      avgDailyBonusHabits: 0.2,
      avgHabitVariety: 1.0,
      longestHabitStreak: 0,
      totalHabitCompletions: 0,
      habitConsistencyDays: 0,
      
      avgDailyJournalEntries: 3.5,
      avgDailyBonusEntries: 0.5,
      avgEntryLength: 50,
      journalConsistencyDays: 0,
      totalJournalEntries: 0,
      longestJournalStreak: 0,
      
      avgDailyGoalProgress: 0.5,
      totalGoalProgressDays: 0,
      goalsCompleted: 0,
      avgGoalTargetValue: 100,
      goalConsistencyDays: 0,
      longestGoalStreak: 0,
      
      appUsageDays: 0,
      tripleFeatureDays: 0,
      perfectDays: 0,
      longestEngagementStreak: 0,
      balanceScore: 0.5,
      
      generatedAt: new Date(),
      dataQuality: 'minimal',
      isFirstMonth: true,
      totalActiveDays: 0,
      analysisStartDate: thirtyDaysAgo,
      analysisEndDate: todayDate
    };
  }
  
  /**
   * Get cached baseline if available
   */
  private static async getCachedBaseline(
    month: string,
    userId: string
  ): Promise<UserActivityBaseline | null> {
    try {
      const allBaselines = await this.getAllBaselines();
      const cached = allBaselines.find(b => b.month === month && b.userId === userId);
      
      if (cached) {
        // Check if cache is still valid (less than 1 day old)
        const cacheAge = Date.now() - cached.generatedAt.getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        if (cacheAge < oneDayMs) {
          return cached;
        }
      }
      
      return null;
    } catch (error) {
      console.error('UserActivityTracker.getCachedBaseline error:', error);
      return null;
    }
  }
  
  /**
   * Cache baseline data
   */
  private static async cacheBaseline(baseline: UserActivityBaseline): Promise<void> {
    try {
      const allBaselines = await this.getAllBaselines();
      
      // Remove any existing baseline for same month/user
      const filtered = allBaselines.filter(b => 
        !(b.month === baseline.month && b.userId === baseline.userId)
      );
      
      // Add new baseline
      filtered.push(baseline);
      
      // Keep only last 12 months of baselines
      const sorted = filtered
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12);
      
      await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_BASELINES, JSON.stringify(sorted));
      console.log(`💾 Cached baseline for ${baseline.month}`);
      
    } catch (error) {
      console.error('UserActivityTracker.cacheBaseline error:', error);
    }
  }
}

// Export service instance
export default UserActivityTracker;