import {
  COMPLETION_MULTIPLIER,
  starAfter,
  CHALLENGE_MILESTONES,
  challengePace,
  challengeReward,
  challengeShare,
  dayLevel,
  requirementShare,
  streakBonusShare,
} from '../challengeLogic';
import { XP_MULTIPLIERS, XP_REWARDS } from '../../../constants/gamification';
import { monthStreakBonusShare } from '../../../services/monthlyStreak';

describe('monthly challenge: what it pays', () => {
  it('pays by star level, full challenges ten times the warm-up', () => {
    expect(challengeReward(1, false, 1).base).toBe(5000);
    expect(challengeReward(3, false, 1).base).toBe(12000);
    expect(challengeReward(5, false, 1).base).toBe(25000);
    expect(challengeReward(1, true, 1).base).toBe(500);
    expect(challengeReward(5, true, 1).base).toBe(2532);
  });

  it('adds the month-streak bonus as a share of the base', () => {
    expect([1, 2, 3, 4, 5, 6, 11, 12, 30].map(streakBonusShare)).toEqual([
      0, 0.05, 0.05, 0.1, 0.1, 0.15, 0.15, 0.25, 0.25,
    ]);
    // The guide's example: 3 stars, 5 months in a row.
    expect(challengeReward(3, false, 5)).toEqual({
      base: 12000,
      streakShare: 0.1,
      streakBonus: 1200,
      total: 13200,
    });
  });

  it('uses the same numbers as the app’s own constants', () => {
    const live = XP_REWARDS.MONTHLY_CHALLENGES;
    expect(
      ([1, 2, 3, 4, 5] as const).map(s => challengeReward(s, false, 1).base)
    ).toEqual([
      live.ONE_STAR,
      live.TWO_STAR,
      live.THREE_STAR,
      live.FOUR_STAR,
      live.FIVE_STAR,
    ]);
    expect(COMPLETION_MULTIPLIER).toEqual({
      factor: XP_MULTIPLIERS.CHALLENGE_COMPLETION_MULTIPLIER,
      hours: XP_MULTIPLIERS.CHALLENGE_COMPLETION_DURATION,
    });
  });

  it('uses the app’s own month-streak rule', () => {
    for (let months = 0; months <= 15; months++) {
      expect(streakBonusShare(months)).toBe(monthStreakBonusShare(months));
    }
  });

  it('pays the first finished month without a bonus', () => {
    expect(challengeReward(2, false, 1).total).toBe(7500);
  });

  it('has the three milestones the tracker pays', () => {
    expect(CHALLENGE_MILESTONES).toEqual([
      { at: 25, xp: 50 },
      { at: 50, xp: 100 },
      { at: 75, xp: 150 },
    ]);
  });
});

describe('monthly challenge: how far it is', () => {
  it('never counts a requirement above its target', () => {
    expect(requirementShare({ done: 80, target: 62 })).toBe(1);
    expect(requirementShare({ done: 31, target: 62 })).toBe(0.5);
    expect(requirementShare({ done: -3, target: 62 })).toBe(0);
  });

  it('is the average of the requirements', () => {
    expect(
      challengeShare([
        { done: 62, target: 62 },
        { done: 5, target: 10 },
      ])
    ).toBe(0.75);
    // Overshooting one does not hide the other.
    expect(
      challengeShare([
        { done: 200, target: 62 },
        { done: 0, target: 10 },
      ])
    ).toBe(0.5);
    expect(challengeShare([])).toBe(0);
  });
});

describe('monthly challenge: the pace', () => {
  it('is on track when an even month would be no further', () => {
    // Day 22 of 31: 21/31 = 67.7 % should be behind the user.
    expect(challengePace([{ done: 46, target: 62 }], 22, 31)).toEqual({
      state: 'onTrack',
      left: 16,
      daysLeft: 10,
      perDay: 2,
      toKeepLevel: null,
    });
  });

  it('is behind when it is not, and says what a day must bring', () => {
    expect(challengePace([{ done: 9, target: 18 }], 22, 31)).toEqual({
      state: 'behind',
      left: 9,
      daysLeft: 10,
      perDay: 1,
      toKeepLevel: null,
    });
    expect(challengePace([{ done: 20, target: 62 }], 22, 31)).toMatchObject({
      state: 'behind',
      perDay: 5,
    });
  });

  it('gives today the benefit of the doubt', () => {
    // Day 1: nothing can be expected yet.
    expect(challengePace([{ done: 0, target: 62 }], 1, 31).state).toBe(
      'onTrack'
    );
    // Exactly the even share before today.
    expect(challengePace([{ done: 30, target: 60 }], 16, 30).state).toBe(
      'onTrack'
    );
    expect(challengePace([{ done: 29, target: 60 }], 16, 30).state).toBe(
      'behind'
    );
  });

  it('speaks about the requirement that is furthest behind', () => {
    const pace = challengePace(
      [
        { done: 60, target: 62 },
        { done: 4, target: 20 },
      ],
      22,
      31
    );
    expect(pace).toMatchObject({ state: 'behind', left: 16 });
  });

  it('is done only when every requirement is', () => {
    expect(
      challengePace(
        [
          { done: 62, target: 62 },
          { done: 19, target: 20 },
        ],
        30,
        31
      ).state
    ).not.toBe('done');
    expect(
      challengePace(
        [
          { done: 62, target: 62 },
          { done: 20, target: 20 },
        ],
        27,
        31
      )
    ).toMatchObject({ state: 'done', left: 0, perDay: 0 });
  });

  it('says so when a day-capped requirement cannot be reached any more', () => {
    // "Days with…": one a day at most. 12 left, 7 days open.
    const days = { done: 6, target: 18, perDayMax: 1 };
    expect(challengePace([days], 25, 31)).toEqual({
      state: 'outOfReach',
      left: 12,
      daysLeft: 7,
      perDay: 2,
      // 70 % of 18 = 12.6 → 13; 7 more, and 7 days are open.
      toKeepLevel: 7,
    });
    // Still exactly reachable: 7 left in 7 days.
    expect(
      challengePace([{ done: 11, target: 18, perDayMax: 1 }], 25, 31).state
    ).toBe('behind');
    // Without a cap anything can still be caught up.
    expect(challengePace([{ done: 6, target: 18 }], 25, 31).state).toBe(
      'behind'
    );
  });

  it('does not promise the star level when even 70 % is gone', () => {
    expect(
      challengePace([{ done: 2, target: 18, perDayMax: 1 }], 27, 31)
    ).toMatchObject({ state: 'outOfReach', toKeepLevel: null });
  });

  it('tells a user past 70 % that the level is already safe', () => {
    expect(
      challengePace([{ done: 13, target: 18, perDayMax: 1 }], 29, 31)
    ).toMatchObject({ state: 'outOfReach', toKeepLevel: 0 });
  });

  it('never speaks in fractions and survives odd input', () => {
    expect(challengePace([{ done: 8.5, target: 18 }], 22, 31).left).toBe(10);
    // A day past the month's end still leaves one day, never zero or less.
    expect(challengePace([{ done: 1, target: 18 }], 40, 31).daysLeft).toBe(1);
    // A requirement without a target is simply done.
    expect(requirementShare({ done: 0, target: 0 })).toBe(1);
  });

  it('counts the last day as one day left', () => {
    expect(challengePace([{ done: 59, target: 62 }], 31, 31)).toMatchObject({
      daysLeft: 1,
      perDay: 3,
    });
  });
});

describe('monthly challenge: a day in the calendar', () => {
  it('uses the app’s thresholds against an even daily share', () => {
    // Target 62 in 31 days = 2 a day.
    expect(dayLevel(0, 2)).toBe('none');
    expect(dayLevel(0.1, 2)).toBe('none');
    expect(dayLevel(0.2, 2)).toBe('some');
    expect(dayLevel(1, 2)).toBe('some');
    expect(dayLevel(1.02, 2)).toBe('good');
    expect(dayLevel(1.8, 2)).toBe('good');
    expect(dayLevel(1.82, 2)).toBe('full');
    expect(dayLevel(5, 2)).toBe('full');
  });

  it('does not divide by a missing target', () => {
    expect(dayLevel(1, 0)).toBe('full');
    expect(dayLevel(0, 0)).toBe('none');
  });
});

describe('monthly challenge: what a month does to the stars', () => {
  it('gives a star for a full finish and forgets earlier misses', () => {
    expect(starAfter(3, 100, 1)).toEqual({
      stars: 4,
      change: 'up',
      failures: 0,
    });
  });

  it('cannot go above five', () => {
    expect(starAfter(5, 100, 0)).toEqual({
      stars: 5,
      change: 'same',
      failures: 0,
    });
  });

  it('keeps the level for 70–99 %, but counts the miss', () => {
    expect(starAfter(2, 78, 0)).toEqual({
      stars: 2,
      change: 'same',
      failures: 1,
    });
    // Even as the second miss: a partial month never costs a star.
    expect(starAfter(2, 70, 1)).toEqual({
      stars: 2,
      change: 'same',
      failures: 2,
    });
  });

  it('keeps the level after the first month under 70 %', () => {
    expect(starAfter(2, 50, 0)).toEqual({
      stars: 2,
      change: 'same',
      failures: 1,
    });
  });

  it('takes a star for the second miss in a row under 70 %', () => {
    expect(starAfter(2, 50, 1)).toEqual({
      stars: 1,
      change: 'down',
      failures: 0,
    });
    // A partial month before counts as a miss too.
    expect(starAfter(4, 69, 2).stars).toBe(3);
  });

  it('never goes below one', () => {
    expect(starAfter(1, 10, 1)).toEqual({
      stars: 1,
      change: 'same',
      failures: 0,
    });
  });

  it('knows the multiplier the app runs after a finished challenge', () => {
    expect(COMPLETION_MULTIPLIER).toEqual({ factor: 1.5, hours: 12 });
  });
});
