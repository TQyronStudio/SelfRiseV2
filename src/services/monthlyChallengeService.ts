// Monthly Challenge Generation Engine
// Transforms weekly challenges into sophisticated monthly challenges with personalized difficulty scaling

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserActivityTracker, UserActivityBaseline } from './userActivityTracker';
import { StarRatingService, ChallengeCompletionData } from './starRatingService';
import { formatDateToString, today, addDays, subtractDays, parseDate } from '../utils/date';
import {
  MonthlyChallenge,
  MonthlyChallengeTemplate,
  MonthlyChallengeRequirement,
  MonthlyChallengeGenerationContext,
  MonthlyChallengeGenerationResult,
  CategorySelectionWeights,
  UserChallengeRatings,
  StarRatingHistoryEntry,
  MonthlyChallengeProgress,
  AchievementCategory
} from '../types/gamification';
import { generateUUID } from '../utils/uuid';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { sqliteChallengeStorage } from './storage/SQLiteChallengeStorage';

export class MonthlyChallengeService {
  private static readonly STORAGE_KEY = 'monthly_challenges';
  private static readonly RATINGS_STORAGE_KEY = 'user_challenge_ratings';
  private static readonly PROGRESS_STORAGE_KEY = 'monthly_challenge_progress';

  // Storage adapter - uses SQLite when enabled, AsyncStorage otherwise
  private static get storage() {
    return FEATURE_FLAGS.USE_SQLITE_CHALLENGES ? sqliteChallengeStorage : null;
  }

  // Star-based XP reward structure
  private static readonly MONTHLY_XP_REWARDS = {
    1: 500,   // 1★ Easy
    2: 750,   // 2★ Medium  
    3: 1125,  // 3★ Hard
    4: 1688,  // 4★ Expert
    5: 2532   // 5★ Master
  } as const;

  // ===============================================
  // MONTHLY CHALLENGE TEMPLATES BY CATEGORY
  // ===============================================

  /**
   * Habits Category Templates - Enhanced monthly habit challenges
   */
  private static readonly HABITS_TEMPLATES: MonthlyChallengeTemplate[] = [
    {
      id: 'habits_consistency_master',
      category: AchievementCategory.HABITS,
      title: 'Consistency Master',
      description: 'Complete your scheduled habits consistently throughout the month',
      baselineMetricKey: 'totalHabitCompletions',
      baselineMultiplierRange: [1.05, 1.25],
      requirementTemplates: [
        {
          type: 'habits',
          description: 'Complete scheduled habit tasks',
          trackingKey: 'scheduled_habit_completions',
          progressMilestones: [0.25, 0.50, 0.75]
        }
      ],
      starLevelRequirements: {
        minLevel: 1,
        preferredDataQuality: ['partial', 'complete']
      },
      baseXPReward: 500,
      bonusXPConditions: [
        'Perfect completion (+20% bonus)',
        'Monthly streak continuation (+100 XP per month)',
        'Weekend consistency bonus (+50 XP)'
      ],
      tags: ['consistency', 'routine', 'discipline'],
      priority: 100,
      cooldownMonths: 2,
      seasonality: ['01', '02', '09', '10'] // New year and back-to-school
    },
    {
      id: 'habits_variety_champion',
      category: AchievementCategory.HABITS,
      title: 'Variety Champion',
      description: 'Explore different habits each week to build a diverse routine',
      baselineMetricKey: 'avgHabitVariety',
      baselineMultiplierRange: [1.10, 1.30],
      requirementTemplates: [
        {
          type: 'habits',
          description: 'Complete different habits each week',
          trackingKey: 'unique_weekly_habits',
          progressMilestones: [0.25, 0.50, 0.75],
          weeklyTarget: 5
        }
      ],
      starLevelRequirements: {
        minLevel: 2,
        preferredDataQuality: ['complete']
      },
      baseXPReward: 550,
      bonusXPConditions: [
        'New habit discovery (+25 XP per new habit)',
        'Weekly variety milestone (+30 XP per week)',
        'Category balance bonus (+100 XP)'
      ],
      tags: ['variety', 'exploration', 'growth'],
      priority: 85,
      cooldownMonths: 3
    },
    {
      id: 'habits_streak_builder',
      category: AchievementCategory.HABITS,
      title: 'Streak Builder',
      description: 'Maintain consistent habit streaks throughout the month',
      baselineMetricKey: 'longestHabitStreak',
      baselineMultiplierRange: [1.15, 1.35],
      requirementTemplates: [
        {
          type: 'habits',
          description: 'Maintain habit streaks for consecutive days',
          trackingKey: 'habit_streak_days',
          progressMilestones: [0.25, 0.50, 0.75],
          dailyTarget: 1
        }
      ],
      starLevelRequirements: {
        minLevel: 3,
        preferredDataQuality: ['complete']
      },
      baseXPReward: 600,
      bonusXPConditions: [
        'Streak milestone rewards (+50 XP per 7-day streak)',
        'Multiple habit streaks (+75 XP bonus)',
        'Perfect month streak (+200 XP)'
      ],
      tags: ['streaks', 'momentum', 'persistence'],
      priority: 90,
      cooldownMonths: 2
    },
    {
      id: 'habits_bonus_hunter',
      category: AchievementCategory.HABITS,
      title: 'Bonus Hunter',
      description: 'Go beyond your scheduled habits with bonus completions',
      baselineMetricKey: 'avgDailyBonusHabits',
      baselineMultiplierRange: [1.20, 1.40],
      requirementTemplates: [
        {
          type: 'habits',
          description: 'Complete bonus habits above your schedule',
          trackingKey: 'bonus_habit_completions',
          progressMilestones: [0.25, 0.50, 0.75]
        }
      ],
      starLevelRequirements: {
        minLevel: 2,
        preferredDataQuality: ['partial', 'complete']
      },
      baseXPReward: 525,
      bonusXPConditions: [
        'Daily bonus achievement (+15 XP per day)',
        'Weekend bonus surge (+100 XP)',
        'Consistency bonus (+10 XP per consistent week)'
      ],
      tags: ['bonus', 'exceeding', 'ambitious'],
      priority: 75,
      cooldownMonths: 3
    }
  ];

  /**
   * Journal Category Templates - Enhanced monthly journaling challenges
   */
  private static readonly JOURNAL_TEMPLATES: MonthlyChallengeTemplate[] = [
    {
      id: 'journal_reflection_expert',
      category: AchievementCategory.JOURNAL,
      title: 'Reflection Expert',
      description: 'Write quality, thoughtful journal entries consistently',
      baselineMetricKey: 'totalJournalEntries',
      baselineMultiplierRange: [1.05, 1.25],
      requirementTemplates: [
        {
          type: 'journal',
          description: 'Write quality journal entries (33+ characters)',
          trackingKey: 'quality_journal_entries',
          progressMilestones: [0.25, 0.50, 0.75],
          dailyTarget: 3
        }
      ],
      starLevelRequirements: {
        minLevel: 1,
        preferredDataQuality: ['partial', 'complete']
      },
      baseXPReward: 500,
      bonusXPConditions: [
        'Length bonus for detailed entries (+20 XP per 500+ chars)',
        'Daily reflection streak (+25 XP per consecutive day)',
        'Thoughtful content bonus (+50 XP per week)'
      ],
      tags: ['reflection', 'quality', 'mindfulness'],
      priority: 95,
      cooldownMonths: 2
    },
    {
      id: 'journal_gratitude_guru',
      category: AchievementCategory.JOURNAL,
      title: 'Gratitude Guru',
      description: 'Master both regular and bonus journal entries for gratitude practice',
      baselineMetricKey: 'avgDailyBonusEntries',
      baselineMultiplierRange: [1.10, 1.30],
      requirementTemplates: [
        {
          type: 'journal',
          description: 'Write regular and bonus gratitude entries',
          trackingKey: 'total_journal_entries_with_bonus',
          progressMilestones: [0.25, 0.50, 0.75],
          dailyTarget: 4
        }
      ],
      starLevelRequirements: {
        minLevel: 2,
        preferredDataQuality: ['complete']
      },
      baseXPReward: 550,
      bonusXPConditions: [
        'Bonus entry achievement (+30 XP per bonus)',
        'Gratitude depth bonus (+40 XP per week)',
        'Perfect gratitude day (+15 XP per day with 5+ entries)'
      ],
      tags: ['gratitude', 'bonus', 'abundance'],
      priority: 85,
      cooldownMonths: 3
    },
    {
      id: 'journal_consistency_writer',
      category: AchievementCategory.JOURNAL,
      title: 'Consistency Writer',
      description: 'Journal every single day to build an unbreakable habit',
      baselineMetricKey: 'journalConsistencyDays',
      baselineMultiplierRange: [1.15, 1.35],
      requirementTemplates: [
        {
          type: 'journal',
          description: 'Journal consistently every day',
          trackingKey: 'daily_journal_streak',
          progressMilestones: [0.25, 0.50, 0.75],
          dailyTarget: 1
        }
      ],
      starLevelRequirements: {
        minLevel: 3,
        preferredDataQuality: ['complete']
      },
      baseXPReward: 600,
      bonusXPConditions: [
        'Perfect daily streak (+100 XP per week)',
        'Never miss a day (+300 XP monthly bonus)',
        'Consistency champion (+50 XP per milestone)'
      ],
      tags: ['daily', 'consistency', 'streak'],
      priority: 90,
      cooldownMonths: 2
    },
    {
      id: 'journal_depth_explorer',
      category: AchievementCategory.JOURNAL,
      title: 'Depth Explorer',
      description: 'Write longer, more detailed entries to deepen self-reflection',
      baselineMetricKey: 'avgEntryLength',
      baselineMultiplierRange: [1.20, 1.40],
      requirementTemplates: [
        {
          type: 'journal',
          description: 'Achieve target average entry length',
          trackingKey: 'avg_entry_length',
          progressMilestones: [0.25, 0.50, 0.75]
        }
      ],
      starLevelRequirements: {
        minLevel: 2,
        preferredDataQuality: ['partial', 'complete']
      },
      baseXPReward: 575,
      bonusXPConditions: [
        'Long entry bonus (+25 XP per 1000+ char entry)',
        'Weekly depth achievement (+75 XP)',
        'Insight discovery bonus (+100 XP for exceptional entries)'
      ],
      tags: ['depth', 'detail', 'insight'],
      priority: 75,
      cooldownMonths: 3
    }
  ];

  /**
   * Goals Category Templates - Enhanced monthly goal achievement challenges
   */
  private static readonly GOALS_TEMPLATES: MonthlyChallengeTemplate[] = [
    {
      id: 'goals_progress_champion',
      category: AchievementCategory.GOALS,
      title: 'Progress Champion',
      description: 'Make consistent daily progress towards your goals',
      baselineMetricKey: 'totalGoalProgressDays',
      baselineMultiplierRange: [1.05, 1.25],
      requirementTemplates: [
        {
          type: 'goals',
          description: 'Make goal progress on target number of days',
          trackingKey: 'daily_goal_progress',
          progressMilestones: [0.25, 0.50, 0.75],
          dailyTarget: 1
        }
      ],
      starLevelRequirements: {
        minLevel: 1,
        preferredDataQuality: ['partial', 'complete']
      },
      baseXPReward: 525,
      bonusXPConditions: [
        'Daily progress achievement (+20 XP per day)',
        'Weekly consistency (+50 XP per week)',
        'Perfect progress month (+200 XP)'
      ],
      tags: ['progress', 'consistency', 'achievement'],
      priority: 95,
      cooldownMonths: 2
    },
    {
      id: 'goals_completion_master',
      category: AchievementCategory.GOALS,
      title: 'Achievement Unlocked',
      description: 'Complete multiple goals throughout the month',
      baselineMetricKey: 'goalsCompleted',
      baselineMultiplierRange: [1.15, 1.35],
      requirementTemplates: [
        {
          type: 'goals',
          description: 'Complete target number of goals',
          trackingKey: 'goal_completions',
          progressMilestones: [0.25, 0.50, 0.75]
        }
      ],
      starLevelRequirements: {
        minLevel: 2,
        preferredDataQuality: ['complete']
      },
      baseXPReward: 625,
      bonusXPConditions: [
        'Goal completion bonus (+100 XP per goal)',
        'Multi-goal achievement (+150 XP for 3+ goals)',
        'Big goal bonus (+200 XP for 1000+ value goals)'
      ],
      tags: ['completion', 'achievement', 'success'],
      priority: 85,
      cooldownMonths: 3
    }
  ];

  /**
   * Consistency Category Templates - Enhanced monthly consistency challenges
   */
  private static readonly CONSISTENCY_TEMPLATES: MonthlyChallengeTemplate[] = [
    {
      id: 'consistency_triple_master',
      category: AchievementCategory.CONSISTENCY,
      title: 'Triple Master',
      description: 'Use all three features (habits, journal, goals) every day',
      baselineMetricKey: 'tripleFeatureDays',
      baselineMultiplierRange: [1.05, 1.25],
      requirementTemplates: [
        {
          type: 'consistency',
          description: 'Use habits, journal, and goals daily',
          trackingKey: 'triple_feature_days',
          progressMilestones: [0.25, 0.50, 0.75],
          dailyTarget: 1
        }
      ],
      starLevelRequirements: {
        minLevel: 2,
        preferredDataQuality: ['complete']
      },
      baseXPReward: 600,
      bonusXPConditions: [
        'Perfect triple day (+30 XP per day)',
        'Weekly triple achievement (+100 XP per week)',
        'Monthly triple master (+300 XP)'
      ],
      tags: ['triple', 'balance', 'comprehensive'],
      priority: 100,
      cooldownMonths: 2
    },
    {
      id: 'consistency_perfect_month',
      category: AchievementCategory.CONSISTENCY,
      title: 'Perfect Month',
      description: 'Achieve daily minimums (1+ habits, 3+ journal entries) consistently',
      baselineMetricKey: 'perfectDays',
      baselineMultiplierRange: [1.15, 1.35],
      requirementTemplates: [
        {
          type: 'consistency',
          description: 'Meet daily minimum requirements consistently',
          trackingKey: 'perfect_days',
          progressMilestones: [0.25, 0.50, 0.75],
          dailyTarget: 1
        }
      ],
      starLevelRequirements: {
        minLevel: 3,
        preferredDataQuality: ['complete']
      },
      baseXPReward: 675,
      bonusXPConditions: [
        'Perfect day achievement (+50 XP per day)',
        'Perfect week bonus (+200 XP per week)',
        'Flawless month (+500 XP for 100%)'
      ],
      tags: ['perfect', 'minimums', 'excellence'],
      priority: 90,
      cooldownMonths: 2
    },
    {
      id: 'consistency_xp_champion',
      category: AchievementCategory.CONSISTENCY,
      title: 'XP Champion',
      description: 'Accumulate total XP through consistent monthly engagement',
      baselineMetricKey: 'avgDailyXP',
      baselineMultiplierRange: [1.15, 1.35],
      requirementTemplates: [
        {
          type: 'consistency',
          description: 'Accumulate XP through all app activities monthly',
          trackingKey: 'monthly_xp_total',
          progressMilestones: [0.25, 0.50, 0.75],
          dailyTarget: undefined // No daily target for monthly accumulation
        }
      ],
      starLevelRequirements: {
        minLevel: 1,
        preferredDataQuality: ['partial', 'complete']
      },
      baseXPReward: 675,
      bonusXPConditions: [
        'Milestone achievements (+50 XP per milestone)',
        'Consistency bonuses (+100 XP per bonus)',
        'Perfect month completion (+500 XP for reaching 100%)'
      ],
      tags: ['engagement', 'daily', 'active'],
      priority: 85,
      cooldownMonths: 3
    },
    {
      id: 'consistency_balance_expert',
      category: AchievementCategory.CONSISTENCY,
      title: 'Balance Expert',
      description: 'Maintain balanced XP sources (no single source >60% of total)',
      baselineMetricKey: 'balanceScore',
      baselineMultiplierRange: [1.20, 1.40],
      requirementTemplates: [
        {
          type: 'consistency',
          description: 'Maintain balanced feature usage',
          trackingKey: 'balance_score',
          progressMilestones: [0.25, 0.50, 0.75]
        }
      ],
      starLevelRequirements: {
        minLevel: 4,
        preferredDataQuality: ['complete']
      },
      baseXPReward: 700,
      bonusXPConditions: [
        'Perfect balance bonus (+100 XP per week)',
        'Variety champion (+150 XP monthly)',
        'Harmony achievement (+200 XP for exceptional balance)'
      ],
      tags: ['balance', 'variety', 'harmony'],
      priority: 65,
      cooldownMonths: 4
    }
  ];

  // ===============================================
  // TEMPLATE ACCESS AND MANAGEMENT
  // ===============================================

  /**
   * Get all available challenge templates organized by category
   */
  static getAllTemplates(): Record<AchievementCategory, MonthlyChallengeTemplate[]> {
    return {
      [AchievementCategory.HABITS]: [...this.HABITS_TEMPLATES],
      [AchievementCategory.JOURNAL]: [...this.JOURNAL_TEMPLATES],
      [AchievementCategory.GOALS]: [...this.GOALS_TEMPLATES],
      [AchievementCategory.CONSISTENCY]: [...this.CONSISTENCY_TEMPLATES],
      [AchievementCategory.MASTERY]: [], // No mastery challenge templates yet
      [AchievementCategory.SPECIAL]: [], // No special challenge templates yet
    };
  }

  /**
   * Get templates for a specific category
   */
  static getTemplatesForCategory(category: AchievementCategory): MonthlyChallengeTemplate[] {
    const allTemplates = this.getAllTemplates();
    return allTemplates[category] || [];
  }

  /**
   * Get a specific template by ID
   */
  static getTemplateById(templateId: string): MonthlyChallengeTemplate | null {
    const allTemplates = Object.values(this.getAllTemplates()).flat();
    return allTemplates.find(template => template.id === templateId) || null;
  }

  /**
   * Get star-based XP reward for a given star level
   */
  static getXPRewardForStarLevel(starLevel: 1 | 2 | 3 | 4 | 5): number {
    return this.MONTHLY_XP_REWARDS[starLevel];
  }

  // ===============================================
  // STAR-BASED DIFFICULTY SCALING SYSTEM
  // ===============================================

  /**
   * Star progression logic and scaling multipliers
   */
  private static readonly STAR_SCALING = {
    1: { multiplier: 1.05, description: 'Easy (+5%)', color: '#FFD700' },
    2: { multiplier: 1.10, description: 'Medium (+10%)', color: '#FFA500' },
    3: { multiplier: 1.15, description: 'Hard (+15%)', color: '#FF6347' },
    4: { multiplier: 1.20, description: 'Expert (+20%)', color: '#DC143C' },
    5: { multiplier: 1.25, description: 'Master (+25%)', color: '#8B0000' }
  } as const;

  /**
   * Get star scaling configuration for a specific star level
   */
  static getStarScaling(starLevel: 1 | 2 | 3 | 4 | 5): { 
    multiplier: number; 
    description: string; 
    color: string;
  } {
    if (starLevel < 1 || starLevel > 5) {
      console.warn(`Invalid star level ${starLevel}, defaulting to level 1`);
      return this.STAR_SCALING[1];
    }
    return this.STAR_SCALING[starLevel];
  }

  /**
   * Apply star-based scaling to a baseline value
   */
  static applyStarScaling(baselineValue: number, starLevel: 1 | 2 | 3 | 4 | 5): number {
    const scaling = this.getStarScaling(starLevel);
    const scaledValue = Math.ceil(baselineValue * scaling.multiplier);
    
    // Ensure minimum meaningful targets
    return Math.max(scaledValue, starLevel); // At least match star level as minimum
  }

  // Note: getDefaultStarRatings method removed - StarRatingService handles default values internally

  /**
   * Get current user star ratings using StarRatingService
   */
  static async getUserStarRatings(): Promise<UserChallengeRatings> {
    return await StarRatingService.getCurrentStarRatings();
  }

  // Note: saveUserStarRatings method removed - StarRatingService handles storage internally

  /**
   * Update star rating for a category based on challenge completion using StarRatingService
   */
  static async updateStarRatings(
    category: AchievementCategory, 
    completionPercentage: number,
    month: string = formatDateToString(new Date()).substring(0, 7)
  ): Promise<StarRatingHistoryEntry> {
    // Create challenge completion data for StarRatingService
    const completionData: ChallengeCompletionData = {
      challengeId: `monthly_${month}_${category}`,
      category,
      completionPercentage,
      month,
      wasCompleted: completionPercentage >= 70,
      targetValue: 100, // Placeholder, will be filled by actual challenge data
      actualValue: completionPercentage
    };

    return await StarRatingService.updateStarRatingForCompletion(completionData);
  }

  // Note: countRecentFailures method removed - StarRatingService handles failure tracking internally

  // Note: getStarLevelForCategory method removed - use StarRatingService.getCurrentStarRatings() directly

  /**
   * Reset star ratings for a category using StarRatingService
   */
  static async resetStarRating(category: AchievementCategory, newRating: 1 | 2 | 3 | 4 | 5): Promise<void> {
    await StarRatingService.resetCategoryStarRating(category, newRating);
  }

  /**
   * Get star rating statistics and progression analytics using StarRatingService
   */
  static async getStarRatingStats(): Promise<{
    currentRatings: UserChallengeRatings;
    averageStarLevel: number;
    totalProgressions: number;
    totalRegressions: number;
    monthlyTrend: 'improving' | 'stable' | 'declining';
  }> {
    // Get data from both services to maintain compatibility
    const ratings = await this.getUserStarRatings();
    const analysis = await StarRatingService.generateStarRatingAnalysis();

    return {
      currentRatings: ratings,
      averageStarLevel: analysis.overallRating,
      totalProgressions: analysis.totalCompletions,
      totalRegressions: analysis.totalFailures,
      monthlyTrend: analysis.recentTrend
    };
  }

  // ===============================================
  // BASELINE-DRIVEN CHALLENGE PARAMETER CALCULATION
  // ===============================================

  /**
   * Calculate target value for a challenge requirement based on user baseline and star level
   */
  static calculateTargetFromBaseline(
    template: MonthlyChallengeTemplate,
    userBaseline: UserActivityBaseline,
    starLevel: 1 | 2 | 3 | 4 | 5,
    fallbackValue: number = 10,
    targetMonth?: string
  ): {
    target: number;
    baselineValue: number;
    scalingMultiplier: number;
    calculationMethod: 'baseline' | 'fallback' | 'minimum';
    warnings: string[];
  } {
    const warnings: string[] = [];
    let baselineValue = 0;
    let calculationMethod: 'baseline' | 'fallback' | 'minimum' = 'baseline';

    // Extract baseline value from the specified metric key
    try {
      baselineValue = this.extractBaselineMetric(template.baselineMetricKey, userBaseline);
      
      if (baselineValue <= 0) {
        warnings.push(`Baseline value for ${template.baselineMetricKey} is ${baselineValue}, using fallback`);
        baselineValue = fallbackValue;
        calculationMethod = 'fallback';
      }
    } catch (error) {
      warnings.push(`Failed to extract baseline metric ${template.baselineMetricKey}: ${error}`);
      baselineValue = fallbackValue;
      calculationMethod = 'fallback';
    }

    // Get star scaling multiplier
    const starScaling = this.getStarScaling(starLevel);
    const scalingMultiplier = starScaling.multiplier;

    // Apply template-specific multiplier range constraints
    const [minMultiplier, maxMultiplier] = template.baselineMultiplierRange;
    const constrainedMultiplier = Math.min(Math.max(scalingMultiplier, minMultiplier), maxMultiplier);
    
    if (constrainedMultiplier !== scalingMultiplier) {
      warnings.push(`Star scaling ${scalingMultiplier} constrained to ${constrainedMultiplier} by template range`);
    }

    // Calculate target with scaling
    let target = Math.ceil(baselineValue * constrainedMultiplier);

    // Apply minimum target rules
    const minimumTarget = this.getMinimumTargetForTemplate(template, starLevel);
    if (target < minimumTarget) {
      warnings.push(`Calculated target ${target} below minimum ${minimumTarget}, using minimum`);
      target = minimumTarget;
      calculationMethod = 'minimum';
    }

    // Apply monthly limit for daily streak challenges (cannot exceed days in month)
    if (this.isDailyStreakTrackingKey(template.requirementTemplates[0]?.trackingKey)) {
      let daysInMonth: number;
      
      if (targetMonth) {
        // Parse target month (format: "YYYY-MM") and calculate days in that specific month
        const [year, month] = targetMonth.split('-').map(Number);
        if (year && month) {
          daysInMonth = new Date(year, month, 0).getDate(); // Last day of the month
        } else {
          // Invalid format, fallback to current month
          const currentDate = new Date();
          daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        }
      } else {
        // Fallback to current month if targetMonth not provided
        const currentDate = new Date();
        daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      }
      
      if (target > daysInMonth) {
        const monthName = targetMonth ? `${targetMonth}` : 'current month';
        warnings.push(`Daily streak target ${target} exceeds days in ${monthName} (${daysInMonth}), capping at ${daysInMonth}`);
        target = daysInMonth;
      }
    }

    // Apply XP limit validation for XP Champion challenges (monthly XP total must be achievable)
    if (this.isXPTotalTrackingKey(template.requirementTemplates[0]?.trackingKey)) {
      let daysInMonth: number;

      if (targetMonth) {
        // Parse target month (format: "YYYY-MM") and calculate days in that specific month
        const [year, month] = targetMonth.split('-').map(Number);
        if (year && month) {
          daysInMonth = new Date(year, month, 0).getDate(); // Last day of the month
        } else {
          // Invalid format, fallback to current month
          const currentDate = new Date();
          daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        }
      } else {
        // Fallback to current month if targetMonth not provided
        const currentDate = new Date();
        daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      }

      // Calculate maximum achievable monthly XP based on daily XP limits
      const TOTAL_DAILY_MAX = 1500; // From DAILY_XP_LIMITS.TOTAL_DAILY_MAX
      const maxAchievableMonthlyXP = TOTAL_DAILY_MAX * daysInMonth;

      if (target > maxAchievableMonthlyXP) {
        const monthName = targetMonth ? `${targetMonth}` : 'current month';
        warnings.push(`XP target ${target} exceeds achievable limit for ${monthName} (${maxAchievableMonthlyXP} XP in ${daysInMonth} days), capping at ${maxAchievableMonthlyXP}`);
        target = maxAchievableMonthlyXP;
      }

      // Additional validation: Check if daily average is reasonable (warn if > 80% of daily limit)
      const dailyAverageRequired = target / daysInMonth;
      if (dailyAverageRequired > TOTAL_DAILY_MAX * 0.8) { // 80% of daily max is quite challenging
        warnings.push(`XP target requires high daily average (${Math.round(dailyAverageRequired)} XP/day, ${Math.round((dailyAverageRequired/TOTAL_DAILY_MAX)*100)}% of daily limit)`);
      }
    }

    return {
      target,
      baselineValue,
      scalingMultiplier: constrainedMultiplier,
      calculationMethod,
      warnings
    };
  }

  /**
   * Extract a specific baseline metric value from UserActivityBaseline
   */
  private static extractBaselineMetric(metricKey: string, baseline: UserActivityBaseline): number {
    const metricMap: Record<string, keyof UserActivityBaseline> = {
      // Habits metrics
      'totalHabitCompletions': 'totalHabitCompletions',
      'avgDailyHabitCompletions': 'avgDailyHabitCompletions',
      'avgDailyBonusHabits': 'avgDailyBonusHabits',
      'avgHabitVariety': 'avgHabitVariety',
      'longestHabitStreak': 'longestHabitStreak',
      'habitConsistencyDays': 'habitConsistencyDays',

      // Journal metrics
      'totalJournalEntries': 'totalJournalEntries',
      'avgDailyJournalEntries': 'avgDailyJournalEntries',
      'avgDailyBonusEntries': 'avgDailyBonusEntries',
      'avgEntryLength': 'avgEntryLength',
      'journalConsistencyDays': 'journalConsistencyDays',
      'longestJournalStreak': 'longestJournalStreak',

      // Goal metrics
      'totalGoalProgressDays': 'totalGoalProgressDays',
      'avgDailyGoalProgress': 'avgDailyGoalProgress',
      'goalsCompleted': 'goalsCompleted',
      'avgGoalTargetValue': 'avgGoalTargetValue',
      'goalConsistencyDays': 'goalConsistencyDays',
      'longestGoalStreak': 'longestGoalStreak',

      // Consistency metrics
      'appUsageDays': 'totalActiveDays', // Note: renamed in baseline
      'tripleFeatureDays': 'tripleFeatureDays',
      'perfectDays': 'perfectDays',
      'longestEngagementStreak': 'longestEngagementStreak',
      'balanceScore': 'balanceScore',
      
      // XP metrics (for monthly total XP challenges)
      'avgDailyXP': 'avgDailyXP',
      'totalMonthlyXP': 'totalMonthlyXP',
      'maxObservedDailyXP': 'maxObservedDailyXP'
    };

    const mappedKey = metricMap[metricKey];
    if (!mappedKey) {
      throw new Error(`Unknown baseline metric key: ${metricKey}`);
    }

    const value = baseline[mappedKey];
    if (typeof value !== 'number') {
      throw new Error(`Baseline metric ${metricKey} is not a number: ${value}`);
    }

    return value;
  }

  /**
   * Get minimum target value for a template based on star level and category
   */
  private static getMinimumTargetForTemplate(
    template: MonthlyChallengeTemplate, 
    starLevel: 1 | 2 | 3 | 4 | 5
  ): number {
    // Category-specific minimum targets
    const categoryMinimums: Record<AchievementCategory, number[]> = {
      [AchievementCategory.HABITS]: [20, 25, 30, 35, 40], // 20-40 habits/month
      [AchievementCategory.JOURNAL]: [30, 40, 50, 60, 70], // 30-70 entries/month
      [AchievementCategory.GOALS]: [10, 12, 15, 18, 20], // 10-20 goal progress days/month
      [AchievementCategory.CONSISTENCY]: [15, 18, 22, 25, 28], // 15-28 consistency days/month
      [AchievementCategory.MASTERY]: [5, 8, 12, 15, 18], // Advanced users only
      [AchievementCategory.SPECIAL]: [1, 2, 3, 4, 5], // Event-based
    };

    const minimums = categoryMinimums[template.category] || [5, 8, 12, 15, 18];
    return minimums[starLevel - 1] || starLevel * 5; // Fallback to star * 5
  }

  /**
   * Check if tracking key represents daily streak counting (limited by days in month)
   */
  private static isDailyStreakTrackingKey(trackingKey?: string): boolean {
    const dailyStreakKeys = [
      'daily_journal_streak',
      'habit_streak_days',
      'daily_goal_progress',
      'daily_engagement_streak',
      'triple_feature_days',
      'perfect_days'
    ];

    return trackingKey ? dailyStreakKeys.includes(trackingKey) : false;
  }

  /**
   * Check if tracking key represents XP total tracking (limited by daily XP caps)
   */
  private static isXPTotalTrackingKey(trackingKey?: string): boolean {
    const xpTotalKeys = [
      'monthly_xp_total'
    ];

    return trackingKey ? xpTotalKeys.includes(trackingKey) : false;
  }

  /**
   * Create personalized challenge requirements from template and baseline data
   */
  static createPersonalizedRequirements(
    template: MonthlyChallengeTemplate,
    userBaseline: UserActivityBaseline,
    starLevel: 1 | 2 | 3 | 4 | 5,
    targetMonth?: string
  ): {
    requirements: MonthlyChallengeRequirement[];
    metadata: {
      totalWarnings: string[];
      fallbacksUsed: number;
      averageScaling: number;
    };
  } {
    const requirements: MonthlyChallengeRequirement[] = [];
    const allWarnings: string[] = [];
    let fallbacksUsed = 0;
    let totalScaling = 0;

    for (const reqTemplate of template.requirementTemplates) {
      // Calculate target value for this requirement
      const calculation = this.calculateTargetFromBaseline(
        template,
        userBaseline,
        starLevel,
        this.getDefaultFallbackForRequirement(reqTemplate.type),
        targetMonth
      );

      if (calculation.calculationMethod === 'fallback') {
        fallbacksUsed++;
      }

      totalScaling += calculation.scalingMultiplier;
      allWarnings.push(...calculation.warnings);

      // Create personalized requirement
      const personalizedRequirement: MonthlyChallengeRequirement = {
        ...reqTemplate,
        target: calculation.target,
        baselineValue: calculation.baselineValue,
        scalingMultiplier: calculation.scalingMultiplier,
        dailyTarget: reqTemplate.dailyTarget ? Math.ceil(calculation.target / 30) : undefined,
        weeklyTarget: reqTemplate.weeklyTarget ? Math.ceil(calculation.target / 4) : undefined
      };

      requirements.push(personalizedRequirement);
    }

    return {
      requirements,
      metadata: {
        totalWarnings: allWarnings,
        fallbacksUsed,
        averageScaling: totalScaling / template.requirementTemplates.length
      }
    };
  }

  /**
   * Get default fallback value for a requirement type when baseline data is insufficient
   */
  private static getDefaultFallbackForRequirement(requirementType: string): number {
    const fallbacks: Record<string, number> = {
      'habits': 25,        // 25 habit completions/month
      'journal': 45,       // 45 journal entries/month
      'goals': 15,         // 15 goal progress days/month
      'consistency': 20    // 20 consistency days/month
    };

    return fallbacks[requirementType] || 15;
  }

  /**
   * Validate if user baseline data is sufficient for reliable challenge generation
   */
  static validateBaselineForChallengeGeneration(baseline: UserActivityBaseline): {
    isValid: boolean;
    dataQuality: 'minimal' | 'partial' | 'complete';
    missingMetrics: string[];
    recommendations: string[];
  } {
    const missingMetrics: string[] = [];
    const recommendations: string[] = [];

    // Check essential metrics
    const essentialMetrics = [
      { key: 'totalActiveDays', min: 7, name: 'Active Days' },
      { key: 'totalHabitCompletions', min: 5, name: 'Habit Completions' },
      { key: 'totalJournalEntries', min: 10, name: 'Journal Entries' },
      { key: 'totalGoalProgressDays', min: 3, name: 'Goal Progress Days' }
    ];

    for (const metric of essentialMetrics) {
      const value = baseline[metric.key as keyof UserActivityBaseline] as number;
      if (value < metric.min) {
        missingMetrics.push(metric.name);
      }
    }

    // Determine data quality
    let dataQuality: 'minimal' | 'partial' | 'complete';
    if (baseline.totalActiveDays < 10) {
      dataQuality = 'minimal';
      recommendations.push('Use the app more consistently to improve challenge personalization');
      recommendations.push('Complete at least 10 active days for better baseline calculation');
    } else if (baseline.totalActiveDays < 20 || missingMetrics.length > 1) {
      dataQuality = 'partial';
      recommendations.push('Continue building consistent habits for more accurate challenges');
    } else {
      dataQuality = 'complete';
    }

    // Specific recommendations based on missing metrics
    if (missingMetrics.includes('Habit Completions')) {
      recommendations.push('Complete more habits to unlock better habit-based challenges');
    }
    if (missingMetrics.includes('Journal Entries')) {
      recommendations.push('Write more journal entries to improve journaling challenges');
    }
    if (missingMetrics.includes('Goal Progress Days')) {
      recommendations.push('Make progress on goals more frequently for better goal challenges');
    }

    return {
      isValid: dataQuality !== 'minimal' || baseline.totalActiveDays >= 5,
      dataQuality,
      missingMetrics,
      recommendations
    };
  }

  /**
   * Generate challenge parameters with intelligent fallbacks for new/low-data users
   */
  static generateChallengeParameters(
    template: MonthlyChallengeTemplate,
    userBaseline: UserActivityBaseline | null,
    starLevel: 1 | 2 | 3 | 4 | 5,
    isFirstMonth: boolean = false,
    targetMonth?: string
  ): {
    requirements: MonthlyChallengeRequirement[];
    xpReward: number;
    generationWarnings: string[];
    dataQualityUsed: 'complete' | 'partial' | 'minimal' | 'fallback';
    recommendedDifficulty?: 'easier' | 'harder' | undefined;
  } {
    const warnings: string[] = [];
    let dataQualityUsed: 'complete' | 'partial' | 'minimal' | 'fallback';
    let recommendedDifficulty: 'easier' | 'harder' | undefined;

    // Handle case where no baseline is available (new users)
    if (!userBaseline || isFirstMonth) {
      warnings.push('Using first-month fallback parameters for new user');
      dataQualityUsed = 'fallback';
      
      return {
        requirements: this.createFirstMonthRequirements(template, starLevel),
        xpReward: this.getXPRewardForStarLevel(Math.max(1, starLevel - 1) as 1 | 2 | 3 | 4 | 5), // Slightly easier XP for first month
        generationWarnings: warnings,
        dataQualityUsed,
        recommendedDifficulty: starLevel > 2 ? 'easier' : undefined
      };
    }

    // Validate baseline data quality
    const validation = this.validateBaselineForChallengeGeneration(userBaseline);
    dataQualityUsed = validation.dataQuality;
    warnings.push(...validation.recommendations);

    if (!validation.isValid) {
      warnings.push('Baseline data insufficient, using conservative fallback parameters');
      dataQualityUsed = 'fallback';
      return {
        requirements: this.createFirstMonthRequirements(template, Math.max(1, starLevel - 1) as 1 | 2 | 3 | 4 | 5),
        xpReward: this.getXPRewardForStarLevel(Math.max(1, starLevel - 1) as 1 | 2 | 3 | 4 | 5),
        generationWarnings: warnings,
        dataQualityUsed
      };
    }

    // Create personalized requirements from baseline
    const personalizedReqs = this.createPersonalizedRequirements(template, userBaseline, starLevel, targetMonth);
    warnings.push(...personalizedReqs.metadata.totalWarnings);

    // Adjust difficulty recommendation based on data quality
    if (dataQualityUsed === 'minimal' && starLevel > 2) {
      recommendedDifficulty = 'easier';
      warnings.push('Consider reducing star level due to limited data quality');
    } else if (dataQualityUsed === 'complete' && starLevel < 3 && userBaseline.totalActiveDays > 25) {
      recommendedDifficulty = 'harder';
      warnings.push('Consider increasing star level based on consistent activity');
    }

    return {
      requirements: personalizedReqs.requirements,
      xpReward: this.getXPRewardForStarLevel(starLevel),
      generationWarnings: warnings,
      dataQualityUsed,
      recommendedDifficulty
    };
  }

  // ===============================================
  // FIRST-MONTH SPECIAL HANDLING FOR NEW USERS
  // ===============================================

  /**
   * Generate a complete first-month challenge experience for new users
   */
  static generateFirstMonthChallenge(
    preferredCategory?: AchievementCategory,
    userId: string = 'local_user'
  ): {
    challenge: MonthlyChallenge;
    welcomeMessage: string;
    onboardingTips: string[];
    progressGuidance: string[];
    expectations: {
      difficulty: string;
      timeCommitment: string;
      successRate: string;
    };
  } {
    // Select beginner-friendly category
    const selectedCategory = preferredCategory || this.selectBeginnerFriendlyCategory();
    
    // Get beginner template for the category
    const template = this.selectBeginnerTemplate(selectedCategory);
    
    // Create first-month requirements (extra conservative)
    const requirements = this.createFirstMonthRequirements(template, 1); // Force level 1
    
    // Generate challenge with special first-month adjustments
    const challenge = this.createFirstMonthChallengeObject(
      template,
      requirements,
      selectedCategory,
      userId
    );

    return {
      challenge,
      welcomeMessage: this.generateFirstMonthWelcomeMessage(selectedCategory, template.title),
      onboardingTips: this.generateOnboardingTips(selectedCategory),
      progressGuidance: this.generateProgressGuidance(requirements),
      expectations: this.getFirstMonthExpectations(selectedCategory)
    };
  }

  /**
   * Select the most beginner-friendly category
   */
  private static selectBeginnerFriendlyCategory(): AchievementCategory {
    // Habits are most fundamental and easiest to understand for new users
    return AchievementCategory.HABITS;
  }

  /**
   * Select the most beginner-friendly template within a category
   */
  private static selectBeginnerTemplate(category: AchievementCategory): MonthlyChallengeTemplate {
    const categoryTemplates = this.getTemplatesForCategory(category);
    
    // Find template with lowest minimum level requirement
    const beginnerTemplate = categoryTemplates.reduce((easiest, current) => 
      current.starLevelRequirements.minLevel < easiest.starLevelRequirements.minLevel 
        ? current : easiest
    );

    return beginnerTemplate;
  }

  /**
   * Create the actual first-month challenge object
   */
  private static createFirstMonthChallengeObject(
    template: MonthlyChallengeTemplate,
    requirements: MonthlyChallengeRequirement[],
    category: AchievementCategory,
    userId: string
  ): MonthlyChallenge {
    // CRITICAL: Use month utility functions to avoid timezone issues
    // (creating Date objects with local time causes UTC conversion problems)
    const todayDate = today();
    const startDate = parseDate(todayDate);
    startDate.setUTCDate(1);
    const startDateStr = formatDateToString(startDate);

    const endDate = parseDate(todayDate);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1, 0);
    const endDateStr = formatDateToString(endDate);

    return {
      id: generateUUID(),
      title: `🌱 First Month: ${template.title}`,
      description: `${template.description}\n\n✨ This is your introduction to monthly challenges! We've made it extra achievable to help you build confidence.`,
      startDate: startDateStr,
      endDate: endDateStr,
      baseXPReward: 400, // Fixed first-month XP (between 1★ and 2★)
      starLevel: 1,
      category,
      requirements,
      userBaselineSnapshot: {
        month: startDateStr.substring(0, 7),
        analysisStartDate: startDateStr,
        analysisEndDate: endDateStr,
        dataQuality: 'minimal',
        totalActiveDays: 0
      },
      scalingFormula: 'first_month_conservative * 0.8',
      isActive: true,
      generationReason: 'first_month',
      categoryRotation: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate personalized welcome message for first-month users
   */
  private static generateFirstMonthWelcomeMessage(
    category: AchievementCategory, 
    templateTitle: string
  ): string {
    const categoryMessages: Record<AchievementCategory, string> = {
      [AchievementCategory.HABITS]:
        `Welcome to your first monthly challenge! 🎉\n\nWe're starting you with "${templateTitle}" because building consistent habits is the foundation of personal growth. This challenge is designed to be achievable while helping you develop a sustainable routine.`,

      [AchievementCategory.JOURNAL]:
        `Welcome to monthly challenges! ✍️\n\nYour first challenge "${templateTitle}" focuses on journaling - a powerful tool for self-reflection and personal growth. We've made the targets gentle to help you build this valuable habit.`,

      [AchievementCategory.GOALS]:
        `Welcome to your goal-focused challenge! 🎯\n\n"${templateTitle}" will help you develop consistency in working toward your objectives. We've set achievable targets so you can experience success while building momentum.`,

      [AchievementCategory.CONSISTENCY]:
        `Welcome to your comprehensive challenge! 🌟\n\n"${templateTitle}" introduces you to using multiple features of the app consistently. We've made it extra achievable so you can explore and find what works for you.`,

      [AchievementCategory.MASTERY]:
        `Welcome to your mastery journey! 👑\n\nYou're starting with "${templateTitle}" to develop well-rounded habits. This first month focuses on exploration and discovery.`,

      [AchievementCategory.SPECIAL]:
        `Welcome to a special challenge! ✨\n\n"${templateTitle}" is designed specifically for newcomers to provide a unique introduction experience.`
    };

    return categoryMessages[category] || `Welcome to your first monthly challenge: "${templateTitle}"! We're excited to have you on this journey of growth and achievement.`;
  }

  /**
   * Generate category-specific onboarding tips
   */
  private static generateOnboardingTips(category: AchievementCategory): string[] {
    const categoryTips: Record<AchievementCategory, string[]> = {
      [AchievementCategory.HABITS]: [
        '📱 Open the app daily to check your progress',
        '⏰ Set a consistent time each day for habit completion',
        '🎯 Start small - consistency beats intensity',
        '🔄 Use the habit tracking feature to mark completions',
        '🏆 Celebrate small wins along the way'
      ],
      
      [AchievementCategory.JOURNAL]: [
        '📓 Write authentically - there\'s no wrong way to journal',
        '🌅 Try journaling at the same time each day',
        '💭 Focus on your thoughts, feelings, and experiences',
        '📈 Aim for 3+ entries daily for consistency',
        '🎨 Express yourself freely - length doesn\'t matter initially'
      ],
      
      [AchievementCategory.GOALS]: [
        '🎯 Set specific, measurable goals',
        '📊 Track progress daily, even if small',
        '🔍 Break large goals into smaller tasks',
        '✅ Use the goal progress feature regularly',
        '💪 Consistency in small steps leads to big results'
      ],
      
      [AchievementCategory.CONSISTENCY]: [
        '🔄 Try to use all three features (habits, journal, goals) daily',
        '📱 Make app usage part of your daily routine',
        '⚖️ Balance your activities across different areas',
        '📅 Check your progress weekly to stay motivated',
        '🌟 Aim for perfect days but don\'t stress if you miss one'
      ],

      [AchievementCategory.MASTERY]: [
        '🧠 Focus on understanding rather than just completing',
        '📊 Pay attention to your activity balance',
        '🎯 Quality over quantity in all activities',
        '📈 Track your improvement over time',
        '🏅 Mastery comes from consistent practice'
      ],

      [AchievementCategory.SPECIAL]: [
        '✨ This is a unique challenge designed just for you',
        '🎉 Take your time to explore and learn',
        '📱 Familiarize yourself with app features',
        '🎯 Focus on building foundation habits',
        '💫 Enjoy this special introduction experience'
      ]
    };

    return categoryTips[category] || [
      '📱 Open the app daily to stay engaged',
      '🎯 Focus on consistency over perfection',
      '🎉 Celebrate your progress along the way',
      '💪 Build momentum with small daily actions'
    ];
  }

  /**
   * Generate specific progress guidance based on requirements
   */
  private static generateProgressGuidance(requirements: MonthlyChallengeRequirement[]): string[] {
    const guidance: string[] = [];
    
    for (const req of requirements) {
      if (req.type === 'habits') {
        guidance.push(`🎯 Target: ${req.target} habit completions this month (about ${req.dailyTarget || Math.ceil(req.target / 30)} per day)`);
        guidance.push('💡 Tip: Start with 1-2 habits and build consistency before adding more');
      } else if (req.type === 'journal') {
        guidance.push(`📝 Target: ${req.target} journal entries this month (about ${req.dailyTarget || Math.ceil(req.target / 30)} per day)`);
        guidance.push('💡 Tip: Even short entries count - focus on the habit of daily writing');
      } else if (req.type === 'goals') {
        guidance.push(`🎯 Target: ${req.target} days of goal progress this month`);
        guidance.push('💡 Tip: Make progress daily, even if it\'s just updating your goals');
      } else if (req.type === 'consistency') {
        guidance.push(`⭐ Target: ${req.target} consistent activity days this month`);
        guidance.push('💡 Tip: Try to use multiple features each day for maximum consistency');
      }
    }

    // Add general guidance
    guidance.push('📊 Check your progress weekly to stay on track');
    guidance.push('🎉 Remember: This first month is about building the habit, not perfection');
    
    return guidance;
  }

  /**
   * Set appropriate expectations for first-month users
   */
  private static getFirstMonthExpectations(category: AchievementCategory): {
    difficulty: string;
    timeCommitment: string;
    successRate: string;
  } {
    const expectations = {
      [AchievementCategory.HABITS]: {
        difficulty: 'Gentle introduction - focuses on building consistent daily habits',
        timeCommitment: '5-10 minutes daily for habit tracking and completion',
        successRate: '85%+ completion rate expected with consistent daily engagement'
      },
      
      [AchievementCategory.JOURNAL]: {
        difficulty: 'Easy start - emphasizes daily writing practice over length',
        timeCommitment: '10-15 minutes daily for journaling and reflection',
        successRate: '80%+ completion rate with regular daily entries'
      },
      
      [AchievementCategory.GOALS]: {
        difficulty: 'Manageable - focuses on daily goal engagement rather than completion',
        timeCommitment: '5-10 minutes daily for goal planning and progress tracking',
        successRate: '75%+ completion rate with consistent daily goal work'
      },
      
      [AchievementCategory.CONSISTENCY]: {
        difficulty: 'Comprehensive but achievable - introduces all app features gradually',
        timeCommitment: '15-20 minutes daily across habits, journal, and goals',
        successRate: '70%+ completion rate with balanced daily engagement'
      },

      [AchievementCategory.MASTERY]: {
        difficulty: 'Advanced challenges for experienced users',
        timeCommitment: '20-30 minutes daily for comprehensive personal development',
        successRate: '60%+ completion rate for advanced achievement challenges'
      },

      [AchievementCategory.SPECIAL]: {
        difficulty: 'Unique and time-limited challenges',
        timeCommitment: 'Variable based on specific challenge requirements',
        successRate: '65%+ completion rate for special event achievements'
      }
    };

    return expectations[category] || {
      difficulty: 'Balanced monthly challenge',
      timeCommitment: '10-15 minutes daily',
      successRate: '75%+ completion rate expected'
    };
  }

  /**
   * Create conservative first-month requirements for new users
   */
  private static createFirstMonthRequirements(
    template: MonthlyChallengeTemplate,
    starLevel: 1 | 2 | 3 | 4 | 5
  ): MonthlyChallengeRequirement[] {
    const requirements: MonthlyChallengeRequirement[] = [];

    for (const reqTemplate of template.requirementTemplates) {
      const baseTarget = this.getDefaultFallbackForRequirement(reqTemplate.type);
      
      // Extra conservative scaling for first month
      const conservativeMultiplier = 0.7; // 30% reduction from already conservative defaults
      const target = Math.ceil(baseTarget * conservativeMultiplier);

      const firstMonthRequirement: MonthlyChallengeRequirement = {
        ...reqTemplate,
        target: Math.max(target, this.getMinimumFirstMonthTarget(reqTemplate.type)),
        baselineValue: baseTarget,
        scalingMultiplier: conservativeMultiplier,
        dailyTarget: reqTemplate.dailyTarget ? Math.ceil(target / 30) : undefined,
        weeklyTarget: reqTemplate.weeklyTarget ? Math.ceil(target / 4) : undefined,
        description: reqTemplate.description
      };

      requirements.push(firstMonthRequirement);
    }

    return requirements;
  }

  /**
   * Get absolute minimum targets for first-month users to ensure achievability
   */
  private static getMinimumFirstMonthTarget(requirementType: string): number {
    const minimums: Record<string, number> = {
      'habits': 15,        // 15 habit completions/month (very achievable)
      'journal': 20,       // 20 journal entries/month (less than 1/day)
      'goals': 10,         // 10 goal progress days/month (1/3 of days)
      'consistency': 12    // 12 consistency days/month (achievable balance)
    };

    return minimums[requirementType] || 10;
  }

  /**
   * Check if user qualifies for first-month treatment
   */
  static shouldUseFirstMonthTreatment(userBaseline: UserActivityBaseline | null): boolean {
    if (!userBaseline) {
      console.log('🔍 [First Month Check] No baseline → First Month Treatment');
      return true; // No baseline = new user
    }

    const isFirst = userBaseline.isFirstMonth;
    const hasLowActivity = userBaseline.totalActiveDays < 7;
    const isMinimal = userBaseline.dataQuality === 'minimal';

    console.log('🔍 [First Month Check]', {
      isFirstMonth: isFirst,
      totalActiveDays: userBaseline.totalActiveDays,
      dataQuality: userBaseline.dataQuality,
      hasLowActivity,
      isMinimal,
      result: isFirst || hasLowActivity || isMinimal
    });

    // Consider first-month treatment if:
    return (
      isFirst ||                    // Explicitly marked as first month
      hasLowActivity ||            // Less than a week of activity
      isMinimal                    // Very limited data
    );
  }

  // ===============================================
  // INTELLIGENT CATEGORY SELECTION ALGORITHM
  // ===============================================

  /**
   * Select the best challenge category for the month ensuring variety and user engagement
   */
  static selectChallengeCategory(
    userBaseline: UserActivityBaseline | null,
    starRatings: UserChallengeRatings,
    recentCategoryHistory: AchievementCategory[],
    forceCategory?: AchievementCategory
  ): {
    selectedCategory: AchievementCategory;
    selectionReason: string;
    alternativeCategories: AchievementCategory[];
    categoryWeights: CategorySelectionWeights[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // If category is forced (manual generation), use it
    if (forceCategory) {
      return {
        selectedCategory: forceCategory,
        selectionReason: `Manually selected category: ${forceCategory}`,
        alternativeCategories: this.getAvailableCategories().filter(cat => cat !== forceCategory),
        categoryWeights: [],
        warnings: ['Using manually forced category - variety rules bypassed']
      };
    }

    // Get all available categories
    const availableCategories = this.getAvailableCategories();
    
    // Calculate weights for each category
    const categoryWeights = availableCategories.map(category => 
      this.calculateCategoryWeight(category, userBaseline, starRatings, recentCategoryHistory)
    );

    // Sort by final weight (descending)
    categoryWeights.sort((a, b) => b.finalWeight - a.finalWeight);

    // Validate top choice meets minimum requirements
    const topChoice = categoryWeights[0];
    if (!topChoice || topChoice.finalWeight <= 0) {
      warnings.push('All categories have zero weight, falling back to habits category');
      return {
        selectedCategory: AchievementCategory.HABITS,
        selectionReason: 'Fallback to habits due to insufficient data',
        alternativeCategories: availableCategories.filter(cat => cat !== AchievementCategory.HABITS),
        categoryWeights,
        warnings
      };
    }

    // Check for recent usage penalty (avoid same category 2 months in a row)
    const mostRecentCategory = recentCategoryHistory[0];
    if (topChoice.category === mostRecentCategory && topChoice.recentUsagePenalty > 0) {
      // If top choice was used last month, try to select a different one
      const alternativeChoice = categoryWeights.find(weight => 
        weight.category !== mostRecentCategory && weight.finalWeight > 0
      );

      if (alternativeChoice && alternativeChoice.finalWeight >= topChoice.finalWeight * 0.7) {
        warnings.push(`Avoided repeating ${topChoice.category} category from last month`);
        return {
          selectedCategory: alternativeChoice.category,
          selectionReason: `Selected ${alternativeChoice.category} to avoid repetition (weight: ${alternativeChoice.finalWeight.toFixed(2)})`,
          alternativeCategories: categoryWeights
            .filter(w => w.category !== alternativeChoice.category)
            .map(w => w.category),
          categoryWeights,
          warnings
        };
      }
    }

    // Use top weighted choice
    return {
      selectedCategory: topChoice.category,
      selectionReason: `Highest weighted category (weight: ${topChoice.finalWeight.toFixed(2)})`,
      alternativeCategories: categoryWeights.slice(1).map(w => w.category),
      categoryWeights,
      warnings
    };
  }

  /**
   * Calculate selection weight for a category based on multiple factors
   */
  private static calculateCategoryWeight(
    category: AchievementCategory,
    userBaseline: UserActivityBaseline | null,
    starRatings: UserChallengeRatings,
    recentCategoryHistory: AchievementCategory[]
  ): CategorySelectionWeights {
    // Base weight for each category (preference order)
    const baseWeights: Record<AchievementCategory, number> = {
      [AchievementCategory.HABITS]: 100,      // Most fundamental
      [AchievementCategory.JOURNAL]: 95,      // Core self-reflection
      [AchievementCategory.CONSISTENCY]: 90,  // Multi-feature engagement
      [AchievementCategory.GOALS]: 85,        // Achievement-focused
      [AchievementCategory.MASTERY]: 70,      // Advanced users only
      [AchievementCategory.SPECIAL]: 50,      // Event-based
    };

    const baseWeight = baseWeights[category] || 50;
    
    // User engagement multiplier based on their activity in this category
    const engagementMultiplier = this.calculateUserEngagementMultiplier(category, userBaseline);
    
    // Recent usage penalty (heavily penalize categories used in last 2 months)
    const recentUsagePenalty = this.calculateRecentUsagePenalty(category, recentCategoryHistory);
    
    // Star level bonus (prefer categories where user has good but not perfect ratings)
    const starLevelBonus = this.calculateStarLevelBonus(category, starRatings);
    
    // Data quality bonus (prefer categories where we have good baseline data)
    const dataQualityBonus = this.calculateDataQualityBonus(category, userBaseline);
    
    // Calculate final weight
    const finalWeight = Math.max(0, 
      baseWeight * engagementMultiplier * (1 - recentUsagePenalty) + starLevelBonus + dataQualityBonus
    );

    return {
      category,
      baseWeight,
      userEngagementMultiplier: engagementMultiplier,
      recentUsagePenalty,
      starLevelBonus,
      dataQualityBonus,
      finalWeight
    };
  }

  /**
   * Calculate user engagement multiplier for a category based on their historical activity
   */
  private static calculateUserEngagementMultiplier(
    category: AchievementCategory,
    userBaseline: UserActivityBaseline | null
  ): number {
    if (!userBaseline) return 1.0; // Neutral for new users

    // Define engagement metrics for each category
    const engagementMetrics: Record<AchievementCategory, (baseline: UserActivityBaseline) => number> = {
      [AchievementCategory.HABITS]: (b) => 
        (b.totalHabitCompletions * 0.4) + (b.habitConsistencyDays * 0.6),
      
      [AchievementCategory.JOURNAL]: (b) => 
        (b.totalJournalEntries * 0.3) + (b.journalConsistencyDays * 0.5) + (b.avgEntryLength / 50 * 0.2),
      
      [AchievementCategory.GOALS]: (b) => 
        (b.totalGoalProgressDays * 0.6) + (b.goalsCompleted * 10 * 0.4),
      
      [AchievementCategory.CONSISTENCY]: (b) =>
        (b.tripleFeatureDays * 0.4) + (b.perfectDays * 0.4) + (b.totalActiveDays * 0.2),

      [AchievementCategory.MASTERY]: (b) =>
        (b.balanceScore * 50) + (b.longestEngagementStreak * 2),

      [AchievementCategory.SPECIAL]: () => 0  // Event-based, not engagement driven
    };

    const engagementScore = engagementMetrics[category]?.(userBaseline) || 0;
    
    // Convert to multiplier (0.5 to 1.5 range)
    // Higher engagement = higher multiplier, but not overly punishing low engagement
    return 0.5 + Math.min(1.0, engagementScore / 100);
  }

  /**
   * Calculate penalty for recently used categories to ensure variety
   */
  private static calculateRecentUsagePenalty(
    category: AchievementCategory,
    recentCategoryHistory: AchievementCategory[]
  ): number {
    const penalties = [0.8, 0.4, 0.1]; // Last month: 80% penalty, 2 months ago: 40%, 3 months ago: 10%
    
    let totalPenalty = 0;
    for (let i = 0; i < Math.min(recentCategoryHistory.length, penalties.length); i++) {
      if (recentCategoryHistory[i] === category) {
        totalPenalty += penalties[i]!;
      }
    }
    
    return Math.min(0.9, totalPenalty); // Max 90% penalty
  }

  /**
   * Calculate bonus based on user's star level in the category
   */
  private static calculateStarLevelBonus(
    category: AchievementCategory,
    starRatings: UserChallengeRatings
  ): number {
    const categoryKey = category.toLowerCase() as keyof Omit<UserChallengeRatings, 'history' | 'lastUpdated'>;
    const starLevel = (starRatings[categoryKey] || 1) as 1 | 2 | 3 | 4 | 5;
    
    // Prefer categories with 2-4 stars (room for growth but not too easy)
    const starBonus = {
      1: 5,   // New category, slight bonus
      2: 15,  // Good learning opportunity
      3: 10,  // Balanced challenge
      4: 5,   // Getting challenging
      5: 0    // Already mastered, less priority
    };
    
    return starBonus[starLevel as 1 | 2 | 3 | 4 | 5] || 0;
  }

  /**
   * Calculate bonus based on data quality available for the category
   */
  private static calculateDataQualityBonus(
    category: AchievementCategory,
    userBaseline: UserActivityBaseline | null
  ): number {
    if (!userBaseline) return 0;

    // Check if we have sufficient data for this category
    const dataRequirements: Record<AchievementCategory, (baseline: UserActivityBaseline) => boolean> = {
      [AchievementCategory.HABITS]: (b) => b.totalHabitCompletions >= 10 && b.habitConsistencyDays >= 5,
      [AchievementCategory.JOURNAL]: (b) => b.totalJournalEntries >= 20 && b.journalConsistencyDays >= 7,
      [AchievementCategory.GOALS]: (b) => b.totalGoalProgressDays >= 5 && b.goalsCompleted >= 1,
      [AchievementCategory.CONSISTENCY]: (b) => b.totalActiveDays >= 15 && b.tripleFeatureDays >= 3,
      [AchievementCategory.MASTERY]: (b) => b.totalActiveDays >= 25 && b.balanceScore > 0.5,
      [AchievementCategory.SPECIAL]: () => true,     // Always available
    };

    const hasGoodData = dataRequirements[category]?.(userBaseline) || false;
    return hasGoodData ? 10 : -5; // Bonus for good data, small penalty for poor data
  }

  /**
   * Get list of categories that are currently available for selection
   */
  private static getAvailableCategories(): AchievementCategory[] {
    return [
      AchievementCategory.HABITS,
      AchievementCategory.JOURNAL,
      AchievementCategory.GOALS,
      AchievementCategory.CONSISTENCY
      // Note: MASTERY, SOCIAL, SPECIAL will be added when templates are implemented
    ];
  }

  /**
   * Select template within chosen category based on user star level and data quality
   */
  static selectTemplateForCategory(
    category: AchievementCategory,
    userBaseline: UserActivityBaseline | null,
    starLevel: 1 | 2 | 3 | 4 | 5,
    previousTemplateIds: string[] = []
  ): {
    selectedTemplate: MonthlyChallengeTemplate;
    selectionReason: string;
    alternativeTemplates: MonthlyChallengeTemplate[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    const categoryTemplates = this.getTemplatesForCategory(category);
    
    if (categoryTemplates.length === 0) {
      throw new Error(`No templates available for category: ${category}`);
    }

    // Filter out recently used templates (avoid same template within 6 months)
    const availableTemplates = categoryTemplates.filter(template => 
      !previousTemplateIds.includes(template.id)
    );

    const templatePool = availableTemplates.length > 0 ? availableTemplates : categoryTemplates;
    
    if (availableTemplates.length === 0) {
      warnings.push('All templates recently used, allowing repeats');
    }

    // Filter templates suitable for user's star level and data quality
    const suitableTemplates = templatePool.filter(template => {
      const meetsMinLevel = starLevel >= template.starLevelRequirements.minLevel;
      const hasDataQuality = !userBaseline || 
        template.starLevelRequirements.preferredDataQuality.includes(userBaseline.dataQuality);
      
      return meetsMinLevel && hasDataQuality;
    });

    // If no suitable templates, relax data quality requirements
    const finalTemplatePool = suitableTemplates.length > 0 ? suitableTemplates : 
      templatePool.filter(t => starLevel >= t.starLevelRequirements.minLevel);

    if (finalTemplatePool.length === 0) {
      warnings.push('No templates meet star level requirements, using lowest difficulty template');
      const fallbackTemplate = templatePool.reduce((min, template) => 
        template.starLevelRequirements.minLevel < min.starLevelRequirements.minLevel ? template : min
      );
      
      return {
        selectedTemplate: fallbackTemplate,
        selectionReason: 'Fallback template due to insufficient star level',
        alternativeTemplates: templatePool.filter(t => t.id !== fallbackTemplate.id),
        warnings
      };
    }

    // ===============================================
    // WEIGHTED RANDOM SELECTION WITH ANTI-REPEAT
    // ===============================================
    // Priority acts as weight, but adds randomness to ensure variety
    // Higher priority = higher chance, but not guaranteed selection
    // Like drawing cards from a deck where some cards are duplicated based on priority

    const currentMonth = new Date().getMonth() + 1; // 1-12
    const monthString = currentMonth.toString().padStart(2, '0');

    // Calculate weighted scores for each template
    const weightedTemplates = finalTemplatePool.map(template => {
      let weight = template.priority; // Base weight from priority (65-100)

      // Seasonal bonus: +30 weight for seasonal templates (significant boost)
      if (template.seasonality?.includes(monthString)) {
        weight += 30;
      }

      // Anti-repeat penalty: -40 weight if recently used (strong discouragement)
      if (previousTemplateIds.includes(template.id)) {
        weight -= 40;
      }

      // Add random variance (±20 points) to introduce unpredictability
      // This ensures variety while still respecting priority
      const randomVariance = (Math.random() - 0.5) * 40; // Range: -20 to +20
      const finalWeight = Math.max(0, weight + randomVariance);

      return {
        template,
        weight: finalWeight,
        baseWeight: weight,
        randomVariance,
        isSeasonal: template.seasonality?.includes(monthString) || false,
        wasRecentlyUsed: previousTemplateIds.includes(template.id)
      };
    });

    // Sort by final weight (highest to lowest)
    weightedTemplates.sort((a, b) => b.weight - a.weight);

    // Select the template with highest weighted score
    const selectedWeighted = weightedTemplates[0]!; // Array is never empty due to validation above
    const finalSelection = selectedWeighted.template;

    // Build detailed selection reason
    let selectionReason = `Weighted random selection (weight: ${Math.round(selectedWeighted.weight)})`;
    const reasonParts: string[] = [];

    if (selectedWeighted.isSeasonal) {
      reasonParts.push('seasonal bonus +30');
    }
    if (selectedWeighted.wasRecentlyUsed) {
      reasonParts.push('repeat penalty -40');
    }
    reasonParts.push(`random variance ${selectedWeighted.randomVariance >= 0 ? '+' : ''}${Math.round(selectedWeighted.randomVariance)}`);

    if (reasonParts.length > 0) {
      selectionReason += ` (${reasonParts.join(', ')})`;
    }

    // Log selection details for debugging
    console.log('🎲 Template selection weights:', weightedTemplates.map(w => ({
      id: w.template.id,
      priority: w.template.priority,
      finalWeight: Math.round(w.weight),
      seasonal: w.isSeasonal,
      recent: w.wasRecentlyUsed
    })));

    return {
      selectedTemplate: finalSelection,
      selectionReason,
      alternativeTemplates: templatePool.filter(t => t.id !== finalSelection.id),
      warnings
    };
  }

  // ===============================================
  // CHALLENGE GENERATION ENGINE & SCHEDULING
  // ===============================================

  /**
   * Generate a personalized monthly challenge based on user baseline and star ratings
   */
  static async generateMonthlyChallenge(context: MonthlyChallengeGenerationContext): Promise<MonthlyChallengeGenerationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const alternatives: string[] = [];

    try {
      // Check if user qualifies for first-month treatment
      if (context.isFirstMonth || this.shouldUseFirstMonthTreatment(context.userBaseline)) {
        const firstMonthResult = this.generateFirstMonthChallenge(context.forceCategory, context.userId);

        // Save first month challenge to storage if not dry run
        if (!context.dryRun) {
          console.log('📝 [MonthlyChallengeService] Saving FIRST MONTH challenge:', firstMonthResult.challenge.id);
          await this.saveGeneratedChallenge(firstMonthResult.challenge);
          console.log('📝 [MonthlyChallengeService] First month challenge saved, now updating history');
          await this.updateChallengeHistory(context.userId, firstMonthResult.challenge);
          console.log('📝 [MonthlyChallengeService] First month history updated successfully');
        }

        return {
          challenge: firstMonthResult.challenge,
          generationMetadata: {
            selectedTemplate: 'first_month_special',
            appliedStarLevel: 1,
            baselineUsed: 0,
            scalingApplied: 0.7,
            alternativesConsidered: ['first_month_onboarding'],
            generationTimeMs: Date.now() - startTime,
            warnings: ['First month challenge generated with beginner-friendly settings']
          },
          success: true
        };
      }

      // Get user star ratings
      const starRatings = await this.getUserStarRatings();

      // Select challenge category
      const categorySelection = this.selectChallengeCategory(
        context.userBaseline,
        starRatings,
        context.recentCategoryHistory,
        context.forceCategory
      );
      warnings.push(...categorySelection.warnings);
      alternatives.push(...categorySelection.alternativeCategories.map(cat => `category:${cat}`));

      // Get star level for selected category using StarRatingService
      const currentRatings = await StarRatingService.getCurrentStarRatings();
      const categoryKey = categorySelection.selectedCategory.toLowerCase() as keyof Omit<UserChallengeRatings, 'history' | 'lastUpdated'>;
      const starLevel = (currentRatings[categoryKey] || 1) as 1 | 2 | 3 | 4 | 5;

      // Select template within category
      const templateSelection = this.selectTemplateForCategory(
        categorySelection.selectedCategory,
        context.userBaseline,
        starLevel,
        await this.getRecentTemplateIds(context.userId, 6) // Avoid templates used in last 6 months
      );
      warnings.push(...templateSelection.warnings);
      alternatives.push(...templateSelection.alternativeTemplates.map(t => `template:${t.id}`));

      // Generate challenge parameters
      const challengeParams = this.generateChallengeParameters(
        templateSelection.selectedTemplate,
        context.userBaseline,
        starLevel,
        context.isFirstMonth,
        context.month
      );
      warnings.push(...challengeParams.generationWarnings);

      // Create the monthly challenge object
      const challenge = this.createMonthlyChallengeObject(
        templateSelection.selectedTemplate,
        challengeParams,
        categorySelection.selectedCategory,
        starLevel,
        context
      );

      // Save challenge to storage if not dry run
      if (!context.dryRun) {
        console.log('📝 [MonthlyChallengeService] Saving generated challenge:', challenge.id);
        await this.saveGeneratedChallenge(challenge);
        console.log('📝 [MonthlyChallengeService] Challenge saved, now updating history');
        await this.updateChallengeHistory(context.userId, challenge);
        console.log('📝 [MonthlyChallengeService] History updated successfully');
      } else {
        console.log('⏭️  [MonthlyChallengeService] Skipping save (dry run mode)');
      }

      return {
        challenge,
        generationMetadata: {
          selectedTemplate: templateSelection.selectedTemplate.id,
          appliedStarLevel: starLevel,
          baselineUsed: context.userBaseline ? 
            this.extractBaselineMetric(templateSelection.selectedTemplate.baselineMetricKey, context.userBaseline) : 0,
          scalingApplied: challengeParams.requirements[0]?.scalingMultiplier || 1.0,
          alternativesConsidered: alternatives,
          generationTimeMs: Date.now() - startTime,
          warnings
        },
        success: true
      };

    } catch (error) {
      console.error('Challenge generation failed:', error);
      
      return {
        challenge: await this.generateFallbackChallenge(context.userId, context.month),
        generationMetadata: {
          selectedTemplate: 'fallback_challenge',
          appliedStarLevel: 1,
          baselineUsed: 0,
          scalingApplied: 1.0,
          alternativesConsidered: [],
          generationTimeMs: Date.now() - startTime,
          warnings: [`Generation failed: ${error}`, 'Using fallback challenge']
        },
        success: false,
        error: `Challenge generation failed: ${error}`
      };
    }
  }

  /**
   * Create the actual monthly challenge object from generated parameters
   */
  private static createMonthlyChallengeObject(
    template: MonthlyChallengeTemplate,
    params: ReturnType<typeof MonthlyChallengeService.generateChallengeParameters>,
    category: AchievementCategory,
    starLevel: 1 | 2 | 3 | 4 | 5,
    context: MonthlyChallengeGenerationContext
  ): MonthlyChallenge {
    // CRITICAL: Use UTC methods to avoid timezone issues
    const monthDate = parseDate(context.month + '-01');
    const startDate = parseDate(context.month + '-01');
    startDate.setUTCDate(1);
    const startDateStr = formatDateToString(startDate);

    const endDate = parseDate(context.month + '-01');
    endDate.setUTCMonth(endDate.getUTCMonth() + 1, 0);
    const endDateStr = formatDateToString(endDate);

    return {
      id: generateUUID(),
      title: template.title,
      description: template.id === 'journal_consistency_writer'
        ? `Journal every single day with ${starLevel} ${starLevel === 1 ? 'entry' : 'entries'} per day to build an unbreakable habit`
        : template.description,
      startDate: startDateStr,
      endDate: endDateStr,
      baseXPReward: params.xpReward,
      starLevel,
      category,
      requirements: params.requirements,
      userBaselineSnapshot: {
        month: context.month,
        analysisStartDate: context.userBaseline?.analysisStartDate || startDateStr,
        analysisEndDate: context.userBaseline?.analysisEndDate || endDateStr,
        dataQuality: context.userBaseline?.dataQuality || 'minimal',
        totalActiveDays: context.userBaseline?.totalActiveDays || 0
      },
      scalingFormula: `baseline * ${params.requirements[0]?.scalingMultiplier || 1.0}`,
      isActive: true,
      generationReason: context.isFirstMonth ? 'first_month' : 'scheduled',
      categoryRotation: [...context.recentCategoryHistory, category].slice(-3),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Save generated challenge to storage
   */
  private static async saveGeneratedChallenge(challenge: MonthlyChallenge): Promise<void> {
    try {
      console.log('💾 [saveGeneratedChallenge] Starting save...', {
        challengeId: challenge.id,
        USE_SQLITE: FEATURE_FLAGS.USE_SQLITE_CHALLENGES,
        hasStorage: !!this.storage
      });

      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        console.log('💾 [saveGeneratedChallenge] Using SQLite storage');
        await this.storage.saveActiveChallenge(challenge);
        console.log('💾 [saveGeneratedChallenge] SQLite save completed');
        return;
      }

      console.log('💾 [saveGeneratedChallenge] Using AsyncStorage fallback');
      // Fallback to AsyncStorage
      const existingChallenges = await this.getAllStoredChallenges();
      const updatedChallenges = existingChallenges.filter(c => c.id !== challenge.id);
      updatedChallenges.push(challenge);

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedChallenges));
      console.log('💾 [saveGeneratedChallenge] AsyncStorage save completed');
    } catch (error) {
      console.error('❌ [saveGeneratedChallenge] Failed to save generated challenge:', error);
      throw error;
    }
  }

  /**
   * Update challenge history for category rotation tracking
   */
  private static async updateChallengeHistory(userId: string, challenge: MonthlyChallenge): Promise<void> {
    try {
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        await this.storage.archiveChallenge(challenge);
        return;
      }

      // Fallback to AsyncStorage
      const historyKey = `${this.STORAGE_KEY}_history_${userId}`;
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      history.unshift({
        month: challenge.userBaselineSnapshot?.month || challenge.month,
        category: challenge.category,
        templateId: challenge.id,
        starLevel: challenge.starLevel,
        generatedAt: challenge.createdAt
      });

      // Keep only last 12 months
      const trimmedHistory = history.slice(0, 12);

      await AsyncStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Failed to update challenge history:', error);
    }
  }

  /**
   * Get recent template IDs to avoid repetition
   */
  private static async getRecentTemplateIds(userId: string, months: number): Promise<string[]> {
    try {
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        const history = await this.storage.getChallengeHistory(months);
        return history.map(h => h.metadata?.templateId || h.id).filter(Boolean);
      }

      // Fallback to AsyncStorage
      const historyKey = `${this.STORAGE_KEY}_history_${userId}`;
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      return history.slice(0, months).map((h: any) => h.templateId).filter(Boolean);
    } catch (error) {
      console.error('Failed to get recent template IDs:', error);
      return [];
    }
  }

  /**
   * Generate fallback challenge when main generation fails
   */
  private static async generateFallbackChallenge(userId: string, month: string): Promise<MonthlyChallenge> {
    const template = this.HABITS_TEMPLATES[0]; // Use first habits template as fallback
    if (!template) {
      throw new Error('No fallback template available');
    }
    const requirements = this.createFirstMonthRequirements(template, 1);

    // CRITICAL: Use UTC methods to avoid timezone issues
    const startDate = parseDate(month + '-01');
    startDate.setUTCDate(1);
    const startDateStr = formatDateToString(startDate);

    const endDate = parseDate(month + '-01');
    endDate.setUTCMonth(endDate.getUTCMonth() + 1, 0);
    const endDateStr = formatDateToString(endDate);

    return {
      id: generateUUID(),
      title: `🔧 Fallback: ${template!.title}`,
      description: `${template!.description}\n\n⚠️ This is a simplified challenge due to generation issues.`,
      startDate: startDateStr,
      endDate: endDateStr,
      baseXPReward: 300,
      starLevel: 1,
      category: AchievementCategory.HABITS,
      requirements,
      userBaselineSnapshot: {
        month,
        analysisStartDate: startDateStr,
        analysisEndDate: endDateStr,
        dataQuality: 'minimal',
        totalActiveDays: 0
      },
      scalingFormula: 'fallback_conservative',
      isActive: true,
      generationReason: 'retry',
      categoryRotation: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Automatic monthly challenge generation trigger - call this on 1st of each month
   */
  static async generateChallengeForCurrentMonth(userId: string = 'local_user'): Promise<MonthlyChallengeGenerationResult> {
    const currentMonth = formatDateToString(new Date()).substring(0, 7); // YYYY-MM
    
    // Check if challenge already exists for this month
    const existingChallenge = await this.getChallengeForMonth(currentMonth);
    if (existingChallenge) {
      return {
        challenge: existingChallenge,
        generationMetadata: {
          selectedTemplate: existingChallenge.id,
          appliedStarLevel: existingChallenge.starLevel,
          baselineUsed: 0,
          scalingApplied: 1.0,
          alternativesConsidered: [],
          generationTimeMs: 0,
          warnings: ['Challenge already exists for this month']
        },
        success: true
      };
    }

    // Get user baseline
    const userBaseline = await UserActivityTracker.calculateMonthlyBaseline({
      userId,
      cacheResults: true
    });

    // Get recent category history
    const recentCategories = await this.getRecentCategoryHistory(userId, 3);

    // Create generation context
    const context: MonthlyChallengeGenerationContext = {
      month: currentMonth,
      userId,
      userBaseline,
      currentStarRatings: await this.getUserStarRatings(),
      recentCategoryHistory: recentCategories,
      isFirstMonth: this.shouldUseFirstMonthTreatment(userBaseline),
      dryRun: false
    };

    return await this.generateMonthlyChallenge(context);
  }

  /**
   * Get recent category history for variety enforcement
   */
  private static async getRecentCategoryHistory(userId: string, months: number): Promise<AchievementCategory[]> {
    try {
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        const history = await this.storage.getChallengeHistory(months);
        return history.map(h => h.category).filter(Boolean);
      }

      // Fallback to AsyncStorage
      const historyKey = `${this.STORAGE_KEY}_history_${userId}`;
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      return history.slice(0, months).map((h: any) => h.category).filter(Boolean);
    } catch (error) {
      console.error('Failed to get recent category history:', error);
      return [];
    }
  }

  /**
   * Background challenge generation check - should be called daily
   */
  static async checkAndGenerateMonthlyChallenges(): Promise<{
    challengeGenerated: boolean;
    month: string;
    result?: MonthlyChallengeGenerationResult;
    error?: string;
  }> {
    try {
      const todayDate = new Date();
      const currentMonth = today().substring(0, 7);
      
      // Only generate on the 1st of the month
      if (todayDate.getDate() !== 1) {
        return {
          challengeGenerated: false,
          month: currentMonth
        };
      }

      const result = await this.generateChallengeForCurrentMonth();
      
      return {
        challengeGenerated: true,
        month: currentMonth,
        result
      };
    } catch (error) {
      console.error('Background challenge generation failed:', error);
      return {
        challengeGenerated: false,
        month: formatDateToString(new Date()).substring(0, 7),
        error: `${error}`
      };
    }
  }

  // ===============================================
  // CHALLENGE STORAGE AND RETRIEVAL
  // ===============================================

  /**
   * Get current active monthly challenge
   */
  static async getCurrentChallenge(): Promise<MonthlyChallenge | null> {
    try {
      const currentMonth = formatDateToString(new Date()).substring(0, 7);
      return await this.getChallengeForMonth(currentMonth);
    } catch (error) {
      console.error('Failed to get current challenge:', error);
      return null;
    }
  }

  /**
   * Get challenge for a specific month
   */
  static async getChallengeForMonth(month: string): Promise<MonthlyChallenge | null> {
    try {
      const allChallenges = await this.getAllStoredChallenges();
      return allChallenges.find(challenge =>
        challenge.userBaselineSnapshot.month === month && challenge.isActive
      ) || null;
    } catch (error) {
      console.error(`Failed to get challenge for month ${month}:`, error);
      return null;
    }
  }

  /**
   * Get challenge for a specific month, including completed/inactive challenges
   */
  static async getChallengeForMonthIncludingCompleted(month: string): Promise<MonthlyChallenge | null> {
    try {
      const allChallenges = await this.getAllStoredChallenges();
      return allChallenges.find(challenge =>
        challenge.userBaselineSnapshot.month === month
      ) || null;
    } catch (error) {
      console.error(`Failed to get challenge (including completed) for month ${month}:`, error);
      return null;
    }
  }

  /**
   * Get all stored challenges
   */
  private static async getAllStoredChallenges(): Promise<MonthlyChallenge[]> {
    try {
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        return await this.storage.getActiveChallenges();
      }

      // Fallback to AsyncStorage
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored challenges:', error);
      return [];
    }
  }

  /**
   * Archive completed challenge and prepare for next month
   */
  static async archiveCompletedChallenge(challengeId: string): Promise<void> {
    try {
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        await this.storage.updateChallengeStatus(challengeId, 'completed');
        const challenges = await this.storage.getActiveChallenges();
        const challenge = challenges.find(c => c.id === challengeId);
        if (challenge) {
          await this.storage.archiveChallenge(challenge);
        }
        return;
      }

      // Fallback to AsyncStorage
      const allChallenges = await this.getAllStoredChallenges();
      const updatedChallenges = allChallenges.map(challenge =>
        challenge.id === challengeId
          ? { ...challenge, isActive: false, updatedAt: new Date() }
          : challenge
      );

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedChallenges));
    } catch (error) {
      console.error('Failed to archive completed challenge:', error);
      throw error;
    }
  }

  /**
   * Get challenge progress for current month
   * TODO: Implement in next phase
   */
  static async getChallengeProgress(challengeId: string): Promise<MonthlyChallengeProgress | null> {
    throw new Error('Not yet implemented');
  }
}