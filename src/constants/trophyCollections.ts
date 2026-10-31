// Trophy collections — themed sets of achievements with a one-time XP bonus.
//
// One source of truth for the Trophy Room (TrophyCombinations) and the payout
// (trophyCollectionService). Every id MUST exist in CORE_ACHIEVEMENTS: until
// October 2026 four collections pointed at trophies deleted long ago, so they could
// never be completed. trophyCollections.test.ts now fails on such an id.

import { AchievementCategory, AchievementRarity } from '../types/gamification';

export interface TrophyCollectionDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  requiredAchievements: string[];
  bonusXP: number;
  rarity: AchievementRarity;
  category?: AchievementCategory;
}

export const TROPHY_COLLECTIONS: TrophyCollectionDefinition[] = [
  // Category-based collections
  {
    id: 'habits-master',
    nameKey: 'social.trophy_combinations.collections.habits-master',
    descriptionKey: 'social.achievements_trophies.habitMastery',
    icon: '🏃‍♂️',
    requiredAchievements: [
      'first-habit',
      'weekly-warrior',
      'habit-builder',
      'century-club',
    ],
    bonusXP: 200,
    rarity: AchievementRarity.EPIC,
    category: AchievementCategory.HABITS,
  },
  {
    id: 'journal-sage',
    nameKey: 'social.trophy_combinations.collections.journal-sage',
    descriptionKey: 'social.achievements_trophies.journalMastery',
    icon: '📖',
    requiredAchievements: [
      'first-journal',
      'journal-streaker',
      'journal-enthusiast',
    ],
    bonusXP: 150,
    rarity: AchievementRarity.RARE,
    category: AchievementCategory.JOURNAL,
  },
  {
    id: 'goal-champion',
    nameKey: 'social.trophy_combinations.collections.goal-champion',
    descriptionKey: 'social.achievements_trophies.goalMastery',
    icon: '🎯',
    requiredAchievements: ['first-goal', 'goal-achiever'],
    bonusXP: 100,
    rarity: AchievementRarity.RARE,
    category: AchievementCategory.GOALS,
  },

  // Rarity-based collections
  {
    id: 'legendary-collector',
    nameKey: 'social.trophy_combinations.collections.legendary-collector',
    descriptionKey: 'social.achievements_trophies.legendaryCollector',
    icon: '👑',
    requiredAchievements: ['hundred-days', 'legendary-master'],
    bonusXP: 500,
    rarity: AchievementRarity.LEGENDARY,
  },
  {
    id: 'epic-hunter',
    nameKey: 'social.trophy_combinations.collections.epic-hunter',
    descriptionKey: 'social.achievements_trophies.epicCollector',
    icon: '⚔️',
    requiredAchievements: [
      'monthly-master',
      'century-club',
      'journal-enthusiast',
      'goal-achiever',
      'dedicated-user',
      'persistence-pays',
    ],
    bonusXP: 300,
    rarity: AchievementRarity.EPIC,
  },

  // Special themed collections
  {
    id: 'first-steps',
    nameKey: 'social.trophy_combinations.collections.first-steps',
    descriptionKey: 'social.achievements_trophies.universalBeginning',
    icon: '🌱',
    requiredAchievements: ['first-habit', 'first-journal', 'first-goal'],
    bonusXP: 75,
    rarity: AchievementRarity.COMMON,
  },
  {
    id: 'consistency-king',
    nameKey: 'social.trophy_combinations.collections.consistency-king',
    descriptionKey: 'social.achievements_trophies.consistencyMaster',
    icon: '👑',
    requiredAchievements: [
      'weekly-warrior',
      'monthly-master',
      'journal-streaker',
    ],
    bonusXP: 250,
    rarity: AchievementRarity.EPIC,
    category: AchievementCategory.CONSISTENCY,
  },
  {
    id: 'time-master',
    nameKey: 'social.trophy_combinations.collections.time-master',
    descriptionKey: 'social.achievements_trophies.timeMaster',
    icon: '⏰',
    requiredAchievements: [
      'daily-visitor',
      'dedicated-user',
      'lightning-start',
    ],
    bonusXP: 200,
    rarity: AchievementRarity.EPIC,
    category: AchievementCategory.CONSISTENCY,
  },
];
