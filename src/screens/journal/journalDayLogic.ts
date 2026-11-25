/**
 * The journal day's rules for the Journal screen (migration E12) — pure, tested
 * in __tests__/journalDayLogic.test.ts. The XP side is src/utils/journalXp.ts.
 */
import { JOURNAL_DAILY_GOAL, journalMilestoneAt, JournalMilestone } from '@/src/utils/journalXp';

/** Bonus-road positions after the daily three (4…13). */
export const ROAD_FIRST = JOURNAL_DAILY_GOAL + 1;
export const ROAD_LAST = 13;

/**
 * Did this change complete the day (R-13: the third entry, celebrated in place)?
 * Only ONE new entry taking the count from below three to three — never on the
 * first render, never when the entries load after launch (0 → 5), never on a
 * deletion.
 */
export function completedTheDay(prev: number | null, count: number): boolean {
  return (
    prev !== null &&
    count === prev + 1 &&
    prev < JOURNAL_DAILY_GOAL &&
    count >= JOURNAL_DAILY_GOAL
  );
}

/** The next milestone on the bonus road and how many entries are left to it. */
export function nextMilestone(
  count: number
): { kind: JournalMilestone; left: number } | null {
  for (const at of [4, 8, 13]) {
    if (at > count) return { kind: journalMilestoneAt(at)!, left: at - count };
  }
  return null;
}

/** How far the bonus road is filled, 0…1. */
export function roadProgress(count: number): number {
  const filled = Math.min(Math.max(count, JOURNAL_DAILY_GOAL), ROAD_LAST);
  return (filled - JOURNAL_DAILY_GOAL) / (ROAD_LAST - JOURNAL_DAILY_GOAL);
}

/** The status line under the day's count. */
export function dayStatusKey(count: number):
  | { key: 'journal.progress.entriesNeeded'; count: number }
  | { key: 'journal.progress.dailyComplete' }
  | { key: 'journal.progress.bonusAmazing' } {
  if (count < JOURNAL_DAILY_GOAL)
    return { key: 'journal.progress.entriesNeeded', count: JOURNAL_DAILY_GOAL - count };
  if (count === JOURNAL_DAILY_GOAL) return { key: 'journal.progress.dailyComplete' };
  return { key: 'journal.progress.bonusAmazing' };
}
