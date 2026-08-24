/**
 * Regression tests for the XP summary bar's counting logic.
 *
 * The field bug: tapping ONE habit five times announced "5 habits completed",
 * and un-checking a habit made the number go UP. XP arithmetic was always
 * correct — only the counts lied.
 */

import { XPSourceType } from '../../../types/gamification';
import { batchXpGains, getDisplayGroup, type XpGainInput } from '../xpNotificationBatching';

let seq = 0;
const gain = (
  amount: number,
  source: XPSourceType,
  sourceId?: string
): XpGainInput => ({
  id: `gain_${++seq}`,
  amount,
  source,
  timestamp: 1_000 + seq,
  ...(sourceId ? { sourceId } : {}),
});

const countOf = (gains: XpGainInput[], nameKey: string): number =>
  batchXpGains(gains).sources.find(s => s.nameKey === nameKey)?.count ?? 0;

describe('batchXpGains — habits count entities, not taps', () => {
  it('reports ONE habit when the same habit is tapped five times', () => {
    const gains = Array.from({ length: 5 }, () =>
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-a')
    );

    const result = batchXpGains(gains);

    expect(countOf(gains, 'habits')).toBe(1);
    // XP still sums every tap — that part was never broken
    expect(result.totalXP).toBe(125);
  });

  it('reports three habits when three different habits are completed', () => {
    const gains = [
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-b'),
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-c'),
    ];

    expect(countOf(gains, 'habits')).toBe(3);
  });

  it('groups a habit bonus with its habit instead of counting it twice', () => {
    const gains = [
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
      gain(15, XPSourceType.HABIT_BONUS, 'habit-a'),
    ];

    expect(countOf(gains, 'habits')).toBe(1);
    expect(batchXpGains(gains).totalXP).toBe(40);
  });

  it('un-checking cancels the check instead of incrementing', () => {
    const gains = [
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
      gain(-25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
    ];

    // The old code reported 3 here
    expect(countOf(gains, 'habits')).toBe(1);
    expect(batchXpGains(gains).totalXP).toBe(25);
  });

  it('drops the group entirely when the user undoes everything', () => {
    const gains = [
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
      gain(-25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
    ];

    const result = batchXpGains(gains);

    expect(result.sources).toHaveLength(0);
    expect(result.totalXP).toBe(0);
  });

  it('keeps the habit that stayed checked when another is un-checked', () => {
    const gains = [
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-b'),
      gain(-25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
    ];

    expect(countOf(gains, 'habits')).toBe(1);
  });

  it('ignores an un-check whose check happened in an earlier batch', () => {
    const gains = [gain(-25, XPSourceType.HABIT_COMPLETION, 'habit-a')];

    const result = batchXpGains(gains);

    expect(result.sources).toHaveLength(0);
    expect(result.totalXP).toBe(-25);
  });
});

describe('batchXpGains — goals count progress entries, not the goal', () => {
  it('counts every positive progress entry on the same goal', () => {
    const gains = Array.from({ length: 5 }, () =>
      gain(35, XPSourceType.GOAL_PROGRESS, 'goal-a')
    );

    expect(countOf(gains, 'goalProgress')).toBe(5);
  });

  it('subtracted progress lowers the count instead of raising it', () => {
    const gains = [
      gain(35, XPSourceType.GOAL_PROGRESS, 'goal-a'),
      gain(35, XPSourceType.GOAL_PROGRESS, 'goal-a'),
      gain(35, XPSourceType.GOAL_PROGRESS, 'goal-a'),
      gain(-35, XPSourceType.GOAL_PROGRESS, 'goal-a'),
    ];

    expect(countOf(gains, 'goalProgress')).toBe(2);
  });

  it('never lets subtractions push the count below zero', () => {
    const gains = [
      gain(35, XPSourceType.GOAL_PROGRESS, 'goal-a'),
      gain(-35, XPSourceType.GOAL_PROGRESS, 'goal-a'),
      gain(-35, XPSourceType.GOAL_PROGRESS, 'goal-a'),
    ];

    expect(countOf(gains, 'goalProgress')).toBe(0);
  });

  it('a single tap that finishes a goal is not reported as two goals', () => {
    // SQLiteGoalStorage emits BOTH events for one tap
    const gains = [
      gain(35, XPSourceType.GOAL_PROGRESS, 'goal-a'),
      gain(250, XPSourceType.GOAL_COMPLETION, 'goal-a'),
    ];

    expect(countOf(gains, 'goals')).toBe(1);
    expect(countOf(gains, 'goalProgress')).toBe(1);
  });

  it('dropping below target cancels the completion', () => {
    const gains = [
      gain(250, XPSourceType.GOAL_COMPLETION, 'goal-a'),
      gain(-250, XPSourceType.GOAL_COMPLETION, 'goal-a'),
    ];

    expect(countOf(gains, 'goals')).toBe(0);
  });
});

describe('batchXpGains — journal entries are separate things', () => {
  it('counts each entry written', () => {
    const gains = [
      gain(20, XPSourceType.JOURNAL_ENTRY, 'entry-1'),
      gain(20, XPSourceType.JOURNAL_ENTRY, 'entry-2'),
      gain(20, XPSourceType.JOURNAL_ENTRY, 'entry-3'),
    ];

    expect(countOf(gains, 'journalEntries')).toBe(3);
  });

  it('writing and deleting an entry announces nothing', () => {
    const gains = [
      gain(20, XPSourceType.JOURNAL_ENTRY, 'entry-1'),
      gain(-20, XPSourceType.JOURNAL_ENTRY, 'entry-1'),
    ];

    const result = batchXpGains(gains);

    // The old code said "2 journal entries" while the XP correctly netted to 0
    expect(result.sources).toHaveLength(0);
    expect(result.totalXP).toBe(0);
  });
});

describe('batchXpGains — mixed sources and edge cases', () => {
  it('keeps each kind of activity in its own group', () => {
    const gains = [
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-b'),
      gain(35, XPSourceType.GOAL_PROGRESS, 'goal-a'),
      gain(20, XPSourceType.JOURNAL_ENTRY, 'entry-1'),
    ];

    const result = batchXpGains(gains);

    expect(result.sources).toHaveLength(3);
    expect(countOf(gains, 'habits')).toBe(2);
    expect(countOf(gains, 'goalProgress')).toBe(1);
    expect(countOf(gains, 'journalEntries')).toBe(1);
    expect(result.totalXP).toBe(105);
  });

  it('falls back to counting events when no identity is available', () => {
    // Level-up and batch-commit gains carry no sourceId
    const gains = [
      gain(25, XPSourceType.HABIT_COMPLETION),
      gain(25, XPSourceType.HABIT_COMPLETION),
    ];

    expect(countOf(gains, 'habits')).toBe(2);
  });

  it('a zero-XP gain moves the count in neither direction', () => {
    const gains = [
      gain(25, XPSourceType.HABIT_COMPLETION, 'habit-a'),
      gain(0, XPSourceType.HABIT_COMPLETION, 'habit-b'),
    ];

    expect(countOf(gains, 'habits')).toBe(1);
  });

  it('returns an empty summary for no gains at all', () => {
    const result = batchXpGains([]);

    expect(result.sources).toHaveLength(0);
    expect(result.totalXP).toBe(0);
  });

  it('timestamps the batch with the most recent gain', () => {
    const first = gain(25, XPSourceType.HABIT_COMPLETION, 'habit-a');
    const second = gain(25, XPSourceType.HABIT_COMPLETION, 'habit-b');

    expect(batchXpGains([first, second]).timestamp).toBe(second.timestamp);
  });
});

describe('getDisplayGroup — counting mode per source', () => {
  it('treats habit completion as a toggle', () => {
    expect(getDisplayGroup(XPSourceType.HABIT_COMPLETION).countingMode).toBe('entity');
  });

  it('treats goal progress as an increment', () => {
    expect(getDisplayGroup(XPSourceType.GOAL_PROGRESS).countingMode).toBe('event');
  });

  it('keeps goal progress and goal completion in different groups', () => {
    expect(getDisplayGroup(XPSourceType.GOAL_PROGRESS).nameKey)
      .not.toBe(getDisplayGroup(XPSourceType.GOAL_COMPLETION).nameKey);
  });

  it('falls back to a generic group for unmapped sources', () => {
    expect(getDisplayGroup(XPSourceType.DAILY_ACTIVITY).nameKey).toBe('activities');
  });
});
