import {
  CHALLENGE_MILESTONES,
  challengePace,
  challengeReward,
  challengeShare,
  dayLevel,
  requirementShare,
  streakBonusShare,
} from '../challengeLogic';

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
    });
  });

  it('is behind when it is not, and says what a day must bring', () => {
    expect(challengePace([{ done: 9, target: 18 }], 22, 31)).toEqual({
      state: 'behind',
      left: 9,
      daysLeft: 10,
      perDay: 1,
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
