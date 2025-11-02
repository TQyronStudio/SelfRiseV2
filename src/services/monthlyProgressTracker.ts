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
import { FEATURE_FLAGS } from '../config/featureFlags';
import { sqliteChallengeStorage } from './storage/SQLiteChallengeStorage';

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
  challengeId: string;                         // Challenge this breakdown belongs to
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

  // Storage adapter - uses SQLite when enabled, AsyncStorage otherwise
  private static get storage() {
    return FEATURE_FLAGS.USE_SQLITE_CHALLENGES ? sqliteChallengeStorage : null;
  }

  // Performance optimization settings
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly BATCH_WINDOW = 500; // 500ms batching window
  private static readonly MAX_SNAPSHOTS_PER_MONTH = 31; // One per day max
  private static readonly SNAPSHOTS_CACHE_TTL = 10000; // 10 seconds for snapshots

  // Cache for performance
  private static progressCache = new Map<string, {
    data: MonthlyChallengeProgress;
    timestamp: number;
  }>();
  private static snapshotsCache: { data: DailyProgressSnapshot[]; timestamp: number } | null = null;

  // Weekly habits tracking cache for Variety Champion real-time uniqueness
  private static currentWeekHabits: Set<string> = new Set();
  private static currentWeekNumber: number = 0;

  // Daily habit streak tracking cache for Streak Builder real-time consecutive days
  private static streakCompletedToday: boolean = false;
  private static currentStreakDate: string = '';
  private static currentStreakDays: number = 0;

  // Daily journal streak tracking cache for Consistency Writer real-time consecutive days
  private static journalStreakCompletedToday: boolean = false;
  private static currentJournalStreakDate: string = '';
  private static currentJournalStreakDays: number = 0;
  
  // Journal entries counter for star-based daily requirements  
  private static todayJournalEntriesCount: number = 0;
  private static journalCountDate: string = '';

  private static batchingTimer: NodeJS.Timeout | null = null;
  private static pendingBatches = new Map<string, ProgressUpdateBatch>();
  
  // Concurrency control to prevent race conditions
  private static updateQueues = new Map<string, Promise<void>>();

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
      console.log(`🔍 [DEBUG] MonthlyProgressTracker.updateMonthlyProgress called with:`, { source, amount, sourceId, metadata });
      
      // Update journal entries counter for star-based requirements (if positive amount)
      if ((source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS) && amount > 0) {
        this.incrementTodayJournalCount();
      }
      
      // Get active monthly challenges
      const activeChallenges = await this.getActiveMonthlyChallenge();
      console.log(`🔍 [DEBUG] Found ${activeChallenges.length} active challenges:`, activeChallenges.map(c => ({ id: c.id, title: c.title, isActive: c.isActive })));
      
      if (activeChallenges.length === 0) {
        console.log(`❌ [DEBUG] No active monthly challenges found - exiting updateMonthlyProgress`);
        return; // No active challenges to update
      }

      console.log(`📈 Updating monthly progress from ${source} (+${amount} XP)`);

      // Process each active challenge
      for (const challenge of activeChallenges) {
        console.log(`🔍 [DEBUG] Processing challenge: ${challenge.id} - ${challenge.title}`);
        await this.processProgressUpdate(challenge, source, amount, metadata);
      }

    } catch (error) {
      console.error('MonthlyProgressTracker.updateMonthlyProgress error:', error);
      // Don't throw - progress tracking should not break the main flow
    }
  }

  /**
   * Process progress update for a specific challenge with sequential queue processing
   */
  private static async processProgressUpdate(
    challenge: MonthlyChallenge,
    source: XPSourceType,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Ensure sequential processing using promise chaining
    const queueKey = `progress_${challenge.id}`;
    
    // Chain this update to the existing queue
    const previousPromise = this.updateQueues.get(queueKey) || Promise.resolve();
    
    const currentPromise = previousPromise
      .then(() => this.executeAtomicProgressUpdate(challenge, source, amount, metadata))
      .catch((error) => {
        console.error(`Error in progress update queue for ${challenge.id}:`, error);
        // Don't let one failed update break the queue
      });
    
    // Update the queue with current promise
    this.updateQueues.set(queueKey, currentPromise);
    
    // Wait for this update to complete
    await currentPromise;
  }
  
  /**
   * Execute atomic progress update (internal method)
   */
  private static async executeAtomicProgressUpdate(
    challenge: MonthlyChallenge,
    source: XPSourceType,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      console.log(`🔍 [DEBUG] executeAtomicProgressUpdate - Challenge: ${challenge.title}, Source: ${source}, Amount: ${amount}`);
      
      // Check if this source contributes to any challenge requirement
      const relevantRequirements = this.getRelevantRequirements(challenge, source);
      console.log(`🔍 [DEBUG] Found ${relevantRequirements.length} relevant requirements:`, relevantRequirements.map(r => r.trackingKey));
      
      if (relevantRequirements.length === 0) {
        console.log(`❌ [DEBUG] No relevant requirements found for source ${source} - skipping`);
        return; // This XP source doesn't contribute to this challenge
      }

      // Get current progress (always fetch fresh to avoid stale cache during concurrent updates)
      this.clearProgressCache(challenge.id); // Clear cache to ensure fresh read
      let currentProgress = await this.getChallengeProgress(challenge.id);
      console.log(`🔍 [DEBUG] Current progress for ${challenge.id}:`, currentProgress ? 'FOUND' : 'NOT FOUND');
      
      if (!currentProgress) {
        console.warn(`❌ [DEBUG] No progress found for challenge ${challenge.id} - attempting to initialize...`);
        
        try {
          currentProgress = await this.initializeChallengeProgress(challenge);
          console.log(`✅ [DEBUG] Progress initialized for ${challenge.id}:`, currentProgress.progress);
        } catch (initError) {
          console.error(`❌ [DEBUG] Failed to initialize progress for ${challenge.id}:`, initError);
          return;
        }
      }

      // Calculate progress increments and apply atomically
      let progressUpdated = false;
      const previousProgress = { ...currentProgress.progress };
      
      // Apply all increments atomically
      for (const requirement of relevantRequirements) {
        const incrementValue = this.calculateProgressIncrement(
          requirement,
          source,
          amount,
          metadata,
          challenge
        );

        if (incrementValue !== 0) {
          // Atomic increment/decrement: always read the current value fresh from storage-backed progress object
          const currentValue = currentProgress.progress[requirement.trackingKey] || 0;
          const newValue = Math.max(0, currentValue + incrementValue); // Ensure progress never goes below 0
          currentProgress.progress[requirement.trackingKey] = newValue;
          progressUpdated = true;

          const operation = incrementValue > 0 ? `+${incrementValue}` : `${incrementValue}`;
          console.log(`📊 Challenge "${challenge.title}": ${requirement.trackingKey} ${operation} (${currentValue} → ${newValue}/${requirement.target})`);
        }
      }

      if (progressUpdated) {
        // Update completion percentage
        currentProgress.completionPercentage = this.calculateCompletionPercentage(
          challenge,
          currentProgress
        );

        // Create daily snapshot FIRST (so recalculateActiveDays can see today's progress)
        await this.createDailySnapshot(challenge.id, currentProgress, source, amount);

        // Recalculate active days dynamically based on actual progress (INCLUDING today's snapshot)
        console.log(`🔍 [DEBUG] Active days before recalculation: ${JSON.stringify(currentProgress.activeDays)}, count: ${currentProgress.daysActive}`);
        await this.recalculateActiveDays(challenge.id, currentProgress);
        console.log(`✅ [DEBUG] Active days after recalculation: ${JSON.stringify(currentProgress.activeDays)}, count: ${currentProgress.daysActive}`);

        // Recalculate complex tracking keys (triple_feature_days, perfect_days, etc.)
        await this.recalculateComplexTrackingKeys(challenge, currentProgress);

        // Update days remaining
        currentProgress.daysRemaining = this.calculateDaysRemaining(challenge);

        // Update projected completion
        currentProgress.projectedCompletion = this.calculateProjectedCompletion(
          currentProgress
        );

        // Update weekly breakdown (requires daily snapshot to exist)
        await this.updateWeeklyBreakdown(challenge.id, currentProgress);

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
          daysActive: currentProgress.daysActive,
          daysRemaining: currentProgress.daysRemaining,
          activeDays: currentProgress.activeDays,
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
      } else {
        console.log(`⚠️ [DEBUG] Progress not updated - no changes to active days. Current active days: ${JSON.stringify(currentProgress.activeDays)}, count: ${currentProgress.daysActive}`);
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
    console.log(`🔍 [DEBUG] getRelevantRequirements - Challenge has ${challenge.requirements?.length || 0} requirements:`, 
      challenge.requirements?.map(r => r.trackingKey) || []);
    console.log(`🔍 [DEBUG] Looking for requirements that match XP source: ${source}`);
    
    return challenge.requirements.filter(requirement => {
      let matches = false;
      
      switch (requirement.trackingKey) {
        case 'scheduled_habit_completions':
          matches = source === XPSourceType.HABIT_COMPLETION;
          break;
        case 'bonus_habit_completions':
          matches = source === XPSourceType.HABIT_BONUS;
          break;
        case 'unique_weekly_habits':
          matches = source === XPSourceType.HABIT_COMPLETION || source === XPSourceType.HABIT_BONUS;
          break;
        case 'quality_journal_entries':
          matches = source === XPSourceType.JOURNAL_ENTRY;
          break;
        case 'bonus_journal_entries':
          matches = source === XPSourceType.JOURNAL_BONUS;
          break;
        case 'total_journal_entries_with_bonus':
          matches = source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS;
          break;
        case 'daily_journal_streak':
          matches = source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS;
          break;
        case 'daily_goal_progress':
          matches = source === XPSourceType.GOAL_PROGRESS;
          break;
        case 'goal_completions':
          matches = source === XPSourceType.GOAL_COMPLETION;
          break;
        case 'triple_feature_days':
        case 'daily_engagement_streak':
        case 'perfect_days':
        case 'monthly_xp_total':
        case 'balance_score':
          matches = true; // These require daily aggregation analysis (all XP sources)
          break;
        default:
          matches = false;
          break;
      }
      
      console.log(`🔍 [DEBUG] Requirement "${requirement.trackingKey}" matches source ${source}: ${matches ? 'YES' : 'NO'}`);
      return matches;
    });
  }

  /**
   * Calculate progress increment based on XP source and requirement
   */
  private static calculateProgressIncrement(
    requirement: MonthlyChallengeRequirement,
    source: XPSourceType,
    amount: number,
    metadata?: Record<string, any>,
    challenge?: MonthlyChallenge
  ): number {
    // Determine increment/decrement direction based on XP amount
    const direction = amount > 0 ? 1 : amount < 0 ? -1 : 0;
    console.log(`🔍 [DEBUG] calculateProgressIncrement - Amount: ${amount}, Direction: ${direction}`);
    
    switch (requirement.trackingKey) {
      case 'scheduled_habit_completions':
        return source === XPSourceType.HABIT_COMPLETION ? direction : 0;
        
      case 'bonus_habit_completions':
        return source === XPSourceType.HABIT_BONUS ? direction : 0;
        
      case 'unique_weekly_habits':
        // Real-time weekly habit variety tracking - TRUE uniqueness per week
        if ((source === XPSourceType.HABIT_COMPLETION || source === XPSourceType.HABIT_BONUS) && metadata?.sourceId) {
          // SYNC call to prevent async issues - use cached snapshots for performance
          return this.calculateWeeklyHabitVarietyIncrement(metadata.sourceId, direction);
        }
        return 0;
        
      case 'quality_journal_entries':
        // Only count journal entries with 33+ characters (quality entries)
        if (source === XPSourceType.JOURNAL_ENTRY && metadata?.entryLength && metadata.entryLength >= 33) {
          return direction;
        }
        return 0;
        
      case 'bonus_journal_entries':
        return source === XPSourceType.JOURNAL_BONUS ? direction : 0;
        
      case 'total_journal_entries_with_bonus':
        // Combined counter: regular + bonus journal entries (all types)
        return (source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS) ? direction : 0;
        
      case 'daily_goal_progress':
        return source === XPSourceType.GOAL_PROGRESS ? direction : 0;
        
      case 'goal_completions':
        return source === XPSourceType.GOAL_COMPLETION ? direction : 0;
        
      case 'habit_streak_days':
        // Real-time consecutive days streak tracking - like Consistency Master pattern
        if (source === XPSourceType.HABIT_COMPLETION || source === XPSourceType.HABIT_BONUS) {
          return this.calculateHabitStreakIncrement(direction);
        }
        return 0;
        
      case 'daily_journal_streak':
        // Real-time consecutive days journal streak tracking with star-based entry requirements
        if (source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS) {
          return this.calculateJournalStreakIncrement(direction, challenge);
        }
        return 0;
        
      case 'triple_feature_days':
      case 'daily_engagement_streak':
      case 'perfect_days':
      case 'monthly_xp_total':
      case 'balance_score':
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

      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        const challenges = await this.storage.getActiveChallenges();
        const challenge = challenges.find(c => c.id === challengeId);
        if (!challenge) return null;

        // Convert challenge to progress format with ALL required fields
        const progressData = challenge.requirements.reduce((acc: Record<string, number>, req: any) => {
          acc[req.trackingKey] = req.currentValue || 0;
          return acc;
        }, {} as Record<string, number>);

        // Calculate completion percentage from requirements
        let totalCompletion = 0;
        if (challenge.requirements.length > 0) {
          for (const req of challenge.requirements) {
            const current = (req as any).currentValue || 0;
            const target = req.target || 1;
            const reqCompletion = Math.min((current / target) * 100, 100);
            totalCompletion += reqCompletion;
          }
          totalCompletion = Math.round(totalCompletion / challenge.requirements.length);
        }

        // Get all daily snapshots for this challenge to calculate active days
        const challengeSnapshots = await this.storage.getDailySnapshots(challengeId);

        // Calculate active days (days with any contribution)
        const activeDays = challengeSnapshots
          .filter((snapshot: any) => {
            const contributions = snapshot.dailyContributions || {};
            return Object.values(contributions).some(val => val > 0);
          })
          .map((snapshot: any) => snapshot.date);

        const daysActive = activeDays.length;

        // Calculate milestones based on completion percentage
        const milestonesReached = {
          25: { reached: totalCompletion >= 25 },
          50: { reached: totalCompletion >= 50 },
          75: { reached: totalCompletion >= 75 },
        };

        const progress: MonthlyChallengeProgress = {
          // From ChallengeProgress interface
          challengeId: challenge.id,
          userId: (challenge as any).userId || 'local_user',
          progress: progressData,
          isCompleted: totalCompletion >= 100,
          xpEarned: 0,

          // From MonthlyChallengeProgress interface
          completionPercentage: totalCompletion,
          daysActive,
          daysRemaining: this.calculateDaysRemaining(challenge),
          projectedCompletion: 0,
          activeDays,
          currentStreak: 0,
          longestStreak: 0,
          streakBonusEligible: false,
          dailyConsistency: 0,
          weeklyConsistency: 0,
          bestWeek: 1,
          weeklyProgress: {
            week1: {},
            week2: {},
            week3: {},
            week4: {},
          },
          milestonesReached,
          updatedAt: new Date()
        };

        // Update cache
        this.progressCache.set(challengeId, {
          data: progress,
          timestamp: Date.now()
        });

        return progress;
      }

      // Fallback to AsyncStorage
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
      (progress as any).updatedAt = new Date();

      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        // Clear cache FIRST to ensure fresh read on next getChallengeProgress
        this.clearProgressCache(progress.challengeId);

        // Update challenge progress
        await this.storage.updateChallengeProgress(progress.challengeId, progress.completionPercentage);

        // Update individual requirements
        const challenges = await this.storage.getActiveChallenges();
        const challenge = challenges.find(c => c.id === progress.challengeId);
        if (challenge) {
          for (const req of challenge.requirements) {
            if (progress.progress[req.trackingKey] !== undefined) {
              (req as any).currentValue = progress.progress[req.trackingKey];
              await this.storage.updateRequirement(progress.challengeId, req);
            }
          }
        }

        // Don't cache after save - let getChallengeProgress rebuild from DB
        // This ensures UI always gets fresh data
        return;
      }

      // Fallback to AsyncStorage
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
        progress: challenge.requirements.reduce((acc, req) => {
          acc[req.trackingKey] = 0;
          return acc;
        }, {} as Record<string, number>),
        isCompleted: false,
        xpEarned: 0,

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
   * Get active monthly challenges - fully integrated with MonthlyChallengeService
   */
  private static async getActiveMonthlyChallenge(): Promise<MonthlyChallenge[]> {
    try {
      console.log(`🔍 [DEBUG] getActiveMonthlyChallenge - Starting search for active challenges...`);
      
      // Import MonthlyChallengeService 
      const { MonthlyChallengeService } = require('./monthlyChallengeService');
      console.log(`🔍 [DEBUG] MonthlyChallengeService imported successfully`);
      
      // Get current active challenge
      const currentChallenge = await MonthlyChallengeService.getCurrentChallenge();
      console.log(`🔍 [DEBUG] MonthlyChallengeService.getCurrentChallenge() returned:`, currentChallenge ? 
        { id: currentChallenge.id, title: currentChallenge.title, isActive: currentChallenge.isActive, startDate: currentChallenge.startDate, endDate: currentChallenge.endDate } : 
        'null');
      
      if (currentChallenge && currentChallenge.isActive) {
        console.log(`✅ [DEBUG] Found active challenge: ${currentChallenge.title} (${currentChallenge.id})`);
        return [currentChallenge];
      } else if (currentChallenge && !currentChallenge.isActive) {
        console.log(`❌ [DEBUG] Challenge found but not active: ${currentChallenge.title} (isActive: ${currentChallenge.isActive})`);
      } else {
        console.log(`❌ [DEBUG] No current challenge found`);
      }
      
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

  /**
   * Recalculate active days dynamically based on actual daily progress
   */
  private static async recalculateActiveDays(
    challengeId: string, 
    progress: MonthlyChallengeProgress
  ): Promise<void> {
    try {
      // Get all daily snapshots for this challenge (using cached method)
      const allSnapshots = await this.getAllSnapshots();
      
      // Filter snapshots for this challenge
      const challengeSnapshots = allSnapshots.filter(s => s.challengeId === challengeId);
      
      // Find active days (days with any daily contributions > 0)
      const activeDays: string[] = [];
      
      for (const snapshot of challengeSnapshots) {
        const dailyContribs = Object.values(snapshot.dailyContributions || {});
        const hasAnyProgress = dailyContribs.some(contrib => contrib > 0);
        
        if (hasAnyProgress) {
          activeDays.push(snapshot.date);
        }
      }
      
      // Sort active days chronologically
      activeDays.sort();
      
      // Update progress object
      progress.activeDays = activeDays;
      progress.daysActive = activeDays.length;
      
    } catch (error) {
      console.error('MonthlyProgressTracker.recalculateActiveDays error:', error);
      // Don't throw - active days calculation should not break main flow
    }
  }

  /**
   * Recalculate complex tracking keys that require daily snapshot analysis
   */
  private static async recalculateComplexTrackingKeys(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress
  ): Promise<void> {
    try {
      console.log(`🔍 [DEBUG] recalculateComplexTrackingKeys - Starting for challenge: ${challenge.title}`);
      
      // Get all daily snapshots for this challenge
      const allSnapshots = await this.getAllSnapshots();
      const challengeSnapshots = allSnapshots.filter(s => s.challengeId === challenge.id);
      
      console.log(`🔍 [DEBUG] Found ${challengeSnapshots.length} snapshots for challenge ${challenge.id}`);
      
      // Check each requirement to see if it needs complex daily analysis
      for (const requirement of challenge.requirements) {
        const trackingKey = requirement.trackingKey;
        
        switch (trackingKey) {
          case 'triple_feature_days':
            const tripleFeatureDays = challengeSnapshots.filter(s => s.isTripleFeatureDay === true).length;
            const previousTripleCount = progress.progress[trackingKey] || 0;
            progress.progress[trackingKey] = tripleFeatureDays;
            console.log(`📊 Triple Feature Days: ${previousTripleCount} → ${tripleFeatureDays}`);
            break;
            
          case 'perfect_days':
            const perfectDays = challengeSnapshots.filter(s => s.isPerfectDay === true).length;
            const previousPerfectCount = progress.progress[trackingKey] || 0;
            progress.progress[trackingKey] = perfectDays;
            console.log(`📊 Perfect Days: ${previousPerfectCount} → ${perfectDays}`);
            break;
            
          case 'daily_engagement_streak':
            // Count days with any XP earned (hasAppUsage equivalent)
            const engagementDays = challengeSnapshots.filter(s => (s.xpEarnedToday || 0) > 0).length;
            const previousEngagementCount = progress.progress[trackingKey] || 0;
            progress.progress[trackingKey] = engagementDays;
            console.log(`📊 Daily Engagement Days: ${previousEngagementCount} → ${engagementDays}`);
            break;
            
          case 'monthly_xp_total':
            // Sum all XP earned from daily snapshots for this challenge
            const totalXP = challengeSnapshots.reduce((sum, s) => sum + (s.xpEarnedToday || 0), 0);
            const previousXPTotal = progress.progress[trackingKey] || 0;
            progress.progress[trackingKey] = totalXP;
            console.log(`📊 Monthly XP Total: ${previousXPTotal} → ${totalXP}`);
            break;
            
          case 'balance_score':
            // Calculate XP source balance - balanced usage means no source >60% of total
            const balanceScore = await this.calculateBalanceScore(challenge.id);
            const previousBalanceScore = progress.progress[trackingKey] || 0;
            progress.progress[trackingKey] = balanceScore;
            console.log(`📊 Balance Score: ${previousBalanceScore.toFixed(2)} → ${balanceScore.toFixed(2)}`);
            break;
            
          default:
            // Skip non-complex tracking keys
            break;
        }
      }
      
      console.log(`✅ [DEBUG] recalculateComplexTrackingKeys completed for ${challenge.title}`);
    } catch (error) {
      console.error('MonthlyProgressTracker.recalculateComplexTrackingKeys error:', error);
      // Don't throw - complex tracking calculation should not break main flow
    }
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
      const todayString = today();
      
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
      const now = new Date();
      const todayString = formatDateToString(now);

      // Get challenge to validate date range
      const challenge = await this.getChallengeById(challengeId);
      if (!challenge) {
        console.warn(`Cannot create snapshot: challenge ${challengeId} not found`);
        return;
      }

      // CRITICAL: Validate that today's date falls within challenge date range
      // This prevents snapshots from previous month being saved to new month's challenge
      if (todayString < challenge.startDate || todayString > challenge.endDate) {
        console.warn(`⚠️ Skipping snapshot creation: date ${todayString} is outside challenge range ${challenge.startDate} to ${challenge.endDate}`);
        return;
      }

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

      // Calculate total XP earned today from all transactions (not just this one)
      const todayTotalXP = await this.calculateTotalXPForDate(todayString);

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
        xpEarnedToday: todayTotalXP,
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
        if (increment !== 0) {
          const currentContribution = snapshot.dailyContributions[requirement.trackingKey] || 0;
          snapshot.dailyContributions[requirement.trackingKey] = Math.max(0, currentContribution + increment);
        }
      }

      // Update cumulative progress and percentage
      snapshot.cumulativeProgress = { ...progress.progress };
      snapshot.progressPercentage = progress.completionPercentage;
      
      // Recalculate total XP earned today from all transactions (not just increment)
      snapshot.xpEarnedToday = await this.calculateTotalXPForDate(snapshot.date);
      
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
      const now = new Date();
      const currentWeekNumber = this.calculateWeekNumber(now);
      
      // Get or create weekly breakdown for current week
      let weeklyBreakdown = await this.getWeeklyBreakdown(challengeId, currentWeekNumber);
      
      if (!weeklyBreakdown) {
        weeklyBreakdown = await this.initializeWeeklyBreakdown(challengeId, currentWeekNumber);
      }

      // Update weekly progress - use current today() for consistency with snapshot creation
      const todayString = today();
      const todaySnapshot = await this.getDailySnapshot(challengeId, todayString);
      if (todaySnapshot && todaySnapshot.dailyContributions) {
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
        
        // Find best day this week (with fallback for empty array)
        const bestSnapshot = weekSnapshots.length > 0 
          ? weekSnapshots.reduce((best, current) => 
              current.progressPercentage > (best?.progressPercentage || 0) ? current : best
            )
          : null;
        
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
        progress.weeklyProgress[weekKey] = { ...(weeklyBreakdown.weeklyProgress || {}) };

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
            await GamificationService.addXP(xpBonus, {
              source: XPSourceType.MONTHLY_CHALLENGE,
              sourceId: challengeId,
              description: `Monthly challenge milestone ${milestone}%`,
              metadata: { milestone, type: 'monthly_challenge_milestone' }
            });
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
      await GamificationService.addXP(totalXP, {
        source: XPSourceType.MONTHLY_CHALLENGE,
        sourceId: challengeId,
        description: `Monthly challenge completed: ${challenge?.title}`,
        metadata: { 
          type: 'monthly_challenge_completion',
          baseReward: baseXPReward,
          completionBonus,
          streakBonus,
          streak: progress.currentStreak
        }
      });

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
   * Calculate weekly habit variety increment - SYNC version for real-time tracking  
   * Returns +1 only if habitId is NEW for current week, 0 if already completed
   */
  private static calculateWeeklyHabitVarietyIncrement(habitId: string, direction: number): number {
    try {
      // Only process positive direction (habit completion)
      if (direction <= 0) return 0;

      // Get current week number (1-4/5)
      const todayDate = new Date();
      const currentWeek = this.calculateWeekNumber(todayDate);

      // Reset weekly cache if week changed
      if (this.currentWeekNumber !== currentWeek) {
        console.log(`📅 [DEBUG] Week changed from ${this.currentWeekNumber} to ${currentWeek} - resetting weekly habits cache`);
        this.currentWeekHabits.clear();
        this.currentWeekNumber = currentWeek;
      }

      // Check if habit already completed this week
      if (this.currentWeekHabits.has(habitId)) {
        console.log(`🔁 [DEBUG] Habit ${habitId} already completed this week - returning 0`);
        return 0; // Already completed this week
      }

      // New habit for this week - add to cache and return +1
      this.currentWeekHabits.add(habitId);
      console.log(`✨ [DEBUG] NEW habit ${habitId} for week ${currentWeek} - returning 1. Total unique: ${this.currentWeekHabits.size}`);
      return 1;

    } catch (error) {
      console.error('MonthlyProgressTracker.calculateWeeklyHabitVarietyIncrement error:', error);
      // Optimistic fallback - better than losing progress
      return direction > 0 ? 1 : 0;
    }
  }

  /**
   * Calculate habit streak increment - SYNC version for real-time consecutive days tracking
   * Returns +1 only for FIRST habit completion today, 0 for subsequent same-day completions
   */
  private static calculateHabitStreakIncrement(direction: number): number {
    try {
      // Only process positive direction (habit completion)
      if (direction <= 0) return 0;

      // Get current date (YYYY-MM-DD format)
      const todayString: string = new Date().toISOString().split('T')[0]!;

      // Check if date changed since last tracking
      if (this.currentStreakDate !== todayString) {
        console.log(`📅 [DEBUG] Date changed from ${this.currentStreakDate} to ${todayString}`);
        
        // Calculate if today continues yesterday's streak
        const isConsecutive = this.currentStreakDate ? this.isConsecutiveDay(this.currentStreakDate, todayString) : false;
        
        if (isConsecutive && this.currentStreakDays > 0) {
          // Continue streak - increment by 1
          this.currentStreakDays += 1;
          console.log(`🔥 [DEBUG] Streak continues! Day ${this.currentStreakDays}`);
        } else {
          // Start new streak
          this.currentStreakDays = 1;
          console.log(`✨ [DEBUG] New streak started! Day ${this.currentStreakDays}`);
        }

        // Update tracking state for today
        this.currentStreakDate = todayString;
        this.streakCompletedToday = true;
        
        return 1; // First completion today extends/starts streak
      }

      // Same day - check if already counted
      if (this.streakCompletedToday) {
        console.log(`🔁 [DEBUG] Streak already counted today - returning 0`);
        return 0; // Already counted streak today
      }

      // First completion today (edge case - shouldn't happen with proper date tracking)
      this.streakCompletedToday = true;
      return 1;

    } catch (error) {
      console.error('MonthlyProgressTracker.calculateHabitStreakIncrement error:', error);
      // Optimistic fallback - better than losing progress
      return direction > 0 ? 1 : 0;
    }
  }

  /**
   * Calculate journal streak increment - SYNC version with star-based entry requirements
   * Star Level determines daily journal entries needed: 1⭐=1 entry, 2⭐=2 entries, 5⭐=5 entries
   * Returns +1 only when reaching required entries for the day, 0 otherwise
   */
  private static calculateJournalStreakIncrement(direction: number, challenge?: MonthlyChallenge): number {
    try {
      // Only process positive direction (journal entry completion)
      if (direction <= 0) return 0;

      // Get challenge star level (default to 1 if not available)
      const starLevel = challenge?.starLevel || 1;
      const requiredEntriesPerDay = starLevel; // 1⭐=1 entry, 2⭐=2 entries, 5⭐=5 entries
      
      console.log(`📝⭐ [DEBUG] Consistency Writer requires ${requiredEntriesPerDay} entries/day (${starLevel}⭐ level)`);

      // Get current date (YYYY-MM-DD format)
      const todayString: string = new Date().toISOString().split('T')[0]!;

      // Count today's journal entries (synchronous count using transactions)
      const todayJournalCount = this.countTodayJournalEntries(todayString);
      console.log(`📝📊 [DEBUG] Today's journal entries so far: ${todayJournalCount}/${requiredEntriesPerDay}`);

      // Check if we've reached the required number of entries
      if (todayJournalCount < requiredEntriesPerDay) {
        console.log(`📝⏳ [DEBUG] Not enough entries yet (${todayJournalCount}/${requiredEntriesPerDay}) - streak not counted today`);
        return 0; // Not enough entries for star level requirement
      }

      // Check if date changed since last tracking
      if (this.currentJournalStreakDate !== todayString) {
        console.log(`📅 [DEBUG] Journal date changed from ${this.currentJournalStreakDate} to ${todayString}`);
        
        // Calculate if today continues yesterday's streak
        const isConsecutive = this.currentJournalStreakDate ? this.isConsecutiveDay(this.currentJournalStreakDate, todayString) : false;
        
        if (isConsecutive && this.currentJournalStreakDays > 0) {
          // Continue streak - increment by 1
          this.currentJournalStreakDays += 1;
          console.log(`📝🔥 [DEBUG] Journal streak continues! Day ${this.currentJournalStreakDays} (${requiredEntriesPerDay} entries achieved)`);
        } else {
          // Start new streak
          this.currentJournalStreakDays = 1;
          console.log(`📝✨ [DEBUG] New journal streak started! Day ${this.currentJournalStreakDays} (${requiredEntriesPerDay} entries achieved)`);
        }

        // Update tracking state for today
        this.currentJournalStreakDate = todayString;
        this.journalStreakCompletedToday = true;
        
        return 1; // First time reaching requirement today extends/starts streak
      }

      // Same day - check if already counted
      if (this.journalStreakCompletedToday) {
        console.log(`🔁 [DEBUG] Journal streak already counted today - returning 0`);
        return 0; // Already counted streak today
      }

      // First time reaching requirement today
      this.journalStreakCompletedToday = true;
      console.log(`📝✅ [DEBUG] Reached ${requiredEntriesPerDay} entries requirement - streak +1`);
      return 1;

    } catch (error) {
      console.error('MonthlyProgressTracker.calculateJournalStreakIncrement error:', error);
      // Conservative fallback - require at least 1 entry
      return direction > 0 ? 1 : 0;
    }
  }

  /**
   * Count today's journal entries for star-based requirements (synchronous)
   */
  private static countTodayJournalEntries(todayString: string): number {
    try {
      // Reset counter if date changed
      if (this.journalCountDate !== todayString) {
        console.log(`📅 [DEBUG] Journal count date changed from ${this.journalCountDate} to ${todayString} - resetting counter`);
        this.todayJournalEntriesCount = 0;
        this.journalCountDate = todayString;
      }
      
      return this.todayJournalEntriesCount;
    } catch (error) {
      console.error('MonthlyProgressTracker.countTodayJournalEntries error:', error);
      return 0; // Conservative fallback
    }
  }

  /**
   * Increment today's journal entries counter (called on each journal entry)
   */
  private static incrementTodayJournalCount(): void {
    try {
      const todayString = new Date().toISOString().split('T')[0]!;
      
      // Reset counter if date changed
      if (this.journalCountDate !== todayString) {
        this.todayJournalEntriesCount = 0;
        this.journalCountDate = todayString;
      }
      
      this.todayJournalEntriesCount += 1;
      console.log(`📝🔢 [DEBUG] Journal entries today: ${this.todayJournalEntriesCount}`);
    } catch (error) {
      console.error('MonthlyProgressTracker.incrementTodayJournalCount error:', error);
    }
  }

  /**
   * Calculate balance score for XP sources - balanced usage means no source >60% of total
   * Returns a score between 0.0-1.0 where higher values indicate better balance
   */
  private static async calculateBalanceScore(challengeId: string): Promise<number> {
    try {
      console.log(`🔍 [DEBUG] calculateBalanceScore for challenge ${challengeId}`);
      
      // Get all daily snapshots for this challenge
      const allSnapshots = await this.getAllSnapshots();
      const challengeSnapshots = allSnapshots.filter(s => s.challengeId === challengeId);
      
      if (challengeSnapshots.length === 0) {
        console.log(`🔍 [DEBUG] No snapshots found - returning default balance score 1.0`);
        return 1.0; // Perfect balance when no data yet
      }
      
      // Get all XP transactions for the entire month to analyze source balance
      const startDate = challengeSnapshots[0]?.date;
      const endDate = challengeSnapshots[challengeSnapshots.length - 1]?.date;
      
      if (!startDate || !endDate) {
        console.log(`🔍 [DEBUG] No valid date range - returning default balance score 1.0`);
        return 1.0;
      }
      
      // Get XP transactions for the date range
      const { GamificationService } = require('./gamificationService');
      const transactions = await GamificationService.getTransactionsByDateRange(startDate, endDate);
      
      if (!transactions || transactions.length === 0) {
        console.log(`🔍 [DEBUG] No XP transactions found - returning default balance score 1.0`);
        return 1.0; // Perfect balance when no XP earned yet
      }
      
      // Group XP by source category
      const xpByCategory: Record<string, number> = {
        habits: 0,
        journal: 0,
        goals: 0,
        achievements: 0,
        challenges: 0,
        other: 0
      };
      
      for (const transaction of transactions) {
        const amount = Math.abs(transaction.amount); // Use absolute value for balance calculation
        
        switch (transaction.source) {
          case 'habit_completion':
          case 'habit_bonus':
          case 'habit_streak':
            xpByCategory.habits = (xpByCategory.habits || 0) + amount;
            break;
          case 'journal_entry':
          case 'journal_bonus':
          case 'journal_milestone':
            xpByCategory.journal = (xpByCategory.journal || 0) + amount;
            break;
          case 'goal_progress':
          case 'goal_completion':
            xpByCategory.goals = (xpByCategory.goals || 0) + amount;
            break;
          case 'achievement':
            xpByCategory.achievements = (xpByCategory.achievements || 0) + amount;
            break;
          case 'monthly_challenge':
            xpByCategory.challenges = (xpByCategory.challenges || 0) + amount;
            break;
          default:
            xpByCategory.other = (xpByCategory.other || 0) + amount;
            break;
        }
      }
      
      // Calculate total XP and percentages
      const totalXP = Object.values(xpByCategory).reduce((sum, amount) => sum + amount, 0);
      
      if (totalXP === 0) {
        console.log(`🔍 [DEBUG] Total XP is 0 - returning default balance score 1.0`);
        return 1.0; // Perfect balance when no XP earned
      }
      
      // Find the highest percentage from any single source
      let maxSourcePercentage = 0;
      for (const [category, amount] of Object.entries(xpByCategory)) {
        const percentage = amount / totalXP;
        if (percentage > maxSourcePercentage) {
          maxSourcePercentage = percentage;
        }
        console.log(`🔍 [DEBUG] ${category}: ${amount} XP (${(percentage * 100).toFixed(1)}%)`);
      }
      
      // Calculate balance score based on how far the max source is from ideal 60% threshold
      // Perfect balance (1.0) when max source ≤ 50%
      // Good balance (0.75+) when max source ≤ 60%  
      // Declining balance as max source approaches 100%
      let balanceScore: number;
      
      if (maxSourcePercentage <= 0.50) {
        balanceScore = 1.0; // Perfect balance
      } else if (maxSourcePercentage <= 0.60) {
        // Linear decline from 1.0 to 0.75 between 50%-60%
        balanceScore = 1.0 - (maxSourcePercentage - 0.50) * 2.5; // 0.10 range = 0.25 score range
      } else {
        // Steeper decline from 0.75 to 0.0 between 60%-100%
        balanceScore = 0.75 - (maxSourcePercentage - 0.60) * 1.875; // 0.40 range = 0.75 score range
      }
      
      // Ensure score stays within bounds
      balanceScore = Math.max(0.0, Math.min(1.0, balanceScore));
      
      console.log(`🔍 [DEBUG] Max source: ${(maxSourcePercentage * 100).toFixed(1)}%, Balance score: ${balanceScore.toFixed(3)}`);
      
      return Math.round(balanceScore * 1000) / 1000; // Round to 3 decimal places
      
    } catch (error) {
      console.error('MonthlyProgressTracker.calculateBalanceScore error:', error);
      return 0.6; // Fallback to baseline balance score
    }
  }

  /**
   * Check if two dates are consecutive (today follows yesterday)
   */
  private static isConsecutiveDay(previousDateString: string, currentDateString: string): boolean {
    try {
      if (!previousDateString) return false; // No previous date = not consecutive

      const previousDate = new Date(previousDateString);
      const currentDate = new Date(currentDateString);
      
      // Add 1 day to previous date
      const expectedNextDate = new Date(previousDate);
      expectedNextDate.setDate(expectedNextDate.getDate() + 1);
      
      // Check if current date matches expected next date
      return currentDate.toDateString() === expectedNextDate.toDateString();
      
    } catch (error) {
      console.error('MonthlyProgressTracker.isConsecutiveDay error:', error);
      return false; // Conservative fallback
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

      // Check for daily minimums (1+ habits, 3+ journal entries) - goals optional for perfect day
      const habitCount = dailyTransactions.filter(t => t.source === XPSourceType.HABIT_COMPLETION).length;
      const journalCount = dailyTransactions.filter(t => t.source === XPSourceType.JOURNAL_ENTRY).length;
      const goalProgressCount = dailyTransactions.filter(t => t.source === XPSourceType.GOAL_PROGRESS).length;

      const metDailyMinimums = habitCount >= 1 && journalCount >= 3; // Goals are optional for perfect day

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
   * Calculate total XP earned on a specific date from all transactions
   */
  private static async calculateTotalXPForDate(dateString: DateString): Promise<number> {
    try {
      const transactions = await this.getDailyXPTransactions(dateString);
      
      // Sum all positive XP amounts for the day (ignore negative XP for total calculation)
      const totalXP = transactions
        .filter(t => t.amount > 0) // Only count positive XP
        .reduce((sum, t) => sum + t.amount, 0);
      
      console.log(`🔍 [DEBUG] Total XP for ${dateString}: ${totalXP} (from ${transactions.length} transactions)`);
      
      return totalXP;
    } catch (error) {
      console.error('MonthlyProgressTracker.calculateTotalXPForDate error:', error);
      return 0; // Fallback to 0 XP
    }
  }

  /**
   * Get daily XP transactions for analysis - fully integrated with GamificationService
   */
  private static async getDailyXPTransactions(dateString: DateString): Promise<any[]> {
    try {
      // Import GamificationService using require for Jest compatibility
      const { GamificationService } = require('./gamificationService');
      
      // Get all XP transactions for the specific date
      const transactions = await GamificationService.getTransactionsByDateRange(dateString, dateString);
      
      if (!transactions || transactions.length === 0) {
        return [];
      }
      
      // Return transactions with all necessary properties for analysis
      return transactions.map((transaction: any) => ({
        id: transaction.id,
        amount: transaction.amount,
        source: transaction.source,
        sourceId: transaction.sourceId,
        description: transaction.description,
        date: transaction.date,
        timestamp: transaction.createdAt?.getTime() || Date.now(),
        metadata: {}
      }));
    } catch (error) {
      console.error('MonthlyProgressTracker.getDailyXPTransactions error:', error);
      return [];
    }
  }

  // ========================================
  // STORAGE & PERSISTENCE HELPER METHODS
  // ========================================

  /**
   * Load all snapshots with caching for performance
   */
  private static async getAllSnapshots(): Promise<DailyProgressSnapshot[]> {
    try {
      // Check cache first
      if (this.snapshotsCache && Date.now() - this.snapshotsCache.timestamp < this.SNAPSHOTS_CACHE_TTL) {
        return this.snapshotsCache.data;
      }

      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        // Get snapshots for all active challenges
        const challenges = await this.storage.getActiveChallenges();
        const allSnapshots: DailyProgressSnapshot[] = [];
        for (const challenge of challenges) {
          const snapshots = await this.storage.getDailySnapshots(challenge.id);
          allSnapshots.push(...snapshots);
        }

        // Update cache
        this.snapshotsCache = {
          data: allSnapshots,
          timestamp: Date.now()
        };

        return allSnapshots;
      }

      // Fallback to AsyncStorage
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.DAILY_SNAPSHOTS);
      const allSnapshots: DailyProgressSnapshot[] = stored ? JSON.parse(stored) : [];

      // Update cache
      this.snapshotsCache = {
        data: allSnapshots,
        timestamp: Date.now()
      };

      return allSnapshots;
    } catch (error) {
      console.error('MonthlyProgressTracker.getAllSnapshots error:', error);
      return [];
    }
  }

  /**
   * Get daily snapshot from storage (from centralized array with caching)
   */
  private static async getDailySnapshot(challengeId: string, date: DateString): Promise<DailyProgressSnapshot | null> {
    try {
      const allSnapshots = await this.getAllSnapshots();
      
      // Find specific snapshot
      const snapshot = allSnapshots.find(s => 
        s.challengeId === challengeId && s.date === date
      );
      
      return snapshot || null;
    } catch (error) {
      console.error('MonthlyProgressTracker.getDailySnapshot error:', error);
      return null;
    }
  }

  /**
   * Save daily snapshot to storage (centralized array strategy with cache invalidation)
   */
  private static async saveDailySnapshot(snapshot: DailyProgressSnapshot): Promise<void> {
    try {
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        await this.storage.saveDailySnapshot(snapshot);
        // CRITICAL: Invalidate cache after write
        this.snapshotsCache = null;
        return;
      }

      // Fallback to AsyncStorage
      const allSnapshots = await this.getAllSnapshots();

      // Find and update existing snapshot or add new one
      const existingIndex = allSnapshots.findIndex(s =>
        s.challengeId === snapshot.challengeId && s.date === snapshot.date
      );

      if (existingIndex >= 0) {
        // Update existing snapshot
        allSnapshots[existingIndex] = snapshot;
      } else {
        // Add new snapshot
        allSnapshots.push(snapshot);
      }

      // Save all snapshots back to storage
      await AsyncStorage.setItem(this.STORAGE_KEYS.DAILY_SNAPSHOTS, JSON.stringify(allSnapshots));

      // CRITICAL: Invalidate cache after write to ensure consistency
      this.snapshotsCache = null;
      
    } catch (error) {
      console.error('MonthlyProgressTracker.saveDailySnapshot error:', error);
      throw error;
    }
  }

  // ========================================
  // INTEGRATION METHODS - FULLY IMPLEMENTED
  // ========================================

  /**
   * Get requirements for a challenge - fully integrated with MonthlyChallengeService
   */
  private static async getRequirementsForChallenge(challengeId: string): Promise<MonthlyChallengeRequirement[]> {
    try {
      // Get the challenge object which contains requirements
      const challenge = await this.getChallengeById(challengeId);
      
      if (!challenge) {
        console.warn(`Challenge ${challengeId} not found, cannot retrieve requirements`);
        return [];
      }
      
      // Return the requirements array from the challenge
      return challenge.requirements || [];
    } catch (error) {
      console.error('MonthlyProgressTracker.getRequirementsForChallenge error:', error);
      return [];
    }
  }

  /**
   * Get challenge by ID - fully integrated with MonthlyChallengeService
   */
  private static async getChallengeById(challengeId: string): Promise<MonthlyChallenge | null> {
    try {
      // Import MonthlyChallengeService using require for Jest compatibility
      const { MonthlyChallengeService } = require('./monthlyChallengeService');
      
      // First try to get current challenge
      const currentChallenge = await MonthlyChallengeService.getCurrentChallenge();
      if (currentChallenge && currentChallenge.id === challengeId) {
        return currentChallenge;
      }
      
      // If not current challenge, search through recent challenges
      // Extract month from challengeId if possible or use current month
      const currentMonth = today().substring(0, 7); // YYYY-MM
      const challengeForMonth = await MonthlyChallengeService.getChallengeForMonth(currentMonth);
      
      if (challengeForMonth && challengeForMonth.id === challengeId) {
        return challengeForMonth;
      }
      
      // Try previous month as fallback
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthString = formatDateToString(lastMonth).substring(0, 7);
      const lastMonthChallenge = await MonthlyChallengeService.getChallengeForMonth(lastMonthString);
      
      if (lastMonthChallenge && lastMonthChallenge.id === challengeId) {
        return lastMonthChallenge;
      }
      
      console.warn(`Challenge with ID ${challengeId} not found`);
      return null;
    } catch (error) {
      console.error('MonthlyProgressTracker.getChallengeById error:', error);
      return null;
    }
  }

  /**
   * Weekly breakdown operations - fully implemented
   */
  
  /**
   * Get weekly breakdown data from storage
   */
  private static async getWeeklyBreakdown(challengeId: string, weekNumber: number): Promise<WeeklyBreakdown | null> {
    try {
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        const breakdowns = await this.storage.getWeeklyBreakdowns(challengeId);
        return breakdowns.find(b => b.weekNumber === weekNumber) || null;
      }

      // Fallback to AsyncStorage
      const key = `${this.STORAGE_KEYS.WEEKLY_BREAKDOWN}_${challengeId}_week${weekNumber}`;
      const stored = await AsyncStorage.getItem(key);

      if (!stored) return null;

      return JSON.parse(stored) as WeeklyBreakdown;
    } catch (error) {
      console.error('MonthlyProgressTracker.getWeeklyBreakdown error:', error);
      return null;
    }
  }
  
  /**
   * Initialize weekly breakdown for a new week
   */
  private static async initializeWeeklyBreakdown(challengeId: string, weekNumber: number): Promise<WeeklyBreakdown> {
    try {
      const challenge = await this.getChallengeById(challengeId);
      if (!challenge) {
        throw new Error(`Challenge ${challengeId} not found for weekly breakdown initialization`);
      }
      
      // Calculate week date range
      const startDate = parseDate(challenge.startDate);
      const weekStartDay = (weekNumber - 1) * 7 + 1;
      const weekStart = addDays(startDate, weekStartDay - 1) as Date;
      const weekEnd = addDays(weekStart, 6) as Date;
      
      // Initialize empty weekly breakdown
      const breakdown: WeeklyBreakdown = {
        challengeId,
        weekNumber: weekNumber as 1 | 2 | 3 | 4 | 5,
        startDate: formatDateToString(weekStart),
        endDate: formatDateToString(weekEnd),
        weeklyProgress: {},
        weeklyTarget: {},
        completionPercentage: 0,
        daysActive: 0,
        perfectDays: 0,
        bestDay: null,
        isCurrentWeek: this.calculateWeekNumber(new Date()) === weekNumber,
        isCompleted: false
      };
      
      // Initialize progress tracking for each requirement
      for (const requirement of challenge.requirements) {
        breakdown.weeklyProgress[requirement.trackingKey] = 0;
        breakdown.weeklyTarget[requirement.trackingKey] = Math.ceil(requirement.target / 4); // Rough weekly target
      }
      
      // Note: Don't save here - let updateWeeklyBreakdown save after updating progress
      return breakdown;
    } catch (error) {
      console.error('MonthlyProgressTracker.initializeWeeklyBreakdown error:', error);
      throw error;
    }
  }
  
  /**
   * Get all daily snapshots for a specific week (optimized - single array load)
   */
  private static async getWeeklySnapshots(challengeId: string, weekNumber: number): Promise<DailyProgressSnapshot[]> {
    try {
      const challenge = await this.getChallengeById(challengeId);
      if (!challenge) return [];
      
      // Calculate week date range
      const startDate = parseDate(challenge.startDate);
      const weekStartDay = (weekNumber - 1) * 7 + 1;
      const weekStart = addDays(startDate, weekStartDay - 1) as Date;
      const weekEnd = addDays(weekStart, 6) as Date;
      
      // Load ALL snapshots ONCE (using cached method for better performance)
      const allSnapshots = await this.getAllSnapshots();
      
      // Filter snapshots for this challenge and week
      const weekSnapshots = allSnapshots.filter(snapshot => {
        if (snapshot.challengeId !== challengeId || snapshot.weekNumber !== weekNumber) {
          return false;
        }
        
        // Double-check date is within week range
        const snapshotDate = parseDate(snapshot.date);
        return snapshotDate >= weekStart && snapshotDate <= weekEnd;
      });
      
      return weekSnapshots.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('MonthlyProgressTracker.getWeeklySnapshots error:', error);
      return [];
    }
  }
  
  /**
   * Calculate weekly completion percentage based on weekly targets
   */
  private static calculateWeeklyCompletionPercentage(breakdown: WeeklyBreakdown): number {
    try {
      if (Object.keys(breakdown.weeklyTarget).length === 0) return 0;
      
      let totalWeight = 0;
      let completedWeight = 0;
      
      for (const [trackingKey, target] of Object.entries(breakdown.weeklyTarget)) {
        const progress = breakdown.weeklyProgress[trackingKey] || 0;
        const completionRatio = Math.min(progress / target, 1);
        
        totalWeight += 1;
        completedWeight += completionRatio;
      }
      
      return Math.round((completedWeight / totalWeight) * 100);
    } catch (error) {
      console.error('MonthlyProgressTracker.calculateWeeklyCompletionPercentage error:', error);
      return 0;
    }
  }
  
  /**
   * Calculate weekly consistency across all weeks
   */
  private static async calculateWeeklyConsistency(challengeId: string): Promise<number> {
    try {
      const challenge = await this.getChallengeById(challengeId);
      if (!challenge) return 0;
      
      // Get number of weeks in the month
      const totalWeeks = this.isMonthWith31Days(challenge.startDate) ? 5 : 4;
      let consistentWeeks = 0;
      
      // Check each week for consistency (>50% completion)
      for (let week = 1; week <= totalWeeks; week++) {
        const breakdown = await this.getWeeklyBreakdown(challengeId, week);
        if (breakdown && breakdown.completionPercentage >= 50) {
          consistentWeeks++;
        }
      }
      
      return Math.round((consistentWeeks / totalWeeks) * 100) / 100;
    } catch (error) {
      console.error('MonthlyProgressTracker.calculateWeeklyConsistency error:', error);
      return 0;
    }
  }
  
  /**
   * Get best week performance from progress data
   */
  private static getBestWeekPerformance(progress: MonthlyChallengeProgress): number {
    try {
      const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'] as const;
      let bestPerformance = 0;
      
      for (const weekKey of weeks) {
        const weekData = progress.weeklyProgress[weekKey];
        if (weekData && Object.keys(weekData).length > 0) {
          // Calculate week performance based on progress values
          const weekTotal = Object.values(weekData).reduce((sum, val) => sum + val, 0);
          if (weekTotal > bestPerformance) {
            bestPerformance = weekTotal;
          }
        }
      }
      
      return bestPerformance;
    } catch (error) {
      console.error('MonthlyProgressTracker.getBestWeekPerformance error:', error);
      return 0;
    }
  }
  
  /**
   * Save weekly breakdown to storage
   */
  private static async saveWeeklyBreakdown(breakdown: WeeklyBreakdown): Promise<void> {
    try {
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        await this.storage.saveWeeklyBreakdown(breakdown.challengeId, breakdown);
        return;
      }

      // Fallback to AsyncStorage
      const key = `${this.STORAGE_KEYS.WEEKLY_BREAKDOWN}_${breakdown.challengeId}_week${breakdown.weekNumber}`;
      await AsyncStorage.setItem(key, JSON.stringify(breakdown));
    } catch (error) {
      console.error('MonthlyProgressTracker.saveWeeklyBreakdown error:', error);
      throw error;
    }
  }
  
  /**
   * Update challenge streak data
   */
  private static async updateChallengeStreak(challengeId: string, completed: boolean): Promise<void> {
    try {
      const challenge = await this.getChallengeById(challengeId);
      if (!challenge) return;
      
      // Update monthly streak through GamificationService
      await GamificationService.updateMonthlyStreak(
        challenge.category,
        completed,
        challenge.starLevel
      );
      
      console.log(`📈 Challenge streak updated: ${challengeId}, completed: ${completed}`);
    } catch (error) {
      console.error('MonthlyProgressTracker.updateChallengeStreak error:', error);
      // Don't throw - streak updates are not critical for core functionality
    }
  }
  
  /**
   * Archive completed challenge for historical reference
   */
  private static async archiveCompletedChallenge(
    challenge: MonthlyChallenge, 
    progress: MonthlyChallengeProgress
  ): Promise<void> {
    try {
      const archiveData = {
        challenge,
        progress,
        archivedAt: new Date(),
        completionStatus: 'completed',
        finalStats: {
          completionPercentage: progress.completionPercentage,
          daysActive: progress.daysActive,
          xpEarned: progress.xpEarned,
          streakAtCompletion: progress.currentStreak,
          weeklyConsistency: progress.weeklyConsistency
        }
      };
      
      // Save to archive storage
      const archiveKey = `monthly_challenge_archive_${challenge.id}`;
      await AsyncStorage.setItem(archiveKey, JSON.stringify(archiveData));
      
      // Import MonthlyChallengeService using require for Jest compatibility
      const { MonthlyChallengeService } = require('./monthlyChallengeService');
      await MonthlyChallengeService.archiveCompletedChallenge(challenge.id);
      
      console.log(`🗃️ Challenge archived: ${challenge.title}`);
    } catch (error) {
      console.error('MonthlyProgressTracker.archiveCompletedChallenge error:', error);
      // Don't throw - archival is not critical for core functionality
    }
  }
}