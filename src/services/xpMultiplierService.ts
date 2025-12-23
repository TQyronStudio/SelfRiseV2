/**
 * XP Multiplier Service
 * 
 * Implements comprehensive XP multiplier system with Harmony Streak detection,
 * 24-hour 2x XP multipliers, and advanced tracking capabilities.
 * 
 * Features:
 * - Harmony Streak Detection (all 3 categories active for 7+ days)
 * - 24-hour 2x XP Multiplier activation and timer system
 * - Multiplier history tracking and usage statistics
 * - Cooldown management and anti-abuse protection
 * - Achievement integration and celebration system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import i18next from 'i18next';
import { DateString } from '../types/common';
import { XPMultiplier, MultiplierCondition } from '../types/gamification';
import { XP_MULTIPLIERS } from '../constants/gamification';
import { formatDateToString, today, addDays, subtractDays } from '../utils/date';
import { GoalStorage } from './storage/goalStorage';
import { GratitudeStorage } from './storage/gratitudeStorage';

// ========================================
// INTERFACES & TYPES
// ========================================

/**
 * Daily activity data for harmony streak calculation
 */
export interface DailyActivityData {
  date: DateString;
  hasHabitActivity: boolean;
  hasJournalActivity: boolean;
  hasGoalActivity: boolean;
  habitCompletions: number;
  journalEntries: number;
  goalProgressUpdates: number;
}

/**
 * Harmony streak calculation result
 */
export interface HarmonyStreakResult {
  currentStreak: number;
  longestStreak: number;
  isActive: boolean; // Current streak >= 7 days
  canActivateMultiplier: boolean; // Active streak + cooldown passed
  nextActivationDate?: Date | undefined;
  lastActivationDate?: Date | undefined;
  streakStartDate?: DateString | undefined;
  streakHistory: DailyActivityData[];
}

/**
 * Active multiplier information
 */
export interface ActiveMultiplierInfo {
  isActive: boolean;
  multiplier: number;
  activatedAt?: Date;
  expiresAt?: Date;
  source: 'harmony_streak' | 'weekly_challenge' | 'achievement' | 'special_event' | 'inactive_user_return';
  timeRemaining?: number; // Milliseconds
  description?: string;
}

/**
 * Multiplier activation result
 */
export interface MultiplierActivationResult {
  success: boolean;
  multiplier?: ActiveMultiplierInfo;
  error?: string;
  reason?: string; // Why activation succeeded/failed
  xpBonusAwarded?: number; // Bonus XP for activation
}

/**
 * Multiplier usage statistics
 */
export interface MultiplierStats {
  totalActivations: number;
  totalBonusXP: number;
  averageMultiplierDuration: number; // Hours
  longestHarmonyStreak: number;
  currentHarmonyStreak: number;
  lastActivationDate?: Date | undefined;
  activationHistory: MultiplierActivationHistory[];
  cooldownStatus: {
    isOnCooldown: boolean;
    cooldownEndsAt?: Date | undefined;
    timeRemaining?: number | undefined; // Milliseconds
  };
}

/**
 * Historical multiplier activation record
 */
export interface MultiplierActivationHistory {
  id: string;
  activatedAt: Date;
  expiresAt: Date;
  source: string;
  multiplier: number;
  duration: number; // Hours
  xpBonusAwarded: number;
  harmonyStreakLength: number;
  context?: Record<string, any>;
}

// ========================================
// STORAGE KEYS
// ========================================

const MULTIPLIER_STORAGE_KEYS = {
  ACTIVE_MULTIPLIER: 'xp_multiplier_active',
  MULTIPLIER_HISTORY: 'xp_multiplier_history',
  HARMONY_STREAK_DATA: 'harmony_streak_data',
  MULTIPLIER_STATS: 'xp_multiplier_stats',
  LAST_HARMONY_CHECK: 'harmony_streak_last_check',
  COOLDOWN_DATA: 'xp_multiplier_cooldown',
} as const;

/**
 * XP Multiplier Service
 * 
 * Main service class for managing XP multipliers and Harmony Streak detection
 */
export class XPMultiplierService {

  // ========================================
  // HARMONY STREAK DETECTION
  // ========================================

  /**
   * Calculate current harmony streak (all 3 categories active daily)
   * 
   * A harmony streak day requires:
   * - At least 1 habit completion (scheduled or bonus)
   * - At least 3 journal entries (meeting daily minimum)
   * - At least 1 goal progress update
   */
  static async calculateHarmonyStreak(): Promise<HarmonyStreakResult> {
    try {
      console.log('🎯 Calculating Harmony Streak...');
      
      // Get activity data for last 30 days to calculate streak properly
      const activityData = await this.getRecentActivityData(30);
      
      // Calculate current streak (consecutive days from most recent)
      const currentStreak = this.calculateStreakFromActivityData(activityData);
      
      // Calculate longest streak in history
      const longestStreak = this.calculateLongestStreakFromData(activityData);
      
      // Determine streak start date
      let streakStartDate: DateString | undefined;
      if (currentStreak > 0) {
        streakStartDate = subtractDays(today(), currentStreak - 1);
      }
      
      // Check if multiplier can be activated
      const isActive = currentStreak >= XP_MULTIPLIERS.HARMONY_STREAK_DAYS_REQUIRED;
      const cooldownInfo = await this.getMultiplierCooldownInfo();
      const canActivateMultiplier = isActive && !cooldownInfo.isOnCooldown;
      
      const result: HarmonyStreakResult = {
        currentStreak,
        longestStreak,
        isActive,
        canActivateMultiplier,
        nextActivationDate: cooldownInfo.cooldownEndsAt,
        lastActivationDate: await this.getLastActivationDate(),
        streakStartDate,
        streakHistory: activityData,
      };
      
      console.log(`🎯 Harmony Streak calculated: ${currentStreak} days (longest: ${longestStreak})`);
      console.log(`🎯 Can activate multiplier: ${canActivateMultiplier} (active: ${isActive}, cooldown: ${cooldownInfo.isOnCooldown})`);
      
      // Store the result for caching
      await this.storeHarmonyStreakData(result);
      
      return result;
      
    } catch (error) {
      console.error('XPMultiplierService.calculateHarmonyStreak error:', error);
      
      // Return safe default
      return {
        currentStreak: 0,
        longestStreak: 0,
        isActive: false,
        canActivateMultiplier: false,
        streakHistory: [],
      };
    }
  }

  /**
   * Get activity data for recent days
   */
  private static async getRecentActivityData(days: number): Promise<DailyActivityData[]> {
    try {
      const { getHabitStorageImpl, getGratitudeStorageImpl } = require('../config/featureFlags');
      const habitStorage = getHabitStorageImpl();
      const gratitudeStorage = getGratitudeStorageImpl();
      const goalStorage = new GoalStorage();
      
      const activityData: DailyActivityData[] = [];
      const todayString = today();
      
      for (let i = 0; i < days; i++) {
        const dateString = subtractDays(todayString, i);
        
        // Get activity for this date
        const [habitCompletions, journalEntries, goalProgress] = await Promise.all([
          this.getHabitActivityForDate(habitStorage, dateString),
          this.getJournalActivityForDate(gratitudeStorage, dateString),
          this.getGoalActivityForDate(goalStorage, dateString),
        ]);
        
        const dailyActivity: DailyActivityData = {
          date: dateString,
          hasHabitActivity: habitCompletions > 0,
          hasJournalActivity: journalEntries >= 3, // Must meet daily minimum
          hasGoalActivity: goalProgress > 0,
          habitCompletions,
          journalEntries,
          goalProgressUpdates: goalProgress,
        };
        
        activityData.push(dailyActivity);
      }
      
      // Sort by date (most recent first)
      activityData.sort((a, b) => b.date.localeCompare(a.date));
      
      return activityData;
      
    } catch (error) {
      console.error('XPMultiplierService.getRecentActivityData error:', error);
      return [];
    }
  }

  /**
   * Get habit activity for specific date
   */
  private static async getHabitActivityForDate(
    habitStorage: any,
    date: DateString
  ): Promise<number> {
    try {
      const completions = await habitStorage.getCompletionsByDate(date);
      return completions.length;
    } catch (error) {
      console.error(`Error getting habit activity for ${date}:`, error);
      return 0;
    }
  }

  /**
   * Get journal activity for specific date
   */
  private static async getJournalActivityForDate(
    gratitudeStorage: GratitudeStorage,
    date: DateString
  ): Promise<number> {
    try {
      const entries = await gratitudeStorage.getEntriesForDate(date);
      return entries.length;
    } catch (error) {
      console.error(`Error getting journal activity for ${date}:`, error);
      return 0;
    }
  }

  /**
   * Get goal activity for specific date
   */
  private static async getGoalActivityForDate(
    goalStorage: GoalStorage,
    date: DateString
  ): Promise<number> {
    try {
      // Check if any goals had progress added on this date
      // Note: This is a simplified implementation. In real app, you'd track goal progress timestamps
      const goals = await goalStorage.getAll();
      
      // For now, we'll use a heuristic: if goals exist and it's a recent date, assume some activity
      // This should be replaced with proper goal progress tracking by date
      const recentDays = 7;
      const daysSinceDate = Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
      
      if (goals.length > 0 && daysSinceDate <= recentDays) {
        // Return 1 to indicate goal activity (this is a placeholder)
        return goals.filter(goal => goal.currentValue > 0).length > 0 ? 1 : 0;
      }
      
      return 0;
    } catch (error) {
      console.error(`Error getting goal activity for ${date}:`, error);
      return 0;
    }
  }

  /**
   * Calculate consecutive streak from activity data
   */
  private static calculateStreakFromActivityData(activityData: DailyActivityData[]): number {
    let streak = 0;
    
    // Start from most recent day and count backwards
    for (const dayActivity of activityData) {
      const isHarmonyDay = dayActivity.hasHabitActivity && 
                          dayActivity.hasJournalActivity && 
                          dayActivity.hasGoalActivity;
      
      if (isHarmonyDay) {
        streak++;
      } else {
        break; // Streak is broken
      }
    }
    
    return streak;
  }

  /**
   * Calculate longest streak from activity data
   */
  private static calculateLongestStreakFromData(activityData: DailyActivityData[]): number {
    let longestStreak = 0;
    let currentStreak = 0;
    
    // Go through all days (chronologically)
    const sortedData = [...activityData].sort((a, b) => a.date.localeCompare(b.date));
    
    for (const dayActivity of sortedData) {
      const isHarmonyDay = dayActivity.hasHabitActivity && 
                          dayActivity.hasJournalActivity && 
                          dayActivity.hasGoalActivity;
      
      if (isHarmonyDay) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return longestStreak;
  }

  /**
   * Store harmony streak data for caching
   */
  private static async storeHarmonyStreakData(data: HarmonyStreakResult): Promise<void> {
    try {
      await AsyncStorage.setItem(MULTIPLIER_STORAGE_KEYS.HARMONY_STREAK_DATA, JSON.stringify({
        ...data,
        calculatedAt: new Date().toISOString(),
      }));
      
      await AsyncStorage.setItem(MULTIPLIER_STORAGE_KEYS.LAST_HARMONY_CHECK, today());
    } catch (error) {
      console.error('XPMultiplierService.storeHarmonyStreakData error:', error);
    }
  }

  /**
   * Get cached harmony streak data if recent
   */
  static async getCachedHarmonyStreak(): Promise<HarmonyStreakResult | null> {
    try {
      const lastCheck = await AsyncStorage.getItem(MULTIPLIER_STORAGE_KEYS.LAST_HARMONY_CHECK);
      
      // If we haven't checked today, recalculate
      if (lastCheck !== today()) {
        return null;
      }
      
      const stored = await AsyncStorage.getItem(MULTIPLIER_STORAGE_KEYS.HARMONY_STREAK_DATA);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      
      // Convert dates back to Date objects
      return {
        ...data,
        nextActivationDate: data.nextActivationDate ? new Date(data.nextActivationDate) : undefined,
        lastActivationDate: data.lastActivationDate ? new Date(data.lastActivationDate) : undefined,
      };
      
    } catch (error) {
      console.error('XPMultiplierService.getCachedHarmonyStreak error:', error);
      return null;
    }
  }

  // ========================================
  // MULTIPLIER ACTIVATION & MANAGEMENT
  // ========================================

  /**
   * Activate harmony streak 2x XP multiplier
   */
  static async activateHarmonyMultiplier(): Promise<MultiplierActivationResult> {
    try {
      console.log('🚀 Attempting to activate Harmony Multiplier...');
      
      // Check if multiplier is already active
      const currentMultiplier = await this.getActiveMultiplier();
      if (currentMultiplier.isActive) {
        return {
          success: false,
          error: i18next.t('gamification.multiplier.errors.alreadyActive'),
          reason: i18next.t('gamification.multiplier.errors.alreadyRunning', { source: currentMultiplier.source }),
        };
      }

      // Check harmony streak eligibility
      const harmonyStreak = await this.calculateHarmonyStreak();
      if (!harmonyStreak.canActivateMultiplier) {
        const reason = !harmonyStreak.isActive
          ? i18next.t('gamification.multiplier.errors.needHarmonyStreak', { days: XP_MULTIPLIERS.HARMONY_STREAK_DAYS_REQUIRED, current: harmonyStreak.currentStreak })
          : i18next.t('gamification.multiplier.errors.onCooldown');

        return {
          success: false,
          error: i18next.t('gamification.multiplier.errors.cannotActivate'),
          reason,
        };
      }
      
      // Create multiplier
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (XP_MULTIPLIERS.HARMONY_STREAK_DURATION * 60 * 60 * 1000));
      
      const multiplier: XPMultiplier = {
        id: `harmony_${now.getTime()}`,
        createdAt: now,
        updatedAt: now,
        multiplier: XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER,
        duration: XP_MULTIPLIERS.HARMONY_STREAK_DURATION,
        activatedAt: now,
        expiresAt,
        source: 'harmony_streak',
        isActive: true,
      };
      
      // Store active multiplier
      await AsyncStorage.setItem(MULTIPLIER_STORAGE_KEYS.ACTIVE_MULTIPLIER, JSON.stringify(multiplier));
      
      // Award bonus XP for activation
      const bonusXP = XP_MULTIPLIERS.HARMONY_STREAK_DURATION * 10; // 10 XP per hour of multiplier
      
      try {
        const { GamificationService } = await import('./gamificationService');
        await GamificationService.addXP(bonusXP, {
          source: 'xp_multiplier_bonus' as any,
          description: i18next.t('gamification.multiplier.descriptions.harmonyActivated', { hours: XP_MULTIPLIERS.HARMONY_STREAK_DURATION }),
          metadata: {
            multiplierSource: 'harmony_streak',
            harmonyStreakLength: harmonyStreak.currentStreak,
          },
        });
      } catch (error) {
        console.error('Failed to award multiplier activation bonus XP:', error);
      }

      // Record activation history
      await this.recordMultiplierActivation(multiplier, harmonyStreak.currentStreak, bonusXP);

      // Set cooldown
      await this.setMultiplierCooldown('harmony_streak', XP_MULTIPLIERS.HARMONY_STREAK_COOLDOWN);

      // Trigger celebration event
      this.triggerMultiplierActivationEvent(multiplier, harmonyStreak.currentStreak);

      console.log(`🚀 Harmony Multiplier activated! 2x XP for ${XP_MULTIPLIERS.HARMONY_STREAK_DURATION} hours`);

      return {
        success: true,
        multiplier: {
          isActive: true,
          multiplier: multiplier.multiplier,
          activatedAt: multiplier.activatedAt,
          expiresAt: multiplier.expiresAt,
          source: multiplier.source,
          timeRemaining: expiresAt.getTime() - now.getTime(),
          description: i18next.t('gamification.multiplier.descriptions.xpFor', { hours: XP_MULTIPLIERS.HARMONY_STREAK_DURATION }),
        },
        xpBonusAwarded: bonusXP,
      };
      
    } catch (error) {
      console.error('XPMultiplierService.activateHarmonyMultiplier error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get currently active multiplier information
   */
  static async getActiveMultiplier(): Promise<ActiveMultiplierInfo> {
    try {
      const { FEATURE_FLAGS } = await import('../config/featureFlags');

      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation - query active multipliers
        const { getDatabase } = await import('./database/init');
        const db = getDatabase();
        const now = Date.now();

        const activeMultiplier = await db.getFirstAsync<{
          id: string;
          source: string;
          multiplier: number;
          activated_at: number;
          expires_at: number | null;
        }>(
          `SELECT * FROM xp_multipliers
           WHERE is_active = 1
           AND (expires_at IS NULL OR expires_at > ?)
           ORDER BY activated_at DESC
           LIMIT 1`,
          [now]
        );

        if (!activeMultiplier) {
          return { isActive: false, multiplier: 1, source: 'harmony_streak' };
        }

        const expiresAt = activeMultiplier.expires_at
          ? new Date(activeMultiplier.expires_at)
          : undefined;

        const result: ActiveMultiplierInfo = {
          isActive: true,
          multiplier: activeMultiplier.multiplier,
          activatedAt: new Date(activeMultiplier.activated_at),
          source: activeMultiplier.source as any,
          description: 'Active multiplier',
        };
        if (expiresAt) {
          result.expiresAt = expiresAt;
          result.timeRemaining = expiresAt.getTime() - now;
        }
        return result;
      } else {
        // Legacy AsyncStorage implementation
        const stored = await AsyncStorage.getItem(MULTIPLIER_STORAGE_KEYS.ACTIVE_MULTIPLIER);
        if (!stored) {
          return { isActive: false, multiplier: 1, source: 'harmony_streak' };
        }

        const multiplierData = JSON.parse(stored);
        const expiresAt = new Date(multiplierData.expiresAt);
        const now = new Date();

        // Check if multiplier has expired
        if (expiresAt <= now) {
          await AsyncStorage.removeItem(MULTIPLIER_STORAGE_KEYS.ACTIVE_MULTIPLIER);
          return { isActive: false, multiplier: 1, source: 'harmony_streak' };
        }

        return {
          isActive: true,
          multiplier: multiplierData.multiplier,
          activatedAt: new Date(multiplierData.activatedAt),
          expiresAt,
          source: multiplierData.source,
          timeRemaining: expiresAt.getTime() - now.getTime(),
          description: this.getMultiplierDescription(multiplierData),
        };
      }
    } catch (error) {
      console.error('XPMultiplierService.getActiveMultiplier error:', error);
      return { isActive: false, multiplier: 1, source: 'harmony_streak' };
    }
  }

  /**
   * Get multiplier description based on source
   */
  private static getMultiplierDescription(multiplierData: XPMultiplier): string {
    const hoursLeft = Math.ceil((new Date(multiplierData.expiresAt).getTime() - Date.now()) / (60 * 60 * 1000));
    const params = { multiplier: multiplierData.multiplier, hours: hoursLeft };

    switch (multiplierData.source) {
      case 'harmony_streak':
        return i18next.t('gamification.multiplier.descriptions.harmonyStreak', params);
      case 'weekly_challenge':
        return i18next.t('gamification.multiplier.descriptions.challengeReward', params);
      case 'achievement':
        return i18next.t('gamification.multiplier.descriptions.achievementBonus', params);
      case 'special_event':
        return i18next.t('gamification.multiplier.descriptions.specialEvent', params);
      case 'inactive_user_return':
        return i18next.t('gamification.multiplier.descriptions.welcomeBack', params);
      default:
        return i18next.t('gamification.multiplier.descriptions.default', params);
    }
  }

  // ========================================
  // COOLDOWN MANAGEMENT
  // ========================================

  /**
   * Get multiplier cooldown information
   */
  private static async getMultiplierCooldownInfo(): Promise<{
    isOnCooldown: boolean;
    cooldownEndsAt?: Date | undefined;
    timeRemaining?: number | undefined;
  }> {
    try {
      const stored = await AsyncStorage.getItem(MULTIPLIER_STORAGE_KEYS.COOLDOWN_DATA);
      if (!stored) {
        return { isOnCooldown: false };
      }
      
      const cooldownData = JSON.parse(stored);
      const cooldownEndsAt = new Date(cooldownData.endsAt);
      const now = new Date();
      
      if (cooldownEndsAt <= now) {
        // Cooldown has ended
        await AsyncStorage.removeItem(MULTIPLIER_STORAGE_KEYS.COOLDOWN_DATA);
        return { isOnCooldown: false };
      }
      
      return {
        isOnCooldown: true,
        cooldownEndsAt: cooldownEndsAt,
        timeRemaining: cooldownEndsAt.getTime() - now.getTime(),
      };
      
    } catch (error) {
      console.error('XPMultiplierService.getMultiplierCooldownInfo error:', error);
      return { isOnCooldown: false };
    }
  }

  /**
   * Set multiplier cooldown
   */
  private static async setMultiplierCooldown(source: string, hours: number): Promise<void> {
    try {
      const endsAt = new Date(Date.now() + (hours * 60 * 60 * 1000));
      
      const cooldownData = {
        source,
        startedAt: new Date().toISOString(),
        endsAt: endsAt.toISOString(),
        durationHours: hours,
      };
      
      await AsyncStorage.setItem(MULTIPLIER_STORAGE_KEYS.COOLDOWN_DATA, JSON.stringify(cooldownData));
    } catch (error) {
      console.error('XPMultiplierService.setMultiplierCooldown error:', error);
    }
  }

  /**
   * Get last activation date
   */
  private static async getLastActivationDate(): Promise<Date | undefined> {
    try {
      const history = await this.getMultiplierHistory();
      if (history.length === 0) return undefined;
      
      // Sort by activation date and get most recent
      const sorted = history.sort((a, b) => b.activatedAt.getTime() - a.activatedAt.getTime());
      return sorted[0]!.activatedAt;
      
    } catch (error) {
      console.error('XPMultiplierService.getLastActivationDate error:', error);
      return undefined;
    }
  }

  // ========================================
  // STATISTICS & HISTORY
  // ========================================

  /**
   * Record multiplier activation in history
   */
  private static async recordMultiplierActivation(
    multiplier: XPMultiplier,
    harmonyStreakLength: number,
    xpBonusAwarded: number
  ): Promise<void> {
    try {
      const history = await this.getMultiplierHistory();
      
      const activationRecord: MultiplierActivationHistory = {
        id: multiplier.id,
        activatedAt: multiplier.activatedAt,
        expiresAt: multiplier.expiresAt,
        source: multiplier.source,
        multiplier: multiplier.multiplier,
        duration: multiplier.duration,
        xpBonusAwarded,
        harmonyStreakLength,
        context: {
          deviceTime: new Date().toISOString(),
          streakQuality: harmonyStreakLength >= 14 ? 'excellent' : harmonyStreakLength >= 7 ? 'good' : 'minimal',
        },
      };
      
      history.push(activationRecord);
      
      // Keep only last 50 activations for performance
      const trimmedHistory = history.slice(-50);
      
      await AsyncStorage.setItem(MULTIPLIER_STORAGE_KEYS.MULTIPLIER_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('XPMultiplierService.recordMultiplierActivation error:', error);
    }
  }

  /**
   * Get multiplier activation history
   */
  static async getMultiplierHistory(): Promise<MultiplierActivationHistory[]> {
    try {
      const stored = await AsyncStorage.getItem(MULTIPLIER_STORAGE_KEYS.MULTIPLIER_HISTORY);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      return history.map((record: any) => ({
        ...record,
        activatedAt: new Date(record.activatedAt),
        expiresAt: new Date(record.expiresAt),
      }));
      
    } catch (error) {
      console.error('XPMultiplierService.getMultiplierHistory error:', error);
      return [];
    }
  }

  /**
   * Get comprehensive multiplier statistics
   */
  static async getMultiplierStats(): Promise<MultiplierStats> {
    try {
      const [history, harmonyStreak, cooldownInfo] = await Promise.all([
        this.getMultiplierHistory(),
        this.calculateHarmonyStreak(),
        this.getMultiplierCooldownInfo(),
      ]);
      
      const totalActivations = history.length;
      const totalBonusXP = history.reduce((sum, record) => sum + record.xpBonusAwarded, 0);
      const averageMultiplierDuration = history.length > 0 
        ? history.reduce((sum, record) => sum + record.duration, 0) / history.length
        : 0;
      
      const lastActivationDate = history.length > 0 
        ? history.sort((a, b) => b.activatedAt.getTime() - a.activatedAt.getTime())[0]!.activatedAt
        : undefined;
      
      return {
        totalActivations,
        totalBonusXP,
        averageMultiplierDuration,
        longestHarmonyStreak: harmonyStreak.longestStreak,
        currentHarmonyStreak: harmonyStreak.currentStreak,
        lastActivationDate,
        activationHistory: history.slice(-10), // Last 10 activations
        cooldownStatus: {
          isOnCooldown: cooldownInfo.isOnCooldown,
          cooldownEndsAt: cooldownInfo.cooldownEndsAt,
          timeRemaining: cooldownInfo.timeRemaining,
        },
      };
      
    } catch (error) {
      console.error('XPMultiplierService.getMultiplierStats error:', error);
      
      // Return safe defaults
      return {
        totalActivations: 0,
        totalBonusXP: 0,
        averageMultiplierDuration: 0,
        longestHarmonyStreak: 0,
        currentHarmonyStreak: 0,
        activationHistory: [],
        cooldownStatus: { isOnCooldown: false },
      };
    }
  }

  // ========================================
  // EVENT SYSTEM & NOTIFICATIONS
  // ========================================

  /**
   * Trigger multiplier activation celebration event
   */
  private static triggerMultiplierActivationEvent(
    multiplier: XPMultiplier,
    harmonyStreakLength: number
  ): void {
    try {
      DeviceEventEmitter.emit('xpMultiplierActivated', {
        multiplier: multiplier.multiplier,
        duration: multiplier.duration,
        source: multiplier.source,
        harmonyStreakLength,
        expiresAt: multiplier.expiresAt,
        timestamp: Date.now(),
      });
      
      console.log(`🎉 XP Multiplier activation event triggered: ${multiplier.multiplier}x for ${multiplier.duration}h`);
    } catch (error) {
      console.error('XPMultiplierService.triggerMultiplierActivationEvent error:', error);
    }
  }

  /**
   * Check if user is eligible for harmony streak notification
   */
  static async checkHarmonyStreakNotificationEligibility(): Promise<{
    shouldNotify: boolean;
    message?: string;
    daysNeeded?: number;
    currentStreak: number;
  }> {
    try {
      const harmonyStreak = await this.calculateHarmonyStreak();
      const { currentStreak } = harmonyStreak;
      
      // Notify at specific milestones
      const notificationMilestones = [3, 5, 6]; // Close to activation threshold
      
      const shouldNotify = notificationMilestones.includes(currentStreak);
      
      if (shouldNotify) {
        const daysNeeded = XP_MULTIPLIERS.HARMONY_STREAK_DAYS_REQUIRED - currentStreak;
        return {
          shouldNotify: true,
          message: daysNeeded === 1
            ? i18next.t('gamification.multiplier.notifications.oneMoreDay')
            : i18next.t('gamification.multiplier.notifications.moreDays', { days: daysNeeded }),
          daysNeeded,
          currentStreak,
        };
      }
      
      return {
        shouldNotify: false,
        currentStreak,
      };
      
    } catch (error) {
      console.error('XPMultiplierService.checkHarmonyStreakNotificationEligibility error:', error);
      return {
        shouldNotify: false,
        currentStreak: 0,
      };
    }
  }

  // ========================================
  // DEVELOPMENT & TESTING UTILITIES
  // ========================================

  /**
   * Reset all multiplier data (for testing)
   */
  static async resetAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        MULTIPLIER_STORAGE_KEYS.ACTIVE_MULTIPLIER,
        MULTIPLIER_STORAGE_KEYS.MULTIPLIER_HISTORY,
        MULTIPLIER_STORAGE_KEYS.HARMONY_STREAK_DATA,
        MULTIPLIER_STORAGE_KEYS.MULTIPLIER_STATS,
        MULTIPLIER_STORAGE_KEYS.LAST_HARMONY_CHECK,
        MULTIPLIER_STORAGE_KEYS.COOLDOWN_DATA,
      ]);
      
      console.log('🧹 All XP Multiplier data reset');
    } catch (error) {
      console.error('XPMultiplierService.resetAllData error:', error);
    }
  }

  /**
   * Get debug information about multiplier system
   */
  static async getDebugInfo(): Promise<any> {
    try {
      const [activeMultiplier, harmonyStreak, stats, cooldownInfo] = await Promise.all([
        this.getActiveMultiplier(),
        this.calculateHarmonyStreak(),
        this.getMultiplierStats(),
        this.getMultiplierCooldownInfo(),
      ]);
      
      return {
        activeMultiplier,
        harmonyStreak,
        stats,
        cooldownInfo,
        constants: XP_MULTIPLIERS,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('XPMultiplierService.getDebugInfo error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ========================================
  // INACTIVE USER RE-ENGAGEMENT SYSTEM
  // ========================================

  /**
   * Check if user has been inactive for 4+ days and should receive 2x XP boost
   */
  static async checkInactiveUserStatus(): Promise<{
    isInactive: boolean;
    daysSinceLastActivity: number;
    shouldActivateBoost: boolean;
    lastActivityDate: string;
  }> {
    try {
      // Import GamificationService for last activity check
      const { GamificationService } = require('./gamificationService');
      
      const lastActivityDate = await GamificationService.getLastActivity();
      const today = formatDateToString(new Date());
      
      // Calculate days since last activity
      const lastActivity = new Date(lastActivityDate);
      const currentDate = new Date(today);
      const timeDiff = currentDate.getTime() - lastActivity.getTime();
      const daysSinceLastActivity = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      const isInactive = daysSinceLastActivity >= 4;
      
      console.log(`🔍 Inactive user check: ${daysSinceLastActivity} days since last activity (${lastActivityDate})`);
      
      // Check if boost should be activated (inactive + no current multiplier)
      const currentMultiplier = await this.getActiveMultiplier();
      const shouldActivateBoost = isInactive && !currentMultiplier.isActive;
      
      return {
        isInactive,
        daysSinceLastActivity,
        shouldActivateBoost,
        lastActivityDate,
      };
    } catch (error) {
      console.error('XPMultiplierService.checkInactiveUserStatus error:', error);
      return {
        isInactive: false,
        daysSinceLastActivity: 0,
        shouldActivateBoost: false,
        lastActivityDate: formatDateToString(new Date()),
      };
    }
  }

  /**
   * Activate 2x XP boost for inactive user returning to app
   */
  static async activateInactiveUserBoost(): Promise<MultiplierActivationResult> {
    try {
      console.log('🚀 Attempting to activate Inactive User Comeback Boost...');
      
      // Check if multiplier is already active
      const currentMultiplier = await this.getActiveMultiplier();
      if (currentMultiplier.isActive) {
        return {
          success: false,
          error: i18next.t('gamification.multiplier.errors.alreadyActive'),
          reason: i18next.t('gamification.multiplier.errors.alreadyRunning', { source: currentMultiplier.source }),
        };
      }

      // Check inactive user status
      const inactiveStatus = await this.checkInactiveUserStatus();
      if (!inactiveStatus.shouldActivateBoost) {
        const reason = inactiveStatus.isInactive
          ? i18next.t('gamification.multiplier.errors.userInactiveButActive')
          : i18next.t('gamification.multiplier.errors.userNotInactive', { days: inactiveStatus.daysSinceLastActivity });

        return {
          success: false,
          error: i18next.t('gamification.multiplier.errors.cannotActivateInactive'),
          reason,
        };
      }
      
      // Create multiplier (48 hours = 2 days duration)
      const BOOST_DURATION_HOURS = 48;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (BOOST_DURATION_HOURS * 60 * 60 * 1000));
      
      const multiplier: XPMultiplier = {
        id: `inactive_return_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        multiplier: 2.0, // 2x XP
        activatedAt: now,
        expiresAt,
        source: 'inactive_user_return',
        duration: BOOST_DURATION_HOURS,
        isActive: true,
        metadata: {
          daysSinceLastActivity: inactiveStatus.daysSinceLastActivity,
          lastActivityDate: inactiveStatus.lastActivityDate,
          activationReason: 'Inactive user comeback boost',
        }
      };
      
      // Store active multiplier
      await AsyncStorage.setItem(
        MULTIPLIER_STORAGE_KEYS.ACTIVE_MULTIPLIER,
        JSON.stringify(multiplier)
      );
      
      // Award bonus XP for comeback (25 XP bonus)
      const bonusXP = 25;
      const { GamificationService } = require('./gamificationService');
      
      await GamificationService.addXP(bonusXP, {
        source: 'XP_MULTIPLIER_BONUS' as any,
        sourceId: multiplier.id,
        description: i18next.t('gamification.multiplier.descriptions.comebackBonus', { days: inactiveStatus.daysSinceLastActivity }),
        skipLimits: true,
        metadata: {
          type: 'inactive_user_return_bonus',
          daysSinceLastActivity: inactiveStatus.daysSinceLastActivity,
        }
      });
      
      // Record activation in history
      await this.recordMultiplierActivation(multiplier, 0, bonusXP);
      
      console.log(`✅ Inactive User Comeback Boost activated: 2x XP for ${BOOST_DURATION_HOURS} hours`);
      console.log(`💎 Comeback bonus awarded: +${bonusXP} XP (${inactiveStatus.daysSinceLastActivity} days away)`);
      
      return {
        success: true,
        multiplier: {
          isActive: true,
          multiplier: multiplier.multiplier,
          activatedAt: multiplier.activatedAt,
          expiresAt: multiplier.expiresAt,
          source: multiplier.source,
          timeRemaining: expiresAt.getTime() - now.getTime(),
          description: i18next.t('gamification.multiplier.descriptions.welcomeBackBoost', { hours: BOOST_DURATION_HOURS }),
        },
        xpBonusAwarded: bonusXP,
      };
      
    } catch (error) {
      console.error('XPMultiplierService.activateInactiveUserBoost error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check and auto-activate inactive user boost on app launch
   * This should be called from app initialization
   */
  static async checkAndActivateInactiveUserBoost(): Promise<MultiplierActivationResult | null> {
    try {
      const inactiveStatus = await this.checkInactiveUserStatus();
      
      if (inactiveStatus.shouldActivateBoost) {
        console.log(`🎯 Auto-activating inactive user boost: ${inactiveStatus.daysSinceLastActivity} days away`);
        return await this.activateInactiveUserBoost();
      }
      
      return null;
    } catch (error) {
      console.error('XPMultiplierService.checkAndActivateInactiveUserBoost error:', error);
      return null;
    }
  }
}