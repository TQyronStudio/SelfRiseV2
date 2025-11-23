// Achievement Preview System Utilities
// Provides progress hints, requirements, and completion information for all achievements

import { Achievement, AchievementRarity, AchievementCategory } from '../types/gamification';
import { getGratitudeStorageImpl } from '../config/featureFlags';
import { TFunction } from 'i18next';

// Get storage implementation based on feature flag
const gratitudeStorage = getGratitudeStorageImpl();

// ========================================
// INTERFACES
// ========================================

export interface UserStats {
  // Habits
  habitsCreated: number;
  totalHabitCompletions: number;
  longestHabitStreak: number;
  maxHabitsInOneDay: number;
  habitLevel: number;
  
  // Journal
  journalEntries: number;
  totalJournalEntries: number;
  currentJournalStreak: number;
  longestJournalStreak: number;
  bonusJournalEntries: number;
  
  // Journal Bonus Milestones (New for ⭐🔥👑 system)
  starCount: number;              // Number of ⭐ achieved (1+ bonus per day)
  flameCount: number;             // Number of 🔥 achieved (5+ bonuses per day)
  crownCount: number;             // Number of 👑 achieved (10+ bonuses per day)
  bonusStreakDays: number;        // Current bonus streak (1+ bonus daily)
  goldenBonusStreakDays: number;  // Current golden bonus streak (3+ bonuses daily)
  
  // Goals
  goalsCreated: number;
  completedGoals: number;
  goalProgressStreak: number;
  hasLargeGoal: boolean;
  
  // Level & XP
  currentLevel: number;
  totalXP: number;
  xpFromHabits: number;
  
  // Achievements
  totalAchievements: number;
  unlockedAchievements: number;
  
  // Consistency
  appUsageStreak: number;
  multiAreaDays: number;
  
  // Activity
  totalActiveDays: number;
  recommendationsFollowed: number;
  
  // Special achievements tracking
  samedayHabitCreationCompletions: number;  // lightning-start
  activeHabitsSimultaneous: number;         // seven-wonder
  comebackActivities: number;               // persistence-pays
  
  // Advanced consistency tracking
  perfectMonthDays: number;                 // perfect-month
  hasTripleCrown: boolean;                  // triple-crown
  dailyFeatureComboDays: number;            // balance-master
}

export interface ProgressHint {
  progressText: string;           // "Complete 100 habits (75/100)"
  progressPercentage: number;     // 75
  isCompleted: boolean;          // false
  requirementText: string;       // "Complete 100 habits total"
  actionHint: string;           // "Keep completing daily habits!"
  estimatedDays?: number;       // 25 days remaining
}

export interface CompletionInfo {
  accomplishment: string;        // "Completed 100 habits total"
  completionDate: string;       // "Unlocked 3 days ago"
  timeToComplete: string;       // "Achieved in 45 days"
  category: string;             // "Habits Category"
  difficultyLevel: string;      // "Challenging"
}

export interface SmartTooltip {
  primaryTip: string;           // Main guidance
  motivationalMessage: string;  // Encouragement
  actionAdvice: string;        // Specific next steps
  estimatedEffort?: string | undefined;    // Time/effort estimate
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Helper function for deep-thinker achievement - checks if user has journal entries with ≥200 characters
 */
const checkDeepThinkingEntries = async (): Promise<{ hasDeepEntry: boolean; totalLongEntries: number; longestEntry: number }> => {
  try {
    const allEntries = await gratitudeStorage.getAll();
    let totalLongEntries = 0;
    let longestEntry = 0;
    
    for (const entry of allEntries) {
      const contentLength = (entry.content || '').length;
      longestEntry = Math.max(longestEntry, contentLength);
      if (contentLength >= 200) {
        totalLongEntries++;
      }
    }
    
    return {
      hasDeepEntry: totalLongEntries > 0,
      totalLongEntries,
      longestEntry
    };
  } catch (error) {
    console.error('Failed to check deep thinking entries:', error);
    return { hasDeepEntry: false, totalLongEntries: 0, longestEntry: 0 };
  }
};

// ========================================
// PROGRESS HINT GENERATION
// ========================================

export const generateProgressHint = (achievement: Achievement, userStats: UserStats, t: TFunction): ProgressHint => {
  switch (achievement.category) {
    case AchievementCategory.HABITS:
      return generateHabitProgressHint(achievement, userStats, t);
    case AchievementCategory.JOURNAL:
      return generateJournalProgressHint(achievement, userStats, t);
    case AchievementCategory.GOALS:
      return generateGoalProgressHint(achievement, userStats, t);
    case AchievementCategory.CONSISTENCY:
      return generateConsistencyProgressHint(achievement, userStats, t);
    case AchievementCategory.CONSISTENCY:
      return generateMasteryProgressHint(achievement, userStats, t);
    case AchievementCategory.CONSISTENCY:
      return generateSpecialProgressHint(achievement, userStats, t);
    default:
      return getDefaultProgressHint(achievement, t);
  }
};

// Asynchronous version for achievements that need async data
export const generateProgressHintAsync = async (achievement: Achievement, userStats: UserStats, t: TFunction): Promise<ProgressHint> => {
  switch (achievement.category) {
    case AchievementCategory.HABITS:
      return generateHabitProgressHint(achievement, userStats, t);
    case AchievementCategory.JOURNAL:
      return await generateJournalProgressHintAsync(achievement, userStats, t);
    case AchievementCategory.GOALS:
      return generateGoalProgressHint(achievement, userStats, t);
    case AchievementCategory.CONSISTENCY:
      return generateConsistencyProgressHint(achievement, userStats, t);
    case AchievementCategory.CONSISTENCY:
      return generateMasteryProgressHint(achievement, userStats, t);
    case AchievementCategory.CONSISTENCY:
      return generateSpecialProgressHint(achievement, userStats, t);
    default:
      return getDefaultProgressHint(achievement, t);
  }
};

// ========================================
// CATEGORY-SPECIFIC HINTS
// ========================================

const generateHabitProgressHint = (achievement: Achievement, userStats: UserStats, t: TFunction): ProgressHint => {
  switch (achievement.id) {
    case 'first-habit':
      return {
        progressText: userStats.habitsCreated === 0
          ? t('achievements.preview.first_habit.progress_incomplete')
          : t('achievements.preview.first_habit.progress_complete'),
        progressPercentage: userStats.habitsCreated > 0 ? 100 : 0,
        isCompleted: userStats.habitsCreated > 0,
        requirementText: t('achievements.preview.first_habit.requirement'),
        actionHint: t('achievements.preview.first_habit.action')
      };
      
    case 'habit-builder':
      const created = Math.min(userStats.habitsCreated, 5);
      return {
        progressText: t('achievements.preview.habit_builder.progress', { current: created, target: 5 }),
        progressPercentage: (created / 5) * 100,
        isCompleted: created >= 5,
        requirementText: t('achievements.preview.habit_builder.requirement'),
        actionHint: t('achievements.preview.habit_builder.action'),
        estimatedDays: Math.max(0, 5 - created)
      };
      
    case 'century-club':
      const completed = Math.min(userStats.totalHabitCompletions, 100);
      return {
        progressText: t('achievements.preview.century_club.progress', { current: completed, target: 100 }),
        progressPercentage: (completed / 100) * 100,
        isCompleted: completed >= 100,
        requirementText: t('achievements.preview.century_club.requirement'),
        actionHint: t('achievements.preview.century_club.action'),
        estimatedDays: Math.ceil((100 - completed) / 2) // Assuming 2 habits per day
      };
      
    case 'consistency-king':
      const total = Math.min(userStats.totalHabitCompletions, 1000);
      return {
        progressText: t('achievements.preview.consistency_king.progress', { current: total, target: 1000 }),
        progressPercentage: (total / 1000) * 100,
        isCompleted: total >= 1000,
        requirementText: t('achievements.preview.consistency_king.requirement'),
        actionHint: t('achievements.preview.consistency_king.action'),
        estimatedDays: Math.ceil((1000 - total) / 3) // Assuming 3 habits per day
      };
      
    case 'streak-champion':
      const streak = Math.min(userStats.longestHabitStreak, 21);
      return {
        progressText: t('achievements.preview.streak_champion.progress', { current: userStats.longestHabitStreak, target: 21 }),
        progressPercentage: (streak / 21) * 100,
        isCompleted: userStats.longestHabitStreak >= 21,
        requirementText: t('achievements.preview.streak_champion.requirement'),
        actionHint: t('achievements.preview.streak_champion.action'),
        estimatedDays: Math.max(0, 21 - userStats.longestHabitStreak)
      };
      
    case 'century-streak':
      const longStreak = Math.min(userStats.longestHabitStreak, 75);
      return {
        progressText: t('achievements.preview.century_streak.progress', { current: userStats.longestHabitStreak, target: 75 }),
        progressPercentage: (longStreak / 75) * 100,
        isCompleted: userStats.longestHabitStreak >= 75,
        requirementText: t('achievements.preview.century_streak.requirement'),
        actionHint: t('achievements.preview.century_streak.action'),
        estimatedDays: Math.max(0, 75 - userStats.longestHabitStreak)
      };
      
    case 'multi-tasker':
      const maxInDay = Math.min(userStats.maxHabitsInOneDay, 5);
      return {
        progressText: t('achievements.preview.multi_tasker.progress', { current: userStats.maxHabitsInOneDay, target: 5 }),
        progressPercentage: (maxInDay / 5) * 100,
        isCompleted: userStats.maxHabitsInOneDay >= 5,
        requirementText: t('achievements.preview.multi_tasker.requirement'),
        actionHint: t('achievements.preview.multi_tasker.action')
      };
      
    case 'habit-legend':
      const levelProgress = userStats.currentLevel >= 50 && (userStats.xpFromHabits / userStats.totalXP) >= 0.5;
      const habitXPPercent = Math.round((userStats.xpFromHabits / userStats.totalXP) * 100);
      return {
        progressText: t('achievements.preview.habit_legend.progress', {
          level: userStats.currentLevel,
          xpPercent: habitXPPercent
        }),
        progressPercentage: levelProgress ? 100 : Math.min((userStats.currentLevel / 50) * 50 + ((userStats.xpFromHabits / userStats.totalXP) * 50), 100),
        isCompleted: levelProgress,
        requirementText: t('achievements.preview.habit_legend.requirement'),
        actionHint: t('achievements.preview.habit_legend.action')
      };

    default:
      return getDefaultProgressHint(achievement, t);
  }
};

const generateJournalProgressHint = (achievement: Achievement, userStats: UserStats, t: TFunction): ProgressHint => {
  switch (achievement.id) {
    case 'first-journal':
      return {
        progressText: userStats.journalEntries === 0
          ? t('achievements.preview.first_journal.progress_incomplete')
          : t('achievements.preview.first_journal.progress_complete'),
        progressPercentage: userStats.journalEntries > 0 ? 100 : 0,
        isCompleted: userStats.journalEntries > 0,
        requirementText: t('achievements.preview.first_journal.requirement'),
        actionHint: t('achievements.preview.first_journal.action')
      };
      
    case 'deep-thinker':
      // Synchronous fallback - shows progress as pending async load
      return {
        progressText: t('achievements.preview.deep_thinker.progress_checking'),
        progressPercentage: 0,
        isCompleted: false,
        requirementText: t('achievements.preview.deep_thinker.requirement'),
        actionHint: t('achievements.preview.deep_thinker.action')
      };
      
    case 'journal-enthusiast':
      const entries = Math.min(userStats.totalJournalEntries, 100);
      return {
        progressText: t('achievements.preview.journal_enthusiast.progress', { current: entries, target: 100 }),
        progressPercentage: (entries / 100) * 100,
        isCompleted: entries >= 100,
        requirementText: t('achievements.preview.journal_enthusiast.requirement'),
        actionHint: t('achievements.preview.journal_enthusiast.action'),
        estimatedDays: Math.ceil((100 - entries) / 1) // 1 entry per day
      };

    case 'grateful-heart':
      const currentStreak = Math.min(userStats.currentJournalStreak, 7);
      return {
        progressText: t('achievements.preview.grateful_heart.progress', { current: userStats.currentJournalStreak, target: 7 }),
        progressPercentage: (currentStreak / 7) * 100,
        isCompleted: userStats.currentJournalStreak >= 7,
        requirementText: t('achievements.preview.grateful_heart.requirement'),
        actionHint: t('achievements.preview.grateful_heart.action'),
        estimatedDays: Math.max(0, 7 - userStats.currentJournalStreak)
      };

    case 'journal-streaker':
      const streak21 = Math.min(userStats.longestJournalStreak, 21);
      return {
        progressText: t('achievements.preview.journal_streaker.progress', { current: userStats.longestJournalStreak, target: 21 }),
        progressPercentage: (streak21 / 21) * 100,
        isCompleted: userStats.longestJournalStreak >= 21,
        requirementText: t('achievements.preview.journal_streaker.requirement'),
        actionHint: t('achievements.preview.journal_streaker.action'),
        estimatedDays: Math.max(0, 21 - userStats.longestJournalStreak)
      };

    case 'gratitude-guru':
      const streak30 = Math.min(userStats.longestJournalStreak, 30);
      return {
        progressText: t('achievements.preview.gratitude_guru.progress', { current: userStats.longestJournalStreak, target: 30 }),
        progressPercentage: (streak30 / 30) * 100,
        isCompleted: userStats.longestJournalStreak >= 30,
        requirementText: t('achievements.preview.gratitude_guru.requirement'),
        actionHint: t('achievements.preview.gratitude_guru.action'),
        estimatedDays: Math.max(0, 30 - userStats.longestJournalStreak)
      };

    case 'eternal-gratitude':
      const streak100 = Math.min(userStats.longestJournalStreak, 100);
      return {
        progressText: t('achievements.preview.eternal_gratitude.progress', { current: userStats.longestJournalStreak, target: 100 }),
        progressPercentage: (streak100 / 100) * 100,
        isCompleted: userStats.longestJournalStreak >= 100,
        requirementText: t('achievements.preview.eternal_gratitude.requirement'),
        actionHint: t('achievements.preview.eternal_gratitude.action'),
        estimatedDays: Math.max(0, 100 - userStats.longestJournalStreak)
      };

    case 'bonus-seeker':
      const bonusEntries = Math.min(userStats.bonusJournalEntries, 50);
      return {
        progressText: t('achievements.preview.bonus_seeker.progress', { current: bonusEntries, target: 50 }),
        progressPercentage: (bonusEntries / 50) * 100,
        isCompleted: bonusEntries >= 50,
        requirementText: t('achievements.preview.bonus_seeker.requirement'),
        actionHint: t('achievements.preview.bonus_seeker.action'),
        estimatedDays: Math.ceil((50 - bonusEntries) / 2) // Assuming 2 bonus per day
      };

    // ========================================
    // NEW JOURNAL BONUS ACHIEVEMENTS (24 achievements)
    // Added: 2025-08-30 - Complete ⭐🔥👑 milestone system
    // ========================================

    // --- BASIC BONUS ACHIEVEMENTS (9 achievements) ---

    case 'first-star':
      return {
        progressText: userStats.starCount === 0
          ? t('achievements.preview.first_star.progress_incomplete')
          : t('achievements.preview.first_star.progress_complete'),
        progressPercentage: userStats.starCount > 0 ? 100 : 0,
        isCompleted: userStats.starCount > 0,
        requirementText: t('achievements.preview.first_star.requirement'),
        actionHint: t('achievements.preview.first_star.action')
      };

    case 'five-stars':
      const stars5 = Math.min(userStats.starCount, 5);
      return {
        progressText: t('achievements.preview.five_stars.progress', { current: stars5, target: 5 }),
        progressPercentage: (stars5 / 5) * 100,
        isCompleted: stars5 >= 5,
        requirementText: t('achievements.preview.five_stars.requirement'),
        actionHint: t('achievements.preview.five_stars.action'),
        estimatedDays: Math.max(0, 5 - stars5)
      };

    case 'flame-achiever':
      return {
        progressText: userStats.flameCount === 0
          ? t('achievements.preview.flame_achiever.progress_incomplete')
          : t('achievements.preview.flame_achiever.progress_complete'),
        progressPercentage: userStats.flameCount > 0 ? 100 : 0,
        isCompleted: userStats.flameCount > 0,
        requirementText: t('achievements.preview.flame_achiever.requirement'),
        actionHint: t('achievements.preview.flame_achiever.action')
      };

    case 'bonus-week':
      const bonusWeek = Math.min(userStats.bonusStreakDays, 7);
      return {
        progressText: t('achievements.preview.bonus_week.progress', { current: bonusWeek, target: 7 }),
        progressPercentage: (bonusWeek / 7) * 100,
        isCompleted: bonusWeek >= 7,
        requirementText: t('achievements.preview.bonus_week.requirement'),
        actionHint: t('achievements.preview.bonus_week.action'),
        estimatedDays: Math.max(0, 7 - bonusWeek)
      };

    case 'crown-royalty':
      return {
        progressText: userStats.crownCount === 0
          ? t('achievements.preview.crown_royalty.progress_incomplete')
          : t('achievements.preview.crown_royalty.progress_complete'),
        progressPercentage: userStats.crownCount > 0 ? 100 : 0,
        isCompleted: userStats.crownCount > 0,
        requirementText: t('achievements.preview.crown_royalty.requirement'),
        actionHint: t('achievements.preview.crown_royalty.action')
      };

    case 'flame-collector':
      const flameCollector = Math.min(userStats.flameCount, 5);
      return {
        progressText: t('achievements.preview.flame_collector.progress', { current: flameCollector, target: 5 }),
        progressPercentage: (flameCollector / 5) * 100,
        isCompleted: flameCollector >= 5,
        requirementText: t('achievements.preview.flame_collector.requirement'),
        actionHint: t('achievements.preview.flame_collector.action'),
        estimatedDays: Math.max(0, 5 - flameCollector) * 7 // Rough estimate
      };

    case 'golden-bonus-streak':
      const goldenStreak = Math.min(userStats.goldenBonusStreakDays, 7);
      return {
        progressText: t('achievements.preview.golden_bonus_streak.progress', { current: goldenStreak, target: 7 }),
        progressPercentage: (goldenStreak / 7) * 100,
        isCompleted: goldenStreak >= 7,
        requirementText: t('achievements.preview.golden_bonus_streak.requirement'),
        actionHint: t('achievements.preview.golden_bonus_streak.action'),
        estimatedDays: Math.max(0, 7 - goldenStreak)
      };

    case 'triple-crown-master':
      const tripleCrown = Math.min(userStats.crownCount, 3);
      return {
        progressText: t('achievements.preview.triple_crown_master.progress', { current: tripleCrown, target: 3 }),
        progressPercentage: (tripleCrown / 3) * 100,
        isCompleted: tripleCrown >= 3,
        requirementText: t('achievements.preview.triple_crown_master.requirement'),
        actionHint: t('achievements.preview.triple_crown_master.action'),
        estimatedDays: Math.max(0, 3 - tripleCrown) * 30 // Rough estimate
      };

    case 'bonus-century':
      const bonusCentury = Math.min(userStats.bonusJournalEntries, 200);
      return {
        progressText: t('achievements.preview.bonus_century.progress', { current: bonusCentury, target: 200 }),
        progressPercentage: (bonusCentury / 200) * 100,
        isCompleted: bonusCentury >= 200,
        requirementText: t('achievements.preview.bonus_century.requirement'),
        actionHint: t('achievements.preview.bonus_century.action'),
        estimatedDays: Math.ceil((200 - bonusCentury) / 2) // Assuming 2 bonus per day
      };

    // --- STAR MILESTONE ACHIEVEMENTS (5 achievements) ---

    case 'star-beginner':
      const starBeginner = Math.min(userStats.starCount, 10);
      return {
        progressText: t('achievements.preview.star_beginner.progress', { current: starBeginner, target: 10 }),
        progressPercentage: (starBeginner / 10) * 100,
        isCompleted: starBeginner >= 10,
        requirementText: t('achievements.preview.star_beginner.requirement'),
        actionHint: t('achievements.preview.star_beginner.action'),
        estimatedDays: Math.max(0, 10 - starBeginner)
      };

    case 'star-collector':
      const starCollector = Math.min(userStats.starCount, 25);
      return {
        progressText: t('achievements.preview.star_collector.progress', { current: starCollector, target: 25 }),
        progressPercentage: (starCollector / 25) * 100,
        isCompleted: starCollector >= 25,
        requirementText: t('achievements.preview.star_collector.requirement'),
        actionHint: t('achievements.preview.star_collector.action'),
        estimatedDays: Math.max(0, 25 - starCollector)
      };

    case 'star-master':
      const starMaster = Math.min(userStats.starCount, 50);
      return {
        progressText: t('achievements.preview.star_master.progress', { current: starMaster, target: 50 }),
        progressPercentage: (starMaster / 50) * 100,
        isCompleted: starMaster >= 50,
        requirementText: t('achievements.preview.star_master.requirement'),
        actionHint: t('achievements.preview.star_master.action'),
        estimatedDays: Math.max(0, 50 - starMaster)
      };

    case 'star-champion':
      const starChampion = Math.min(userStats.starCount, 100);
      return {
        progressText: t('achievements.preview.star_champion.progress', { current: starChampion, target: 100 }),
        progressPercentage: (starChampion / 100) * 100,
        isCompleted: starChampion >= 100,
        requirementText: t('achievements.preview.star_champion.requirement'),
        actionHint: t('achievements.preview.star_champion.action'),
        estimatedDays: Math.max(0, 100 - starChampion)
      };

    case 'star-legend':
      const starLegend = Math.min(userStats.starCount, 200);
      return {
        progressText: t('achievements.preview.star_legend.progress', { current: starLegend, target: 200 }),
        progressPercentage: (starLegend / 200) * 100,
        isCompleted: starLegend >= 200,
        requirementText: t('achievements.preview.star_legend.requirement'),
        actionHint: t('achievements.preview.star_legend.action'),
        estimatedDays: Math.max(0, 200 - starLegend)
      };

    // --- FLAME MILESTONE ACHIEVEMENTS (5 achievements) ---

    case 'flame-starter':
      const flameStarter = Math.min(userStats.flameCount, 5);
      return {
        progressText: t('achievements.preview.flame_starter.progress', { current: flameStarter, target: 5 }),
        progressPercentage: (flameStarter / 5) * 100,
        isCompleted: flameStarter >= 5,
        requirementText: t('achievements.preview.flame_starter.requirement'),
        actionHint: t('achievements.preview.flame_starter.action'),
        estimatedDays: Math.max(0, 5 - flameStarter) * 7
      };

    case 'flame-accumulator':
      const flameAccumulator = Math.min(userStats.flameCount, 10);
      return {
        progressText: t('achievements.preview.flame_accumulator.progress', { current: flameAccumulator, target: 10 }),
        progressPercentage: (flameAccumulator / 10) * 100,
        isCompleted: flameAccumulator >= 10,
        requirementText: t('achievements.preview.flame_accumulator.requirement'),
        actionHint: t('achievements.preview.flame_accumulator.action'),
        estimatedDays: Math.max(0, 10 - flameAccumulator) * 14
      };

    case 'flame-master':
      const flameMaster = Math.min(userStats.flameCount, 25);
      return {
        progressText: t('achievements.preview.flame_master.progress', { current: flameMaster, target: 25 }),
        progressPercentage: (flameMaster / 25) * 100,
        isCompleted: flameMaster >= 25,
        requirementText: t('achievements.preview.flame_master.requirement'),
        actionHint: t('achievements.preview.flame_master.action'),
        estimatedDays: Math.max(0, 25 - flameMaster) * 10
      };

    case 'flame-champion':
      const flameChampion = Math.min(userStats.flameCount, 50);
      return {
        progressText: t('achievements.preview.flame_champion.progress', { current: flameChampion, target: 50 }),
        progressPercentage: (flameChampion / 50) * 100,
        isCompleted: flameChampion >= 50,
        requirementText: t('achievements.preview.flame_champion.requirement'),
        actionHint: t('achievements.preview.flame_champion.action'),
        estimatedDays: Math.max(0, 50 - flameChampion) * 7
      };

    case 'flame-legend':
      const flameLegend = Math.min(userStats.flameCount, 100);
      return {
        progressText: t('achievements.preview.flame_legend.progress', { current: flameLegend, target: 100 }),
        progressPercentage: (flameLegend / 100) * 100,
        isCompleted: flameLegend >= 100,
        requirementText: t('achievements.preview.flame_legend.requirement'),
        actionHint: t('achievements.preview.flame_legend.action'),
        estimatedDays: Math.max(0, 100 - flameLegend) * 4
      };

    // --- CROWN MILESTONE ACHIEVEMENTS (5 achievements) ---

    case 'crown-achiever':
      const crownAchiever = Math.min(userStats.crownCount, 3);
      return {
        progressText: t('achievements.preview.crown_achiever.progress', { current: crownAchiever, target: 3 }),
        progressPercentage: (crownAchiever / 3) * 100,
        isCompleted: crownAchiever >= 3,
        requirementText: t('achievements.preview.crown_achiever.requirement'),
        actionHint: t('achievements.preview.crown_achiever.action'),
        estimatedDays: Math.max(0, 3 - crownAchiever) * 60
      };

    case 'crown-collector':
      const crownCollector = Math.min(userStats.crownCount, 5);
      return {
        progressText: t('achievements.preview.crown_collector.progress', { current: crownCollector, target: 5 }),
        progressPercentage: (crownCollector / 5) * 100,
        isCompleted: crownCollector >= 5,
        requirementText: t('achievements.preview.crown_collector.requirement'),
        actionHint: t('achievements.preview.crown_collector.action'),
        estimatedDays: Math.max(0, 5 - crownCollector) * 45
      };

    case 'crown-master':
      const crownMaster = Math.min(userStats.crownCount, 10);
      return {
        progressText: t('achievements.preview.crown_master.progress', { current: crownMaster, target: 10 }),
        progressPercentage: (crownMaster / 10) * 100,
        isCompleted: crownMaster >= 10,
        requirementText: t('achievements.preview.crown_master.requirement'),
        actionHint: t('achievements.preview.crown_master.action'),
        estimatedDays: Math.max(0, 10 - crownMaster) * 30
      };

    case 'crown-champion':
      const crownChampion = Math.min(userStats.crownCount, 25);
      return {
        progressText: t('achievements.preview.crown_champion.progress', { current: crownChampion, target: 25 }),
        progressPercentage: (crownChampion / 25) * 100,
        isCompleted: crownChampion >= 25,
        requirementText: t('achievements.preview.crown_champion.requirement'),
        actionHint: t('achievements.preview.crown_champion.action'),
        estimatedDays: Math.max(0, 25 - crownChampion) * 14
      };

    case 'crown-emperor':
      const crownEmperor = Math.min(userStats.crownCount, 50);
      return {
        progressText: t('achievements.preview.crown_emperor.progress', { current: crownEmperor, target: 50 }),
        progressPercentage: (crownEmperor / 50) * 100,
        isCompleted: crownEmperor >= 50,
        requirementText: t('achievements.preview.crown_emperor.requirement'),
        actionHint: t('achievements.preview.crown_emperor.action'),
        estimatedDays: Math.max(0, 50 - crownEmperor) * 7
      };

    default:
      return getDefaultProgressHint(achievement, t);
  }
};

// Async version for journal achievements that need real-time data
const generateJournalProgressHintAsync = async (achievement: Achievement, userStats: UserStats, t: TFunction): Promise<ProgressHint> => {
  switch (achievement.id) {
    case 'first-journal':
      return {
        progressText: userStats.journalEntries === 0
          ? t('achievements.preview.first_journal.progress_incomplete')
          : t('achievements.preview.first_journal.progress_complete'),
        progressPercentage: userStats.journalEntries > 0 ? 100 : 0,
        isCompleted: userStats.journalEntries > 0,
        requirementText: t('achievements.preview.first_journal.requirement'),
        actionHint: t('achievements.preview.first_journal.action')
      };

    case 'deep-thinker':
      const deepThinkingData = await checkDeepThinkingEntries();
      return {
        progressText: deepThinkingData.hasDeepEntry
          ? t('achievements.preview.deep_thinker.progress_complete', { count: deepThinkingData.totalLongEntries })
          : t('achievements.preview.deep_thinker.progress_incomplete', { longest: deepThinkingData.longestEntry }),
        progressPercentage: deepThinkingData.hasDeepEntry ? 100 : Math.min((deepThinkingData.longestEntry / 200) * 100, 99),
        isCompleted: deepThinkingData.hasDeepEntry,
        requirementText: t('achievements.preview.deep_thinker.requirement'),
        actionHint: deepThinkingData.hasDeepEntry
          ? t('achievements.preview.deep_thinker.action_complete')
          : t('achievements.preview.deep_thinker.action_incomplete', { needed: Math.max(0, 200 - deepThinkingData.longestEntry) })
      };

    default:
      // For other journal achievements, use the sync version
      return generateJournalProgressHint(achievement, userStats, t);
  }
};

const generateGoalProgressHint = (achievement: Achievement, userStats: UserStats, t: TFunction): ProgressHint => {
  switch (achievement.id) {
    case 'first-goal':
      return {
        progressText: userStats.goalsCreated === 0
          ? t('achievements.preview.first_goal.progress_incomplete')
          : t('achievements.preview.first_goal.progress_complete'),
        progressPercentage: userStats.goalsCreated > 0 ? 100 : 0,
        isCompleted: userStats.goalsCreated > 0,
        requirementText: t('achievements.preview.first_goal.requirement'),
        actionHint: t('achievements.preview.first_goal.action')
      };

    case 'goal-getter':
      return {
        progressText: userStats.completedGoals === 0
          ? t('achievements.preview.goal_getter.progress_incomplete')
          : t('achievements.preview.goal_getter.progress_complete'),
        progressPercentage: userStats.completedGoals > 0 ? 100 : 0,
        isCompleted: userStats.completedGoals > 0,
        requirementText: t('achievements.preview.goal_getter.requirement'),
        actionHint: t('achievements.preview.goal_getter.action')
      };

    case 'goal-achiever':
      const completed3 = Math.min(userStats.completedGoals, 3);
      return {
        progressText: t('achievements.preview.goal_achiever.progress', { current: completed3, target: 3 }),
        progressPercentage: (completed3 / 3) * 100,
        isCompleted: completed3 >= 3,
        requirementText: t('achievements.preview.goal_achiever.requirement'),
        actionHint: t('achievements.preview.goal_achiever.action'),
        estimatedDays: (3 - completed3) * 30 // Rough estimate
      };

    case 'goal-champion':
      const completed5 = Math.min(userStats.completedGoals, 5);
      return {
        progressText: t('achievements.preview.goal_champion.progress', { current: completed5, target: 5 }),
        progressPercentage: (completed5 / 5) * 100,
        isCompleted: completed5 >= 5,
        requirementText: t('achievements.preview.goal_champion.requirement'),
        actionHint: t('achievements.preview.goal_champion.action'),
        estimatedDays: (5 - completed5) * 30
      };

    case 'achievement-unlocked':
      const completed10 = Math.min(userStats.completedGoals, 10);
      return {
        progressText: t('achievements.preview.achievement_unlocked.progress', { current: completed10, target: 10 }),
        progressPercentage: (completed10 / 10) * 100,
        isCompleted: completed10 >= 10,
        requirementText: t('achievements.preview.achievement_unlocked.requirement'),
        actionHint: t('achievements.preview.achievement_unlocked.action'),
        estimatedDays: (10 - completed10) * 30
      };

    case 'ambitious':
      return {
        progressText: userStats.hasLargeGoal
          ? t('achievements.preview.ambitious.progress_complete')
          : t('achievements.preview.ambitious.progress_incomplete'),
        progressPercentage: userStats.hasLargeGoal ? 100 : 0,
        isCompleted: userStats.hasLargeGoal,
        requirementText: t('achievements.preview.ambitious.requirement'),
        actionHint: t('achievements.preview.ambitious.action')
      };

    case 'progress-tracker':
      const progressStreak = Math.min(userStats.goalProgressStreak, 7);
      return {
        progressText: t('achievements.preview.progress_tracker.progress', { current: progressStreak, target: 7 }),
        progressPercentage: (progressStreak / 7) * 100,
        isCompleted: progressStreak >= 7,
        requirementText: t('achievements.preview.progress_tracker.requirement'),
        actionHint: t('achievements.preview.progress_tracker.action'),
        estimatedDays: Math.max(0, 7 - progressStreak)
      };

    default:
      return getDefaultProgressHint(achievement, t);
  }
};

const generateConsistencyProgressHint = (achievement: Achievement, userStats: UserStats, t: TFunction): ProgressHint => {
  switch (achievement.id) {
    case 'weekly-warrior':
      const weekStreak = Math.min(userStats.longestHabitStreak, 7);
      return {
        progressText: t('achievements.preview.weekly_warrior.progress', { current: userStats.longestHabitStreak }),
        progressPercentage: (weekStreak / 7) * 100,
        isCompleted: userStats.longestHabitStreak >= 7,
        requirementText: t('achievements.preview.weekly_warrior.requirement'),
        actionHint: t('achievements.preview.weekly_warrior.action')
      };

    case 'monthly-master':
      const monthStreak = Math.min(userStats.longestHabitStreak, 30);
      return {
        progressText: t('achievements.preview.monthly_master.progress', { current: userStats.longestHabitStreak }),
        progressPercentage: (monthStreak / 30) * 100,
        isCompleted: userStats.longestHabitStreak >= 30,
        requirementText: t('achievements.preview.monthly_master.requirement'),
        actionHint: t('achievements.preview.monthly_master.action')
      };

    case 'hundred-days':
      const centStreak = Math.min(userStats.longestHabitStreak, 100);
      return {
        progressText: t('achievements.preview.hundred_days.progress', { current: userStats.longestHabitStreak }),
        progressPercentage: (centStreak / 100) * 100,
        isCompleted: userStats.longestHabitStreak >= 100,
        requirementText: t('achievements.preview.hundred_days.requirement'),
        actionHint: t('achievements.preview.hundred_days.action')
      };

    case 'daily-visitor':
      const appStreak = Math.min(userStats.appUsageStreak, 7);
      return {
        progressText: t('achievements.preview.daily_visitor.progress', { current: appStreak, target: 7 }),
        progressPercentage: (appStreak / 7) * 100,
        isCompleted: appStreak >= 7,
        requirementText: t('achievements.preview.daily_visitor.requirement'),
        actionHint: t('achievements.preview.daily_visitor.action')
      };

    case 'dedicated-user':
      const appStreak30 = Math.min(userStats.appUsageStreak, 30);
      return {
        progressText: t('achievements.preview.dedicated_user.progress', { current: appStreak30, target: 30 }),
        progressPercentage: (appStreak30 / 30) * 100,
        isCompleted: appStreak30 >= 30,
        requirementText: t('achievements.preview.dedicated_user.requirement'),
        actionHint: t('achievements.preview.dedicated_user.action')
      };

    case 'perfect-month':
      const perfectDays = Math.min(userStats.perfectMonthDays, 28);
      return {
        progressText: t('achievements.preview.perfect_month.progress', { current: perfectDays, target: 28 }),
        progressPercentage: (perfectDays / 28) * 100,
        isCompleted: perfectDays >= 28,
        requirementText: t('achievements.preview.perfect_month.requirement'),
        actionHint: t('achievements.preview.perfect_month.action')
      };

    case 'triple-crown':
      return {
        progressText: userStats.hasTripleCrown
          ? t('achievements.preview.triple_crown.progress_complete')
          : t('achievements.preview.triple_crown.progress_incomplete'),
        progressPercentage: userStats.hasTripleCrown ? 100 : 0,
        isCompleted: userStats.hasTripleCrown,
        requirementText: t('achievements.preview.triple_crown.requirement'),
        actionHint: t('achievements.preview.triple_crown.action')
      };

    default:
      return getDefaultProgressHint(achievement, t);
  }
};

const generateMasteryProgressHint = (achievement: Achievement, userStats: UserStats, t: TFunction): ProgressHint => {
  switch (achievement.id) {
    case 'level-up':
      const level10 = Math.min(userStats.currentLevel, 10);
      return {
        progressText: t('achievements.preview.level_up.progress', { current: userStats.currentLevel }),
        progressPercentage: (level10 / 10) * 100,
        isCompleted: userStats.currentLevel >= 10,
        requirementText: t('achievements.preview.level_up.requirement'),
        actionHint: t('achievements.preview.level_up.action')
      };

    case 'selfrise-expert':
      const level25 = Math.min(userStats.currentLevel, 25);
      return {
        progressText: t('achievements.preview.selfrise_expert.progress', { current: userStats.currentLevel }),
        progressPercentage: (level25 / 25) * 100,
        isCompleted: userStats.currentLevel >= 25,
        requirementText: t('achievements.preview.selfrise_expert.requirement'),
        actionHint: t('achievements.preview.selfrise_expert.action')
      };

    case 'selfrise-master':
      const level50 = Math.min(userStats.currentLevel, 50);
      return {
        progressText: t('achievements.preview.selfrise_master.progress', { current: userStats.currentLevel }),
        progressPercentage: (level50 / 50) * 100,
        isCompleted: userStats.currentLevel >= 50,
        requirementText: t('achievements.preview.selfrise_master.requirement'),
        actionHint: t('achievements.preview.selfrise_master.action')
      };

    case 'ultimate-selfrise-legend':
      const level100 = Math.min(userStats.currentLevel, 100);
      return {
        progressText: t('achievements.preview.ultimate_selfrise_legend.progress', { current: userStats.currentLevel }),
        progressPercentage: (level100 / 100) * 100,
        isCompleted: userStats.currentLevel >= 100,
        requirementText: t('achievements.preview.ultimate_selfrise_legend.requirement'),
        actionHint: t('achievements.preview.ultimate_selfrise_legend.action')
      };

    case 'trophy-collector-basic':
      const achievements10 = Math.min(userStats.unlockedAchievements, 10);
      return {
        progressText: t('achievements.preview.trophy_collector_basic.progress', { current: achievements10, target: 10 }),
        progressPercentage: (achievements10 / 10) * 100,
        isCompleted: achievements10 >= 10,
        requirementText: t('achievements.preview.trophy_collector_basic.requirement'),
        actionHint: t('achievements.preview.trophy_collector_basic.action')
      };

    case 'trophy-collector-master':
      const achievements25 = Math.min(userStats.unlockedAchievements, 25);
      return {
        progressText: t('achievements.preview.trophy_collector_master.progress', { current: achievements25, target: 25 }),
        progressPercentage: (achievements25 / 25) * 100,
        isCompleted: achievements25 >= 25,
        requirementText: t('achievements.preview.trophy_collector_master.requirement'),
        actionHint: t('achievements.preview.trophy_collector_master.action')
      };

    case 'recommendation-master':
      const recs = Math.min(userStats.recommendationsFollowed, 20);
      return {
        progressText: t('achievements.preview.recommendation_master.progress', { current: recs, target: 20 }),
        progressPercentage: (recs / 20) * 100,
        isCompleted: recs >= 20,
        requirementText: t('achievements.preview.recommendation_master.requirement'),
        actionHint: t('achievements.preview.recommendation_master.action'),
        estimatedDays: Math.ceil((20 - recs) / 2) // Assuming 2 recommendations per day
      };

    case 'balance-master':
      const comboDays = Math.min(userStats.dailyFeatureComboDays, 10);
      return {
        progressText: t('achievements.preview.balance_master.progress', { current: comboDays, target: 10 }),
        progressPercentage: (comboDays / 10) * 100,
        isCompleted: comboDays >= 10,
        requirementText: t('achievements.preview.balance_master.requirement'),
        actionHint: t('achievements.preview.balance_master.action'),
        estimatedDays: Math.max(0, 10 - comboDays)
      };

    default:
      return getDefaultProgressHint(achievement, t);
  }
};

const generateSpecialProgressHint = (achievement: Achievement, userStats: UserStats, t: TFunction): ProgressHint => {
  switch (achievement.id) {
    case 'lightning-start':
      const sameDay = Math.min(userStats.samedayHabitCreationCompletions, 3);
      return {
        progressText: t('achievements.preview.lightning_start.progress', { current: sameDay, target: 3 }),
        progressPercentage: (sameDay / 3) * 100,
        isCompleted: sameDay >= 3,
        requirementText: t('achievements.preview.lightning_start.requirement'),
        actionHint: t('achievements.preview.lightning_start.action'),
        estimatedDays: Math.max(0, 3 - sameDay)
      };

    case 'seven-wonder':
      const activeHabits = Math.min(userStats.activeHabitsSimultaneous, 7);
      return {
        progressText: t('achievements.preview.seven_wonder.progress', { current: activeHabits, target: 7 }),
        progressPercentage: (activeHabits / 7) * 100,
        isCompleted: activeHabits >= 7,
        requirementText: t('achievements.preview.seven_wonder.requirement'),
        actionHint: t('achievements.preview.seven_wonder.action')
      };

    case 'persistence-pays':
      const comeback = Math.min(userStats.comebackActivities, 7);
      return {
        progressText: t('achievements.preview.persistence_pays.progress', { current: comeback, target: 7 }),
        progressPercentage: (comeback / 7) * 100,
        isCompleted: comeback >= 7,
        requirementText: t('achievements.preview.persistence_pays.requirement'),
        actionHint: t('achievements.preview.persistence_pays.action')
      };

    case 'legendary-master':
      const goals = Math.min(userStats.completedGoals, 10);
      const habits = Math.min(userStats.totalHabitCompletions, 500);
      const entries = Math.min(userStats.totalJournalEntries, 365);
      const goalsProgress = (goals / 10) * 100;
      const habitsProgress = (habits / 500) * 100;
      const entriesProgress = (entries / 365) * 100;
      const overallProgress = (goalsProgress + habitsProgress + entriesProgress) / 3;
      return {
        progressText: t('achievements.preview.legendary_master.progress', {
          goals: goals,
          goalsTarget: 10,
          habits: habits,
          habitsTarget: 500,
          entries: entries,
          entriesTarget: 365
        }),
        progressPercentage: overallProgress,
        isCompleted: goals >= 10 && habits >= 500 && entries >= 365,
        requirementText: t('achievements.preview.legendary_master.requirement'),
        actionHint: t('achievements.preview.legendary_master.action')
      };
    
    // Loyalty achievements
    case 'loyalty-first-week':
      const days7 = Math.min(userStats.totalActiveDays, 7);
      return {
        progressText: t('achievements.preview.loyalty_first_week.progress', { current: userStats.totalActiveDays, target: 7 }),
        progressPercentage: (days7 / 7) * 100,
        isCompleted: userStats.totalActiveDays >= 7,
        requirementText: t('achievements.preview.loyalty_first_week.requirement'),
        actionHint: t('achievements.preview.loyalty_first_week.action'),
        estimatedDays: Math.max(0, 7 - userStats.totalActiveDays)
      };

    case 'loyalty-two-weeks-strong':
      const days14 = Math.min(userStats.totalActiveDays, 14);
      return {
        progressText: t('achievements.preview.loyalty_two_weeks_strong.progress', { current: userStats.totalActiveDays, target: 14 }),
        progressPercentage: (days14 / 14) * 100,
        isCompleted: userStats.totalActiveDays >= 14,
        requirementText: t('achievements.preview.loyalty_two_weeks_strong.requirement'),
        actionHint: t('achievements.preview.loyalty_two_weeks_strong.action'),
        estimatedDays: Math.max(0, 14 - userStats.totalActiveDays)
      };

    case 'loyalty-three-weeks-committed':
      const days21 = Math.min(userStats.totalActiveDays, 21);
      return {
        progressText: t('achievements.preview.loyalty_three_weeks_committed.progress', { current: userStats.totalActiveDays, target: 21 }),
        progressPercentage: (days21 / 21) * 100,
        isCompleted: userStats.totalActiveDays >= 21,
        requirementText: t('achievements.preview.loyalty_three_weeks_committed.requirement'),
        actionHint: t('achievements.preview.loyalty_three_weeks_committed.action'),
        estimatedDays: Math.max(0, 21 - userStats.totalActiveDays)
      };

    case 'loyalty-month-explorer':
      const days30 = Math.min(userStats.totalActiveDays, 30);
      return {
        progressText: t('achievements.preview.loyalty_month_explorer.progress', { current: userStats.totalActiveDays, target: 30 }),
        progressPercentage: (days30 / 30) * 100,
        isCompleted: userStats.totalActiveDays >= 30,
        requirementText: t('achievements.preview.loyalty_month_explorer.requirement'),
        actionHint: t('achievements.preview.loyalty_month_explorer.action'),
        estimatedDays: Math.max(0, 30 - userStats.totalActiveDays)
      };

    case 'loyalty-two-month-veteran':
      const days60 = Math.min(userStats.totalActiveDays, 60);
      return {
        progressText: t('achievements.preview.loyalty_two_month_veteran.progress', { current: userStats.totalActiveDays, target: 60 }),
        progressPercentage: (days60 / 60) * 100,
        isCompleted: userStats.totalActiveDays >= 60,
        requirementText: t('achievements.preview.loyalty_two_month_veteran.requirement'),
        actionHint: t('achievements.preview.loyalty_two_month_veteran.action'),
        estimatedDays: Math.max(0, 60 - userStats.totalActiveDays)
      };

    case 'loyalty-century-user':
      const days100 = Math.min(userStats.totalActiveDays, 100);
      return {
        progressText: t('achievements.preview.loyalty_century_user.progress', { current: userStats.totalActiveDays, target: 100 }),
        progressPercentage: (days100 / 100) * 100,
        isCompleted: userStats.totalActiveDays >= 100,
        requirementText: t('achievements.preview.loyalty_century_user.requirement'),
        actionHint: t('achievements.preview.loyalty_century_user.action'),
        estimatedDays: Math.max(0, 100 - userStats.totalActiveDays)
      };

    case 'loyalty-half-year-hero':
      const days183 = Math.min(userStats.totalActiveDays, 183);
      return {
        progressText: t('achievements.preview.loyalty_half_year_hero.progress', { current: userStats.totalActiveDays, target: 183 }),
        progressPercentage: (days183 / 183) * 100,
        isCompleted: userStats.totalActiveDays >= 183,
        requirementText: t('achievements.preview.loyalty_half_year_hero.requirement'),
        actionHint: t('achievements.preview.loyalty_half_year_hero.action'),
        estimatedDays: Math.max(0, 183 - userStats.totalActiveDays)
      };

    case 'loyalty-year-legend':
      const days365 = Math.min(userStats.totalActiveDays, 365);
      return {
        progressText: t('achievements.preview.loyalty_year_legend.progress', { current: userStats.totalActiveDays, target: 365 }),
        progressPercentage: (days365 / 365) * 100,
        isCompleted: userStats.totalActiveDays >= 365,
        requirementText: t('achievements.preview.loyalty_year_legend.requirement'),
        actionHint: t('achievements.preview.loyalty_year_legend.action'),
        estimatedDays: Math.max(0, 365 - userStats.totalActiveDays)
      };

    case 'loyalty-ultimate-veteran':
      const days500 = Math.min(userStats.totalActiveDays, 500);
      return {
        progressText: t('achievements.preview.loyalty_ultimate_veteran.progress', { current: userStats.totalActiveDays, target: 500 }),
        progressPercentage: (days500 / 500) * 100,
        isCompleted: userStats.totalActiveDays >= 500,
        requirementText: t('achievements.preview.loyalty_ultimate_veteran.requirement'),
        actionHint: t('achievements.preview.loyalty_ultimate_veteran.action'),
        estimatedDays: Math.max(0, 500 - userStats.totalActiveDays)
      };

    case 'loyalty-master':
      const days1000 = Math.min(userStats.totalActiveDays, 1000);
      return {
        progressText: t('achievements.preview.loyalty_master.progress', { current: userStats.totalActiveDays, target: 1000 }),
        progressPercentage: (days1000 / 1000) * 100,
        isCompleted: userStats.totalActiveDays >= 1000,
        requirementText: t('achievements.preview.loyalty_master.requirement'),
        actionHint: t('achievements.preview.loyalty_master.action'),
        estimatedDays: Math.max(0, 1000 - userStats.totalActiveDays)
      };

    default:
      return getDefaultProgressHint(achievement, t);
  }
};

// ========================================
// DATE & TIME UTILITIES - PHASE 3
// ========================================

/**
 * Format achievement completion date with relative time
 */
const formatCompletionDate = (unlockedAt?: Date): string => {
  if (!unlockedAt) {
    return "Recently unlocked";
  }
  
  const now = new Date();
  const unlock = new Date(unlockedAt);
  const diffMs = now.getTime() - unlock.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays >= 30) {
    return unlock.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: unlock.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } else if (diffDays >= 1) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours >= 1) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes >= 1) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return "Just now";
  }
};

/**
 * Calculate realistic time to complete based on user activity - PHASE 3: Data-driven estimates
 */
const calculateTimeToComplete = (achievement: Achievement, userStats: UserStats): string => {
  if (!achievement.unlockedAt) {
    return "Achieved through dedication";
  }
  
  // Calculate user's activity rate (actions per day)
  const totalActivityDays = Math.max(userStats.totalActiveDays || 1, 1);
  const habitsPerDay = userStats.totalHabitCompletions / totalActivityDays;
  const journalEntriesPerDay = userStats.totalJournalEntries / totalActivityDays;
  const goalsPerDay = userStats.goalsCreated / totalActivityDays;
  
  // Determine user engagement level based on actual data
  const overallActivity = habitsPerDay + journalEntriesPerDay + (goalsPerDay * 2); // Goals weighted 2x
  const engagementLevel = overallActivity > 3 ? 'high' : overallActivity > 1.5 ? 'medium' : 'low';
  
  // Achievement-specific time estimates based on real patterns
  let baseDays = 7;
  let complexityMultiplier = 1;
  
  switch (achievement.category) {
    case AchievementCategory.HABITS:
      baseDays = Math.max(2, Math.ceil(10 / Math.max(habitsPerDay, 0.5)));
      complexityMultiplier = achievement.condition.target > 50 ? 1.5 : 1;
      break;
      
    case AchievementCategory.JOURNAL:
      baseDays = Math.max(1, Math.ceil(7 / Math.max(journalEntriesPerDay, 0.5)));
      complexityMultiplier = achievement.condition.target > 30 ? 1.3 : 1;
      break;
      
    case AchievementCategory.GOALS:
      baseDays = Math.max(3, Math.ceil(14 / Math.max(goalsPerDay * 2, 0.3)));
      complexityMultiplier = achievement.condition.target > 10 ? 1.4 : 1;
      break;
      
    case AchievementCategory.CONSISTENCY:
      // Consistency achievements naturally take longer
      baseDays = Math.max(7, 30 - (userStats.appUsageStreak * 2));
      complexityMultiplier = achievement.condition.target > 14 ? 1.6 : 1.2;
      break;
      
    case AchievementCategory.GOALS:
      baseDays = engagementLevel === 'high' ? 5 : engagementLevel === 'medium' ? 12 : 25;
      complexityMultiplier = 1.1;
      break;
      
    default:
      baseDays = 7;
      complexityMultiplier = 1;
  }
  
  // Apply rarity modifier (rarer achievements typically take longer)
  const rarityMultiplier = achievement.rarity === AchievementRarity.LEGENDARY ? 1.5 :
                          achievement.rarity === AchievementRarity.EPIC ? 1.3 :
                          achievement.rarity === AchievementRarity.RARE ? 1.1 : 1;
  
  // Calculate final estimate
  const estimatedDays = Math.max(1, Math.round(baseDays * complexityMultiplier * rarityMultiplier));
  
  // Format the result naturally
  if (estimatedDays === 1) {
    return "Achieved in 1 day";
  } else if (estimatedDays <= 3) {
    return `Achieved in ${estimatedDays} days`;
  } else if (estimatedDays < 14) {
    return `Achieved in ${estimatedDays} days`;
  } else if (estimatedDays < 60) {
    const weeks = Math.round(estimatedDays / 7);
    return `Achieved in ${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.round(estimatedDays / 30);
    return `Achieved in ${months} month${months > 1 ? 's' : ''}`;
  }
};

// ========================================
// COMPLETION INFORMATION
// ========================================

export const generateCompletionInfo = (achievement: Achievement, userStats: UserStats, t?: TFunction): CompletionInfo => {
  const accomplishment = getAccomplishmentText(achievement, t);
  const category = getCategoryDisplayName(achievement.category);
  const difficulty = getDifficultyLevel(achievement.rarity);

  return {
    accomplishment,
    completionDate: formatCompletionDate(achievement.unlockedAt), // PHASE 3: Real completion date
    timeToComplete: calculateTimeToComplete(achievement, userStats), // PHASE 3: Real time estimate
    category,
    difficultyLevel: difficulty
  };
};

const getAccomplishmentText = (achievement: Achievement, t?: TFunction): string => {
  // If t function provided, use i18n keys for localized accomplishment text
  if (t) {
    const accomplishment = t(`achievements.achievementRequirements.${achievement.id}`);
    if (accomplishment && !accomplishment.includes('achievements.achievementRequirements')) {
      return accomplishment;
    }
  }

  // Fallback to hardcoded texts (for backward compatibility)
  const accomplishments: Record<string, string> = {
    // Habits
    'first-habit': "Created your first habit",
    'habit-builder': "Created 5 different habits",
    'century-club': "Completed 100 habits total",
    'consistency-king': "Completed 1000 habits total",
    'habit-streak-champion': "Achieved 21-day habit streak",
    'century-streak': "Maintained 75-day habit streak",
    'multi-tasker': "Completed 5 habits in one day",
    'habit-legend': "Reached Level 50 with 50%+ habit XP",

    // Journal
    'first-journal': "Wrote your first journal entry",
    'deep-thinker': "Wrote detailed 200+ character entry",
    'journal-enthusiast': "Wrote 100 journal entries",
    'grateful-heart': "Maintained 7-day journal streak",
    'first-star': "Earned a star",
    'five-stars': "Earned 5 stars",
    'flame-achiever': "Earned your first flame",
    'bonus-week': "1 bonus daily for 7 days",
    'crown-royalty': "Earned your first crown",
    'flame-collector': "Earned 5 flames total",
    'golden-bonus-streak': "3+ bonuses daily for 7 days",
    'triple-crown-master': "Earned 3 crowns total",
    'bonus-century': "Wrote 200 bonus entries",
    'star-beginner': "Earned 10 stars total",
    'star-collector': "Earned 25 stars total",
    'star-master': "Earned 50 stars total",
    'star-champion': "Earned 100 stars total",
    'star-legend': "Earned 200 stars total",
    'flame-starter': "Earned 5 flames total",
    'flame-accumulator': "Earned 10 flames total",
    'flame-master': "Earned 25 flames total",
    'flame-champion': "Earned 50 flames total",
    'flame-legend': "Earned 100 flames total",
    'crown-achiever': "Earned 3 crowns total",
    'crown-collector': "Earned 5 crowns total",
    'crown-master': "Earned 10 crowns total",
    'crown-champion': "Earned 25 crowns total",
    'crown-emperor': "Earned 50 crowns total",
    'gratitude-guru': "Maintained 30-day journal streak",
    'eternal-gratitude': "Achieved 100-day journal streak",
    'bonus-seeker': "Wrote 50 bonus journal entries",
    'gratitude-guardian': "Wrote 21 days in a row",

    // Goals
    'first-goal': "Set your first goal",
    'goal-getter': "Completed your first goal",
    'ambitious': "Set ambitious goal (≥1000 target)",
    'goal-champion': "Completed 5 goals",
    'progress-tracker': "Made progress 7 days straight",
    'mega-dreamer': "Set mega goal (≥1M target)",
    'achievement-unlocked': "Completed 10 goals",
    'million-achiever': "Completed 1M+ goal",

    // Consistency
    'weekly-warrior': "Maintained 7-day habit streak",
    'monthly-master': "Achieved 30-day habit streak",
    'centurion': "Reached 100 days of consistency",
    'daily-visitor': "Used app for 7 consecutive days",
    'dedicated-user': "Used app for 30 consecutive days",
    'perfect-month': "Completed all 3 features for 28+ days",
    'triple-crown': "Maintained 7+ day streaks in all areas",

    // Mastery
    'dream-fulfiller': "Completed 3 goals",
    'level-up': "Reached level 10",
    'selfrise-expert': "Reached level 25",
    'selfrise-master': "Reached level 50",
    'ultimate-selfrise-legend': "Reached level 100",
    'recommendation-master': "Followed 20 recommendations",
    'balance-master': "Used all 3 features 10 times in a day",
    'trophy-collector-basic': "Unlocked 10 achievements",
    'trophy-collector-master': "Unlocked 25 achievements",

    // Special
    'lightning-start': "Created and completed habit same day 3 times",
    'seven-wonder': "Had 7+ active habits simultaneously",
    'persistence-pays': "Completed 7 activities after 3+ day break",
    'selfrise-legend': "Achieved mastery in all areas",

    // Loyalty
    'loyalty-first-week': "Stayed active for 7 days total",
    'loyalty-two-weeks-strong': "Stayed active for 14 days total",
    'loyalty-three-weeks-committed': "Stayed active for 21 days total",
    'loyalty-month-explorer': "Stayed active for 30 days total",
    'loyalty-two-month-veteran': "Stayed active for 60 days total",
    'loyalty-century-user': "Stayed active for 100 days total",
    'loyalty-half-year-hero': "Stayed active for 183 days total",
    'loyalty-year-legend': "Stayed active for 365 days total",
    'loyalty-ultimate-veteran': "Stayed active for 500 days total",
    'loyalty-master': "Achieved ultimate loyalty with 1000 active days"
  };

  return accomplishments[achievement.id] || "Completed achievement requirements";
};

const getCategoryDisplayName = (category: AchievementCategory): string => {
  const names = {
    [AchievementCategory.HABITS]: "Habits Category",
    [AchievementCategory.JOURNAL]: "Journal Category",
    [AchievementCategory.GOALS]: "Goals Category",
    [AchievementCategory.CONSISTENCY]: "Consistency Category",
    [AchievementCategory.MASTERY]: "Mastery Category",
    [AchievementCategory.SPECIAL]: "Special Category",
  };
  return names[category] || "Achievement Category";
};

const getDifficultyLevel = (rarity: AchievementRarity): string => {
  const difficulties = {
    [AchievementRarity.COMMON]: "Easy",
    [AchievementRarity.RARE]: "Medium", 
    [AchievementRarity.EPIC]: "Hard",
    [AchievementRarity.LEGENDARY]: "Legendary"
  };
  return difficulties[rarity] || "Unknown";
};

// ========================================
// SMART TOOLTIPS
// ========================================

export const generateSmartTooltip = (achievement: Achievement, progress: number): SmartTooltip => {
  const progressLevel = getProgressLevel(progress);
  
  return {
    primaryTip: getPrimaryTip(achievement, progressLevel),
    motivationalMessage: getMotivationalMessage(progressLevel),
    actionAdvice: getActionAdvice(achievement, progressLevel),
    estimatedEffort: getEffortEstimate(achievement, progress)
  };
};

const getProgressLevel = (progress: number): 'starting' | 'building' | 'advancing' | 'nearly_there' => {
  if (progress < 10) return 'starting';
  if (progress < 50) return 'building';
  if (progress < 85) return 'advancing';
  return 'nearly_there';
};

const getPrimaryTip = (achievement: Achievement, level: 'starting' | 'building' | 'advancing' | 'nearly_there'): string => {
  const categoryTips: Record<AchievementCategory, Record<'starting' | 'building' | 'advancing' | 'nearly_there', string>> = {
    [AchievementCategory.HABITS]: {
      starting: "Start by creating and completing habits daily",
      building: "Focus on consistency with your existing habits",
      advancing: "You're building great habit momentum!",
      nearly_there: "So close to this habit achievement!"
    },
    [AchievementCategory.JOURNAL]: {
      starting: "Begin with daily gratitude entries",
      building: "Keep up your journal writing practice",
      advancing: "Your gratitude practice is growing strong!",
      nearly_there: "Almost unlocked this journal achievement!"
    },
    [AchievementCategory.GOALS]: {
      starting: "Start by setting and working on your goals",
      building: "Keep making progress on your goals",
      advancing: "Excellent goal progress!",
      nearly_there: "Almost completed this goal achievement!"
    },
    [AchievementCategory.CONSISTENCY]: {
      starting: "Focus on building daily consistency",
      building: "Your consistency is improving!",
      advancing: "Great consistency streak building!",
      nearly_there: "So close to mastering consistency!"
    },
    [AchievementCategory.MASTERY]: {
      starting: "Explore all features to gain mastery",
      building: "You're learning the app well!",
      advancing: "Becoming a true SelfRise expert!",
      nearly_there: "Almost achieved mastery level!"
    },
    [AchievementCategory.SPECIAL]: {
      starting: "Explore special app features",
      building: "Making good use of special features!",
      advancing: "Unlocking special capabilities!",
      nearly_there: "Almost earned this special achievement!"
    }
  };
  
  return categoryTips[achievement.category]?.[level] || "Keep working towards this achievement!";
};

const getMotivationalMessage = (level: 'starting' | 'building' | 'advancing' | 'nearly_there'): string => {
  const messages: Record<'starting' | 'building' | 'advancing' | 'nearly_there', string> = {
    starting: "Every journey begins with a single step! 🌱",
    building: "You're building great momentum! 💪", 
    advancing: "Excellent progress - keep it up! 🚀",
    nearly_there: "So close to unlocking this achievement! 🎯"
  };
  return messages[level];
};

const getActionAdvice = (achievement: Achievement, level: 'starting' | 'building' | 'advancing' | 'nearly_there'): string => {
  const advice: Record<AchievementCategory, string> = {
    [AchievementCategory.HABITS]: "Complete habits daily to make progress",
    [AchievementCategory.JOURNAL]: "Write journal entries regularly",
    [AchievementCategory.GOALS]: "Set and work towards your goals",
    [AchievementCategory.CONSISTENCY]: "Maintain daily streaks",
    [AchievementCategory.MASTERY]: "Earn XP and level up",
    [AchievementCategory.SPECIAL]: "Explore all app features",
  };
  
  return advice[achievement.category] || "Keep using the app features";
};

const getEffortEstimate = (achievement: Achievement, progress: number): string | undefined => {
  if (progress >= 90) return "Almost there!";
  if (progress >= 70) return "A few more days";
  if (progress >= 40) return "~1-2 weeks";
  if (progress >= 20) return "~2-4 weeks";
  return "Several weeks of effort";
};

// ========================================
// HELPERS
// ========================================

const getDefaultProgressHint = (achievement: Achievement, t: TFunction): ProgressHint => {
  return {
    progressText: t('achievements.preview.default.progress'),
    progressPercentage: 0,
    isCompleted: false,
    requirementText: achievement.descriptionKey, // Translation key - will be translated at component level
    actionHint: t('achievements.preview.default.action')
  };
};