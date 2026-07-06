// XP Multipliers + Loyalty — Regression Suite
//
// WHY THIS EXISTS (audit, July 2026): multiplier activation was a COMPLETE
// silent no-op in production. All three activation paths (Harmony Streak,
// Inactive User Boost, Achievement Combo) wrote the active multiplier ONLY to
// AsyncStorage, while getActiveMultiplier() reads the SQLite `xp_multipliers`
// table when USE_SQLITE_GAMIFICATION is on — and the only SQLite writer was
// the one-time migration. The user earned a 7-day Harmony Streak, tapped
// "Activate 2x XP", saw the celebration, received the activation bonus, PAID
// the 7-day cooldown… and no XP was ever doubled, no countdown ever shown.
//
// Second bug: the Harmony streak scan anchored at TODAY, so an incomplete
// today (i.e. every morning) reported streak 0 even after a full 7-day run
// ending yesterday — the earned activation was unavailable most of the day.
//
// Any failure here = multipliers silently broken = release blocker.

import { XPMultiplierService, DailyActivityData } from '../xpMultiplierService';
import { LoyaltyService } from '../loyaltyService';
import { getDatabase } from '../database/init';
import { XPMultiplier } from '../../types/gamification';
import { today, subtractDays } from '../../utils/date';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// ========================================
// HELPERS
// ========================================

const T = today();

function makeMultiplier(overrides: Partial<XPMultiplier> = {}): XPMultiplier {
  const now = new Date();
  return {
    id: `test_mult_${Math.random().toString(36).slice(2)}`,
    createdAt: now,
    updatedAt: now,
    multiplier: 2.0,
    duration: 24,
    activatedAt: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    source: 'harmony_streak',
    isActive: true,
    ...overrides,
  } as XPMultiplier;
}

function day(daysAgo: number, harmony: boolean): DailyActivityData {
  return {
    date: subtractDays(T, daysAgo),
    hasHabitActivity: harmony,
    hasJournalActivity: harmony,
    hasGoalActivity: harmony,
    habitCompletions: harmony ? 1 : 0,
    journalEntries: harmony ? 3 : 0,
    goalProgressUpdates: harmony ? 1 : 0,
  };
}

describe('XP Multipliers + Loyalty — regression suite (release blockers)', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();

    // In-memory AsyncStorage harness (cooldowns, history, loyalty data)
    const storage = new Map<string, string>();
    mockAsyncStorage.getItem.mockImplementation(async (key) => storage.get(key) || null);
    mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
      storage.set(key, value);
    });
    mockAsyncStorage.removeItem.mockImplementation(async (key) => {
      storage.delete(key);
    });
    mockAsyncStorage.multiRemove.mockImplementation(async (keys) => {
      keys.forEach((k) => storage.delete(k));
    });

    // Clean SQLite multiplier table (real in-memory DB from global setup)
    const db = getDatabase();
    await db.runAsync('DELETE FROM xp_multipliers');
  });

  // ========================================
  // SPLIT-BRAIN REGRESSION (write where reads happen)
  // ========================================

  describe('active multiplier persistence (SQLite write→read consistency)', () => {
    test('CRITICAL: a stored multiplier is visible to getActiveMultiplier', async () => {
      const mult = makeMultiplier();
      await (XPMultiplierService as any).storeActiveMultiplier(mult);

      const active = await XPMultiplierService.getActiveMultiplier();

      // Old behaviour: write went to AsyncStorage, read came from SQLite → always inactive
      expect(active.isActive).toBe(true);
      expect(active.multiplier).toBe(2.0);
      expect(active.source).toBe('harmony_streak');
      expect(active.timeRemaining).toBeGreaterThan(0);
    });

    test('expired multiplier is NOT active', async () => {
      const past = new Date(Date.now() - 60 * 60 * 1000);
      const mult = makeMultiplier({
        activatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        expiresAt: past,
      });
      await (XPMultiplierService as any).storeActiveMultiplier(mult);

      const active = await XPMultiplierService.getActiveMultiplier();
      expect(active.isActive).toBe(false);
      expect(active.multiplier).toBe(1);
    });

    test('clearActiveMultiplierStorage deactivates the multiplier', async () => {
      await (XPMultiplierService as any).storeActiveMultiplier(makeMultiplier());
      await (XPMultiplierService as any).clearActiveMultiplierStorage();

      const active = await XPMultiplierService.getActiveMultiplier();
      expect(active.isActive).toBe(false);
    });

    test('E2E: activateHarmonyMultiplier → 2x visible + cooldown set', async () => {
      // Eligible: 7-day harmony streak, no cooldown
      jest.spyOn(XPMultiplierService, 'calculateHarmonyStreak').mockResolvedValue({
        currentStreak: 7,
        longestStreak: 7,
        isActive: true,
        canActivateMultiplier: true,
        streakHistory: [],
      });

      const result = await XPMultiplierService.activateHarmonyMultiplier();
      expect(result.success).toBe(true);

      // THE regression: activation must be visible on the read path
      const active = await XPMultiplierService.getActiveMultiplier();
      expect(active.isActive).toBe(true);
      expect(active.multiplier).toBe(2.0);

      // Second activation must be rejected (already active)
      const second = await XPMultiplierService.activateHarmonyMultiplier();
      expect(second.success).toBe(false);
    });
  });

  // ========================================
  // HARMONY STREAK ANCHORING
  // ========================================

  describe('harmony streak calculation (today-in-progress anchoring)', () => {
    const calc = (data: DailyActivityData[]): number =>
      (XPMultiplierService as any).calculateStreakFromActivityData(data);

    test('CRITICAL: incomplete today does not zero a 7-day run ending yesterday', () => {
      const data = [day(0, false), ...[1, 2, 3, 4, 5, 6, 7].map((i) => day(i, true)), day(8, false)];
      // Old behaviour: returned 0 every morning → earned activation unavailable
      expect(calc(data)).toBe(7);
    });

    test('completed today counts into the streak', () => {
      const data = [0, 1, 2, 3, 4, 5, 6].map((i) => day(i, true));
      expect(calc(data)).toBe(7);
    });

    test('a missed PAST day still breaks the streak', () => {
      const data = [day(0, true), day(1, false), day(2, true), day(3, true)];
      expect(calc(data)).toBe(1); // only today — yesterday broke the run
    });

    test('no harmony days → 0', () => {
      expect(calc([day(0, false), day(1, false)])).toBe(0);
    });
  });

  // ========================================
  // LOYALTY SYSTEM
  // ========================================

  describe('loyalty tracking', () => {
    test('first launch of the day increments active days; repeat launch does not', async () => {
      const first = await LoyaltyService.trackDailyActivity();
      expect(first.isNewActiveDay).toBe(true);

      const second = await LoyaltyService.trackDailyActivity();
      expect(second.isNewActiveDay).toBe(false);

      const data = await LoyaltyService.getLoyaltyData();
      expect(data.totalActiveDays).toBe(1);
    });

    test('milestone fires at exactly its day count (First Week = 7)', async () => {
      await LoyaltyService.saveLoyaltyData({
        totalActiveDays: 6,
        lastActiveDate: subtractDays(T, 1),
        registrationDate: subtractDays(T, 10),
        longestActiveStreak: 6,
        currentActiveStreak: 6,
        loyaltyLevel: LoyaltyService.calculateLoyaltyLevel(6),
      });

      const result = await LoyaltyService.trackDailyActivity();

      expect(result.isNewActiveDay).toBe(true);
      expect(result.milestonesReached.map((m) => m.days)).toContain(7);
    });

    test('consecutive-day streak continues after yesterday, resets after a gap', async () => {
      await LoyaltyService.saveLoyaltyData({
        totalActiveDays: 5,
        lastActiveDate: subtractDays(T, 1), // yesterday → continues
        registrationDate: subtractDays(T, 10),
        longestActiveStreak: 5,
        currentActiveStreak: 5,
        loyaltyLevel: LoyaltyService.calculateLoyaltyLevel(5),
      });
      await LoyaltyService.trackDailyActivity();
      let data = await LoyaltyService.getLoyaltyData();
      expect(data.currentActiveStreak).toBe(6);

      // Now simulate a gap (last active 3 days ago)
      await LoyaltyService.saveLoyaltyData({
        ...data,
        lastActiveDate: subtractDays(T, 3),
        currentActiveStreak: 6,
      });
      // trackDailyActivity would see today ≠ lastActiveDate → new day, gap → reset to 1
      const result = await LoyaltyService.trackDailyActivity();
      expect(result.isNewActiveDay).toBe(true);
      data = await LoyaltyService.getLoyaltyData();
      expect(data.currentActiveStreak).toBe(1);
      expect(data.longestActiveStreak).toBe(6); // history preserved
    });

    test('loyalty level boundaries (30/100/365/1000)', () => {
      expect(LoyaltyService.calculateLoyaltyLevel(29)).toBe('newcomer');
      expect(LoyaltyService.calculateLoyaltyLevel(30)).toBe('explorer');
      expect(LoyaltyService.calculateLoyaltyLevel(100)).toBe('veteran');
      expect(LoyaltyService.calculateLoyaltyLevel(365)).toBe('legend');
      expect(LoyaltyService.calculateLoyaltyLevel(1000)).toBe('master');
    });
  });
});
