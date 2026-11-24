/**
 * The weekly average on Home (live bug, 2026-11-24): it divided by all seven
 * days of the week — future ones too — times every habit, whatever its plan, so
 * a perfect Monday showed about 14 %.
 */
import { DayOfWeek } from '@/src/types/common';
import { Habit } from '@/src/types/habit';
import { getWeekDates } from '@/src/utils/date';
import { weekRate } from '../habitPerformanceLogic';

// Monday 23 Nov 2026
const MONDAY = '2026-11-23';
const WEEK = getWeekDates(MONDAY);

const habit = (id: string, days: DayOfWeek[], created = new Date(2026, 10, 1)): Habit =>
  ({
    id,
    name: id,
    color: 'blue',
    icon: 'book',
    scheduledDays: days,
    isActive: true,
    order: 0,
    createdAt: created,
    updatedAt: created,
  }) as Habit;

const doneOn = (map: Record<string, string[]>) => (date: string) =>
  (map[date] ?? []).map(id => ({ id, isCompleted: true }));

describe('weekRate()', () => {
  it('a perfect Monday is 100 %, not a seventh of it', () => {
    const habits = [habit('a', [DayOfWeek.MONDAY, DayOfWeek.FRIDAY]), habit('b', [DayOfWeek.MONDAY])];
    expect(weekRate(habits, WEEK, MONDAY, doneOn({ [MONDAY]: ['a', 'b'] }))).toBe(100);
  });

  it('counts only the habits on the plan that day', () => {
    // b is not planned on Monday: only a is possible, and a is done.
    const habits = [habit('a', [DayOfWeek.MONDAY]), habit('b', [DayOfWeek.TUESDAY])];
    expect(weekRate(habits, WEEK, MONDAY, doneOn({ [MONDAY]: ['a'] }))).toBe(100);
  });

  it('adds a bonus check on top, like every other rate in the app', () => {
    const habits = [habit('a', [DayOfWeek.MONDAY]), habit('b', [DayOfWeek.TUESDAY])];
    expect(weekRate(habits, WEEK, MONDAY, doneOn({ [MONDAY]: ['a', 'b'] }))).toBe(200);
  });

  it('skips days before a habit existed and paused days', () => {
    const fresh = habit('a', [DayOfWeek.MONDAY, DayOfWeek.TUESDAY], new Date(2026, 10, 24));
    const paused = {
      ...habit('p', [DayOfWeek.MONDAY]),
      pausePeriods: [{ startDate: '2026-11-20' }],
    } as Habit;
    const tuesday = '2026-11-24';
    expect(weekRate([fresh, paused], WEEK, tuesday, doneOn({ [tuesday]: ['a'] }))).toBe(100);
  });

  it('is 0 with nothing on the plan', () => {
    expect(weekRate([], WEEK, MONDAY, doneOn({}))).toBe(0);
  });
});
