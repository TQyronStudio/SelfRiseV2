// Journal Streak / Debt (Frozen Streak) — Regression Suite
//
// WHY THIS EXISTS (audit, July 2026): the frozen-streak protection system had
// a self-destruct path. `calculateFrozenDays()` contained a "today complete →
// debt 0" early return, so the moment a day with unpaid debt gained 3 entries
// (past-entry deletion edge, midnight-rollover races, stale gate state), the
// streak was recalculated across the unpaid gap and silently collapsed
// (15 → 1) — and `adsNeededToWarmUp()` had the same early return, so the debt
// could never be paid again. Product decision (July 2026): debt must stay
// visible and payable until the user PAYS (streak continues where it left
// off) or explicitly chooses START FRESH (streak resets to 0).
//
// These tests run against the real in-memory SQLite (global jest setup) —
// real SQL semantics, real streak state machine. If any of these fails,
// user streaks are being silently destroyed — treat as release blocker.
// See technical-guides:My-Journal.md.

import { SQLiteGratitudeStorage } from '../SQLiteGratitudeStorage';
import { GratitudeStreak } from '../../../types/gratitude';
import { DateString } from '../../../types/common';
import { getDatabase } from '../../database/init';
import { today, subtractDays, calculateStreakWithWarmUp } from '../../../utils/date';

// Isolate from XP side effects — streak logic must not depend on gamification.
jest.mock('../../gamificationService', () => ({
  GamificationService: {
    addXP: jest.fn(async () => ({ success: true })),
    subtractXP: jest.fn(async () => ({ success: true })),
  },
}));
jest.mock('uuid', () => ({ v4: () => `uuid-${Math.random().toString(36).slice(2)}` }));

// ========================================
// HELPERS
// ========================================

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

async function resetDb(): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM journal_entries');
  await db.runAsync('DELETE FROM warm_up_payments');
  await storage.updateStreak(DEFAULT_STREAK);
}

let entrySeq = 0;

/** Seed `count` real journal entries for a date (3+ = completed day). */
async function seedEntries(date: DateString, count: number): Promise<void> {
  const db = getDatabase();
  for (let i = 1; i <= count; i++) {
    entrySeq++;
    await db.runAsync(
      'INSERT INTO journal_entries (id, text, type, date, gratitude_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`test_entry_${entrySeq}`, `Test entry ${i} for ${date}`, 'gratitude', date, i, Date.now(), Date.now()]
    );
  }
}

/** Seed a completed streak run: `length` consecutive completed days ending `endDaysAgo` days ago. */
async function seedStreakRun(length: number, endDaysAgo: number): Promise<void> {
  for (let i = 0; i < length; i++) {
    await seedEntries(D(endDaysAgo + i), 3);
  }
}

/** Record a warm-up payment (as if an ad was watched) for a missed date. */
async function payDay(missedDate: DateString): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'INSERT INTO warm_up_payments (id, missed_date, ads_watched, paid_at) VALUES (?, ?, 1, ?)',
    [`payment_${missedDate}_${Date.now()}_${entrySeq++}`, missedDate, Date.now()]
  );
}

async function setStreak(overrides: Partial<GratitudeStreak>): Promise<void> {
  await storage.updateStreak({ ...DEFAULT_STREAK, ...overrides });
}

describe('Journal streak/debt — frozen streak protection (release blockers)', () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ========================================
  // DEBT CALCULATION (calculateFrozenDays)
  // ========================================

  describe('calculateFrozenDays', () => {
    test('CRITICAL: unpaid past debt stays visible even when today is complete', async () => {
      await seedStreakRun(3, 2); // completed D4..D2, D1 missed
      await seedEntries(T, 3);   // today complete
      await setStreak({ currentStreak: 3, isFrozen: true, frozenDays: 1, streakBeforeFreeze: 3 });

      // Old code returned 0 here (today-complete early return) → silent wipe path
      expect(await storage.calculateFrozenDays()).toBe(1);
    });

    test('miss 1 day, today not complete → debt 1', async () => {
      await seedStreakRun(3, 2); // completed D4..D2, D1 missed, today empty
      await setStreak({ currentStreak: 3 });

      expect(await storage.calculateFrozenDays()).toBe(1);
    });

    test('FIX 15.3 intact: currentStreak 0 (new user / after Start Fresh) → debt 0', async () => {
      await seedStreakRun(2, 4); // old history, gap since
      await setStreak({ currentStreak: 0 });

      expect(await storage.calculateFrozenDays()).toBe(0);
    });

    test('paid missed days are excluded from debt', async () => {
      await seedStreakRun(2, 3); // completed D4..D3; D2+D1 missed
      await setStreak({ currentStreak: 2, isFrozen: true, frozenDays: 2 });
      await payDay(D(2)); // D2 paid, D1 still unpaid

      expect(await storage.calculateFrozenDays()).toBe(1);
    });

    test('2 entries today (incomplete day) do not hide yesterday\'s debt', async () => {
      await seedStreakRun(3, 2);
      await seedEntries(T, 2); // incomplete today
      await setStreak({ currentStreak: 3, isFrozen: true, frozenDays: 1, streakBeforeFreeze: 3 });

      expect(await storage.calculateFrozenDays()).toBe(1);
    });
  });

  // ========================================
  // AD PAYMENT AVAILABILITY (adsNeededToWarmUp)
  // ========================================

  describe('adsNeededToWarmUp', () => {
    test('CRITICAL: debt stays payable even when today already has 3+ entries', async () => {
      await seedStreakRun(3, 2);
      await seedEntries(T, 3);
      await setStreak({ currentStreak: 3, isFrozen: true, frozenDays: 1, streakBeforeFreeze: 3 });

      // Old code returned 0 (todayCount >= 3 early return) → debt unpayable forever
      expect(await storage.adsNeededToWarmUp()).toBe(1);
    });

    test('no debt → 0 ads needed', async () => {
      await seedStreakRun(3, 1); // completed D3..D1
      await seedEntries(T, 3);
      await setStreak({ currentStreak: 4 });

      expect(await storage.adsNeededToWarmUp()).toBe(0);
    });
  });

  // ========================================
  // STREAK STATE MACHINE (calculateAndUpdateStreak)
  // ========================================

  describe('calculateAndUpdateStreak', () => {
    test('GUIDE-MANDATED: streak 15 + miss 1 day → frozen at 15, NOT 0', async () => {
      await seedStreakRun(15, 2); // 15 days ending D2; D1 missed; today empty
      await setStreak({ currentStreak: 15, longestStreak: 15 });

      const result = await storage.calculateAndUpdateStreak();

      expect(result.currentStreak).toBe(15); // FATAL IF 0 — broken protection
      expect(result.isFrozen).toBe(true);
      expect(result.frozenDays).toBe(1);
      expect(result.canRecoverWithAd).toBe(true);
      expect(result.streakBeforeFreeze).toBe(15);
    });

    test('CRITICAL (wipe regression): frozen streak + today complete WITHOUT paying → streak preserved, still frozen', async () => {
      await seedStreakRun(15, 2); // streak ended D2; D1 missed & unpaid
      await seedEntries(T, 3);    // today complete
      await setStreak({
        currentStreak: 15,
        longestStreak: 15,
        isFrozen: true,
        frozenDays: 1,
        streakBeforeFreeze: 15,
      });

      const result = await storage.calculateAndUpdateStreak();

      // Old behaviour: debt "vanished" → recalc across unpaid gap → 1 (SILENT WIPE)
      expect(result.currentStreak).toBe(15);
      expect(result.isFrozen).toBe(true);
      expect(result.frozenDays).toBe(1);
    });

    test('payment continuation: just unfroze + today complete → streak continues +1 (15 → 16)', async () => {
      await seedStreakRun(15, 2);
      await seedEntries(T, 3);
      await payDay(D(1)); // yesterday paid via ad
      await setStreak({
        currentStreak: 15,
        longestStreak: 15,
        justUnfrozeToday: true,
        streakBeforeFreeze: 15,
      });

      const result = await storage.calculateAndUpdateStreak();

      expect(result.currentStreak).toBe(16);
      expect(result.isFrozen).toBe(false);
      expect(result.frozenDays).toBe(0);
      expect(result.justUnfrozeToday).toBe(false); // flag consumed
      expect(result.longestStreak).toBe(16);
    });

    test('paid gap bridges the streak in normal calculation (warm-up aware)', async () => {
      await seedStreakRun(2, 2); // D3, D2 completed
      await seedEntries(T, 3);   // today complete; D1 missed but paid
      await payDay(D(1));
      await setStreak({ currentStreak: 2, longestStreak: 2 });

      const result = await storage.calculateAndUpdateStreak();

      expect(result.currentStreak).toBe(3); // paid day bridges but does not count
      expect(result.isFrozen).toBe(false);
    });

    test('auto-reset: 4+ unpaid missed days (excluding today) → streak resets, longest preserved', async () => {
      await seedStreakRun(10, 5); // streak ended D5; D4..D1 missed (4 days)
      await setStreak({ currentStreak: 10, longestStreak: 12, isFrozen: true, frozenDays: 3, streakBeforeFreeze: 10 });

      const result = await storage.calculateAndUpdateStreak();

      expect(result.currentStreak).toBe(0);
      expect(result.isFrozen).toBe(false);
      expect(result.frozenDays).toBe(0);
      expect(result.longestStreak).toBe(12); // history is sacred
      expect(result.autoResetTimestamp).not.toBeNull();
    });

    test('exactly 3 missed days (excluding today) → still frozen, NOT auto-reset', async () => {
      await seedStreakRun(10, 4); // streak ended D4; D3..D1 missed (3 days)
      await setStreak({ currentStreak: 10, longestStreak: 10, isFrozen: true, frozenDays: 2, streakBeforeFreeze: 10 });

      const result = await storage.calculateAndUpdateStreak();

      expect(result.currentStreak).toBe(10); // max debt still protected
      expect(result.isFrozen).toBe(true);
      expect(result.frozenDays).toBe(3);
      expect(result.canRecoverWithAd).toBe(true);
    });

    test('healthy streak: today completed extends streak normally', async () => {
      await seedStreakRun(5, 1); // D5..D1 completed
      await seedEntries(T, 3);
      await setStreak({ currentStreak: 5, longestStreak: 5 });

      const result = await storage.calculateAndUpdateStreak();

      expect(result.currentStreak).toBe(6);
      expect(result.isFrozen).toBe(false);
      expect(result.longestStreak).toBe(6);
    });
  });

  // ========================================
  // PAYMENT FLOW (applySingleWarmUpPayment) — also covers debt forgiveness
  // (Home card "issue resolution" now uses this same path instead of the
  // old AsyncStorage write that was a silent no-op on SQLite)
  // ========================================

  describe('applySingleWarmUpPayment', () => {
    test('1 ad pays 1 missed day; streak restored after full payment + completion', async () => {
      await seedStreakRun(15, 2); // D1 missed & unpaid
      await setStreak({ currentStreak: 15, longestStreak: 15, isFrozen: true, frozenDays: 1, streakBeforeFreeze: 15 });

      const payResult = await storage.applySingleWarmUpPayment();
      expect(payResult.isFullyWarmed).toBe(true);
      expect(payResult.remainingFrozenDays).toBe(0);

      // Streak preserved and unfrozen after payment
      const streak = await storage.getStreak();
      expect(streak.currentStreak).toBe(15);
      expect(streak.isFrozen).toBe(false);

      // Completing today then continues the streak
      await seedEntries(T, 3);
      const result = await storage.calculateAndUpdateStreak();
      expect(result.currentStreak).toBe(16);
    });

    test('partial payment: 2 debt days, 1 ad → 1 day remains, still frozen, streak preserved', async () => {
      await seedStreakRun(10, 3); // D2+D1 missed
      await setStreak({ currentStreak: 10, longestStreak: 10, isFrozen: true, frozenDays: 2, streakBeforeFreeze: 10 });

      const payResult = await storage.applySingleWarmUpPayment();
      expect(payResult.isFullyWarmed).toBe(false);
      expect(payResult.remainingFrozenDays).toBe(1);

      const streak = await storage.getStreak();
      expect(streak.currentStreak).toBe(10);
      expect(streak.isFrozen).toBe(true);
    });
  });

  // ========================================
  // START FRESH (resetStreak)
  // ========================================

  describe('resetStreak (Start Fresh)', () => {
    test('clears debt and payments, preserves longest streak, allows writing again', async () => {
      await seedStreakRun(15, 3); // D2+D1 missed
      await payDay(D(2));
      await setStreak({ currentStreak: 15, longestStreak: 15, isFrozen: true, frozenDays: 1, streakBeforeFreeze: 15 });

      const result = await storage.resetStreak();

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBeGreaterThanOrEqual(15); // history preserved
      expect(result.isFrozen).toBe(false);
      expect(result.frozenDays).toBe(0);

      // No phantom debt after fresh start (FIX 15.3)
      expect(await storage.calculateFrozenDays()).toBe(0);
      expect(await storage.adsNeededToWarmUp()).toBe(0);
    });
  });

  // ========================================
  // PURE UTILITY (calculateStreakWithWarmUp)
  // ========================================

  describe('calculateStreakWithWarmUp (pure)', () => {
    const payment = (missedDate: DateString, isComplete = true) =>
      ({ missedDate, isComplete, adsWatched: isComplete ? 1 : 0, paymentTimestamp: new Date() }) as any;

    test('unpaid gap breaks the streak', () => {
      expect(calculateStreakWithWarmUp([D(3), D(2), T], T, [])).toBe(1);
    });

    test('paid gap bridges without counting', () => {
      expect(calculateStreakWithWarmUp([D(3), D(2), T], T, [payment(D(1))])).toBe(3);
    });

    test('incomplete payment does not bridge', () => {
      expect(calculateStreakWithWarmUp([D(3), D(2), T], T, [payment(D(1), false)])).toBe(1);
    });
  });
});
