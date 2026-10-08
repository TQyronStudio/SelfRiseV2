// Paused habits — no penalty anywhere (device audit 2026-10-08)
//
// Petr's scenario: pause a habit for a vacation, resume it afterwards. Before
// pause periods existed, every scheduled day of the pause came back as a miss:
// red calendar fields, a lower completion rate, Home charts down, and bonus
// completions after the return were spent as "make-up" for the vacation.
// While paused, Home additionally lost the habit's whole PAST (filtered by
// isActive), which rewrote earlier weeks.

import { renderHook } from '@testing-library/react-native';
import { useHabitsData } from '../../src/hooks/useHabitsData';
import { DayOfWeek, HabitColor, HabitIcon } from '../../src/types/common';
import { Habit, HabitCompletion } from '../../src/types/habit';
import { isHabitPausedOnDate } from '../../src/utils/habitImmutability';

const mockUseHabits = jest.fn();

jest.mock('../../src/contexts/HabitsContext', () => ({
  useHabits: () => mockUseHabits(),
}));

const noopActions = {
  loadHabits: jest.fn(),
  createHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
  toggleCompletion: jest.fn(),
  updateHabitOrder: jest.fn(),
  clearError: jest.fn(),
};

// Today = Saturday 2026-05-16. Habit Mon/Wed/Fri since Monday 2026-05-04.
// Paused Sat 05-09 (start) → resumed Fri 05-15 (end, exclusive):
// the scheduled Mon 05-11 and Wed 05-13 fall inside the pause.
function makeHabit(overrides: Partial<Habit> = {}): Habit {
  const createdAt = new Date(2026, 4, 4, 9, 0, 0);
  return {
    id: 'habit-1',
    name: 'Training',
    color: HabitColor.BLUE,
    icon: HabitIcon.FITNESS,
    scheduledDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
    isActive: true,
    order: 0,
    createdAt,
    updatedAt: createdAt,
    pausePeriods: [{ startDate: '2026-05-09', endDate: '2026-05-15' }],
    ...overrides,
  };
}

/** Same habit with no recorded pause periods at all. */
function withoutPausePeriods(habit: Habit): Habit {
  const { pausePeriods: _ignored, ...rest } = habit;
  return rest;
}

function makeCompletion(date: string, isBonus: boolean): HabitCompletion {
  const createdAt = new Date(`${date}T12:00:00`);
  return {
    id: `completion-${date}`,
    habitId: 'habit-1',
    date,
    completed: true,
    isBonus,
    completedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  };
}

const COMPLETIONS = [
  makeCompletion('2026-05-04', false),
  makeCompletion('2026-05-06', false),
  makeCompletion('2026-05-08', false),
  // — vacation, habit paused —
  makeCompletion('2026-05-15', false),
  makeCompletion('2026-05-16', true), // Saturday bonus after the return
];

function renderUseHabitsData(habits: Habit[], completions: HabitCompletion[]) {
  mockUseHabits.mockReturnValue({
    state: { habits, completions, isLoading: false, error: null },
    actions: noopActions,
  });
  const { result } = renderHook(() => useHabitsData());
  if (!result.current) throw new Error('useHabitsData did not render');
  return result.current;
}

describe('useHabitsData — paused days are never missed days', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 16, 12, 0, 0));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('completion rate ignores the paused days (no penalty for the vacation)', () => {
    const habit = makeHabit();
    const result = renderUseHabitsData([habit], COMPLETIONS);

    const stats = result.getHabitStats(habit.id)!;
    // Scheduled outside the pause: 05-04, 05-06, 05-08, 05-15 — all done
    expect(stats.scheduledDays).toBe(4);
    expect(stats.completedScheduled).toBe(4);
    expect(stats.completionRate).toBeGreaterThanOrEqual(100);
  });

  it('a bonus after the return stays a bonus — it is not spent covering the vacation', () => {
    const habit = makeHabit();
    const result = renderUseHabitsData([habit], COMPLETIONS);

    const converted = result.getHabitCompletionsWithConversion(habit.id);
    expect(converted.find(c => c.date === '2026-05-16')).toMatchObject({
      completed: true,
      isBonus: true,
    });
    expect(converted.find(c => c.date === '2026-05-16')?.isConverted).toBeFalsy();
    // No "missed" or "covered" records for the paused Monday / Wednesday
    expect(converted.find(c => c.date === '2026-05-11')).toBeUndefined();
    expect(converted.find(c => c.date === '2026-05-13')).toBeUndefined();
  });

  it('Home day data: the habit is out of play on paused days, in play before and after', () => {
    const habit = makeHabit();
    const result = renderUseHabitsData([habit], COMPLETIONS);

    expect(result.getHabitsByDate('2026-05-11')).toHaveLength(0);
    expect(result.getHabitsByDate('2026-05-06')).toEqual([
      expect.objectContaining({ id: 'habit-1', isCompleted: true }),
    ]);
    expect(result.getHabitsByDate('2026-05-15')).toEqual([
      expect.objectContaining({ id: 'habit-1', isCompleted: true }),
    ]);
  });

  it('while still paused, the habit keeps its past on Home and is out of play today', () => {
    const habit = makeHabit({
      isActive: false,
      pausePeriods: [{ startDate: '2026-05-09' }], // open — not resumed yet
    });
    const result = renderUseHabitsData([habit], COMPLETIONS.slice(0, 3));

    expect(result.getHabitsByDate('2026-05-06')).toEqual([
      expect.objectContaining({ id: 'habit-1', isCompleted: true }),
    ]);
    expect(result.getHabitsByDate('2026-05-16')).toHaveLength(0);
  });
});

describe('isHabitPausedOnDate', () => {
  it('covers start..end exclusive', () => {
    const habit = makeHabit();
    expect(isHabitPausedOnDate(habit, '2026-05-08')).toBe(false);
    expect(isHabitPausedOnDate(habit, '2026-05-09')).toBe(true);
    expect(isHabitPausedOnDate(habit, '2026-05-14')).toBe(true);
    expect(isHabitPausedOnDate(habit, '2026-05-15')).toBe(false);
  });

  it('safety net: a paused habit with no recorded period counts as paused since its last update', () => {
    const habit = withoutPausePeriods(makeHabit({
      isActive: false,
      updatedAt: new Date(2026, 4, 9, 18, 0, 0),
    }));
    expect(isHabitPausedOnDate(habit, '2026-05-08')).toBe(false);
    expect(isHabitPausedOnDate(habit, '2026-05-09')).toBe(true);
    expect(isHabitPausedOnDate(habit, '2026-05-16')).toBe(true);
  });

  it('an active habit without periods is never paused', () => {
    const habit = withoutPausePeriods(makeHabit());
    expect(isHabitPausedOnDate(habit, '2026-05-11')).toBe(false);
  });
});
