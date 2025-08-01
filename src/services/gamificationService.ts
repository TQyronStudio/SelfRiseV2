// Core gamification service for XP management and level progression
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  XPTransaction, 
  XPSourceType, 
  GamificationStats,
  BatchedXPNotification 
} from '../types/gamification';
import { 
  XP_REWARDS, 
  DAILY_XP_LIMITS, 
  BALANCE_VALIDATION,
  NOTIFICATION_BATCHING 
} from '../constants/gamification';
import { 
  getCurrentLevel, 
  getXPProgress, 
  getLevelInfo,
  isLevelMilestone 
} from './levelCalculation';
import { DateString } from '../types/common';
import { formatDateToString, today } from '../utils/date';

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  TOTAL_XP: 'gamification_total_xp',
  XP_TRANSACTIONS: 'gamification_xp_transactions',
  XP_BY_SOURCE: 'gamification_xp_by_source',
  DAILY_XP_TRACKING: 'gamification_daily_xp',
  LAST_ACTIVITY: 'gamification_last_activity',
  XP_MULTIPLIER: 'gamification_xp_multiplier',
  PENDING_NOTIFICATIONS: 'gamification_pending_notifications',
  LEVEL_UP_HISTORY: 'gamification_level_up_history',
} as const;

// Transaction result interface
export interface XPTransactionResult {
  success: boolean;
  xpGained: number;
  totalXP: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  milestoneReached: boolean;
  levelUpInfo?: {
    newLevelTitle: string;
    newLevelDescription: string;
    rewards?: string[];
    isMilestone: boolean;
  };
  transaction?: XPTransaction;
  error?: string | undefined;
}

// XP addition options
export interface XPAdditionOptions {
  source: XPSourceType;
  sourceId?: string;
  description?: string;
  skipLimits?: boolean;
  skipNotification?: boolean;
  metadata?: Record<string, any>;
}

// Daily XP tracking
interface DailyXPData {
  date: DateString;
  totalXP: number;
  xpBySource: Record<XPSourceType, number>;
  transactionCount: number;
  lastTransactionTime: number;
}

// Level-up event tracking
interface LevelUpEvent {
  id: string;
  timestamp: Date;
  date: DateString;
  previousLevel: number;
  newLevel: number;
  totalXPAtLevelUp: number;
  triggerSource: XPSourceType;
  isMilestone: boolean;
}

/**
 * Core Gamification Service
 * Handles all XP operations, level calculations, and data persistence
 */
export class GamificationService {
  
  // ========================================
  // CORE XP MANAGEMENT
  // ========================================

  /**
   * Add XP to user's total with comprehensive validation and tracking
   * 
   * @param amount Amount of XP to add
   * @param options XP addition configuration
   * @returns Transaction result with level changes
   */
  static async addXP(amount: number, options: XPAdditionOptions): Promise<XPTransactionResult> {
    try {
      // Input validation
      if (amount <= 0) {
        const totalXP = await this.getTotalXP();
        return {
          success: false,
          xpGained: 0,
          totalXP,
          previousLevel: getCurrentLevel(totalXP),
          newLevel: getCurrentLevel(totalXP),
          leveledUp: false,
          milestoneReached: false,
          error: 'XP amount must be positive'
        };
      }

      // Get current state
      const previousTotalXP = await this.getTotalXP();
      const previousLevel = getCurrentLevel(previousTotalXP);
      
      // Apply anti-spam and balance validation
      if (!options.skipLimits) {
        const validationResult = await this.validateXPAddition(amount, options.source);
        if (!validationResult.isValid) {
          return {
            success: false,
            xpGained: 0,
            totalXP: previousTotalXP,
            previousLevel,
            newLevel: previousLevel,
            leveledUp: false,
            milestoneReached: false,
            error: validationResult.reason
          };
        }
        // Use validated amount (may be reduced due to limits)
        amount = validationResult.allowedAmount;
      }

      // Apply XP multiplier if active
      const multiplierData = await this.getActiveXPMultiplier();
      const finalAmount = multiplierData.isActive ? amount * multiplierData.multiplier : amount;

      // Create transaction record
      const transaction: XPTransaction = {
        id: `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: finalAmount,
        source: options.source,
        description: options.description || this.getDefaultDescription(options.source),
        date: today(),
      };
      
      // Add optional properties if they exist
      if (options.sourceId) {
        transaction.sourceId = options.sourceId;
      }
      if (multiplierData.isActive) {
        transaction.multiplier = multiplierData.multiplier;
      }

      // Update total XP
      const newTotalXP = previousTotalXP + finalAmount;
      await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_XP, newTotalXP.toString());

      // Save transaction
      await this.saveTransaction(transaction);

      // Update tracking data
      await this.updateDailyXPTracking(finalAmount, options.source);
      await this.updateXPBySource(options.source, finalAmount);
      await this.updateLastActivity();

      // Check for level up
      const newLevel = getCurrentLevel(newTotalXP);
      const leveledUp = newLevel > previousLevel;
      const milestoneReached = leveledUp && isLevelMilestone(newLevel);

      // Get level-up information if leveled up
      let levelUpInfo = undefined;
      if (leveledUp) {
        const levelInfo = getLevelInfo(newLevel);
        levelUpInfo = {
          newLevelTitle: levelInfo.title,
          newLevelDescription: levelInfo.description || '',
          rewards: levelInfo.rewards,
          isMilestone: levelInfo.isMilestone,
        };

        // Store level-up event in history
        await this.storeLevelUpEvent(newLevel, previousLevel, newTotalXP, transaction.source);
      }

      // Handle notifications (if not skipped)
      if (!options.skipNotification) {
        await this.queueXPNotification(transaction, leveledUp, milestoneReached);
      }

      // Return comprehensive result
      return {
        success: true,
        xpGained: finalAmount,
        totalXP: newTotalXP,
        previousLevel,
        newLevel,
        leveledUp,
        milestoneReached,
        levelUpInfo,
        transaction
      };

    } catch (error) {
      console.error('GamificationService.addXP error:', error);
      return {
        success: false,
        xpGained: 0,
        totalXP: await this.getTotalXP(),
        previousLevel: 0,
        newLevel: 0,
        leveledUp: false,
        milestoneReached: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user's total accumulated XP
   */
  static async getTotalXP(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_XP);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.error('GamificationService.getTotalXP error:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive gamification statistics
   */
  static async getGamificationStats(): Promise<GamificationStats> {
    try {
      const totalXP = await this.getTotalXP();
      const currentLevel = getCurrentLevel(totalXP);
      const progress = getXPProgress(totalXP);
      const xpBySource = await this.getXPBySource();
      const transactions = await this.getAllTransactions();
      const multiplier = await this.getActiveXPMultiplier();

      const stats: GamificationStats = {
        totalXP,
        currentLevel,
        xpToNextLevel: progress.xpToNextLevel,
        xpProgress: progress.xpProgress,
        totalTransactions: transactions.length,
        xpBySource,
        achievementsUnlocked: 0, // Will be implemented in achievement system
        totalAchievements: 0, // Will be implemented in achievement system
        currentStreak: await this.getXPStreak(),
        longestStreak: await this.getLongestXPStreak(),
        lastActivity: await this.getLastActivity(),
        multiplierActive: multiplier.isActive,
      };
      
      if (multiplier.endTime) {
        stats.multiplierEndTime = multiplier.endTime;
      }
      
      return stats;
    } catch (error) {
      console.error('GamificationService.getGamificationStats error:', error);
      // Return safe defaults
      return {
        totalXP: 0,
        currentLevel: 0,
        xpToNextLevel: 100,
        xpProgress: 0,
        totalTransactions: 0,
        xpBySource: this.createEmptyXPBySource(),
        achievementsUnlocked: 0,
        totalAchievements: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: today(),
        multiplierActive: false,
      };
    }
  }

  // ========================================
  // TRANSACTION MANAGEMENT
  // ========================================

  /**
   * Save XP transaction with rollback capability
   */
  private static async saveTransaction(transaction: XPTransaction): Promise<void> {
    try {
      const transactions = await this.getAllTransactions();
      transactions.push(transaction);
      
      // Keep only last 1000 transactions for performance
      const trimmedTransactions = transactions.slice(-1000);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.XP_TRANSACTIONS, 
        JSON.stringify(trimmedTransactions)
      );
    } catch (error) {
      console.error('GamificationService.saveTransaction error:', error);
      throw new Error('Failed to save XP transaction');
    }
  }

  /**
   * Get all XP transactions
   */
  static async getAllTransactions(): Promise<XPTransaction[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.XP_TRANSACTIONS);
      if (!stored) return [];
      
      const transactions = JSON.parse(stored);
      // Convert date strings back to Date objects
      return transactions.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
    } catch (error) {
      console.error('GamificationService.getAllTransactions error:', error);
      return [];
    }
  }

  /**
   * Get transactions for a specific date range
   */
  static async getTransactionsByDateRange(
    startDate: DateString, 
    endDate: DateString
  ): Promise<XPTransaction[]> {
    try {
      const allTransactions = await this.getAllTransactions();
      return allTransactions.filter(transaction => 
        transaction.date >= startDate && transaction.date <= endDate
      );
    } catch (error) {
      console.error('GamificationService.getTransactionsByDateRange error:', error);
      return [];
    }
  }

  /**
   * Rollback last XP transaction (for error recovery)
   */
  static async rollbackLastTransaction(): Promise<boolean> {
    try {
      const transactions = await this.getAllTransactions();
      if (transactions.length === 0) return false;

      const lastTransaction = transactions[transactions.length - 1];
      if (!lastTransaction) return false;
      
      // Remove transaction from list
      const remainingTransactions = transactions.slice(0, -1);
      await AsyncStorage.setItem(
        STORAGE_KEYS.XP_TRANSACTIONS, 
        JSON.stringify(remainingTransactions)
      );

      // Subtract XP from total
      const currentTotal = await this.getTotalXP();
      const newTotal = Math.max(0, currentTotal - lastTransaction.amount);
      await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_XP, newTotal.toString());

      // Update tracking data
      await this.rollbackDailyXPTracking(lastTransaction.amount, lastTransaction.source);
      await this.rollbackXPBySource(lastTransaction.source, lastTransaction.amount);

      return true;
    } catch (error) {
      console.error('GamificationService.rollbackLastTransaction error:', error);
      return false;
    }
  }

  // ========================================
  // VALIDATION & LIMITS
  // ========================================

  /**
   * Validate XP addition against limits and anti-spam rules
   */
  private static async validateXPAddition(
    amount: number, 
    source: XPSourceType
  ): Promise<{ isValid: boolean; allowedAmount: number; reason?: string }> {
    try {
      // Check maximum single transaction
      if (amount > BALANCE_VALIDATION.MAX_SINGLE_TRANSACTION_XP) {
        return {
          isValid: false,
          allowedAmount: 0,
          reason: `Single transaction cannot exceed ${BALANCE_VALIDATION.MAX_SINGLE_TRANSACTION_XP} XP`
        };
      }

      // Check daily limits
      const dailyData = await this.getDailyXPData();
      const currentDailyTotal = dailyData.totalXP;
      const currentSourceTotal = dailyData.xpBySource[source] || 0;

      // Check total daily limit
      if (currentDailyTotal + amount > DAILY_XP_LIMITS.TOTAL_DAILY_MAX) {
        const allowedAmount = Math.max(0, DAILY_XP_LIMITS.TOTAL_DAILY_MAX - currentDailyTotal);
        if (allowedAmount === 0) {
          return {
            isValid: false,
            allowedAmount: 0,
            reason: 'Daily XP limit reached'
          };
        }
        return {
          isValid: true,
          allowedAmount,
          reason: `Amount reduced to daily limit`
        };
      }

      // Check source-specific limits
      const sourceLimit = this.getSourceDailyLimit(source);
      if (sourceLimit && currentSourceTotal + amount > sourceLimit) {
        const allowedAmount = Math.max(0, sourceLimit - currentSourceTotal);
        if (allowedAmount === 0) {
          return {
            isValid: false,
            allowedAmount: 0,
            reason: `Daily limit for ${source} reached`
          };
        }
        return {
          isValid: true,
          allowedAmount,
          reason: `Amount reduced to source limit`
        };
      }

      // Check rate limiting
      const timeSinceLastTransaction = Date.now() - dailyData.lastTransactionTime;
      if (timeSinceLastTransaction < BALANCE_VALIDATION.MIN_TIME_BETWEEN_IDENTICAL_GAINS) {
        return {
          isValid: false,
          allowedAmount: 0,
          reason: 'Too many transactions in short time'
        };
      }

      return { isValid: true, allowedAmount: amount };
    } catch (error) {
      console.error('GamificationService.validateXPAddition error:', error);
      return { isValid: false, allowedAmount: 0, reason: 'Validation error' };
    }
  }

  /**
   * Get daily XP limit for a specific source
   */
  private static getSourceDailyLimit(source: XPSourceType): number | null {
    const sourceMap: Record<XPSourceType, number | null> = {
      [XPSourceType.HABIT_COMPLETION]: DAILY_XP_LIMITS.HABITS_MAX_DAILY,
      [XPSourceType.HABIT_BONUS]: DAILY_XP_LIMITS.HABITS_MAX_DAILY,
      [XPSourceType.HABIT_STREAK_MILESTONE]: DAILY_XP_LIMITS.HABITS_MAX_DAILY,
      [XPSourceType.JOURNAL_ENTRY]: DAILY_XP_LIMITS.JOURNAL_MAX_DAILY,
      [XPSourceType.JOURNAL_BONUS]: DAILY_XP_LIMITS.JOURNAL_MAX_DAILY,
      [XPSourceType.JOURNAL_BONUS_MILESTONE]: DAILY_XP_LIMITS.JOURNAL_MAX_DAILY,
      [XPSourceType.JOURNAL_STREAK_MILESTONE]: DAILY_XP_LIMITS.JOURNAL_MAX_DAILY,
      [XPSourceType.GOAL_PROGRESS]: DAILY_XP_LIMITS.GOALS_MAX_DAILY,
      [XPSourceType.GOAL_COMPLETION]: DAILY_XP_LIMITS.GOALS_MAX_DAILY,
      [XPSourceType.GOAL_MILESTONE]: DAILY_XP_LIMITS.GOALS_MAX_DAILY,
      [XPSourceType.DAILY_LAUNCH]: DAILY_XP_LIMITS.ENGAGEMENT_MAX_DAILY,
      [XPSourceType.RECOMMENDATION_FOLLOW]: DAILY_XP_LIMITS.ENGAGEMENT_MAX_DAILY,
      [XPSourceType.ACHIEVEMENT_UNLOCK]: null, // No daily limit
      [XPSourceType.WEEKLY_CHALLENGE]: null, // No daily limit
      [XPSourceType.XP_MULTIPLIER_BONUS]: null, // No daily limit
    };

    return sourceMap[source] || null;
  }

  // ========================================
  // LEVEL-UP EVENT TRACKING
  // ========================================

  /**
   * Store level-up event for analytics and history
   */
  private static async storeLevelUpEvent(
    newLevel: number,
    previousLevel: number,
    totalXP: number,
    triggerSource: XPSourceType
  ): Promise<void> {
    try {
      const levelUpEvent: LevelUpEvent = {
        id: `levelup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        date: today(),
        previousLevel,
        newLevel,
        totalXPAtLevelUp: totalXP,
        triggerSource,
        isMilestone: isLevelMilestone(newLevel),
      };

      const levelUpHistory = await this.getLevelUpHistory();
      levelUpHistory.push(levelUpEvent);

      // Keep only last 100 level-up events for performance
      const trimmedHistory = levelUpHistory.slice(-100);

      await AsyncStorage.setItem(STORAGE_KEYS.LEVEL_UP_HISTORY, JSON.stringify(trimmedHistory));
      
      console.log(`🎉 Level-up stored: ${previousLevel} → ${newLevel} (${triggerSource})`);
    } catch (error) {
      console.error('GamificationService.storeLevelUpEvent error:', error);
    }
  }

  /**
   * Get level-up history
   */
  static async getLevelUpHistory(): Promise<LevelUpEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LEVEL_UP_HISTORY);
      if (!stored) return [];

      const events = JSON.parse(stored);
      // Convert date strings back to Date objects
      return events.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
    } catch (error) {
      console.error('GamificationService.getLevelUpHistory error:', error);
      return [];
    }
  }

  /**
   * Get recent level-ups (last N events)
   */
  static async getRecentLevelUps(count: number = 5): Promise<LevelUpEvent[]> {
    try {
      const history = await this.getLevelUpHistory();
      return history.slice(-count).reverse(); // Most recent first
    } catch (error) {
      console.error('GamificationService.getRecentLevelUps error:', error);
      return [];
    }
  }

  // ========================================
  // TRACKING & ANALYTICS
  // ========================================

  /**
   * Update daily XP tracking data
   */
  private static async updateDailyXPTracking(amount: number, source: XPSourceType): Promise<void> {
    try {
      const dailyData = await this.getDailyXPData();
      
      dailyData.totalXP += amount;
      dailyData.xpBySource[source] = (dailyData.xpBySource[source] || 0) + amount;
      dailyData.transactionCount += 1;
      dailyData.lastTransactionTime = Date.now();

      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_XP_TRACKING, JSON.stringify(dailyData));
    } catch (error) {
      console.error('GamificationService.updateDailyXPTracking error:', error);
    }
  }

  /**
   * Get today's XP tracking data
   */
  private static async getDailyXPData(): Promise<DailyXPData> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_XP_TRACKING);
      if (!stored) {
        return this.createEmptyDailyData();
      }

      const data: DailyXPData = JSON.parse(stored);
      
      // Reset if it's a new day
      if (data.date !== today()) {
        return this.createEmptyDailyData();
      }

      return data;
    } catch (error) {
      console.error('GamificationService.getDailyXPData error:', error);
      return this.createEmptyDailyData();
    }
  }

  /**
   * Create empty daily XP data for today
   */
  private static createEmptyDailyData(): DailyXPData {
    return {
      date: today(),
      totalXP: 0,
      xpBySource: this.createEmptyXPBySource(),
      transactionCount: 0,
      lastTransactionTime: 0,
    };
  }

  /**
   * Update XP by source tracking
   */
  private static async updateXPBySource(source: XPSourceType, amount: number): Promise<void> {
    try {
      const xpBySource = await this.getXPBySource();
      xpBySource[source] = (xpBySource[source] || 0) + amount;
      await AsyncStorage.setItem(STORAGE_KEYS.XP_BY_SOURCE, JSON.stringify(xpBySource));
    } catch (error) {
      console.error('GamificationService.updateXPBySource error:', error);
    }
  }

  /**
   * Get XP breakdown by source
   */
  static async getXPBySource(): Promise<Record<XPSourceType, number>> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.XP_BY_SOURCE);
      return stored ? JSON.parse(stored) : this.createEmptyXPBySource();
    } catch (error) {
      console.error('GamificationService.getXPBySource error:', error);
      return this.createEmptyXPBySource();
    }
  }

  /**
   * Create empty XP by source record with all sources initialized to 0
   */
  private static createEmptyXPBySource(): Record<XPSourceType, number> {
    return {
      [XPSourceType.HABIT_COMPLETION]: 0,
      [XPSourceType.HABIT_BONUS]: 0,
      [XPSourceType.HABIT_STREAK_MILESTONE]: 0,
      [XPSourceType.JOURNAL_ENTRY]: 0,
      [XPSourceType.JOURNAL_BONUS]: 0,
      [XPSourceType.JOURNAL_BONUS_MILESTONE]: 0,
      [XPSourceType.JOURNAL_STREAK_MILESTONE]: 0,
      [XPSourceType.GOAL_PROGRESS]: 0,
      [XPSourceType.GOAL_COMPLETION]: 0,
      [XPSourceType.GOAL_MILESTONE]: 0,
      [XPSourceType.DAILY_LAUNCH]: 0,
      [XPSourceType.RECOMMENDATION_FOLLOW]: 0,
      [XPSourceType.ACHIEVEMENT_UNLOCK]: 0,
      [XPSourceType.WEEKLY_CHALLENGE]: 0,
      [XPSourceType.XP_MULTIPLIER_BONUS]: 0,
    };
  }

  // ========================================
  // XP MULTIPLIER SYSTEM
  // ========================================

  /**
   * Get active XP multiplier information
   */
  static async getActiveXPMultiplier(): Promise<{
    isActive: boolean;
    multiplier: number;
    endTime?: Date;
    source?: string;
  }> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.XP_MULTIPLIER);
      if (!stored) return { isActive: false, multiplier: 1 };

      const data = JSON.parse(stored);
      const endTime = new Date(data.endTime);
      
      if (endTime <= new Date()) {
        // Multiplier has expired
        await AsyncStorage.removeItem(STORAGE_KEYS.XP_MULTIPLIER);
        return { isActive: false, multiplier: 1 };
      }

      return {
        isActive: true,
        multiplier: data.multiplier,
        endTime,
        source: data.source,
      };
    } catch (error) {
      console.error('GamificationService.getActiveXPMultiplier error:', error);
      return { isActive: false, multiplier: 1 };
    }
  }

  // ========================================
  // NOTIFICATION SYSTEM
  // ========================================

  /**
   * Queue XP notification for batching
   */
  private static async queueXPNotification(
    transaction: XPTransaction,
    leveledUp: boolean,
    milestoneReached: boolean
  ): Promise<void> {
    try {
      // Implementation will be completed when notification system is built
      // For now, just log important events
      if (leveledUp) {
        console.log(`🎉 Level up! Transaction: ${transaction.amount} XP from ${transaction.source}`);
      }
      if (milestoneReached) {
        console.log(`🏆 Milestone reached! Transaction: ${transaction.amount} XP from ${transaction.source}`);
      }
    } catch (error) {
      console.error('GamificationService.queueXPNotification error:', error);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get default description for XP source
   */
  private static getDefaultDescription(source: XPSourceType): string {
    const descriptions: Record<XPSourceType, string> = {
      [XPSourceType.HABIT_COMPLETION]: 'Completed scheduled habit',
      [XPSourceType.HABIT_BONUS]: 'Completed bonus habit',
      [XPSourceType.HABIT_STREAK_MILESTONE]: 'Reached habit streak milestone',
      [XPSourceType.JOURNAL_ENTRY]: 'Created journal entry',
      [XPSourceType.JOURNAL_BONUS]: 'Created bonus journal entry',
      [XPSourceType.JOURNAL_BONUS_MILESTONE]: 'Reached journal bonus milestone',
      [XPSourceType.JOURNAL_STREAK_MILESTONE]: 'Reached journal streak milestone',
      [XPSourceType.GOAL_PROGRESS]: 'Added progress to goal',
      [XPSourceType.GOAL_COMPLETION]: 'Completed goal',
      [XPSourceType.GOAL_MILESTONE]: 'Reached goal milestone',
      [XPSourceType.DAILY_LAUNCH]: 'Launched app for first time today',
      [XPSourceType.RECOMMENDATION_FOLLOW]: 'Followed recommendation',
      [XPSourceType.ACHIEVEMENT_UNLOCK]: 'Unlocked achievement',
      [XPSourceType.WEEKLY_CHALLENGE]: 'Completed weekly challenge',
      [XPSourceType.XP_MULTIPLIER_BONUS]: 'XP multiplier bonus applied',
    };
    return descriptions[source];
  }

  /**
   * Update last activity timestamp
   */
  private static async updateLastActivity(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, today());
    } catch (error) {
      console.error('GamificationService.updateLastActivity error:', error);
    }
  }

  /**
   * Get last activity date
   */
  static async getLastActivity(): Promise<DateString> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      return stored || today();
    } catch (error) {
      console.error('GamificationService.getLastActivity error:', error);
      return today();
    }
  }

  /**
   * Calculate current XP streak (consecutive days with XP gains)
   */
  static async getXPStreak(): Promise<number> {
    try {
      // Implementation for XP streak calculation
      // This would analyze transaction history for consecutive days
      return 0; // Placeholder
    } catch (error) {
      console.error('GamificationService.getXPStreak error:', error);
      return 0;
    }
  }

  /**
   * Get longest XP streak achieved
   */
  static async getLongestXPStreak(): Promise<number> {
    try {
      // Implementation for longest XP streak
      return 0; // Placeholder
    } catch (error) {
      console.error('GamificationService.getLongestXPStreak error:', error);
      return 0;
    }
  }

  // ========================================
  // ROLLBACK UTILITIES
  // ========================================

  /**
   * Rollback daily XP tracking
   */
  private static async rollbackDailyXPTracking(amount: number, source: XPSourceType): Promise<void> {
    try {
      const dailyData = await this.getDailyXPData();
      
      dailyData.totalXP = Math.max(0, dailyData.totalXP - amount);
      dailyData.xpBySource[source] = Math.max(0, (dailyData.xpBySource[source] || 0) - amount);
      dailyData.transactionCount = Math.max(0, dailyData.transactionCount - 1);

      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_XP_TRACKING, JSON.stringify(dailyData));
    } catch (error) {
      console.error('GamificationService.rollbackDailyXPTracking error:', error);
    }
  }

  /**
   * Rollback XP by source tracking
   */
  private static async rollbackXPBySource(source: XPSourceType, amount: number): Promise<void> {
    try {
      const xpBySource = await this.getXPBySource();
      xpBySource[source] = Math.max(0, (xpBySource[source] || 0) - amount);
      await AsyncStorage.setItem(STORAGE_KEYS.XP_BY_SOURCE, JSON.stringify(xpBySource));
    } catch (error) {
      console.error('GamificationService.rollbackXPBySource error:', error);
    }
  }

  // ========================================
  // DEVELOPMENT & TESTING UTILITIES
  // ========================================

  /**
   * Reset all gamification data (for testing/development)
   */
  static async resetAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOTAL_XP,
        STORAGE_KEYS.XP_TRANSACTIONS,
        STORAGE_KEYS.XP_BY_SOURCE,
        STORAGE_KEYS.DAILY_XP_TRACKING,
        STORAGE_KEYS.LAST_ACTIVITY,
        STORAGE_KEYS.XP_MULTIPLIER,
        STORAGE_KEYS.PENDING_NOTIFICATIONS,
        STORAGE_KEYS.LEVEL_UP_HISTORY,
      ]);
      console.log('🧹 All gamification data reset');
    } catch (error) {
      console.error('GamificationService.resetAllData error:', error);
    }
  }

  /**
   * Get debug information about current state
   */
  static async getDebugInfo(): Promise<any> {
    try {
      const totalXP = await this.getTotalXP();
      const stats = await this.getGamificationStats();
      const dailyData = await this.getDailyXPData();
      const transactions = await this.getAllTransactions();
      const multiplier = await this.getActiveXPMultiplier();

      return {
        totalXP,
        stats,
        dailyData,
        transactionCount: transactions.length,
        lastTransaction: transactions[transactions.length - 1],
        multiplier,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('GamificationService.getDebugInfo error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}