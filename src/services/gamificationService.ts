// Core gamification service for XP management and level progression
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { DeviceEventEmitter } from 'react-native';
import { 
  XPTransaction, 
  XPSourceType, 
  GamificationStats,
  BatchedXPNotification,
  MonthlyChallenge,
  MonthlyChallengeProgress,
  AchievementCategory
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
import { FEATURE_FLAGS } from '../config/featureFlags';
import { getDatabase } from './database/init';
import { AtomicStorage } from './atomicStorage';

// ========================================
// XP BATCHING SYSTEM INTERFACES
// ========================================

interface PendingXPBatch {
  totalAmount: number;
  sources: Map<XPSourceType, number>;
  sourceIds: string[];
  descriptions: string[];
  metadata: Record<string, any>[];
  firstActionTime: number;
  lastActionTime: number;
}

interface BatchedXPResult extends XPTransactionResult {
  batchedSources: Array<{
    source: XPSourceType;
    amount: number;
    count: number;
  }>;
}

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

// ========================================
// OPTIMISTIC UPDATES SYSTEM INTERFACES
// ========================================

// Real-time UI feedback callback for optimistic updates
export interface OptimisticUpdateCallback {
  (optimisticTotalXP: number, optimisticLevel: number): void;
}

// Enhanced XP addition options with optimistic updates support
export interface OptimizedXPAdditionOptions extends XPAdditionOptions {
  enableOptimistic?: boolean;
  onOptimisticUpdate?: OptimisticUpdateCallback;
  onBackgroundComplete?: (actualResult: XPTransactionResult) => void;
  position?: { x: number; y: number }; // For animation positioning
}

// Enhanced XP transaction result with performance metrics
export interface OptimizedXPTransactionResult extends XPTransactionResult {
  operationTime: number; // Total operation time in ms
  optimisticUpdateTime?: number | undefined; // Time for optimistic update in ms
  backgroundSyncTime?: number | undefined; // Time for background sync in ms
  wasOptimistic: boolean; // Whether optimistic update was used
  correctionApplied?: boolean | undefined; // Whether correction was needed
}

// Performance metrics tracking
interface PerformanceMetrics {
  operationCount: number;
  totalOperationTime: number;
  averageOperationTime: number;
  optimisticUpdateCount: number;
  backgroundSyncCount: number;
  correctionCount: number;
  lastOperationTime: number;
  cacheHitRate: number;
}

// Debounced background sync state
interface BackgroundSyncState {
  pendingOperations: number;
  lastSyncTime: number;
  syncInProgress: boolean;
  debounceTimeout?: NodeJS.Timeout | undefined;
}

// Daily XP tracking
interface DailyXPData {
  date: DateString;
  totalXP: number;
  xpBySource: Record<XPSourceType, number>;
  transactionCount: number;
  lastTransactionTime: number;
  
  // Anti-spam tracking
  journalEntryCount: number; // Count of journal entries today
  goalTransactions: Record<string, number>; // goalId -> transaction count for goal anti-spam
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
  shown?: boolean; // Track if level up modal has been displayed
}

// ========================================
// ENHANCED XP REWARD INTERFACES (Migrated)
// ========================================

/**
 * Enhanced XP calculation result with detailed breakdown (migrated from enhancedXPRewardEngine)
 */
export interface EnhancedXPRewardResult {
  challengeId: string;
  starLevel: 1 | 2 | 3 | 4 | 5;
  
  // Base calculation
  baseXPReward: number;
  completionPercentage: number;
  
  // Bonus calculations
  completionBonus: number;         // 20% for 100%, pro-rated for 70-99%
  streakBonus: number;            // +100 XP per consecutive month
  milestoneBonus: number;         // Additional milestone bonuses
  
  // Final calculation
  totalXPAwarded: number;
  
  // Metadata  
  bonusBreakdown: EnhancedXPBonusBreakdown;
  rewardTier: 'standard' | 'excellent' | 'perfect' | 'legendary';
  calculatedAt: Date;
  
  // Validation
  isBalanced: boolean;
  balanceNotes?: string[];
}

/**
 * Detailed bonus breakdown for transparency (migrated from enhancedXPRewardEngine)
 */
export interface EnhancedXPBonusBreakdown {
  baseReward: {
    amount: number;
    starLevel: number;
    description: string;
  };
  
  completionBonus?: {
    amount: number;
    percentage: number;
    type: 'perfect' | 'partial';
    description: string;
  };
  
  streakBonus?: {
    amount: number;
    streakLength: number;
    description: string;
  };
  
  milestoneBonus?: {
    amount: number;
    milestones: string[];
    description: string;
  };
  
  totalBonuses: number;
  bonusPercentage: number; // Percentage of base reward
}

/**
 * Monthly streak data for bonus calculations (migrated from enhancedXPRewardEngine)
 */
export interface EnhancedMonthlyStreakData {
  currentStreak: number;           // Consecutive completed months
  longestStreak: number;           // All-time longest streak
  totalCompletedMonths: number;    // Total months completed ever
  lastCompletionMonth: string;     // "YYYY-MM" format
  streakBonusEligible: boolean;    // Whether eligible for streak bonus
  
  // Streak history (last 12 months)
  recentHistory: Array<{
    month: string;
    completed: boolean;
    completionPercentage: number;
    starLevel: number;
  }>;
}

/**
 * XP balance validation result (migrated from enhancedXPRewardEngine)
 */
export interface EnhancedXPBalanceValidation {
  isBalanced: boolean;
  totalXP: number;
  comparedToWeeklyAverage: number;    // How much vs avg weekly XP
  comparedToMonthlyBaseline: number;   // How much vs expected monthly XP
  warnings: string[];
  recommendations: string[];
}

/**
 * Core Gamification Service
 * Handles all XP operations, level calculations, and data persistence
 */
export class GamificationService {
  
  // ========================================
  // XP BATCHING SYSTEM
  // ========================================
  
  private static pendingBatch: PendingXPBatch | null = null;
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static readonly BATCH_WINDOW_MS = 500; // 500ms batching window
  private static readonly MAX_BATCH_SIZE = 20; // Maximum operations per batch
  
  // Thread-safe operation queue to prevent race conditions
  private static operationQueue: Promise<any> = Promise.resolve();

  // ========================================
  // OPTIMISTIC UPDATES & PERFORMANCE SYSTEM
  // ========================================
  
  // Performance constants (aligned with OptimizedGamificationContext)
  private static readonly CACHE_VALIDITY_MS = 100; // 100ms cache for smooth animations
  private static readonly DEBOUNCE_DELAY_MS = 50; // 50ms debounce for batch updates
  private static readonly MAX_OPTIMISTIC_OPERATIONS = 10; // Max concurrent optimistic operations
  
  // Performance metrics tracking
  private static performanceMetrics: PerformanceMetrics = {
    operationCount: 0,
    totalOperationTime: 0,
    averageOperationTime: 0,
    optimisticUpdateCount: 0,
    backgroundSyncCount: 0,
    correctionCount: 0,
    lastOperationTime: 0,
    cacheHitRate: 0,
  };
  
  // Background sync state
  private static backgroundSyncState: BackgroundSyncState = {
    pendingOperations: 0,
    lastSyncTime: 0,
    syncInProgress: false,
  };
  
  // Cached XP total for optimistic updates (thread-safe with timestamp)
  private static cachedXPData: {
    totalXP: number;
    timestamp: number;
    level: number;
  } | null = null;

  // Session-scoped cache for getDailyXPData — invalidated after each successful XP write.
  // Eliminates 4 SQL queries per tap during rapid habit clicking.
  private static dailyXPDataCache: Map<string, { data: DailyXPData; ts: number }> = new Map();
  private static readonly DAILY_XP_CACHE_TTL_MS = 5000;
  
  /**
   * Add XP directly without batching (used for fallbacks and internal operations)
   * PRIVATE: Use addXP() or addXPWithBatching() instead
   */
  private static async addXPDirectly(amount: number, options: XPAdditionOptions): Promise<XPTransactionResult> {
    // This is the core XP addition logic without batching
    return await GamificationService.performXPAddition(amount, options);
  }

  /**
   * Add XP with batching optimization (PUBLIC API)
   * Batches multiple rapid XP additions within 500ms window for better performance
   */
  static async addXPWithBatching(amount: number, options: XPAdditionOptions): Promise<XPTransactionResult> {
    try {
      console.log(`⚡ Adding XP with batching: +${amount} from ${options.source}`);
      
      const now = Date.now();
      const shouldBatch = GamificationService.shouldBatchXPAddition(amount, options, now);
      
      if (shouldBatch) {
        return await GamificationService.addToBatch(amount, options, now);
      } else {
        // Execute immediately for time-sensitive operations
        return await GamificationService.addXPDirectly(amount, options);
      }
    } catch (error) {
      console.error('GamificationService.addXPWithBatching error:', error);
      // Fallback to direct XP addition
      return await GamificationService.addXPDirectly(amount, options);
    }
  }

  /**
   * Determine if XP addition should be batched
   */
  private static shouldBatchXPAddition(amount: number, options: XPAdditionOptions, now: number): boolean {
    // Don't batch if explicitly disabled
    if (options.metadata?.skipBatching === true) {
      return false;
    }
    
    // Don't batch critical operations - ALL user-facing XP sources get immediate popups
    if (options.source === XPSourceType.ACHIEVEMENT_UNLOCK ||
        options.source === XPSourceType.HABIT_COMPLETION ||
        options.source === XPSourceType.HABIT_BONUS ||
        options.source === XPSourceType.JOURNAL_ENTRY ||
        options.source === XPSourceType.JOURNAL_BONUS ||
        options.source === XPSourceType.GOAL_PROGRESS) {
      return false;
    }
    
    // Don't batch if no pending batch exists and amount is large
    if (!this.pendingBatch && amount >= 100) {
      return false;
    }
    
    // Don't batch negative amounts (subtraction)
    if (amount < 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Add XP to pending batch
   */
  private static async addToBatch(amount: number, options: XPAdditionOptions, now: number): Promise<XPTransactionResult> {
    try {
      // Initialize batch if it doesn't exist
      if (!this.pendingBatch) {
        this.pendingBatch = {
          totalAmount: 0,
          sources: new Map<XPSourceType, number>(),
          sourceIds: [],
          descriptions: [],
          metadata: [],
          firstActionTime: now,
          lastActionTime: now
        };
        
        console.log(`🔥 Started new XP batch (${this.BATCH_WINDOW_MS}ms window)`);
      }

      // Add to batch
      this.pendingBatch.totalAmount += amount;
      this.pendingBatch.sources.set(
        options.source, 
        (this.pendingBatch.sources.get(options.source) || 0) + amount
      );
      
      if (options.sourceId) {
        this.pendingBatch.sourceIds.push(options.sourceId);
      }
      if (options.description) {
        this.pendingBatch.descriptions.push(options.description);
      }
      if (options.metadata) {
        this.pendingBatch.metadata.push(options.metadata);
      }
      
      this.pendingBatch.lastActionTime = now;

      console.log(`📦 Added to batch: +${amount} ${options.source} (batch total: ${this.pendingBatch.totalAmount})`);

      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      // Check if batch should be committed immediately
      if (this.shouldCommitBatch()) {
        return await this.commitBatch();
      }

      // Set new timeout for batch commit
      this.batchTimeout = setTimeout(() => {
        this.commitBatch().catch(error => {
          console.error('Batch commit timeout error:', error);
        });
      }, this.BATCH_WINDOW_MS) as unknown as NodeJS.Timeout;

      // Return optimistic result (actual result will be processed in batch)
      const totalXP = await this.getTotalXP();
      const previousLevel = getCurrentLevel(totalXP);
      const newLevel = getCurrentLevel(totalXP + amount);
      const leveledUp = newLevel > previousLevel;
      
      console.log(`📊 Optimistic result: ${totalXP} → ${totalXP + amount} XP, level ${previousLevel} → ${newLevel}, leveledUp=${leveledUp}`);
      
      return {
        success: true,
        xpGained: amount,
        totalXP: totalXP + amount, // Optimistic total
        previousLevel,
        newLevel,
        leveledUp, // Properly detect level-up in optimistic result
        milestoneReached: isLevelMilestone(newLevel) && leveledUp,
        transaction: {
          id: `batch_pending_${now}`,
          amount,
          source: options.source,
          description: options.description || this.getDefaultDescription(options.source),
          date: today(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(options.sourceId && { sourceId: options.sourceId })
        }
      };

    } catch (error) {
      console.error('GamificationService.addToBatch error:', error);
      // FIX: Fallback to direct addition to prevent recursive loop
      return await this.addXPDirectly(amount, options);
    }
  }

  /**
   * Check if batch should be committed immediately
   */
  private static shouldCommitBatch(): boolean {
    if (!this.pendingBatch) return false;
    
    // Commit if batch is too large
    if (this.pendingBatch.sources.size >= this.MAX_BATCH_SIZE) {
      console.log(`📊 Committing batch early: ${this.pendingBatch.sources.size} sources`);
      return true;
    }
    
    // Commit if total amount is very large
    if (this.pendingBatch.totalAmount >= 500) {
      console.log(`📊 Committing batch early: ${this.pendingBatch.totalAmount} total XP`);
      return true;
    }
    
    return false;
  }

  /**
   * Commit pending batch
   */
  private static async commitBatch(): Promise<BatchedXPResult> {
    try {
      if (!this.pendingBatch) {
        throw new Error('No pending batch to commit');
      }

      const batch = this.pendingBatch;
      
      // Clear batch and timeout
      this.pendingBatch = null;
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }

      console.log(`🚀 Committing XP batch: ${batch.totalAmount} XP from ${batch.sources.size} sources`);

      // Create batch options
      const batchOptions: XPAdditionOptions = {
        source: this.getDominantSource(batch.sources),
        description: this.createBatchDescription(batch),
        skipNotification: true, // CRITICAL: Skip notifications in batch commit to prevent duplicate level-up modals
        metadata: {
          isBatch: true,
          batchSize: batch.sources.size,
          batchDuration: batch.lastActionTime - batch.firstActionTime,
          batchSources: Array.from(batch.sources.entries()),
          skipBatching: true // CRITICAL: Prevent infinite loop in batch commit
        }
      };

      // Execute batched XP addition - use performXPAddition directly to avoid batching loop
      const result = await GamificationService.performXPAddition(batch.totalAmount, batchOptions);

      // Create batched result
      const batchedResult: BatchedXPResult = {
        ...result,
        batchedSources: Array.from(batch.sources.entries()).map(([source, amount]) => ({
          source,
          amount,
          count: 1 // Could be enhanced to track individual counts
        }))
      };

      // Trigger batched XP animation
      this.triggerBatchedXPAnimation(batchedResult);

      console.log(`✅ Batch committed successfully: +${batch.totalAmount} XP`);
      
      return batchedResult;

    } catch (error) {
      console.error('GamificationService.commitBatch error:', error);
      
      // Return error result
      const totalXP = await this.getTotalXP();
      return {
        success: false,
        xpGained: 0,
        totalXP,
        previousLevel: getCurrentLevel(totalXP),
        newLevel: getCurrentLevel(totalXP),
        leveledUp: false,
        milestoneReached: false,
        error: error instanceof Error ? error.message : 'Batch commit failed',
        batchedSources: []
      };
    }
  }

  /**
   * Get the dominant source from batch (highest amount)
   */
  private static getDominantSource(sources: Map<XPSourceType, number>): XPSourceType {
    let dominantSource = XPSourceType.HABIT_COMPLETION;
    let maxAmount = 0;
    
    for (const [source, amount] of sources.entries()) {
      if (amount > maxAmount) {
        maxAmount = amount;
        dominantSource = source;
      }
    }
    
    return dominantSource;
  }

  /**
   * Create description for batched operations
   */
  private static createBatchDescription(batch: PendingXPBatch): string {
    const sourceCount = batch.sources.size;
    const totalAmount = batch.totalAmount;
    
    if (sourceCount === 1) {
      const [source] = batch.sources.keys();
      return `Batched ${source} (+${totalAmount} XP)`;
    }
    
    return `Batched ${sourceCount} actions (+${totalAmount} XP total)`;
  }

  /**
   * Trigger batched XP animation with summary
   */
  private static triggerBatchedXPAnimation(result: BatchedXPResult): void {
    try {
      DeviceEventEmitter.emit('xpBatchCommitted', {
        totalAmount: result.xpGained,
        sources: result.batchedSources,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
        timestamp: Date.now()
      });
      
      console.log(`🎆 Batched XP animation triggered: +${result.xpGained} XP from ${result.batchedSources.length} sources`);
    } catch (error) {
      console.error('GamificationService.triggerBatchedXPAnimation error:', error);
    }
  }

  // ========================================
  // CORE XP MANAGEMENT
  // ========================================

  /**
   * Add XP to user's account with validation and tracking (PRIMARY PUBLIC API)
   *
   * SQLite Migration: Direct execution (no batching) - SQLite is 16x faster than AsyncStorage
   * Batching was only needed for AsyncStorage performance workaround
   *
   * @param amount Amount of XP to add
   * @param options XP addition configuration
   * @returns Transaction result with level changes
   */
  static async addXP(amount: number, options: XPAdditionOptions): Promise<XPTransactionResult> {
    try {
      // Direct execution - SQLite is fast enough (5ms vs 80ms AsyncStorage)
      // No batching needed anymore
      return await GamificationService.performXPAddition(amount, options);
    } catch (error) {
      console.error('GamificationService.addXP error:', error);

      // Return error result
      const totalXP = await this.getTotalXP();
      return {
        success: false,
        xpGained: 0,
        totalXP,
        previousLevel: getCurrentLevel(totalXP),
        newLevel: getCurrentLevel(totalXP),
        leveledUp: false,
        milestoneReached: false,
        error: error instanceof Error ? error.message : 'Failed to add XP'
      };
    }
  }

  /**
   * Core XP addition logic with comprehensive validation and tracking (INTERNAL USE)
   * 
   * @param amount Amount of XP to add
   * @param options XP addition configuration
   * @returns Transaction result with level changes
   */
  private static async performXPAddition(amount: number, options: XPAdditionOptions): Promise<XPTransactionResult> {
    // Queue this operation to prevent race conditions
    return new Promise((resolve, reject) => {
      this.operationQueue = this.operationQueue.then(async () => {
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
              error: i18next.t('gamification.validation.xpMustBePositive')
            };
          }

          // Get current state (thread-safe within queue)
          const previousTotalXP = await this.getTotalXP();
          const previousLevel = getCurrentLevel(previousTotalXP);

          return await this.performXPAdditionInternal(amount, options, previousTotalXP, previousLevel);
        } catch (error) {
          throw error;
        }
      }).then(resolve).catch(reject);
    });
  }

  /**
   * Internal XP addition logic (called within operationQueue)
   */
  private static async performXPAdditionInternal(amount: number, options: XPAdditionOptions, previousTotalXP: number, previousLevel: number): Promise<XPTransactionResult> {
    try {
      // Apply anti-spam and balance validation
      const isTestEnvironment = typeof jest !== 'undefined' || process.env.NODE_ENV === 'test';
      
      if (!options.skipLimits && !isTestEnvironment) {
        console.log(`🔍 Validating XP addition: ${amount} from ${options.source}`);
        const validationResult = await this.validateXPAddition(amount, options.source, options);
        console.log(`📊 Validation result:`, validationResult);
        
        if (!validationResult.isValid) {
          console.log(`❌ XP validation failed: ${validationResult.reason}`);
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
        console.log(`✅ XP validation passed: amount adjusted to ${amount}`);
      } else {
        console.log(`⚡ Skipping XP validation (test environment or skipLimits=true)`);
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

      // Update total XP (thread-safe within queue)
      const newTotalXP = previousTotalXP + finalAmount;
      const newLevel = getCurrentLevel(newTotalXP);
      console.log(`💰 Updating total XP: ${previousTotalXP} + ${finalAmount} = ${newTotalXP}`);


      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation - ACID transaction

        const db = getDatabase();
        const timestamp = Date.now();
        const todayDate = today();

        await db.execAsync('BEGIN TRANSACTION');

        try {
          // 1. INSERT XP transaction
          await db.runAsync(
            `INSERT INTO xp_transactions (
              id, amount, source, source_id, timestamp, description, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              transaction.id,
              transaction.amount,
              transaction.source,
              transaction.sourceId || null,
              timestamp,
              transaction.description || null,
              options.metadata ? JSON.stringify(options.metadata) : null,
            ]
          );

          // 2. UPSERT xp_state (INSERT OR REPLACE handles both fresh install and existing row)
          await db.runAsync(
            'INSERT OR REPLACE INTO xp_state (id, total_xp, current_level, last_activity, updated_at) VALUES (1, ?, ?, ?, ?)',
            [newTotalXP, newLevel, timestamp, timestamp]
          );

          // 3. UPDATE daily summary (UPSERT)
          // NOTE: lowercase-aware mapping (see getDailySummaryColumn). Sources
          // without a dedicated column (monthly challenge, loyalty, ...) still
          // count toward total_xp — TOTAL_DAILY_MAX is an absolute daily cap
          // across all sources (technical-guides:Gamification-Core.md).
          const sourceColumn = this.getDailySummaryColumn(options.source);

          if (sourceColumn) {
            await db.runAsync(
              `INSERT INTO xp_daily_summary (date, total_xp, ${sourceColumn}, transaction_count, updated_at)
               VALUES (?, ?, ?, 1, ?)
               ON CONFLICT(date) DO UPDATE SET
                 total_xp = total_xp + ?,
                 ${sourceColumn} = ${sourceColumn} + ?,
                 transaction_count = transaction_count + 1,
                 updated_at = ?`,
              [todayDate, finalAmount, finalAmount, timestamp, finalAmount, finalAmount, timestamp]
            );
          } else {
            await db.runAsync(
              `INSERT INTO xp_daily_summary (date, total_xp, transaction_count, updated_at)
               VALUES (?, ?, 1, ?)
               ON CONFLICT(date) DO UPDATE SET
                 total_xp = total_xp + ?,
                 transaction_count = transaction_count + 1,
                 updated_at = ?`,
              [todayDate, finalAmount, timestamp, finalAmount, timestamp]
            );
          }

          await db.execAsync('COMMIT');
          console.log(`✅ XP saved to SQLite (ACID): ${newTotalXP}, Level ${newLevel}`);

          // Update cache for optimistic reads (for smooth UI animations)
          this.cachedXPData = {
            totalXP: newTotalXP,
            level: newLevel,
            timestamp: Date.now()
          };

          // Invalidate daily XP data cache — fresh read on next validateXPAddition call
          this.dailyXPDataCache.delete(todayDate);

        } catch (error) {
          await db.execAsync('ROLLBACK');
          console.error('SQLite transaction failed, rolled back:', error);
          throw error;
        }
      } else {
        // Legacy AsyncStorage implementation
        await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_XP, newTotalXP.toString());
        console.log(`📝 XP saved to AsyncStorage: ${newTotalXP}`);

        // Save transaction
        await this.saveTransaction(transaction);

        // Update tracking data with anti-spam tracking
        await this.updateDailyXPTracking(finalAmount, options.source, options.sourceId);

        // Invalidate daily XP data cache (legacy path)
        this.dailyXPDataCache.delete(today());
      }

      // Legacy lifetime tracking in AsyncStorage — fire-and-forget (audit 8.3).
      // Writing these synchronously blocks addXP return by ~40–100ms per tap.
      // Readers are non-real-time (Profile/Stats screens, analytics) — 200ms lag invisible.
      // SQLite xp_state/xp_daily_summary are already committed above → monthly challenges
      // and progress tracker read fresh data from SQLite, not from these AsyncStorage fields.
      void (async () => {
        try {
          await this.updateXPBySource(options.source, finalAmount);
          await this.updateLastActivity();
        } catch (err) {
          console.error('[GamificationService] Background XP-bySource/lastActivity update failed:', err);
        }
      })();

      // Check for level up
      const leveledUp = newLevel > previousLevel;
      const milestoneReached = leveledUp && isLevelMilestone(newLevel);

      // Get level-up information if leveled up
      let levelUpInfo: XPTransactionResult['levelUpInfo'] = undefined;
      if (leveledUp) {
        const levelInfo = getLevelInfo(newLevel);
        const levelUpData = {
          newLevelTitle: levelInfo.title,
          newLevelDescription: levelInfo.description || '',
          isMilestone: levelInfo.isMilestone,
        } as const;
        
        if (levelInfo.rewards) {
          levelUpInfo = { ...levelUpData, rewards: levelInfo.rewards };
        } else {
          levelUpInfo = levelUpData;
        }

        // Store level-up event in history
        await GamificationService.storeLevelUpEvent(newLevel, previousLevel, newTotalXP, transaction.source);
      }

      // Handle notifications and animations (if not skipped)
      if (!options.skipNotification) {
        await GamificationService.queueXPNotification(transaction, leveledUp, milestoneReached);
        
        // Trigger XP popup animation via event system
        GamificationService.triggerXPAnimation(finalAmount, options.source, options.sourceId, options.metadata, options.metadata?.position);
      }

      // 🚀 FIRE-AND-FORGET: Achievement check runs in background, doesn't block XP return
      // Deferred to idle time so it never competes with running UI work (animations,
      // gestures) — eliminates stutter on rapid habit taps. requestIdleCallback replaces
      // the deprecated InteractionManager (RN deprecation warning, July 2026);
      // setTimeout is the fallback for engines without it.
      if (typeof jest === 'undefined' && process.env.NODE_ENV !== 'test') {
        const scheduleIdle: (cb: () => void) => void =
          typeof requestIdleCallback === 'function'
            ? (cb) => requestIdleCallback(cb)
            : (cb) => setTimeout(cb, 0);

        scheduleIdle(() => {
          import('./achievementService').then(({ AchievementService }) => {
            AchievementService.checkAchievementsAfterXPAction(
              options.source,
              finalAmount,
              options.sourceId,
              options.metadata
            ).catch(error => {
              console.error('Achievement check after XP action failed:', error);
            });
          }).catch(error => {
            console.error('Achievement service import failed:', error);
          });
        });
      }

      // Return comprehensive result
      const result: XPTransactionResult = {
        success: true,
        xpGained: finalAmount,
        totalXP: newTotalXP,
        previousLevel,
        newLevel,
        leveledUp,
        milestoneReached,
        transaction
      };
      
      if (levelUpInfo) {
        result.levelUpInfo = levelUpInfo;
      }
      
      // Log the XP addition
      console.log(`💰 XP added: +${finalAmount} XP from ${options.source} (${previousTotalXP} → ${newTotalXP})`);
      if (leveledUp) {
        const levelsGained = newLevel - previousLevel;
        console.log(`🎉 Level up! ${previousLevel} → ${newLevel} (${levelsGained} level${levelsGained > 1 ? 's' : ''})`);

        // Only emit levelUp events if notifications are not skipped.
        // When skipNotification=true (e.g. achievement_unlock), the caller (achievementService)
        // is responsible for emitting levelUp after achievement modals are coordinated.
        if (!options.skipNotification) {
          for (let level = previousLevel + 1; level <= newLevel; level++) {
            const levelInfo = getLevelInfo(level);
            const prevLevelForThisStep = level - 1;

            const levelUpEventData = {
              newLevel: level,
              previousLevel: prevLevelForThisStep,
              levelTitle: levelInfo.title,
              levelDescription: levelInfo.description || '',
              isMilestone: levelInfo.isMilestone,
              timestamp: Date.now() + (level - previousLevel - 1) * 100
            };

            DeviceEventEmitter.emit('levelUp', levelUpEventData);
          }
        }
      }
      
      return result;

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
   * Subtract XP (for reversing actions like un-completing habits)
   */
  static async subtractXP(amount: number, options: XPAdditionOptions): Promise<XPTransactionResult> {
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
          error: i18next.t('gamification.validation.xpSubtractMustBePositive')
        };
      }

      const currentTotalXP = await this.getTotalXP();
      const previousLevel = getCurrentLevel(currentTotalXP);
      
      // Create negative XP transaction
      const transaction: XPTransaction = {
        id: `xp_subtract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: -amount, // Negative amount for subtraction
        source: options.source,
        ...(options.sourceId && { sourceId: options.sourceId }),
        description: options.description || `Subtracted ${amount} XP from ${options.source}`,
        date: today(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Calculate new total (ensure it doesn't go below 0)
      const newTotalXP = Math.max(0, currentTotalXP - amount);
      const newLevel = getCurrentLevel(newTotalXP);
      const leveledDown = newLevel < previousLevel;


      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation - ACID transaction for subtraction

        const db = getDatabase();
        const timestamp = Date.now();
        const todayDate = today();

        await db.execAsync('BEGIN TRANSACTION');

        try {
          // 1. INSERT negative XP transaction
          await db.runAsync(
            `INSERT INTO xp_transactions (
              id, amount, source, source_id, timestamp, description, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              transaction.id,
              transaction.amount, // Already negative
              transaction.source,
              transaction.sourceId || null,
              timestamp,
              transaction.description || null,
              options.metadata ? JSON.stringify(options.metadata) : null,
            ]
          );

          // 2. UPDATE xp_state with new total
          await db.runAsync(
            'UPDATE xp_state SET total_xp = ?, current_level = ?, last_activity = ?, updated_at = ? WHERE id = 1',
            [newTotalXP, newLevel, timestamp, timestamp]
          );

          // 3. UPDATE daily summary (subtract from totals)
          // NOTE: lowercase-aware mapping (see getDailySummaryColumn).
          const sourceColumn = this.getDailySummaryColumn(options.source);

          if (sourceColumn) {
            await db.runAsync(
              `UPDATE xp_daily_summary SET
                total_xp = MAX(0, total_xp - ?),
                ${sourceColumn} = MAX(0, ${sourceColumn} - ?),
                transaction_count = MAX(0, transaction_count - 1),
                updated_at = ?
              WHERE date = ?`,
              [amount, amount, timestamp, todayDate]
            );
          } else {
            await db.runAsync(
              `UPDATE xp_daily_summary SET
                total_xp = MAX(0, total_xp - ?),
                transaction_count = MAX(0, transaction_count - 1),
                updated_at = ?
              WHERE date = ?`,
              [amount, timestamp, todayDate]
            );
          }

          await db.execAsync('COMMIT');
          console.log(`✅ XP subtracted via SQLite (ACID): ${currentTotalXP} → ${newTotalXP}`);

          // Update cache for optimistic reads
          this.cachedXPData = {
            totalXP: newTotalXP,
            level: newLevel,
            timestamp: Date.now()
          };

          // Invalidate daily XP data cache — fresh read on next validateXPAddition call
          this.dailyXPDataCache.delete(todayDate);

        } catch (error) {
          await db.execAsync('ROLLBACK');
          console.error('SQLite subtraction transaction failed, rolled back:', error);
          throw error;
        }
      } else {
        // Legacy AsyncStorage implementation
        await this.saveTransaction(transaction);
        await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_XP, newTotalXP.toString());
        await this.updateDailyXPTracking(-amount, options.source, options.sourceId);

        // Invalidate daily XP data cache (legacy path)
        this.dailyXPDataCache.delete(today());
      }

      // Legacy lifetime tracking in AsyncStorage — fire-and-forget (audit 8.3).
      void (async () => {
        try {
          await this.updateXPBySource(options.source, -amount);
        } catch (err) {
          console.error('[GamificationService] Background XP-bySource update failed (subtraction):', err);
        }
      })();

      // Log the subtraction
      console.log(`💸 XP subtracted: -${amount} XP from ${options.source} (${currentTotalXP} → ${newTotalXP})`);
      if (leveledDown) {
        console.log(`📉 Level decreased: ${previousLevel} → ${newLevel}`);
      }

      // Trigger visual feedback for XP loss (red/negative animation)
      if (!options.skipNotification) {
        GamificationService.triggerXPAnimation(-amount, options.source, options.sourceId, options.metadata, options.metadata?.position);
      }

      return {
        success: true,
        xpGained: -amount,
        totalXP: newTotalXP,
        previousLevel,
        newLevel,
        leveledUp: false,
        milestoneReached: false,
        transaction
      };

    } catch (error) {
      console.error('GamificationService.subtractXP error:', error);
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

  // ========================================
  // OPTIMISTIC UPDATES SYSTEM
  // ========================================

  /**
   * Add XP with optimistic updates for real-time UI feedback (60fps performance)
   * 
   * This method implements the performance patterns from OptimizedGamificationContext:
   * 1. Immediate UI update (optimistic)
   * 2. Background XP operation
   * 3. Correction if needed
   * 4. Debounced background sync
   * 
   * @param amount Amount of XP to add
   * @param options Enhanced XP addition configuration with optimistic updates
   * @returns Enhanced transaction result with performance metrics
   */
  static async addXPOptimized(amount: number, options: OptimizedXPAdditionOptions): Promise<OptimizedXPTransactionResult> {
    const startTime = performance.now();
    let optimisticUpdateTime: number | undefined;
    let backgroundSyncTime: number | undefined;
    let wasOptimistic = false;
    let correctionApplied = false;
    let optimisticTotalXP: number | undefined; // Declare in outer scope for error handling

    try {
      this.performanceMetrics.operationCount++;
      
      // STEP 1: Immediate optimistic UI update (if enabled)
      if (options.enableOptimistic !== false) { // Default to true
        const optimisticStart = performance.now();
        
        // Get cached or current XP total for optimistic calculation
        const currentXP = await this.getCachedTotalXP();
        optimisticTotalXP = currentXP + amount;
        const optimisticLevel = getCurrentLevel(optimisticTotalXP);
        
        // Trigger immediate UI callback
        if (options.onOptimisticUpdate) {
          options.onOptimisticUpdate(optimisticTotalXP, optimisticLevel);
        }
        
        // Update cached data for future optimistic operations
        this.updateCachedXPData(optimisticTotalXP, optimisticLevel);
        
        optimisticUpdateTime = performance.now() - optimisticStart;
        wasOptimistic = true;
        this.performanceMetrics.optimisticUpdateCount++;
        
        console.log(`⚡ OPTIMISTIC UPDATE: ${currentXP} + ${amount} = ${optimisticTotalXP} XP (${optimisticUpdateTime.toFixed(2)}ms)`);
      }

      // STEP 2: Trigger immediate XP animation
      if (!options.skipNotification) {
        this.triggerXPAnimation(amount, options.source, options.sourceId, options.metadata, options.position);
      }

      // STEP 3: Background XP operation with full validation
      const backgroundStart = performance.now();
      const actualResult = await this.performXPAddition(amount, options);
      backgroundSyncTime = performance.now() - backgroundStart;
      
      if (!actualResult.success) {
        // STEP 3a: Revert optimistic update on failure
        if (wasOptimistic && optimisticTotalXP !== undefined) {
          const revertedXP = optimisticTotalXP - amount;
          const revertedLevel = getCurrentLevel(revertedXP);
          
          if (options.onOptimisticUpdate) {
            options.onOptimisticUpdate(revertedXP, revertedLevel);
          }
          
          this.updateCachedXPData(revertedXP, revertedLevel);
          console.log(`🔄 Reverted optimistic update due to failure: ${optimisticTotalXP} → ${revertedXP}`);
        }
        
        // Return failure result with performance metrics
        const totalTime = performance.now() - startTime;
        this.updatePerformanceMetrics(totalTime);
        
        return {
          ...actualResult,
          operationTime: totalTime,
          optimisticUpdateTime,
          backgroundSyncTime,
          wasOptimistic,
          correctionApplied: false,
        };
      }

      // STEP 4: Check if correction is needed
      if (wasOptimistic && optimisticTotalXP !== undefined && actualResult.totalXP !== optimisticTotalXP) {
        console.log(`🔧 Optimistic correction needed: ${optimisticTotalXP} → ${actualResult.totalXP}`);
        
        const correctedLevel = getCurrentLevel(actualResult.totalXP);
        if (options.onOptimisticUpdate) {
          options.onOptimisticUpdate(actualResult.totalXP, correctedLevel);
        }
        
        this.updateCachedXPData(actualResult.totalXP, correctedLevel);
        correctionApplied = true;
        this.performanceMetrics.correctionCount++;
      }

      // STEP 5: Schedule debounced background sync for consistency verification
      this.scheduleBackgroundSync();

      // STEP 6: Handle background completion callback
      if (options.onBackgroundComplete) {
        // Use setTimeout to ensure callback is non-blocking
        setTimeout(() => {
          if (options.onBackgroundComplete) {
            options.onBackgroundComplete(actualResult);
          }
        }, 0);
      }

      // STEP 7: Calculate final performance metrics
      const totalTime = performance.now() - startTime;
      this.updatePerformanceMetrics(totalTime);
      
      console.log(`✅ OPTIMIZED XP operation completed: ${totalTime.toFixed(2)}ms total (optimistic: ${optimisticUpdateTime?.toFixed(2)}ms, background: ${backgroundSyncTime.toFixed(2)}ms)`);

      return {
        ...actualResult,
        operationTime: totalTime,
        optimisticUpdateTime,
        backgroundSyncTime,
        wasOptimistic,
        correctionApplied,
      };

    } catch (error) {
      console.error('GamificationService.addXPOptimized error:', error);
      
      // Revert optimistic update on error
      if (wasOptimistic && optimisticTotalXP !== undefined) {
        const revertedXP = optimisticTotalXP - amount;
        const revertedLevel = getCurrentLevel(revertedXP);
        
        if (options.onOptimisticUpdate) {
          options.onOptimisticUpdate(revertedXP, revertedLevel);
        }
        
        this.updateCachedXPData(revertedXP, revertedLevel);
      }

      const totalTime = performance.now() - startTime;
      this.updatePerformanceMetrics(totalTime);

      // Return error result with performance metrics
      const currentXP = await this.getTotalXP();
      return {
        success: false,
        xpGained: 0,
        totalXP: currentXP,
        previousLevel: getCurrentLevel(currentXP),
        newLevel: getCurrentLevel(currentXP),
        leveledUp: false,
        milestoneReached: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        operationTime: totalTime,
        optimisticUpdateTime,
        backgroundSyncTime,
        wasOptimistic,
        correctionApplied: false,
      };
    }
  }

  /**
   * Get user's total accumulated XP
   */
  static async getTotalXP(): Promise<number> {
    try {

      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation - query xp_state table

        const db = getDatabase();

        const result = await db.getFirstAsync<{ total_xp: number }>(
          'SELECT total_xp FROM xp_state WHERE id = 1'
        );

        return result?.total_xp || 0;
      } else {
        // Legacy AsyncStorage implementation
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_XP);
        if (!stored) return 0;

        const parsed = parseFloat(stored);
        // Safety check: if parseFloat returns NaN, default to 0
        return isNaN(parsed) ? 0 : parsed;
      }
    } catch (error) {
      console.error('GamificationService.getTotalXP error:', error);
      return 0;
    }
  }

  /**
   * PRODUCTION READINESS: Cleanup old duplicate level-up records for memory optimization
   */
  static async cleanupDuplicateLevelUpRecords(): Promise<void> {
    try {
      console.log('🧹 Starting cleanup of duplicate level-up records...');
      
      const allTransactions = await this.getAllTransactions();
      const originalCount = allTransactions.length;
      
      if (originalCount === 0) {
        console.log('📝 No transactions to cleanup');
        return;
      }
      
      console.log(`📊 Analyzing ${originalCount} transactions for duplicates...`);
      
      // Group level-up related transactions by date and level change
      const levelUpGroups = new Map<string, XPTransaction[]>();
      const nonLevelUpTransactions: XPTransaction[] = [];
      
      for (const transaction of allTransactions) {
        // Check if transaction is related to level progression (could indicate level-up)
        const isLevelUpRelated = transaction.description?.toLowerCase().includes('level') ||
                                transaction.source === XPSourceType.ACHIEVEMENT_UNLOCK ||
                                transaction.amount >= 100; // High XP amounts often trigger level-ups
        
        if (isLevelUpRelated) {
          const groupKey = `${transaction.date}_${Math.floor(transaction.amount / 50)}`; // Group by date and XP range
          
          if (!levelUpGroups.has(groupKey)) {
            levelUpGroups.set(groupKey, []);
          }
          levelUpGroups.get(groupKey)!.push(transaction);
        } else {
          nonLevelUpTransactions.push(transaction);
        }
      }
      
      // For each group, keep only the most recent transaction
      const cleanedLevelUpTransactions: XPTransaction[] = [];
      let duplicatesRemoved = 0;
      
      for (const [groupKey, transactions] of levelUpGroups.entries()) {
        if (transactions.length > 1) {
          // Sort by creation time and keep the most recent
          transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const mostRecent = transactions[0];
          if (mostRecent) {
            cleanedLevelUpTransactions.push(mostRecent); // Keep most recent
          }
          duplicatesRemoved += transactions.length - 1;
          
          console.log(`🔄 Group ${groupKey}: Removed ${transactions.length - 1} duplicates, kept most recent`);
        } else if (transactions[0]) {
          cleanedLevelUpTransactions.push(transactions[0]);
        }
      }
      
      // Combine cleaned level-up transactions with other transactions
      const finalTransactions = [...nonLevelUpTransactions, ...cleanedLevelUpTransactions];
      
      // Sort by creation time to maintain chronological order
      finalTransactions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // Save cleaned transactions back to storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.XP_TRANSACTIONS, 
        JSON.stringify(finalTransactions)
      );
      
      const finalCount = finalTransactions.length;
      const totalRemoved = originalCount - finalCount;
      
      console.log(`✅ Cleanup completed:`, {
        originalTransactions: originalCount,
        duplicatesRemoved,
        totalRemoved,
        finalTransactions: finalCount,
        memoryFreed: `~${Math.round(totalRemoved * 0.5)}KB estimated`
      });
      
      // Enhanced logging for production debugging
      console.log(`📊 Memory Cleanup Results:`, {
        event: 'DUPLICATE_CLEANUP_COMPLETE',
        originalCount,
        finalCount,
        duplicatesRemoved,
        totalRemoved,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('🚨 Cleanup of duplicate level-up records failed:', error instanceof Error ? error.message : String(error));
      console.log('📱 App continues to function normally, cleanup will retry on next launch');
      
      // GRACEFUL DEGRADATION: Cleanup failure doesn't break app functionality
      console.log(`📊 Memory Cleanup Results:`, {
        event: 'DUPLICATE_CLEANUP_ERROR',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Clear all gamification data (for testing purposes)
   */
  static async clearAllData(): Promise<void> {
    try {

      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation — reset transactions, daily summaries and state.
        // (Previously only legacy AsyncStorage keys were removed, so a "reset"
        // left all SQLite gamification data intact.)
        const db = getDatabase();
        const ts = Date.now();

        await db.execAsync('BEGIN TRANSACTION');
        try {
          await db.execAsync('DELETE FROM xp_transactions');
          await db.execAsync('DELETE FROM xp_daily_summary');
          await db.runAsync(
            'INSERT OR REPLACE INTO xp_state (id, total_xp, current_level, last_activity, updated_at) VALUES (1, 0, ?, ?, ?)',
            [getCurrentLevel(0), ts, ts]
          );
          await db.execAsync('COMMIT');
        } catch (error) {
          await db.execAsync('ROLLBACK');
          throw error;
        }

        // Invalidate in-memory caches
        this.cachedXPData = null;
        this.dailyXPDataCache.clear();
      }

      // Always clear legacy AsyncStorage keys as well (lifetime tracking etc.)
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOTAL_XP,
        STORAGE_KEYS.XP_TRANSACTIONS,
        // Note: LEVEL_DATA, CURRENT_BATCH, LAST_BATCH_TIME might not exist in STORAGE_KEYS
        // Using literal strings as fallback
        'gamification_level_data',
        'gamification_current_batch',
        'gamification_last_batch_time',
      ]);

      // Reset internal state
      // Note: currentBatch and batchStartTime might not exist as class properties
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }

      console.log('🗑️ All gamification data cleared');
    } catch (error) {
      console.error('GamificationService.clearAllData error:', error);
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
        xpInCurrentLevel: progress.xpInCurrentLevel,
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
        xpInCurrentLevel: 0,
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
   * Map an XP source to its xp_daily_summary column.
   *
   * IMPORTANT: XPSourceType values are lowercase strings ('habit_completion',
   * 'journal_entry', ...). A previous implementation used
   * `source.includes('HABIT')` which never matched (case-sensitive) and left
   * xp_daily_summary empty for habit/journal/goal XP — silently disabling
   * daily XP limits. Keep this check lowercase.
   */
  private static getDailySummaryColumn(
    source: XPSourceType
  ): 'habit_xp' | 'journal_xp' | 'goal_xp' | 'achievement_xp' | null {
    if (source.startsWith('habit_')) return 'habit_xp';
    if (source.startsWith('journal_')) return 'journal_xp';
    if (source.startsWith('goal_')) return 'goal_xp';
    if (source === XPSourceType.ACHIEVEMENT_UNLOCK) return 'achievement_xp';
    return null;
  }

  /**
   * Map a SQLite xp_transactions row to the XPTransaction shape used app-wide.
   * `date` is derived from the timestamp in LOCAL time, consistent with
   * `today()` and with the DATE(..., 'localtime') SQL filters.
   */
  private static mapTransactionRow(row: {
    id: string;
    amount: number;
    source: string;
    source_id: string | null;
    timestamp: number;
    description: string | null;
  }): XPTransaction {
    const createdAt = new Date(row.timestamp);
    const transaction: XPTransaction = {
      id: row.id,
      amount: row.amount,
      source: row.source as XPSourceType,
      description: row.description ?? '',
      date: formatDateToString(createdAt),
      createdAt,
      updatedAt: createdAt,
    };
    if (row.source_id) {
      transaction.sourceId = row.source_id;
    }
    return transaction;
  }

  /**
   * Save XP transaction with rollback capability
   */
  private static async saveTransaction(transaction: XPTransaction): Promise<void> {
    try {

      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation - INSERT transaction

        const db = getDatabase();

        const timestamp = transaction.createdAt instanceof Date
          ? transaction.createdAt.getTime()
          : typeof transaction.createdAt === 'number'
            ? transaction.createdAt
            : new Date(transaction.createdAt).getTime();

        await db.runAsync(
          `INSERT INTO xp_transactions (
            id, amount, source, source_id, timestamp, description
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            transaction.id,
            transaction.amount,
            transaction.source,
            transaction.sourceId || null,
            timestamp,
            transaction.description || null,
          ]
        );
      } else {
        // Legacy AsyncStorage implementation
        const transactions = await this.getAllTransactions();
        transactions.push(transaction);

        // Keep only last 1000 transactions for performance
        const trimmedTransactions = transactions.slice(-1000);

        await AsyncStorage.setItem(
          STORAGE_KEYS.XP_TRANSACTIONS,
          JSON.stringify(trimmedTransactions)
        );
      }
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

      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation — single source of truth with the write path.
        // (Previously this method always read the legacy AsyncStorage store,
        // while writes went to SQLite — achievements and activity baselines
        // were computed from frozen/empty data.)
        const db = getDatabase();
        const rows = await db.getAllAsync<{
          id: string;
          amount: number;
          source: string;
          source_id: string | null;
          timestamp: number;
          description: string | null;
        }>(
          `SELECT id, amount, source, source_id, timestamp, description
           FROM xp_transactions
           ORDER BY timestamp ASC, rowid ASC`
        );
        return rows.map(row => this.mapTransactionRow(row));
      }

      // Legacy AsyncStorage implementation
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

      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation — filter in SQL instead of loading everything.
        // Local-time date derivation matches mapTransactionRow / today().
        const db = getDatabase();
        const rows = await db.getAllAsync<{
          id: string;
          amount: number;
          source: string;
          source_id: string | null;
          timestamp: number;
          description: string | null;
        }>(
          `SELECT id, amount, source, source_id, timestamp, description
           FROM xp_transactions
           WHERE DATE(timestamp / 1000, 'unixepoch', 'localtime') BETWEEN ? AND ?
           ORDER BY timestamp ASC, rowid ASC`,
          [startDate, endDate]
        );
        return rows.map(row => this.mapTransactionRow(row));
      }

      // Legacy AsyncStorage implementation
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

      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation — ACID rollback of the most recent transaction.
        // (Previously this method edited the legacy AsyncStorage store while
        // getTotalXP read from SQLite, making rollback a silent no-op.)
        const db = getDatabase();

        const last = await db.getFirstAsync<{
          id: string;
          amount: number;
          source: string;
          timestamp: number;
        }>(
          `SELECT id, amount, source, timestamp
           FROM xp_transactions
           ORDER BY timestamp DESC, rowid DESC
           LIMIT 1`
        );
        if (!last) return false;

        const ts = Date.now();
        const txDate = formatDateToString(new Date(last.timestamp));
        const sourceColumn = this.getDailySummaryColumn(last.source as XPSourceType);

        await db.execAsync('BEGIN TRANSACTION');
        try {
          // 1. Remove the transaction
          await db.runAsync('DELETE FROM xp_transactions WHERE id = ?', [last.id]);

          // 2. Reverse total XP + level
          const state = await db.getFirstAsync<{ total_xp: number }>(
            'SELECT total_xp FROM xp_state WHERE id = 1'
          );
          const newTotal = Math.max(0, (state?.total_xp || 0) - last.amount);
          const newLevel = getCurrentLevel(newTotal);
          await db.runAsync(
            'INSERT OR REPLACE INTO xp_state (id, total_xp, current_level, last_activity, updated_at) VALUES (1, ?, ?, ?, ?)',
            [newTotal, newLevel, ts, ts]
          );

          // 3. Reverse the daily summary for the transaction's local date
          if (sourceColumn) {
            await db.runAsync(
              `UPDATE xp_daily_summary SET
                total_xp = MAX(0, total_xp - ?),
                ${sourceColumn} = MAX(0, ${sourceColumn} - ?),
                transaction_count = MAX(0, transaction_count - 1),
                updated_at = ?
              WHERE date = ?`,
              [last.amount, last.amount, ts, txDate]
            );
          } else {
            await db.runAsync(
              `UPDATE xp_daily_summary SET
                total_xp = MAX(0, total_xp - ?),
                transaction_count = MAX(0, transaction_count - 1),
                updated_at = ?
              WHERE date = ?`,
              [last.amount, ts, txDate]
            );
          }

          await db.execAsync('COMMIT');
        } catch (error) {
          await db.execAsync('ROLLBACK');
          throw error;
        }

        // Invalidate caches so the next read reflects the rollback
        this.cachedXPData = null;
        this.dailyXPDataCache.delete(txDate);

        // Keep legacy lifetime tracking roughly in sync (fire-and-forget)
        void this.rollbackXPBySource(last.source as XPSourceType, last.amount);

        return true;
      }

      // Legacy AsyncStorage implementation
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
   * Validate XP addition against limits and anti-spam rules.
   *
   * N28 (July 2026): the decision logic lives in the PURE module
   * `src/services/gamification/xpLimits.ts` — this façade only fetches the
   * daily snapshot + active multiplier and delegates. Rules changes belong
   * in the module (unit-tested in isolation), not here.
   *
   * NOTE: Journal position-based XP is intentionally NOT validated here —
   * gratitudeStorage.getXPForJournalEntry() computes it from real entry
   * positions (duplicating it here caused desync bugs).
   */
  private static async validateXPAddition(
    amount: number,
    source: XPSourceType,
    options?: XPAdditionOptions
  ): Promise<{ isValid: boolean; allowedAmount: number; reason?: string }> {
    try {
      const { validateXPAddition } = require('./gamification/xpLimits') as typeof import('./gamification/xpLimits');

      const dailyData = await this.getDailyXPData();
      const multiplierData = await this.getActiveXPMultiplier();

      // Rate limiting is disabled in test environments (kept out of the pure
      // module so the rule itself stays unit-testable).
      const isTestEnvironment = typeof jest !== 'undefined' || process.env.NODE_ENV === 'test';

      return validateXPAddition({
        amount,
        source,
        sourceId: options?.sourceId,
        dailyData,
        multiplier: { isActive: multiplierData.isActive, multiplier: multiplierData.multiplier },
        skipRateLimit: isTestEnvironment,
      });
    } catch (error) {
      console.error('GamificationService.validateXPAddition error:', error);
      return { isValid: false, allowedAmount: 0, reason: 'Validation error' };
    }
  }

  // ========================================
  // LEVEL-UP EVENT TRACKING
  // ========================================

  // N28 (July 2026): the level-up event store lives in
  // `src/services/gamification/levelUpEvents.ts` (LevelUpEventStore).
  // These façade methods preserve the public static API — consumers must
  // not need to change. New level-up logic belongs in the module.

  /**
   * Store level-up event for analytics and history (delegates to module)
   */
  private static async storeLevelUpEvent(
    newLevel: number,
    previousLevel: number,
    totalXP: number,
    triggerSource: XPSourceType
  ): Promise<void> {
    const { LevelUpEventStore } = require('./gamification/levelUpEvents') as typeof import('./gamification/levelUpEvents');
    return LevelUpEventStore.storeLevelUpEvent(newLevel, previousLevel, totalXP, triggerSource);
  }

  /** Get level-up history with legacy data migration (delegates to module) */
  static async getLevelUpHistory(): Promise<LevelUpEvent[]> {
    const { LevelUpEventStore } = require('./gamification/levelUpEvents') as typeof import('./gamification/levelUpEvents');
    return LevelUpEventStore.getLevelUpHistory();
  }

  /** Get recent unshown level-ups (delegates to module) */
  static async getRecentLevelUps(count: number = 5): Promise<LevelUpEvent[]> {
    const { LevelUpEventStore } = require('./gamification/levelUpEvents') as typeof import('./gamification/levelUpEvents');
    return LevelUpEventStore.getRecentLevelUps(count);
  }

  /** Mark a level-up event as shown (delegates to module) */
  static async markLevelUpAsShown(levelUpId: string): Promise<boolean> {
    const { LevelUpEventStore } = require('./gamification/levelUpEvents') as typeof import('./gamification/levelUpEvents');
    return LevelUpEventStore.markLevelUpAsShown(levelUpId);
  }

  /** Debug utility: clear failed level-up tracking (delegates to module) */
  static clearFailedLevelUpTracking(): void {
    const { LevelUpEventStore } = require('./gamification/levelUpEvents') as typeof import('./gamification/levelUpEvents');
    LevelUpEventStore.clearFailedLevelUpTracking();
  }

  /** Debug utility: level-up status snapshot (delegates to module) */
  static async debugLevelUpStatus(): Promise<{
    totalHistory: number;
    unshownCount: number;
    failedTrackingCount: number;
    recentLevelUps: Array<{
      id: string;
      level: number;
      shown: boolean;
      failedTracked: boolean;
    }>;
  }> {
    const { LevelUpEventStore } = require('./gamification/levelUpEvents') as typeof import('./gamification/levelUpEvents');
    return LevelUpEventStore.debugLevelUpStatus();
  }

  // ========================================
  // TRACKING & ANALYTICS
  // ========================================

  /**
   * Update daily XP tracking data with anti-spam tracking
   */
  private static async updateDailyXPTracking(
    amount: number,
    source: XPSourceType,
    goalId?: string
  ): Promise<void> {
    try {

      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation - UPDATE xp_daily_summary with UPSERT

        const db = getDatabase();
        const todayDate = today();
        const timestamp = Date.now();

        // Determine which column to update based on source
        // NOTE: lowercase-aware mapping (see getDailySummaryColumn).
        const sourceColumn = this.getDailySummaryColumn(source);

        if (sourceColumn) {
          // UPSERT: Insert new row or update existing
          await db.runAsync(
            `INSERT INTO xp_daily_summary (date, total_xp, ${sourceColumn}, transaction_count, updated_at)
             VALUES (?, ?, ?, 1, ?)
             ON CONFLICT(date) DO UPDATE SET
               total_xp = total_xp + ?,
               ${sourceColumn} = ${sourceColumn} + ?,
               transaction_count = transaction_count + 1,
               updated_at = ?`,
            [todayDate, amount, amount, timestamp, amount, amount, timestamp]
          );
        } else {
          await db.runAsync(
            `INSERT INTO xp_daily_summary (date, total_xp, transaction_count, updated_at)
             VALUES (?, ?, 1, ?)
             ON CONFLICT(date) DO UPDATE SET
               total_xp = total_xp + ?,
               transaction_count = transaction_count + 1,
               updated_at = ?`,
            [todayDate, amount, timestamp, amount, timestamp]
          );
        }

        // Anti-spam tracking is handled by queries in getDailyXPData()
        // No need to maintain separate counters
        if (amount > 0) {
          if (source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS) {
            console.log(`📊 Journal entry tracked in xp_transactions`);
          }
          if (goalId && (source === XPSourceType.GOAL_PROGRESS || source === XPSourceType.GOAL_MILESTONE)) {
            console.log(`🎯 Goal XP tracked in xp_transactions for goal ${goalId}`);
          }
        }
      } else {
        // Legacy AsyncStorage implementation
        const dailyData = await this.getDailyXPData();

        // Update totals, ensuring they don't go negative (daily tracking should never be negative)
        dailyData.totalXP = Math.max(0, dailyData.totalXP + amount);
        dailyData.xpBySource[source] = Math.max(0, (dailyData.xpBySource[source] || 0) + amount);

        // Handle transaction counting and anti-spam tracking for both positive and negative XP
        if (amount > 0) {
          dailyData.transactionCount += 1;

          // Track journal entries for anti-spam (entries 14+ = 0 XP)
          if (source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS) {
            dailyData.journalEntryCount += 1;
            console.log(`📊 Journal entry tracked: ${dailyData.journalEntryCount} entries today`);
          }

          // Track goal transactions for anti-spam (3x/day per goal)
          if (goalId && (
            source === XPSourceType.GOAL_PROGRESS ||
            source === XPSourceType.GOAL_MILESTONE
          )) {
            dailyData.goalTransactions[goalId] = (dailyData.goalTransactions[goalId] || 0) + 1;
            console.log(`🎯 Goal XP tracked: goal ${goalId} has ${dailyData.goalTransactions[goalId]} transactions today`);
          }
        } else if (amount < 0) {
          // Decrease transaction count for negative XP (subtractions)
          dailyData.transactionCount = Math.max(0, dailyData.transactionCount - 1);

          // Track journal entry deletions (reduce counter)
          if (source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS) {
            dailyData.journalEntryCount = Math.max(0, dailyData.journalEntryCount - 1);
            console.log(`📊 Journal entry removed: ${dailyData.journalEntryCount} entries today`);
          }

          // Track goal transaction deletions
          if (goalId && (
            source === XPSourceType.GOAL_PROGRESS ||
            source === XPSourceType.GOAL_MILESTONE
          )) {
            dailyData.goalTransactions[goalId] = Math.max(0, (dailyData.goalTransactions[goalId] || 0) - 1);
            console.log(`🎯 Goal XP removed: goal ${goalId} has ${dailyData.goalTransactions[goalId]} transactions today`);
          }
        }

        dailyData.lastTransactionTime = Date.now();

        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_XP_TRACKING, JSON.stringify(dailyData));
      }
    } catch (error) {
      console.error('GamificationService.updateDailyXPTracking error:', error);
    }
  }

  /**
   * Get today's XP tracking data
   */
  private static async getDailyXPData(): Promise<DailyXPData> {
    try {
      const todayDate = today();
      const cached = this.dailyXPDataCache.get(todayDate);
      if (cached && (Date.now() - cached.ts) < this.DAILY_XP_CACHE_TTL_MS) {
        return cached.data;
      }

      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation - query xp_daily_summary and daily_activity_log

        const db = getDatabase();

        // Get today's summary
        const summary = await db.getFirstAsync<{
          total_xp: number;
          habit_xp: number;
          journal_xp: number;
          goal_xp: number;
          achievement_xp: number;
          transaction_count: number;
        }>('SELECT * FROM xp_daily_summary WHERE date = ?', [todayDate]);

        // Build xpBySource from summary columns (or defaults if no summary yet)
        const xpBySource = this.createEmptyXPBySource();
        if (summary) {
          xpBySource[XPSourceType.HABIT_COMPLETION] = summary.habit_xp;
          xpBySource[XPSourceType.JOURNAL_ENTRY] = summary.journal_xp;
          xpBySource[XPSourceType.GOAL_PROGRESS] = summary.goal_xp;
          xpBySource[XPSourceType.ACHIEVEMENT_UNLOCK] = summary.achievement_xp;
        }

        // Get goal transactions count (for anti-spam)
        // NOTE: stored source values are lowercase XPSourceType strings.
        const goalTransactions: Record<string, number> = {};
        const goalTxRows = await db.getAllAsync<{ source_id: string; count: number }>(
          `SELECT source_id, COUNT(*) as count
           FROM xp_transactions
           WHERE DATE(timestamp / 1000, 'unixepoch', 'localtime') = ?
           AND source LIKE 'goal_%'
           AND source_id IS NOT NULL
           AND amount > 0
           GROUP BY source_id`,
          [todayDate]
        );

        for (const row of goalTxRows) {
          goalTransactions[row.source_id] = row.count;
        }

        // Count journal entries today (anti-spam tracking).
        // Mirrors the legacy path which counted JOURNAL_ENTRY + JOURNAL_BONUS.
        // NOTE: stored source values are lowercase ('journal_entry'); a previous
        // version compared against 'JOURNAL_ENTRY' and always returned 0.
        const journalCount = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count
           FROM xp_transactions
           WHERE DATE(timestamp / 1000, 'unixepoch', 'localtime') = ?
           AND source IN (?, ?)
           AND amount > 0`,
          [todayDate, XPSourceType.JOURNAL_ENTRY, XPSourceType.JOURNAL_BONUS]
        );

        // Get last transaction time
        const lastTx = await db.getFirstAsync<{ timestamp: number }>(
          `SELECT timestamp
           FROM xp_transactions
           WHERE DATE(timestamp / 1000, 'unixepoch', 'localtime') = ?
           ORDER BY timestamp DESC LIMIT 1`,
          [todayDate]
        );

        const freshData: DailyXPData = {
          date: todayDate,
          totalXP: summary?.total_xp || 0,
          xpBySource,
          transactionCount: summary?.transaction_count || 0,
          lastTransactionTime: lastTx?.timestamp || 0,
          journalEntryCount: journalCount?.count || 0,
          goalTransactions,
        };
        this.dailyXPDataCache.set(todayDate, { data: freshData, ts: Date.now() });
        return freshData;
      } else {
        // Legacy AsyncStorage implementation
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_XP_TRACKING);
        if (!stored) {
          return this.createEmptyDailyData();
        }

        const data: DailyXPData = JSON.parse(stored);

        // Reset if it's a new day
        if (data.date !== today()) {
          return this.createEmptyDailyData();
        }

        this.dailyXPDataCache.set(todayDate, { data, ts: Date.now() });
        return data;
      }
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
      
      // Anti-spam tracking
      journalEntryCount: 0,
      goalTransactions: {},
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
      [XPSourceType.RECOMMENDATION_FOLLOW]: 0,
      [XPSourceType.ACHIEVEMENT_UNLOCK]: 0,
      [XPSourceType.MONTHLY_CHALLENGE]: 0,
      [XPSourceType.XP_MULTIPLIER_BONUS]: 0,
      [XPSourceType.DAILY_ACTIVITY]: 0,
      [XPSourceType.INACTIVE_USER_RETURN]: 0,
    };
  }

  // ========================================
  // XP MULTIPLIER SYSTEM
  // ========================================

  /**
   * Get active XP multiplier information
   * UPDATED: Now uses the comprehensive XPMultiplierService
   */
  static async getActiveXPMultiplier(): Promise<{
    isActive: boolean;
    multiplier: number;
    endTime?: Date | undefined;
    source?: string | undefined;
  }> {
    try {
      // FIX: For Jest test environment, skip dynamic import due to --experimental-vm-modules requirement
      if (typeof jest !== 'undefined' || process.env.NODE_ENV === 'test') {
        console.log('🧪 Test environment detected: using default multiplier (1x)');
        return { isActive: false, multiplier: 1 };
      }

      // Use the new XPMultiplierService for comprehensive multiplier management
      const { XPMultiplierService } = await import('./xpMultiplierService');
      const multiplierInfo = await XPMultiplierService.getActiveMultiplier();
      
      return {
        isActive: multiplierInfo.isActive,
        multiplier: multiplierInfo.multiplier,
        endTime: multiplierInfo.expiresAt,
        source: multiplierInfo.source,
      };
    } catch (error) {
      console.error('GamificationService.getActiveXPMultiplier error:', error);
      return { isActive: false, multiplier: 1 };
    }
  }

  // ========================================
  // NOTIFICATION & ANIMATION SYSTEM
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
      // NOTE: levelUp event is emitted by performXPAdditionInternal (inline loop at line ~920)
      // which handles multi-level-ups and includes previousLevel. Do NOT emit here to avoid duplicates.

      if (milestoneReached) {
        console.log(`🏆 Milestone reached! Transaction: ${transaction.amount} XP from ${transaction.source}`);
      }
    } catch (error) {
      console.error('GamificationService.queueXPNotification error:', error);
    }
  }

  /**
   * Trigger XP animation via global event system
   * This method will be called by external animation contexts
   */
  private static triggerXPAnimation(
    amount: number, 
    source: XPSourceType, 
    sourceId?: string,
    metadata?: Record<string, any>,
    position?: { x: number; y: number }
  ): void {
    try {
      // Create event data for XP animation (legacy popup system)
      const eventData = {
        amount,
        source,
        sourceId,
        metadata,
        position: position || { x: 50, y: 130 }, // Default to better position
        timestamp: Date.now(),
      };

      // Trigger both popup animation (immediate) and smart notification (batched)
      DeviceEventEmitter.emit('xpGained', eventData);

      // Also trigger smart notification for batching
      DeviceEventEmitter.emit('xpSmartNotification', {
        amount,
        source,
        timestamp: Date.now(),
      });
      
      const sign = amount >= 0 ? '+' : '';
      console.log(`✨ XP Animation triggered: ${sign}${amount} XP from ${source}`);
    } catch (error) {
      console.error('GamificationService.triggerXPAnimation error:', error);
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
      [XPSourceType.RECOMMENDATION_FOLLOW]: 'Followed recommendation',
      [XPSourceType.ACHIEVEMENT_UNLOCK]: 'Unlocked achievement',
      [XPSourceType.MONTHLY_CHALLENGE]: 'Completed monthly challenge',
      [XPSourceType.XP_MULTIPLIER_BONUS]: 'XP multiplier bonus applied',
      [XPSourceType.DAILY_ACTIVITY]: 'Daily activity recorded',
      [XPSourceType.INACTIVE_USER_RETURN]: 'Inactive user return bonus',
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
        performanceMetrics: this.performanceMetrics,
        backgroundSyncState: this.backgroundSyncState,
        cachedXPData: this.cachedXPData,
      };
    } catch (error) {
      console.error('GamificationService.getDebugInfo error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ========================================
  // OPTIMISTIC UPDATES UTILITY METHODS
  // ========================================

  /**
   * Get cached total XP with automatic cache validity checking
   * Provides 100ms cache for smooth 60fps animations
   */
  private static async getCachedTotalXP(): Promise<number> {
    const now = Date.now();
    
    // Check if cached data is valid (within 100ms)
    if (this.cachedXPData && (now - this.cachedXPData.timestamp) < this.CACHE_VALIDITY_MS) {
      console.log(`💾 Cache hit: ${this.cachedXPData.totalXP} XP (age: ${now - this.cachedXPData.timestamp}ms)`);
      return this.cachedXPData.totalXP;
    }
    
    // Cache miss - fetch fresh data
    console.log(`💾 Cache miss: fetching fresh XP data`);
    const totalXP = await this.getTotalXP();
    const level = getCurrentLevel(totalXP);
    
    this.updateCachedXPData(totalXP, level);
    return totalXP;
  }

  /**
   * Update cached XP data with thread-safe timestamp
   */
  private static updateCachedXPData(totalXP: number, level: number): void {
    this.cachedXPData = {
      totalXP,
      level,
      timestamp: Date.now(),
    };
    
    console.log(`💾 Cache updated: ${totalXP} XP, level ${level}`);
  }

  /**
   * Schedule debounced background sync for data consistency verification
   * Implements 50ms debounce pattern from OptimizedGamificationContext
   */
  private static scheduleBackgroundSync(): void {
    // Clear existing timeout
    if (this.backgroundSyncState.debounceTimeout) {
      clearTimeout(this.backgroundSyncState.debounceTimeout);
    }
    
    // Increment pending operations
    this.backgroundSyncState.pendingOperations++;
    
    // Schedule new debounced sync
    this.backgroundSyncState.debounceTimeout = setTimeout(async () => {
      await this.executeBackgroundSync();
    }, this.DEBOUNCE_DELAY_MS) as unknown as NodeJS.Timeout;
    
    console.log(`🔄 Background sync scheduled (${this.backgroundSyncState.pendingOperations} pending ops)`);
  }

  /**
   * Execute background sync to verify data consistency
   */
  private static async executeBackgroundSync(): Promise<void> {
    if (this.backgroundSyncState.syncInProgress) {
      console.log(`🔄 Background sync already in progress, skipping`);
      return;
    }
    
    try {
      this.backgroundSyncState.syncInProgress = true;
      this.backgroundSyncState.lastSyncTime = Date.now();
      
      console.log(`🔄 EXECUTING background sync (${this.backgroundSyncState.pendingOperations} operations)`);
      
      // Verify cached XP data against storage
      const actualTotalXP = await this.getTotalXP();
      const actualLevel = getCurrentLevel(actualTotalXP);
      
      if (this.cachedXPData) {
        const drift = Math.abs(actualTotalXP - this.cachedXPData.totalXP);
        
        if (drift > 1) { // Allow 1 XP tolerance for floating point precision
          console.log(`🔧 Background sync detected drift: cached=${this.cachedXPData.totalXP}, actual=${actualTotalXP} (drift=${drift})`);
          this.updateCachedXPData(actualTotalXP, actualLevel);
          this.performanceMetrics.correctionCount++;
        } else {
          console.log(`✅ Background sync: data consistent (drift=${drift})`);
        }
      }
      
      // Reset pending operations counter
      this.backgroundSyncState.pendingOperations = 0;
      this.performanceMetrics.backgroundSyncCount++;
      
    } catch (error) {
      console.error('GamificationService.executeBackgroundSync error:', error);
    } finally {
      this.backgroundSyncState.syncInProgress = false;
      this.backgroundSyncState.debounceTimeout = undefined as NodeJS.Timeout | undefined;
    }
  }

  /**
   * Update performance metrics with operation timing
   */
  private static updatePerformanceMetrics(operationTime: number): void {
    this.performanceMetrics.totalOperationTime += operationTime;
    this.performanceMetrics.averageOperationTime = 
      this.performanceMetrics.totalOperationTime / this.performanceMetrics.operationCount;
    this.performanceMetrics.lastOperationTime = operationTime;
    
    // Calculate cache hit rate
    const totalCacheRequests = this.performanceMetrics.operationCount;
    const cacheHits = totalCacheRequests - this.performanceMetrics.correctionCount;
    this.performanceMetrics.cacheHitRate = totalCacheRequests > 0 ? cacheHits / totalCacheRequests : 0;
    
    console.log(`📊 Performance metrics updated: avg=${this.performanceMetrics.averageOperationTime.toFixed(2)}ms, cache hit rate=${(this.performanceMetrics.cacheHitRate * 100).toFixed(1)}%`);
  }

  /**
   * Get current performance metrics for monitoring and debugging
   */
  static getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics (for testing purposes)
   */
  static resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      operationCount: 0,
      totalOperationTime: 0,
      averageOperationTime: 0,
      optimisticUpdateCount: 0,
      backgroundSyncCount: 0,
      correctionCount: 0,
      lastOperationTime: 0,
      cacheHitRate: 0,
    };
    
    console.log('📊 Performance metrics reset');
  }

  /**
   * Clear all cached data (useful for testing and memory management)
   */
  static clearCache(): void {
    this.cachedXPData = null;
    this.backgroundSyncState.pendingOperations = 0;
    
    if (this.backgroundSyncState.debounceTimeout) {
      clearTimeout(this.backgroundSyncState.debounceTimeout);
      this.backgroundSyncState.debounceTimeout = undefined as NodeJS.Timeout | undefined;
    }
    
    console.log('💾 All cache data cleared');
  }

  // ========================================
  // PRODUCTION MONITORING & HEALTH CHECK
  // ========================================
  // Integrated from AtomicGamificationService for production monitoring

  /**
   * Get race condition statistics for production monitoring
   */
  static async getRaceConditionStats(): Promise<{
    totalOperations: number;
    raceConditionsPrevented: number;
    concurrentOperationDetected: boolean;
    recommendations: string[];
  }> {

    
    // Local storage key for operation counter (previously in AtomicGamificationService)
    const OPERATION_COUNTER_KEY = 'gamification_operation_counter_atomic';
    
    const operationCountResult = await AtomicStorage.atomicRead(
      OPERATION_COUNTER_KEY,
      0,
      (value) => parseInt(value, 10)
    );
    
    const storageMetrics = AtomicStorage.getPerformanceMetrics();
    const raceConditionCheck = AtomicStorage.detectPotentialRaceConditions();
    
    const recommendations: string[] = [];
    
    if (storageMetrics.activeLocksCount > 5) {
      recommendations.push('High lock contention detected - consider operation batching');
    }
    
    if (storageMetrics.successRate < 0.95) {
      recommendations.push('Low success rate - investigate storage operation failures');
    }
    
    if (raceConditionCheck.suspiciousPatterns.length > 0) {
      recommendations.push('Suspicious concurrency patterns detected - review operation timing');
    }
    
    return {
      totalOperations: operationCountResult.value,
      raceConditionsPrevented: storageMetrics.totalOperations - operationCountResult.value,
      concurrentOperationDetected: storageMetrics.activeLocksCount > 0,
      recommendations
    };
  }

  /**
   * Generate production health report
   */
  static async generateProductionHealthReport(): Promise<string> {

    
    const raceConditionStats = await this.getRaceConditionStats();
    const storageHealth = AtomicStorage.generateHealthReport();
    
    return [
      '⚡ Unified Gamification Service - Production Health Report',
      '==========================================================',
      '',
      'Race Condition Protection:',
      `  Total Operations: ${raceConditionStats.totalOperations}`,
      `  Race Conditions Prevented: ${raceConditionStats.raceConditionsPrevented}`,
      `  Concurrent Operations Active: ${raceConditionStats.concurrentOperationDetected ? 'YES' : 'NO'}`,
      '',
      'Recommendations:',
      ...raceConditionStats.recommendations.map(r => `  - ${r}`),
      '',
      storageHealth
    ].join('\n');
  }

  // ========================================
  // ENHANCED XP REWARD ENGINE - INTEGRATED
  // ========================================

  /**
   * Calculate enhanced XP reward for monthly challenges (migrated from enhancedXPRewardEngine)
   * Provides sophisticated star-based calculation with completion, streak, and milestone bonuses
   */
  static async calculateEnhancedXPReward(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress
  ): Promise<EnhancedXPRewardResult> {
    try {
      console.log(`🔧 Calculating enhanced XP reward for challenge ${challenge.id}`);
      
      // Get base reward from challenge or fallback to star level
      const baseXPReward = challenge.baseXPReward || this.ENHANCED_STAR_BASE_REWARDS[challenge.starLevel];
      
      // Get completion data
      const completionPercentage = progress.completionPercentage;
      
      // Calculate completion bonus
      const completionBonus = await this.calculateEnhancedCompletionBonus(baseXPReward, completionPercentage);
      
      // Get streak data and calculate streak bonus
      const streakData = await this.getEnhancedMonthlyStreakData(challenge.category);
      const streakBonus = this.calculateEnhancedStreakBonus(streakData);
      
      // Calculate milestone bonuses
      const milestoneBonus = await this.calculateEnhancedMilestoneBonus(challenge, progress, streakData);
      
      // Calculate total before validation
      const preliminaryTotal = baseXPReward + completionBonus + streakBonus + milestoneBonus;
      const totalXPAwarded = this.validateAndCapEnhancedReward(baseXPReward, preliminaryTotal);
      
      // Generate bonus breakdown
      const bonusBreakdown = await this.generateEnhancedBonusBreakdown(
        baseXPReward, challenge.starLevel, completionPercentage, completionBonus,
        streakBonus, streakData, milestoneBonus
      );
      
      // Determine reward tier
      const rewardTier = this.determineEnhancedRewardTier(totalXPAwarded, baseXPReward);
      
      // Validate XP balance
      const balanceValidation = await this.validateEnhancedXPBalance(totalXPAwarded, challenge.starLevel);
      
      const result: EnhancedXPRewardResult = {
        challengeId: challenge.id,
        starLevel: challenge.starLevel,
        baseXPReward,
        completionPercentage,
        completionBonus,
        streakBonus,
        milestoneBonus,
        totalXPAwarded,
        bonusBreakdown,
        rewardTier,
        calculatedAt: new Date(),
        isBalanced: balanceValidation.isBalanced,
        balanceNotes: balanceValidation.warnings
      };
      
      console.log(`✅ Enhanced XP calculation complete: ${totalXPAwarded} XP (base: ${baseXPReward})`);
      return result;
      
    } catch (error) {
      console.error('Enhanced XP calculation failed:', error);
      return await this.getFallbackEnhancedXPReward(challenge, progress);
    }
  }

  /**
   * Award monthly completion with enhanced XP calculation (migrated from enhancedXPRewardEngine)
   * Complete workflow for awarding XP when monthly challenge is completed
   */
  static async awardMonthlyCompletion(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress
  ): Promise<{ success: boolean; xpResult: any; rewardResult: EnhancedXPRewardResult; totalXPAwarded: number; bonusBreakdown: EnhancedXPBonusBreakdown }> {
    try {
      // Calculate enhanced reward
      const rewardResult = await this.calculateEnhancedXPReward(challenge, progress);
      
      // Award XP through unified gamification system
      const xpResult = await this.addXP(rewardResult.totalXPAwarded, {
        source: XPSourceType.MONTHLY_CHALLENGE,
        sourceId: challenge.id,
        description: `Monthly challenge completed: ${challenge.title}`,
        metadata: {
          challengeCategory: challenge.category,
          starLevel: challenge.starLevel,
          completionPercentage: progress.completionPercentage,
          bonusBreakdown: rewardResult.bonusBreakdown
        }
      });
      
      // Save reward to history
      await this.saveEnhancedXPRewardToHistory(rewardResult);
      
      console.log(`🎉 Monthly challenge XP awarded: ${rewardResult.totalXPAwarded} XP`);
      
      return {
        success: true,
        xpResult,
        rewardResult,
        totalXPAwarded: rewardResult.totalXPAwarded,
        bonusBreakdown: rewardResult.bonusBreakdown
      };
      
    } catch (error) {
      console.error('Monthly completion XP award failed:', error);
      throw error;
    }
  }

  /**
   * Update monthly streak data for category (migrated from enhancedXPRewardEngine)
   * KRITICKÁ METODA - používá monthlyProgressTracker.ts:1461-1465
   */
  static async updateMonthlyStreak(
    category: AchievementCategory,
    completed: boolean,
    starLevel?: number
  ): Promise<void> {
    try {
      const currentMonth = formatDateToString(new Date()).substring(0, 7); // YYYY-MM
      const streakData = await this.getEnhancedMonthlyStreakData(category);
      
      // Check if this month was already processed
      const existingEntry = streakData.recentHistory.find(entry => entry.month === currentMonth);
      if (existingEntry && existingEntry.completed === completed) {
        console.log(`Monthly streak for ${category} already updated for ${currentMonth}`);
        return;
      }
      
      // Update or add current month entry
      const updatedHistory = streakData.recentHistory.filter(entry => entry.month !== currentMonth);
      updatedHistory.push({
        month: currentMonth,
        completed,
        completionPercentage: completed ? 100 : 0,
        starLevel: starLevel || 1
      });
      
      // Sort by month and keep last 12
      updatedHistory.sort((a, b) => a.month.localeCompare(b.month));
      const recentHistory = updatedHistory.slice(-12);
      
      // Recalculate streak
      let currentStreak = 0;
      let longestStreak = streakData.longestStreak;
      
      // Count current streak from most recent backwards
      for (let i = recentHistory.length - 1; i >= 0; i--) {
        if (recentHistory[i]?.completed) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Update longest streak if necessary
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      
      const updatedStreakData: EnhancedMonthlyStreakData = {
        currentStreak,
        longestStreak,
        totalCompletedMonths: recentHistory.filter(entry => entry.completed).length,
        lastCompletionMonth: completed ? currentMonth : streakData.lastCompletionMonth,
        streakBonusEligible: currentStreak > 0,
        recentHistory
      };
      
      // Save updated streak data
      await AsyncStorage.setItem(
        `${this.ENHANCED_STORAGE_KEYS.STREAK_DATA}_${category}`,
        JSON.stringify(updatedStreakData)
      );
      
      // Clear cache
      this.enhancedStreakCache.delete(`streak_${category}`);
      
      console.log(`📊 Monthly streak updated for ${category}: ${currentStreak} months`);
      
    } catch (error) {
      console.error('Update monthly streak failed:', error);
      throw error;
    }
  }

  // ========================================
  // ENHANCED XP HELPER METHODS (Private)
  // ========================================

  /**
   * Calculate completion bonus based on percentage (migrated from enhancedXPRewardEngine)
   */
  private static async calculateEnhancedCompletionBonus(
    baseXP: number, 
    completionPercentage: number
  ): Promise<number> {
    try {
      if (completionPercentage < this.ENHANCED_BONUS_CONFIG.PARTIAL_COMPLETION_THRESHOLD * 100) {
        return 0; // No bonus for < 70% completion
      }
      
      // Pro-rated bonus: 0-20% based on completion percentage
      // This is more intuitive for users than threshold-based scaling
      const bonusRatio = (completionPercentage / 100) * this.ENHANCED_BONUS_CONFIG.PERFECT_COMPLETION_BONUS;
      return Math.round(baseXP * bonusRatio);
      
    } catch (error) {
      console.error('GamificationService.calculateEnhancedCompletionBonus error:', error);
      return 0;
    }
  }

  /**
   * Calculate streak bonus (migrated from enhancedXPRewardEngine)
   */
  private static calculateEnhancedStreakBonus(streakData: EnhancedMonthlyStreakData): number {
    try {
      if (!streakData.streakBonusEligible || streakData.currentStreak === 0) {
        return 0;
      }

      // Linear scaling: 100 XP per consecutive month, capped at 500 XP
      const bonusAmount = Math.min(
        streakData.currentStreak * this.ENHANCED_BONUS_CONFIG.STREAK_BONUS_PER_MONTH,
        this.ENHANCED_BONUS_CONFIG.MAX_STREAK_BONUS
      );

      return bonusAmount;
      
    } catch (error) {
      console.error('GamificationService.calculateEnhancedStreakBonus error:', error);
      return 0;
    }
  }

  /**
   * Get monthly streak data for category with caching (migrated from enhancedXPRewardEngine)
   */
  private static async getEnhancedMonthlyStreakData(category: AchievementCategory): Promise<EnhancedMonthlyStreakData> {
    try {
      const cacheKey = `streak_${category}`;
      
      // Check cache first
      const cached = this.enhancedStreakCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.ENHANCED_CACHE_TTL) {
        return cached.data;
      }
      
      // Load from storage
      const stored = await AsyncStorage.getItem(`${this.ENHANCED_STORAGE_KEYS.STREAK_DATA}_${category}`);
      
      let streakData: EnhancedMonthlyStreakData;
      
      if (stored) {
        const parsed = JSON.parse(stored);
        streakData = {
          ...parsed,
          // Ensure data integrity
          currentStreak: parsed.currentStreak || 0,
          longestStreak: parsed.longestStreak || 0,
          totalCompletedMonths: parsed.totalCompletedMonths || 0,
          lastCompletionMonth: parsed.lastCompletionMonth || '',
          streakBonusEligible: (parsed.currentStreak || 0) > 0,
          recentHistory: parsed.recentHistory || []
        };
      } else {
        // Initialize empty streak data
        streakData = {
          currentStreak: 0,
          longestStreak: 0,
          totalCompletedMonths: 0,
          lastCompletionMonth: '',
          streakBonusEligible: false,
          recentHistory: []
        };
      }
      
      // Cache the result
      this.enhancedStreakCache.set(cacheKey, {
        data: streakData,
        timestamp: Date.now()
      });
      
      return streakData;
      
    } catch (error) {
      console.error('GamificationService.getEnhancedMonthlyStreakData error:', error);
      // Return safe default
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalCompletedMonths: 0,
        lastCompletionMonth: '',
        streakBonusEligible: false,
        recentHistory: []
      };
    }
  }

  /**
   * Calculate milestone bonuses (migrated from enhancedXPRewardEngine)
   */
  private static async calculateEnhancedMilestoneBonus(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress,
    streakData: EnhancedMonthlyStreakData
  ): Promise<number> {
    try {
      let totalMilestoneBonus = 0;
      
      // First completion bonus
      if (streakData.totalCompletedMonths === 0) {
        totalMilestoneBonus += this.ENHANCED_BONUS_CONFIG.FIRST_COMPLETION_BONUS;
      }
      
      // Category mastery bonus (3 perfect months in same category)
      const categoryPerfectCount = await this.getEnhancedCategoryPerfectMonthsCount(challenge.category);
      if (categoryPerfectCount >= 2 && progress.completionPercentage >= 100) {
        totalMilestoneBonus += this.ENHANCED_BONUS_CONFIG.CATEGORY_MASTERY_BONUS;
      }
      
      // Perfect quarter bonus (3 consecutive perfect months)
      if (streakData.currentStreak >= 2 && 
          this.hasEnhancedRecentPerfectCompletions(streakData, 2) && 
          progress.completionPercentage >= 100) {
        totalMilestoneBonus += this.ENHANCED_BONUS_CONFIG.PERFECT_QUARTER_BONUS;
      }
      
      return totalMilestoneBonus;
      
    } catch (error) {
      console.error('GamificationService.calculateEnhancedMilestoneBonus error:', error);
      return 0;
    }
  }

  /**
   * Validate and cap total reward (migrated from enhancedXPRewardEngine)
   */
  private static validateAndCapEnhancedReward(baseXP: number, totalXP: number): number {
    try {
      const maxAllowedXP = Math.round(baseXP * this.ENHANCED_BONUS_CONFIG.MAX_TOTAL_MULTIPLIER);
      
      if (totalXP > maxAllowedXP) {
        console.warn(`Enhanced XP reward capped: ${totalXP} -> ${maxAllowedXP} (base: ${baseXP})`);
        return maxAllowedXP;
      }
      
      return totalXP;
      
    } catch (error) {
      console.error('GamificationService.validateAndCapEnhancedReward error:', error);
      return baseXP; // Safe fallback
    }
  }

  /**
   * Generate detailed bonus breakdown (migrated from enhancedXPRewardEngine)
   */
  private static async generateEnhancedBonusBreakdown(
    baseXPReward: number,
    starLevel: number,
    completionPercentage: number,
    completionBonus: number,
    streakBonus: number,
    streakData: EnhancedMonthlyStreakData,
    milestoneBonus: number
  ): Promise<EnhancedXPBonusBreakdown> {
    const totalBonuses = completionBonus + streakBonus + milestoneBonus;
    const bonusPercentage = baseXPReward > 0 ? (totalBonuses / baseXPReward) * 100 : 0;
    
    return {
      baseReward: {
        amount: baseXPReward,
        starLevel,
        description: `${starLevel}★ monthly challenge base reward`
      },
      
      ...(completionPercentage >= this.ENHANCED_BONUS_CONFIG.PARTIAL_COMPLETION_THRESHOLD * 100 && {
        completionBonus: {
          amount: completionBonus,
          percentage: completionPercentage,
          type: completionPercentage >= 100 ? 'perfect' : 'partial',
          description: completionPercentage >= 100 
            ? `Perfect completion bonus (${this.ENHANCED_BONUS_CONFIG.PERFECT_COMPLETION_BONUS * 100}%)`
            : `Partial completion bonus (${completionPercentage}%)`
        }
      }),
      
      ...(streakBonus > 0 && {
        streakBonus: {
          amount: streakBonus,
          streakLength: streakData.currentStreak,
          description: `${streakData.currentStreak}-month streak (+${this.ENHANCED_BONUS_CONFIG.STREAK_BONUS_PER_MONTH} XP/month)`
        }
      }),
      
      ...(milestoneBonus > 0 && {
        milestoneBonus: {
          amount: milestoneBonus,
          milestones: ['Special achievement bonus'],
          description: 'Milestone achievement bonus'
        }
      }),
      
      totalBonuses,
      bonusPercentage
    };
  }

  /**
   * Determine reward tier based on total vs base XP (migrated from enhancedXPRewardEngine)
   */
  private static determineEnhancedRewardTier(totalXP: number, baseXP: number): 'standard' | 'excellent' | 'perfect' | 'legendary' {
    const multiplier = totalXP / baseXP;
    
    if (multiplier >= 1.6) return 'legendary';
    if (multiplier >= 1.4) return 'perfect';
    if (multiplier >= 1.2) return 'excellent';
    return 'standard';
  }

  /**
   * Validate XP balance against user's current XP and historical patterns (migrated from enhancedXPRewardEngine)
   */
  private static async validateEnhancedXPBalance(totalXP: number, starLevel: number): Promise<EnhancedXPBalanceValidation> {
    try {
      const warnings: string[] = [];
      const recommendations: string[] = [];
      
      // Get current user XP for context
      const currentUserXP = await this.getTotalXP();
      
      // Basic validation against star level expectations
      const expectedForStar = this.ENHANCED_STAR_BASE_REWARDS[starLevel as keyof typeof this.ENHANCED_STAR_BASE_REWARDS];
      const bonusPercentage = ((totalXP - expectedForStar) / expectedForStar) * 100;
      
      const bonusLimit = 80; // 80% bonus is reasonable
      if (bonusPercentage > bonusLimit) {
        warnings.push(`Bonus percentage (${bonusPercentage.toFixed(1)}%) exceeds recommended limit`);
        recommendations.push('Consider adjusting bonus calculation parameters');
      }
      
      // Validate against maximum total multiplier
      if (totalXP > expectedForStar * this.ENHANCED_BONUS_CONFIG.MAX_TOTAL_MULTIPLIER) {
        warnings.push(`Total XP exceeds maximum allowed multiplier of ${this.ENHANCED_BONUS_CONFIG.MAX_TOTAL_MULTIPLIER}x`);
      }
      
      return {
        isBalanced: warnings.length === 0,
        totalXP,
        comparedToWeeklyAverage: 0, // Simplified for integration
        comparedToMonthlyBaseline: 0, // Simplified for integration
        warnings,
        recommendations
      };
      
    } catch (error) {
      console.error('Enhanced XP balance validation failed:', error);
      return {
        isBalanced: true, // Fail safe
        totalXP,
        comparedToWeeklyAverage: 0,
        comparedToMonthlyBaseline: 0,
        warnings: [],
        recommendations: []
      };
    }
  }

  /**
   * Get fallback XP reward when calculation fails (migrated from enhancedXPRewardEngine)
   */
  private static async getFallbackEnhancedXPReward(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress
  ): Promise<EnhancedXPRewardResult> {
    const baseXP = this.ENHANCED_STAR_BASE_REWARDS[challenge.starLevel];
    
    return {
      challengeId: challenge.id,
      starLevel: challenge.starLevel,
      baseXPReward: baseXP,
      completionPercentage: progress.completionPercentage,
      completionBonus: 0,
      streakBonus: 0,
      milestoneBonus: 0,
      totalXPAwarded: baseXP,
      bonusBreakdown: {
        baseReward: {
          amount: baseXP,
          starLevel: challenge.starLevel,
          description: `${challenge.starLevel}★ fallback reward`
        },
        totalBonuses: 0,
        bonusPercentage: 0
      },
      rewardTier: 'standard',
      calculatedAt: new Date(),
      isBalanced: true,
      balanceNotes: ['Fallback calculation used']
    };
  }

  /**
   * Save XP reward to history for analytics (migrated from enhancedXPRewardEngine)
   */
  private static async saveEnhancedXPRewardToHistory(rewardResult: EnhancedXPRewardResult): Promise<void> {
    try {
      // Load existing history
      const historyKey = this.ENHANCED_STORAGE_KEYS.XP_HISTORY;
      const stored = await AsyncStorage.getItem(historyKey);
      const history = stored ? JSON.parse(stored) : [];
      
      // Add new entry
      history.push({
        ...rewardResult,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 entries for performance
      const trimmedHistory = history.slice(-50);
      
      // Save back to storage
      await AsyncStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
      
    } catch (error) {
      console.error('Save enhanced XP reward to history failed:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get count of perfect months for category (migrated from enhancedXPRewardEngine)
   */
  private static async getEnhancedCategoryPerfectMonthsCount(category: AchievementCategory): Promise<number> {
    try {
      const streakData = await this.getEnhancedMonthlyStreakData(category);
      return streakData.recentHistory.filter(entry => entry.completionPercentage >= 100).length;
    } catch (error) {
      console.error('Get enhanced category perfect months count failed:', error);
      return 0;
    }
  }

  /**
   * Check if has recent perfect completions (migrated from enhancedXPRewardEngine)
   */
  private static hasEnhancedRecentPerfectCompletions(streakData: EnhancedMonthlyStreakData, count: number): boolean {
    try {
      if (streakData.recentHistory.length < count) return false;
      
      // Check last 'count' entries for perfect completion
      const recentEntries = streakData.recentHistory.slice(-count);
      return recentEntries.every(entry => entry.completionPercentage >= 100);
      
    } catch (error) {
      console.error('Check enhanced recent perfect completions failed:', error);
      return false;
    }
  }

  // Star-based base XP rewards (migrated from enhancedXPRewardEngine)
  private static readonly ENHANCED_STAR_BASE_REWARDS = {
    1: 500,   // 1★ Easy
    2: 750,   // 2★ Medium
    3: 1125,  // 3★ Hard
    4: 1688,  // 4★ Expert
    5: 2532   // 5★ Master
  } as const;

  // Enhanced bonus configuration (migrated from enhancedXPRewardEngine)
  private static readonly ENHANCED_BONUS_CONFIG = {
    // Completion bonuses
    PERFECT_COMPLETION_BONUS: 0.20,      // 20% bonus for 100% completion
    PARTIAL_COMPLETION_THRESHOLD: 0.70,  // 70% minimum for partial rewards
    
    // Streak bonuses
    STREAK_BONUS_PER_MONTH: 100,         // 100 XP per consecutive month
    MAX_STREAK_BONUS: 500,               // Maximum streak bonus
    
    // Milestone bonuses
    FIRST_COMPLETION_BONUS: 150,         // First-time completion bonus
    CATEGORY_MASTERY_BONUS: 200,         // 3 perfect months in same category
    PERFECT_QUARTER_BONUS: 250,          // 3 consecutive perfect months
    
    // Validation limits
    MAX_TOTAL_MULTIPLIER: 1.8,           // Maximum total reward multiplier
  } as const;

  // Enhanced storage keys (migrated from enhancedXPRewardEngine)
  private static readonly ENHANCED_STORAGE_KEYS = {
    STREAK_DATA: 'monthly_challenge_streaks',
    XP_HISTORY: 'monthly_xp_reward_history',
    BALANCE_CACHE: 'xp_balance_validation_cache'
  } as const;

  // Performance caching for enhanced XP calculations
  private static enhancedStreakCache = new Map<string, { data: EnhancedMonthlyStreakData; timestamp: number }>();
  private static readonly ENHANCED_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
}