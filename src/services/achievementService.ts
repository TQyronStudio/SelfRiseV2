// Achievement Detection Engine - Sub-checkpoint 4.5.4.C
// Comprehensive system for detecting, unlocking, and managing achievements

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import {
  Achievement,
  AchievementCondition,
  AchievementEvaluationResult,
  UserAchievements,
  AchievementUnlockEvent,
  AchievementProgressHistory,
  ConditionChecker,
  GamificationStats,
  XPSourceType,
  BatchEvaluationOptions,
  AchievementCategory,
  AchievementRarity
} from '../types/gamification';
import { CORE_ACHIEVEMENTS } from '../constants/achievementCatalog';
import { ACHIEVEMENT_EVALUATION, ACHIEVEMENT_XP_REWARDS } from '../constants/achievements';
import { GamificationService } from './gamificationService';
import { DateString } from '../types/common';
import { today, formatDateToString } from '../utils/date';

// Storage keys for achievement data
const ACHIEVEMENT_STORAGE_KEYS = {
  USER_ACHIEVEMENTS: 'achievements_user_data',
  PROGRESS_HISTORY: 'achievements_progress_history',
  UNLOCK_EVENTS: 'achievements_unlock_events',
  LAST_BATCH_CHECK: 'achievements_last_batch_check',
  STATISTICS_CACHE: 'achievements_statistics_cache',
} as const;

// Achievement unlock result
export interface AchievementUnlockResult {
  unlocked: Achievement[];
  progress: AchievementEvaluationResult[];
  xpAwarded: number;
  leveledUp: boolean;
  newLevel?: number;
}

/**
 * Achievement Detection Engine
 * Handles all achievement-related operations: detection, unlocking, progress tracking
 */
export class AchievementService {

  // ========================================
  // CONDITION CHECKING SYSTEM
  // ========================================

  /**
   * Core condition evaluation function
   * Evaluates a single achievement condition against user statistics and data
   */
  static evaluateCondition: ConditionChecker = async (
    condition: AchievementCondition,
    userStats: GamificationStats,
    additionalData?: Record<string, any>
  ) => {
    try {
      let currentValue = 0;
      let targetValue = condition.target;

      // Get current value based on condition type and source
      switch (condition.type) {
        case 'count':
          currentValue = await this.getCountValue(condition.source, condition.timeframe, additionalData);
          break;
          
        case 'streak':
          currentValue = await this.getStreakValue(condition.source, condition.timeframe, additionalData);
          break;
          
        case 'value':
          currentValue = await this.getValueMetric(condition.source, condition.timeframe, additionalData);
          break;
          
        case 'level':
          currentValue = userStats.currentLevel;
          break;
          
        case 'time':
          currentValue = await this.getTimeValue(condition.source, condition.timeframe, additionalData);
          break;
          
        case 'percentage':
          currentValue = await this.getPercentageValue(condition.source, condition.timeframe, additionalData);
          break;
          
        case 'combination':
          return await this.evaluateCombinationCondition(condition, userStats, additionalData);
          
        default:
          console.warn(`Unknown condition type: ${condition.type}`);
          return { isMet: false, currentValue: 0, progress: 0 };
      }

      // Apply comparison operator
      const isMet = this.applyOperator(currentValue, targetValue, condition.operator);
      
      // Calculate progress percentage (0-100)
      const progress = Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
      
      // Determine next milestone for progressive achievements
      const result: { isMet: boolean; currentValue: number; progress: number; nextMilestone?: number } = {
        isMet,
        currentValue,
        progress
      };
      
      if (!isMet) {
        result.nextMilestone = targetValue;
      }

      return result;

    } catch (error) {
      console.error('AchievementService.evaluateCondition error:', error);
      return { isMet: false, currentValue: 0, progress: 0 };
    }
  };

  /**
   * Apply comparison operator to current and target values
   */
  private static applyOperator(current: number, target: number, operator: string): boolean {
    switch (operator) {
      case 'gte': return current >= target;
      case 'lte': return current <= target;
      case 'eq': return current === target;
      case 'gt': return current > target;
      case 'lt': return current < target;
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Evaluate combination condition (multiple conditions must be met)
   */
  private static async evaluateCombinationCondition(
    condition: AchievementCondition,
    userStats: GamificationStats,
    additionalData?: Record<string, any>
  ): Promise<{ isMet: boolean; currentValue: number; progress: number; nextMilestone?: number }> {
    try {
      if (!condition.additionalConditions || condition.additionalConditions.length === 0) {
        return { isMet: false, currentValue: 0, progress: 0 };
      }

      let totalConditions = condition.additionalConditions.length;
      let metConditions = 0;
      let totalProgress = 0;

      // Evaluate each sub-condition
      for (const subCondition of condition.additionalConditions) {
        const result = await this.evaluateCondition(subCondition, userStats, additionalData);
        if (result.isMet) {
          metConditions++;
        }
        totalProgress += result.progress;
      }

      const averageProgress = totalProgress / totalConditions;
      const allMet = metConditions === totalConditions;

      const result: { isMet: boolean; currentValue: number; progress: number; nextMilestone?: number } = {
        isMet: allMet,
        currentValue: metConditions,
        progress: allMet ? 100 : averageProgress
      };
      
      if (!allMet) {
        result.nextMilestone = totalConditions;
      }
      
      return result;

    } catch (error) {
      console.error('AchievementService.evaluateCombinationCondition error:', error);
      return { isMet: false, currentValue: 0, progress: 0 };
    }
  }

  // ========================================
  // VALUE EXTRACTION METHODS
  // ========================================

  /**
   * Get count value for achievement condition
   */
  private static async getCountValue(
    source: XPSourceType | string,
    timeframe?: string,
    additionalData?: Record<string, any>
  ): Promise<number> {
    try {
      // Handle XP source types
      if (Object.values(XPSourceType).includes(source as XPSourceType)) {
        const xpSource = source as XPSourceType;
        const transactions = await GamificationService.getAllTransactions();
        
        // Filter by timeframe if specified
        const filteredTransactions = this.filterTransactionsByTimeframe(transactions, timeframe);
        
        // Count transactions from this source
        return filteredTransactions.filter(t => t.source === xpSource && t.amount > 0).length;
      }

      // Handle custom sources using integration layer
      const { AchievementIntegration } = await import('./achievementIntegration');
      return await AchievementIntegration.getCountValueForAchievement(source, timeframe);
    } catch (error) {
      console.error('AchievementService.getCountValue error:', error);
      return 0;
    }
  }

  /**
   * Get streak value for achievement condition
   */
  private static async getStreakValue(
    source: XPSourceType | string,
    timeframe?: string,
    additionalData?: Record<string, any>
  ): Promise<number> {
    try {
      if (source === XPSourceType.DAILY_LAUNCH) {
        const stats = await GamificationService.getGamificationStats();
        return stats.currentStreak;
      }

      // Handle custom sources using integration layer
      const { AchievementIntegration } = await import('./achievementIntegration');
      return await AchievementIntegration.getStreakValueForAchievement(source, timeframe);
    } catch (error) {
      console.error('AchievementService.getStreakValue error:', error);
      return 0;
    }
  }

  /**
   * Get value metric for achievement condition
   */
  private static async getValueMetric(
    source: XPSourceType | string,
    timeframe?: string,
    additionalData?: Record<string, any>
  ): Promise<number> {
    try {
      switch (source) {
        case 'journal_entry_length':
          {
            const { AchievementIntegration } = await import('./achievementIntegration');
            return await AchievementIntegration.getMaxJournalEntryLength(timeframe);
          }
        case 'goal_target_value':
          {
            const { AchievementIntegration } = await import('./achievementIntegration');
            return await AchievementIntegration.getMaxGoalTargetValue(timeframe);
          }
        default:
          return await this.getCountValue(source, timeframe, additionalData);
      }
    } catch (error) {
      console.error('AchievementService.getValueMetric error:', error);
      return 0;
    }
  }

  /**
   * Get time-based value for achievement condition
   */
  private static async getTimeValue(
    source: XPSourceType | string,
    timeframe?: string,
    additionalData?: Record<string, any>
  ): Promise<number> {
    try {
      // Implementation for time-based achievements
      // Could be days since first app use, consecutive activity days, etc.
      return 0; // Placeholder
    } catch (error) {
      console.error('AchievementService.getTimeValue error:', error);
      return 0;
    }
  }

  /**
   * Get percentage value for achievement condition
   */
  private static async getPercentageValue(
    source: XPSourceType | string,
    timeframe?: string,
    additionalData?: Record<string, any>
  ): Promise<number> {
    try {
      // Implementation for percentage-based achievements
      // Could be goal completion percentage, habit success rate, etc.
      return 0; // Placeholder
    } catch (error) {
      console.error('AchievementService.getPercentageValue error:', error);
      return 0;
    }
  }

  // Custom source implementations moved to AchievementIntegration class

  // ========================================
  // REAL-TIME ACHIEVEMENT MONITORING
  // ========================================

  /**
   * Check achievements triggered by XP actions
   * This method is called automatically after XP is added
   */
  static async checkAchievementsAfterXPAction(
    xpSource: XPSourceType,
    amount: number,
    sourceId?: string,
    metadata?: Record<string, any>
  ): Promise<AchievementUnlockResult> {
    try {
      console.log(`🔍 Checking achievements after XP action: ${xpSource} (+${amount} XP)`);
      
      // Get relevant achievements for this XP source
      const relevantAchievements = this.getRelevantAchievements(xpSource);
      
      if (relevantAchievements.length === 0) {
        return { unlocked: [], progress: [], xpAwarded: 0, leveledUp: false };
      }

      // Get current user achievements and stats
      const userAchievements = await this.getUserAchievements();
      const userStats = await GamificationService.getGamificationStats();
      
      // Filter out already unlocked achievements
      const lockedAchievements = relevantAchievements.filter(
        achievement => !userAchievements.unlockedAchievements.includes(achievement.id)
      );

      if (lockedAchievements.length === 0) {
        return { unlocked: [], progress: [], xpAwarded: 0, leveledUp: false };
      }

      // Evaluate each locked achievement
      const evaluationResults: AchievementEvaluationResult[] = [];
      const newlyUnlocked: Achievement[] = [];
      let totalXPAwarded = 0;

      for (const achievement of lockedAchievements) {
        const conditionResult = await this.evaluateCondition(
          achievement.condition,
          userStats,
          { xpSource, amount, sourceId, ...metadata }
        );

        const evaluationResult: AchievementEvaluationResult = {
          achievementId: achievement.id,
          isMet: conditionResult.isMet,
          currentProgress: conditionResult.progress,
          previousProgress: userAchievements.achievementProgress[achievement.id] || 0,
          isNewlyUnlocked: conditionResult.isMet,
          progressDelta: conditionResult.progress - (userAchievements.achievementProgress[achievement.id] || 0),
          evaluatedAt: new Date(),
          ...(conditionResult.nextMilestone !== undefined ? { nextMilestone: conditionResult.nextMilestone } : {})
        };

        evaluationResults.push(evaluationResult);

        // If achievement is newly unlocked
        if (conditionResult.isMet) {
          newlyUnlocked.push(achievement);
          totalXPAwarded += achievement.xpReward;
          
          // Store unlock event
          await this.storeUnlockEvent(achievement, xpSource, evaluationResult);
          
          console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.xpReward} XP)`);
        } else if (evaluationResult.progressDelta > 0) {
          // Store progress update
          await this.storeProgressUpdate(achievement.id, conditionResult.progress, xpSource);
        }
      }

      // Update user achievements
      if (newlyUnlocked.length > 0 || evaluationResults.some(r => r.progressDelta > 0)) {
        await this.updateUserAchievements(newlyUnlocked, evaluationResults);
      }

      // Award XP for unlocked achievements
      let leveledUp = false;
      let newLevel: number | undefined;
      
      if (totalXPAwarded > 0) {
        const xpResult = await GamificationService.addXP(totalXPAwarded, {
          source: XPSourceType.ACHIEVEMENT_UNLOCK,
          description: `Unlocked ${newlyUnlocked.length} achievement(s)`,
          skipNotification: true // We'll handle notifications separately
        });
        
        leveledUp = xpResult.leveledUp;
        newLevel = xpResult.newLevel;
      }

      // Trigger achievement unlock notifications
      if (newlyUnlocked.length > 0) {
        this.triggerAchievementNotifications(newlyUnlocked, totalXPAwarded, leveledUp, newLevel);
      }

      const result: AchievementUnlockResult = {
        unlocked: newlyUnlocked,
        progress: evaluationResults,
        xpAwarded: totalXPAwarded,
        leveledUp
      };
      
      if (newLevel !== undefined) {
        result.newLevel = newLevel;
      }
      
      return result;

    } catch (error) {
      console.error('AchievementService.checkAchievementsAfterXPAction error:', error);
      return { unlocked: [], progress: [], xpAwarded: 0, leveledUp: false };
    }
  }

  /**
   * Get achievements that might be triggered by specific XP source
   */
  private static getRelevantAchievements(xpSource: XPSourceType): Achievement[] {
    return CORE_ACHIEVEMENTS.filter(achievement => {
      // Check if achievement's condition source matches or is related to XP source
      if (achievement.condition.source === xpSource) {
        return true;
      }
      
      // Check additional conditions for combination achievements
      if (achievement.condition.additionalConditions) {
        return achievement.condition.additionalConditions.some(
          condition => condition.source === xpSource
        );
      }
      
      // Check category-based relevance
      switch (xpSource) {
        case XPSourceType.HABIT_COMPLETION:
        case XPSourceType.HABIT_BONUS:
        case XPSourceType.HABIT_STREAK_MILESTONE:
          return achievement.category === 'habits' || achievement.category === 'consistency';
          
        case XPSourceType.JOURNAL_ENTRY:
        case XPSourceType.JOURNAL_BONUS:
        case XPSourceType.JOURNAL_STREAK_MILESTONE:
          return achievement.category === 'journal' || achievement.category === 'consistency';
          
        case XPSourceType.GOAL_PROGRESS:
        case XPSourceType.GOAL_COMPLETION:
        case XPSourceType.GOAL_MILESTONE:
          return achievement.category === 'goals' || achievement.category === 'consistency';
          
        default:
          return achievement.category === 'mastery' || achievement.category === 'consistency';
      }
    });
  }

  // ========================================
  // BATCH ACHIEVEMENT CHECKING
  // ========================================

  /**
   * Run batch achievement check (daily background process)
   */
  static async runBatchAchievementCheck(
    options: BatchEvaluationOptions = {}
  ): Promise<AchievementUnlockResult> {
    try {
      console.log('🔄 Running batch achievement check...');
      
      // Check if we should skip recent batch checks
      if (!options.forceUpdate && options.skipRecent) {
        const lastBatchCheck = await this.getLastBatchCheckTime();
        const timeSinceLastCheck = Date.now() - lastBatchCheck;
        
        if (timeSinceLastCheck < ACHIEVEMENT_EVALUATION.BATCH_EVALUATION_INTERVAL) {
          console.log('⏭️ Skipping batch check - too recent');
          return { unlocked: [], progress: [], xpAwarded: 0, leveledUp: false };
        }
      }

      // Get achievements to check
      let achievementsToCheck = CORE_ACHIEVEMENTS;
      
      if (options.achievementIds) {
        achievementsToCheck = CORE_ACHIEVEMENTS.filter(a => 
          options.achievementIds!.includes(a.id)
        );
      }
      
      if (options.categories) {
        achievementsToCheck = achievementsToCheck.filter(a => 
          options.categories!.includes(a.category)
        );
      }

      // Limit batch size
      const maxBatchSize = options.maxBatchSize || ACHIEVEMENT_EVALUATION.MAX_BATCH_SIZE;
      if (achievementsToCheck.length > maxBatchSize) {
        achievementsToCheck = achievementsToCheck.slice(0, maxBatchSize);
      }

      // Get current state
      const userAchievements = await this.getUserAchievements();
      const userStats = await GamificationService.getGamificationStats();
      
      // Filter out already unlocked achievements
      const lockedAchievements = achievementsToCheck.filter(
        achievement => !userAchievements.unlockedAchievements.includes(achievement.id)
      );

      // Evaluate all achievements
      const evaluationResults: AchievementEvaluationResult[] = [];
      const newlyUnlocked: Achievement[] = [];
      let totalXPAwarded = 0;

      for (const achievement of lockedAchievements) {
        const conditionResult = await this.evaluateCondition(
          achievement.condition,
          userStats
        );

        const evaluationResult: AchievementEvaluationResult = {
          achievementId: achievement.id,
          isMet: conditionResult.isMet,
          currentProgress: conditionResult.progress,
          previousProgress: userAchievements.achievementProgress[achievement.id] || 0,
          isNewlyUnlocked: conditionResult.isMet,
          progressDelta: conditionResult.progress - (userAchievements.achievementProgress[achievement.id] || 0),
          evaluatedAt: new Date(),
          ...(conditionResult.nextMilestone !== undefined ? { nextMilestone: conditionResult.nextMilestone } : {})
        };

        evaluationResults.push(evaluationResult);

        if (conditionResult.isMet) {
          newlyUnlocked.push(achievement);
          totalXPAwarded += achievement.xpReward;
          
          await this.storeUnlockEvent(achievement, 'daily_batch' as any, evaluationResult);
          console.log(`🏆 Batch unlock: ${achievement.name} (+${achievement.xpReward} XP)`);
        }
      }

      // Update user achievements
      if (newlyUnlocked.length > 0 || evaluationResults.some(r => r.progressDelta > 0)) {
        await this.updateUserAchievements(newlyUnlocked, evaluationResults);
      }

      // Award XP for unlocked achievements
      let leveledUp = false;
      let newLevel: number | undefined;
      
      if (totalXPAwarded > 0) {
        const xpResult = await GamificationService.addXP(totalXPAwarded, {
          source: XPSourceType.ACHIEVEMENT_UNLOCK,
          description: `Batch unlocked ${newlyUnlocked.length} achievement(s)`,
          skipNotification: true
        });
        
        leveledUp = xpResult.leveledUp;
        newLevel = xpResult.newLevel;
      }

      // Update last batch check time
      await this.updateLastBatchCheckTime();

      // Trigger notifications for new unlocks
      if (newlyUnlocked.length > 0) {
        this.triggerAchievementNotifications(newlyUnlocked, totalXPAwarded, leveledUp, newLevel);
      }

      console.log(`✅ Batch check complete: ${newlyUnlocked.length} unlocked, ${totalXPAwarded} XP awarded`);

      const result: AchievementUnlockResult = {
        unlocked: newlyUnlocked,
        progress: evaluationResults,
        xpAwarded: totalXPAwarded,
        leveledUp
      };
      
      if (newLevel !== undefined) {
        result.newLevel = newLevel;
      }
      
      return result;

    } catch (error) {
      console.error('AchievementService.runBatchAchievementCheck error:', error);
      return { unlocked: [], progress: [], xpAwarded: 0, leveledUp: false };
    }
  }

  // ========================================
  // UNLOCK LOGIC & DUPLICATE PREVENTION
  // ========================================

  /**
   * Store achievement unlock event with duplicate prevention
   */
  private static async storeUnlockEvent(
    achievement: Achievement,
    triggerSource: XPSourceType | string,
    evaluationResult: AchievementEvaluationResult
  ): Promise<void> {
    try {
      // Check for duplicates
      const existingEvents = await this.getUnlockEvents();
      const isDuplicate = existingEvents.some(event => 
        event.achievementId === achievement.id
      );

      if (isDuplicate) {
        console.warn(`Duplicate unlock prevented for achievement: ${achievement.id}`);
        return;
      }

      const unlockEvent: AchievementUnlockEvent = {
        achievementId: achievement.id,
        unlockedAt: new Date(),
        trigger: triggerSource as any,
        xpAwarded: achievement.xpReward,
        previousProgress: evaluationResult.previousProgress,
        finalProgress: evaluationResult.currentProgress,
        context: {
          evaluationResult,
          achievementName: achievement.name,
          achievementRarity: achievement.rarity,
          achievementCategory: achievement.category
        }
      };

      // Store unlock event
      const events = await this.getUnlockEvents();
      events.push(unlockEvent);
      
      // Keep only last 500 events for performance
      const trimmedEvents = events.slice(-500);
      
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEYS.UNLOCK_EVENTS,
        JSON.stringify(trimmedEvents)
      );

    } catch (error) {
      console.error('AchievementService.storeUnlockEvent error:', error);
    }
  }

  /**
   * Store achievement progress update
   */
  private static async storeProgressUpdate(
    achievementId: string,
    newProgress: number,
    triggerSource: XPSourceType | string
  ): Promise<void> {
    try {
      const progressHistory = await this.getProgressHistory();
      
      const progressUpdate: AchievementProgressHistory = {
        achievementId,
        progress: newProgress,
        timestamp: new Date(),
        trigger: triggerSource as any,
        context: {
          source: triggerSource,
          timestamp: Date.now()
        }
      };

      progressHistory.push(progressUpdate);
      
      // Keep only last 1000 progress updates for performance
      const trimmedHistory = progressHistory.slice(-1000);
      
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEYS.PROGRESS_HISTORY,
        JSON.stringify(trimmedHistory)
      );

    } catch (error) {
      console.error('AchievementService.storeProgressUpdate error:', error);
    }
  }

  /**
   * Update user achievements data
   */
  private static async updateUserAchievements(
    newlyUnlocked: Achievement[],
    evaluationResults: AchievementEvaluationResult[]
  ): Promise<void> {
    try {
      const userAchievements = await this.getUserAchievements();
      
      // Add newly unlocked achievements
      for (const achievement of newlyUnlocked) {
        if (!userAchievements.unlockedAchievements.includes(achievement.id)) {
          userAchievements.unlockedAchievements.push(achievement.id);
          userAchievements.totalXPFromAchievements += achievement.xpReward;
          
          // Update rarity count
          const rarity = achievement.rarity;
          userAchievements.rarityCount[rarity] = (userAchievements.rarityCount[rarity] || 0) + 1;
          
          // Update category progress
          const category = achievement.category;
          userAchievements.categoryProgress[category] = (userAchievements.categoryProgress[category] || 0) + 1;
        }
      }
      
      // Update progress for all evaluated achievements
      for (const result of evaluationResults) {
        userAchievements.achievementProgress[result.achievementId] = result.currentProgress;
      }
      
      // Update metadata
      userAchievements.lastChecked = today();
      
      // Save updated data
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEYS.USER_ACHIEVEMENTS,
        JSON.stringify(userAchievements)
      );

    } catch (error) {
      console.error('AchievementService.updateUserAchievements error:', error);
    }
  }

  // ========================================
  // NOTIFICATION SYSTEM
  // ========================================

  /**
   * Trigger achievement unlock notifications using CelebrationModal
   */
  private static triggerAchievementNotifications(
    unlockedAchievements: Achievement[],
    totalXP: number,
    leveledUp: boolean,
    newLevel?: number
  ): void {
    try {
      // Trigger achievement unlock celebration for each achievement
      for (const achievement of unlockedAchievements) {
        DeviceEventEmitter.emit('achievementUnlocked', {
          achievement,
          xpAwarded: achievement.xpReward,
          timestamp: Date.now(),
          showCelebration: true
        });
        
        console.log(`🎉 Achievement notification triggered: ${achievement.name}`);
      }
      
      // If multiple achievements unlocked, also trigger summary notification
      if (unlockedAchievements.length > 1) {
        DeviceEventEmitter.emit('multipleAchievementsUnlocked', {
          count: unlockedAchievements.length,
          totalXP,
          achievements: unlockedAchievements,
          leveledUp,
          newLevel,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.error('AchievementService.triggerAchievementNotifications error:', error);
    }
  }

  // ========================================
  // DATA MANAGEMENT & UTILITIES
  // ========================================

  /**
   * Get user achievements data
   */
  static async getUserAchievements(): Promise<UserAchievements> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.USER_ACHIEVEMENTS);
      if (!stored) {
        return this.createEmptyUserAchievements();
      }
      
      const data: UserAchievements = JSON.parse(stored);
      
      // Convert date strings back to proper format if needed
      if (typeof data.lastChecked === 'string') {
        // Already in DateString format, no conversion needed
      }
      
      return data;
    } catch (error) {
      console.error('AchievementService.getUserAchievements error:', error);
      return this.createEmptyUserAchievements();
    }
  }

  /**
   * Create empty user achievements data
   */
  private static createEmptyUserAchievements(): UserAchievements {
    return {
      unlockedAchievements: [],
      achievementProgress: {},
      lastChecked: today(),
      totalXPFromAchievements: 0,
      rarityCount: {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0
      },
      categoryProgress: {
        habits: 0,
        journal: 0,
        goals: 0,
        consistency: 0,
        mastery: 0,
        social: 0,
        special: 0
      },
      progressHistory: [],
      streakData: {}
    };
  }

  /**
   * Get unlock events history
   */
  private static async getUnlockEvents(): Promise<AchievementUnlockEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.UNLOCK_EVENTS);
      if (!stored) return [];
      
      const events = JSON.parse(stored);
      // Convert date strings back to Date objects
      return events.map((event: any) => ({
        ...event,
        unlockedAt: new Date(event.unlockedAt)
      }));
    } catch (error) {
      console.error('AchievementService.getUnlockEvents error:', error);
      return [];
    }
  }

  /**
   * Get progress history
   */
  private static async getProgressHistory(): Promise<AchievementProgressHistory[]> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.PROGRESS_HISTORY);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      // Convert date strings back to Date objects
      return history.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    } catch (error) {
      console.error('AchievementService.getProgressHistory error:', error);
      return [];
    }
  }

  /**
   * Get last batch check time
   */
  private static async getLastBatchCheckTime(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.LAST_BATCH_CHECK);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.error('AchievementService.getLastBatchCheckTime error:', error);
      return 0;
    }
  }

  /**
   * Update last batch check time
   */
  private static async updateLastBatchCheckTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEYS.LAST_BATCH_CHECK,
        Date.now().toString()
      );
    } catch (error) {
      console.error('AchievementService.updateLastBatchCheckTime error:', error);
    }
  }

  /**
   * Filter transactions by timeframe
   */
  private static filterTransactionsByTimeframe(
    transactions: any[],
    timeframe?: string
  ): any[] {
    if (!timeframe || timeframe === 'all_time') {
      return transactions;
    }
    
    const now = new Date();
    const todayStr = today();
    
    switch (timeframe) {
      case 'daily':
        return transactions.filter(t => t.date === todayStr);
        
      case 'weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekAgoStr = formatDateToString(weekAgo);
        return transactions.filter(t => t.date >= weekAgoStr);
        
      case 'monthly':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const monthAgoStr = formatDateToString(monthAgo);
        return transactions.filter(t => t.date >= monthAgoStr);
        
      default:
        return transactions;
    }
  }

  // ========================================
  // PUBLIC API METHODS
  // ========================================

  /**
   * Get achievement by ID
   */
  static getAchievementById(achievementId: string): Achievement | undefined {
    return CORE_ACHIEVEMENTS.find(a => a.id === achievementId);
  }

  /**
   * Get user's achievement statistics
   */
  static async getAchievementStats(): Promise<any> {
    try {
      const userAchievements = await this.getUserAchievements();
      const totalAchievements = CORE_ACHIEVEMENTS.length;
      
      return {
        totalAchievements,
        unlockedCount: userAchievements.unlockedAchievements.length,
        completionRate: (userAchievements.unlockedAchievements.length / totalAchievements) * 100,
        totalXPFromAchievements: userAchievements.totalXPFromAchievements,
        rarityBreakdown: userAchievements.rarityCount,
        categoryProgress: userAchievements.categoryProgress,
        lastChecked: userAchievements.lastChecked
      };
    } catch (error) {
      console.error('AchievementService.getAchievementStats error:', error);
      return {
        totalAchievements: CORE_ACHIEVEMENTS.length,
        unlockedCount: 0,
        completionRate: 0,
        totalXPFromAchievements: 0,
        rarityBreakdown: {},
        categoryProgress: {},
        lastChecked: today()
      };
    }
  }

  /**
   * Force check specific achievement
   */
  static async forceCheckAchievement(achievementId: string): Promise<AchievementUnlockResult> {
    try {
      return await this.runBatchAchievementCheck({
        achievementIds: [achievementId],
        forceUpdate: true
      });
    } catch (error) {
      console.error('AchievementService.forceCheckAchievement error:', error);
      return { unlocked: [], progress: [], xpAwarded: 0, leveledUp: false };
    }
  }

  /**
   * Reset all achievement data (for testing/development)
   */
  static async resetAllAchievementData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        ACHIEVEMENT_STORAGE_KEYS.USER_ACHIEVEMENTS,
        ACHIEVEMENT_STORAGE_KEYS.PROGRESS_HISTORY,
        ACHIEVEMENT_STORAGE_KEYS.UNLOCK_EVENTS,
        ACHIEVEMENT_STORAGE_KEYS.LAST_BATCH_CHECK,
        ACHIEVEMENT_STORAGE_KEYS.STATISTICS_CACHE,
      ]);
      console.log('🧹 All achievement data reset');
    } catch (error) {
      console.error('AchievementService.resetAllAchievementData error:', error);
    }
  }
}