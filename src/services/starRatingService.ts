// Star Rating & Challenge Difficulty System
// Manages dynamic star progression and personalized challenge difficulty scaling

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { 
  UserChallengeRatings, 
  StarRatingHistoryEntry, 
  AchievementCategory,
  AchievementRarity
} from '../types/gamification';
import { formatDateToString, today } from '../utils/date';
import { generateUUID } from '../utils/uuid';

// ========================================
// INTERFACES & TYPES
// ========================================

/**
 * Star rating progression rules and thresholds
 */
export interface StarProgressionRules {
  successThreshold: number;        // 100% completion = success
  partialThreshold: number;        // 70% completion = no penalty
  failureThreshold: number;        // <70% completion = failure
  consecutiveFailuresForDemotion: number; // 2 consecutive failures = -1 star
  maxStarLevel: number;           // Maximum 5 stars
  minStarLevel: number;           // Minimum 1 star
  starMultipliers: { [K in 1 | 2 | 3 | 4 | 5]: number }; // Star level to difficulty multiplier
}

/**
 * Star rating analysis for insights and debugging
 */
export interface StarRatingAnalysis {
  overallRating: number;          // Average across all categories
  strongestCategory: AchievementCategory;
  weakestCategory: AchievementCategory;
  totalCompletions: number;
  totalFailures: number;
  averageCompletion: number;      // Average completion rate
  recentTrend: 'improving' | 'stable' | 'declining';
  monthsActive: number;
  lastActivity: Date | null;
}

/**
 * Star-based difficulty calculation result
 */
export interface DifficultyCalculationResult {
  category: AchievementCategory;
  starLevel: number;
  baselineValue: number;
  multiplier: number;
  targetValue: number;
  rarityColor: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  recommendedAdjustment?: string;
}

/**
 * Monthly challenge completion data for star progression
 */
export interface ChallengeCompletionData {
  challengeId: string;
  category: AchievementCategory;
  completionPercentage: number;
  month: string; // "YYYY-MM"
  wasCompleted: boolean;
  targetValue: number;
  actualValue: number;
  isWarmUp?: boolean; // If true, don't award star for this challenge
}

// ========================================
// STAR RATING SERVICE IMPLEMENTATION
// ========================================

export class StarRatingService {
  // AsyncStorage keys
  private static readonly STORAGE_KEY = 'user_star_ratings';
  private static readonly HISTORY_STORAGE_KEY = 'star_rating_history';
  private static readonly FAILURE_TRACKING_KEY = 'consecutive_failures_tracking';

  // Star progression configuration
  private static readonly PROGRESSION_RULES: StarProgressionRules = {
    successThreshold: 100,          // 100% completion
    partialThreshold: 70,           // 70% completion
    failureThreshold: 70,           // Below 70%
    consecutiveFailuresForDemotion: 2, // 2 failures = demotion
    maxStarLevel: 5,
    minStarLevel: 1,
    starMultipliers: {
      1: 1.05,  // Easy +5%
      2: 1.10,  // Medium +10%
      3: 1.15,  // Hard +15%
      4: 1.20,  // Expert +20%
      5: 1.25   // Master +25%
    }
  };

  // Star rarity color mapping
  private static readonly STAR_RARITY_COLORS = {
    1: { color: '#9E9E9E', rarity: AchievementRarity.COMMON, name: 'Novice' },      // Gray - Common
    2: { color: '#2196F3', rarity: AchievementRarity.RARE, name: 'Explorer' },      // Blue - Rare  
    3: { color: '#9C27B0', rarity: AchievementRarity.EPIC, name: 'Challenger' },    // Purple - Epic
    4: { color: '#FF9800', rarity: AchievementRarity.LEGENDARY, name: 'Expert' },   // Orange - Legendary
    5: { color: '#FFD700', rarity: AchievementRarity.LEGENDARY, name: 'Master' }    // Gold - Legendary+
  };

  // Event names for DeviceEventEmitter
  private static readonly EVENTS = {
    STAR_LEVEL_CHANGED: 'star_level_changed',
    STAR_PROGRESSION_UPDATED: 'star_progression_updated',
    DIFFICULTY_RECALCULATED: 'difficulty_recalculated'
  };

  // Cache for performance
  private static starRatingsCache: UserChallengeRatings | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ========================================
  // CORE STAR RATING MANAGEMENT
  // ========================================

  /**
   * Get current star ratings for all categories
   */
  public static async getCurrentStarRatings(): Promise<UserChallengeRatings> {
    try {
      // Check cache first
      if (this.starRatingsCache && new Date().getTime() - this.cacheTimestamp < this.CACHE_TTL) {
        return this.starRatingsCache;
      }

      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (stored) {
        const ratings = JSON.parse(stored) as UserChallengeRatings;
        // Ensure all categories exist with default values
        const normalizedRatings = this.normalizeStarRatings(ratings);
        
        // Update cache
        this.starRatingsCache = normalizedRatings;
        this.cacheTimestamp = new Date().getTime();
        
        return normalizedRatings;
      } else {
        // Create default ratings for new user
        const defaultRatings = this.createDefaultStarRatings();
        await this.saveStarRatings(defaultRatings);
        return defaultRatings;
      }
    } catch (error) {
      console.error('Error getting current star ratings:', error);
      // Fallback to default ratings
      return this.createDefaultStarRatings();
    }
  }

  /**
   * Update star rating for a specific category based on challenge completion
   */
  public static async updateStarRatingForCompletion(
    completionData: ChallengeCompletionData
  ): Promise<StarRatingHistoryEntry> {
    try {
      const currentRatings = await this.getCurrentStarRatings();
      const { category, completionPercentage, month, isWarmUp } = completionData;

      // Map category to rating key - only support the 4 main categories
      const categoryKey = this.mapCategoryToKey(category);
      if (!categoryKey) {
        // For unsupported categories, create a fallback history entry
        return {
          month,
          category,
          previousStars: 1,
          newStars: 1,
          challengeCompleted: false,
          completionPercentage,
          reason: 'failure',
          timestamp: new Date()
        };
      }

      const previousStars = currentRatings[categoryKey];

      // WARM-UP CHALLENGES: Don't affect star rating
      // Users with < 14 days of activity get easier "warm-up" challenges
      // that don't count toward difficulty progression
      if (isWarmUp) {
        console.log(`⚠️ [StarRatingService] Warm-up challenge completed - NO star progression`);
        const warmUpEntry: StarRatingHistoryEntry = {
          month,
          category,
          previousStars,
          newStars: previousStars, // No change
          challengeCompleted: completionPercentage >= this.PROGRESSION_RULES.successThreshold,
          completionPercentage,
          reason: 'warm_up', // Warm-up challenge - no star progression
          timestamp: new Date()
        };

        // Save to history (for tracking) but don't update stars
        await this.addToHistory(warmUpEntry);
        return warmUpEntry;
      }

      let newStars = previousStars;
      let reason: StarRatingHistoryEntry['reason'] = 'failure';

      // Determine star progression based on completion percentage
      if (completionPercentage >= this.PROGRESSION_RULES.successThreshold) {
        // Success: +1 star (capped at max)
        newStars = Math.min(previousStars + 1, this.PROGRESSION_RULES.maxStarLevel);
        reason = 'success';
        
        // Reset consecutive failures on success
        await this.resetConsecutiveFailures(category);
      } else if (completionPercentage >= this.PROGRESSION_RULES.partialThreshold) {
        // Partial success: maintain current level
        newStars = previousStars;
        reason = 'failure'; // Still counts as no success
        
        // Track as failure for consecutive counting
        await this.incrementConsecutiveFailures(category);
      } else {
        // Failure: check for demotion
        const consecutiveFailures = await this.incrementConsecutiveFailures(category);
        
        if (consecutiveFailures >= this.PROGRESSION_RULES.consecutiveFailuresForDemotion) {
          // Demote: -1 star (floored at min)
          newStars = Math.max(previousStars - 1, this.PROGRESSION_RULES.minStarLevel);
          reason = 'double_failure';
          
          // Reset counter after demotion
          await this.resetConsecutiveFailures(category);
        } else {
          // First failure: maintain level but track it
          newStars = previousStars;
          reason = 'failure';
        }
      }

      // Create history entry
      const historyEntry: StarRatingHistoryEntry = {
        month,
        category,
        previousStars,
        newStars,
        challengeCompleted: completionPercentage >= this.PROGRESSION_RULES.successThreshold,
        completionPercentage,
        reason,
        timestamp: new Date()
      };

      // Update star ratings if changed
      if (newStars !== previousStars) {
        currentRatings[categoryKey] = newStars;
        currentRatings.lastUpdated = new Date();
        await this.saveStarRatings(currentRatings);
        
        // Emit event for UI updates
        DeviceEventEmitter.emit(this.EVENTS.STAR_LEVEL_CHANGED, {
          category,
          previousStars,
          newStars,
          reason
        });
      }

      // Add to history
      await this.addToHistory(historyEntry);

      // Emit progression update event
      DeviceEventEmitter.emit(this.EVENTS.STAR_PROGRESSION_UPDATED, {
        category,
        newStars,
        completionData
      });

      return historyEntry;
    } catch (error) {
      console.error('Error updating star rating for completion:', error);
      // Create fallback history entry
      return {
        month: completionData.month,
        category: completionData.category,
        previousStars: 1,
        newStars: 1,
        challengeCompleted: false,
        completionPercentage: completionData.completionPercentage,
        reason: 'failure',
        timestamp: new Date()
      };
    }
  }

  /**
   * Calculate challenge difficulty based on star level and baseline
   */
  public static async calculateDifficulty(
    category: AchievementCategory,
    baselineValue: number
  ): Promise<DifficultyCalculationResult> {
    try {
      const currentRatings = await this.getCurrentStarRatings();
      
      // Map category to rating key
      const categoryKey = this.mapCategoryToKey(category);
      if (!categoryKey) {
        // Fallback for unsupported categories
        return {
          category,
          starLevel: 1,
          baselineValue,
          multiplier: this.PROGRESSION_RULES.starMultipliers[1],
          targetValue: Math.round(baselineValue * this.PROGRESSION_RULES.starMultipliers[1]),
          rarityColor: this.STAR_RARITY_COLORS[1].color,
          confidenceLevel: 'low',
          recommendedAdjustment: 'Category not supported for star rating'
        };
      }
      
      const starLevel = Math.max(1, Math.min(5, currentRatings[categoryKey])) as 1 | 2 | 3 | 4 | 5;
      const multiplier = this.PROGRESSION_RULES.starMultipliers[starLevel];
      const targetValue = Math.round(baselineValue * multiplier);
      const starInfo = this.STAR_RARITY_COLORS[starLevel];

      // Determine confidence level based on history
      const confidenceLevel = await this.calculateConfidenceLevel(category);
      
      // Generate recommendation if needed
      let recommendedAdjustment: string | undefined;
      if (confidenceLevel === 'low' && starLevel > 1) {
        recommendedAdjustment = `Consider reducing difficulty - limited historical data for ${category}`;
      } else if (starLevel === this.PROGRESSION_RULES.maxStarLevel) {
        recommendedAdjustment = 'Maximum difficulty reached - consider adding bonus objectives';
      }

      const result: DifficultyCalculationResult = {
        category,
        starLevel: starLevel,
        baselineValue,
        multiplier,
        targetValue,
        rarityColor: starInfo.color,
        confidenceLevel,
        ...(recommendedAdjustment && { recommendedAdjustment })
      };

      // Emit event for analytics
      DeviceEventEmitter.emit(this.EVENTS.DIFFICULTY_RECALCULATED, result);

      return result;
    } catch (error) {
      console.error('Error calculating difficulty:', error);
      // Fallback to safe defaults
      return {
        category,
        starLevel: 1,
        baselineValue,
        multiplier: this.PROGRESSION_RULES.starMultipliers[1],
        targetValue: Math.round(baselineValue * this.PROGRESSION_RULES.starMultipliers[1]),
        rarityColor: this.STAR_RARITY_COLORS[1].color,
        confidenceLevel: 'low',
        recommendedAdjustment: 'Using safe default difficulty due to calculation error'
      };
    }
  }

  // ========================================
  // STAR RATING HISTORY & ANALYTICS
  // ========================================

  /**
   * Get star rating history for analytics and insights
   */
  public static async getStarRatingHistory(
    category?: AchievementCategory,
    months?: number
  ): Promise<StarRatingHistoryEntry[]> {
    try {
      const stored = await AsyncStorage.getItem(this.HISTORY_STORAGE_KEY);
      
      if (!stored) {
        return [];
      }

      let history = JSON.parse(stored) as StarRatingHistoryEntry[];
      
      // Filter by category if specified
      if (category) {
        history = history.filter(entry => entry.category === category);
      }

      // Filter by months if specified
      if (months) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);
        history = history.filter(entry => new Date(entry.timestamp) >= cutoffDate);
      }

      // Sort by timestamp descending (most recent first)
      return history.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting star rating history:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive star rating analysis
   */
  public static async generateStarRatingAnalysis(): Promise<StarRatingAnalysis> {
    try {
      const currentRatings = await this.getCurrentStarRatings();
      const fullHistory = await this.getStarRatingHistory();
      
      // Calculate overall rating
      const categories = [AchievementCategory.HABITS, AchievementCategory.JOURNAL, 
                         AchievementCategory.GOALS, AchievementCategory.CONSISTENCY];
      const overallRating = categories.reduce((sum, cat) => {
        const categoryKey = this.mapCategoryToKey(cat);
        return sum + (categoryKey ? currentRatings[categoryKey] : 1);
      }, 0) / categories.length;

      // Find strongest and weakest categories
      let strongestCategory = AchievementCategory.HABITS;
      let weakestCategory = AchievementCategory.HABITS;
      let highestRating = currentRatings.habits;
      let lowestRating = currentRatings.habits;

      categories.forEach(category => {
        const categoryKey = this.mapCategoryToKey(category);
        if (!categoryKey) return;
        
        const rating = currentRatings[categoryKey];
        if (rating > highestRating) {
          highestRating = rating;
          strongestCategory = category;
        }
        if (rating < lowestRating) {
          lowestRating = rating;
          weakestCategory = category;
        }
      });

      // Calculate completion statistics
      const completions = fullHistory.filter(entry => entry.challengeCompleted);
      const failures = fullHistory.filter(entry => !entry.challengeCompleted);
      const averageCompletion = fullHistory.length > 0 
        ? fullHistory.reduce((sum, entry) => sum + entry.completionPercentage, 0) / fullHistory.length
        : 0;

      // Determine trend based on recent history
      const recentHistory = await this.getStarRatingHistory(undefined, 3); // Last 3 months
      let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
      
      if (recentHistory.length >= 2) {
        const recentSuccesses = recentHistory.filter(entry => entry.reason === 'success').length;
        const recentFailures = recentHistory.filter(entry => entry.reason === 'double_failure').length;
        
        if (recentSuccesses > recentFailures) {
          recentTrend = 'improving';
        } else if (recentFailures > recentSuccesses) {
          recentTrend = 'declining';
        }
      }

      // Calculate months active
      const monthsActive = new Set(fullHistory.map(entry => entry.month)).size;
      
      // Find last activity
      const lastActivity = fullHistory.length > 0 && fullHistory[0]?.timestamp
        ? new Date(fullHistory[0].timestamp) 
        : null;

      return {
        overallRating: Math.round(overallRating * 100) / 100,
        strongestCategory,
        weakestCategory,
        totalCompletions: completions.length,
        totalFailures: failures.length,
        averageCompletion: Math.round(averageCompletion * 100) / 100,
        recentTrend,
        monthsActive,
        lastActivity
      };
    } catch (error) {
      console.error('Error generating star rating analysis:', error);
      // Fallback analysis
      return {
        overallRating: 1.0,
        strongestCategory: AchievementCategory.HABITS,
        weakestCategory: AchievementCategory.HABITS,
        totalCompletions: 0,
        totalFailures: 0,
        averageCompletion: 0,
        recentTrend: 'stable',
        monthsActive: 0,
        lastActivity: null
      };
    }
  }

  // ========================================
  // UTILITY METHODS & HELPERS
  // ========================================

  /**
   * Get star level display information (color, rarity, name)
   */
  public static getStarDisplayInfo(starLevel: number) {
    const level = Math.max(1, Math.min(5, starLevel)) as 1 | 2 | 3 | 4 | 5;
    return this.STAR_RARITY_COLORS[level];
  }

  /**
   * Get all available star multipliers
   */
  public static getStarMultipliers() {
    return { ...this.PROGRESSION_RULES.starMultipliers };
  }

  /**
   * Reset star rating for a category (admin/debug function)
   */
  public static async resetCategoryStarRating(
    category: AchievementCategory, 
    newLevel: number = 1
  ): Promise<void> {
    try {
      const currentRatings = await this.getCurrentStarRatings();
      
      // Map category to rating key
      const categoryKey = this.mapCategoryToKey(category);
      if (!categoryKey) {
        console.warn(`Category ${category} is not supported for star rating`);
        return;
      }
      
      const previousLevel = currentRatings[categoryKey];
      
      currentRatings[categoryKey] = Math.max(1, Math.min(5, newLevel));
      currentRatings.lastUpdated = new Date();
      
      await this.saveStarRatings(currentRatings);
      await this.resetConsecutiveFailures(category);

      // Add history entry for reset
      const historyEntry: StarRatingHistoryEntry = {
        month: today().substring(0, 7),
        category,
        previousStars: previousLevel,
        newStars: currentRatings[categoryKey],
        challengeCompleted: false,
        completionPercentage: 0,
        reason: 'reset',
        timestamp: new Date()
      };

      await this.addToHistory(historyEntry);

      // Clear cache
      this.starRatingsCache = null;

      // Emit event
      DeviceEventEmitter.emit(this.EVENTS.STAR_LEVEL_CHANGED, {
        category,
        previousStars: previousLevel,
        newStars: currentRatings[categoryKey],
        reason: 'reset'
      });
    } catch (error) {
      console.error('Error resetting category star rating:', error);
      throw error;
    }
  }

  /**
   * Clear all star rating data (for testing/reset)
   */
  public static async clearAllStarData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEY,
        this.HISTORY_STORAGE_KEY,
        this.FAILURE_TRACKING_KEY
      ]);
      
      // Clear cache
      this.starRatingsCache = null;
      this.cacheTimestamp = 0;
    } catch (error) {
      console.error('Error clearing star rating data:', error);
      throw error;
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Create default star ratings for new user
   */
  private static createDefaultStarRatings(): UserChallengeRatings {
    return {
      habits: 1,
      journal: 1,
      goals: 1,
      consistency: 1,
      mastery: 1,
      special: 1,
      history: [],
      lastUpdated: new Date()
    };
  }

  /**
   * Map AchievementCategory to UserChallengeRatings key
   */
  private static mapCategoryToKey(category: AchievementCategory): keyof Omit<UserChallengeRatings, 'history' | 'lastUpdated'> | null {
    switch (category) {
      case AchievementCategory.HABITS:
        return 'habits';
      case AchievementCategory.JOURNAL:
        return 'journal';
      case AchievementCategory.GOALS:
        return 'goals';
      case AchievementCategory.CONSISTENCY:
        return 'consistency';
      case AchievementCategory.MASTERY:
        return 'mastery';
      case AchievementCategory.SPECIAL:
        return 'special';
      default:
        return null;
    }
  }

  /**
   * Normalize star ratings to ensure all categories exist
   */
  private static normalizeStarRatings(ratings: UserChallengeRatings): UserChallengeRatings {
    return {
      habits: this.clampStarLevel(ratings.habits ?? 1),
      journal: this.clampStarLevel(ratings.journal ?? 1),
      goals: this.clampStarLevel(ratings.goals ?? 1),
      consistency: this.clampStarLevel(ratings.consistency ?? 1),
      mastery: this.clampStarLevel(ratings.mastery ?? 1),
      special: this.clampStarLevel(ratings.special ?? 1),
      history: ratings.history ?? [],
      lastUpdated: ratings.lastUpdated ? new Date(ratings.lastUpdated) : new Date()
    };
  }

  /**
   * Clamp star level to valid range (1-5)
   */
  private static clampStarLevel(level: number): number {
    return Math.max(
      this.PROGRESSION_RULES.minStarLevel, 
      Math.min(this.PROGRESSION_RULES.maxStarLevel, Math.round(level))
    );
  }

  /**
   * Save star ratings to AsyncStorage
   */
  private static async saveStarRatings(ratings: UserChallengeRatings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(ratings));
      
      // Update cache
      this.starRatingsCache = ratings;
      this.cacheTimestamp = new Date().getTime();
    } catch (error) {
      console.error('Error saving star ratings:', error);
      throw error;
    }
  }

  /**
   * Add entry to star rating history
   */
  private static async addToHistory(entry: StarRatingHistoryEntry): Promise<void> {
    try {
      const existingHistory = await this.getStarRatingHistory();
      const updatedHistory = [entry, ...existingHistory];
      
      // Keep only last 12 months of history
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 12);
      const trimmedHistory = updatedHistory.filter(
        item => new Date(item.timestamp) >= cutoffDate
      );

      await AsyncStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error adding to star rating history:', error);
      // Don't throw - history is not critical for functionality
    }
  }

  /**
   * Track consecutive failures for demotion logic
   */
  private static async incrementConsecutiveFailures(category: AchievementCategory): Promise<number> {
    try {
      const key = `${this.FAILURE_TRACKING_KEY}_${category}`;
      const stored = await AsyncStorage.getItem(key);
      const currentCount = stored ? parseInt(stored, 10) : 0;
      const newCount = currentCount + 1;
      
      await AsyncStorage.setItem(key, newCount.toString());
      return newCount;
    } catch (error) {
      console.error('Error incrementing consecutive failures:', error);
      return 1; // Safe fallback
    }
  }

  /**
   * Reset consecutive failures counter
   */
  private static async resetConsecutiveFailures(category: AchievementCategory): Promise<void> {
    try {
      const key = `${this.FAILURE_TRACKING_KEY}_${category}`;
      await AsyncStorage.setItem(key, '0');
    } catch (error) {
      console.error('Error resetting consecutive failures:', error);
      // Don't throw - not critical
    }
  }

  /**
   * Calculate confidence level based on historical data
   */
  private static async calculateConfidenceLevel(category: AchievementCategory): Promise<'low' | 'medium' | 'high'> {
    try {
      const history = await this.getStarRatingHistory(category, 6); // Last 6 months
      
      if (history.length === 0) return 'low';
      if (history.length < 3) return 'low';
      if (history.length < 6) return 'medium';
      return 'high';
    } catch (error) {
      console.error('Error calculating confidence level:', error);
      return 'low';
    }
  }
}