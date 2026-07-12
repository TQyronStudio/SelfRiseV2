// XP Limits & Anti-Spam Validation (extracted from GamificationService — N28, July 2026)
//
// PURE decision logic: given a snapshot of today's XP data and the active
// multiplier, decide whether an XP addition is allowed, trimmed, or rejected.
// This module performs NO I/O — the caller (GamificationService façade)
// fetches the data and injects it. That keeps the rules unit-testable in
// complete isolation and keeps this file free of storage/flag concerns.
//
// RULES OF THE MODULE (do not break):
// - No imports from gamificationService (would create a require cycle).
// - No AsyncStorage/SQLite/feature-flag access — data comes in as parameters.
// - Behavior must match technical-guides:Gamification-Core.md
//   ("Daily Limits Scale with Multipliers" — transaction COUNTS do not scale).

import { XPSourceType } from '../../types/gamification';
import { DAILY_XP_LIMITS, BALANCE_VALIDATION } from '../../constants/gamification';

// ========================================
// TYPES
// ========================================

/** Minimal snapshot of today's XP state needed for validation. */
export interface DailyXPSnapshot {
  totalXP: number;
  xpBySource: Partial<Record<XPSourceType, number>>;
  /** goalId → count of positive XP transactions today (goal anti-spam) */
  goalTransactions: Record<string, number>;
  /** Timestamp (ms) of the last XP transaction today */
  lastTransactionTime: number;
}

export interface MultiplierSnapshot {
  isActive: boolean;
  multiplier: number;
}

export interface XPValidationResult {
  isValid: boolean;
  allowedAmount: number;
  reason?: string;
}

export interface ValidateXPAdditionParams {
  amount: number;
  source: XPSourceType;
  /** Source entity id (goal id for goal anti-spam) */
  sourceId?: string | undefined;
  dailyData: DailyXPSnapshot;
  multiplier: MultiplierSnapshot;
  /**
   * Skip the rate-limit check. The façade passes true in test environments;
   * goal completions are exempted internally (legitimate rapid transactions).
   */
  skipRateLimit?: boolean;
  /** Injected clock for testability; defaults to Date.now() */
  nowMs?: number;
}

// Anti-spam: max positive XP transactions per goal per day
// (migrated from GoalStorage.MAX_DAILY_POSITIVE_XP_PER_GOAL)
export const MAX_GOAL_TRANSACTIONS_PER_DAY = 3;

// ========================================
// SOURCE LIMITS
// ========================================

/**
 * Daily XP limit for a specific source. `null` = exempt from daily limits
 * (milestone rewards: goal completion, achievements, monthly challenge, …).
 */
export function getSourceDailyLimit(source: XPSourceType): number | null {
  const sourceMap: Record<XPSourceType, number | null> = {
    [XPSourceType.HABIT_COMPLETION]: DAILY_XP_LIMITS.HABITS_MAX_DAILY,
    [XPSourceType.HABIT_BONUS]: DAILY_XP_LIMITS.HABITS_MAX_DAILY,
    [XPSourceType.HABIT_STREAK_MILESTONE]: DAILY_XP_LIMITS.HABITS_MAX_DAILY,
    [XPSourceType.JOURNAL_ENTRY]: DAILY_XP_LIMITS.JOURNAL_MAX_DAILY,
    [XPSourceType.JOURNAL_BONUS]: DAILY_XP_LIMITS.JOURNAL_MAX_DAILY,
    [XPSourceType.JOURNAL_BONUS_MILESTONE]: DAILY_XP_LIMITS.JOURNAL_MAX_DAILY,
    [XPSourceType.JOURNAL_STREAK_MILESTONE]: DAILY_XP_LIMITS.JOURNAL_MAX_DAILY,
    [XPSourceType.GOAL_PROGRESS]: DAILY_XP_LIMITS.GOALS_MAX_DAILY,
    [XPSourceType.GOAL_COMPLETION]: null, // No daily limit - milestone achievement
    [XPSourceType.GOAL_MILESTONE]: DAILY_XP_LIMITS.GOALS_MAX_DAILY,
    [XPSourceType.RECOMMENDATION_FOLLOW]: DAILY_XP_LIMITS.ENGAGEMENT_MAX_DAILY,
    [XPSourceType.ACHIEVEMENT_UNLOCK]: null, // No daily limit
    [XPSourceType.MONTHLY_CHALLENGE]: null, // No daily limit (one per month)
    [XPSourceType.XP_MULTIPLIER_BONUS]: null, // No daily limit
    [XPSourceType.LOYALTY_MILESTONE]: null, // No daily limit
    [XPSourceType.DAILY_ACTIVITY]: null, // No daily limit
    [XPSourceType.INACTIVE_USER_RETURN]: null, // No daily limit
  };

  return sourceMap[source] || null;
}

/**
 * Daily limits adjusted for the active XP multiplier — when 2x XP is active,
 * limits scale 2x for fair gameplay. Transaction counts do NOT scale.
 */
export function getAdjustedDailyLimits(multiplierData: MultiplierSnapshot): {
  totalDaily: number;
  sourceLimit: (source: XPSourceType) => number | null;
} {
  const multiplier = multiplierData.isActive ? multiplierData.multiplier : 1;

  const adjustedTotalDaily = Math.floor(DAILY_XP_LIMITS.TOTAL_DAILY_MAX * multiplier);

  const adjustedSourceLimit = (source: XPSourceType): number | null => {
    const baseLimit = getSourceDailyLimit(source);
    return baseLimit ? Math.floor(baseLimit * multiplier) : null;
  };

  return {
    totalDaily: adjustedTotalDaily,
    sourceLimit: adjustedSourceLimit,
  };
}

// ========================================
// VALIDATION (pure, synchronous)
// ========================================

/**
 * Validate an XP addition against daily limits and anti-spam rules.
 *
 * Order of checks (behavior-identical to the pre-extraction implementation):
 * 1. Goal anti-spam — max 3 positive transactions per goal per day
 *    (GOAL_PROGRESS / GOAL_MILESTONE only; GOAL_COMPLETION is exempt)
 * 2. Single-transaction cap (exempt sources skip)
 * 3. Total daily limit, multiplier-adjusted (may TRIM the amount)
 * 4. Per-source daily limit, multiplier-adjusted (may TRIM the amount)
 * 5. Rate limiting (min time between gains; goal completions exempt)
 *
 * NOTE: Journal position-based XP (20/20/20, 8, 0) is intentionally NOT
 * validated here — the storage layer computes it from real entry positions
 * (duplicating it here caused desync bugs; see guide).
 */
export function validateXPAddition(params: ValidateXPAdditionParams): XPValidationResult {
  const {
    amount,
    source,
    sourceId,
    dailyData,
    multiplier,
    skipRateLimit = false,
    nowMs = Date.now(),
  } = params;

  // 1. Goal anti-spam: max positive transactions per goal per day
  if (
    amount > 0 &&
    sourceId &&
    (source === XPSourceType.GOAL_PROGRESS || source === XPSourceType.GOAL_MILESTONE)
  ) {
    const currentGoalTransactions = dailyData.goalTransactions[sourceId] || 0;
    if (currentGoalTransactions >= MAX_GOAL_TRANSACTIONS_PER_DAY) {
      return {
        isValid: false,
        allowedAmount: 0,
        reason: `Goal has reached daily XP limit (${MAX_GOAL_TRANSACTIONS_PER_DAY} positive XP transactions per day)`,
      };
    }
  }

  // Exempt sources (null limit) bypass amount caps — milestone rewards
  const sourceHasNoLimit = getSourceDailyLimit(source) === null;

  // 2. Maximum single transaction (skip for exempt sources)
  if (!sourceHasNoLimit && amount > BALANCE_VALIDATION.MAX_SINGLE_TRANSACTION_XP) {
    return {
      isValid: false,
      allowedAmount: 0,
      reason: `Single transaction cannot exceed ${BALANCE_VALIDATION.MAX_SINGLE_TRANSACTION_XP} XP`,
    };
  }

  const adjustedLimits = getAdjustedDailyLimits(multiplier);
  const currentDailyTotal = dailyData.totalXP;
  const currentSourceTotal = dailyData.xpBySource[source] || 0;

  // 3. Total daily limit (skip for exempt sources)
  if (!sourceHasNoLimit && currentDailyTotal + amount > adjustedLimits.totalDaily) {
    const allowedAmount = Math.max(0, adjustedLimits.totalDaily - currentDailyTotal);
    if (allowedAmount === 0) {
      return {
        isValid: false,
        allowedAmount: 0,
        reason: `Daily XP limit reached (${adjustedLimits.totalDaily} XP with current multiplier)`,
      };
    }
    return {
      isValid: true,
      allowedAmount,
      reason: `Amount reduced to daily limit (${adjustedLimits.totalDaily} with multiplier)`,
    };
  }

  // 4. Per-source daily limit
  const sourceLimit = adjustedLimits.sourceLimit(source);
  if (sourceLimit && currentSourceTotal + amount > sourceLimit) {
    const allowedAmount = Math.max(0, sourceLimit - currentSourceTotal);
    if (allowedAmount === 0) {
      return {
        isValid: false,
        allowedAmount: 0,
        reason: `Daily limit for ${source} reached (${sourceLimit} XP with current multiplier)`,
      };
    }
    return {
      isValid: true,
      allowedAmount,
      reason: `Amount reduced to source limit (${sourceLimit} with multiplier)`,
    };
  }

  // 5. Rate limiting (goal completions are legitimate rapid transactions)
  const timeSinceLastTransaction = nowMs - dailyData.lastTransactionTime;
  const isGoalCompletion = source === XPSourceType.GOAL_COMPLETION;

  if (
    !isGoalCompletion &&
    !skipRateLimit &&
    timeSinceLastTransaction < BALANCE_VALIDATION.MIN_TIME_BETWEEN_IDENTICAL_GAINS
  ) {
    return {
      isValid: false,
      allowedAmount: 0,
      reason: 'Too many transactions in short time',
    };
  }

  return { isValid: true, allowedAmount: amount };
}
