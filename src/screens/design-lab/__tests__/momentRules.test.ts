import { JOURNAL_STREAK_MILESTONES } from '../../../utils/journalStreakMilestones';
import {
  streakMomentSize,
  STREAK_WINDOW_DAYS,
  tierEntered,
} from '../momentRules';

describe('level-up: only a new tier is worth a window', () => {
  it('names the tier when a boundary is crossed', () => {
    expect(tierEntered(10, 11)).toBe('growing');
    expect(tierEntered(20, 21)).toBe('rare');
    expect(tierEntered(40, 41)).toBe('epic');
    expect(tierEntered(60, 61)).toBe('legendary');
    expect(tierEntered(80, 81)).toBe('mythic');
  });

  it('stays quiet inside a tier — also at the round milestone levels', () => {
    expect(tierEntered(9, 10)).toBeNull();
    expect(tierEntered(16, 17)).toBeNull();
    expect(tierEntered(24, 25)).toBeNull();
    expect(tierEntered(49, 50)).toBeNull();
    expect(tierEntered(99, 100)).toBeNull();
  });

  it('reports the tier the user lands in when several levels come at once', () => {
    expect(tierEntered(9, 12)).toBe('growing');
    expect(tierEntered(19, 42)).toBe('epic');
  });

  it('does not celebrate the very first level as a new tier', () => {
    expect(tierEntered(0, 1)).toBeNull();
    expect(tierEntered(0, 3)).toBeNull();
    // …unless the first XP jumps straight past the first tier.
    expect(tierEntered(0, 11)).toBe('growing');
  });

  it('is never triggered by a level that did not rise', () => {
    expect(tierEntered(11, 11)).toBeNull();
    expect(tierEntered(21, 20)).toBeNull();
  });
});

describe('journal streak: window or quiet note', () => {
  it('keeps a window for the first week and the big lengths', () => {
    expect([7, 30, 100, 365, 1000].map(streakMomentSize)).toEqual([
      'window',
      'window',
      'window',
      'window',
      'window',
    ]);
  });

  it('makes every other celebrated length a quiet note', () => {
    const quiet = JOURNAL_STREAK_MILESTONES.filter(
      days => !STREAK_WINDOW_DAYS.includes(days)
    );
    expect(quiet).toEqual([
      14, 21, 50, 60, 75, 90, 150, 180, 200, 250, 500, 750,
    ]);
    quiet.forEach(days => expect(streakMomentSize(days)).toBe('quiet'));
  });

  it('does nothing on an ordinary day', () => {
    expect(streakMomentSize(0)).toBeNull();
    expect(streakMomentSize(8)).toBeNull();
    expect(streakMomentSize(31)).toBeNull();
  });

  it('only gives a window to lengths the app really celebrates', () => {
    STREAK_WINDOW_DAYS.forEach(days =>
      expect(JOURNAL_STREAK_MILESTONES as readonly number[]).toContain(days)
    );
  });
});
