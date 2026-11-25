import {
  arcOrder,
  encouragementOf,
  finishedTheDay,
  greetingKey,
} from '../homeHeroLogic';

describe('greetingKey (decision E11/1: 5 / 12 / 18)', () => {
  it.each([
    [0, 'evening'],
    [4, 'evening'],
    [5, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [17, 'afternoon'],
    [18, 'evening'],
    [23, 'evening'],
  ])('%i h → %s', (hour, key) => {
    expect(greetingKey(hour)).toBe(key);
  });
});

describe('encouragementOf', () => {
  it('nothing planned is a free day, not praise', () => {
    expect(encouragementOf(0, 0)).toEqual({ key: 'home.hero.nothingPlanned' });
    // a bonus check on a free day does not turn it into "all done"
    expect(encouragementOf(0, 2)).toEqual({ key: 'home.hero.nothingPlanned' });
  });
  it('all done', () => {
    expect(encouragementOf(3, 3)).toEqual({
      key: 'home.hero.encouragement.allDone',
    });
  });
  it('none done yet', () => {
    expect(encouragementOf(3, 0)).toEqual({
      key: 'home.hero.encouragement.freshStart',
    });
  });
  it('some left', () => {
    expect(encouragementOf(4, 1)).toEqual({
      key: 'home.hero.encouragement.remaining',
      count: 3,
    });
    expect(encouragementOf(4, 3)).toEqual({
      key: 'home.hero.encouragement.remaining',
      count: 1,
    });
  });
});

describe('arcOrder', () => {
  it('done first, user order kept inside each group', () => {
    const done = new Set(['b', 'd']);
    expect(arcOrder(['a', 'b', 'c', 'd'], h => done.has(h))).toEqual([
      'b',
      'd',
      'a',
      'c',
    ]);
  });
});

describe('finishedTheDay', () => {
  const was = (done: number, planned: number) => ({ done, planned });
  it('only the step to "all" counts', () => {
    expect(finishedTheDay(was(2, 3), 3, 3)).toBe(true);
  });
  it('not on the first render', () => {
    expect(finishedTheDay(null, 3, 3)).toBe(false);
  });
  it('not when the habits arrive after launch (0/0 → 3/3)', () => {
    expect(finishedTheDay(was(0, 0), 3, 3)).toBe(false);
  });
  it('not when the plan changes (an unfinished habit removed)', () => {
    expect(finishedTheDay(was(2, 3), 2, 2)).toBe(false);
  });
  it('not when already finished, nor on an uncheck', () => {
    expect(finishedTheDay(was(3, 3), 3, 3)).toBe(false);
    expect(finishedTheDay(was(3, 3), 2, 3)).toBe(false);
  });
  it('not on a day with nothing planned', () => {
    expect(finishedTheDay(was(0, 0), 0, 0)).toBe(false);
  });
});
