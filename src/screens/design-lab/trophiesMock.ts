/**
 * Trophy scenery for the Design Lab (kolo 28). The trophies themselves are REAL —
 * the app's catalog of 75 (names, icons, rarity, XP, secret flag). Only the state
 * is staged: what is unlocked, when, and how far the rest are.
 *
 * Collections are the app's real definitions (src/constants/trophyCollections.ts).
 *
 * GOING LIVE: do NOT port. State comes from AchievementStorage / AchievementService.
 */
import { CORE_ACHIEVEMENTS } from '@/src/constants/achievementCatalog';
import { TROPHY_COLLECTIONS } from '@/src/constants/trophyCollections';
import { Achievement } from '@/src/types/gamification';
import { addDays, startOfDay } from './habitsMock';
import { LabRarity } from './labTokens';

export type TrophyState = {
  achievement: Achievement;
  id: string;
  rarity: LabRarity;
  unlockedOn: Date | null;
  /** 0..1 for a locked trophy. */
  progress: number;
};

const UNLOCKED: string[] = [
  // newest first
  'loyalty-century-user',
  'goal-achiever',
  'star-collector',
  'flame-starter',
  'dedicated-user',
  'monthly-master',
  'crown-royalty',
  'gratitude-guru',
  'journal-enthusiast',
  'progress-tracker',
  'loyalty-two-month-veteran',
  'streak-champion',
  'journal-streaker',
  'star-beginner',
  'level-up',
  'loyalty-month-explorer',
  'trophy-collector-basic',
  'goal-getter',
  'bonus-week',
  'flame-achiever',
  'five-stars',
  'weekly-warrior',
  'daily-visitor',
  'grateful-heart',
  'loyalty-three-weeks-committed',
  'multi-tasker',
  'habit-builder',
  'lightning-start',
  'loyalty-two-weeks-strong',
  'loyalty-first-week',
  'first-star',
  'first-goal',
  'first-journal',
  'first-habit',
];

/** Close calls, so "Coming up" has a story. */
const NEAR: Record<string, number> = {
  'century-club': 0.92,
  'selfrise-expert': 0.84,
  'bonus-seeker': 0.78,
  'star-master': 0.62,
};

function hash(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h / 997;
}

export function trophyStates(today = startOfDay(new Date())): TrophyState[] {
  return CORE_ACHIEVEMENTS.map(achievement => {
    const index = UNLOCKED.indexOf(achievement.id);
    const unlockedOn =
      index >= 0 ? addDays(today, -Math.round(1 + index * 3.6)) : null;
    return {
      achievement,
      id: achievement.id,
      rarity: achievement.rarity as LabRarity,
      unlockedOn,
      progress: unlockedOn
        ? 1
        : (NEAR[achievement.id] ?? Math.round(hash(achievement.id) * 45) / 100),
    };
  });
}

export interface LabCollection {
  id: string;
  icon: string;
  rarity: LabRarity;
  bonusXp: number;
  trophyIds: string[];
}

export const LAB_COLLECTIONS: LabCollection[] = TROPHY_COLLECTIONS.map(set => ({
  id: set.id,
  icon: set.icon,
  rarity: set.rarity as LabRarity,
  bonusXp: set.bonusXP,
  trophyIds: set.requiredAchievements,
}));

export const LAB_ACTIVE_DAYS = 148;
