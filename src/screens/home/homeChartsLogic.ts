/**
 * The numbers behind Home's habit statistics card (HabitStatsConcept.tsx, kolo 41),
 * free of React Native so they can be tested.
 *
 * One day = how many habits were planned, how many of those were done, and how
 * many bonus completions came on top. The rate is the app's own unified formula
 * (technical-guides:Habits.md, WeeklyHabitChart): ALL completions, bonuses
 * included, over what was planned — so a week with bonuses can read above 100 %.
 *
 * GOING LIVE (1:1): the per-day counts come from useHabitsData exactly as
 * WeeklyHabitChart / Monthly30DayChart / YearlyHabitOverview build them today
 * (Smart Bonus Conversion, covered missed days); only the drawing is new.
 *
 * Moved 1:1 from the Design Lab in migration E11 prep (2026-11-24; the lab keeps
 * its copy — O-6). Wired in E11d (HabitStatsCard) together with `countDay`, the
 * day count of the old WeeklyHabitChart moved here unchanged.
 */
import { DateString, DayOfWeek } from '@/src/types/common';
import { Habit, HabitCompletion } from '@/src/types/habit';
import {
  getDayOfWeekFromDateString,
  subtractDays,
} from '@/src/utils/date';
import { wasScheduledOnDate } from '@/src/utils/habitImmutability';

export interface DayStat {
  /** Habits planned for the day. */
  scheduled: number;
  /** Planned habits that were done (make-ups included). */
  done: number;
  /** Completions on top of the plan. */
  bonus: number;
}

export interface PeriodTotals {
  scheduled: number;
  done: number;
  bonus: number;
  /** Percent, rounded; null when nothing was planned in the period. */
  rate: number | null;
}

export function totalsOf(days: DayStat[]): PeriodTotals {
  const scheduled = days.reduce((sum, d) => sum + d.scheduled, 0);
  const done = days.reduce((sum, d) => sum + d.done, 0);
  const bonus = days.reduce((sum, d) => sum + d.bonus, 0);
  return {
    scheduled,
    done,
    bonus,
    rate: scheduled > 0 ? Math.round(((done + bonus) / scheduled) * 100) : null,
  };
}

/** The tallest thing any bar has to show — never 0, so the scale always exists. */
export function barScale(days: DayStat[]): number {
  return Math.max(1, ...days.map(d => Math.max(d.scheduled, d.done + d.bonus)));
}

export type Trend = 'up' | 'down' | 'same';

/**
 * This period against the one before it, in percentage points. Null when either
 * has nothing planned — there is nothing honest to compare.
 */
export function compareRates(
  current: number | null,
  previous: number | null
): { trend: Trend; points: number } | null {
  if (current === null || previous === null) return null;
  const points = current - previous;
  return {
    trend: points > 0 ? 'up' : points < 0 ? 'down' : 'same',
    points: Math.abs(points),
  };
}

/**
 * May this period be compared with the one before it? Only when the period
 * before lies wholly inside the user's data: a new user's "30 days before"
 * holds one real day and 29 empty ones — "8 points better" would compare a
 * month with a day. `dataStart` = the first day of the data range.
 */
export function comparable(
  previousStart: DateString | undefined,
  dataStart: DateString | undefined
): boolean {
  return !!previousStart && !!dataStart && previousStart >= dataStart;
}

/**
 * A day's shade in the year view: -1 = nothing was planned (a rest day, drawn
 * empty), 0 = planned and nothing done, 1–4 = how much of the plan was done.
 */
export function heatLevel(day: DayStat): -1 | 0 | 1 | 2 | 3 | 4 {
  const made = day.done + day.bonus;
  if (day.scheduled <= 0) return made > 0 ? 4 : -1;
  if (made <= 0) return 0;
  const share = made / day.scheduled;
  if (share >= 1) return 4;
  if (share > 0.5) return 3;
  if (share > 0.25) return 2;
  return 1;
}

/** Days on which at least one habit was done. */
export function activeDays(days: DayStat[]): number {
  return days.filter(d => d.done + d.bonus > 0).length;
}

/**
 * The weekday (0 = Monday … 6 = Sunday) with the best rate over the days given,
 * or null when no weekday had anything planned. Ties go to the earlier weekday.
 */
export function bestWeekday(
  days: (DayStat & { weekday: number })[]
): number | null {
  let best: number | null = null;
  let bestRate = -1;
  for (let weekday = 0; weekday < 7; weekday++) {
    const rate = totalsOf(days.filter(d => d.weekday === weekday)).rate;
    if (rate !== null && rate > bestRate) {
      best = weekday;
      bestRate = rate;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Counting a day — exactly as the old WeeklyHabitChart / Monthly30DayChart did
// ---------------------------------------------------------------------------

const WEEKDAY_INDEX: Record<DayOfWeek, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
} as Record<DayOfWeek, number>;

export type HabitOnDate = Habit & {
  isCompleted: boolean;
  completion?: HabitCompletion;
};

/**
 * One day of the habits (Smart Bonus Conversion applied by the caller's
 * getHabitsByDate): planned = habits that existed and were scheduled that day;
 * done = scheduled completions and make-ups (a bonus converted to cover a missed
 * day); bonus = completions on top. A missed day covered by a make-up stays in
 * the plan — its make-up is counted on the day it was done.
 * Moved unchanged from WeeklyHabitChart (E11d); one classifier for 7, 30 and 365
 * days (the old year view sorted make-ups differently, data map E11).
 */
export function countDay(
  date: DateString,
  habits: Habit[],
  habitsOnDate: HabitOnDate[],
  existedOn: (habit: Habit, date: DateString) => boolean
): DayStat & { weekday: number } {
  const dayOfWeek = getDayOfWeekFromDateString(date);
  const scheduled = habits.filter(
    habit =>
      wasScheduledOnDate(habit, date, dayOfWeek) && existedOn(habit, date)
  ).length;
  let done = 0;
  let bonus = 0;
  for (const h of habitsOnDate) {
    if (!h.isCompleted) continue;
    const completion = h.completion;
    const isScheduled = wasScheduledOnDate(h, date, dayOfWeek);
    if (completion?.isBonus && !completion?.isConverted) bonus++;
    else if (completion?.isConverted && completion?.convertedFromDate) done++;
    else if (isScheduled && !completion?.isBonus) done++;
    else if (!isScheduled && !completion?.isBonus) bonus++;
  }
  return { scheduled, done, bonus, weekday: WEEKDAY_INDEX[dayOfWeek] ?? 0 };
}

/** The last `n` days up to and including `today`, oldest first. */
export function lastDays(today: DateString, n: number): DateString[] {
  return Array.from({ length: n }, (_, i) => subtractDays(today, n - 1 - i));
}
