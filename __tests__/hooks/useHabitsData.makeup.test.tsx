import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useHabitsData } from '../../src/hooks/useHabitsData';
import { DayOfWeek, HabitColor, HabitIcon } from '../../src/types/common';
import { Habit, HabitCompletion } from '../../src/types/habit';

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

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  const createdAt = new Date('2026-05-04T00:00:00.000Z');

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
    ...overrides,
  };
}

function makeCompletion(date: string, isBonus: boolean, overrides: Partial<HabitCompletion> = {}): HabitCompletion {
  const createdAt = new Date(`${date}T12:00:00.000Z`);

  return {
    id: `completion-${date}`,
    habitId: 'habit-1',
    date,
    completed: true,
    isBonus,
    completedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function renderUseHabitsData(habit: Habit, completions: HabitCompletion[]) {
  mockUseHabits.mockReturnValue({
    state: {
      habits: [habit],
      completions,
      isLoading: false,
      error: null,
    },
    actions: noopActions,
  });

  let result: ReturnType<typeof useHabitsData> | null = null;

  function TestComponent() {
    result = useHabitsData();
    return null;
  }

  act(() => {
    TestRenderer.create(<TestComponent />);
  });

  if (!result) {
    throw new Error('useHabitsData did not render');
  }

  return result;
}

describe('useHabitsData Smart Bonus Conversion / Make-up', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-16T12:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('converts bonus completions into make-up completions for missed scheduled days in the same week', () => {
    const habit = makeHabit();
    const result = renderUseHabitsData(habit, [
      makeCompletion('2026-05-05', true),
      makeCompletion('2026-05-06', false),
      makeCompletion('2026-05-07', true),
    ]);

    const converted = result.getHabitCompletionsWithConversion(habit.id);

    expect(converted.find(c => c.date === '2026-05-05')).toMatchObject({
      completed: true,
      isBonus: false,
      isConverted: true,
      convertedFromDate: '2026-05-04',
    });
    expect(converted.find(c => c.date === '2026-05-07')).toMatchObject({
      completed: true,
      isBonus: false,
      isConverted: true,
      convertedFromDate: '2026-05-08',
    });
    expect(converted.find(c => c.date === '2026-05-04')).toMatchObject({
      completed: false,
      isCovered: true,
    });
    expect(converted.find(c => c.date === '2026-05-08')).toMatchObject({
      completed: false,
      isCovered: true,
    });
  });

  it('only converts as many missed scheduled days as there are bonus completions', () => {
    const habit = makeHabit({
      scheduledDays: [
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
      ],
    });
    const result = renderUseHabitsData(habit, [
      makeCompletion('2026-05-09', true),
      makeCompletion('2026-05-10', true),
    ]);

    const converted = result.getHabitCompletionsWithConversion(habit.id);

    expect(converted.find(c => c.date === '2026-05-09')).toMatchObject({
      isBonus: false,
      isConverted: true,
      convertedFromDate: '2026-05-04',
    });
    expect(converted.find(c => c.date === '2026-05-10')).toMatchObject({
      isBonus: false,
      isConverted: true,
      convertedFromDate: '2026-05-05',
    });
    expect(converted.find(c => c.date === '2026-05-06')).toMatchObject({
      completed: false,
    });
    expect(converted.find(c => c.date === '2026-05-06')?.isCovered).toBeUndefined();
    expect(converted.find(c => c.date === '2026-05-07')).toMatchObject({
      completed: false,
    });
    expect(converted.find(c => c.date === '2026-05-07')?.isCovered).toBeUndefined();
    expect(converted.find(c => c.date === '2026-05-08')).toMatchObject({
      completed: false,
    });
    expect(converted.find(c => c.date === '2026-05-08')?.isCovered).toBeUndefined();
  });

  it('does not use a bonus completion from the next week to cover a previous week miss', () => {
    jest.setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const habit = makeHabit({
      scheduledDays: [DayOfWeek.FRIDAY],
    });
    const result = renderUseHabitsData(habit, [
      makeCompletion('2026-05-11', true),
    ]);

    const converted = result.getHabitCompletionsWithConversion(habit.id);

    expect(converted.find(c => c.date === '2026-05-11')).toMatchObject({
      completed: true,
      isBonus: true,
    });
    expect(converted.find(c => c.date === '2026-05-11')?.isConverted).toBeUndefined();
    expect(converted.find(c => c.date === '2026-05-08')).toBeUndefined();
  });

  it('respects historical schedule changes when deciding what can be made up', () => {
    const habit = makeHabit({
      scheduledDays: [DayOfWeek.TUESDAY],
      scheduleHistory: {
        entries: [
          {
            effectiveFromDate: '2026-05-04',
            scheduledDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
          },
          {
            effectiveFromDate: '2026-05-07',
            scheduledDays: [DayOfWeek.TUESDAY],
          },
        ],
      },
    });
    const result = renderUseHabitsData(habit, [
      makeCompletion('2026-05-05', true),
      makeCompletion('2026-05-06', false),
    ]);

    const converted = result.getHabitCompletionsWithConversion(habit.id);

    expect(converted.find(c => c.date === '2026-05-05')).toMatchObject({
      isBonus: false,
      isConverted: true,
      convertedFromDate: '2026-05-04',
    });
    expect(converted.find(c => c.date === '2026-05-08')).toBeUndefined();
  });

  it('does not create make-up debt for scheduled days before the habit was created', () => {
    const habit = makeHabit({
      scheduledDays: [DayOfWeek.MONDAY],
      createdAt: new Date('2026-05-06T00:00:00.000Z'),
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
    });
    const result = renderUseHabitsData(habit, [
      makeCompletion('2026-05-07', true),
    ]);

    const converted = result.getHabitCompletionsWithConversion(habit.id);

    expect(converted.find(c => c.date === '2026-05-07')).toMatchObject({
      completed: true,
      isBonus: true,
    });
    expect(converted.find(c => c.date === '2026-05-07')?.isConverted).toBeUndefined();
    expect(converted.find(c => c.date === '2026-05-04')).toBeUndefined();
  });

  it('counts make-up completions toward the total completion rate', () => {
    jest.setSystemTime(new Date('2026-05-10T12:00:00.000Z'));

    const habit = makeHabit();
    const result = renderUseHabitsData(habit, [
      makeCompletion('2026-05-05', true),
      makeCompletion('2026-05-06', false),
      makeCompletion('2026-05-07', true),
    ]);

    const stats = result.getHabitStats(habit.id);

    expect(stats?.scheduledDays).toBe(3);
    expect(stats?.completionRate).toBe(100);
  });
});
