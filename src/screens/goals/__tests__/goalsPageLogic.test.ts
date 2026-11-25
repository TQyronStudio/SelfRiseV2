import { Goal, GoalCategory, GoalStatus } from '@/src/types/goal';
import {
  deadlineLayout,
  formatGoalNumber,
  groupTyped,
  logAmountError,
  loggedAmount,
  logInput,
  logNoteParts,
  MAX_MONTH_TICKS,
  STACK_STEP,
  overviewOf,
  typeKey,
  valueAfter,
} from '../goalsPageLogic';

const TODAY = '2026-02-20';
let n = 0;
const goal = (over: Record<string, unknown> = {}): Goal =>
  ({
    id: `g${++n}`,
    title: `Goal ${n}`,
    unit: 'books',
    targetValue: 100,
    currentValue: 50,
    status: GoalStatus.ACTIVE,
    category: GoalCategory.LEARNING,
    startDate: '2026-01-01',
    targetDate: '2026-04-11',
    order: n,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as Goal;

describe('numbers', () => {
  it('one decimal below 100, none from 100', () => {
    expect(formatGoalNumber(84.56, 'en-US')).toBe('84.6');
    expect(formatGoalNumber(1234.5, 'en-US')).toBe('1,235');
    expect(formatGoalNumber(1234.5, 'de-DE')).toBe('1.235');
  });
  it('groups what is typed, keeping the decimal part', () => {
    expect(groupTyped('4500000.5', 'en-US')).toBe('4,500,000.5');
    expect(groupTyped('4500000.', 'de-DE')).toBe('4.500.000,');
    expect(groupTyped('', 'en-US')).toBe('');
  });
  it('the pad: one dot, no leading zero, 13 digits at most, backspace', () => {
    expect(typeKey('', '.')).toBe('0.');
    expect(typeKey('1.5', '.')).toBe('1.5');
    expect(typeKey('0', '7')).toBe('7');
    expect(typeKey('1234567890123', '4')).toBe('1234567890123');
    expect(typeKey('12', 'back')).toBe('1');
  });
});

describe('logging', () => {
  it('previews the value after add / subtract / set', () => {
    expect(valueAfter(40, 'add', 5)).toBe(45);
    expect(valueAfter(40, 'subtract', 50)).toBe(0);
    expect(valueAfter(40, 'set', 12)).toBe(12);
  });
  it('an amount must be above 0 and within the limit', () => {
    expect(logAmountError(0)).toBe('valueRequired');
    expect(logAmountError(NaN)).toBe('valueRequired');
    expect(logAmountError(1e13)).toBe('valueTooLarge');
    expect(logAmountError(5)).toBeNull();
  });
  it('the mode is the storage progress type, the note trimmed', () => {
    expect(logInput('g', 'set', 40, '  hi ', '2026-02-20')).toEqual({
      goalId: 'g',
      value: 40,
      note: 'hi',
      date: '2026-02-20',
      progressType: 'set',
    });
  });
  it('names the logged amount with its sign and unit', () => {
    expect(loggedAmount('add', 1, 'books', 'en-US')).toBe('+1');
    expect(loggedAmount('add', 2, 'books', 'en-US')).toBe('+2 books');
    expect(loggedAmount('subtract', 50, '$', 'en-US')).toBe('−50 $');
    expect(loggedAmount('set', 84.6, 'kg', 'de-DE')).toBe('84,6 kg');
    expect(loggedAmount('add', 3, ' ', 'en-US')).toBe('+3');
  });
});

describe('overviewOf', () => {
  it('counts active, on pace (ahead included), with a deadline, completed', () => {
    const o = overviewOf(
      [
        goal(), // on pace
        goal({ currentValue: 70 }), // ahead
        goal({ currentValue: 10 }), // behind
        goal({ targetDate: '2026-02-01' }), // overdue
        goal({ targetDate: undefined }), // no deadline
        goal({ status: GoalStatus.COMPLETED, currentValue: 100 }),
      ],
      TODAY
    );
    expect(o).toEqual({ active: 5, onPace: 2, withDeadline: 4, completed: 1 });
  });
});

describe('deadlineLayout', () => {
  it('no deadlines, no line', () => {
    expect(deadlineLayout([goal({ targetDate: undefined })], TODAY, 300).dots).toEqual([]);
  });
  it('dots in date order; touching dots go to another lane', () => {
    const a = goal({ targetDate: '2026-03-01' });
    const b = goal({ targetDate: '2026-03-02' });
    const c = goal({ targetDate: '2026-08-01' });
    const layout = deadlineLayout([c, b, a], TODAY, 300);
    expect(layout.dots.map(d => d.goal.id)).toEqual([a.id, b.id, c.id]);
    expect(layout.dots.map(d => d.lane)).toEqual([0, 1, 0]);
    expect(layout.lanes).toBe(2);
    expect(layout.dots[2]!.x).toBeCloseTo(300 - 14);
  });
  it('goals due the same day are one stack in one lane, not a row each', () => {
    const due = '2026-03-24';
    const four = [1, 2, 3, 4].map(() => goal({ targetDate: due }));
    const layout = deadlineLayout(four, TODAY, 300);
    expect(layout.lanes).toBe(1);
    expect(new Set(layout.dots.map(d => d.lane))).toEqual(new Set([0]));
    const xs = layout.dots.map(d => d.x);
    expect(xs[3]! - xs[0]!).toBe(3 * STACK_STEP);
    expect(xs[0]!).toBeGreaterThanOrEqual(14);
  });
  it('the next deadline is the nearest one from today; a passed one sits at today', () => {
    const late = goal({ targetDate: '2026-02-01' });
    const soon = goal({ targetDate: '2026-02-21' });
    const layout = deadlineLayout([late, soon], TODAY, 300);
    expect(layout.next).toEqual({ goal: soon, days: 1 });
    expect(layout.dots[0]!.x).toBe(14);
  });
  it('completed goals are not on the line', () => {
    const done = goal({ status: GoalStatus.COMPLETED });
    expect(deadlineLayout([done], TODAY, 300).dots).toEqual([]);
  });
  it('a far deadline keeps the month ticks few', () => {
    const far = goal({ targetDate: '2029-12-31' });
    const layout = deadlineLayout([far], TODAY, 300);
    expect(layout.months.length).toBeLessThanOrEqual(MAX_MONTH_TICKS);
    expect(layout.months.length).toBeGreaterThan(0);
  });
});

describe('logNoteParts', () => {
  it('says "no XP today" only for an add that really got 0', () => {
    expect(logNoteParts('add', { xpAwarded: 0, milestonesPaid: [] }).noXp).toBe(true);
    expect(logNoteParts('add', { xpAwarded: 35, milestonesPaid: [] }).noXp).toBe(false);
    // unknown is not 0 — no claim
    expect(logNoteParts('add', { xpAwarded: null, milestonesPaid: [] }).noXp).toBe(false);
    // set and subtract never earn: nothing to explain
    expect(logNoteParts('set', { xpAwarded: 0, milestonesPaid: [] }).noXp).toBe(false);
    expect(logNoteParts('subtract', { xpAwarded: -35, milestonesPaid: [] }).noXp).toBe(false);
  });
  it('names the highest milestone this log paid, none otherwise', () => {
    expect(logNoteParts('add', { xpAwarded: 35, milestonesPaid: [25, 50] }).milestone).toBe(50);
    expect(logNoteParts('add', { xpAwarded: 35, milestonesPaid: [] }).milestone).toBeNull();
    expect(logNoteParts('add', { xpAwarded: 35 }).milestone).toBeNull();
  });
});
