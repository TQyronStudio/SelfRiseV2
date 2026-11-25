/**
 * The facts of Home's Insights card (migration E11e; tested in
 * __tests__/homeInsightsLogic.test.ts). The card replaces HabitPerformanceIndicators
 * and HabitTrendAnalysis; the numbers come from the SAME calculations
 * HabitTrendAnalysis made (moved here unchanged):
 * - four weekly rates, oldest first (calculateHabitCompletionRate per habit,
 *   averaged), into the fixed overallTrend (habitTrendLogic.ts);
 * - each active habit's rate over the last 28 days since it was created.
 *
 * What the card says (decisions E11/5, data map E11) — a row only when its fact
 * exists:
 * - the trend only when it goes UP (a drop is covered kindly by "worth a look",
 *   never a second piece of bad news);
 * - the strongest habit: an established habit (14+ days) with the best 28-day
 *   rate, at least STRONG_FROM — praise for 30 % would be hollow;
 * - worth a look: the established habit with the lowest rate, under FOCUS_BELOW
 *   (the threshold HabitTrendAnalysis used; the old Performance card named the
 *   last of a ranking even at 100 %).
 */
import { DateString } from '@/src/types/common';
import { Habit } from '@/src/types/habit';
import { formatDateToString, getDayOfWeekFromDateString, subtractDays } from '@/src/utils/date';
import { calculateHabitCompletionRate, getHabitAgeInfo } from '@/src/utils/habitCalculations';
import { wasScheduledOnDate } from '@/src/utils/habitImmutability';
import { overallTrend } from '@/src/components/home/habitTrendLogic';
import type { HabitOnDate } from './homeChartsLogic';

/** Weeks the card looks back over (its period line says so). */
export const INSIGHT_WEEKS = 4;
export const STRONG_FROM = 50;
export const FOCUS_BELOW = 50;

type HabitsOn = (date: DateString) => HabitOnDate[];

function creationDay(habit: Habit): DateString {
  return formatDateToString(new Date(habit.createdAt));
}

/** One habit over some dates: planned, done of planned, completions off the plan. */
function tally(habit: Habit, dates: DateString[], habitsOn: HabitsOn) {
  let scheduledDays = 0;
  let completedScheduled = 0;
  let bonusCompletions = 0;
  for (const date of dates) {
    const scheduled = wasScheduledOnDate(habit, date, getDayOfWeekFromDateString(date));
    const onDate = habitsOn(date).find(h => h.id === habit.id);
    if (scheduled) {
      scheduledDays++;
      if (onDate?.isCompleted) completedScheduled++;
    } else if (onDate?.isCompleted) {
      bonusCompletions++;
    }
  }
  return { scheduledDays, completedScheduled, bonusCompletions };
}

/**
 * The last four weekly rates, OLDEST first; null = nothing to rate that week.
 * All habits count (a habit paused now keeps its past weeks).
 */
export function weeklyRates(
  habits: Habit[],
  habitsOn: HabitsOn,
  today: DateString
): (number | null)[] {
  const weeks: (number | null)[] = [];
  for (let i = 0; i < INSIGHT_WEEKS; i++) {
    const start = subtractDays(today, i * 7 + 6);
    const dates = Array.from({ length: 7 }, (_, j) => subtractDays(start, -j));
    let sum = 0;
    let rated = 0;
    for (const habit of habits) {
      const relevant = dates.filter(date => date >= creationDay(habit));
      if (relevant.length === 0) continue;
      const counts = tally(habit, relevant, habitsOn);
      if (counts.scheduledDays === 0 && counts.bonusCompletions === 0) continue;
      sum += calculateHabitCompletionRate(habit, counts).totalCompletionRate;
      rated++;
    }
    weeks.unshift(rated > 0 ? Math.round(sum / rated) : null);
  }
  return weeks;
}

export interface HabitRate {
  name: string;
  rate: number;
  /** 14+ days old: enough history to name it (new users are not judged). */
  established: boolean;
}

/** Each ACTIVE habit's rate over the last 28 days since it was created. */
export function habitRates(
  habits: Habit[],
  habitsOn: HabitsOn,
  today: DateString
): HabitRate[] {
  const days = Array.from({ length: INSIGHT_WEEKS * 7 }, (_, i) =>
    subtractDays(today, INSIGHT_WEEKS * 7 - 1 - i)
  );
  return habits
    .filter(habit => habit.isActive)
    .map(habit => {
      const relevant = days.filter(date => date >= creationDay(habit));
      const counts = tally(habit, relevant, habitsOn);
      return {
        name: habit.name,
        rate: Math.round(calculateHabitCompletionRate(habit, counts).totalCompletionRate),
        established: getHabitAgeInfo(habit).isEstablishedHabit,
      };
    });
}

export interface Insights {
  /** Points the last two weeks beat the two before; null = no rise to tell. */
  trendUp: number | null;
  strongest: { name: string; rate: number } | null;
  focus: { name: string; rate: number } | null;
}

export function insightsOf(
  weeklyOldestFirst: (number | null)[],
  rates: HabitRate[]
): Insights {
  const trend = overallTrend(weeklyOldestFirst);
  const established = rates.filter(r => r.established);
  const best = [...established].sort((a, b) => b.rate - a.rate)[0];
  const worst = [...established].sort((a, b) => a.rate - b.rate)[0];
  return {
    trendUp: trend.trend === 'improving' ? Math.round(trend.change) : null,
    strongest:
      best && best.rate >= STRONG_FROM ? { name: best.name, rate: best.rate } : null,
    focus:
      worst && worst.rate < FOCUS_BELOW ? { name: worst.name, rate: worst.rate } : null,
  };
}

export function hasInsights(insights: Insights): boolean {
  return (
    insights.trendUp !== null ||
    insights.strongest !== null ||
    insights.focus !== null
  );
}
