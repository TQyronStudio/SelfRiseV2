// Achievement Detection Engine - Sub-checkpoint 4.5.4.C
// Comprehensive system for detecting, unlocking, and managing achievements

import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { AchievementStorage } from './achievementStorage';
import { DateString } from '../types/common';
import { today, formatDateToString } from '../utils/date';

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
  // BACKGROUND PROCESSING SYSTEM
  // ========================================
  
  private static backgroundQueue: Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    task: () => Promise<void>;
    addedAt: number;
    retries: number;
    maxRetries: number;
  }> = [];
  
  private static isBackgroundProcessing = false;
  private static backgroundProcessingInterval: NodeJS.Timeout | null = null;
  private static readonly BACKGROUND_PROCESSING_INTERVAL = 2000; // 2 seconds
  private static readonly MAX_BACKGROUND_TASKS_PER_CYCLE = 3;

  /**
   * Add task to background processing queue
   */
  private static addToBackgroundQueue(
    id: string,
    task: () => Promise<void>,
    priority: 'high' | 'medium' | 'low' = 'medium',
    maxRetries = 3
  ): void {
    // Remove existing task with same ID if exists
    this.backgroundQueue = this.backgroundQueue.filter(item => item.id !== id);
    
    // Add new task
    this.backgroundQueue.push({
      id,
      priority,
      task,
      addedAt: Date.now(),
      retries: 0,
      maxRetries,
    });
    
    // Sort by priority (high -> medium -> low) and then by age
    this.backgroundQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.addedAt - b.addedAt; // Older tasks first
    });
    
    // Start background processing if not already running
    this.startBackgroundProcessing();
    
    console.log(`📋 Added task to background queue: ${id} (priority: ${priority}, queue size: ${this.backgroundQueue.length})`);
  }

  /**
   * Start background processing loop
   */
  private static startBackgroundProcessing(): void {
    if (this.isBackgroundProcessing) return;
    
    this.isBackgroundProcessing = true;
    this.backgroundProcessingInterval = setInterval(async () => {
      await this.processBackgroundQueue();
    }, this.BACKGROUND_PROCESSING_INTERVAL) as unknown as NodeJS.Timeout;
    
    console.log('🔄 Started background processing loop');
  }

  /**
   * Process background queue
   */
  private static async processBackgroundQueue(): Promise<void> {
    if (this.backgroundQueue.length === 0) {
      this.stopBackgroundProcessing();
      return;
    }

    const tasksToProcess = this.backgroundQueue.splice(0, this.MAX_BACKGROUND_TASKS_PER_CYCLE);
    const failedTasks: typeof tasksToProcess = [];

    for (const taskItem of tasksToProcess) {
      try {
        await taskItem.task();
        console.log(`✅ Background task completed: ${taskItem.id}`);
      } catch (error) {
        console.error(`❌ Background task failed: ${taskItem.id}`, error);
        
        // Retry if under max retries
        if (taskItem.retries < taskItem.maxRetries) {
          taskItem.retries++;
          failedTasks.push(taskItem);
          console.log(`🔄 Retrying background task: ${taskItem.id} (attempt ${taskItem.retries}/${taskItem.maxRetries})`);
        } else {
          console.error(`💀 Background task exceeded max retries: ${taskItem.id}`);
        }
      }
    }

    // Re-add failed tasks for retry
    this.backgroundQueue.unshift(...failedTasks);
  }

  /**
   * Stop background processing loop
   */
  private static stopBackgroundProcessing(): void {
    if (!this.isBackgroundProcessing) return;
    
    this.isBackgroundProcessing = false;
    if (this.backgroundProcessingInterval) {
      clearInterval(this.backgroundProcessingInterval);
      this.backgroundProcessingInterval = null;
    }
    
    console.log('⏸️ Stopped background processing loop');
  }

  /**
   * Get background queue status for debugging
   */
  static getBackgroundQueueStatus(): {
    queueSize: number;
    isProcessing: boolean;
    highPriorityTasks: number;
    mediumPriorityTasks: number;
    lowPriorityTasks: number;
  } {
    const tasksByPriority = {
      high: this.backgroundQueue.filter(t => t.priority === 'high').length,
      medium: this.backgroundQueue.filter(t => t.priority === 'medium').length,
      low: this.backgroundQueue.filter(t => t.priority === 'low').length,
    };

    return {
      queueSize: this.backgroundQueue.length,
      isProcessing: this.isBackgroundProcessing,
      highPriorityTasks: tasksByPriority.high,
      mediumPriorityTasks: tasksByPriority.medium,
      lowPriorityTasks: tasksByPriority.low,
    };
  }

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
      
      // Split achievements into critical (check immediately) and non-critical (background)
      const { criticalAchievements, nonCriticalAchievements } = this.categorizeAchievementsByPriority(relevantAchievements);
      
      console.log(`🎯 Split achievements: ${criticalAchievements.length} critical, ${nonCriticalAchievements.length} non-critical`);
      
      // Schedule non-critical achievements for background processing
      if (nonCriticalAchievements.length > 0) {
        this.scheduleBackgroundAchievementCheck(nonCriticalAchievements, xpSource, amount, sourceId, metadata);
      }
      
      // Process only critical achievements immediately
      const achievementsToCheckNow = criticalAchievements;

      // Get current user achievements and stats
      const userAchievements = await AchievementStorage.getUserAchievements();
      const userStats = await GamificationService.getGamificationStats();
      
      // Filter out already unlocked achievements (only for critical achievements)
      const lockedAchievements = achievementsToCheckNow.filter(
        achievement => !userAchievements.unlockedAchievements.includes(achievement.id)
      );

      if (lockedAchievements.length === 0) {
        console.log('🔄 No critical achievements to process immediately');
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
          await AchievementStorage.storeUnlockEvent(
            achievement.id,
            achievement,
            xpSource,
            { 
              evaluationResult,
              xpSource,
              amount,
              sourceId,
              ...metadata 
            }
          );
          
          console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.xpReward} XP)`);
        } else if (evaluationResult.progressDelta > 0) {
          // Store progress update
          await AchievementStorage.storeProgressUpdate(
            achievement.id,
            conditionResult.progress,
            xpSource,
            {
              xpSource,
              amount,
              sourceId,
              ...metadata
            }
          );
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
   * Categorize achievements by processing priority
   */
  private static categorizeAchievementsByPriority(achievements: Achievement[]): {
    criticalAchievements: Achievement[];
    nonCriticalAchievements: Achievement[];
  } {
    const criticalAchievements: Achievement[] = [];
    const nonCriticalAchievements: Achievement[] = [];

    for (const achievement of achievements) {
      // Critical achievements (must be checked immediately for UI feedback)
      if (this.isCriticalAchievement(achievement)) {
        criticalAchievements.push(achievement);
      } else {
        nonCriticalAchievements.push(achievement);
      }
    }

    return { criticalAchievements, nonCriticalAchievements };
  }

  /**
   * Determine if achievement is critical (needs immediate checking)
   */
  private static isCriticalAchievement(achievement: Achievement): boolean {
    // Level-based achievements are critical (immediate UI feedback needed)
    if (achievement.condition.type === 'level') {
      return true;
    }

    // High-frequency, low-value achievements can be background processed
    if (achievement.rarity === AchievementRarity.COMMON && !achievement.isProgressive) {
      return false;
    }

    // Streak-based achievements are critical (user needs immediate feedback)
    if (achievement.condition.type === 'streak') {
      return true;
    }

    // Count-based achievements with low targets can be background processed
    if (achievement.condition.type === 'count' && 
        typeof achievement.condition.target === 'number' && 
        achievement.condition.target <= 10) {
      return false;
    }

    // Default to critical for important achievements
    return true;
  }

  /**
   * Schedule background achievement check
   */
  private static scheduleBackgroundAchievementCheck(
    achievements: Achievement[],
    xpSource: XPSourceType,
    amount: number,
    sourceId?: string,
    metadata?: Record<string, any>
  ): void {
    const taskId = `bg_achievement_check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.addToBackgroundQueue(
      taskId,
      async () => {
        await this.processBackgroundAchievements(achievements, xpSource, amount, sourceId, metadata);
      },
      'medium', // Non-critical achievements get medium priority
      2 // Lower retry count for background tasks
    );
  }

  /**
   * Process achievements in background
   */
  private static async processBackgroundAchievements(
    achievements: Achievement[],
    xpSource: XPSourceType,
    amount: number,
    sourceId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      console.log(`🔄 Processing ${achievements.length} background achievements for ${xpSource}`);
      
      const userAchievements = await AchievementStorage.getUserAchievements();
      const userStats = await GamificationService.getGamificationStats();
      
      // Filter out already unlocked achievements
      const lockedAchievements = achievements.filter(
        achievement => !userAchievements.unlockedAchievements.includes(achievement.id)
      );

      if (lockedAchievements.length === 0) {
        console.log('📝 No background achievements to process');
        return;
      }

      // Process each achievement (similar to main logic but without immediate UI updates)
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
          await AchievementStorage.storeUnlockEvent(
            achievement.id,
            achievement,
            xpSource,
            { 
              evaluationResult,
              xpSource,
              amount,
              sourceId,
              processedInBackground: true,
              ...metadata 
            }
          );
          
          console.log(`🏆 Background achievement unlocked: ${achievement.name} (+${achievement.xpReward} XP)`);
        } else if (evaluationResult.progressDelta > 0) {
          // Store progress update
          await AchievementStorage.storeProgressUpdate(
            achievement.id,
            conditionResult.progress,
            xpSource,
            {
              xpSource,
              amount,
              sourceId,
              processedInBackground: true,
              ...metadata
            }
          );
        }
      }

      // Update user achievements
      if (newlyUnlocked.length > 0 || evaluationResults.some(r => r.progressDelta > 0)) {
        await this.updateUserAchievements(newlyUnlocked, evaluationResults);
      }

      // Award XP for unlocked achievements
      if (totalXPAwarded > 0) {
        await GamificationService.addXP(totalXPAwarded, {
          source: XPSourceType.ACHIEVEMENT_UNLOCK,
          description: `Background unlocked ${newlyUnlocked.length} achievement(s)`,
          skipNotification: true // Background achievements don't interrupt user
        });
      }

      // Queue delayed notifications for background achievements
      if (newlyUnlocked.length > 0) {
        setTimeout(() => {
          this.triggerAchievementNotifications(newlyUnlocked, totalXPAwarded, false);
        }, 3000); // 3-second delay for background notifications
      }

      console.log(`✅ Background processing complete: ${newlyUnlocked.length} unlocked, ${totalXPAwarded} XP awarded`);
    } catch (error) {
      console.error('AchievementService.processBackgroundAchievements error:', error);
      throw error; // Re-throw for retry mechanism
    }
  }

  // ========================================
  // LAZY ACHIEVEMENT FILTERING SYSTEM
  // ========================================

  /**
   * Optimized achievement relevance mapping for performance
   * Pre-computed map reduces achievement checking from 42 to ~5-10 per action
   */
  private static achievementRelevanceMap: Map<XPSourceType, string[]> | null = null;
  private static lastRelevanceMapUpdate = 0;
  private static readonly RELEVANCE_MAP_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Build optimized relevance map for XP sources to achievement IDs
   */
  private static buildAchievementRelevanceMap(): Map<XPSourceType, string[]> {
    const map = new Map<XPSourceType, string[]>();
    
    // Initialize empty arrays for all XP sources
    for (const sourceType of Object.values(XPSourceType)) {
      map.set(sourceType, []);
    }

    // Build relevance mapping for each achievement
    for (const achievement of CORE_ACHIEVEMENTS) {
      const relevantSources = this.getRelevantXPSources(achievement);
      
      for (const source of relevantSources) {
        const existingIds = map.get(source) || [];
        existingIds.push(achievement.id);
        map.set(source, existingIds);
      }
    }

    console.log(`🎯 Built achievement relevance map: ${map.size} XP sources mapped`);
    
    // Log mapping statistics for debugging
    for (const [source, achievementIds] of map.entries()) {
      if (achievementIds.length > 0) {
        console.log(`   ${source}: ${achievementIds.length} relevant achievements`);
      }
    }
    
    return map;
  }

  /**
   * Get XP sources that could trigger a specific achievement
   */
  private static getRelevantXPSources(achievement: Achievement): XPSourceType[] {
    const sources = new Set<XPSourceType>();
    
    // Direct source mapping
    if (this.isXPSourceType(achievement.condition.source)) {
      sources.add(achievement.condition.source as XPSourceType);
    }
    
    // Additional conditions for combination achievements
    if (achievement.condition.additionalConditions) {
      for (const condition of achievement.condition.additionalConditions) {
        if (this.isXPSourceType(condition.source)) {
          sources.add(condition.source as XPSourceType);
        }
      }
    }
    
    // Category-based source mapping for broader relevance
    switch (achievement.category) {
      case AchievementCategory.HABITS:
        sources.add(XPSourceType.HABIT_COMPLETION);
        sources.add(XPSourceType.HABIT_BONUS);
        sources.add(XPSourceType.HABIT_STREAK_MILESTONE);
        break;
        
      case AchievementCategory.JOURNAL:
        sources.add(XPSourceType.JOURNAL_ENTRY);
        sources.add(XPSourceType.JOURNAL_BONUS);
        sources.add(XPSourceType.JOURNAL_BONUS_MILESTONE);
        sources.add(XPSourceType.JOURNAL_STREAK_MILESTONE);
        break;
        
      case AchievementCategory.GOALS:
        sources.add(XPSourceType.GOAL_PROGRESS);
        sources.add(XPSourceType.GOAL_COMPLETION);
        sources.add(XPSourceType.GOAL_MILESTONE);
        break;
        
      case AchievementCategory.CONSISTENCY:
        // Consistency achievements can be triggered by multiple sources
        sources.add(XPSourceType.HABIT_COMPLETION);
        sources.add(XPSourceType.JOURNAL_ENTRY);
        sources.add(XPSourceType.GOAL_PROGRESS);
        sources.add(XPSourceType.DAILY_LAUNCH);
        break;
        
      case AchievementCategory.MASTERY:
        // Mastery achievements often track overall progress
        sources.add(XPSourceType.ACHIEVEMENT_UNLOCK);
        sources.add(XPSourceType.RECOMMENDATION_FOLLOW);
        sources.add(XPSourceType.MONTHLY_CHALLENGE);
        // Also include all other sources for level-based achievements
        for (const sourceType of Object.values(XPSourceType)) {
          sources.add(sourceType);
        }
        break;
        
      case AchievementCategory.SPECIAL:
        // Special achievements may have unique triggering conditions
        for (const sourceType of Object.values(XPSourceType)) {
          sources.add(sourceType);
        }
        break;
    }
    
    return Array.from(sources);
  }

  /**
   * Check if a string is a valid XPSourceType
   */
  private static isXPSourceType(source: string): boolean {
    return Object.values(XPSourceType).includes(source as XPSourceType);
  }

  /**
   * Get cached relevance map or build new one if expired
   */
  private static getAchievementRelevanceMap(): Map<XPSourceType, string[]> {
    const now = Date.now();
    
    if (!this.achievementRelevanceMap || 
        (now - this.lastRelevanceMapUpdate) > this.RELEVANCE_MAP_TTL) {
      
      this.achievementRelevanceMap = this.buildAchievementRelevanceMap();
      this.lastRelevanceMapUpdate = now;
    }
    
    return this.achievementRelevanceMap;
  }

  /**
   * Get achievements that might be triggered by specific XP source (OPTIMIZED)
   * This replaces the previous getRelevantAchievements method with much better performance
   */
  private static getRelevantAchievements(xpSource: XPSourceType): Achievement[] {
    try {
      const relevanceMap = this.getAchievementRelevanceMap();
      const relevantAchievementIds = relevanceMap.get(xpSource) || [];
      
      if (relevantAchievementIds.length === 0) {
        return [];
      }
      
      // Convert IDs back to achievement objects
      const relevantAchievements = relevantAchievementIds
        .map(id => CORE_ACHIEVEMENTS.find(a => a.id === id))
        .filter((achievement): achievement is Achievement => achievement !== undefined);
      
      console.log(`🎯 Lazy filtering: ${xpSource} → ${relevantAchievements.length}/${CORE_ACHIEVEMENTS.length} achievements (${((relevantAchievements.length / CORE_ACHIEVEMENTS.length) * 100).toFixed(1)}% reduction)`);
      
      return relevantAchievements;
      
    } catch (error) {
      console.error('AchievementService.getRelevantAchievements error:', error);
      // Fallback to checking all achievements if optimization fails
      console.warn('Falling back to checking all achievements due to error');
      return CORE_ACHIEVEMENTS;
    }
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
      const userAchievements = await AchievementStorage.getUserAchievements();
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
          
          await AchievementStorage.storeUnlockEvent(
            achievement.id,
            achievement,
            'daily_batch',
            { evaluationResult, triggerType: 'batch' }
          );
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
  // (Moved to AchievementStorage service)

  /**
   * Update user achievements data
   */
  private static async updateUserAchievements(
    newlyUnlocked: Achievement[],
    evaluationResults: AchievementEvaluationResult[]
  ): Promise<void> {
    try {
      const userAchievements = await AchievementStorage.getUserAchievements();
      
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
      
      // Save updated data using new storage service
      await AchievementStorage.saveUserAchievements(userAchievements);

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
  // (Moved to AchievementStorage service)

  /**
   * Get last batch check time
   */
  private static async getLastBatchCheckTime(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem('achievements_last_batch_check');
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
        'achievements_last_batch_check',
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
      // Try to get cached statistics first
      const cachedStats = await AchievementStorage.getCachedStatistics(24);
      if (cachedStats) {
        return cachedStats;
      }
      
      // Generate fresh statistics
      return await AchievementStorage.generateAchievementStatistics();
      
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
      await AchievementStorage.clearAllAchievementData();
      console.log('🧹 All achievement data reset');
    } catch (error) {
      console.error('AchievementService.resetAllAchievementData error:', error);
    }
  }
}