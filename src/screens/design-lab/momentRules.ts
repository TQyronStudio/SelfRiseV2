/**
 * When the remaining celebrations are a window and when a quiet note (kolo 39).
 * Free of React Native so it can be tested.
 *
 * - A new level is never a window of its own (R-29). The one exception worth a
 *   window is entering a new TIER — the level's colour and name of the stage
 *   change, five times in the whole life of an account (levels 11/21/41/61/81).
 *   The round "milestone" levels (10/25/50/100) are celebrated by the trophy they
 *   unlock, through the trophy rules.
 * - The journal streak has 17 celebrated lengths in the app, every one a window
 *   today. The first week and the lengths people talk about (a month, a hundred
 *   days, a year, a thousand) stay a window; the others become a quiet note.
 *   Which lengths pay XP is the app's business (journalStreakMilestones.ts).
 *
 * GOING LIVE (1:1): the streak lengths come from the app's own list
 * (journalStreakMilestones.ts); the tier ranges from the levels journey.
 */
import { isJournalStreakMilestone } from '@/src/utils/journalStreakMilestones';
import type { LabTierId } from './labTokens';
import { tierOf } from './levelsJourney';

/** The tier a level-up moved the user into, or null if they stayed in theirs. */
export function tierEntered(
  previousLevel: number,
  newLevel: number
): LabTierId | null {
  if (newLevel <= previousLevel || newLevel < 1) return null;
  const now = tierOf(newLevel).id;
  // Level 0 (no level yet) stands at the first tier — where everyone starts is
  // not news.
  return tierOf(previousLevel).id === now ? null : now;
}

/** Journal streak lengths that keep a full window. */
export const STREAK_WINDOW_DAYS: readonly number[] = [7, 30, 100, 365, 1000];

export type MomentSize = 'window' | 'quiet';

/** How a journal streak length is celebrated; null = an ordinary day. */
export function streakMomentSize(days: number): MomentSize | null {
  if (!isJournalStreakMilestone(days)) return null;
  return STREAK_WINDOW_DAYS.includes(days) ? 'window' : 'quiet';
}
