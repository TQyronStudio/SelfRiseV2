// Social Features Foundation - Achievement Sharing & Motivational System
// Sub-checkpoint 4.5.8.D: Social Features Foundation

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share, Platform } from 'react-native';
import { Clipboard } from 'react-native';
import { 
  Achievement, 
  UserAchievements,
  GamificationStats,
  XPSourceType
} from '../types/gamification';
import { AchievementService } from './achievementService';
import { AchievementStorage } from './achievementStorage';
import { GamificationService } from './gamificationService';
import { getCurrentLevel, getLevelInfo } from './levelCalculation';
import { today, formatDateToString } from '../utils/date';

// ========================================
// SOCIAL SHARING INTERFACES
// ========================================

export interface AchievementShareData {
  achievement: Achievement;
  unlockedAt: Date;
  currentLevel: number;
  totalXP: number;
  shareMessage: string;
  hashtags: string[];
  anonymizedStats?: AnonymizedStats;
}

export interface LevelMilestoneShareData {
  level: number;
  levelTitle: string;
  totalXP: number;
  totalAchievements: number;
  daysActive: number;
  shareMessage: string;
  hashtags: string[];
  motivationalQuote: string;
}

export interface AnonymizedStats {
  achievementsCount: number;
  level: number;
  daysActive: number;
  categoryProgress: Record<string, number>;
  // No personal data, names, or identifying information
}

export interface DailyHeroEntry {
  id: string;
  achievementName: string;
  achievementRarity: string;
  level: number;
  daysActive: number;
  anonymizedTimestamp: string; // Only shows "today", "yesterday", etc.
  motivationalContext: string;
}

export interface MotivationalQuote {
  text: string;
  author?: string;
  category: 'achievement' | 'level' | 'streak' | 'consistency' | 'growth';
  context: string;
}

// ========================================
// STORAGE KEYS
// ========================================

const SOCIAL_STORAGE_KEYS = {
  SHARING_HISTORY: 'social_sharing_history',
  DAILY_HEROES: 'social_daily_heroes',
  MOTIVATIONAL_QUOTES_CACHE: 'social_motivational_quotes_cache',
  PRIVACY_SETTINGS: 'social_privacy_settings',
  SHARE_STATISTICS: 'social_share_statistics'
} as const;

// ========================================
// MOTIVATIONAL QUOTES DATABASE
// ========================================

const MOTIVATIONAL_QUOTES: Record<string, MotivationalQuote[]> = {
  achievement: [
    {
      text: "Every achievement is a step closer to the person you're becoming.",
      category: 'achievement',
      context: 'general_unlock'
    },
    {
      text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill",
      category: 'achievement',
      context: 'challenging_achievement'
    },
    {
      text: "The only impossible journey is the one you never begin.",
      author: "Tony Robbins",
      category: 'achievement',
      context: 'first_achievement'
    }
  ],
  level: [
    {
      text: "Level up in life, one small step at a time.",
      category: 'level',
      context: 'level_milestone'
    },
    {
      text: "Growth begins at the end of your comfort zone.",
      category: 'level',
      context: 'significant_level'
    },
    {
      text: "You are not the same person you were yesterday, and that's beautiful.",
      category: 'level',
      context: 'level_progress'
    }
  ],
  streak: [
    {
      text: "Consistency is the mother of mastery.",
      category: 'streak',
      context: 'streak_milestone'
    },
    {
      text: "Small daily improvements lead to massive results over time.",
      category: 'streak',
      context: 'long_streak'
    }
  ],
  consistency: [
    {
      text: "Excellence is not an act, but a habit.",
      author: "Aristotle",
      category: 'consistency',
      context: 'daily_consistency'
    },
    {
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain",
      category: 'consistency',
      context: 'building_habits'
    }
  ],
  growth: [
    {
      text: "Personal growth is not a destination, it's a way of traveling.",
      category: 'growth',
      context: 'general_motivation'
    },
    {
      text: "Be yourself; everyone else is already taken.",
      author: "Oscar Wilde",
      category: 'growth',
      context: 'self_development'
    }
  ]
};

// ========================================
// SOCIAL SHARING SERVICE
// ========================================

export class SocialSharingService {
  
  // =====================================
  // ACHIEVEMENT SHARING
  // =====================================
  
  /**
   * Create beautiful sharing content for achievement unlock
   */
  static async createAchievementShare(achievementId: string): Promise<AchievementShareData> {
    try {
      const achievement = await AchievementService.getAchievementById(achievementId);
      if (!achievement) {
        throw new Error(`Achievement not found: ${achievementId}`);
      }

      const userAchievements = await AchievementStorage.getUserAchievements();
      const unlockedAchievement = userAchievements.unlockedAchievements.find(
        ua => ua === achievementId
      );
      
      if (!unlockedAchievement) {
        throw new Error(`Achievement not unlocked: ${achievementId}`);
      }

      const stats = await GamificationService.getGamificationStats();
      const currentLevel = getCurrentLevel(stats.totalXP);
      const anonymizedStats = await this.createAnonymizedStats();

      // Generate contextual sharing message
      const shareMessage = this.generateAchievementShareMessage(achievement, currentLevel);
      const hashtags = this.generateHashtags(achievement);

      // Get unlock timestamp from storage  
      const achievements = await AchievementStorage.getUserAchievements();
      const unlockedAt = new Date(); // Default to now if not found

      return {
        achievement,
        unlockedAt,
        currentLevel,
        totalXP: stats.totalXP,
        shareMessage,
        hashtags,
        anonymizedStats
      };

    } catch (error) {
      console.error('SocialSharingService.createAchievementShare error:', error);
      throw error;
    }
  }

  /**
   * Create sharing content for level milestones
   */
  static async createLevelMilestoneShare(level: number): Promise<LevelMilestoneShareData> {
    try {
      const stats = await GamificationService.getGamificationStats();
      const levelInfo = getLevelInfo(level);
      const achievements = await AchievementStorage.generateAchievementStatistics();
      
      // Calculate days active from XP transactions
      const daysActive = await this.calculateDaysActive();
      
      const shareMessage = this.generateLevelShareMessage(level, levelInfo.title, daysActive);
      const hashtags = this.generateLevelHashtags(level);
      const motivationalQuote = this.getContextualMotivationalQuote('level', {
        level,
        daysActive,
        achievements: achievements.completionRate * achievements.totalAchievements
      });

      return {
        level,
        levelTitle: levelInfo.title,
        totalXP: stats.totalXP,
        totalAchievements: achievements.completionRate * achievements.totalAchievements,
        daysActive,
        shareMessage,
        hashtags,
        motivationalQuote: motivationalQuote.text
      };

    } catch (error) {
      console.error('SocialSharingService.createLevelMilestoneShare error:', error);
      throw error;
    }
  }

  /**
   * Share achievement with privacy protection
   */
  static async shareAchievement(shareData: AchievementShareData): Promise<boolean> {
    try {
      const fullMessage = this.formatShareMessage(
        shareData.shareMessage,
        shareData.hashtags
      );

      const shareOptions = {
        message: fullMessage,
        title: `🏆 Achievement Unlocked: ${shareData.achievement.name}!`
      };

      const result = await Share.share(shareOptions);
      
      // Track sharing for analytics (anonymized)
      await this.trackSharingEvent('achievement', shareData.achievement.rarity);
      
      return result.action === Share.sharedAction;

    } catch (error) {
      console.error('SocialSharingService.shareAchievement error:', error);
      return false;
    }
  }

  /**
   * Copy achievement sharing text to clipboard
   */
  static async copyAchievementToClipboard(shareData: AchievementShareData): Promise<boolean> {
    try {
      const fullMessage = this.formatShareMessage(
        shareData.shareMessage,
        shareData.hashtags
      );

      await Clipboard.setString(fullMessage);
      return true;

    } catch (error) {
      console.error('SocialSharingService.copyAchievementToClipboard error:', error);
      return false;
    }
  }

  // =====================================
  // MOTIVATIONAL SYSTEM
  // =====================================

  /**
   * Get context-aware motivational quote
   */
  static getContextualMotivationalQuote(
    category: 'achievement' | 'level' | 'streak' | 'consistency' | 'growth',
    context: Record<string, any>
  ): MotivationalQuote {
    const quotes = MOTIVATIONAL_QUOTES[category];
    if (!quotes || quotes.length === 0) {
      const fallback = MOTIVATIONAL_QUOTES.growth;
      return fallback && fallback[0] ? fallback[0] : {
        text: "Every step forward is progress worth celebrating.",
        category: 'growth' as const,
        context: 'general_motivation'
      };
    }
    
    // Simple selection based on context
    let selectedQuote = quotes[0];
    if (!selectedQuote) {
      return {
        text: "Every step forward is progress worth celebrating.",
        category: 'growth' as const,
        context: 'general_motivation'
      };
    }
    
    if (category === 'level' && context.level >= 50) {
      const found = quotes.find(q => q.context === 'significant_level');
      if (found) selectedQuote = found;
    } else if (category === 'achievement' && context.isFirst) {
      const found = quotes.find(q => q.context === 'first_achievement');
      if (found) selectedQuote = found;
    }

    return selectedQuote;
  }

  /**
   * Create anonymous daily heroes showcase
   * NOTE: This feature is disabled as it requires server backend for real user data
   */
  static async createDailyHeroes(count: number = 5): Promise<DailyHeroEntry[]> {
    // Return empty array since we don't have server backend
    // This feature would require connecting users through a server
    return [];
  }

  // =====================================
  // ANONYMOUS COMPARISON SYSTEM
  // =====================================

  /**
   * Create anonymized stats for comparison
   */
  static async createAnonymizedStats(): Promise<AnonymizedStats> {
    try {
      const achievements = await AchievementStorage.generateAchievementStatistics();
      const stats = await GamificationService.getGamificationStats();
      const daysActive = await this.calculateDaysActive();
      
      return {
        achievementsCount: achievements.unlockedAchievements,
        level: getCurrentLevel(stats.totalXP),
        daysActive,
        categoryProgress: {
          habits: achievements.categoryBreakdown.habits?.unlocked || 0,
          journal: achievements.categoryBreakdown.journal?.unlocked || 0,
          goals: achievements.categoryBreakdown.goals?.unlocked || 0,
          consistency: achievements.categoryBreakdown.consistency?.unlocked || 0,
          mastery: achievements.categoryBreakdown.mastery?.unlocked || 0
        }
      };

    } catch (error) {
      console.error('SocialSharingService.createAnonymizedStats error:', error);
      return {
        achievementsCount: 0,
        level: 1,
        daysActive: 0,
        categoryProgress: {}
      };
    }
  }

  // =====================================
  // HELPER METHODS
  // =====================================

  /**
   * Generate achievement sharing message
   */
  private static generateAchievementShareMessage(
    achievement: Achievement,
    currentLevel: number
  ): string {
    const rarityEmojis = {
      common: '⭐',
      rare: '🌟',
      epic: '💫',
      legendary: '✨'
    };

    const emoji = rarityEmojis[achievement.rarity] || '🏆';
    
    return `Just unlocked "${achievement.name}" ${emoji} - ${achievement.description} Currently at Level ${currentLevel} in my personal growth journey! 🚀`;
  }

  /**
   * Generate level milestone sharing message  
   */
  private static generateLevelShareMessage(
    level: number,
    levelTitle: string,
    daysActive: number
  ): string {
    return `🎉 Level ${level} achieved! I'm now a "${levelTitle}" after ${daysActive} days of consistent personal growth. Every small step counts! 💪`;
  }

  /**
   * Generate hashtags for achievement sharing
   */
  private static generateHashtags(achievement: Achievement): string[] {
    const baseHashtags = ['#SelfRise', '#PersonalGrowth', '#Achievement'];
    
    const categoryHashtags: Record<string, string> = {
      habits: '#HabitBuilding',
      journal: '#Gratitude', 
      goals: '#GoalSetting',
      consistency: '#Consistency',
      mastery: '#SelfMastery',
      social: '#Community',
      special: '#Special'
    };

    const categoryTag = categoryHashtags[achievement.category] || '#Growth';
    
    return [...baseHashtags, categoryTag, `#${achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}`];
  }

  /**
   * Generate hashtags for level milestones
   */
  private static generateLevelHashtags(level: number): string[] {
    const baseHashtags = ['#SelfRise', '#PersonalGrowth', '#LevelUp'];
    
    if (level >= 50) {
      baseHashtags.push('#Master');
    } else if (level >= 25) {
      baseHashtags.push('#Advanced');
    } else if (level >= 10) {
      baseHashtags.push('#Intermediate');
    }
    
    return baseHashtags;
  }

  /**
   * Format complete sharing message
   */
  private static formatShareMessage(message: string, hashtags: string[]): string {
    return `${message}\n\n${hashtags.join(' ')}`;
  }

  /**
   * Calculate days active from XP transaction history
   */
  private static async calculateDaysActive(): Promise<number> {
    try {
      // For now, return a mock value since getXPTransactionHistory doesn't exist yet
      // TODO: Implement proper transaction history retrieval
      const stats = await GamificationService.getGamificationStats();
      // Estimate days active based on total XP (rough approximation)
      return Math.min(Math.floor(stats.totalXP / 100), 365);

    } catch (error) {
      console.error('SocialSharingService.calculateDaysActive error:', error);
      return 0;
    }
  }

  /**
   * Track sharing events for analytics (anonymized)
   */
  private static async trackSharingEvent(
    type: 'achievement' | 'level',
    rarity?: string
  ): Promise<void> {
    try {
      const currentStats = await AsyncStorage.getItem(SOCIAL_STORAGE_KEYS.SHARE_STATISTICS);
      const stats = currentStats ? JSON.parse(currentStats) : {};
      
      const dateKey = formatDateToString(new Date());
      if (!stats[dateKey]) {
        stats[dateKey] = {};
      }
      
      const key = rarity ? `${type}_${rarity}` : type;
      stats[dateKey][key] = (stats[dateKey][key] || 0) + 1;
      
      await AsyncStorage.setItem(SOCIAL_STORAGE_KEYS.SHARE_STATISTICS, JSON.stringify(stats));

    } catch (error) {
      console.error('SocialSharingService.trackSharingEvent error:', error);
    }
  }
}