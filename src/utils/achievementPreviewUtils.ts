// Achievement Preview System Utilities
// Provides progress hints, requirements, and completion information for all achievements

import { Achievement, AchievementRarity, AchievementCategory } from '../types/gamification';
import { getGratitudeStorageImpl } from '../config/featureFlags';

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

export const generateProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.category) {
    case AchievementCategory.HABITS:
      return generateHabitProgressHint(achievement, userStats);
    case AchievementCategory.JOURNAL:
      return generateJournalProgressHint(achievement, userStats);
    case AchievementCategory.GOALS:
      return generateGoalProgressHint(achievement, userStats);
    case AchievementCategory.CONSISTENCY:
      return generateConsistencyProgressHint(achievement, userStats);
    case AchievementCategory.CONSISTENCY:
      return generateMasteryProgressHint(achievement, userStats);
    case AchievementCategory.CONSISTENCY:
      return generateSpecialProgressHint(achievement, userStats);
    default:
      return getDefaultProgressHint(achievement);
  }
};

// Asynchronous version for achievements that need async data
export const generateProgressHintAsync = async (achievement: Achievement, userStats: UserStats): Promise<ProgressHint> => {
  switch (achievement.category) {
    case AchievementCategory.HABITS:
      return generateHabitProgressHint(achievement, userStats);
    case AchievementCategory.JOURNAL:
      return await generateJournalProgressHintAsync(achievement, userStats);
    case AchievementCategory.GOALS:
      return generateGoalProgressHint(achievement, userStats);
    case AchievementCategory.CONSISTENCY:
      return generateConsistencyProgressHint(achievement, userStats);
    case AchievementCategory.CONSISTENCY:
      return generateMasteryProgressHint(achievement, userStats);
    case AchievementCategory.CONSISTENCY:
      return generateSpecialProgressHint(achievement, userStats);
    default:
      return getDefaultProgressHint(achievement);
  }
};

// ========================================
// CATEGORY-SPECIFIC HINTS
// ========================================

const generateHabitProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'first-habit':
      return {
        progressText: userStats.habitsCreated === 0 ? "Create your first habit to begin!" : "✅ First habit created!",
        progressPercentage: userStats.habitsCreated > 0 ? 100 : 0,
        isCompleted: userStats.habitsCreated > 0,
        requirementText: "Create your very first habit",
        actionHint: "Go to Habits tab and create your first habit!"
      };
      
    case 'habit-builder':
      const created = Math.min(userStats.habitsCreated, 5);
      return {
        progressText: `Create 5 habits (${created}/5)`,
        progressPercentage: (created / 5) * 100,
        isCompleted: created >= 5,
        requirementText: "Create 5 different habits to diversify development",
        actionHint: "Create more habits to diversify your growth!",
        estimatedDays: Math.max(0, 5 - created)
      };
      
    case 'century-club':
      const completed = Math.min(userStats.totalHabitCompletions, 100);
      return {
        progressText: `Complete 100 habits (${completed}/100)`,
        progressPercentage: (completed / 100) * 100,
        isCompleted: completed >= 100,
        requirementText: "Complete 100 habit tasks total",
        actionHint: "Keep completing your daily habits!",
        estimatedDays: Math.ceil((100 - completed) / 2) // Assuming 2 habits per day
      };
      
    case 'consistency-king':
      const total = Math.min(userStats.totalHabitCompletions, 1000);
      return {
        progressText: `Complete 1000 habits (${total}/1000)`,
        progressPercentage: (total / 1000) * 100,
        isCompleted: total >= 1000,
        requirementText: "Complete 1000 habit tasks total",
        actionHint: "You're building amazing consistency!",
        estimatedDays: Math.ceil((1000 - total) / 3) // Assuming 3 habits per day
      };
      
    case 'streak-champion':
      const streak = Math.min(userStats.longestHabitStreak, 21);
      return {
        progressText: `Achieve 21-day streak (best: ${userStats.longestHabitStreak} days)`,
        progressPercentage: (streak / 21) * 100,
        isCompleted: userStats.longestHabitStreak >= 21,
        requirementText: "Achieve a 21-day streak with any single habit",
        actionHint: "Focus on consistency with one habit!",
        estimatedDays: Math.max(0, 21 - userStats.longestHabitStreak)
      };
      
    case 'century-streak':
      const longStreak = Math.min(userStats.longestHabitStreak, 75);
      return {
        progressText: `Achieve 75-day streak (best: ${userStats.longestHabitStreak} days)`,
        progressPercentage: (longStreak / 75) * 100,
        isCompleted: userStats.longestHabitStreak >= 75,
        requirementText: "Maintain a 75-day streak with any habit",
        actionHint: "Incredible dedication! Keep the streak alive!",
        estimatedDays: Math.max(0, 75 - userStats.longestHabitStreak)
      };
      
    case 'multi-tasker':
      const maxInDay = Math.min(userStats.maxHabitsInOneDay, 5);
      return {
        progressText: `Complete 5 habits in one day (best: ${userStats.maxHabitsInOneDay})`,
        progressPercentage: (maxInDay / 5) * 100,
        isCompleted: userStats.maxHabitsInOneDay >= 5,
        requirementText: "Complete 5 different habits in a single day",
        actionHint: "Challenge yourself with multiple habits today!"
      };
      
    case 'habit-legend':
      const levelProgress = userStats.currentLevel >= 50 && (userStats.xpFromHabits / userStats.totalXP) >= 0.5;
      return {
        progressText: `Reach Level 50 with 50%+ XP from habits (Level ${userStats.currentLevel}, ${Math.round((userStats.xpFromHabits / userStats.totalXP) * 100)}% habit XP)`,
        progressPercentage: levelProgress ? 100 : Math.min((userStats.currentLevel / 50) * 50 + ((userStats.xpFromHabits / userStats.totalXP) * 50), 100),
        isCompleted: levelProgress,
        requirementText: "Reach Level 50 with 50%+ XP from habit activities",
        actionHint: "Focus on habit activities to boost your XP ratio!"
      };
      
    default:
      return getDefaultProgressHint(achievement);
  }
};

const generateJournalProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'first-journal':
      return {
        progressText: userStats.journalEntries === 0 ? "Write your first gratitude entry!" : "✅ First reflection completed!",
        progressPercentage: userStats.journalEntries > 0 ? 100 : 0,
        isCompleted: userStats.journalEntries > 0,
        requirementText: "Write your first gratitude journal entry",
        actionHint: "Go to Journal tab and write your first entry!"
      };
      
    case 'deep-thinker':
      // Synchronous fallback - shows progress as pending async load
      return {
        progressText: "Checking your thoughtful entries...",
        progressPercentage: 0,
        isCompleted: false,
        requirementText: "Write a journal entry with at least 200 characters",
        actionHint: "Express yourself fully in your next journal entry! (Use async version for real progress)"
      };
      
    case 'journal-enthusiast':
      const entries = Math.min(userStats.totalJournalEntries, 100);
      return {
        progressText: `Write 100 journal entries (${entries}/100)`,
        progressPercentage: (entries / 100) * 100,
        isCompleted: entries >= 100,
        requirementText: "Write 100 journal entries total",
        actionHint: "Keep expressing gratitude daily!",
        estimatedDays: Math.ceil((100 - entries) / 1) // 1 entry per day
      };
      
    case 'grateful-heart':
      const currentStreak = Math.min(userStats.currentJournalStreak, 7);
      return {
        progressText: `Maintain 7-day streak (current: ${userStats.currentJournalStreak} days)`,
        progressPercentage: (currentStreak / 7) * 100,
        isCompleted: userStats.currentJournalStreak >= 7,
        requirementText: "Maintain a 7-day journal writing streak",
        actionHint: "Keep your streak alive with daily entries!",
        estimatedDays: Math.max(0, 7 - userStats.currentJournalStreak)
      };
      
    case 'journal-streaker':
      const streak21 = Math.min(userStats.longestJournalStreak, 21);
      return {
        progressText: `Achieve 21-day streak (best: ${userStats.longestJournalStreak} days)`,
        progressPercentage: (streak21 / 21) * 100,
        isCompleted: userStats.longestJournalStreak >= 21,
        requirementText: "Write in your journal for 21 consecutive days",
        actionHint: "Building a strong gratitude habit!",
        estimatedDays: Math.max(0, 21 - userStats.longestJournalStreak)
      };
      
    case 'gratitude-guru':
      const streak30 = Math.min(userStats.longestJournalStreak, 30);
      return {
        progressText: `Achieve 30-day streak (best: ${userStats.longestJournalStreak} days)`,
        progressPercentage: (streak30 / 30) * 100,
        isCompleted: userStats.longestJournalStreak >= 30,
        requirementText: "Achieve a 30-day journal writing streak",
        actionHint: "You're becoming a gratitude master!",
        estimatedDays: Math.max(0, 30 - userStats.longestJournalStreak)
      };
      
    case 'eternal-gratitude':
      const streak100 = Math.min(userStats.longestJournalStreak, 100);
      return {
        progressText: `Achieve 100-day streak (best: ${userStats.longestJournalStreak} days)`,
        progressPercentage: (streak100 / 100) * 100,
        isCompleted: userStats.longestJournalStreak >= 100,
        requirementText: "Maintain a 100-day journal streak",
        actionHint: "Incredible dedication to gratitude!",
        estimatedDays: Math.max(0, 100 - userStats.longestJournalStreak)
      };
      
    case 'bonus-seeker':
      const bonusEntries = Math.min(userStats.bonusJournalEntries, 50);
      return {
        progressText: `Write 50 bonus entries (${bonusEntries}/50)`,
        progressPercentage: (bonusEntries / 50) * 100,
        isCompleted: bonusEntries >= 50,
        requirementText: "Write 50 bonus journal entries",
        actionHint: "Go beyond the daily minimum with bonus entries!",
        estimatedDays: Math.ceil((50 - bonusEntries) / 2) // Assuming 2 bonus per day
      };

    // ========================================
    // NEW JOURNAL BONUS ACHIEVEMENTS (24 achievements)
    // Added: 2025-08-30 - Complete ⭐🔥👑 milestone system
    // ========================================

    // --- BASIC BONUS ACHIEVEMENTS (9 achievements) ---

    case 'first-star':
      return {
        progressText: userStats.starCount === 0 ? "Get your first ⭐ bonus milestone!" : "✅ First star earned!",
        progressPercentage: userStats.starCount > 0 ? 100 : 0,
        isCompleted: userStats.starCount > 0,
        requirementText: "Write your first bonus journal entry to get a star",
        actionHint: "Write 4+ journal entries today to earn your first ⭐!"
      };

    case 'five-stars':
      const stars5 = Math.min(userStats.starCount, 5);
      return {
        progressText: `Earn 5 stars total (${stars5}/5)`,
        progressPercentage: (stars5 / 5) * 100,
        isCompleted: stars5 >= 5,
        requirementText: "Earn ⭐ milestone 5 times total",
        actionHint: "Keep writing bonus entries to earn more stars!",
        estimatedDays: Math.max(0, 5 - stars5)
      };

    case 'flame-achiever':
      return {
        progressText: userStats.flameCount === 0 ? "Get your first 🔥 flame milestone!" : "✅ First flame earned!",
        progressPercentage: userStats.flameCount > 0 ? 100 : 0,
        isCompleted: userStats.flameCount > 0,
        requirementText: "Write 5+ bonus entries in one day to earn a flame",
        actionHint: "Challenge yourself with 8+ journal entries in one day!"
      };

    case 'bonus-week':
      const bonusWeek = Math.min(userStats.bonusStreakDays, 7);
      return {
        progressText: `Bonus streak 7 days (${bonusWeek}/7)`,
        progressPercentage: (bonusWeek / 7) * 100,
        isCompleted: bonusWeek >= 7,
        requirementText: "Write at least 1 bonus entry for 7 consecutive days",
        actionHint: "Write 4+ entries daily to maintain your bonus streak!",
        estimatedDays: Math.max(0, 7 - bonusWeek)
      };

    case 'crown-royalty':
      return {
        progressText: userStats.crownCount === 0 ? "Get your first 👑 crown milestone!" : "✅ First crown earned!",
        progressPercentage: userStats.crownCount > 0 ? 100 : 0,
        isCompleted: userStats.crownCount > 0,
        requirementText: "Write 10+ bonus entries in one day to earn a crown",
        actionHint: "Go for royal status with 13+ journal entries in one day!"
      };

    case 'flame-collector':
      const flameCollector = Math.min(userStats.flameCount, 5);
      return {
        progressText: `Collect 5 flames total (${flameCollector}/5)`,
        progressPercentage: (flameCollector / 5) * 100,
        isCompleted: flameCollector >= 5,
        requirementText: "Earn 🔥 milestone 5 times total",
        actionHint: "Keep having intense gratitude days with 5+ bonus entries!",
        estimatedDays: Math.max(0, 5 - flameCollector) * 7 // Rough estimate
      };

    case 'golden-bonus-streak':
      const goldenStreak = Math.min(userStats.goldenBonusStreakDays, 7);
      return {
        progressText: `Golden bonus streak 7 days (${goldenStreak}/7)`,
        progressPercentage: (goldenStreak / 7) * 100,
        isCompleted: goldenStreak >= 7,
        requirementText: "Write 3+ bonus entries daily for 7 consecutive days",
        actionHint: "Write 6+ entries daily for the ultimate bonus streak!",
        estimatedDays: Math.max(0, 7 - goldenStreak)
      };

    case 'triple-crown-master':
      const tripleCrown = Math.min(userStats.crownCount, 3);
      return {
        progressText: `Earn 3 crowns total (${tripleCrown}/3)`,
        progressPercentage: (tripleCrown / 3) * 100,
        isCompleted: tripleCrown >= 3,
        requirementText: "Earn 👑 milestone 3 times total",
        actionHint: "Master the art of royal gratitude days!",
        estimatedDays: Math.max(0, 3 - tripleCrown) * 30 // Rough estimate
      };

    case 'bonus-century':
      const bonusCentury = Math.min(userStats.bonusJournalEntries, 200);
      return {
        progressText: `Write 200 bonus entries (${bonusCentury}/200)`,
        progressPercentage: (bonusCentury / 200) * 100,
        isCompleted: bonusCentury >= 200,
        requirementText: "Write 200 bonus journal entries total",
        actionHint: "Ultimate bonus mastery - keep writing beyond the minimum!",
        estimatedDays: Math.ceil((200 - bonusCentury) / 2) // Assuming 2 bonus per day
      };

    // --- STAR MILESTONE ACHIEVEMENTS (5 achievements) ---

    case 'star-beginner':
      const starBeginner = Math.min(userStats.starCount, 10);
      return {
        progressText: `Earn 10 stars total (${starBeginner}/10)`,
        progressPercentage: (starBeginner / 10) * 100,
        isCompleted: starBeginner >= 10,
        requirementText: "Earn ⭐ milestone 10 times total",
        actionHint: "Build your collection of bonus days!",
        estimatedDays: Math.max(0, 10 - starBeginner)
      };

    case 'star-collector':
      const starCollector = Math.min(userStats.starCount, 25);
      return {
        progressText: `Earn 25 stars total (${starCollector}/25)`,
        progressPercentage: (starCollector / 25) * 100,
        isCompleted: starCollector >= 25,
        requirementText: "Earn ⭐ milestone 25 times total",
        actionHint: "You're becoming a star collector!",
        estimatedDays: Math.max(0, 25 - starCollector)
      };

    case 'star-master':
      const starMaster = Math.min(userStats.starCount, 50);
      return {
        progressText: `Earn 50 stars total (${starMaster}/50)`,
        progressPercentage: (starMaster / 50) * 100,
        isCompleted: starMaster >= 50,
        requirementText: "Earn ⭐ milestone 50 times total",
        actionHint: "Master level star achievement!",
        estimatedDays: Math.max(0, 50 - starMaster)
      };

    case 'star-champion':
      const starChampion = Math.min(userStats.starCount, 100);
      return {
        progressText: `Earn 100 stars total (${starChampion}/100)`,
        progressPercentage: (starChampion / 100) * 100,
        isCompleted: starChampion >= 100,
        requirementText: "Earn ⭐ milestone 100 times total",
        actionHint: "Champion level dedication to bonus gratitude!",
        estimatedDays: Math.max(0, 100 - starChampion)
      };

    case 'star-legend':
      const starLegend = Math.min(userStats.starCount, 200);
      return {
        progressText: `Earn 200 stars total (${starLegend}/200)`,
        progressPercentage: (starLegend / 200) * 100,
        isCompleted: starLegend >= 200,
        requirementText: "Earn ⭐ milestone 200 times total",
        actionHint: "Legendary star collector status!",
        estimatedDays: Math.max(0, 200 - starLegend)
      };

    // --- FLAME MILESTONE ACHIEVEMENTS (5 achievements) ---

    case 'flame-starter':
      const flameStarter = Math.min(userStats.flameCount, 5);
      return {
        progressText: `Earn 5 flames total (${flameStarter}/5)`,
        progressPercentage: (flameStarter / 5) * 100,
        isCompleted: flameStarter >= 5,
        requirementText: "Earn 🔥 milestone 5 times total",
        actionHint: "Starting your flame collection!",
        estimatedDays: Math.max(0, 5 - flameStarter) * 7
      };

    case 'flame-accumulator':
      const flameAccumulator = Math.min(userStats.flameCount, 10);
      return {
        progressText: `Earn 10 flames total (${flameAccumulator}/10)`,
        progressPercentage: (flameAccumulator / 10) * 100,
        isCompleted: flameAccumulator >= 10,
        requirementText: "Earn 🔥 milestone 10 times total",
        actionHint: "Accumulating intense gratitude days!",
        estimatedDays: Math.max(0, 10 - flameAccumulator) * 14
      };

    case 'flame-master':
      const flameMaster = Math.min(userStats.flameCount, 25);
      return {
        progressText: `Earn 25 flames total (${flameMaster}/25)`,
        progressPercentage: (flameMaster / 25) * 100,
        isCompleted: flameMaster >= 25,
        requirementText: "Earn 🔥 milestone 25 times total",
        actionHint: "Master of systematic intense days!",
        estimatedDays: Math.max(0, 25 - flameMaster) * 10
      };

    case 'flame-champion':
      const flameChampion = Math.min(userStats.flameCount, 50);
      return {
        progressText: `Earn 50 flames total (${flameChampion}/50)`,
        progressPercentage: (flameChampion / 50) * 100,
        isCompleted: flameChampion >= 50,
        requirementText: "Earn 🔥 milestone 50 times total",
        actionHint: "Champion of deep daily reflection!",
        estimatedDays: Math.max(0, 50 - flameChampion) * 7
      };

    case 'flame-legend':
      const flameLegend = Math.min(userStats.flameCount, 100);
      return {
        progressText: `Earn 100 flames total (${flameLegend}/100)`,
        progressPercentage: (flameLegend / 100) * 100,
        isCompleted: flameLegend >= 100,
        requirementText: "Earn 🔥 milestone 100 times total",
        actionHint: "Legendary master of intense gratitude!",
        estimatedDays: Math.max(0, 100 - flameLegend) * 4
      };

    // --- CROWN MILESTONE ACHIEVEMENTS (5 achievements) ---

    case 'crown-achiever':
      const crownAchiever = Math.min(userStats.crownCount, 3);
      return {
        progressText: `Earn 3 crowns total (${crownAchiever}/3)`,
        progressPercentage: (crownAchiever / 3) * 100,
        isCompleted: crownAchiever >= 3,
        requirementText: "Earn 👑 milestone 3 times total",
        actionHint: "Achieve royal reflection days!",
        estimatedDays: Math.max(0, 3 - crownAchiever) * 60
      };

    case 'crown-collector':
      const crownCollector = Math.min(userStats.crownCount, 5);
      return {
        progressText: `Earn 5 crowns total (${crownCollector}/5)`,
        progressPercentage: (crownCollector / 5) * 100,
        isCompleted: crownCollector >= 5,
        requirementText: "Earn 👑 milestone 5 times total",
        actionHint: "Collecting royal gratitude experiences!",
        estimatedDays: Math.max(0, 5 - crownCollector) * 45
      };

    case 'crown-master':
      const crownMaster = Math.min(userStats.crownCount, 10);
      return {
        progressText: `Earn 10 crowns total (${crownMaster}/10)`,
        progressPercentage: (crownMaster / 10) * 100,
        isCompleted: crownMaster >= 10,
        requirementText: "Earn 👑 milestone 10 times total",
        actionHint: "Master of royal-level reflection!",
        estimatedDays: Math.max(0, 10 - crownMaster) * 30
      };

    case 'crown-champion':
      const crownChampion = Math.min(userStats.crownCount, 25);
      return {
        progressText: `Earn 25 crowns total (${crownChampion}/25)`,
        progressPercentage: (crownChampion / 25) * 100,
        isCompleted: crownChampion >= 25,
        requirementText: "Earn 👑 milestone 25 times total",
        actionHint: "Champion of royal gratitude days!",
        estimatedDays: Math.max(0, 25 - crownChampion) * 14
      };

    case 'crown-emperor':
      const crownEmperor = Math.min(userStats.crownCount, 50);
      return {
        progressText: `Earn 50 crowns total (${crownEmperor}/50)`,
        progressPercentage: (crownEmperor / 50) * 100,
        isCompleted: crownEmperor >= 50,
        requirementText: "Earn 👑 milestone 50 times total",
        actionHint: "Imperial status in deep reflection practice!",
        estimatedDays: Math.max(0, 50 - crownEmperor) * 7
      };
      
    default:
      return getDefaultProgressHint(achievement);
  }
};

// Async version for journal achievements that need real-time data
const generateJournalProgressHintAsync = async (achievement: Achievement, userStats: UserStats): Promise<ProgressHint> => {
  switch (achievement.id) {
    case 'first-journal':
      return {
        progressText: userStats.journalEntries === 0 ? "Write your first gratitude entry!" : "✅ First reflection completed!",
        progressPercentage: userStats.journalEntries > 0 ? 100 : 0,
        isCompleted: userStats.journalEntries > 0,
        requirementText: "Write your first gratitude journal entry",
        actionHint: "Go to Journal tab and write your first entry!"
      };
      
    case 'deep-thinker':
      const deepThinkingData = await checkDeepThinkingEntries();
      return {
        progressText: deepThinkingData.hasDeepEntry 
          ? `✅ Deep thinking achieved! (${deepThinkingData.totalLongEntries} entries ≥200 chars)`
          : `Write thoughtfully (longest: ${deepThinkingData.longestEntry} chars, need: 200+)`,
        progressPercentage: deepThinkingData.hasDeepEntry ? 100 : Math.min((deepThinkingData.longestEntry / 200) * 100, 99),
        isCompleted: deepThinkingData.hasDeepEntry,
        requirementText: "Write a journal entry with at least 200 characters",
        actionHint: deepThinkingData.hasDeepEntry 
          ? "You've mastered thoughtful reflection!" 
          : `Express yourself more fully! You need ${Math.max(0, 200 - deepThinkingData.longestEntry)} more characters.`
      };
      
    default:
      // For other journal achievements, use the sync version
      return generateJournalProgressHint(achievement, userStats);
  }
};

const generateGoalProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'first-goal':
      return {
        progressText: userStats.goalsCreated === 0 ? "Set your first goal to start!" : "✅ First goal set!",
        progressPercentage: userStats.goalsCreated > 0 ? 100 : 0,
        isCompleted: userStats.goalsCreated > 0,
        requirementText: "Set your first goal",
        actionHint: "Go to Goals tab and create your first goal!"
      };
      
    case 'goal-getter':
      return {
        progressText: userStats.completedGoals === 0 ? "Complete your first goal!" : "✅ First goal completed!",
        progressPercentage: userStats.completedGoals > 0 ? 100 : 0,
        isCompleted: userStats.completedGoals > 0,
        requirementText: "Complete your first goal",
        actionHint: "Finish one of your goals to unlock this!"
      };
      
    case 'goal-achiever':
      const completed3 = Math.min(userStats.completedGoals, 3);
      return {
        progressText: `Complete 3 goals (${completed3}/3)`,
        progressPercentage: (completed3 / 3) * 100,
        isCompleted: completed3 >= 3,
        requirementText: "Complete 3 goals",
        actionHint: "Keep working towards your goals!",
        estimatedDays: (3 - completed3) * 30 // Rough estimate
      };
      
    case 'goal-champion':
      const completed5 = Math.min(userStats.completedGoals, 5);
      return {
        progressText: `Complete 5 goals (${completed5}/5)`,
        progressPercentage: (completed5 / 5) * 100,
        isCompleted: completed5 >= 5,
        requirementText: "Complete 5 goals",
        actionHint: "You're becoming a goal champion!",
        estimatedDays: (5 - completed5) * 30
      };
      
    case 'achievement-unlocked':
      const completed10 = Math.min(userStats.completedGoals, 10);
      return {
        progressText: `Complete 10 goals (${completed10}/10)`,
        progressPercentage: (completed10 / 10) * 100,
        isCompleted: completed10 >= 10,
        requirementText: "Complete 10 goals",
        actionHint: "Ultimate goal achievement awaits!",
        estimatedDays: (10 - completed10) * 30
      };
      
    case 'ambitious':
      return {
        progressText: userStats.hasLargeGoal ? "✅ Ambitious goal set!" : "Set a goal with target ≥1000",
        progressPercentage: userStats.hasLargeGoal ? 100 : 0,
        isCompleted: userStats.hasLargeGoal,
        requirementText: "Set a goal with target value of 1000 or more",
        actionHint: "Dream big with an ambitious goal!"
      };
      
    case 'progress-tracker':
      const progressStreak = Math.min(userStats.goalProgressStreak, 7);
      return {
        progressText: `Make progress 7 days straight (${progressStreak}/7)`,
        progressPercentage: (progressStreak / 7) * 100,
        isCompleted: progressStreak >= 7,
        requirementText: "Make progress on goals for 7 consecutive days",
        actionHint: "Update your goal progress daily!",
        estimatedDays: Math.max(0, 7 - progressStreak)
      };
      
    default:
      return getDefaultProgressHint(achievement);
  }
};

const generateConsistencyProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'weekly-warrior':
      const weekStreak = Math.min(userStats.longestHabitStreak, 7);
      return {
        progressText: `Maintain 7-day streak (best: ${userStats.longestHabitStreak} days)`,
        progressPercentage: (weekStreak / 7) * 100,
        isCompleted: userStats.longestHabitStreak >= 7,
        requirementText: "Maintain a 7-day streak in any habit",
        actionHint: "Focus on consistency with one habit!"
      };
      
    case 'monthly-master':
      const monthStreak = Math.min(userStats.longestHabitStreak, 30);
      return {
        progressText: `Achieve 30-day streak (best: ${userStats.longestHabitStreak} days)`,
        progressPercentage: (monthStreak / 30) * 100,
        isCompleted: userStats.longestHabitStreak >= 30,
        requirementText: "Achieve a 30-day streak",
        actionHint: "You're building incredible consistency!"
      };
      
    case 'hundred-days':
      const centStreak = Math.min(userStats.longestHabitStreak, 100);
      return {
        progressText: `Reach 100 days consistency (best: ${userStats.longestHabitStreak} days)`,
        progressPercentage: (centStreak / 100) * 100,
        isCompleted: userStats.longestHabitStreak >= 100,
        requirementText: "Reach 100 days of consistency",
        actionHint: "Legendary consistency achievement!"
      };
      
    case 'daily-visitor':
      const appStreak = Math.min(userStats.appUsageStreak, 7);
      return {
        progressText: `Use app 7 days straight (${appStreak}/7)`,
        progressPercentage: (appStreak / 7) * 100,
        isCompleted: appStreak >= 7,
        requirementText: "Use the app for 7 consecutive days",
        actionHint: "Open the app daily!"
      };
      
    case 'dedicated-user':
      const appStreak30 = Math.min(userStats.appUsageStreak, 30);
      return {
        progressText: `Use app 30 days straight (${appStreak30}/30)`,
        progressPercentage: (appStreak30 / 30) * 100,
        isCompleted: appStreak30 >= 30,
        requirementText: "Use the app for 30 consecutive days",
        actionHint: "You're becoming a dedicated user!"
      };
      
    case 'perfect-month':
      const perfectDays = Math.min(userStats.perfectMonthDays, 28);
      return {
        progressText: `Perfect month days (${perfectDays}/28)`,
        progressPercentage: (perfectDays / 28) * 100,
        isCompleted: perfectDays >= 28,
        requirementText: "Complete activities in all 3 areas for 28+ days in a month",
        actionHint: "Use habits, journal, and goals every day this month!"
      };
      
    case 'triple-crown':
      return {
        progressText: userStats.hasTripleCrown ? "✅ Triple Crown achieved!" : "Maintain 7+ day streaks in all areas simultaneously",
        progressPercentage: userStats.hasTripleCrown ? 100 : 0,
        isCompleted: userStats.hasTripleCrown,
        requirementText: "Maintain 7+ day streaks in habits, journal, and goals simultaneously",
        actionHint: "Build consistent streaks across all three features!"
      };
      
    default:
      return getDefaultProgressHint(achievement);
  }
};

const generateMasteryProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'level-up':
      const level10 = Math.min(userStats.currentLevel, 10);
      return {
        progressText: `Reach level 10 (current: Level ${userStats.currentLevel})`,
        progressPercentage: (level10 / 10) * 100,
        isCompleted: userStats.currentLevel >= 10,
        requirementText: "Reach level 10",
        actionHint: "Earn more XP to level up!"
      };
      
    case 'selfrise-expert':
      const level25 = Math.min(userStats.currentLevel, 25);
      return {
        progressText: `Reach level 25 (current: Level ${userStats.currentLevel})`,
        progressPercentage: (level25 / 25) * 100,
        isCompleted: userStats.currentLevel >= 25,
        requirementText: "Reach level 25",
        actionHint: "You're becoming a SelfRise expert!"
      };
      
    case 'selfrise-master':
      const level50 = Math.min(userStats.currentLevel, 50);
      return {
        progressText: `Reach level 50 (current: Level ${userStats.currentLevel})`,
        progressPercentage: (level50 / 50) * 100,
        isCompleted: userStats.currentLevel >= 50,
        requirementText: "Reach level 50",
        actionHint: "Master level achievement awaits!"
      };
      
    case 'ultimate-selfrise-legend':
      const level100 = Math.min(userStats.currentLevel, 100);
      return {
        progressText: `Reach level 100 (current: Level ${userStats.currentLevel})`,
        progressPercentage: (level100 / 100) * 100,
        isCompleted: userStats.currentLevel >= 100,
        requirementText: "Reach level 100",
        actionHint: "Ultimate legend status - incredible!"
      };
      
    case 'trophy-collector-basic':
      const achievements10 = Math.min(userStats.unlockedAchievements, 10);
      return {
        progressText: `Unlock 10 achievements (${achievements10}/10)`,
        progressPercentage: (achievements10 / 10) * 100,
        isCompleted: achievements10 >= 10,
        requirementText: "Unlock 10 achievements",
        actionHint: "Keep unlocking achievements!"
      };
      
    case 'trophy-collector-master':
      const achievements25 = Math.min(userStats.unlockedAchievements, 25);
      return {
        progressText: `Unlock 25 achievements (${achievements25}/25)`,
        progressPercentage: (achievements25 / 25) * 100,
        isCompleted: achievements25 >= 25,
        requirementText: "Unlock 25 achievements",
        actionHint: "You're a true trophy master!"
      };
      
    case 'recommendation-master':
      const recs = Math.min(userStats.recommendationsFollowed, 20);
      return {
        progressText: `Follow recommendations (${recs}/20)`,
        progressPercentage: (recs / 20) * 100,
        isCompleted: recs >= 20,
        requirementText: "Follow 20 personalized recommendations",
        actionHint: "Check the For You section for personalized tips!",
        estimatedDays: Math.ceil((20 - recs) / 2) // Assuming 2 recommendations per day
      };
      
    case 'balance-master':
      const comboDays = Math.min(userStats.dailyFeatureComboDays, 10);
      return {
        progressText: `All-feature days (${comboDays}/10)`,
        progressPercentage: (comboDays / 10) * 100,
        isCompleted: comboDays >= 10,
        requirementText: "Use all 3 features (habits, journal, goals) in a single day 10 times",
        actionHint: "Try to use habits, journal, and goals all in one day!",
        estimatedDays: Math.max(0, 10 - comboDays)
      };
      
    default:
      return getDefaultProgressHint(achievement);
  }
};

const generateSpecialProgressHint = (achievement: Achievement, userStats: UserStats): ProgressHint => {
  switch (achievement.id) {
    case 'lightning-start':
      const sameDay = Math.min(userStats.samedayHabitCreationCompletions, 3);
      return {
        progressText: `Same-day habit creation & completion (${sameDay}/3)`,
        progressPercentage: (sameDay / 3) * 100,
        isCompleted: sameDay >= 3,
        requirementText: "Create and complete a habit on the same day 3 times",
        actionHint: "Create a habit and complete it immediately today!",
        estimatedDays: Math.max(0, 3 - sameDay)
      };
      
    case 'seven-wonder':
      const activeHabits = Math.min(userStats.activeHabitsSimultaneous, 7);
      return {
        progressText: `Active habits simultaneously (${activeHabits}/7)`,
        progressPercentage: (activeHabits / 7) * 100,
        isCompleted: activeHabits >= 7,
        requirementText: "Have 7 or more active habits at the same time",
        actionHint: "Create more habits to reach the 7-habit milestone!"
      };
      
    case 'persistence-pays':
      const comeback = Math.min(userStats.comebackActivities, 7);
      return {
        progressText: `Comeback activities completed (${comeback}/7)`,
        progressPercentage: (comeback / 7) * 100,
        isCompleted: comeback >= 7,
        requirementText: "Resume after 3+ day break and complete 7 activities",
        actionHint: "Complete more activities after returning from a break!"
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
        progressText: `Ultimate mastery: Goals ${goals}/10, Habits ${habits}/500, Entries ${entries}/365`,
        progressPercentage: overallProgress,
        isCompleted: goals >= 10 && habits >= 500 && entries >= 365,
        requirementText: "Complete 10 goals + 500 habits + 365 journal entries",
        actionHint: "Master all areas of SelfRise for legendary status!"
      };
    
    // Loyalty achievements
    case 'loyalty-first-week':
      const days7 = Math.min(userStats.totalActiveDays, 7);
      return {
        progressText: `Total active days (${userStats.totalActiveDays}/7)`,
        progressPercentage: (days7 / 7) * 100,
        isCompleted: userStats.totalActiveDays >= 7,
        requirementText: "Be active for 7 days total",
        actionHint: "Use the app daily to build your streak!",
        estimatedDays: Math.max(0, 7 - userStats.totalActiveDays)
      };
      
    case 'loyalty-two-weeks-strong':
      const days14 = Math.min(userStats.totalActiveDays, 14);
      return {
        progressText: `Total active days (${userStats.totalActiveDays}/14)`,
        progressPercentage: (days14 / 14) * 100,
        isCompleted: userStats.totalActiveDays >= 14,
        requirementText: "Be active for 14 days total",
        actionHint: "Your dedication is growing stronger!",
        estimatedDays: Math.max(0, 14 - userStats.totalActiveDays)
      };
      
    case 'loyalty-three-weeks-committed':
      const days21 = Math.min(userStats.totalActiveDays, 21);
      return {
        progressText: `Total active days (${userStats.totalActiveDays}/21)`,
        progressPercentage: (days21 / 21) * 100,
        isCompleted: userStats.totalActiveDays >= 21,
        requirementText: "Be active for 21 days total",
        actionHint: "You're truly committed to your growth!",
        estimatedDays: Math.max(0, 21 - userStats.totalActiveDays)
      };
      
    case 'loyalty-month-explorer':
      const days30 = Math.min(userStats.totalActiveDays, 30);
      return {
        progressText: `Total active days (${userStats.totalActiveDays}/30)`,
        progressPercentage: (days30 / 30) * 100,
        isCompleted: userStats.totalActiveDays >= 30,
        requirementText: "Be active for 30 days total",
        actionHint: "Explore your potential with daily consistency!",
        estimatedDays: Math.max(0, 30 - userStats.totalActiveDays)
      };
      
    case 'loyalty-two-month-veteran':
      const days60 = Math.min(userStats.totalActiveDays, 60);
      return {
        progressText: `Total active days (${userStats.totalActiveDays}/60)`,
        progressPercentage: (days60 / 60) * 100,
        isCompleted: userStats.totalActiveDays >= 60,
        requirementText: "Be active for 60 days total",
        actionHint: "You're becoming a veteran in personal growth!",
        estimatedDays: Math.max(0, 60 - userStats.totalActiveDays)
      };
      
    case 'loyalty-century-user':
      const days100 = Math.min(userStats.totalActiveDays, 100);
      return {
        progressText: `Total active days (${userStats.totalActiveDays}/100)`,
        progressPercentage: (days100 / 100) * 100,
        isCompleted: userStats.totalActiveDays >= 100,
        requirementText: "Be active for 100 days total",
        actionHint: "Join the elite ranks of century users!",
        estimatedDays: Math.max(0, 100 - userStats.totalActiveDays)
      };
      
    case 'loyalty-half-year-hero':
      const days183 = Math.min(userStats.totalActiveDays, 183);
      return {
        progressText: `Total active days (${userStats.totalActiveDays}/183)`,
        progressPercentage: (days183 / 183) * 100,
        isCompleted: userStats.totalActiveDays >= 183,
        requirementText: "Be active for 183 days total (half year)",
        actionHint: "Your commitment is legendary!",
        estimatedDays: Math.max(0, 183 - userStats.totalActiveDays)
      };
      
    case 'loyalty-year-legend':
      const days365 = Math.min(userStats.totalActiveDays, 365);
      return {
        progressText: `Total active days (${userStats.totalActiveDays}/365)`,
        progressPercentage: (days365 / 365) * 100,
        isCompleted: userStats.totalActiveDays >= 365,
        requirementText: "Be active for 365 days total (full year)",
        actionHint: "Legendary status achieved through dedication!",
        estimatedDays: Math.max(0, 365 - userStats.totalActiveDays)
      };
      
    case 'loyalty-ultimate-veteran':
      const days500 = Math.min(userStats.totalActiveDays, 500);
      return {
        progressText: `Total active days (${userStats.totalActiveDays}/500)`,
        progressPercentage: (days500 / 500) * 100,
        isCompleted: userStats.totalActiveDays >= 500,
        requirementText: "Be active for 500 days total",
        actionHint: "Your dedication is unmatched!",
        estimatedDays: Math.max(0, 500 - userStats.totalActiveDays)
      };
      
    case 'loyalty-master':
      const days1000 = Math.min(userStats.totalActiveDays, 1000);
      return {
        progressText: `Total active days (${userStats.totalActiveDays}/1000)`,
        progressPercentage: (days1000 / 1000) * 100,
        isCompleted: userStats.totalActiveDays >= 1000,
        requirementText: "Be active for 1000 days total (ultimate loyalty)",
        actionHint: "You have achieved ultimate loyalty mastery!",
        estimatedDays: Math.max(0, 1000 - userStats.totalActiveDays)
      };
      
    default:
      return getDefaultProgressHint(achievement);
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

export const generateCompletionInfo = (achievement: Achievement, userStats: UserStats): CompletionInfo => {
  const accomplishment = getAccomplishmentText(achievement);
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

const getAccomplishmentText = (achievement: Achievement): string => {
  const accomplishments: Record<string, string> = {
    // Habits
    'first-habit': "Created your first habit",
    'habit-builder': "Created 5 different habits", 
    'century-club': "Completed 100 habits total",
    'consistency-king': "Completed 1000 habits total",
    'streak-champion': "Achieved 21-day habit streak",
    'century-streak': "Maintained 75-day habit streak",
    'multi-tasker': "Completed 5 habits in one day",
    'habit-legend': "Reached Level 50 with 50%+ habit XP",
    
    // Journal
    'first-journal': "Wrote your first journal entry",
    'deep-thinker': "Wrote detailed 200+ character entry",
    'journal-enthusiast': "Wrote 100 journal entries",
    'grateful-heart': "Maintained 7-day journal streak",
    'journal-streaker': "Achieved 21-day journal streak", 
    'gratitude-guru': "Maintained 30-day journal streak",
    'eternal-gratitude': "Achieved 100-day journal streak",
    'bonus-seeker': "Wrote 50 bonus journal entries",
    
    // Goals
    'first-goal': "Set your first goal",
    'goal-getter': "Completed your first goal",
    'goal-achiever': "Completed 3 goals",
    'goal-champion': "Completed 5 goals",
    'achievement-unlocked': "Completed 10 goals",
    'ambitious': "Set ambitious goal (≥1000 target)",
    'progress-tracker': "Made progress 7 days straight",
    
    // Consistency
    'weekly-warrior': "Maintained 7-day habit streak", 
    'monthly-master': "Achieved 30-day habit streak",
    'hundred-days': "Reached 100 days of consistency",
    'daily-visitor': "Used app for 7 consecutive days",
    'dedicated-user': "Used app for 30 consecutive days",
    'perfect-month': "Completed all 3 features for 28+ days in a month",
    'triple-crown': "Maintained 7+ day streaks in all areas simultaneously",
    
    // Mastery
    'level-up': "Reached level 10",
    'selfrise-expert': "Reached level 25", 
    'selfrise-master': "Reached level 50",
    'ultimate-selfrise-legend': "Reached level 100",
    'trophy-collector-basic': "Unlocked 10 achievements",
    'trophy-collector-master': "Unlocked 25 achievements",
    'recommendation-master': "Followed 20 personalized recommendations",
    'balance-master': "Used all 3 features in a single day 10 times",
    
    // Special
    'lightning-start': "Created and completed habit same day 3 times",
    'seven-wonder': "Had 7+ active habits simultaneously",
    'persistence-pays': "Completed 7 activities after 3+ day break",
    'legendary-master': "Achieved mastery in all areas (10 goals + 500 habits + 365 entries)",
    
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

const getDefaultProgressHint = (achievement: Achievement): ProgressHint => {
  return {
    progressText: "Progress towards this achievement",
    progressPercentage: 0,
    isCompleted: false,
    requirementText: achievement.descriptionKey, // Translation key - will be translated at component level
    actionHint: "Use the app features to unlock this achievement!"
  };
};