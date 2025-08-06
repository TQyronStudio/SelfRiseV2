// Weekly Challenge Service - Dynamic challenge generation and management
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { 
  WeeklyChallenge, 
  ChallengeRequirement, 
  ChallengeProgress,
  XPSourceType,
  AchievementCategory 
} from '../types/gamification';
import { DateString } from '../types/common';
import { formatDateToString, today, addDays, startOfWeek, endOfWeek, parseDate } from '../utils/date';
import { GamificationService } from './gamificationService';

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  ACTIVE_CHALLENGES: 'weekly_challenges_active',
  CHALLENGE_PROGRESS: 'weekly_challenges_progress', 
  CHALLENGE_HISTORY: 'weekly_challenges_history',
  USER_LEVEL_CACHE: 'weekly_challenges_user_level_cache',
  CHALLENGE_GENERATION_DATA: 'weekly_challenges_generation_data',
} as const;

// Challenge difficulty scaling based on user level
interface DifficultyScaling {
  level: number;
  difficultyMultiplier: number;
  complexityBonus: number;
  xpRewardMultiplier: number;
}

// Challenge template for generating challenges
interface ChallengeTemplate {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  requirements: Omit<ChallengeRequirement, 'target'>[];
  baseTargets: number[];
  difficultyLevels: DifficultyScaling[];
  minLevel: number;
  xpRewardBase: number;
  tags: string[];
}

// User activity profile for challenge personalization
interface UserActivityProfile {
  habitCompletionRate: number;
  journalEntryFrequency: number;
  goalProgressFrequency: number;
  preferredCategory: AchievementCategory;
  currentLevel: number;
  weeklyEngagementScore: number;
  lastChallengeCompletionDate?: DateString;
}

// Challenge completion result
interface ChallengeCompletionResult {
  challengeId: string;
  completed: boolean;
  xpEarned: number;
  completedAt: Date;
  achievementUnlocked?: string;
  celebrationLevel: 'normal' | 'milestone' | 'epic';
}

/**
 * Weekly Challenge Service
 * Generates personalized weekly challenges based on user behavior and level
 */
export class WeeklyChallengeService {
  
  // ========================================
  // CHALLENGE GENERATION SYSTEM
  // ========================================

  /**
   * Generate weekly challenges for the current week
   */
  static async generateWeeklyChallenge(): Promise<WeeklyChallenge[]> {
    try {
      console.log('🎯 Starting weekly challenge generation...');
      
      // Get user activity profile for personalization
      const userProfile = await this.getUserActivityProfile();
      console.log(`📊 User profile: Level ${userProfile.currentLevel}, preferred category: ${userProfile.preferredCategory}`);
      
      // Check if challenges already exist for this week
      const existingChallenges = await this.getActiveChallenges();
      if (existingChallenges.length > 0) {
        console.log(`✅ Found ${existingChallenges.length} existing challenges for this week`);
        return existingChallenges;
      }
      
      // Generate 2-3 challenges based on user profile
      const challengeCount = this.determineChallengeCount(userProfile);
      const challenges: WeeklyChallenge[] = [];
      
      // Get appropriate challenge templates
      const availableTemplates = await this.getAvailableTemplates(userProfile);
      const selectedTemplates = this.selectChallengeTemplates(availableTemplates, challengeCount, userProfile);
      
      console.log(`🎲 Selected ${selectedTemplates.length} challenge templates`);
      
      // Generate challenges from templates
      for (let i = 0; i < selectedTemplates.length; i++) {
        const template = selectedTemplates[i];
        if (template) {
          const challenge = await this.generateChallengeFromTemplate(template, userProfile, i + 1);
          challenges.push(challenge);
          console.log(`✨ Generated challenge: "${challenge.title}" (${challenge.category}, difficulty ${challenge.difficultyLevel})`);
        }
      }
      
      // Store generated challenges
      await this.storeActiveChallenges(challenges);
      
      // Initialize progress tracking
      for (const challenge of challenges) {
        await this.initializeChallengeProgress(challenge.id);
      }
      
      // Trigger challenge generation event
      DeviceEventEmitter.emit('weeklyChallengesGenerated', {
        challenges,
        weekStart: startOfWeek(new Date()),
        weekEnd: endOfWeek(new Date()),
        timestamp: Date.now()
      });
      
      console.log(`🎉 Generated ${challenges.length} weekly challenges successfully`);
      return challenges;
      
    } catch (error) {
      console.error('WeeklyChallengeService.generateWeeklyChallenge error:', error);
      return [];
    }
  }

  /**
   * Get user activity profile for challenge personalization
   */
  private static async getUserActivityProfile(): Promise<UserActivityProfile> {
    try {
      // Get current gamification stats
      const stats = await GamificationService.getGamificationStats();
      
      // Analyze habit completion patterns (last 7 days)
      const habitCompletionRate = await this.calculateHabitCompletionRate();
      
      // Analyze journal entry frequency
      const journalEntryFrequency = await this.calculateJournalFrequency();
      
      // Analyze goal progress frequency  
      const goalProgressFrequency = await this.calculateGoalProgressFrequency();
      
      // Determine preferred category based on XP distribution
      const preferredCategory = this.determinePreferredCategory(stats.xpBySource);
      
      // Calculate weekly engagement score
      const weeklyEngagementScore = this.calculateWeeklyEngagementScore(
        habitCompletionRate,
        journalEntryFrequency, 
        goalProgressFrequency
      );
      
      const lastCompletionDate = await this.getLastChallengeCompletionDate();
      return {
        habitCompletionRate,
        journalEntryFrequency,
        goalProgressFrequency,
        preferredCategory,
        currentLevel: stats.currentLevel,
        weeklyEngagementScore,
        lastChallengeCompletionDate: lastCompletionDate || ''
      };
      
    } catch (error) {
      console.error('WeeklyChallengeService.getUserActivityProfile error:', error);
      // Return safe defaults
      return {
        habitCompletionRate: 0.5,
        journalEntryFrequency: 0.6,
        goalProgressFrequency: 0.4,
        preferredCategory: AchievementCategory.HABITS,
        currentLevel: 1,
        weeklyEngagementScore: 0.5,
        lastChallengeCompletionDate: ''
      };
    }
  }

  /**
   * Calculate habit completion rate over last 7 days
   */
  private static async calculateHabitCompletionRate(): Promise<number> {
    try {
      // Import HabitStorage to access habit data
      const { HabitStorage } = await import('./storage/habitStorage');
      
      // Get habit completion statistics for last 7 days
      const HabitStorageWithStats = HabitStorage as any;
      const completionStats = HabitStorageWithStats.getHabitCompletionStats ? 
        await HabitStorageWithStats.getHabitCompletionStats(7) :
        { totalScheduled: 0, completed: 0 };
      
      if (completionStats.totalScheduled === 0) return 0;
      
      return completionStats.completed / completionStats.totalScheduled;
      
    } catch (error) {
      console.error('WeeklyChallengeService.calculateHabitCompletionRate error:', error);
      return 0.5; // Default to 50%
    }
  }

  /**
   * Calculate journal entry frequency over last 7 days
   */
  private static async calculateJournalFrequency(): Promise<number> {
    try {
      // Import GratitudeStorage to access journal data  
      const { GratitudeStorage } = await import('./storage/gratitudeStorage');
      
      // Get journal entries for last 7 days
      const GratitudeStorageWithRange = GratitudeStorage as any;
      const entries = GratitudeStorageWithRange.getEntriesInRange ?
        await GratitudeStorageWithRange.getEntriesInRange(
          addDays(new Date(), -7),
          new Date()
        ) : [];
      
      // Calculate average entries per day (target is 3+ per day)
      const entriesPerDay = entries.length / 7;
      const frequency = Math.min(1, entriesPerDay / 3); // Normalize to 0-1
      
      return frequency;
      
    } catch (error) {
      console.error('WeeklyChallengeService.calculateJournalFrequency error:', error);
      return 0.6; // Default to 60%
    }
  }

  /**
   * Calculate goal progress frequency over last 7 days
   */
  private static async calculateGoalProgressFrequency(): Promise<number> {
    try {
      // Import GoalStorage to access goal data
      const { GoalStorage } = await import('./storage/goalStorage');
      
      // Get goals and analyze progress frequency
      const GoalStorageWithGoals = GoalStorage as any;
      const goals = GoalStorageWithGoals.getAllGoals ? await GoalStorageWithGoals.getAllGoals() : [];
      const activeGoals = goals.filter((goal: any) => goal.status === 'active');
      
      if (activeGoals.length === 0) return 0;
      
      // Count days with goal progress in last 7 days
      let daysWithProgress = 0;
      for (let i = 0; i < 7; i++) {
        const date = addDays(new Date(), -i);
        const dateStr = typeof date === 'string' ? date : formatDateToString(date);
        
        const hasProgress = activeGoals.some((goal: any) => 
          goal.progressEntries?.some((entry: any) => entry.date === dateStr)
        );
        
        if (hasProgress) daysWithProgress++;
      }
      
      return daysWithProgress / 7;
      
    } catch (error) {
      console.error('WeeklyChallengeService.calculateGoalProgressFrequency error:', error);
      return 0.4; // Default to 40%
    }
  }

  /**
   * Determine preferred category based on XP distribution
   */
  private static determinePreferredCategory(xpBySource: Record<XPSourceType, number>): AchievementCategory {
    const categoryXP = {
      [AchievementCategory.HABITS]: 
        xpBySource[XPSourceType.HABIT_COMPLETION] + 
        xpBySource[XPSourceType.HABIT_BONUS] +
        xpBySource[XPSourceType.HABIT_STREAK_MILESTONE],
      [AchievementCategory.JOURNAL]: 
        xpBySource[XPSourceType.JOURNAL_ENTRY] + 
        xpBySource[XPSourceType.JOURNAL_BONUS] +
        xpBySource[XPSourceType.JOURNAL_STREAK_MILESTONE] +
        xpBySource[XPSourceType.JOURNAL_BONUS_MILESTONE],
      [AchievementCategory.GOALS]: 
        xpBySource[XPSourceType.GOAL_PROGRESS] + 
        xpBySource[XPSourceType.GOAL_COMPLETION] +
        xpBySource[XPSourceType.GOAL_MILESTONE],
      [AchievementCategory.CONSISTENCY]: 0, // Will be calculated separately
      [AchievementCategory.MASTERY]: 0, // Will be calculated separately
      [AchievementCategory.SOCIAL]: 0, // Future feature
      [AchievementCategory.SPECIAL]: 0, // Special events only
    };

    // Find category with highest XP
    let maxXP = 0;
    let preferredCategory = AchievementCategory.HABITS;
    
    for (const [category, xp] of Object.entries(categoryXP)) {
      if (xp > maxXP) {
        maxXP = xp;
        preferredCategory = category as AchievementCategory;
      }
    }
    
    return preferredCategory;
  }

  /**
   * Calculate weekly engagement score (0-1)
   */
  private static calculateWeeklyEngagementScore(
    habitRate: number,
    journalFreq: number,
    goalFreq: number
  ): number {
    // Weighted average with emphasis on consistency
    const weights = { habit: 0.4, journal: 0.35, goal: 0.25 };
    
    return (
      habitRate * weights.habit +
      journalFreq * weights.journal +
      goalFreq * weights.goal
    );
  }

  /**
   * Get last challenge completion date
   */
  private static async getLastChallengeCompletionDate(): Promise<DateString | undefined> {
    try {
      const history = await this.getChallengeHistory();
      const completedChallenges = history.filter(c => c.completed);
      
      if (completedChallenges.length === 0) return undefined;
      
      // Sort by completion date and get most recent
      completedChallenges.sort((a, b) => 
        new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
      );
      
      const mostRecent = completedChallenges[0];
      return mostRecent.completedAt ? formatDateToString(new Date(mostRecent.completedAt)) : undefined;
      
    } catch (error) {
      console.error('WeeklyChallengeService.getLastChallengeCompletionDate error:', error);
      return undefined;
    }
  }

  /**
   * Determine number of challenges to generate based on user profile
   */
  private static determineChallengeCount(profile: UserActivityProfile): number {
    // Beginners get fewer challenges, advanced users get more
    if (profile.currentLevel <= 5) return 2;
    if (profile.currentLevel <= 15) return 2; 
    if (profile.currentLevel <= 30) return 3;
    return 3; // Max 3 challenges per week
  }

  // ========================================
  // CHALLENGE TEMPLATE SYSTEM
  // ========================================

  /**
   * Get available challenge templates based on user profile
   */
  private static async getAvailableTemplates(profile: UserActivityProfile): Promise<ChallengeTemplate[]> {
    const allTemplates = this.getAllChallengeTemplates();
    
    // Filter templates by minimum level requirement
    const availableTemplates = allTemplates.filter(template => 
      template.minLevel <= profile.currentLevel
    );
    
    console.log(`📋 ${availableTemplates.length} templates available for level ${profile.currentLevel}`);
    return availableTemplates;
  }

  /**
   * Select specific challenge templates based on user preferences
   */
  private static selectChallengeTemplates(
    templates: ChallengeTemplate[],
    count: number,
    profile: UserActivityProfile
  ): ChallengeTemplate[] {
    const selected: ChallengeTemplate[] = [];
    const usedCategories = new Set<AchievementCategory>();
    
    // Always include one challenge from preferred category
    const preferredTemplates = templates.filter(t => t.category === profile.preferredCategory);
    if (preferredTemplates.length > 0) {
      const randomPreferred = preferredTemplates[Math.floor(Math.random() * preferredTemplates.length)];
      if (randomPreferred) {
        selected.push(randomPreferred);
        usedCategories.add(randomPreferred.category);
      }
    }
    
    // Fill remaining slots with diverse categories
    const remainingTemplates = templates.filter(t => 
      !usedCategories.has(t.category) && !selected.includes(t)
    );
    
    while (selected.length < count && remainingTemplates.length > 0) {
      // Weighted selection based on user engagement
      const weights = this.calculateTemplateWeights(remainingTemplates, profile);
      const selectedTemplate = this.weightedRandomSelection(remainingTemplates, weights);
      
      if (selectedTemplate && !selected.includes(selectedTemplate)) {
        selected.push(selectedTemplate);
        usedCategories.add(selectedTemplate.category);
        
        // Remove template from remaining
        const index = remainingTemplates.indexOf(selectedTemplate);
        remainingTemplates.splice(index, 1);
      }
    }
    
    return selected;
  }

  /**
   * Calculate template selection weights based on user profile
   */
  private static calculateTemplateWeights(
    templates: ChallengeTemplate[],
    profile: UserActivityProfile
  ): number[] {
    return templates.map(template => {
      let weight = 1.0; // Base weight
      
      // Boost preferred category
      if (template.category === profile.preferredCategory) {
        weight *= 2.0;
      }
      
      // Adjust based on engagement rates
      switch (template.category) {
        case AchievementCategory.HABITS:
          weight *= (0.5 + profile.habitCompletionRate);
          break;
        case AchievementCategory.JOURNAL:
          weight *= (0.5 + profile.journalEntryFrequency);
          break;
        case AchievementCategory.GOALS:
          weight *= (0.5 + profile.goalProgressFrequency);
          break;
        case AchievementCategory.CONSISTENCY:
          weight *= (0.5 + profile.weeklyEngagementScore);
          break;
        default:
          break;
      }
      
      // Slight randomization to prevent predictability
      weight *= (0.8 + Math.random() * 0.4);
      
      return weight;
    });
  }

  /**
   * Weighted random selection from array
   */
  private static weightedRandomSelection<T>(items: T[], weights: number[]): T | undefined {
    if (items.length === 0 || weights.length !== items.length) return undefined;
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) return items[Math.floor(Math.random() * items.length)];
    
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i] || 0;
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  /**
   * Generate challenge from template with difficulty scaling
   */
  private static async generateChallengeFromTemplate(
    template: ChallengeTemplate,
    profile: UserActivityProfile,
    order: number
  ): Promise<WeeklyChallenge> {
    // Calculate difficulty level (1-5) based on user level and engagement
    const baseDifficulty = Math.min(5, Math.max(1, Math.floor(profile.currentLevel / 10) + 1));
    const engagementAdjustment = profile.weeklyEngagementScore > 0.7 ? 1 : 0;
    const difficultyLevel = Math.min(5, baseDifficulty + engagementAdjustment) as 1 | 2 | 3 | 4 | 5;
    
    // Get difficulty scaling for this level
    const difficultyScaling = template.difficultyLevels.find(d => d.level === difficultyLevel) || 
      template.difficultyLevels[0] ||
      { level: difficultyLevel, difficultyMultiplier: 1.0, complexityBonus: 0, xpRewardMultiplier: 1.0 };
    
    // Generate requirements with scaled targets
    const requirements: ChallengeRequirement[] = template.requirements.map((req, index) => {
      const baseTarget = template.baseTargets[index] || 5;
      const scaledTarget = Math.ceil(baseTarget * difficultyScaling.difficultyMultiplier);
      
      return {
        ...req,
        target: scaledTarget
      };
    });
    
    // Calculate XP reward
    const xpReward = Math.floor(
      template.xpRewardBase * 
      difficultyScaling.xpRewardMultiplier * 
      (1 + difficultyScaling.complexityBonus)
    );
    
    // Create challenge
    const challenge: WeeklyChallenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: template.title,
      description: this.personalizeDescription(template.description, profile, difficultyLevel),
      startDate: formatDateToString(startOfWeek(new Date())),
      endDate: formatDateToString(endOfWeek(new Date())),
      xpReward,
      difficultyLevel,
      category: template.category,
      requirements,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return challenge;
  }

  /**
   * Personalize challenge description based on user profile
   */
  private static personalizeDescription(
    baseDescription: string,
    profile: UserActivityProfile,
    difficulty: number
  ): string {
    const levelTitles = ['', 'Newcomer', 'Explorer', 'Dedicated', 'Expert', 'Master'];
    const difficultyWords = ['', 'Gentle', 'Steady', 'Focused', 'Intense', 'Ultimate'];
    
    let personalized = baseDescription;
    
    // Replace placeholders
    const levelIndex = Math.min(5, Math.floor(profile.currentLevel / 10) + 1);
    const levelTitle = levelTitles[levelIndex] || 'Adventurer';
    const difficultyWord = difficultyWords[difficulty] || 'Steady';
    
    personalized = personalized.replace('{level_title}', levelTitle);
    personalized = personalized.replace('{difficulty_word}', difficultyWord);
    personalized = personalized.replace('{user_level}', profile.currentLevel.toString());
    
    return personalized;
  }

  /**
   * Get all available challenge templates
   */
  private static getAllChallengeTemplates(): ChallengeTemplate[] {
    return [
      // HABITS CATEGORY CHALLENGES
      {
        id: 'habit_consistency_basic',
        category: AchievementCategory.HABITS,
        title: 'Consistency Champion',
        description: 'Complete your scheduled habits {difficulty_word}ly this week. Show your dedication, {level_title}!',
        requirements: [
          {
            type: 'habits',
            description: 'Complete scheduled habits',
            trackingKey: 'scheduled_habit_completions'
          }
        ],
        baseTargets: [10],
        difficultyLevels: [
          { level: 1, difficultyMultiplier: 0.7, complexityBonus: 0, xpRewardMultiplier: 1.0 },
          { level: 2, difficultyMultiplier: 1.0, complexityBonus: 0.1, xpRewardMultiplier: 1.2 },
          { level: 3, difficultyMultiplier: 1.3, complexityBonus: 0.2, xpRewardMultiplier: 1.5 },
          { level: 4, difficultyMultiplier: 1.7, complexityBonus: 0.3, xpRewardMultiplier: 1.8 },
          { level: 5, difficultyMultiplier: 2.2, complexityBonus: 0.5, xpRewardMultiplier: 2.2 }
        ],
        minLevel: 1,
        xpRewardBase: 200,
        tags: ['consistency', 'habits', 'daily']
      },
      {
        id: 'habit_variety_explorer',
        category: AchievementCategory.HABITS,
        title: 'Variety Explorer',
        description: 'Explore different habits each day. Mix up your routine and discover new possibilities!',
        requirements: [
          {
            type: 'habits',
            description: 'Complete different habits on different days',
            trackingKey: 'unique_daily_habits'
          }
        ],
        baseTargets: [4],
        difficultyLevels: [
          { level: 1, difficultyMultiplier: 0.8, complexityBonus: 0.1, xpRewardMultiplier: 1.1 },
          { level: 2, difficultyMultiplier: 1.0, complexityBonus: 0.2, xpRewardMultiplier: 1.3 },
          { level: 3, difficultyMultiplier: 1.2, complexityBonus: 0.3, xpRewardMultiplier: 1.6 },
          { level: 4, difficultyMultiplier: 1.5, complexityBonus: 0.4, xpRewardMultiplier: 1.9 },
          { level: 5, difficultyMultiplier: 1.8, complexityBonus: 0.6, xpRewardMultiplier: 2.3 }
        ],
        minLevel: 3,
        xpRewardBase: 250,
        tags: ['variety', 'exploration', 'habits']
      },
      {
        id: 'habit_bonus_seeker',
        category: AchievementCategory.HABITS,
        title: 'Bonus Seeker',
        description: 'Go above and beyond! Complete bonus habits to show your extra dedication.',
        requirements: [
          {
            type: 'habits',
            description: 'Complete bonus habits',
            trackingKey: 'bonus_habit_completions'
          }
        ],
        baseTargets: [5],
        difficultyLevels: [
          { level: 1, difficultyMultiplier: 0.6, complexityBonus: 0.2, xpRewardMultiplier: 1.2 },
          { level: 2, difficultyMultiplier: 1.0, complexityBonus: 0.3, xpRewardMultiplier: 1.4 },
          { level: 3, difficultyMultiplier: 1.4, complexityBonus: 0.4, xpRewardMultiplier: 1.7 },
          { level: 4, difficultyMultiplier: 1.8, complexityBonus: 0.5, xpRewardMultiplier: 2.0 },
          { level: 5, difficultyMultiplier: 2.5, complexityBonus: 0.7, xpRewardMultiplier: 2.5 }
        ],
        minLevel: 2,
        xpRewardBase: 180,
        tags: ['bonus', 'extra', 'dedication']
      },

      // JOURNAL CATEGORY CHALLENGES
      {
        id: 'journal_reflection_master',
        category: AchievementCategory.JOURNAL,
        title: 'Reflection Master',
        description: 'Deepen your practice with thoughtful daily reflections. Quality over quantity, {level_title}!',
        requirements: [
          {
            type: 'journal',
            description: 'Write journal entries with meaningful content',
            trackingKey: 'quality_journal_entries'
          }
        ],
        baseTargets: [15],
        difficultyLevels: [
          { level: 1, difficultyMultiplier: 0.8, complexityBonus: 0.1, xpRewardMultiplier: 1.1 },
          { level: 2, difficultyMultiplier: 1.0, complexityBonus: 0.2, xpRewardMultiplier: 1.3 },
          { level: 3, difficultyMultiplier: 1.2, complexityBonus: 0.3, xpRewardMultiplier: 1.6 },
          { level: 4, difficultyMultiplier: 1.5, complexityBonus: 0.4, xpRewardMultiplier: 1.9 },
          { level: 5, difficultyMultiplier: 1.8, complexityBonus: 0.6, xpRewardMultiplier: 2.2 }
        ],
        minLevel: 1,
        xpRewardBase: 220,
        tags: ['reflection', 'journal', 'quality']
      },
      {
        id: 'journal_gratitude_abundance',
        category: AchievementCategory.JOURNAL,
        title: 'Gratitude Abundance',
        description: 'Fill your week with extra gratitude! Write bonus entries to amplify your positive mindset.',
        requirements: [
          {
            type: 'journal',
            description: 'Write bonus journal entries beyond daily minimum',
            trackingKey: 'bonus_journal_entries'
          }
        ],
        baseTargets: [8],
        difficultyLevels: [
          { level: 1, difficultyMultiplier: 0.6, complexityBonus: 0.2, xpRewardMultiplier: 1.2 },
          { level: 2, difficultyMultiplier: 1.0, complexityBonus: 0.3, xpRewardMultiplier: 1.4 },
          { level: 3, difficultyMultiplier: 1.4, complexityBonus: 0.4, xpRewardMultiplier: 1.7 },
          { level: 4, difficultyMultiplier: 1.8, complexityBonus: 0.5, xpRewardMultiplier: 2.0 },
          { level: 5, difficultyMultiplier: 2.2, complexityBonus: 0.7, xpRewardMultiplier: 2.4 }
        ],
        minLevel: 2,
        xpRewardBase: 190,
        tags: ['gratitude', 'abundance', 'bonus']
      },

      // GOALS CATEGORY CHALLENGES  
      {
        id: 'goal_progress_warrior',
        category: AchievementCategory.GOALS,
        title: 'Progress Warrior',
        description: 'Make steady progress on your goals every day. Small steps lead to big achievements!',
        requirements: [
          {
            type: 'goals',
            description: 'Make progress on goals daily',
            trackingKey: 'daily_goal_progress'
          }
        ],
        baseTargets: [5],
        difficultyLevels: [
          { level: 1, difficultyMultiplier: 0.8, complexityBonus: 0.1, xpRewardMultiplier: 1.1 },
          { level: 2, difficultyMultiplier: 1.0, complexityBonus: 0.2, xpRewardMultiplier: 1.3 },
          { level: 3, difficultyMultiplier: 1.3, complexityBonus: 0.3, xpRewardMultiplier: 1.6 },
          { level: 4, difficultyMultiplier: 1.6, complexityBonus: 0.4, xpRewardMultiplier: 1.9 },
          { level: 5, difficultyMultiplier: 2.0, complexityBonus: 0.5, xpRewardMultiplier: 2.3 }
        ],
        minLevel: 1,
        xpRewardBase: 240,
        tags: ['progress', 'goals', 'daily']
      },
      {
        id: 'goal_completion_champion',
        category: AchievementCategory.GOALS,
        title: 'Completion Champion',
        description: 'Finish what you started! Complete goals and experience the satisfaction of achievement.',
        requirements: [
          {
            type: 'goals', 
            description: 'Complete goals',
            trackingKey: 'goal_completions'
          }
        ],
        baseTargets: [1],
        difficultyLevels: [
          { level: 1, difficultyMultiplier: 1.0, complexityBonus: 0.3, xpRewardMultiplier: 1.5 },
          { level: 2, difficultyMultiplier: 1.0, complexityBonus: 0.4, xpRewardMultiplier: 1.7 },
          { level: 3, difficultyMultiplier: 1.5, complexityBonus: 0.5, xpRewardMultiplier: 2.0 },
          { level: 4, difficultyMultiplier: 2.0, complexityBonus: 0.6, xpRewardMultiplier: 2.3 },
          { level: 5, difficultyMultiplier: 2.5, complexityBonus: 0.8, xpRewardMultiplier: 2.8 }
        ],
        minLevel: 3,
        xpRewardBase: 350,
        tags: ['completion', 'achievement', 'satisfaction']
      },

      // CONSISTENCY CATEGORY CHALLENGES
      {
        id: 'consistency_triple_threat',
        category: AchievementCategory.CONSISTENCY,
        title: 'Triple Threat',
        description: 'Master all three areas! Use habits, journal, and goals together each day for balanced growth.',
        requirements: [
          {
            type: 'mixed',
            description: 'Use all three features in the same day',
            trackingKey: 'triple_feature_days'
          }
        ],
        baseTargets: [4],
        difficultyLevels: [
          { level: 1, difficultyMultiplier: 0.8, complexityBonus: 0.4, xpRewardMultiplier: 1.4 },
          { level: 2, difficultyMultiplier: 1.0, complexityBonus: 0.5, xpRewardMultiplier: 1.6 },
          { level: 3, difficultyMultiplier: 1.2, complexityBonus: 0.6, xpRewardMultiplier: 1.9 },
          { level: 4, difficultyMultiplier: 1.5, complexityBonus: 0.7, xpRewardMultiplier: 2.2 },
          { level: 5, difficultyMultiplier: 1.8, complexityBonus: 0.9, xpRewardMultiplier: 2.6 }
        ],
        minLevel: 5,
        xpRewardBase: 300,
        tags: ['consistency', 'balance', 'all-features']
      },
      {
        id: 'consistency_daily_dedication',
        category: AchievementCategory.CONSISTENCY,
        title: 'Daily Dedication',
        description: 'Show up every single day! Maintain your streak of daily app engagement throughout the week.',
        requirements: [
          {
            type: 'mixed',
            description: 'Open app and earn XP every day',
            trackingKey: 'daily_engagement_streak'
          }
        ],
        baseTargets: [7],
        difficultyLevels: [
          { level: 1, difficultyMultiplier: 1.0, complexityBonus: 0.2, xpRewardMultiplier: 1.3 },
          { level: 2, difficultyMultiplier: 1.0, complexityBonus: 0.3, xpRewardMultiplier: 1.5 },
          { level: 3, difficultyMultiplier: 1.0, complexityBonus: 0.4, xpRewardMultiplier: 1.7 },
          { level: 4, difficultyMultiplier: 1.0, complexityBonus: 0.5, xpRewardMultiplier: 2.0 },
          { level: 5, difficultyMultiplier: 1.0, complexityBonus: 0.7, xpRewardMultiplier: 2.4 }
        ],
        minLevel: 2,
        xpRewardBase: 280,
        tags: ['daily', 'streak', 'engagement']
      },

      // MASTERY CATEGORY CHALLENGES
      {
        id: 'mastery_perfectionist',
        category: AchievementCategory.MASTERY,
        title: 'Perfectionist',
        description: 'Achieve excellence in everything! Complete all daily requirements without missing a beat.',
        requirements: [
          {
            type: 'mixed',
            description: 'Complete all daily minimums every day',
            trackingKey: 'perfect_days'
          }
        ],
        baseTargets: [3],
        difficultyLevels: [
          { level: 1, difficultyMultiplier: 0.7, complexityBonus: 0.6, xpRewardMultiplier: 1.6 },
          { level: 2, difficultyMultiplier: 1.0, complexityBonus: 0.7, xpRewardMultiplier: 1.8 },
          { level: 3, difficultyMultiplier: 1.3, complexityBonus: 0.8, xpRewardMultiplier: 2.1 },
          { level: 4, difficultyMultiplier: 1.7, complexityBonus: 1.0, xpRewardMultiplier: 2.5 },
          { level: 5, difficultyMultiplier: 2.3, complexityBonus: 1.2, xpRewardMultiplier: 3.0 }
        ],
        minLevel: 8,
        xpRewardBase: 400,
        tags: ['mastery', 'perfection', 'excellence']
      }
    ];
  }

  // ========================================
  // CHALLENGE TRACKING & COMPLETION
  // ========================================

  /**
   * Update challenge progress based on user activity
   */
  static async updateChallengeProgress(
    source: XPSourceType,
    amount: number,
    sourceId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const activeChallenges = await this.getActiveChallenges();
      if (activeChallenges.length === 0) return;

      console.log(`🎯 Updating challenge progress from ${source} (+${amount} XP)`);

      let progressUpdated = false;

      for (const challenge of activeChallenges) {
        const progress = await this.getChallengeProgress(challenge.id);
        const previousProgress = { ...progress.progress };

        // Update progress based on source type and challenge requirements
        let updated = false;
        for (const requirement of challenge.requirements) {
          const incrementValue = this.calculateProgressIncrement(requirement, source, amount, metadata);
          
          if (incrementValue > 0) {
            progress.progress[requirement.trackingKey] = 
              (progress.progress[requirement.trackingKey] || 0) + incrementValue;
            updated = true;
            progressUpdated = true;
            
            console.log(`📈 Challenge "${challenge.title}": ${requirement.trackingKey} +${incrementValue} (${progress.progress[requirement.trackingKey]}/${requirement.target})`);
          }
        }

        if (updated) {
          // Save progress
          await this.saveChallengeProgress(progress);

          // Check for completion
          const isCompleted = await this.checkChallengeCompletion(challenge, progress);
          if (isCompleted && !progress.isCompleted) {
            await this.completeChallenge(challenge.id);
          }

          // Trigger progress update event
          DeviceEventEmitter.emit('challengeProgressUpdated', {
            challengeId: challenge.id,
            requirementKey: Object.keys(progress.progress).find(key => 
              progress.progress[key] !== previousProgress[key]
            ),
            previousProgress: previousProgress,
            newProgress: progress.progress,
            isCompleted,
            timestamp: Date.now()
          });
        }
      }

      if (progressUpdated) {
        console.log('✅ Challenge progress updated successfully');
      }

    } catch (error) {
      console.error('WeeklyChallengeService.updateChallengeProgress error:', error);
    }
  }

  /**
   * Calculate progress increment based on XP source and challenge requirement
   */
  private static calculateProgressIncrement(
    requirement: ChallengeRequirement,
    source: XPSourceType,
    amount: number,
    metadata?: Record<string, any>
  ): number {
    switch (requirement.trackingKey) {
      case 'scheduled_habit_completions':
        return source === XPSourceType.HABIT_COMPLETION ? 1 : 0;
        
      case 'bonus_habit_completions':
        return source === XPSourceType.HABIT_BONUS ? 1 : 0;
        
      case 'unique_daily_habits':
        // This requires special tracking - count unique habits per day
        return source === XPSourceType.HABIT_COMPLETION || source === XPSourceType.HABIT_BONUS ? 0.1 : 0;
        
      case 'quality_journal_entries':
        return source === XPSourceType.JOURNAL_ENTRY ? 1 : 0;
        
      case 'bonus_journal_entries':
        return source === XPSourceType.JOURNAL_BONUS ? 1 : 0;
        
      case 'daily_goal_progress':
        return source === XPSourceType.GOAL_PROGRESS ? 1 : 0;
        
      case 'goal_completions':
        return source === XPSourceType.GOAL_COMPLETION ? 1 : 0;
        
      case 'triple_feature_days':
        // This requires special daily tracking - handled separately
        return 0;
        
      case 'daily_engagement_streak':
        // Track consecutive days - handled separately
        return 0;
        
      case 'perfect_days':
        // Track perfect days - handled separately  
        return 0;
        
      default:
        return 0;
    }
  }

  /**
   * Check if challenge is completed
   */
  private static async checkChallengeCompletion(
    challenge: WeeklyChallenge,
    progress: ChallengeProgress
  ): Promise<boolean> {
    try {
      for (const requirement of challenge.requirements) {
        const currentProgress = progress.progress[requirement.trackingKey] || 0;
        if (currentProgress < requirement.target) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('WeeklyChallengeService.checkChallengeCompletion error:', error);
      return false;
    }
  }

  /**
   * Complete a challenge and award rewards
   */
  private static async completeChallenge(challengeId: string): Promise<ChallengeCompletionResult> {
    try {
      const activeChallenges = await this.getActiveChallenges();
      const challenge = activeChallenges.find(c => c.id === challengeId);
      
      if (!challenge) {
        throw new Error(`Challenge ${challengeId} not found`);
      }

      // Get and update progress
      const progress = await this.getChallengeProgress(challengeId);
      progress.isCompleted = true;
      progress.completedAt = new Date();
      progress.xpEarned = challenge.xpReward;
      
      await this.saveChallengeProgress(progress);
      
      // Award XP
      const xpResult = await GamificationService.addXP(challenge.xpReward, {
        source: XPSourceType.WEEKLY_CHALLENGE,
        sourceId: challengeId,
        description: `Completed weekly challenge: ${challenge.title}`,
        metadata: {
          challengeId,
          challengeTitle: challenge.title,
          challengeCategory: challenge.category,
          difficultyLevel: challenge.difficultyLevel
        }
      });

      // Check for special achievements
      const achievementUnlocked: string | undefined = undefined; // TODO: Implement achievement detection
      const celebrationLevel = this.determineCelebrationLevel(challenge, progress);
      
      // Move completed challenge to history
      await this.moveChallengeToHistory(challenge, progress);

      const result: ChallengeCompletionResult = {
        challengeId,
        completed: true,
        xpEarned: challenge.xpReward,
        completedAt: progress.completedAt!,
        celebrationLevel,
        ...(achievementUnlocked ? { achievementUnlocked } : {})
      };

      // Trigger completion celebration
      DeviceEventEmitter.emit('challengeCompleted', {
        challenge,
        progress,
        result,
        xpResult,
        timestamp: Date.now()
      });

      console.log(`🎉 Challenge completed: "${challenge.title}" (+${challenge.xpReward} XP)`);
      
      return result;

    } catch (error) {
      console.error('WeeklyChallengeService.completeChallenge error:', error);
      throw error;
    }
  }

  /**
   * Determine celebration level for challenge completion
   */
  private static determineCelebrationLevel(
    challenge: WeeklyChallenge,
    progress: ChallengeProgress
  ): 'normal' | 'milestone' | 'epic' {
    // Epic for difficulty 5 or very high XP rewards
    if (challenge.difficultyLevel === 5 || challenge.xpReward >= 500) {
      return 'epic';
    }
    
    // Milestone for difficulty 4 or first completion of this challenge type
    if (challenge.difficultyLevel === 4 || challenge.xpReward >= 300) {
      return 'milestone';
    }
    
    return 'normal';
  }

  /**
   * Move completed challenge to history
   */
  private static async moveChallengeToHistory(
    challenge: WeeklyChallenge,
    progress: ChallengeProgress
  ): Promise<void> {
    try {
      // Add to history
      const history = await this.getChallengeHistory();
      history.push({
        ...progress,
        challengeTitle: challenge.title,
        challengeCategory: challenge.category,
        difficultyLevel: challenge.difficultyLevel,
        xpReward: challenge.xpReward
      });

      // Keep only last 50 completed challenges
      const trimmedHistory = history.slice(-50);
      await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGE_HISTORY, JSON.stringify(trimmedHistory));

      // Remove from active challenges
      const activeChallenges = await this.getActiveChallenges();
      const updatedChallenges = activeChallenges.filter(c => c.id !== challenge.id);
      await this.storeActiveChallenges(updatedChallenges);

      // Remove progress tracking
      await AsyncStorage.removeItem(`${STORAGE_KEYS.CHALLENGE_PROGRESS}_${challenge.id}`);
      
      console.log(`📚 Challenge moved to history: ${challenge.title}`);
    } catch (error) {
      console.error('WeeklyChallengeService.moveChallengeToHistory error:', error);
    }
  }

  // ========================================
  // DATA PERSISTENCE & RETRIEVAL
  // ========================================

  /**
   * Get active challenges for current week
   */
  static async getActiveChallenges(): Promise<WeeklyChallenge[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_CHALLENGES);
      if (!stored) return [];

      const challenges: WeeklyChallenge[] = JSON.parse(stored).map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }));

      // Filter by current week and active status
      const currentWeekStart = formatDateToString(startOfWeek(new Date()));
      const currentWeekEnd = formatDateToString(endOfWeek(new Date()));
      
      return challenges.filter(challenge => 
        challenge.isActive &&
        challenge.startDate >= currentWeekStart &&
        challenge.endDate <= currentWeekEnd
      );

    } catch (error) {
      console.error('WeeklyChallengeService.getActiveChallenges error:', error);
      return [];
    }
  }

  /**
   * Store active challenges
   */
  private static async storeActiveChallenges(challenges: WeeklyChallenge[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_CHALLENGES, JSON.stringify(challenges));
    } catch (error) {
      console.error('WeeklyChallengeService.storeActiveChallenges error:', error);
    }
  }

  /**
   * Get challenge progress
   */
  static async getChallengeProgress(challengeId: string): Promise<ChallengeProgress> {
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEYS.CHALLENGE_PROGRESS}_${challengeId}`);
      if (!stored) {
        // Return empty progress
        return {
          challengeId,
          userId: 'local_user', // Since we're not using authentication yet
          progress: {},
          isCompleted: false,
          xpEarned: 0
        };
      }

      const progress: ChallengeProgress = JSON.parse(stored);
      if (progress.completedAt) {
        progress.completedAt = new Date(progress.completedAt);
      }

      return progress;
    } catch (error) {
      console.error('WeeklyChallengeService.getChallengeProgress error:', error);
      return {
        challengeId,
        userId: 'local_user',
        progress: {},
        isCompleted: false,
        xpEarned: 0
      };
    }
  }

  /**
   * Save challenge progress
   */
  private static async saveChallengeProgress(progress: ChallengeProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CHALLENGE_PROGRESS}_${progress.challengeId}`,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('WeeklyChallengeService.saveChallengeProgress error:', error);
    }
  }

  /**
   * Initialize challenge progress tracking
   */
  private static async initializeChallengeProgress(challengeId: string): Promise<void> {
    try {
      const existingProgress = await this.getChallengeProgress(challengeId);
      
      // Only initialize if no progress exists
      if (Object.keys(existingProgress.progress).length === 0) {
        const activeChallenges = await this.getActiveChallenges();
        const challenge = activeChallenges.find(c => c.id === challengeId);
        
        if (challenge) {
          const initialProgress: ChallengeProgress = {
            challengeId,
            userId: 'local_user',
            progress: {},
            isCompleted: false,
            xpEarned: 0
          };

          // Initialize all tracking keys to 0
          for (const requirement of challenge.requirements) {
            initialProgress.progress[requirement.trackingKey] = 0;
          }

          await this.saveChallengeProgress(initialProgress);
          console.log(`🎯 Initialized progress tracking for challenge: ${challenge.title}`);
        }
      }
    } catch (error) {
      console.error('WeeklyChallengeService.initializeChallengeProgress error:', error);
    }
  }

  /**
   * Get challenge completion history
   */
  private static async getChallengeHistory(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_HISTORY);
      if (!stored) return [];

      const history = JSON.parse(stored);
      return history.map((item: any) => ({
        ...item,
        completedAt: item.completedAt ? new Date(item.completedAt) : undefined
      }));
    } catch (error) {
      console.error('WeeklyChallengeService.getChallengeHistory error:', error);
      return [];
    }
  }

  // ========================================
  // SPECIAL TRACKING METHODS
  // ========================================

  /**
   * Update daily tracking for complex challenge requirements
   */
  static async updateDailyTracking(): Promise<void> {
    try {
      const activeChallenges = await this.getActiveChallenges();
      if (activeChallenges.length === 0) return;

      const todayStr = today();
      
      // Track complex requirements that need daily aggregation
      for (const challenge of activeChallenges) {
        const progress = await this.getChallengeProgress(challenge.id);
        let progressUpdated = false;

        for (const requirement of challenge.requirements) {
          switch (requirement.trackingKey) {
            case 'triple_feature_days':
              const hasTripleFeature = await this.checkTripleFeatureDay(todayStr);
              if (hasTripleFeature) {
                progress.progress[requirement.trackingKey] = 
                  (progress.progress[requirement.trackingKey] || 0) + 1;
                progressUpdated = true;
                console.log(`🎯 Triple feature day recorded for challenge: ${challenge.title}`);
              }
              break;

            case 'daily_engagement_streak':
              const hasEngagement = await this.checkDailyEngagement(todayStr);
              if (hasEngagement) {
                progress.progress[requirement.trackingKey] = 
                  (progress.progress[requirement.trackingKey] || 0) + 1;
                progressUpdated = true;
                console.log(`📅 Daily engagement recorded for challenge: ${challenge.title}`);
              }
              break;

            case 'perfect_days':
              const isPerfectDay = await this.checkPerfectDay(todayStr);
              if (isPerfectDay) {
                progress.progress[requirement.trackingKey] = 
                  (progress.progress[requirement.trackingKey] || 0) + 1;
                progressUpdated = true;
                console.log(`⭐ Perfect day recorded for challenge: ${challenge.title}`);
              }
              break;

            case 'unique_daily_habits':
              const uniqueHabits = await this.countUniqueDailyHabits(todayStr);
              const currentMax = progress.progress[requirement.trackingKey] || 0;
              if (uniqueHabits > currentMax) {
                progress.progress[requirement.trackingKey] = uniqueHabits;
                progressUpdated = true;
                console.log(`🎨 Unique daily habits updated: ${uniqueHabits} for challenge: ${challenge.title}`);
              }
              break;
          }
        }

        if (progressUpdated) {
          await this.saveChallengeProgress(progress);
          
          // Check for completion
          const isCompleted = await this.checkChallengeCompletion(challenge, progress);
          if (isCompleted && !progress.isCompleted) {
            await this.completeChallenge(challenge.id);
          }
        }
      }

    } catch (error) {
      console.error('WeeklyChallengeService.updateDailyTracking error:', error);
    }
  }

  /**
   * Check if user completed all three feature types today
   */
  private static async checkTripleFeatureDay(dateStr: DateString): Promise<boolean> {
    try {
      const transactions = await GamificationService.getTransactionsByDateRange(dateStr, dateStr);
      
      const hasHabit = transactions.some(t => 
        t.source === XPSourceType.HABIT_COMPLETION || t.source === XPSourceType.HABIT_BONUS
      );
      const hasJournal = transactions.some(t => 
        t.source === XPSourceType.JOURNAL_ENTRY || t.source === XPSourceType.JOURNAL_BONUS
      );
      const hasGoal = transactions.some(t => 
        t.source === XPSourceType.GOAL_PROGRESS || t.source === XPSourceType.GOAL_COMPLETION
      );

      return hasHabit && hasJournal && hasGoal;
    } catch (error) {
      console.error('WeeklyChallengeService.checkTripleFeatureDay error:', error);
      return false;
    }
  }

  /**
   * Check if user engaged with app today (earned any XP)
   */
  private static async checkDailyEngagement(dateStr: DateString): Promise<boolean> {
    try {
      const transactions = await GamificationService.getTransactionsByDateRange(dateStr, dateStr);
      return transactions.length > 0 && transactions.some(t => t.amount > 0);
    } catch (error) {
      console.error('WeeklyChallengeService.checkDailyEngagement error:', error);
      return false;
    }
  }

  /**
   * Check if user had a perfect day (met all daily minimums)
   */
  private static async checkPerfectDay(dateStr: DateString): Promise<boolean> {
    try {
      // Import storage services to check daily minimums
      const { HabitStorage } = await import('./storage/habitStorage');
      const { GratitudeStorage } = await import('./storage/gratitudeStorage');

      // Check habit minimums (at least 1 scheduled habit completed)
      const HabitStorageWithDateStats = HabitStorage as any;
      const habitStats = HabitStorageWithDateStats.getHabitCompletionStatsForDate ? 
        await HabitStorageWithDateStats.getHabitCompletionStatsForDate(dateStr) :
        { completed: 0 };
      const hasMinimumHabits = habitStats.completed >= 1;

      // Check journal minimums (at least 3 entries)
      const GratitudeStorageWithDate = GratitudeStorage as any;
      const journalEntries = GratitudeStorageWithDate.getEntriesForDate ? 
        await GratitudeStorageWithDate.getEntriesForDate(dateStr) : [];
      const hasMinimumJournal = journalEntries.length >= 3;

      // For perfect day, require both habits and journal (goals are optional)
      return hasMinimumHabits && hasMinimumJournal;
      
    } catch (error) {
      console.error('WeeklyChallengeService.checkPerfectDay error:', error);
      return false;
    }
  }

  /**
   * Count unique habits completed today
   */
  private static async countUniqueDailyHabits(dateStr: DateString): Promise<number> {
    try {
      const { HabitStorage } = await import('./storage/habitStorage');
      const HabitStorageWithUnique = HabitStorage as any;
      const uniqueHabits = HabitStorageWithUnique.getUniqueHabitsCompletedOnDate ? 
        await HabitStorageWithUnique.getUniqueHabitsCompletedOnDate(dateStr) : [];
      return uniqueHabits.length;
    } catch (error) {
      console.error('WeeklyChallengeService.countUniqueDailyHabits error:', error);
      return 0;
    }
  }

  // ========================================
  // PUBLIC API METHODS
  // ========================================

  /**
   * Get current week's challenges with progress
   */
  static async getCurrentWeekChallenges(): Promise<Array<WeeklyChallenge & { progress: ChallengeProgress }>> {
    try {
      const activeChallenges = await this.getActiveChallenges();
      
      const challengesWithProgress = await Promise.all(
        activeChallenges.map(async (challenge) => {
          const progress = await this.getChallengeProgress(challenge.id);
          return { ...challenge, progress };
        })
      );

      return challengesWithProgress;
    } catch (error) {
      console.error('WeeklyChallengeService.getCurrentWeekChallenges error:', error);
      return [];
    }
  }

  /**
   * Get challenge statistics and achievements
   */
  static async getChallengeStats(): Promise<{
    totalChallengesCompleted: number;
    currentWeekProgress: number;
    totalXPEarned: number;
    challengeStreak: number;
    favoriteCategory: AchievementCategory;
    averageDifficulty: number;
  }> {
    try {
      const history = await this.getChallengeHistory();
      const completedChallenges = history.filter(c => c.completed);
      
      const totalChallengesCompleted = completedChallenges.length;
      const totalXPEarned = completedChallenges.reduce((sum, c) => sum + (c.xpEarned || 0), 0);
      
      // Calculate current week progress
      const currentChallenges = await this.getCurrentWeekChallenges();
      const currentWeekCompleted = currentChallenges.filter(c => c.progress.isCompleted).length;
      const currentWeekProgress = currentChallenges.length > 0 ? 
        (currentWeekCompleted / currentChallenges.length) * 100 : 0;

      // Calculate favorite category
      const categoryCount: Record<AchievementCategory, number> = {
        [AchievementCategory.HABITS]: 0,
        [AchievementCategory.JOURNAL]: 0,
        [AchievementCategory.GOALS]: 0,
        [AchievementCategory.CONSISTENCY]: 0,
        [AchievementCategory.MASTERY]: 0,
        [AchievementCategory.SOCIAL]: 0,
        [AchievementCategory.SPECIAL]: 0,
      };

      let totalDifficulty = 0;
      for (const challenge of completedChallenges) {
        const category = challenge.challengeCategory as AchievementCategory;
        if (category && categoryCount[category] !== undefined) {
          categoryCount[category]++;
        }
        if (challenge.difficultyLevel) {
          totalDifficulty += challenge.difficultyLevel;
        }
      }

      const favoriteCategory = Object.entries(categoryCount)
        .reduce((max, [category, count]) => count > max.count ? 
          { category: category as AchievementCategory, count } : max, 
          { category: AchievementCategory.HABITS, count: 0 }
        ).category;

      const averageDifficulty = completedChallenges.length > 0 ? 
        totalDifficulty / completedChallenges.length : 0;

      // Calculate challenge streak (consecutive weeks with at least 1 completion)
      const challengeStreak = await this.calculateChallengeStreak();

      return {
        totalChallengesCompleted,
        currentWeekProgress,
        totalXPEarned,
        challengeStreak,
        favoriteCategory,
        averageDifficulty
      };

    } catch (error) {
      console.error('WeeklyChallengeService.getChallengeStats error:', error);
      return {
        totalChallengesCompleted: 0,
        currentWeekProgress: 0,
        totalXPEarned: 0,
        challengeStreak: 0,
        favoriteCategory: AchievementCategory.HABITS,
        averageDifficulty: 0
      };
    }
  }

  /**
   * Calculate current challenge completion streak (consecutive weeks)
   */
  private static async calculateChallengeStreak(): Promise<number> {
    try {
      const history = await this.getChallengeHistory();
      const completedChallenges = history.filter(c => c.completed && c.completedAt);

      if (completedChallenges.length === 0) return 0;

      // Group completions by week
      const weeklyCompletions = new Map<string, number>();
      
      for (const challenge of completedChallenges) {
        const completionDate = new Date(challenge.completedAt!);
        const weekStart = startOfWeek(completionDate);
        const weekKey = formatDateToString(weekStart);
        
        weeklyCompletions.set(weekKey, (weeklyCompletions.get(weekKey) || 0) + 1);
      }

      // Calculate consecutive weeks from current week backwards
      let streak = 0;
      let currentWeek = startOfWeek(new Date());
      if (typeof currentWeek === 'string') {
        currentWeek = parseDate(currentWeek);
      }
      
      while (true) {
        const weekKey = formatDateToString(currentWeek);
        if (!weeklyCompletions.has(weekKey)) break;
        
        streak++;
        const nextWeek = addDays(currentWeek, -7); // Go back one week
        currentWeek = typeof nextWeek === 'string' ? parseDate(nextWeek) : nextWeek;
      }

      return streak;

    } catch (error) {
      console.error('WeeklyChallengeService.calculateChallengeStreak error:', error);
      return 0;
    }
  }

  /**
   * Force regenerate challenges (for testing or manual refresh)
   */
  static async regenerateChallenges(): Promise<WeeklyChallenge[]> {
    try {
      // Clear existing challenges
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_CHALLENGES);
      
      // Clear all progress tracking
      const allKeys = await AsyncStorage.getAllKeys();
      const progressKeys = allKeys.filter(key => key.startsWith(STORAGE_KEYS.CHALLENGE_PROGRESS));
      if (progressKeys.length > 0) {
        await AsyncStorage.multiRemove(progressKeys);
      }
      
      console.log('🔄 Cleared existing challenges, generating new ones...');
      
      // Generate new challenges
      return await this.generateWeeklyChallenge();
      
    } catch (error) {
      console.error('WeeklyChallengeService.regenerateChallenges error:', error);
      return [];
    }
  }

  /**
   * Clear all challenge data (for testing/development)
   */
  static async clearAllChallengeData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACTIVE_CHALLENGES,
        STORAGE_KEYS.CHALLENGE_HISTORY,
        STORAGE_KEYS.USER_LEVEL_CACHE,
        STORAGE_KEYS.CHALLENGE_GENERATION_DATA,
      ]);

      // Clear all progress tracking
      const allKeys = await AsyncStorage.getAllKeys();
      const progressKeys = allKeys.filter(key => key.startsWith(STORAGE_KEYS.CHALLENGE_PROGRESS));
      if (progressKeys.length > 0) {
        await AsyncStorage.multiRemove(progressKeys);
      }

      console.log('🧹 All challenge data cleared');
    } catch (error) {
      console.error('WeeklyChallengeService.clearAllChallengeData error:', error);
    }
  }
}

// Export service instance
export default WeeklyChallengeService;