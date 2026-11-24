/**
 * The weekly average on Home (HabitPerformanceIndicators) — pure, tested in
 * __tests__/habitPerformanceLogic.test.ts.
 *
 * The app's one rule for a completion rate: ALL completions (on plan, make-up,
 * bonus) / the days that were on the plan (utils/habitCalculations). Here pooled
 * over every habit for the days of one week that have already come, each habit
 * from the day it was created. A paused day is not on the plan
 * (wasScheduledOnDate knows the pauses).
 *
 * Until 2026-11-24 the card divided by all seven days of the week (the future
 * ones too) times every habit not paused, whatever its schedule — on a Monday
 * with everything done it showed about 14 %.
 */
import { DateString } from '@/src/types/common';
import { Habit } from '@/src/types/habit';
import { formatDateToString, getDayOfWeekFromDateString } from '@/src/utils/date';
import { wasScheduledOnDate } from '@/src/utils/habitImmutability';

/** What the habits hook returns for a day — only what this rule reads. */
export interface DayHabit {
  id: string;
  isCompleted: boolean;
}

export function weekRate(
  habits: Habit[],
  weekDates: DateString[],
  todayStr: DateString,
  getHabitsByDate: (date: DateString) => DayHabit[]
): number {
  let planned = 0;
  let completed = 0;
  for (const date of weekDates) {
    if (date > todayStr) continue;
    const onDate = getHabitsByDate(date);
    const dayOfWeek = getDayOfWeekFromDateString(date);
    for (const habit of habits) {
      const created = formatDateToString(
        habit.createdAt instanceof Date ? habit.createdAt : new Date(habit.createdAt)
      );
      if (date < created) continue;
      if (wasScheduledOnDate(habit, date, dayOfWeek)) planned++;
      if (onDate.some(h => h.id === habit.id && h.isCompleted)) completed++;
    }
  }
  return planned > 0 ? (completed / planned) * 100 : 0;
}
