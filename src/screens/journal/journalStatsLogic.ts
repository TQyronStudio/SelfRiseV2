/**
 * The numbers of the Journal statistics page (migration E13, from the Design
 * Lab's JournalStatsConcept) — pure, tested in __tests__/journalStatsLogic.test.ts.
 * Totals, active days and the daily average are the app's own (GratitudeContext
 * stats); this file counts the last 30 days and the entry types from the entries.
 */
import { DateString } from '@/src/types/common';
import { Gratitude } from '@/src/types/gratitude';
import { subtractDays } from '@/src/utils/date';
import { JOURNAL_DAILY_GOAL, JournalMilestone } from '@/src/utils/journalXp';

export const CHART_DAYS = 30;
/**
 * The chart's scale tops out at 8 entries: one 13-entry day would otherwise
 * squash every normal day to a stub. A taller day reaches the top and carries
 * its value ("13").
 */
export const CHART_SCALE_MAX = 8;

/** Entries per day for the last `days` days, oldest first, today last. */
export function lastDaysCounts(
  entries: Gratitude[],
  today: DateString,
  days = CHART_DAYS
): { date: DateString; count: number }[] {
  const counts = new Map<DateString, number>();
  for (const e of entries) counts.set(e.date, (counts.get(e.date) ?? 0) + 1);
  return Array.from({ length: days }, (_, i) => {
    const date = subtractDays(today, days - 1 - i);
    return { date, count: counts.get(date) ?? 0 };
  });
}

/** Days that reached the daily goal, and the average per day (all days). */
export function chartSummary(counts: number[]): { atGoal: number; average: number } {
  const n = Math.max(1, counts.length);
  return {
    atGoal: counts.filter(c => c >= JOURNAL_DAILY_GOAL).length,
    average: counts.reduce((sum, c) => sum + c, 0) / n,
  };
}

/** The highest milestone a day's count reached (⭐ 4, 🔥 8, 👑 13). */
export function milestoneOfCount(count: number): JournalMilestone | null {
  if (count >= 13) return 'crown';
  if (count >= 8) return 'flame';
  if (count >= 4) return 'star';
  return null;
}

/** Gratitude vs self-praise. */
export function typeSplit(entries: Gratitude[]): { gratitude: number; selfPraise: number } {
  let gratitude = 0;
  let selfPraise = 0;
  for (const e of entries) {
    if (e.type === 'self-praise') selfPraise++;
    else gratitude++;
  }
  return { gratitude, selfPraise };
}

/**
 * The line under the streak: a new record, the best run, or — with no streak
 * ever — the invitation to start (decision E13/1, no "Best: 0 days").
 */
export function streakNote(
  current: number,
  longest: number
): 'personalBest' | 'best' | 'startToday' {
  if (longest <= 0 && current <= 0) return 'startToday';
  if (current > 0 && current >= longest) return 'personalBest';
  return 'best';
}
