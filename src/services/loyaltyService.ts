// Loyalty Service - Sub-checkpoint 4.5.10.C
// Long-term Engagement Mechanics with cumulative active day tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LoyaltyTracking, 
  LoyaltyLevel, 
  LoyaltyProgress, 
  LoyaltyLevelDisplay,
  LoyaltyMilestone,
  AchievementRarity,
} from '../types/gamification';
import { today, formatDateToString, subtractDays } from '../utils/date';

/**
 * Loyalty Service
 * Manages long-term user engagement through cumulative active day tracking
 */
export class LoyaltyService {
  private static readonly STORAGE_KEY = 'gamification_loyalty_data';
  private static readonly OLD_STORAGE_KEY = 'loyalty_tracking_data'; // For migration
  
  // Loyalty milestones (matching technical-guides:Achievements.md exactly)
  static readonly LOYALTY_MILESTONES: LoyaltyMilestone[] = [
    { days: 7, name: 'First Week', nameKey: 'achievements.achievementNames.loyalty-first-week', xpReward: 75, rarity: AchievementRarity.COMMON, isSecret: false },
    { days: 14, name: 'Two Weeks Strong', nameKey: 'achievements.achievementNames.loyalty-two-weeks-strong', xpReward: 100, rarity: AchievementRarity.RARE, isSecret: false },
    { days: 21, name: 'Three Weeks Committed', nameKey: 'achievements.achievementNames.loyalty-three-weeks-committed', xpReward: 125, rarity: AchievementRarity.RARE, isSecret: false },
    { days: 30, name: 'Month Explorer', nameKey: 'achievements.achievementNames.loyalty-month-explorer', xpReward: 150, rarity: AchievementRarity.EPIC, isSecret: false },
    { days: 60, name: 'Two Month Veteran', nameKey: 'achievements.achievementNames.loyalty-two-month-veteran', xpReward: 200, rarity: AchievementRarity.EPIC, isSecret: false },
    { days: 100, name: 'Century User', nameKey: 'achievements.achievementNames.loyalty-century-user', xpReward: 300, rarity: AchievementRarity.EPIC, isSecret: false },
    { days: 183, name: 'Half Year Hero', nameKey: 'achievements.achievementNames.loyalty-half-year-hero', xpReward: 500, rarity: AchievementRarity.LEGENDARY, isSecret: false },
    { days: 365, name: 'Year Legend', nameKey: 'achievements.achievementNames.loyalty-year-legend', xpReward: 1000, rarity: AchievementRarity.LEGENDARY, isSecret: false },
    { days: 500, name: 'Ultimate Veteran', nameKey: 'achievements.achievementNames.loyalty-ultimate-veteran', xpReward: 1500, rarity: AchievementRarity.LEGENDARY, isSecret: false },
    { days: 1000, name: 'Loyalty Master', nameKey: 'achievements.achievementNames.loyalty-master', xpReward: 2000, rarity: AchievementRarity.LEGENDARY, isSecret: true },
  ];

  // ========================================
  // CORE DATA MANAGEMENT
  // ========================================

  /**
   * Get current loyalty tracking data
   */
  static async getLoyaltyData(): Promise<LoyaltyTracking> {
    try {
      // Try to get data from new storage key first
      let data = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      // If no data in new key, check old key for migration
      if (!data) {
        const oldData = await AsyncStorage.getItem(this.OLD_STORAGE_KEY);
        if (oldData) {
          console.log('🔄 Migrating loyalty data from old storage key to new key');
          // Migrate data to new key
          await AsyncStorage.setItem(this.STORAGE_KEY, oldData);
          // Remove old data
          await AsyncStorage.removeItem(this.OLD_STORAGE_KEY);
          data = oldData;
          console.log('✅ Loyalty data migration completed');
        }
      }
      
      if (data) {
        const parsed = JSON.parse(data) as LoyaltyTracking;
        return {
          ...parsed,
          loyaltyLevel: this.calculateLoyaltyLevel(parsed.totalActiveDays)
        };
      }

      // Initialize new user loyalty data
      const registrationDate = today();
      const initialData: LoyaltyTracking = {
        totalActiveDays: 0,
        lastActiveDate: '',
        registrationDate,
        longestActiveStreak: 0,
        currentActiveStreak: 0,
        loyaltyLevel: LoyaltyLevel.NEWCOMER,
      };

      await this.saveLoyaltyData(initialData);
      return initialData;
    } catch (error) {
      console.error('LoyaltyService.getLoyaltyData error:', error);
      
      // Return safe default
      return {
        totalActiveDays: 0,
        lastActiveDate: '',
        registrationDate: today(),
        longestActiveStreak: 0,
        currentActiveStreak: 0,
        loyaltyLevel: LoyaltyLevel.NEWCOMER,
      };
    }
  }

  /**
   * Save loyalty tracking data
   */
  static async saveLoyaltyData(data: LoyaltyTracking): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('LoyaltyService.saveLoyaltyData error:', error);
      throw error;
    }
  }

  // ========================================
  // DAILY ACTIVITY TRACKING
  // ========================================

  /**
   * Track daily activity - called once per day on first app launch
   * This is the core function that increments active days and detects milestones
   */
  static async trackDailyActivity(): Promise<{ 
    isNewActiveDay: boolean; 
    milestonesReached: LoyaltyMilestone[]; 
    loyaltyLevelChanged: boolean;
    oldLevel?: LoyaltyLevel;
    newLevel?: LoyaltyLevel;
  }> {
    try {
      const todayStr = today();
      const loyaltyData = await this.getLoyaltyData();
      
      // Check if this is already counted as active day
      if (loyaltyData.lastActiveDate === todayStr) {
        return { 
          isNewActiveDay: false, 
          milestonesReached: [], 
          loyaltyLevelChanged: false 
        };
      }

      // This is a new active day!
      const oldTotalDays = loyaltyData.totalActiveDays;
      const oldLevel = loyaltyData.loyaltyLevel;
      const previousActiveDate = loyaltyData.lastActiveDate; // Store before update
      
      // Update active day count
      loyaltyData.totalActiveDays += 1;
      
      // Update consecutive streak BEFORE updating lastActiveDate
      const yesterdayStr = subtractDays(todayStr, 1);
      
      if (previousActiveDate === yesterdayStr && previousActiveDate) {
        loyaltyData.currentActiveStreak += 1;
      } else {
        loyaltyData.currentActiveStreak = 1; // Reset to 1 (today)
      }
      
      // Now update lastActiveDate
      loyaltyData.lastActiveDate = todayStr;
      
      // Update longest streak if needed
      if (loyaltyData.currentActiveStreak > loyaltyData.longestActiveStreak) {
        loyaltyData.longestActiveStreak = loyaltyData.currentActiveStreak;
      }
      
      // Update loyalty level
      const newLevel = this.calculateLoyaltyLevel(loyaltyData.totalActiveDays);
      const loyaltyLevelChanged = oldLevel !== newLevel;
      loyaltyData.loyaltyLevel = newLevel;
      
      // Check for milestone achievements
      const milestonesReached = this.LOYALTY_MILESTONES.filter(milestone => 
        milestone.days === loyaltyData.totalActiveDays
      );
      
      // Save updated data
      await this.saveLoyaltyData(loyaltyData);
      
      console.log(`🏆 Daily activity tracked: ${loyaltyData.totalActiveDays} total days, level: ${newLevel}`);
      if (milestonesReached.length > 0) {
        console.log(`🎉 Loyalty milestones reached:`, milestonesReached.map(m => m.name));
      }
      
      const result: { 
        isNewActiveDay: boolean; 
        milestonesReached: LoyaltyMilestone[]; 
        loyaltyLevelChanged: boolean;
        oldLevel?: LoyaltyLevel;
        newLevel?: LoyaltyLevel;
      } = { 
        isNewActiveDay: true, 
        milestonesReached, 
        loyaltyLevelChanged
      };

      if (loyaltyLevelChanged) {
        result.oldLevel = oldLevel;
        result.newLevel = newLevel;
      }

      return result;
      
    } catch (error) {
      console.error('LoyaltyService.trackDailyActivity error:', error);
      return { 
        isNewActiveDay: false, 
        milestonesReached: [], 
        loyaltyLevelChanged: false 
      };
    }
  }

  // ========================================
  // LOYALTY LEVEL CALCULATION
  // ========================================

  /**
   * Calculate loyalty level based on total active days
   */
  static calculateLoyaltyLevel(totalActiveDays: number): LoyaltyLevel {
    if (totalActiveDays >= 1000) return LoyaltyLevel.MASTER;
    if (totalActiveDays >= 365) return LoyaltyLevel.LEGEND;
    if (totalActiveDays >= 100) return LoyaltyLevel.VETERAN;
    if (totalActiveDays >= 30) return LoyaltyLevel.EXPLORER;
    return LoyaltyLevel.NEWCOMER;
  }

  /**
   * Get display information for a loyalty level
   */
  static getLoyaltyLevelDisplay(level: LoyaltyLevel): LoyaltyLevelDisplay {
    const displays = {
      [LoyaltyLevel.NEWCOMER]: {
        nameKey: "social.loyalty_progress.levels.newcomer.name",
        icon: "🌱",
        color: "#9E9E9E",
        descriptionKey: "social.loyalty_progress.levels.newcomer.description"
      },
      [LoyaltyLevel.EXPLORER]: {
        nameKey: "social.loyalty_progress.levels.explorer.name",
        icon: "🗺️",
        color: "#2196F3",
        descriptionKey: "social.loyalty_progress.levels.explorer.description"
      },
      [LoyaltyLevel.VETERAN]: {
        nameKey: "social.loyalty_progress.levels.veteran.name",
        icon: "⚔️",
        color: "#9C27B0",
        descriptionKey: "social.loyalty_progress.levels.veteran.description"
      },
      [LoyaltyLevel.LEGEND]: {
        nameKey: "social.loyalty_progress.levels.legend.name",
        icon: "👑",
        color: "#FFD700",
        descriptionKey: "social.loyalty_progress.levels.legend.description"
      },
      [LoyaltyLevel.MASTER]: {
        nameKey: "social.loyalty_progress.levels.master.name",
        icon: "🏆",
        color: "#FF6B35",
        descriptionKey: "social.loyalty_progress.levels.master.description"
      }
    };

    return displays[level];
  }

  // ========================================
  // PROGRESS CALCULATION
  // ========================================

  /**
   * Calculate progress to next loyalty milestone
   */
  static calculateLoyaltyProgress(currentDays: number): LoyaltyProgress {
    // Find next uncompleted milestone
    const nextMilestone = this.LOYALTY_MILESTONES.find(milestone => milestone.days > currentDays);
    
    if (!nextMilestone) {
      return {
        isComplete: true,
        nextTarget: null,
        progress: 100,
        daysRemaining: 0
      };
    }
    
    const previousMilestone = this.LOYALTY_MILESTONES
      .filter(m => m.days <= currentDays)
      .pop();
      
    const previousDays = previousMilestone ? previousMilestone.days : 0;
    const progress = ((currentDays - previousDays) / (nextMilestone.days - previousDays)) * 100;
    
    return {
      isComplete: false,
      nextTarget: nextMilestone.days,
      progress: Math.min(Math.max(progress, 0), 100),
      daysRemaining: nextMilestone.days - currentDays
    };
  }

  /**
   * Get motivation message based on progress
   */
  static getLoyaltyMotivationMessage(daysRemaining: number, nextMilestoneName: string): string {
    if (daysRemaining === 1) return `Just 1 more active day to unlock ${nextMilestoneName}!`;
    if (daysRemaining <= 5) return `${daysRemaining} active days to ${nextMilestoneName} - so close!`;
    if (daysRemaining <= 20) return `${nextMilestoneName} is within reach: ${daysRemaining} days to go!`;
    if (daysRemaining <= 50) return `Building toward ${nextMilestoneName}: ${daysRemaining} active days remaining`;
    return `Your loyalty journey continues toward ${nextMilestoneName}`;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get loyalty milestone by active days count
   */
  static getMilestoneByDays(days: number): LoyaltyMilestone | null {
    return this.LOYALTY_MILESTONES.find(milestone => milestone.days === days) || null;
  }

  /**
   * Check if user has reached a specific milestone
   */
  static async hasReachedMilestone(days: number): Promise<boolean> {
    const loyaltyData = await this.getLoyaltyData();
    return loyaltyData.totalActiveDays >= days;
  }

  /**
   * Get all completed milestones
   */
  static async getCompletedMilestones(): Promise<LoyaltyMilestone[]> {
    const loyaltyData = await this.getLoyaltyData();
    return this.LOYALTY_MILESTONES.filter(milestone => 
      milestone.days <= loyaltyData.totalActiveDays
    );
  }

  /**
   * Get next milestone to achieve
   */
  static async getNextMilestone(): Promise<LoyaltyMilestone | null> {
    const loyaltyData = await this.getLoyaltyData();
    return this.LOYALTY_MILESTONES.find(milestone => 
      milestone.days > loyaltyData.totalActiveDays
    ) || null;
  }

  // ========================================
  // TESTING UTILITIES
  // ========================================

  /**
   * Reset loyalty data (for testing only)
   */
  static async resetLoyaltyData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      // Also remove old storage key if it exists (cleanup)
      await AsyncStorage.removeItem(this.OLD_STORAGE_KEY);
      console.log('🧪 Loyalty data reset for testing');
    } catch (error) {
      console.error('LoyaltyService.resetLoyaltyData error:', error);
    }
  }

  /**
   * Simulate active days (for testing only)
   */
  static async simulateActiveDays(days: number): Promise<void> {
    try {
      const loyaltyData = await this.getLoyaltyData();
      loyaltyData.totalActiveDays = days;
      loyaltyData.lastActiveDate = today();
      loyaltyData.loyaltyLevel = this.calculateLoyaltyLevel(days);
      await this.saveLoyaltyData(loyaltyData);
      console.log(`🧪 Simulated ${days} active days for testing`);
    } catch (error) {
      console.error('LoyaltyService.simulateActiveDays error:', error);
    }
  }
}