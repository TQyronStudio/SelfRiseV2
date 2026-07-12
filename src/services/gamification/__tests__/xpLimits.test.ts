// XP Limits & Anti-Spam — Unit Suite (pure module, no mocks needed)
//
// This is the first extracted module of the N28 GamificationService split.
// Because the logic is pure (data injected), every rule — including rate
// limiting, which was untestable inside the god-object due to the jest
// bypass — is verified here in isolation. Behavior contract:
// technical-guides:Gamification-Core.md ("Daily Limits Scale with Multipliers").

import {
  validateXPAddition,
  getSourceDailyLimit,
  getAdjustedDailyLimits,
  MAX_GOAL_TRANSACTIONS_PER_DAY,
  DailyXPSnapshot,
} from '../xpLimits';
import { XPSourceType } from '../../../types/gamification';
import { DAILY_XP_LIMITS, BALANCE_VALIDATION } from '../../../constants/gamification';

const NO_MULTIPLIER = { isActive: false, multiplier: 1 };
const DOUBLE = { isActive: true, multiplier: 2 };

function snapshot(overrides: Partial<DailyXPSnapshot> = {}): DailyXPSnapshot {
  return {
    totalXP: 0,
    xpBySource: {},
    goalTransactions: {},
    lastTransactionTime: 0, // long ago — rate limit inactive by default
    ...overrides,
  };
}

describe('xpLimits — daily limits & anti-spam (pure rules)', () => {
  // ========================================
  // SOURCE LIMIT MAP
  // ========================================

  describe('getSourceDailyLimit', () => {
    test('activity sources have limits; milestone sources are exempt (null)', () => {
      expect(getSourceDailyLimit(XPSourceType.HABIT_COMPLETION)).toBe(DAILY_XP_LIMITS.HABITS_MAX_DAILY);
      expect(getSourceDailyLimit(XPSourceType.JOURNAL_ENTRY)).toBe(DAILY_XP_LIMITS.JOURNAL_MAX_DAILY);
      expect(getSourceDailyLimit(XPSourceType.GOAL_PROGRESS)).toBe(DAILY_XP_LIMITS.GOALS_MAX_DAILY);

      // Milestone rewards must never be capped
      expect(getSourceDailyLimit(XPSourceType.GOAL_COMPLETION)).toBeNull();
      expect(getSourceDailyLimit(XPSourceType.ACHIEVEMENT_UNLOCK)).toBeNull();
      expect(getSourceDailyLimit(XPSourceType.MONTHLY_CHALLENGE)).toBeNull();
      expect(getSourceDailyLimit(XPSourceType.XP_MULTIPLIER_BONUS)).toBeNull();
      expect(getSourceDailyLimit(XPSourceType.LOYALTY_MILESTONE)).toBeNull();
    });
  });

  // ========================================
  // MULTIPLIER SCALING
  // ========================================

  describe('getAdjustedDailyLimits', () => {
    test('2x multiplier doubles total and source limits', () => {
      const limits = getAdjustedDailyLimits(DOUBLE);
      expect(limits.totalDaily).toBe(Math.floor(DAILY_XP_LIMITS.TOTAL_DAILY_MAX * 2));
      expect(limits.sourceLimit(XPSourceType.HABIT_COMPLETION)).toBe(
        Math.floor(DAILY_XP_LIMITS.HABITS_MAX_DAILY * 2)
      );
    });

    test('inactive multiplier keeps base limits; exempt sources stay null', () => {
      const limits = getAdjustedDailyLimits({ isActive: false, multiplier: 2 });
      expect(limits.totalDaily).toBe(DAILY_XP_LIMITS.TOTAL_DAILY_MAX);
      expect(limits.sourceLimit(XPSourceType.MONTHLY_CHALLENGE)).toBeNull();
    });
  });

  // ========================================
  // VALIDATION RULES
  // ========================================

  describe('validateXPAddition', () => {
    test('normal addition passes untouched', () => {
      const r = validateXPAddition({
        amount: 25,
        source: XPSourceType.HABIT_COMPLETION,
        dailyData: snapshot(),
        multiplier: NO_MULTIPLIER,
      });
      expect(r).toEqual({ isValid: true, allowedAmount: 25 });
    });

    test('goal anti-spam: 3rd transaction passes, 4th is rejected', () => {
      const base = {
        amount: 35,
        source: XPSourceType.GOAL_PROGRESS,
        sourceId: 'goal-1',
        multiplier: NO_MULTIPLIER,
      };

      const third = validateXPAddition({
        ...base,
        dailyData: snapshot({ goalTransactions: { 'goal-1': MAX_GOAL_TRANSACTIONS_PER_DAY - 1 } }),
      });
      expect(third.isValid).toBe(true);

      const fourth = validateXPAddition({
        ...base,
        dailyData: snapshot({ goalTransactions: { 'goal-1': MAX_GOAL_TRANSACTIONS_PER_DAY } }),
      });
      expect(fourth.isValid).toBe(false);
      expect(fourth.allowedAmount).toBe(0);
    });

    test('goal anti-spam does NOT apply to GOAL_COMPLETION (milestone)', () => {
      const r = validateXPAddition({
        amount: 250,
        source: XPSourceType.GOAL_COMPLETION,
        sourceId: 'goal-1',
        dailyData: snapshot({ goalTransactions: { 'goal-1': 99 } }),
        multiplier: NO_MULTIPLIER,
      });
      expect(r.isValid).toBe(true);
      expect(r.allowedAmount).toBe(250);
    });

    test('single-transaction cap rejects oversized non-exempt amounts', () => {
      const r = validateXPAddition({
        amount: BALANCE_VALIDATION.MAX_SINGLE_TRANSACTION_XP + 1,
        source: XPSourceType.HABIT_COMPLETION,
        dailyData: snapshot(),
        multiplier: NO_MULTIPLIER,
      });
      expect(r.isValid).toBe(false);
    });

    test('exempt source (MONTHLY_CHALLENGE) bypasses single-transaction cap AND daily total', () => {
      const r = validateXPAddition({
        amount: 25000, // 5⭐ challenge reward
        source: XPSourceType.MONTHLY_CHALLENGE,
        dailyData: snapshot({ totalXP: DAILY_XP_LIMITS.TOTAL_DAILY_MAX }), // day already full
        multiplier: NO_MULTIPLIER,
      });
      expect(r.isValid).toBe(true);
      expect(r.allowedAmount).toBe(25000);
    });

    test('daily total limit TRIMS the amount when partially available', () => {
      const remaining = 10;
      const r = validateXPAddition({
        amount: 25,
        source: XPSourceType.HABIT_COMPLETION,
        dailyData: snapshot({ totalXP: DAILY_XP_LIMITS.TOTAL_DAILY_MAX - remaining }),
        multiplier: NO_MULTIPLIER,
      });
      expect(r.isValid).toBe(true);
      expect(r.allowedAmount).toBe(remaining);
      expect(r.reason).toContain('reduced');
    });

    test('daily total limit REJECTS when nothing remains', () => {
      const r = validateXPAddition({
        amount: 25,
        source: XPSourceType.HABIT_COMPLETION,
        dailyData: snapshot({ totalXP: DAILY_XP_LIMITS.TOTAL_DAILY_MAX }),
        multiplier: NO_MULTIPLIER,
      });
      expect(r.isValid).toBe(false);
      expect(r.allowedAmount).toBe(0);
    });

    test('per-source limit trims independently of daily total', () => {
      const remaining = 5;
      const r = validateXPAddition({
        amount: 25,
        source: XPSourceType.HABIT_COMPLETION,
        dailyData: snapshot({
          totalXP: 100, // plenty of daily headroom
          xpBySource: { [XPSourceType.HABIT_COMPLETION]: DAILY_XP_LIMITS.HABITS_MAX_DAILY - remaining },
        }),
        multiplier: NO_MULTIPLIER,
      });
      expect(r.isValid).toBe(true);
      expect(r.allowedAmount).toBe(remaining);
    });

    test('2x multiplier doubles the effective ceiling (guide: limits scale)', () => {
      const r = validateXPAddition({
        amount: 25,
        source: XPSourceType.HABIT_COMPLETION,
        dailyData: snapshot({ totalXP: DAILY_XP_LIMITS.TOTAL_DAILY_MAX }), // full at 1x…
        multiplier: DOUBLE, // …but 2x is active
      });
      expect(r.isValid).toBe(true);
      expect(r.allowedAmount).toBe(25);
    });

    test('rate limiting rejects rapid consecutive gains (previously untestable)', () => {
      const now = 1_000_000;
      const r = validateXPAddition({
        amount: 25,
        source: XPSourceType.HABIT_COMPLETION,
        dailyData: snapshot({ lastTransactionTime: now - 1 }),
        multiplier: NO_MULTIPLIER,
        nowMs: now,
      });
      expect(r.isValid).toBe(false);
      expect(r.reason).toContain('short time');
    });

    test('rate limiting exempts GOAL_COMPLETION and respects skipRateLimit', () => {
      const now = 1_000_000;
      const rapidCompletion = validateXPAddition({
        amount: 250,
        source: XPSourceType.GOAL_COMPLETION,
        dailyData: snapshot({ lastTransactionTime: now - 1 }),
        multiplier: NO_MULTIPLIER,
        nowMs: now,
      });
      expect(rapidCompletion.isValid).toBe(true);

      const skipped = validateXPAddition({
        amount: 25,
        source: XPSourceType.HABIT_COMPLETION,
        dailyData: snapshot({ lastTransactionTime: now - 1 }),
        multiplier: NO_MULTIPLIER,
        nowMs: now,
        skipRateLimit: true,
      });
      expect(skipped.isValid).toBe(true);
    });

    test('negative XP (undo) is not blocked by goal anti-spam', () => {
      const r = validateXPAddition({
        amount: -35,
        source: XPSourceType.GOAL_PROGRESS,
        sourceId: 'goal-1',
        dailyData: snapshot({ goalTransactions: { 'goal-1': MAX_GOAL_TRANSACTIONS_PER_DAY } }),
        multiplier: NO_MULTIPLIER,
      });
      expect(r.isValid).toBe(true);
    });
  });
});
