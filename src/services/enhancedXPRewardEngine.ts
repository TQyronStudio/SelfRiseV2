// Enhanced XP Reward Engine
// Sophisticated star-based XP reward calculation system for monthly challenges
// with completion bonuses, partial rewards, streak bonuses, and perfect balance validation

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { 
  MonthlyChallenge,
  MonthlyChallengeProgress,
  AchievementCategory,
  XPSourceType
} from '../types/gamification';
import { DateString } from '../types/common';
import { formatDateToString, today, parseDate } from '../utils/date';
import { GamificationService } from './gamificationService';
import { StarRatingService } from './starRatingService';
import { MonthlyProgressTracker } from './monthlyProgressTracker';

// ========================================
// INTERFACES & TYPES  
// ========================================

/**
 * Enhanced XP calculation result with detailed breakdown
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
  bonusBreakdown: XPBonusBreakdown;
  rewardTier: 'standard' | 'excellent' | 'perfect' | 'legendary';
  calculatedAt: Date;
  
  // Validation
  isBalanced: boolean;
  balanceNotes?: string[];
}

/**
 * Detailed bonus breakdown for transparency
 */
export interface XPBonusBreakdown {
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
 * Monthly streak data for bonus calculations
 */
export interface MonthlyStreakData {
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
 * XP balance validation result
 */
export interface XPBalanceValidation {
  isBalanced: boolean;
  totalXP: number;
  comparedToWeeklyAverage: number;    // How much vs avg weekly XP
  comparedToMonthlyBaseline: number;   // How much vs expected monthly XP
  warnings: string[];
  recommendations: string[];
}

// ========================================
// ENHANCED XP REWARD ENGINE
// ========================================

export class EnhancedXPRewardEngine {
  // Star-based base XP rewards (exact architecture specification)
  private static readonly STAR_BASE_REWARDS = {
    1: 500,   // 1★ Easy
    2: 750,   // 2★ Medium
    3: 1125,  // 3★ Hard
    4: 1556,  // 4★ Expert (corrected to match architecture)
    5: 2532   // 5★ Master
  } as const;

  // Bonus configuration
  private static readonly BONUS_CONFIG = {
    // Completion bonuses
    PERFECT_COMPLETION_BONUS: 0.20,      // 20% bonus for 100% completion
    PARTIAL_COMPLETION_THRESHOLD: 0.70,  // 70% minimum for partial rewards
    
    // Streak bonuses
    STREAK_BONUS_PER_MONTH: 100,         // +100 XP per consecutive month
    MAX_STREAK_BONUS: 1200,              // Cap at 1200 XP (12 months)
    
    // Milestone bonuses (additional contextual bonuses)
    FIRST_COMPLETION_BONUS: 50,          // First ever monthly completion
    CATEGORY_MASTERY_BONUS: 100,         // Perfect in same category 3 months
    PERFECT_QUARTER_BONUS: 200,          // 3 perfect months in row
    
    // Balance limits
    MAX_TOTAL_MULTIPLIER: 1.5,           // Total bonuses can't exceed 150% of base
    MIN_PARTIAL_MULTIPLIER: 0.70,        // Partial rewards start at 70%
  } as const;

  // Storage keys
  private static readonly STORAGE_KEYS = {
    STREAK_DATA: 'monthly_challenge_streaks',
    XP_HISTORY: 'monthly_xp_reward_history',
    BALANCE_CACHE: 'xp_balance_validation_cache'
  } as const;

  // Performance caching
  private static streakCache = new Map<string, { data: MonthlyStreakData; timestamp: number }>();
  private static readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  // ========================================
  // CORE XP CALCULATION METHODS
  // ========================================

  /**
   * Calculate enhanced XP reward for monthly challenge completion
   * This is the main entry point for all XP reward calculations
   */
  public static async calculateEnhancedXPReward(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress
  ): Promise<EnhancedXPRewardResult> {
    try {
      console.log(`🧮 Calculating enhanced XP reward for challenge: ${challenge.title}`);

      // Get base reward for star level
      const baseXPReward = this.STAR_BASE_REWARDS[challenge.starLevel];
      
      // Get completion data
      const completionPercentage = progress.completionPercentage;
      
      // Calculate completion bonus
      const completionBonus = await this.calculateCompletionBonus(
        baseXPReward,
        completionPercentage
      );
      
      // Calculate streak bonus
      const streakData = await this.getMonthlyStreakData(challenge.category);
      const streakBonus = this.calculateStreakBonus(streakData);
      
      // Calculate milestone bonuses
      const milestoneBonus = await this.calculateMilestoneBonus(
        challenge,
        progress,
        streakData
      );
      
      // Calculate total XP (with balance validation)
      const totalBeforeValidation = baseXPReward + completionBonus + streakBonus + milestoneBonus;
      const totalXPAwarded = this.validateAndCapReward(baseXPReward, totalBeforeValidation);
      
      // Create bonus breakdown
      const bonusBreakdown = this.createBonusBreakdown(
        baseXPReward,
        challenge.starLevel,
        completionBonus,
        completionPercentage,
        streakBonus,
        streakData,
        milestoneBonus
      );
      
      // Determine reward tier
      const rewardTier = this.determineRewardTier(completionPercentage, streakData, totalXPAwarded);
      
      // Balance validation
      const balanceValidation = await this.validateXPBalance(totalXPAwarded, challenge.starLevel);
      
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

      console.log(`💰 XP Calculation Complete: ${totalXPAwarded} XP (${challenge.starLevel}★, ${completionPercentage}%)`);
      
      return result;
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.calculateEnhancedXPReward error:', error);
      
      // Fallback to basic calculation
      return this.getFallbackXPReward(challenge, progress);
    }
  }

  /**
   * Award monthly completion XP using enhanced calculation and integrate with gamification system
   */
  public static async awardMonthlyCompletion(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress
  ): Promise<{ success: boolean; xpResult: any; rewardResult: EnhancedXPRewardResult; totalXPAwarded: number; bonusBreakdown: XPBonusBreakdown }> {
    try {
      // Calculate enhanced reward
      const rewardResult = await this.calculateEnhancedXPReward(challenge, progress);
      
      // Award XP through gamification system
      const xpResult = await GamificationService.addXP(rewardResult.totalXPAwarded, {
        source: XPSourceType.MONTHLY_CHALLENGE,
        sourceId: challenge.id,
        description: `Monthly challenge completed: ${challenge.title}`,
        metadata: {
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          challengeCategory: challenge.category,
          starLevel: challenge.starLevel,
          completionPercentage: progress.completionPercentage,
          bonusBreakdown: rewardResult.bonusBreakdown,
          rewardTier: rewardResult.rewardTier,
          type: 'monthly_challenge_enhanced_reward'
        }
      });

      // Update streak data
      await this.updateMonthlyStreak(challenge.category, progress.completionPercentage >= 100, challenge.starLevel);
      
      // Save reward to history
      await this.saveXPRewardToHistory(rewardResult);
      
      // Emit enhanced XP award event
      DeviceEventEmitter.emit('enhanced_xp_awarded', {
        challenge,
        progress,
        rewardResult,
        xpResult,
        timestamp: Date.now()
      });

      console.log(`🎉 Enhanced XP awarded: ${rewardResult.totalXPAwarded} XP (${rewardResult.rewardTier} tier)`);
      
      return { 
        success: true, 
        xpResult, 
        rewardResult,
        totalXPAwarded: rewardResult.totalXPAwarded,
        bonusBreakdown: rewardResult.bonusBreakdown
      };
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.awardEnhancedXP error:', error);
      return { 
        success: false, 
        xpResult: null, 
        rewardResult: await this.getFallbackXPReward(challenge, progress),
        totalXPAwarded: 0,
        bonusBreakdown: {
          baseReward: { amount: 0, starLevel: challenge.starLevel, description: 'Failed calculation' },
          totalBonuses: 0,
          bonusPercentage: 0
        }
      };
    }
  }

  // ========================================
  // BONUS CALCULATION METHODS
  // ========================================

  /**
   * Calculate completion bonus based on completion percentage
   */
  private static async calculateCompletionBonus(
    baseXP: number, 
    completionPercentage: number
  ): Promise<number> {
    try {
      // No bonus for completion below 70%
      if (completionPercentage < this.BONUS_CONFIG.PARTIAL_COMPLETION_THRESHOLD * 100) {
        return 0;
      }

      // Perfect completion (100%): full 20% bonus
      if (completionPercentage >= 100) {
        return Math.round(baseXP * this.BONUS_CONFIG.PERFECT_COMPLETION_BONUS);
      }

      // Partial completion (70-99%): pro-rated bonus
      // Linear scaling from 0% bonus at 70% to 20% bonus at 100%
      const completionRatio = completionPercentage / 100;
      const bonusRatio = ((completionRatio - this.BONUS_CONFIG.PARTIAL_COMPLETION_THRESHOLD) / 
                         (1.0 - this.BONUS_CONFIG.PARTIAL_COMPLETION_THRESHOLD)) * 
                         this.BONUS_CONFIG.PERFECT_COMPLETION_BONUS;
      
      return Math.round(baseXP * bonusRatio);
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.calculateCompletionBonus error:', error);
      return 0;
    }
  }

  /**
   * Calculate streak bonus based on consecutive monthly completions
   */
  private static calculateStreakBonus(streakData: MonthlyStreakData): number {
    try {
      if (!streakData.streakBonusEligible || streakData.currentStreak === 0) {
        return 0;
      }

      // +100 XP per consecutive month, capped at 1200 XP (12 months)
      const bonusAmount = Math.min(
        streakData.currentStreak * this.BONUS_CONFIG.STREAK_BONUS_PER_MONTH,
        this.BONUS_CONFIG.MAX_STREAK_BONUS
      );

      return bonusAmount;
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.calculateStreakBonus error:', error);
      return 0;
    }
  }

  /**
   * Calculate milestone bonuses for special achievements
   */
  private static async calculateMilestoneBonus(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress,
    streakData: MonthlyStreakData
  ): Promise<number> {
    try {
      let totalMilestoneBonus = 0;
      
      // First completion bonus
      if (streakData.totalCompletedMonths === 0) {
        totalMilestoneBonus += this.BONUS_CONFIG.FIRST_COMPLETION_BONUS;
      }
      
      // Category mastery bonus (3 perfect months in same category)
      const categoryPerfectCount = await this.getCategoryPerfectMonthsCount(challenge.category);
      if (categoryPerfectCount >= 2 && progress.completionPercentage >= 100) {
        totalMilestoneBonus += this.BONUS_CONFIG.CATEGORY_MASTERY_BONUS;
      }
      
      // Perfect quarter bonus (3 consecutive perfect months)
      if (streakData.currentStreak >= 2 && 
          this.hasRecentPerfectCompletions(streakData, 2) && 
          progress.completionPercentage >= 100) {
        totalMilestoneBonus += this.BONUS_CONFIG.PERFECT_QUARTER_BONUS;
      }
      
      return totalMilestoneBonus;
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.calculateMilestoneBonus error:', error);
      return 0;
    }
  }

  // ========================================
  // STREAK DATA MANAGEMENT
  // ========================================

  /**
   * Get monthly streak data for a category
   */
  private static async getMonthlyStreakData(category: AchievementCategory): Promise<MonthlyStreakData> {
    try {
      const cacheKey = `streak_${category}`;
      
      // Check cache first
      const cached = this.streakCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      // Load from storage
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.STREAK_DATA}_${category}`);
      
      let streakData: MonthlyStreakData;
      if (stored) {
        streakData = JSON.parse(stored);
      } else {
        // Create default streak data
        streakData = {
          currentStreak: 0,
          longestStreak: 0,
          totalCompletedMonths: 0,
          lastCompletionMonth: '',
          streakBonusEligible: false,
          recentHistory: []
        };
      }

      // Update cache
      this.streakCache.set(cacheKey, {
        data: streakData,
        timestamp: Date.now()
      });

      return streakData;
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.getMonthlyStreakData error:', error);
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
   * Update monthly streak data after challenge completion
   */
  public static async updateMonthlyStreak(
    category: AchievementCategory,
    completed: boolean,
    starLevel?: number
  ): Promise<void> {
    try {
      const currentMonth = today().substring(0, 7); // "YYYY-MM" - today() already returns a string
      const streakData = await this.getMonthlyStreakData(category);

      // Add to recent history
      const historyEntry = {
        month: currentMonth,
        completed,
        completionPercentage: completed ? 100 : 0, // Real completion percentage should be passed
        starLevel: starLevel || 1 // Use actual star level
      };

      streakData.recentHistory = [historyEntry, ...streakData.recentHistory].slice(0, 12);
      
      if (completed) {
        // Update completion stats
        streakData.totalCompletedMonths += 1;
        streakData.lastCompletionMonth = currentMonth;
        
        // Update streak - check if this month follows the last completion month
        const lastMonth = streakData.lastCompletionMonth;
        if (lastMonth && this.isConsecutiveMonth(lastMonth, currentMonth)) {
          streakData.currentStreak += 1;
        } else {
          streakData.currentStreak = 1; // Start new streak
        }
        
        // Update longest streak
        if (streakData.currentStreak > streakData.longestStreak) {
          streakData.longestStreak = streakData.currentStreak;
        }
        
        streakData.streakBonusEligible = streakData.currentStreak > 1;
      } else {
        // Reset current streak on failure
        streakData.currentStreak = 0;
        streakData.streakBonusEligible = false;
      }

      // Save updated streak data
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.STREAK_DATA}_${category}`,
        JSON.stringify(streakData)
      );

      // Clear cache to force refresh
      this.streakCache.delete(`streak_${category}`);
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.updateMonthlyStreakData error:', error);
    }
  }

  // ========================================
  // UTILITY & VALIDATION METHODS
  // ========================================

  /**
   * Validate and cap XP reward to maintain balance
   */
  private static validateAndCapReward(baseXP: number, totalXP: number): number {
    try {
      const maxAllowedXP = Math.round(baseXP * this.BONUS_CONFIG.MAX_TOTAL_MULTIPLIER);
      
      if (totalXP > maxAllowedXP) {
        console.warn(`XP reward capped: ${totalXP} -> ${maxAllowedXP} (base: ${baseXP})`);
        return maxAllowedXP;
      }
      
      return totalXP;
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.validateAndCapReward error:', error);
      return baseXP; // Fallback to base reward
    }
  }

  /**
   * Validate XP balance against existing gamification system with real XP data
   */
  private static async validateXPBalance(totalXP: number, starLevel: number): Promise<XPBalanceValidation> {
    try {
      const warnings: string[] = [];
      const recommendations: string[] = [];
      
      // Get current XP balance from GamificationService for real validation
      let currentUserXP = 0;
      try {
        currentUserXP = await GamificationService.getTotalXP();
      } catch (error) {
        warnings.push('Could not verify current XP balance from GamificationService');
      }
      
      // Compare to weekly average (monthly should be ~4.5x weekly)
      const expectedWeeklyEquivalent = totalXP / 4.5;
      const weeklyRange = { min: 54, max: 660 }; // From analysis
      
      if (expectedWeeklyEquivalent < weeklyRange.min) {
        warnings.push(`XP too low: ${totalXP} XP (${expectedWeeklyEquivalent.toFixed(1)}/week vs ${weeklyRange.min} min)`);
      }
      
      if (expectedWeeklyEquivalent > weeklyRange.max * 1.5) { // Allow 50% higher for monthly bonuses
        warnings.push(`XP too high: ${totalXP} XP (${expectedWeeklyEquivalent.toFixed(1)}/week vs ${weeklyRange.max * 1.5} max allowed)`);
      }
      
      // Star level validation with stricter limits
      const expectedForStar = this.STAR_BASE_REWARDS[starLevel as keyof typeof this.STAR_BASE_REWARDS];
      const bonusPercentage = ((totalXP - expectedForStar) / expectedForStar) * 100;
      
      if (bonusPercentage > 80) { // Stricter limit
        warnings.push(`Extremely high bonus: ${bonusPercentage.toFixed(1)}% above base ${starLevel}★ reward`);
        recommendations.push('Reduce bonus multipliers to maintain game balance');
      } else if (bonusPercentage > 50) {
        warnings.push(`High bonus percentage: ${bonusPercentage.toFixed(1)}% above base ${starLevel}★ reward`);
        recommendations.push('Monitor bonus accumulation to prevent inflation');
      }
      
      // Validate against maximum total multiplier
      if (totalXP > expectedForStar * this.BONUS_CONFIG.MAX_TOTAL_MULTIPLIER) {
        warnings.push(`Total XP exceeds maximum allowed multiplier of ${this.BONUS_CONFIG.MAX_TOTAL_MULTIPLIER}x`);
      }
      
      // Real balance check against user's current XP
      if (currentUserXP > 0) {
        const futureXP = currentUserXP + totalXP;
        
        // Import level calculation function
        const { getCurrentLevel } = require('./levelCalculation');
        const currentLevel = getCurrentLevel(currentUserXP);
        
        // Check if reward would cause unrealistic level jumps
        if (totalXP > currentUserXP * 0.1 && currentLevel < 10) {
          warnings.push(`Large XP reward (${totalXP}) relative to current balance (${currentUserXP})`);
          recommendations.push('Consider level-based XP scaling for new users');
        }
      }
      
      return {
        isBalanced: warnings.length === 0,
        totalXP,
        comparedToWeeklyAverage: Math.round(expectedWeeklyEquivalent * 10) / 10,
        comparedToMonthlyBaseline: Math.round(bonusPercentage * 10) / 10,
        warnings,
        recommendations
      };
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.validateXPBalance error:', error);
      return {
        isBalanced: false,
        totalXP,
        comparedToWeeklyAverage: 0,
        comparedToMonthlyBaseline: 0,
        warnings: ['Balance validation failed due to system error'],
        recommendations: ['Retry calculation or use fallback reward']
      };
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Create detailed bonus breakdown for transparency
   */
  private static createBonusBreakdown(
    baseXP: number,
    starLevel: number,
    completionBonus: number,
    completionPercentage: number,
    streakBonus: number,
    streakData: MonthlyStreakData,
    milestoneBonus: number
  ): XPBonusBreakdown {
    const totalBonuses = completionBonus + streakBonus + milestoneBonus;
    
    return {
      baseReward: {
        amount: baseXP,
        starLevel,
        description: `${starLevel}★ base reward`
      },
      
      ...(completionBonus > 0 && {
        completionBonus: {
          amount: completionBonus,
          percentage: completionPercentage,
          type: completionPercentage >= 100 ? 'perfect' : 'partial',
          description: completionPercentage >= 100 
            ? `Perfect completion (+20% bonus)` 
            : `Partial completion (${completionPercentage}%, pro-rated bonus)`
        }
      }),
      
      ...(streakBonus > 0 && {
        streakBonus: {
          amount: streakBonus,
          streakLength: streakData.currentStreak,
          description: `${streakData.currentStreak}-month streak (+${this.BONUS_CONFIG.STREAK_BONUS_PER_MONTH} XP/month)`
        }
      }),
      
      ...(milestoneBonus > 0 && {
        milestoneBonus: {
          amount: milestoneBonus,
          milestones: ['Special achievement milestones'], // Could be more specific
          description: `Special milestone bonuses`
        }
      }),
      
      totalBonuses,
      bonusPercentage: Math.round((totalBonuses / baseXP) * 100)
    };
  }

  /**
   * Determine reward tier based on performance
   */
  private static determineRewardTier(
    completionPercentage: number,
    streakData: MonthlyStreakData,
    totalXP: number
  ): 'standard' | 'excellent' | 'perfect' | 'legendary' {
    if (totalXP >= 3000 && completionPercentage >= 100 && streakData.currentStreak >= 3) {
      return 'legendary';
    }
    
    if (completionPercentage >= 100 && (streakData.currentStreak >= 2 || totalXP >= 2000)) {
      return 'perfect';
    }
    
    if (completionPercentage >= 85 || streakData.currentStreak >= 1) {
      return 'excellent';
    }
    
    return 'standard';
  }

  /**
   * Get fallback XP reward in case of calculation failure
   */
  private static async getFallbackXPReward(
    challenge: MonthlyChallenge,
    progress: MonthlyChallengeProgress
  ): Promise<EnhancedXPRewardResult> {
    const baseXP = this.STAR_BASE_REWARDS[challenge.starLevel];
    
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
          description: 'Base reward (fallback)'
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

  // ========================================
  // ADVANCED HELPER METHODS
  // ========================================

  /**
   * Get count of perfect months in category from recent history
   */
  private static async getCategoryPerfectMonthsCount(category: AchievementCategory): Promise<number> {
    try {
      const streakData = await this.getMonthlyStreakData(category);
      return streakData.recentHistory.filter(entry => entry.completionPercentage >= 100).length;
    } catch (error) {
      console.error('EnhancedXPRewardEngine.getCategoryPerfectMonthsCount error:', error);
      return 0;
    }
  }

  /**
   * Check if recent completions were perfect
   */
  private static hasRecentPerfectCompletions(streakData: MonthlyStreakData, count: number): boolean {
    try {
      if (streakData.recentHistory.length < count) return false;
      
      const recentEntries = streakData.recentHistory.slice(0, count);
      return recentEntries.every(entry => entry.completionPercentage >= 100);
    } catch (error) {
      console.error('EnhancedXPRewardEngine.hasRecentPerfectCompletions error:', error);
      return false;
    }
  }

  /**
   * Check if months are consecutive (YYYY-MM format)
   */
  private static isConsecutiveMonth(lastMonth: string, currentMonth: string): boolean {
    try {
      if (!lastMonth || !currentMonth) return false;
      
      const lastDate = new Date(lastMonth + '-01');
      const currentDate = new Date(currentMonth + '-01');
      
      // Add one month to lastDate and check if it equals currentDate
      const nextMonth = new Date(lastDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      return nextMonth.getFullYear() === currentDate.getFullYear() && 
             nextMonth.getMonth() === currentDate.getMonth();
    } catch (error) {
      console.error('EnhancedXPRewardEngine.isConsecutiveMonth error:', error);
      return false;
    }
  }

  /**
   * Save XP reward to history for analytics and tracking
   */
  private static async saveXPRewardToHistory(rewardResult: EnhancedXPRewardResult): Promise<void> {
    try {
      // Load existing history
      const historyKey = this.STORAGE_KEYS.XP_HISTORY;
      const stored = await AsyncStorage.getItem(historyKey);
      
      let history: EnhancedXPRewardResult[] = [];
      if (stored) {
        history = JSON.parse(stored);
      }
      
      // Add new result to history
      history.unshift(rewardResult);
      
      // Keep only last 24 months of history
      history = history.slice(0, 24);
      
      // Save updated history
      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
      
      console.log(`💾 XP reward saved to history: ${rewardResult.totalXPAwarded} XP`);
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.saveXPRewardToHistory error:', error);
      // Don't throw - history saving is not critical
    }
  }

  // ========================================
  // ANALYTICS & STATISTICS METHODS
  // ========================================

  /**
   * Get XP reward statistics for analytics
   */
  public static async getXPRewardStatistics(): Promise<{
    totalXPAwarded: number;
    averageXPPerMonth: number;
    rewardTierDistribution: Record<string, number>;
    topPerformingCategories: Array<{ category: AchievementCategory; totalXP: number }>;
    streakStatistics: {
      averageStreak: number;
      longestStreak: number;
      totalStreakBonuses: number;
    };
  }> {
    try {
      const historyKey = this.STORAGE_KEYS.XP_HISTORY;
      const stored = await AsyncStorage.getItem(historyKey);
      
      if (!stored) {
        return {
          totalXPAwarded: 0,
          averageXPPerMonth: 0,
          rewardTierDistribution: {},
          topPerformingCategories: [],
          streakStatistics: {
            averageStreak: 0,
            longestStreak: 0,
            totalStreakBonuses: 0
          }
        };
      }
      
      const history: EnhancedXPRewardResult[] = JSON.parse(stored);
      
      // Calculate statistics
      const totalXPAwarded = history.reduce((sum, reward) => sum + reward.totalXPAwarded, 0);
      const averageXPPerMonth = history.length > 0 ? totalXPAwarded / history.length : 0;
      
      // Reward tier distribution
      const rewardTierDistribution = history.reduce((acc, reward) => {
        acc[reward.rewardTier] = (acc[reward.rewardTier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Streak statistics
      const streakBonuses = history.map(reward => reward.streakBonus);
      const totalStreakBonuses = streakBonuses.reduce((sum, bonus) => sum + bonus, 0);
      
      return {
        totalXPAwarded: Math.round(totalXPAwarded),
        averageXPPerMonth: Math.round(averageXPPerMonth),
        rewardTierDistribution,
        topPerformingCategories: [], // Could be implemented with more data
        streakStatistics: {
          averageStreak: 0, // Would need more detailed tracking
          longestStreak: 0, // Would need more detailed tracking
          totalStreakBonuses
        }
      };
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.getXPRewardStatistics error:', error);
      return {
        totalXPAwarded: 0,
        averageXPPerMonth: 0,
        rewardTierDistribution: {},
        topPerformingCategories: [],
        streakStatistics: { averageStreak: 0, longestStreak: 0, totalStreakBonuses: 0 }
      };
    }
  }

  /**
   * Get detailed breakdown of XP sources for balance analysis
   */
  public static async getXPSourceBreakdown(): Promise<{
    baseRewards: { total: number; average: number; byStarLevel: Record<number, number> };
    completionBonuses: { total: number; perfect: number; partial: number };
    streakBonuses: { total: number; averagePerMonth: number };
    milestoneBonuses: { total: number; types: Record<string, number> };
  }> {
    try {
      const historyKey = this.STORAGE_KEYS.XP_HISTORY;
      const stored = await AsyncStorage.getItem(historyKey);
      
      if (!stored) {
        return {
          baseRewards: { total: 0, average: 0, byStarLevel: {} },
          completionBonuses: { total: 0, perfect: 0, partial: 0 },
          streakBonuses: { total: 0, averagePerMonth: 0 },
          milestoneBonuses: { total: 0, types: {} }
        };
      }
      
      const history: EnhancedXPRewardResult[] = JSON.parse(stored);
      
      // Base rewards analysis
      const baseRewards = {
        total: history.reduce((sum, reward) => sum + reward.baseXPReward, 0),
        average: history.length > 0 ? history.reduce((sum, reward) => sum + reward.baseXPReward, 0) / history.length : 0,
        byStarLevel: history.reduce((acc, reward) => {
          acc[reward.starLevel] = (acc[reward.starLevel] || 0) + reward.baseXPReward;
          return acc;
        }, {} as Record<number, number>)
      };
      
      // Completion bonuses analysis
      const completionBonuses = {
        total: history.reduce((sum, reward) => sum + reward.completionBonus, 0),
        perfect: history.filter(r => r.completionPercentage >= 100).reduce((sum, reward) => sum + reward.completionBonus, 0),
        partial: history.filter(r => r.completionPercentage < 100 && r.completionPercentage >= 70).reduce((sum, reward) => sum + reward.completionBonus, 0)
      };
      
      // Streak bonuses analysis
      const streakBonuses = {
        total: history.reduce((sum, reward) => sum + reward.streakBonus, 0),
        averagePerMonth: history.length > 0 ? history.reduce((sum, reward) => sum + reward.streakBonus, 0) / history.length : 0
      };
      
      // Milestone bonuses analysis
      const milestoneBonuses = {
        total: history.reduce((sum, reward) => sum + reward.milestoneBonus, 0),
        types: {} // Could be more detailed with bonus type tracking
      };
      
      return {
        baseRewards,
        completionBonuses,
        streakBonuses,
        milestoneBonuses
      };
      
    } catch (error) {
      console.error('EnhancedXPRewardEngine.getXPSourceBreakdown error:', error);
      return {
        baseRewards: { total: 0, average: 0, byStarLevel: {} },
        completionBonuses: { total: 0, perfect: 0, partial: 0 },
        streakBonuses: { total: 0, averagePerMonth: 0 },
        milestoneBonuses: { total: 0, types: {} }
      };
    }
  }

  // ========================================
  // MAINTENANCE & DEBUGGING METHODS
  // ========================================

  /**
   * Clear all caches (for testing/debugging)
   */
  public static clearAllCaches(): void {
    this.streakCache.clear();
    console.log('🧹 Enhanced XP Reward Engine caches cleared');
  }

  /**
   * Get engine status and health metrics
   */
  public static getEngineStatus(): {
    cacheSize: number;
    isHealthy: boolean;
    lastCalculation: Date | null;
    configurationValid: boolean;
  } {
    return {
      cacheSize: this.streakCache.size,
      isHealthy: true, // Could add more health checks
      lastCalculation: null, // Could track last calculation
      configurationValid: this.validateConfiguration()
    };
  }

  /**
   * Validate configuration integrity
   */
  private static validateConfiguration(): boolean {
    try {
      // Check that all star levels have rewards
      const starLevels: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];
      for (const level of starLevels) {
        if (!this.STAR_BASE_REWARDS[level] || this.STAR_BASE_REWARDS[level] <= 0) {
          return false;
        }
      }
      
      // Check bonus configuration
      if (this.BONUS_CONFIG.PERFECT_COMPLETION_BONUS <= 0 || 
          this.BONUS_CONFIG.PERFECT_COMPLETION_BONUS > 1) {
        return false;
      }
      
      if (this.BONUS_CONFIG.PARTIAL_COMPLETION_THRESHOLD <= 0 || 
          this.BONUS_CONFIG.PARTIAL_COMPLETION_THRESHOLD >= 1) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('EnhancedXPRewardEngine.validateConfiguration error:', error);
      return false;
    }
  }

  /**
   * Get current bonus configuration for external access
   */
  public static getBonusConfiguration() {
    return { ...this.BONUS_CONFIG };
  }

  /**
   * Get current star base rewards for external access
   */
  public static getStarBaseRewards() {
    return { ...this.STAR_BASE_REWARDS };
  }
}