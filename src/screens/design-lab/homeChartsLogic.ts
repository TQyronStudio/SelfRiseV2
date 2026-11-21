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
 */

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
