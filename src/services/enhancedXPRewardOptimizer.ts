// Enhanced XP Reward Engine - Performance Optimization and Edge Case Handler
// Provides caching, batching, validation, and edge case handling for maximum reliability

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnhancedXPRewardEngine, EnhancedXPRewardResult } from './enhancedXPRewardEngine';
import { MonthlyChallenge, MonthlyChallengeProgress, AchievementCategory } from '../types/gamification';
import { formatDateToString, today } from '../utils/date';

// ========================================
// INTERFACES & TYPES
// ========================================

interface OptimizationConfig {
  enableCaching: boolean;
  cacheExpirationMs: number;
  enableBatchProcessing: boolean;
  maxBatchSize: number;
  enableValidation: boolean;
  enableErrorRecovery: boolean;
  maxRetryAttempts: number;
  performanceTracking: boolean;
}

interface CacheEntry {
  key: string;
  result: EnhancedXPRewardResult;
  timestamp: number;
  expiresAt: number;
}

interface BatchRequest {
  challenge: MonthlyChallenge;
  progress: MonthlyChallengeProgress;
  requestId: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

interface PerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageCalculationTime: number;
  totalBatchesProcessed: number;
  errorCount: number;
  lastOptimizationRun: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedChallenge?: MonthlyChallenge;
  correctedProgress?: MonthlyChallengeProgress;
}

// ========================================
// ENHANCED XP REWARD OPTIMIZER
// ========================================

export class EnhancedXPRewardOptimizer {
  private static cache = new Map<string, CacheEntry>();
  private static batchQueue: BatchRequest[] = [];
  private static metrics: PerformanceMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageCalculationTime: 0,
    totalBatchesProcessed: 0,
    errorCount: 0,
    lastOptimizationRun: Date.now()
  };
  
  private static config: OptimizationConfig = {
    enableCaching: true,
    cacheExpirationMs: 15 * 60 * 1000, // 15 minutes
    enableBatchProcessing: true,
    maxBatchSize: 10,
    enableValidation: true,
    enableErrorRecovery: true,
    maxRetryAttempts: 3,
    performanceTracking: true
  };
  
  private static batchProcessingActive = false;

  // ========================================
  // OPTIMIZED CALCULATION WITH CACHING
  // ========================================

  /**
   * Calculate enhanced XP reward with performance optimizations
   */
  static async calculateOptimizedXPReward(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress,
    options: { 
      bypassCache?: boolean;
      priority?: 'high' | 'medium' | 'low';
      enableRetry?: boolean;
    } = {}
  ): Promise<EnhancedXPRewardResult> {
    const startTime = Date.now();
    
    try {
      this.metrics.totalRequests++;
      
      // Input validation
      if (this.config.enableValidation) {
        const validation = this.validateInputs(challenge, progress);
        if (!validation.isValid) {
          console.warn('EnhancedXPRewardOptimizer: Input validation failed:', validation.errors);
          
          // Attempt correction if possible
          if (validation.correctedChallenge && validation.correctedProgress) {
            challenge = validation.correctedChallenge;
            progress = validation.correctedProgress;
          } else {
            throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
          }
        }
      }
      
      // Check cache first
      if (this.config.enableCaching && !options.bypassCache) {
        const cached = this.getCachedResult(challenge, progress);
        if (cached) {
          this.metrics.cacheHits++;
          this.recordPerformanceMetric(Date.now() - startTime);
          return cached;
        }
      }
      
      this.metrics.cacheMisses++;
      
      // Calculate with error recovery
      let result: EnhancedXPRewardResult;
      let attempts = 0;
      const maxAttempts = options.enableRetry !== false ? this.config.maxRetryAttempts : 1;
      
      while (attempts < maxAttempts) {
        try {
          result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
          break;
        } catch (error) {
          attempts++;
          this.metrics.errorCount++;
          
          if (attempts >= maxAttempts) {
            if (this.config.enableErrorRecovery) {
              result = this.createFallbackReward(challenge, progress);
              console.warn('EnhancedXPRewardOptimizer: Using fallback reward calculation', error);
            } else {
              throw error;
            }
          } else {
            // Exponential backoff
            await this.delay(Math.pow(2, attempts) * 100);
          }
        }
      }
      
      // Cache the result
      if (this.config.enableCaching && result!) {
        this.cacheResult(challenge, progress, result);
      }
      
      this.recordPerformanceMetric(Date.now() - startTime);
      return result!;
      
    } catch (error) {
      this.metrics.errorCount++;
      console.error('EnhancedXPRewardOptimizer: Calculation failed', error);
      
      if (this.config.enableErrorRecovery) {
        return this.createFallbackReward(challenge, progress);
      }
      throw error;
    }
  }

  // ========================================
  // BATCH PROCESSING
  // ========================================

  /**
   * Add request to batch queue for processing
   */
  static async queueBatchRequest(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> {
    const requestId = `${challenge.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.batchQueue.push({
      challenge,
      progress,
      requestId,
      priority,
      timestamp: Date.now()
    });
    
    // Sort by priority
    this.batchQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Start batch processing if not already running
    if (this.config.enableBatchProcessing && !this.batchProcessingActive) {
      this.processBatchQueue();
    }
    
    return requestId;
  }

  /**
   * Process queued batch requests
   */
  private static async processBatchQueue(): Promise<void> {
    if (this.batchProcessingActive || this.batchQueue.length === 0) {
      return;
    }
    
    this.batchProcessingActive = true;
    
    try {
      while (this.batchQueue.length > 0) {
        const batchSize = Math.min(this.config.maxBatchSize, this.batchQueue.length);
        const batch = this.batchQueue.splice(0, batchSize);
        
        // Process batch in parallel
        const promises = batch.map(request => 
          this.calculateOptimizedXPReward(request.challenge, request.progress)
            .catch(error => {
              console.error(`EnhancedXPRewardOptimizer: Batch request ${request.requestId} failed`, error);
              return this.createFallbackReward(request.challenge, request.progress);
            })
        );
        
        await Promise.all(promises);
        this.metrics.totalBatchesProcessed++;
        
        // Small delay between batches to prevent overwhelming
        if (this.batchQueue.length > 0) {
          await this.delay(50);
        }
      }
    } finally {
      this.batchProcessingActive = false;
    }
  }

  // ========================================
  // CACHING SYSTEM
  // ========================================

  /**
   * Generate cache key for challenge and progress
   */
  private static generateCacheKey(challenge: MonthlyChallenge, progress: MonthlyChallengeProgress): string {
    const challengeHash = `${challenge.id}_${challenge.starLevel}_${challenge.baseXPReward}`;
    const progressHash = `${progress.completionPercentage}_${progress.daysActive}_${progress.currentStreak}`;
    const milestoneHash = Object.values(progress.milestonesReached)
      .map(m => `${m.reached ? 1 : 0}_${m.xpAwarded || 0}`)
      .join('_');
    
    return `xp_reward_${challengeHash}_${progressHash}_${milestoneHash}`;
  }

  /**
   * Get cached result if available and not expired
   */
  private static getCachedResult(
    challenge: MonthlyChallenge, 
    progress: MonthlyChallengeProgress
  ): EnhancedXPRewardResult | null {
    const key = this.generateCacheKey(challenge, progress);
    const cached = this.cache.get(key);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * Cache calculation result
   */
  private static cacheResult(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress,
    result: EnhancedXPRewardResult
  ): void {
    const key = this.generateCacheKey(challenge, progress);
    const now = Date.now();
    
    this.cache.set(key, {
      key,
      result,
      timestamp: now,
      expiresAt: now + this.config.cacheExpirationMs
    });
    
    // Clean up expired entries periodically
    if (this.cache.size > 100) {
      this.cleanupExpiredCache();
    }
  }

  /**
   * Remove expired cache entries
   */
  private static cleanupExpiredCache(): void {
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    });
  }

  // ========================================
  // INPUT VALIDATION & EDGE CASE HANDLING
  // ========================================

  /**
   * Validate and sanitize inputs
   */
  private static validateInputs(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let correctedChallenge = { ...challenge };
    let correctedProgress = { ...progress };
    let hasCorrections = false;

    // Validate challenge
    if (!challenge.id || challenge.id.length === 0) {
      errors.push('Challenge ID is required');
    }
    
    if (!challenge.baseXPReward || challenge.baseXPReward <= 0) {
      errors.push('Base XP reward must be positive');
    } else if (challenge.baseXPReward > 10000) {
      warnings.push('Unusually high base XP reward detected');
      correctedChallenge.baseXPReward = Math.min(challenge.baseXPReward, 5000);
      hasCorrections = true;
    }
    
    if (!challenge.starLevel || challenge.starLevel < 1 || challenge.starLevel > 5) {
      errors.push('Star level must be between 1 and 5');
      if (challenge.starLevel) {
        correctedChallenge.starLevel = Math.max(1, Math.min(5, challenge.starLevel)) as 1 | 2 | 3 | 4 | 5;
        hasCorrections = true;
      }
    }

    // Validate progress
    if (progress.completionPercentage < 0 || progress.completionPercentage > 100) {
      warnings.push('Completion percentage out of range, normalizing');
      correctedProgress.completionPercentage = Math.max(0, Math.min(100, progress.completionPercentage));
      hasCorrections = true;
    }
    
    if (progress.daysActive < 0) {
      warnings.push('Days active cannot be negative');
      correctedProgress.daysActive = Math.max(0, progress.daysActive);
      hasCorrections = true;
    }
    
    if (progress.dailyConsistency && (progress.dailyConsistency < 0 || progress.dailyConsistency > 1)) {
      warnings.push('Daily consistency out of range, normalizing');
      correctedProgress.dailyConsistency = Math.max(0, Math.min(1, progress.dailyConsistency));
      hasCorrections = true;
    }

    // Validate milestone data
    const milestones = progress.milestonesReached;
    if (milestones) {
      Object.entries(milestones).forEach(([milestone, data]) => {
        if (data.xpAwarded && data.xpAwarded < 0) {
          warnings.push(`Negative XP awarded for ${milestone}% milestone`);
          correctedProgress.milestonesReached![parseInt(milestone) as 25 | 50 | 75].xpAwarded = 0;
          hasCorrections = true;
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedChallenge: hasCorrections ? correctedChallenge : undefined,
      correctedProgress: hasCorrections ? correctedProgress : undefined
    };
  }

  /**
   * Create fallback reward when calculation fails
   */
  private static createFallbackReward(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress
  ): EnhancedXPRewardResult {
    const fallbackXP = Math.max(challenge.baseXPReward * 0.7, 100); // At least 70% of base or 100 XP minimum
    
    return {
      challengeId: challenge.id,
      starLevel: challenge.starLevel,
      baseXPReward: challenge.baseXPReward,
      completionPercentage: progress.completionPercentage,
      completionBonus: 0,
      streakBonus: 0,
      milestoneBonus: 0,
      totalXPAwarded: Math.round(fallbackXP),
      bonusBreakdown: {
        baseReward: {
          amount: Math.round(fallbackXP),
          starLevel: challenge.starLevel,
          description: `${challenge.starLevel}-star fallback reward`
        },
        totalBonuses: 0,
        bonusPercentage: 0
      },
      rewardTier: 'standard',
      calculatedAt: new Date(),
      isBalanced: false,
      balanceNotes: ['Fallback reward calculation used due to error']
    };
  }

  // ========================================
  // PERFORMANCE MONITORING
  // ========================================

  /**
   * Record performance metric
   */
  private static recordPerformanceMetric(calculationTimeMs: number): void {
    if (!this.config.performanceTracking) return;
    
    const currentAvg = this.metrics.averageCalculationTime;
    const totalRequests = this.metrics.totalRequests;
    
    this.metrics.averageCalculationTime = 
      ((currentAvg * (totalRequests - 1)) + calculationTimeMs) / totalRequests;
  }

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  static resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCalculationTime: 0,
      totalBatchesProcessed: 0,
      errorCount: 0,
      lastOptimizationRun: Date.now()
    };
  }

  // ========================================
  // CONFIGURATION & UTILITIES
  // ========================================

  /**
   * Update optimization configuration
   */
  static updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  static getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Clear all caches
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; hitRate: number; totalHits: number; totalMisses: number } {
    return {
      size: this.cache.size,
      hitRate: this.metrics.totalRequests > 0 
        ? this.metrics.cacheHits / this.metrics.totalRequests 
        : 0,
      totalHits: this.metrics.cacheHits,
      totalMisses: this.metrics.cacheMisses
    };
  }

  /**
   * Utility delay function
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Optimize system performance periodically
   */
  static performMaintenance(): void {
    this.cleanupExpiredCache();
    
    // Clear old batch requests (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    this.batchQueue = this.batchQueue.filter(req => req.timestamp >= fiveMinutesAgo);
    
    this.metrics.lastOptimizationRun = Date.now();
  }
}