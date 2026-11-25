/**
 * The pace of a goal (migration E14, R-17): one rule — the straight line from
 * the start to the deadline against the progress — that the card, the detail
 * and the overview all read.
 */
import { GoalStatus } from '../../types/goal';
import {
  fractionOf,
  goalDate,
  PaceGoal,
  paceOf,
  PACE_TOLERANCE_DAYS,
  quickAmounts,
} from '../goalCalculations';

// 100 days from 2026-01-01 to 2026-04-11; today is day 50 → the plan is at 50 %.
const TODAY = '2026-02-20';
const goal = (over: Partial<PaceGoal> = {}): PaceGoal => ({
  currentValue: 50,
  targetValue: 100,
  startDate: '2026-01-01',
  targetDate: '2026-04-11',
  status: GoalStatus.ACTIVE,
  ...over,
});

describe('paceOf', () => {
  it('on the line: on pace, the plan tick at half way', () => {
    const p = paceOf(goal(), TODAY);
    expect(p.state).toBe('onPace');
    expect(p.days).toBe(0);
    expect(p.expected).toBeCloseTo(0.5);
    expect(p.daysLeft).toBe(50);
  });

  it('ahead: 60 % when the plan says 50 % is 10 days in front', () => {
    const p = paceOf(goal({ currentValue: 60 }), TODAY);
    expect(p.state).toBe('ahead');
    expect(p.days).toBe(10);
  });

  it('behind: 40 % when the plan says 50 % is 10 days behind', () => {
    const p = paceOf(goal({ currentValue: 40 }), TODAY);
    expect(p.state).toBe('behind');
    expect(p.days).toBe(-10);
  });

  it(`within ${PACE_TOLERANCE_DAYS} days either way is still on pace`, () => {
    expect(paceOf(goal({ currentValue: 53 }), TODAY).state).toBe('onPace');
    expect(paceOf(goal({ currentValue: 47 }), TODAY).state).toBe('onPace');
    expect(paceOf(goal({ currentValue: 54 }), TODAY).state).toBe('ahead');
    expect(paceOf(goal({ currentValue: 46 }), TODAY).state).toBe('behind');
  });

  it('without a deadline: nothing to be late for, but a projection', () => {
    const p = paceOf(goal({ targetDate: undefined }), TODAY);
    expect(p.state).toBe('none');
    expect(p.expected).toBeNull();
    expect(p.daysLeft).toBeNull();
    // 50 in 50 days = 1 a day → the other 50 in 50 days.
    expect(p.projected).toBe('2026-04-11');
  });

  it('after the deadline: overdue, nothing counted any further', () => {
    const p = paceOf(goal({ targetDate: '2026-02-19' }), TODAY);
    expect(p.state).toBe('overdue');
    expect(p.days).toBe(0);
    expect(p.daysLeft).toBeNull();
    expect(p.expected).toBeNull();
  });

  it('on the deadline day: still counted, 0 days left', () => {
    const p = paceOf(goal({ targetDate: TODAY, currentValue: 99 }), TODAY);
    expect(p.state).not.toBe('overdue');
    expect(p.daysLeft).toBe(0);
  });

  it('done: completed, or at 100 % and beyond', () => {
    expect(paceOf(goal({ status: GoalStatus.COMPLETED }), TODAY).state).toBe('done');
    expect(paceOf(goal({ currentValue: 130 }), TODAY).state).toBe('done');
  });

  it('the first day does not read as behind', () => {
    const p = paceOf(goal({ currentValue: 0, startDate: TODAY, targetDate: '2026-05-31' }), TODAY);
    expect(p.state).toBe('onPace');
  });

  it('the needed and own speed per week', () => {
    const p = paceOf(goal({ currentValue: 40 }), TODAY);
    expect(p.yourPerWeek).toBeCloseTo((40 / 50) * 7);
    expect(p.neededPerWeek).toBeCloseTo((60 / 50) * 7);
  });

  it('reads the old Czech date form, never as UTC', () => {
    expect(paceOf(goal({ targetDate: '11.04.2026' }), TODAY).daysLeft).toBe(50);
  });

  it('works downwards (84.6 → 78 kg, ready for the measure kind)', () => {
    const p = paceOf(
      goal({ startValue: 84.6, currentValue: 81.3, targetValue: 78 }),
      TODAY
    );
    expect(p.state).toBe('onPace');
  });
});

describe('fractionOf', () => {
  it('may pass 100 %, never below 0', () => {
    expect(fractionOf(goal({ currentValue: 150 }))).toBe(1.5);
    expect(fractionOf(goal({ currentValue: -5 }))).toBe(0);
  });
});

describe('goalDate', () => {
  it('ISO and the old Czech form; anything else is no date', () => {
    expect(goalDate('2026-04-11')).toBe('2026-04-11');
    expect(goalDate('1.4.2026')).toBe('2026-04-01');
    expect(goalDate('31.02.2026')).toBeNull();
    expect(goalDate('soon')).toBeNull();
    expect(goalDate(undefined)).toBeNull();
  });
});

describe('quickAmounts', () => {
  it('small goals count by one, big ones by a step that moves the bar', () => {
    expect(quickAmounts(12)).toEqual([1]);
    expect(quickAmounts(100)).toEqual([1, 5]);
    expect(quickAmounts(1000)).toEqual([10, 50]);
    expect(quickAmounts(5000)).toEqual([50, 100, 250]);
    expect(quickAmounts(50000)).toEqual([50, 100, 250]);
    expect(quickAmounts(500000)).toEqual([500, 1000, 2500]);
    expect(quickAmounts(1000000)).toEqual([5000, 10000, 25000]);
  });
  it('no amount is bigger than the goal itself', () => {
    for (const target of [1, 7, 30, 31, 200, 201, 2000, 2001, 9999, 10 ** 12]) {
      for (const a of quickAmounts(target)) expect(a).toBeLessThanOrEqual(target);
    }
  });
});
