// Journal streak rewards — XP for reaching a streak length
//
// WHY THIS EXISTS (November 14, 2026): XP_REWARDS.JOURNAL.STREAK_7/21/30/100/365
// (75/100/150/250/500 XP) had sat in the constants since the first design, but
// NOTHING ever paid them — the journal streak was celebrated with a window and
// no reward. Product decision (Petr): pay them. The payout lives in the streak
// calculation and must hold four promises:
//   1. paid the day the streak reaches the length, with the right amount;
//   2. once per streak run — deleting an entry and adding it back, or simply
//      recalculating, never pays again;
//   3. never lost — if the XP call fails, the next recalculation retries (the
//      mark is written only after the XP arrived);
//   4. never able to break the streak calculation, and never trimmed by the
//      journal's daily XP cap or the rate limit.
//
// Runs against the real in-memory SQLite (global jest setup) — real SQL, real
// streak state machine. See technical-guides:My-Journal.md.

import { SQLiteGratitudeStorage } from '../SQLiteGratitudeStorage';
import { GratitudeStreak } from '../../../types/gratitude';
import { DateString } from '../../../types/common';
import { getDatabase } from '../../database/init';
import { GamificationService } from '../../gamificationService';
import { XPSourceType } from '../../../types/gamification';
import { XP_REWARDS, DAILY_XP_LIMITS } from '../../../constants/gamification';
import { today, subtractDays } from '../../../utils/date';
import {
  getJournalStreakReward,
  isJournalStreakMilestone,
  JOURNAL_STREAK_REWARDS,
} from '../../../utils/journalStreakMilestones';
import {
  getSourceDailyLimit,
  validateXPAddition,
} from '../../gamification/xpLimits';

jest.mock('../../gamificationService', () => ({
  GamificationService: {
    addXP: jest.fn(async () => ({ success: true })),
    subtractXP: jest.fn(async () => ({ success: true })),
  },
}));
jest.mock('uuid', () => ({ v4: () => `uuid-${Math.random().toString(36).slice(2)}` }));

const addXPMock = GamificationService.addXP as jest.Mock;

const T = today();
const D = (daysAgo: number): DateString => subtractDays(T, daysAgo);
const storage = new SQLiteGratitudeStorage();

const DEFAULT_STREAK: Partial<GratitudeStreak> = {
  currentStreak: 0,
  longestStreak: 0,
  lastEntryDate: null,
  streakStartDate: null,
  frozenDays: 0,
  isFrozen: false,
  canRecoverWithAd: false,
  justUnfrozeToday: false,
  streakBeforeFreeze: null,
  starCount: 0,
  flameCount: 0,
  crownCount: 0,
  autoResetTimestamp: null,
  autoResetReason: null,
  warmUpPayments: [],
  warmUpHistory: [],
};

let entrySeq = 0;

/** Seed `count` real journal entries for a date (3+ = completed day). */
async function seedEntries(date: DateString, count: number): Promise<void> {
  const db = getDatabase();
  for (let i = 1; i <= count; i++) {
    entrySeq++;
    await db.runAsync(
      'INSERT INTO journal_entries (id, text, type, date, gratitude_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`reward_entry_${entrySeq}`, `Entry ${i} for ${date}`, 'gratitude', date, i, Date.now(), Date.now()]
    );
  }
}

/** `length` completed days in a row, the last one `endDaysAgo` days ago. */
async function seedStreakRun(length: number, endDaysAgo = 0): Promise<void> {
  for (let i = 0; i < length; i++) {
    await seedEntries(D(endDaysAgo + i), 3);
  }
}

const streakPayouts = (): Array<[number, any]> =>
  addXPMock.mock.calls.filter(
    ([, options]) => options.source === XPSourceType.JOURNAL_STREAK_MILESTONE
  );

const rewardRows = () =>
  getDatabase().getAllAsync<{ streak_days: number; awarded_on: string; xp: number }>(
    'SELECT streak_days, awarded_on, xp FROM journal_streak_rewards ORDER BY awarded_on'
  );

const award = (days: number): Promise<void> => (storage as any).awardStreakReward(days);

beforeEach(async () => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM journal_entries');
  await db.runAsync('DELETE FROM warm_up_payments');
  await db.runAsync('DELETE FROM journal_streak_rewards');
  await storage.updateStreak(DEFAULT_STREAK);
  addXPMock.mockReset();
  addXPMock.mockImplementation(async () => ({ success: true }));
});

describe('which lengths pay, and how much', () => {
  it('pays exactly the five lengths with a reward in the constants', () => {
    expect(JOURNAL_STREAK_REWARDS).toEqual({
      7: XP_REWARDS.JOURNAL.STREAK_7_DAYS,
      21: XP_REWARDS.JOURNAL.STREAK_21_DAYS,
      30: XP_REWARDS.JOURNAL.STREAK_30_DAYS,
      100: XP_REWARDS.JOURNAL.STREAK_100_DAYS,
      365: XP_REWARDS.JOURNAL.STREAK_365_DAYS,
    });
    expect([7, 21, 30, 100, 365].map(getJournalStreakReward)).toEqual([75, 100, 150, 250, 500]);
  });

  it('pays nothing for any other length — also not for the other celebrated ones', () => {
    expect([0, 1, 6, 8, 14, 50, 99, 101, 1000].map(getJournalStreakReward)).toEqual(
      [0, 0, 0, 0, 0, 0, 0, 0, 0]
    );
  });

  it('only rewards lengths the app also celebrates', () => {
    Object.keys(JOURNAL_STREAK_REWARDS).forEach(days =>
      expect(isJournalStreakMilestone(Number(days))).toBe(true)
    );
  });
});

describe('the streak calculation pays the reward', () => {
  it('pays 75 XP the day a real streak reaches 7 days', async () => {
    await seedStreakRun(7);
    const streak = await storage.calculateAndUpdateStreak();

    expect(streak.currentStreak).toBe(7);
    expect(streakPayouts()).toHaveLength(1);
    expect(streakPayouts()[0]![0]).toBe(75);
    expect(streakPayouts()[0]![1]).toMatchObject({
      source: XPSourceType.JOURNAL_STREAK_MILESTONE,
      metadata: { streakDays: 7 },
    });
    expect(await rewardRows()).toEqual([{ streak_days: 7, awarded_on: T, xp: 75 }]);
  });

  it('pays nothing for a 6-day or an 8-day streak', async () => {
    await seedStreakRun(6);
    await storage.calculateAndUpdateStreak();
    expect(streakPayouts()).toHaveLength(0);

    await getDatabase().runAsync('DELETE FROM journal_entries');
    await seedStreakRun(8);
    const streak = await storage.calculateAndUpdateStreak();
    expect(streak.currentStreak).toBe(8);
    expect(streakPayouts()).toHaveLength(0);
  });

  it('does not pay again when the streak is recalculated the same day', async () => {
    await seedStreakRun(7);
    await storage.calculateAndUpdateStreak();
    // A bonus entry later that day recalculates the streak.
    await seedEntries(T, 1);
    await storage.calculateAndUpdateStreak();
    await storage.calculateAndUpdateStreak();

    expect(streakPayouts()).toHaveLength(1);
  });

  it('does not pay again when the day is undone and completed again', async () => {
    await seedStreakRun(7);
    await storage.calculateAndUpdateStreak();

    // Today's entries are deleted: the streak falls back to 6…
    await getDatabase().runAsync('DELETE FROM journal_entries WHERE date = ?', [T]);
    expect((await storage.calculateAndUpdateStreak()).currentStreak).toBe(6);
    // …and written again: 7 once more, but it is the same run.
    await seedEntries(T, 3);
    expect((await storage.calculateAndUpdateStreak()).currentStreak).toBe(7);

    expect(streakPayouts()).toHaveLength(1);
  });

  it('still returns the streak when the reward blows up', async () => {
    addXPMock.mockImplementation(async () => {
      throw new Error('XP service down');
    });
    await seedStreakRun(7);

    const streak = await storage.calculateAndUpdateStreak();

    expect(streak.currentStreak).toBe(7);
    expect(await rewardRows()).toEqual([]);
  });
});

describe('once per streak run', () => {
  it('pays every rewarded length its own amount', async () => {
    for (const days of [7, 21, 30, 100, 365]) await award(days);
    expect(streakPayouts().map(([xp]) => xp)).toEqual([75, 100, 150, 250, 500]);
  });

  it('refuses the same length while the earlier payout belongs to this run', async () => {
    await getDatabase().runAsync(
      'INSERT INTO journal_streak_rewards (streak_days, awarded_on, xp, created_at) VALUES (7, ?, 75, 0)',
      [D(6)]
    );
    await award(7);
    expect(streakPayouts()).toHaveLength(0);
  });

  it('pays again once a new run could have reached the length', async () => {
    // Reaching 7 days again takes at least 7 days after the last payout.
    await getDatabase().runAsync(
      'INSERT INTO journal_streak_rewards (streak_days, awarded_on, xp, created_at) VALUES (7, ?, 75, 0)',
      [D(7)]
    );
    await award(7);
    expect(streakPayouts()).toHaveLength(1);
    expect((await rewardRows()).map(row => row.awarded_on)).toEqual([D(7), T]);
  });

  it('keeps the lengths apart: a paid 7 does not block 21', async () => {
    await award(7);
    await award(21);
    expect(streakPayouts().map(([xp]) => xp)).toEqual([75, 100]);
  });
});

describe('a reward is never lost', () => {
  it('is not marked as paid when the XP did not arrive, and is retried', async () => {
    addXPMock.mockImplementationOnce(async () => ({ success: false }));
    await seedStreakRun(7);

    await storage.calculateAndUpdateStreak();
    expect(await rewardRows()).toEqual([]);

    // The next recalculation — the streak is still 7 — pays it.
    await storage.calculateAndUpdateStreak();
    expect(streakPayouts()).toHaveLength(2);
    expect(await rewardRows()).toEqual([{ streak_days: 7, awarded_on: T, xp: 75 }]);
  });
});

describe('limits do not touch the reward', () => {
  const dailyData = {
    totalXP: 1400,
    xpBySource: { [XPSourceType.JOURNAL_ENTRY]: 60, [XPSourceType.JOURNAL_BONUS]: 80 },
    goalTransactions: {},
    // The entry that completed the day was paid 5 ms ago.
    lastTransactionTime: 1_000_000,
  };
  const validate = (amount: number) =>
    validateXPAddition({
      amount,
      source: XPSourceType.JOURNAL_STREAK_MILESTONE,
      dailyData,
      multiplier: { isActive: false, multiplier: 1 },
      nowMs: 1_000_005,
    });

  it('has no daily cap of its own (the journal cap is lower than the reward)', () => {
    expect(getSourceDailyLimit(XPSourceType.JOURNAL_STREAK_MILESTONE)).toBeNull();
    expect(XP_REWARDS.JOURNAL.STREAK_365_DAYS).toBeGreaterThan(DAILY_XP_LIMITS.JOURNAL_MAX_DAILY);
  });

  it('is paid in full right after the entry XP, even near the daily total', () => {
    expect(validate(500)).toEqual({ isValid: true, allowedAmount: 500 });
  });
});
