/**
 * The pure rules of the Habits list (migration E5): a day's status → shape, the
 * week strip, make-up brackets, pause length and the three sections.
 */
import { DayOfWeek } from '@/src/types/common';
import { Habit, HabitCompletion } from '@/src/types/habit';
import {
  dayStatuses,
  dotLook,
  doneToday,
  makeupLinks,
  sameCardProps,
  pausedDays,
  splitHabits,
  weekFractions,
  weekOf,
} from '../habitListLogic';

// Wednesday 25 Nov 2026; the week runs Mon 23 … Sun 29.
const TODAY = '2026-11-25';
const WEEK = weekOf(TODAY);

const habit = (over: Partial<Habit> = {}): Habit =>
  ({
    id: 'h1',
    name: 'Read',
    color: 'blue',
    icon: 'book',
    scheduledDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
    isActive: true,
    order: 0,
    createdAt: new Date(2026, 10, 1),
    updatedAt: new Date(2026, 10, 1),
    ...over,
  }) as Habit;

const done = (
  date: string,
  over: Partial<HabitCompletion> = {}
): HabitCompletion =>
  ({
    id: `c-${date}`,
    habitId: 'h1',
    date,
    completed: true,
    isBonus: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as HabitCompletion;

const kinds = (m: Map<string, { kind: string }>) =>
  WEEK.map(d => m.get(d)?.kind);

describe('dayStatuses()', () => {
  it('tells done, open today, planned and nothing apart', () => {
    const s = dayStatuses(habit(), [done('2026-11-23')], WEEK, TODAY);
    // Mon done · Tue none · Wed open (today still runs) · Thu none · Fri planned · …
    expect(kinds(s)).toEqual([
      'done',
      'none',
      'todayOpen',
      'none',
      'planned',
      'none',
      'none',
    ]);
  });

  it('marks a past planned day without a check as missed — not today', () => {
    const s = dayStatuses(habit(), [], WEEK, TODAY);
    expect(s.get('2026-11-23')?.kind).toBe('missed');
    expect(s.get(TODAY)?.kind).toBe('todayOpen');
  });

  it('reads the app pairing: the make-up and the day it rescued point at each other', () => {
    const converted = [
      done('2026-11-24', {
        isBonus: false,
        isConverted: true,
        convertedFromDate: '2026-11-23',
      }),
      done('2026-11-23', { id: 'covered', completed: false, isCovered: true }),
    ];
    const s = dayStatuses(habit(), converted, WEEK, TODAY);
    expect(s.get('2026-11-24')).toEqual({
      kind: 'makeup',
      pairKey: '2026-11-23',
    });
    expect(s.get('2026-11-23')).toEqual({
      kind: 'covered',
      pairKey: '2026-11-24',
    });
  });

  it('shows a bonus check that rescued nothing as a bonus', () => {
    const s = dayStatuses(
      habit(),
      [done('2026-11-24', { isBonus: true })],
      WEEK,
      TODAY
    );
    expect(s.get('2026-11-24')?.kind).toBe('bonus');
  });

  it('never calls a paused day missed', () => {
    const paused = habit({
      pausePeriods: [{ startDate: '2026-11-22', endDate: '2026-11-25' }],
    });
    const s = dayStatuses(paused, [], WEEK, TODAY);
    expect(s.get('2026-11-23')?.kind).toBe('paused');
    // The resume day is a normal day again.
    expect(s.get(TODAY)?.kind).toBe('todayOpen');
  });

  it('counts nothing before the habit existed', () => {
    const fresh = habit({ createdAt: new Date(2026, 10, 25) });
    const s = dayStatuses(fresh, [], WEEK, TODAY);
    expect(s.get('2026-11-23')?.kind).toBe('none');
    expect(s.get(TODAY)?.kind).toBe('todayOpen');
  });
});

describe('weekFractions()', () => {
  it('counts a rescued day as kept and a bonus as off the plan', () => {
    const a = new Map([
      ['2026-11-23', { kind: 'covered' as const }],
      ['2026-11-24', { kind: 'bonus' as const }],
      ['2026-11-25', { kind: 'todayOpen' as const }],
    ]);
    const b = new Map([
      ['2026-11-23', { kind: 'missed' as const }],
      ['2026-11-25', { kind: 'done' as const }],
    ]);
    expect(weekFractions([a, b], WEEK).slice(0, 3)).toEqual([0.5, 0, 0.5]);
  });
});

describe('makeupLinks()', () => {
  it('puts overlapping pairs on their own lane (P22)', () => {
    // Thu rescues Mon, Sat rescues Wed: the brackets overlap.
    const week = new Map([
      ['2026-11-26', { kind: 'makeup' as const, pairKey: '2026-11-23' }],
      ['2026-11-28', { kind: 'makeup' as const, pairKey: '2026-11-25' }],
    ]);
    expect(makeupLinks(week, WEEK)).toEqual([
      { from: 0, to: 3, lane: 0 },
      { from: 2, to: 5, lane: 1 },
    ]);
  });

  it('reuses a lane once the earlier pair has ended', () => {
    const week = new Map([
      ['2026-11-24', { kind: 'makeup' as const, pairKey: '2026-11-23' }],
      ['2026-11-27', { kind: 'makeup' as const, pairKey: '2026-11-26' }],
    ]);
    expect(makeupLinks(week, WEEK).map(l => l.lane)).toEqual([0, 0]);
  });
});

describe('dotLook()', () => {
  it('gives every status its own shape; only missed gets a colour of its own', () => {
    expect(dotLook('done')).toEqual({ shape: 'dot', tone: 'habit' });
    expect(dotLook('makeup')).toEqual({ shape: 'dot', tone: 'habit' });
    expect(dotLook('covered')).toEqual({ shape: 'ring', tone: 'habit' });
    expect(dotLook('bonus')).toEqual({ shape: 'star', tone: 'habit' });
    expect(dotLook('missed')).toEqual({ shape: 'cross', tone: 'missed' });
    expect(dotLook('paused')).toEqual({ shape: 'bar', tone: 'faint' });
    expect(dotLook('todayOpen')).toEqual({ shape: 'ring', tone: 'muted' });
    expect(dotLook('planned')).toEqual({ shape: 'ring', tone: 'track' });
    expect(dotLook('none').shape).toBe('tiny');
  });
});

describe('pausedDays()', () => {
  it('counts the open pause, never below zero', () => {
    expect(
      pausedDays(habit({ pausePeriods: [{ startDate: '2026-11-20' }] }), TODAY)
    ).toBe(5);
    // Paused after today's check: the pause starts tomorrow.
    expect(
      pausedDays(habit({ pausePeriods: [{ startDate: '2026-11-26' }] }), TODAY)
    ).toBe(0);
    expect(pausedDays(habit(), TODAY)).toBe(0);
  });
});

describe('splitHabits()', () => {
  it('sorts by the user order into planned, bonus and paused', () => {
    const list = [
      habit({ id: 'c', order: 2, scheduledDays: [DayOfWeek.MONDAY] }),
      habit({ id: 'a', order: 0 }),
      habit({ id: 'p', order: 1, isActive: false }),
    ];
    const { planned, bonus, paused } = splitHabits(list, TODAY);
    expect(planned.map(h => h.id)).toEqual(['a']);
    expect(bonus.map(h => h.id)).toEqual(['c']);
    expect(paused.map(h => h.id)).toEqual(['p']);
  });
});

describe('doneToday()', () => {
  it('only counts a real check of today', () => {
    const list = [done(TODAY), done('2026-11-24', { habitId: 'h2' })];
    expect(doneToday('h1', list, TODAY)).toBe(true);
    expect(doneToday('h2', list, TODAY)).toBe(false);
    expect(doneToday('h1', [done(TODAY, { completed: false })], TODAY)).toBe(
      false
    );
  });
});

describe('sameCardProps()', () => {
  const onToggle = () => undefined;
  const card = (over: object = {}) => ({
    id: 'h1',
    done: false,
    days: ['2026-11-23', '2026-11-24'],
    week: [{ kind: 'done' }, { kind: 'todayOpen' }],
    onToggle,
    ...over,
  });

  it('keeps a card still when the list rebuilt the same data (another habit was checked)', () => {
    expect(
      sameCardProps(
        card(),
        card({
          days: ['2026-11-23', '2026-11-24'],
          week: [{ kind: 'done' }, { kind: 'todayOpen' }],
        })
      )
    ).toBe(true);
  });

  it('re-renders the card whose own data changed', () => {
    expect(sameCardProps(card(), card({ done: true }))).toBe(false);
    expect(
      sameCardProps(
        card(),
        card({ week: [{ kind: 'done' }, { kind: 'done' }] })
      )
    ).toBe(false);
    expect(
      sameCardProps(
        card(),
        card({
          week: [{ kind: 'makeup', pairKey: 'x' }, { kind: 'todayOpen' }],
        })
      )
    ).toBe(false);
  });

  it('notices a new callback (callbacks must be stable to keep cards still)', () => {
    expect(sameCardProps(card(), card({ onToggle: () => undefined }))).toBe(
      false
    );
  });
});
