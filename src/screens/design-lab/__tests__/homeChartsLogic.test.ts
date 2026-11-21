import {
  activeDays,
  barScale,
  bestWeekday,
  compareRates,
  heatLevel,
  totalsOf,
} from '../homeChartsLogic';

const day = (scheduled: number, done: number, bonus = 0) => ({
  scheduled,
  done,
  bonus,
});

describe('habit statistics: the rate of a period', () => {
  it('counts every completion, bonuses included, over what was planned', () => {
    expect(totalsOf([day(5, 4), day(5, 5, 1), day(4, 2)])).toEqual({
      scheduled: 14,
      done: 11,
      bonus: 1,
      rate: 86,
    });
  });

  it('can read above 100 % in a week full of bonuses (the app’s formula)', () => {
    expect(totalsOf([day(2, 2, 1), day(2, 2, 1)]).rate).toBe(150);
  });

  it('has no rate when nothing was planned', () => {
    expect(totalsOf([day(0, 0), day(0, 0, 2)]).rate).toBeNull();
    expect(totalsOf([]).rate).toBeNull();
  });
});

describe('habit statistics: the bar scale', () => {
  it('fits the plan and the bonuses on top of it', () => {
    expect(barScale([day(5, 3), day(4, 4, 3), day(2, 0)])).toBe(7);
  });

  it('is never zero', () => {
    expect(barScale([])).toBe(1);
    expect(barScale([day(0, 0)])).toBe(1);
  });
});

describe('habit statistics: against the period before', () => {
  it('says up, down or same in percentage points', () => {
    expect(compareRates(82, 78)).toEqual({ trend: 'up', points: 4 });
    expect(compareRates(70, 78)).toEqual({ trend: 'down', points: 8 });
    expect(compareRates(78, 78)).toEqual({ trend: 'same', points: 0 });
  });

  it('does not compare with a period that had nothing planned', () => {
    expect(compareRates(82, null)).toBeNull();
    expect(compareRates(null, 78)).toBeNull();
  });
});

describe('habit statistics: a day in the year view', () => {
  it('shades by the share of the plan that was done', () => {
    expect(heatLevel(day(4, 0))).toBe(0);
    expect(heatLevel(day(4, 1))).toBe(1);
    expect(heatLevel(day(4, 2))).toBe(2);
    expect(heatLevel(day(4, 3))).toBe(3);
    expect(heatLevel(day(4, 4))).toBe(4);
  });

  it('counts a bonus towards the day and never goes past the top shade', () => {
    expect(heatLevel(day(4, 3, 1))).toBe(4);
    expect(heatLevel(day(4, 4, 3))).toBe(4);
  });

  it('draws a rest day empty, not as a missed day', () => {
    expect(heatLevel(day(0, 0))).toBe(-1);
    // …unless the user did something anyway.
    expect(heatLevel(day(0, 0, 1))).toBe(4);
  });
});

describe('habit statistics: active days and the best weekday', () => {
  it('counts the days with at least one completion', () => {
    expect(activeDays([day(5, 0), day(5, 1), day(0, 0, 1), day(0, 0)])).toBe(2);
  });

  it('finds the weekday with the best rate', () => {
    const days = [
      { ...day(5, 2), weekday: 0 },
      { ...day(5, 5), weekday: 1 },
      { ...day(5, 4), weekday: 1 },
      { ...day(5, 3), weekday: 2 },
    ];
    expect(bestWeekday(days)).toBe(1);
  });

  it('gives a tie to the earlier weekday and nothing to an empty period', () => {
    expect(
      bestWeekday([
        { ...day(4, 4), weekday: 3 },
        { ...day(4, 4), weekday: 5 },
      ])
    ).toBe(3);
    expect(bestWeekday([{ ...day(0, 0), weekday: 2 }])).toBeNull();
  });
});
