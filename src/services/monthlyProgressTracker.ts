// Monthly Challenge Progress Tracking System
// Sophisticated real-time progress tracking for 30-day monthly challenges
// with weekly breakdown, milestone detection, and performance optimization

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import {
  MonthlyChallengeProgress,
  MonthlyChallenge,
  XPSourceType,
  AchievementCategory,
  MonthlyChallengeRequirement
} from '../types/gamification';
import { DateString } from '../types/common';
import { formatDateToString, today, parseDate, addDays } from '../utils/date';
import { GamificationService } from './gamificationService';
import { StarRatingService } from './starRatingService';
import { generateUUID } from '../utils/uuid';

// ========================================
// INTERFACES & TYPES
// ========================================

/**
 * Daily progress snapshot for detailed tracking
 */
export interface DailyProgressSnapshot {
  date: DateString;
  challengeId: string;
  dailyContributions: Record<string, number>; // Today's progress per requirement
  cumulativeProgress: Record<string, number>;  // Total progress so far
  progressPercentage: number;                  // Overall completion percentage
  weekNumber: 1 | 2 | 3 | 4 | 5;              // Week within month
  dayOfMonth: number;                          // Day within month (1-31)
  isTripleFeatureDay: boolean;                 // All 3 features used today
  isPerfectDay: boolean;                       // All daily minimums met
  xpEarnedToday: number;                      // XP from challenge progress today
  timestamp: Date;
}

/**
 * Weekly breakdown within monthly challenge
 */
export interface WeeklyBreakdown {
  weekNumber: 1 | 2 | 3 | 4 | 5;
  startDate: DateString;
  endDate: DateString;
  weeklyProgress: Record<string, number>;      // Progress per requirement this week
  weeklyTarget: Record<string, number>;        // Expected progress this week
  completionPercentage: number;                // Week completion percentage
  daysActive: number;                          // Days with progress this week
  perfectDays: number;                         // Perfect days this week
  bestDay: { date: DateString; progress: number } | null;
  isCurrentWeek: boolean;
  isCompleted: boolean;
}

/**
 * Milestone detection result
 */
export interface MilestoneResult {
  milestone: 25 | 50 | 75;
  reached: boolean;
  previouslyReached: boolean;
  celebrationTriggered: boolean;
  xpAwarded: number;
  timestamp: Date;
  requirements: Record<string, number>; // Progress when milestone was reached
}

/**
 * Progress update batch for performance optimization
 */
interface ProgressUpdateBatch {
  challengeId: string;
  updates: Array<{
    source: XPSourceType;
    amount: number;
    metadata?: Record<string, any>;
    timestamp: Date;
  }>;
  batchTimestamp: Date;
}

// ========================================
// MONTHLY PROGRESS TRACKER SERVICE
// ========================================

export class MonthlyProgressTracker {
  // Storage keys for AsyncStorage
  private static readonly STORAGE_KEYS = {
    MONTHLY_PROGRESS: 'monthly_challenge_progress',
    DAILY_SNAPSHOTS: 'monthly_daily_snapshots',
    WEEKLY_BREAKDOWN: 'monthly_weekly_breakdown',
    MILESTONE_HISTORY: 'monthly_milestone_history',
    PROGRESS_CACHE: 'monthly_progress_cache'
  } as const;

  // Performance optimization settings
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly BATCH_WINDOW = 500; // 500ms batching window
  private static readonly MAX_SNAPSHOTS_PER_MONTH = 31; // One per day max

  // Cache for performance
  private static progressCache = new Map<string, {
    data: MonthlyChallengeProgress;
    timestamp: number;
  }>();

  private static batchingTimer: NodeJS.Timeout | null = null;
  private static pendingBatches = new Map<string, ProgressUpdateBatch>();

  // Event names for DeviceEventEmitter
  private static readonly EVENTS = {
    PROGRESS_UPDATED: 'monthly_progress_updated',
    MILESTONE_REACHED: 'monthly_milestone_reached',
    WEEK_COMPLETED: 'monthly_week_completed',
    DAILY_SNAPSHOT_CREATED: 'daily_snapshot_created'
  } as const;

  // ========================================
  // CORE PROGRESS TRACKING METHODS
  // ========================================

  /**
   * Update monthly challenge progress based on XP activity
   * This is the main entry point for real-time progress updates
   */
  public static async updateMonthlyProgress(
    source: XPSourceType,
    amount: number,
    sourceId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get active monthly challenges
      const activeChallenges = await this.getActiveMonthlyChallenge();
      if (activeChallenges.length === 0) {
        return; // No active challenges to update
      }

      console.log(`📈 Updating monthly progress from ${source} (+${amount} XP)`);

      // Process each active challenge
      for (const challenge of activeChallenges) {
        await this.processProgressUpdate(challenge, source, amount, metadata);
      }

    } catch (error) {
      console.error('MonthlyProgressTracker.updateMonthlyProgress error:', error);
      // Don't throw - progress tracking should not break the main flow
    }
  }

  /**
   * Process progress update for a specific challenge with batching optimization
   */
  private static async processProgressUpdate(
    challenge: MonthlyChallenge,
    source: XPSourceType,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Check if this source contributes to any challenge requirement
      const relevantRequirements = this.getRelevantRequirements(challenge, source);
      if (relevantRequirements.length === 0) {
        return; // This XP source doesn't contribute to this challenge
      }

      // Get current progress
      const currentProgress = await this.getChallengeProgress(challenge.id);
      if (!currentProgress) {
        console.warn(`No progress found for challenge ${challenge.id}`);
        return;
      }

      // Calculate progress increments
      let progressUpdated = false;
      const previousProgress = { ...currentProgress.progress };
      
      for (const requirement of relevantRequirements) {
        const incrementValue = this.calculateProgressIncrement(
          requirement,
          source,
          amount,
          metadata
        );

        if (incrementValue > 0) {
          currentProgress.progress[requirement.trackingKey] = 
            (currentProgress.progress[requirement.trackingKey] || 0) + incrementValue;
          progressUpdated = true;

          console.log(`📊 Challenge "${challenge.title}": ${requirement.trackingKey} +${incrementValue} (${currentProgress.progress[requirement.trackingKey]}/${requirement.target})`);
        }
      }

      if (progressUpdated) {
        // Update completion percentage
        currentProgress.completionPercentage = this.calculateCompletionPercentage(
          challenge,
          currentProgress
        );

        // Update days active and remaining
        const todayString = formatDateToString(today());
        if (!currentProgress.activeDays.includes(todayString)) {
          currentProgress.activeDays.push(todayString);
          currentProgress.daysActive = currentProgress.activeDays.length;
        }

        // Update days remaining
        currentProgress.daysRemaining = this.calculateDaysRemaining(challenge);

        // Update projected completion
        currentProgress.projectedCompletion = this.calculateProjectedCompletion(
          currentProgress
        );

        // Update weekly breakdown
        await this.updateWeeklyBreakdown(challenge.id, currentProgress);

        // Create daily snapshot
        await this.createDailySnapshot(challenge.id, currentProgress, source, amount);

        // Check for milestone achievements
        const milestoneResults = await this.checkMilestoneProgress(challenge.id, currentProgress);
        
        // Save updated progress
        await this.saveProgressState(currentProgress);

        // Clear cache to ensure fresh data
        this.clearProgressCache(challenge.id);

        // Emit progress update event
        DeviceEventEmitter.emit(this.EVENTS.PROGRESS_UPDATED, {
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          previousProgress,
          newProgress: currentProgress.progress,
          completionPercentage: currentProgress.completionPercentage,
          milestones: milestoneResults,
          source,
          amount,
          timestamp: new Date()
        });

        // Handle milestone celebrations
        for (const milestone of milestoneResults) {
          if (milestone.reached && milestone.celebrationTriggered) {
            await this.triggerMilestoneCelebration(challenge, milestone);
          }
        }

        // Check for challenge completion
        if (currentProgress.completionPercentage >= 100 && !currentProgress.isCompleted) {
          await this.completeMonthlyChallenge(challenge.id);
        }
      }

    } catch (error) {
      console.error('MonthlyProgressTracker.processProgressUpdate error:', error);
      // Continue processing other challenges
    }
  }

  /**
   * Get requirements that are affected by the given XP source
   */
  private static getRelevantRequirements(
    challenge: MonthlyChallenge,
    source: XPSourceType
  ): MonthlyChallengeRequirement[] {
    return challenge.requirements.filter(requirement => {
      switch (requirement.trackingKey) {
        case 'scheduled_habit_completions':
          return source === XPSourceType.HABIT_COMPLETION;
        case 'bonus_habit_completions':
          return source === XPSourceType.HABIT_BONUS;
        case 'unique_weekly_habits':
          return source === XPSourceType.HABIT_COMPLETION || source === XPSourceType.HABIT_BONUS;
        case 'quality_journal_entries':
          return source === XPSourceType.JOURNAL_ENTRY;
        case 'bonus_journal_entries':
          return source === XPSourceType.JOURNAL_BONUS;
        case 'daily_goal_progress':
          return source === XPSourceType.GOAL_PROGRESS;
        case 'goal_completions':
          return source === XPSourceType.GOAL_COMPLETION;
        case 'triple_feature_days':
        case 'daily_engagement_streak':
        case 'perfect_days':
          return true; // These require daily aggregation analysis
        default:
          return false;
      }
    });
  }

  /**
   * Calculate progress increment based on XP source and requirement
   */
  private static calculateProgressIncrement(
    requirement: MonthlyChallengeRequirement,
    source: XPSourceType,
    amount: number,
    metadata?: Record<string, any>
  ): number {
    switch (requirement.trackingKey) {
      case 'scheduled_habit_completions':
        return source === XPSourceType.HABIT_COMPLETION ? 1 : 0;
        
      case 'bonus_habit_completions':
        return source === XPSourceType.HABIT_BONUS ? 1 : 0;
        
      case 'unique_weekly_habits':
        // This requires special tracking - will be handled in daily aggregation
        return 0;
        
      case 'quality_journal_entries':
        return source === XPSourceType.JOURNAL_ENTRY ? 1 : 0;
        
      case 'bonus_journal_entries':
        return source === XPSourceType.JOURNAL_BONUS ? 1 : 0;
        
      case 'daily_goal_progress':
        return source === XPSourceType.GOAL_PROGRESS ? 1 : 0;
        
      case 'goal_completions':
        return source === XPSourceType.GOAL_COMPLETION ? 1 : 0;
        
      case 'triple_feature_days':
      case 'daily_engagement_streak':
      case 'perfect_days':
        // These require complex daily analysis - handled separately
        return 0;
        
      default:
        return 0;
    }
  }

  /**
   * Calculate overall completion percentage for a challenge
   */
  private static calculateCompletionPercentage(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress
  ): number {
    try {
      if (challenge.requirements.length === 0) return 0;

      let totalWeight = 0;
      let completedWeight = 0;

      for (const requirement of challenge.requirements) {
        const currentProgress = progress.progress[requirement.trackingKey] || 0;
        const requirementCompletion = Math.min(currentProgress / requirement.target, 1);
        const weight = 1; // Equal weight for all requirements for now

        totalWeight += weight;
        completedWeight += requirementCompletion * weight;
      }

      return Math.round((completedWeight / totalWeight) * 100);
    } catch (error) {
      console.error('MonthlyProgressTracker.calculateCompletionPercentage error:', error);
      return 0;
    }
  }

  /**
   * Calculate days remaining in the challenge
   */
  private static calculateDaysRemaining(challenge: MonthlyChallenge): number {
    try {
      const now = new Date();
      const endDate = parseDate(challenge.endDate);
      const timeDiff = endDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
      return daysRemaining;
    } catch (error) {
      console.error('MonthlyProgressTracker.calculateDaysRemaining error:', error);
      return 0;
    }
  }

  /**
   * Calculate projected completion percentage based on current pace
   */
  private static calculateProjectedCompletion(
    progress: MonthlyChallengeProgress
  ): number {
    try {
      if (progress.daysActive === 0) return 0;

      const currentPercentage = progress.completionPercentage;
      const daysElapsed = progress.daysActive;
      const totalDays = daysElapsed + progress.daysRemaining;

      if (totalDays === 0) return currentPercentage;

      const dailyRate = currentPercentage / daysElapsed;
      const projectedCompletion = Math.min(dailyRate * totalDays, 100);

      return Math.round(projectedCompletion);
    } catch (error) {
      console.error('MonthlyProgressTracker.calculateProjectedCompletion error:', error);
      return progress.completionPercentage;
    }
  }

  // ========================================
  // PROGRESS PERSISTENCE & RECOVERY
  // ========================================

  /**
   * Get current progress for a monthly challenge
   */
  public static async getChallengeProgress(challengeId: string): Promise<MonthlyChallengeProgress | null> {
    try {
      // Check cache first
      const cached = this.progressCache.get(challengeId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      // Load from storage
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.MONTHLY_PROGRESS}_${challengeId}`);
      if (!stored) {
        return null;
      }

      const progress = JSON.parse(stored) as MonthlyChallengeProgress;

      // Update cache
      this.progressCache.set(challengeId, {
        data: progress,
        timestamp: Date.now()
      });

      return progress;
    } catch (error) {
      console.error('MonthlyProgressTracker.getChallengeProgress error:', error);
      return null;
    }
  }

  /**
   * Save progress state to AsyncStorage with caching
   */
  public static async saveProgressState(progress: MonthlyChallengeProgress): Promise<void> {
    try {
      // Update timestamp
      progress.updatedAt = new Date();

      // Save to storage
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.MONTHLY_PROGRESS}_${progress.challengeId}`,
        JSON.stringify(progress)
      );

      // Update cache
      this.progressCache.set(progress.challengeId, {
        data: progress,
        timestamp: Date.now()
      });

      console.log(`💾 Saved progress for challenge ${progress.challengeId}`);
    } catch (error) {
      console.error('MonthlyProgressTracker.saveProgressState error:', error);
      throw error; // Progress saving is critical
    }
  }

  /**
   * Initialize progress tracking for a new monthly challenge
   */
  public static async initializeChallengeProgress(challenge: MonthlyChallenge): Promise<MonthlyChallengeProgress> {
    try {
      const initialProgress: MonthlyChallengeProgress = {
        challengeId: challenge.id,
        userId: 'current_user', // TODO: Get from authentication context
        progress: {},
        isCompleted: false,
        xpEarned: 0,
        
        // Initialize progress tracking for each requirement
        ...challenge.requirements.reduce((acc, req) => {
          acc.progress[req.trackingKey] = 0;
          return acc;
        }, {} as any),

        // Enhanced monthly properties
        weeklyProgress: {
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          ...(this.isMonthWith31Days(challenge.startDate) ? { week5: {} } : {})
        },
        
        milestonesReached: {
          25: { reached: false },
          50: { reached: false },
          75: { reached: false }
        },
        
        completionPercentage: 0,
        daysActive: 0,
        daysRemaining: this.calculateDaysRemaining(challenge),
        projectedCompletion: 0,
        
        currentStreak: 0,
        longestStreak: 0,
        streakBonusEligible: false,
        
        dailyConsistency: 0,
        weeklyConsistency: 0,
        bestWeek: 1,
        
        activeDays: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save initial progress
      await this.saveProgressState(initialProgress);

      return initialProgress;
    } catch (error) {
      console.error('MonthlyProgressTracker.initializeChallengeProgress error:', error);
      throw error;
    }
  }

  /**
   * Check if a month has 31 days (for week5 initialization)
   */
  private static isMonthWith31Days(startDateString: DateString): boolean {
    try {
      const startDate = parseDate(startDateString);
      const month = startDate.getMonth();
      const year = startDate.getFullYear();
      
      // Get last day of month
      const lastDay = new Date(year, month + 1, 0).getDate();
      return lastDay === 31;
    } catch (error) {
      console.error('MonthlyProgressTracker.isMonthWith31Days error:', error);
      return false;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get active monthly challenges (stub - will be implemented with MonthlyChallengeService integration)
   */
  private static async getActiveMonthlyChallenge(): Promise<MonthlyChallenge[]> {
    try {
      // TODO: Integrate with MonthlyChallengeService.getActiveChallenge()
      // For now, return empty array until integration is complete
      return [];
    } catch (error) {
      console.error('MonthlyProgressTracker.getActiveMonthlyChallenge error:', error);
      return [];
    }
  }

  /**
   * Clear progress cache for a specific challenge
   */
  private static clearProgressCache(challengeId: string): void {
    this.progressCache.delete(challengeId);
  }

  /**
   * Clear all progress cache (for testing/debugging)
   */
  public static clearAllProgressCache(): void {
    this.progressCache.clear();
  }

  // ========================================
  // DAILY SNAPSHOTS & WEEKLY BREAKDOWN SYSTEM
  // ========================================

  /**
   * Create daily progress snapshot with comprehensive day analysis
   */
  private static async createDailySnapshot(
    challengeId: string,
    progress: MonthlyChallengeProgress,
    source: XPSourceType,
    amount: number
  ): Promise<void> {
    try {
      const todayString = formatDateToString(today());
      
      // Check if snapshot already exists for today
      const existingSnapshot = await this.getDailySnapshot(challengeId, todayString);
      
      if (existingSnapshot) {
        // Update existing snapshot
        await this.updateExistingSnapshot(existingSnapshot, source, amount, progress);
      } else {
        // Create new daily snapshot
        await this.createNewDailySnapshot(challengeId, progress, source, amount);
      }

      console.log(`📸 Daily snapshot created/updated for ${challengeId} on ${todayString}`);
    } catch (error) {
      console.error('MonthlyProgressTracker.createDailySnapshot error:', error);
      // Don't throw - snapshot creation should not block main flow
    }
  }

  /**
   * Create new daily snapshot
   */
  private static async createNewDailySnapshot(
    challengeId: string,
    progress: MonthlyChallengeProgress,
    source: XPSourceType,
    amount: number
  ): Promise<void> {
    try {
      const now = today();
      const todayString = formatDateToString(now);
      const dayOfMonth = now.getDate();
      const weekNumber = this.calculateWeekNumber(now) as 1 | 2 | 3 | 4 | 5;

      // Calculate daily contributions (what was added today)
      const dailyContributions: Record<string, number> = {};
      const relevantRequirements = await this.getRequirementsForChallenge(challengeId);
      
      for (const requirement of relevantRequirements) {
        const increment = this.calculateProgressIncrement(requirement, source, amount);
        dailyContributions[requirement.trackingKey] = increment;
      }

      // Get current cumulative progress
      const cumulativeProgress = { ...progress.progress };

      // Analyze daily features usage
      const dailyAnalysis = await this.analyzeDailyFeatureUsage(todayString);

      // Create snapshot
      const snapshot: DailyProgressSnapshot = {
        date: todayString,
        challengeId,
        dailyContributions,
        cumulativeProgress,
        progressPercentage: progress.completionPercentage,
        weekNumber,
        dayOfMonth,
        isTripleFeatureDay: dailyAnalysis.usedAllThreeFeatures,
        isPerfectDay: dailyAnalysis.metDailyMinimums,
        xpEarnedToday: amount,
        timestamp: new Date()
      };

      // Save snapshot
      await this.saveDailySnapshot(snapshot);

      // Emit snapshot created event
      DeviceEventEmitter.emit(this.EVENTS.DAILY_SNAPSHOT_CREATED, {
        challengeId,
        snapshot,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('MonthlyProgressTracker.createNewDailySnapshot error:', error);
    }
  }

  /**
   * Update existing daily snapshot
   */
  private static async updateExistingSnapshot(
    snapshot: DailyProgressSnapshot,
    source: XPSourceType,
    amount: number,
    progress: MonthlyChallengeProgress
  ): Promise<void> {
    try {
      // Update daily contributions
      const relevantRequirements = await this.getRequirementsForChallenge(snapshot.challengeId);
      
      for (const requirement of relevantRequirements) {
        const increment = this.calculateProgressIncrement(requirement, source, amount);
        if (increment > 0) {
          snapshot.dailyContributions[requirement.trackingKey] = 
            (snapshot.dailyContributions[requirement.trackingKey] || 0) + increment;
        }
      }

      // Update cumulative progress and percentage
      snapshot.cumulativeProgress = { ...progress.progress };
      snapshot.progressPercentage = progress.completionPercentage;
      
      // Update XP earned today
      snapshot.xpEarnedToday += amount;
      
      // Re-analyze daily features (in case this update changes triple/perfect status)
      const dailyAnalysis = await this.analyzeDailyFeatureUsage(snapshot.date);
      snapshot.isTripleFeatureDay = dailyAnalysis.usedAllThreeFeatures;
      snapshot.isPerfectDay = dailyAnalysis.metDailyMinimums;
      
      // Update timestamp
      snapshot.timestamp = new Date();

      // Save updated snapshot
      await this.saveDailySnapshot(snapshot);

    } catch (error) {
      console.error('MonthlyProgressTracker.updateExistingSnapshot error:', error);
    }
  }

  /**
   * Update weekly breakdown with latest progress
   */
  private static async updateWeeklyBreakdown(
    challengeId: string,
    progress: MonthlyChallengeProgress
  ): Promise<void> {
    try {
      const now = today();
      const currentWeekNumber = this.calculateWeekNumber(now);
      
      // Get or create weekly breakdown for current week
      let weeklyBreakdown = await this.getWeeklyBreakdown(challengeId, currentWeekNumber);
      
      if (!weeklyBreakdown) {
        weeklyBreakdown = await this.initializeWeeklyBreakdown(challengeId, currentWeekNumber);
      }

      // Update weekly progress
      const todayString = formatDateToString(now);
      const todaySnapshot = await this.getDailySnapshot(challengeId, todayString);
      
      if (todaySnapshot) {
        // Update weekly progress based on today's contributions
        for (const [trackingKey, contribution] of Object.entries(todaySnapshot.dailyContributions)) {
          weeklyBreakdown.weeklyProgress[trackingKey] = 
            (weeklyBreakdown.weeklyProgress[trackingKey] || 0) + contribution;
        }

        // Update weekly statistics
        weeklyBreakdown.completionPercentage = this.calculateWeeklyCompletionPercentage(weeklyBreakdown);
        
        // Update days active this week
        const weekSnapshots = await this.getWeeklySnapshots(challengeId, currentWeekNumber);
        weeklyBreakdown.daysActive = weekSnapshots.length;
        weeklyBreakdown.perfectDays = weekSnapshots.filter(s => s.isPerfectDay).length;
        
        // Find best day this week
        const bestSnapshot = weekSnapshots.reduce((best, current) => 
          current.progressPercentage > (best?.progressPercentage || 0) ? current : best
        );
        
        if (bestSnapshot) {
          weeklyBreakdown.bestDay = {
            date: bestSnapshot.date,
            progress: bestSnapshot.progressPercentage
          };
        }

        // Check if week is completed
        weeklyBreakdown.isCompleted = weeklyBreakdown.completionPercentage >= 100;
        weeklyBreakdown.isCurrentWeek = currentWeekNumber === weeklyBreakdown.weekNumber;

        // Update progress object with weekly data
        const weekKey = `week${currentWeekNumber}` as keyof typeof progress.weeklyProgress;
        progress.weeklyProgress[weekKey] = { ...weeklyBreakdown.weeklyProgress };

        // Calculate overall weekly consistency
        progress.weeklyConsistency = await this.calculateWeeklyConsistency(challengeId);
        
        // Update best week if this week is better
        if (weeklyBreakdown.completionPercentage > this.getBestWeekPerformance(progress)) {
          progress.bestWeek = currentWeekNumber;
        }

        // Save updated weekly breakdown
        await this.saveWeeklyBreakdown(weeklyBreakdown);

        // Emit week completed event if just completed
        if (weeklyBreakdown.isCompleted && weeklyBreakdown.daysActive >= 7) {
          DeviceEventEmitter.emit(this.EVENTS.WEEK_COMPLETED, {
            challengeId,
            weekNumber: currentWeekNumber,
            weeklyBreakdown,
            timestamp: new Date()
          });
        }
      }

      console.log(`📅 Weekly breakdown updated for ${challengeId}, week ${currentWeekNumber}`);
    } catch (error) {
      console.error('MonthlyProgressTracker.updateWeeklyBreakdown error:', error);
    }
  }

  // ========================================
  // MILESTONE DETECTION & CELEBRATION SYSTEM
  // ========================================

  /**
   * Check for milestone achievements (25%, 50%, 75%)
   */
  private static async checkMilestoneProgress(
    challengeId: string,
    progress: MonthlyChallengeProgress
  ): Promise<MilestoneResult[]> {
    try {
      const milestones: (25 | 50 | 75)[] = [25, 50, 75];
      const results: MilestoneResult[] = [];

      for (const milestone of milestones) {
        const milestoneData = progress.milestonesReached[milestone];
        const currentlyReached = progress.completionPercentage >= milestone;
        const previouslyReached = milestoneData.reached;

        if (currentlyReached && !previouslyReached) {
          // New milestone reached!
          const xpBonus = this.calculateMilestoneXPBonus(milestone, progress);
          
          // Update milestone data
          progress.milestonesReached[milestone] = {
            reached: true,
            timestamp: new Date(),
            xpAwarded: xpBonus
          };

          // Award XP bonus
          if (xpBonus > 0) {
            await GamificationService.addXP(
              xpBonus,
              XPSourceType.WEEKLY_CHALLENGE_REWARD,
              challengeId,
              { milestone, type: 'monthly_challenge_milestone' }
            );
          }

          const result: MilestoneResult = {
            milestone,
            reached: true,
            previouslyReached: false,
            celebrationTriggered: true,
            xpAwarded: xpBonus,
            timestamp: new Date(),
            requirements: { ...progress.progress }
          };

          results.push(result);

          console.log(`🎯 Milestone ${milestone}% reached for challenge ${challengeId}! Awarded ${xpBonus} XP`);
        } else {
          // No change in milestone status
          results.push({
            milestone,
            reached: currentlyReached,
            previouslyReached,
            celebrationTriggered: false,
            xpAwarded: 0,
            timestamp: new Date(),
            requirements: { ...progress.progress }
          });
        }
      }

      return results;
    } catch (error) {
      console.error('MonthlyProgressTracker.checkMilestoneProgress error:', error);
      return [];
    }
  }

  /**
   * Calculate XP bonus for milestone achievement
   */
  private static calculateMilestoneXPBonus(
    milestone: 25 | 50 | 75,
    progress: MonthlyChallengeProgress
  ): number {
    try {
      const baseBonuses = {
        25: 50,  // 25% milestone: 50 XP
        50: 100, // 50% milestone: 100 XP  
        75: 150  // 75% milestone: 150 XP
      };

      let bonus = baseBonuses[milestone];

      // Bonus multipliers for exceptional performance
      if (progress.dailyConsistency > 0.8) {
        bonus = Math.round(bonus * 1.2); // +20% for high consistency
      }
      
      if (progress.daysActive >= milestone * 0.3) { // High activity level
        bonus = Math.round(bonus * 1.1); // +10% for high activity
      }

      return bonus;
    } catch (error) {
      console.error('MonthlyProgressTracker.calculateMilestoneXPBonus error:', error);
      return 0;
    }
  }

  /**
   * Trigger milestone celebration
   */
  private static async triggerMilestoneCelebration(
    challenge: MonthlyChallenge,
    milestone: MilestoneResult
  ): Promise<void> {
    try {
      // Trigger celebration modal/animation
      DeviceEventEmitter.emit(this.EVENTS.MILESTONE_REACHED, {
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        milestone: milestone.milestone,
        xpAwarded: milestone.xpAwarded,
        requirements: milestone.requirements,
        timestamp: milestone.timestamp,
        celebrationType: 'monthly_milestone'
      });

      console.log(`🎉 Milestone celebration triggered: ${challenge.title} - ${milestone.milestone}%`);
    } catch (error) {
      console.error('MonthlyProgressTracker.triggerMilestoneCelebration error:', error);
    }
  }

  /**
   * Complete monthly challenge and integrate with star rating system
   */
  private static async completeMonthlyChallenge(challengeId: string): Promise<void> {
    try {
      const progress = await this.getChallengeProgress(challengeId);
      const challenge = await this.getChallengeById(challengeId);
      
      if (!progress || !challenge) {
        console.error(`Cannot complete challenge ${challengeId}: missing data`);
        return;
      }

      // Mark as completed
      progress.isCompleted = true;
      progress.completedAt = new Date();

      // Calculate final XP reward
      const baseXPReward = challenge.baseXPReward;
      const completionBonus = Math.round(baseXPReward * 0.2); // 20% bonus for 100% completion
      const streakBonus = progress.currentStreak * 100; // 100 XP per consecutive month
      const totalXP = baseXPReward + completionBonus + streakBonus;

      progress.xpEarned = totalXP;

      // Award XP
      await GamificationService.addXP(
        totalXP,
        XPSourceType.WEEKLY_CHALLENGE_REWARD,
        challengeId,
        { 
          type: 'monthly_challenge_completion',
          baseReward: baseXPReward,
          completionBonus,
          streakBonus,
          streak: progress.currentStreak
        }
      );

      // Update star rating for this category
      const completionData = {
        challengeId,
        category: challenge.category,
        completionPercentage: progress.completionPercentage,
        month: challenge.startDate.substring(0, 7), // YYYY-MM format
        wasCompleted: true,
        targetValue: challenge.requirements.reduce((sum, req) => sum + req.target, 0),
        actualValue: Object.values(progress.progress).reduce((sum, val) => sum + val, 0)
      };

      await StarRatingService.updateStarRatingForCompletion(completionData);

      // Update streak
      await this.updateChallengeStreak(challengeId, true);

      // Save completed progress
      await this.saveProgressState(progress);

      // Archive challenge
      await this.archiveCompletedChallenge(challenge, progress);

      console.log(`✅ Monthly challenge completed: ${challenge.title} (${totalXP} XP awarded)`);

      // Emit completion event
      DeviceEventEmitter.emit('monthly_challenge_completed', {
        challengeId,
        challengeTitle: challenge.title,
        completionPercentage: progress.completionPercentage,
        xpAwarded: totalXP,
        streak: progress.currentStreak + 1,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('MonthlyProgressTracker.completeMonthlyChallenge error:', error);
    }
  }

  // ========================================
  // UTILITY & HELPER METHODS
  // ========================================

  /**
   * Calculate which week of the month a date falls into (1-5)
   */
  private static calculateWeekNumber(date: Date): number {
    try {
      const dayOfMonth = date.getDate();
      return Math.ceil(dayOfMonth / 7);
    } catch (error) {
      console.error('MonthlyProgressTracker.calculateWeekNumber error:', error);
      return 1;
    }
  }

  /**
   * Analyze daily feature usage for triple feature and perfect day detection
   */
  private static async analyzeDailyFeatureUsage(dateString: DateString): Promise<{
    usedAllThreeFeatures: boolean;
    metDailyMinimums: boolean;
  }> {
    try {
      // Get XP transactions for this date to analyze feature usage
      const dailyTransactions = await this.getDailyXPTransactions(dateString);
      
      // Check for all three features
      const hasHabits = dailyTransactions.some(t => 
        t.source === XPSourceType.HABIT_COMPLETION || t.source === XPSourceType.HABIT_BONUS
      );
      const hasJournal = dailyTransactions.some(t => 
        t.source === XPSourceType.JOURNAL_ENTRY || t.source === XPSourceType.JOURNAL_BONUS
      );
      const hasGoals = dailyTransactions.some(t => 
        t.source === XPSourceType.GOAL_PROGRESS || t.source === XPSourceType.GOAL_COMPLETION
      );

      const usedAllThreeFeatures = hasHabits && hasJournal && hasGoals;

      // Check for daily minimums (1+ habits, 3+ journal entries, 1+ goal progress)
      const habitCount = dailyTransactions.filter(t => t.source === XPSourceType.HABIT_COMPLETION).length;
      const journalCount = dailyTransactions.filter(t => t.source === XPSourceType.JOURNAL_ENTRY).length;
      const goalProgressCount = dailyTransactions.filter(t => t.source === XPSourceType.GOAL_PROGRESS).length;

      const metDailyMinimums = habitCount >= 1 && journalCount >= 3 && goalProgressCount >= 1;

      return {
        usedAllThreeFeatures,
        metDailyMinimums
      };
    } catch (error) {
      console.error('MonthlyProgressTracker.analyzeDailyFeatureUsage error:', error);
      return {
        usedAllThreeFeatures: false,
        metDailyMinimums: false
      };
    }
  }

  /**
   * Get daily XP transactions for analysis (stub - needs GamificationService integration)
   */
  private static async getDailyXPTransactions(dateString: DateString): Promise<any[]> {
    try {
      // TODO: Integrate with GamificationService to get daily transactions
      // For now, return empty array until integration is complete
      return [];
    } catch (error) {
      console.error('MonthlyProgressTracker.getDailyXPTransactions error:', error);
      return [];
    }
  }

  // ========================================
  // STORAGE & PERSISTENCE HELPER METHODS
  // ========================================

  /**
   * Get daily snapshot from storage
   */
  private static async getDailySnapshot(challengeId: string, date: DateString): Promise<DailyProgressSnapshot | null> {
    try {
      const key = `${this.STORAGE_KEYS.DAILY_SNAPSHOTS}_${challengeId}_${date}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (!stored) return null;
      
      return JSON.parse(stored) as DailyProgressSnapshot;
    } catch (error) {
      console.error('MonthlyProgressTracker.getDailySnapshot error:', error);
      return null;
    }
  }

  /**
   * Save daily snapshot to storage
   */
  private static async saveDailySnapshot(snapshot: DailyProgressSnapshot): Promise<void> {
    try {
      const key = `${this.STORAGE_KEYS.DAILY_SNAPSHOTS}_${snapshot.challengeId}_${snapshot.date}`;
      await AsyncStorage.setItem(key, JSON.stringify(snapshot));
    } catch (error) {
      console.error('MonthlyProgressTracker.saveDailySnapshot error:', error);
      throw error;
    }
  }

  // ========================================
  // PLACEHOLDER METHODS FOR FUTURE PHASES
  // ========================================

  /**
   * Get requirements for a challenge (placeholder - needs MonthlyChallengeService integration)
   */
  private static async getRequirementsForChallenge(challengeId: string): Promise<MonthlyChallengeRequirement[]> {
    // TODO: Integrate with MonthlyChallengeService
    return [];
  }

  /**
   * Get challenge by ID (placeholder - needs MonthlyChallengeService integration)
   */
  private static async getChallengeById(challengeId: string): Promise<MonthlyChallenge | null> {
    // TODO: Integrate with MonthlyChallengeService
    return null;
  }

  /**
   * Additional placeholder methods for weekly breakdown operations
   */
  private static async getWeeklyBreakdown(challengeId: string, weekNumber: number): Promise<WeeklyBreakdown | null> { return null; }
  private static async initializeWeeklyBreakdown(challengeId: string, weekNumber: number): Promise<WeeklyBreakdown> { throw new Error('Not implemented'); }
  private static async getWeeklySnapshots(challengeId: string, weekNumber: number): Promise<DailyProgressSnapshot[]> { return []; }
  private static calculateWeeklyCompletionPercentage(breakdown: WeeklyBreakdown): number { return 0; }
  private static async calculateWeeklyConsistency(challengeId: string): Promise<number> { return 0; }
  private static getBestWeekPerformance(progress: MonthlyChallengeProgress): number { return 0; }
  private static async saveWeeklyBreakdown(breakdown: WeeklyBreakdown): Promise<void> {}
  private static async updateChallengeStreak(challengeId: string, completed: boolean): Promise<void> {}
  private static async archiveCompletedChallenge(challenge: MonthlyChallenge, progress: MonthlyChallengeProgress): Promise<void> {}
}