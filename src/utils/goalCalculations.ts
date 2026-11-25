import { DateString } from '../types/common';
import { GoalStatus, GoalTimelineStatus } from '../types/goal';
import { addDays, daysBetween, isValidDateString } from './date';

/**
 * Pure goal-domain calculations.
 *
 * WHY THIS FILE EXISTS (super audit Fáze 13): `calculateTimelineStatus` used to
 * live in `src/services/storage/goalStorage.ts` — the LEGACY AsyncStorage
 * implementation — and `SQLiteGoalStorage.ts:15` imported it from there. That was
 * the only real functional coupling between the live SQLite storage and the dead
 * legacy layer, and it blocked deleting the legacy files. The function itself is
 * pure (no storage access), so it belongs in utils, next to `habitCalculations.ts`.
 *
 * Moved verbatim — no behaviour change.
 */

/**
 * Compare the projected completion date against the goal's target date.
 *
 * Returns 'onTrack' when either date is missing — a goal without a target date
 * cannot be late.
 */
export function calculateTimelineStatus(
  estimatedCompletionDate: DateString | undefined,
  targetDate: DateString | undefined
): GoalTimelineStatus {
  if (!estimatedCompletionDate || !targetDate) {
    return 'onTrack'; // Default when no dates available
  }

  const estimated = new Date(estimatedCompletionDate);

  // Parse target date - handle Czech format (DD.MM.YYYY) and ISO format (YYYY-MM-DD)
  let target: Date;
  if (targetDate.includes('.')) {
    // Czech format: DD.MM.YYYY
    const parts = targetDate.split('.');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      target = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      target = new Date(targetDate);
    }
  } else {
    // ISO format: YYYY-MM-DD
    target = new Date(targetDate);
  }

  // Calculate difference in days
  const diffTime = estimated.getTime() - target.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Apply the new logic based on requirements
  if (diffDays <= -30) {
    return 'wayAhead'; // More than 30 days early
  } else if (diffDays <= -1) {
    return 'ahead'; // 1-30 days early
  } else if (diffDays <= 1) {
    return 'onTrack'; // Approximately same (±1 day)
  } else if (diffDays <= 30) {
    return 'behind'; // 1-30 days late
  } else {
    return 'wayBehind'; // More than 30 days late
  }
}

// ---------------------------------------------------------------------------
// Pace (migration E14, R-17): ONE rule for the card, the detail and the overview
// ---------------------------------------------------------------------------

/**
 * The few fields the progress and pace rules read — a Goal fits as it is.
 * `startValue` is where the goal began (0 for a goal that counts up; the
 * "measure" kind in E16 brings its own, and the rules already work downwards).
 */
export interface PaceGoal {
  currentValue: number;
  targetValue: number;
  startValue?: number;
  startDate: DateString;
  targetDate?: DateString | undefined;
  status: GoalStatus;
}

/** Within this many days of the plan line a goal reads "on pace". */
export const PACE_TOLERANCE_DAYS = 3;

/**
 * A goal's date as a local `YYYY-MM-DD`. Old goals may still carry the Czech
 * `DD.MM.YYYY` form (the storage reads both); anything else is no date.
 * Never `new Date('YYYY-MM-DD')` — that is UTC midnight, a day early in the west.
 */
export function goalDate(value: string | undefined): DateString | null {
  if (!value) return null;
  if (isValidDateString(value)) return value as DateString;
  const czech = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim());
  if (!czech) return null;
  const iso = `${czech[3]}-${czech[2]!.padStart(2, '0')}-${czech[1]!.padStart(2, '0')}`;
  return isValidDateString(iso) ? (iso as DateString) : null;
}

/**
 * How far from start to target, 0..1 and beyond (a goal may pass 100 %).
 * Works in either direction (84.6 → 78 kg) and never goes below 0.
 */
export function fractionOf(goal: PaceGoal, value = goal.currentValue): number {
  const start = goal.startValue ?? 0;
  const span = goal.targetValue - start;
  if (span === 0) return 1;
  return Math.max(0, (value - start) / span);
}

export type PaceState = 'ahead' | 'onPace' | 'behind' | 'overdue' | 'none' | 'done';

export interface Pace {
  state: PaceState;
  /** Days ahead (+) or behind (−) the straight line from start to deadline. */
  days: number;
  /** Where the plan line is today (0..1); null without a running deadline. */
  expected: number | null;
  /** Days until the deadline (0 = due today); null when there is none to count to. */
  daysLeft: number | null;
  /** Units a week still needed to land on the deadline. */
  neededPerWeek: number | null;
  /** Units a week so far. */
  yourPerWeek: number;
  /** When the goal lands at the pace so far; null when done or with no progress. */
  projected: DateString | null;
}

/**
 * The goal against its plan: the straight line from the start date (at the start
 * value) to the deadline (at the target). Days ahead or behind = how many days of
 * that line the progress is in front of, or behind, today's point on it.
 *
 *   done     — completed, or at 100 % and beyond
 *   none     — no deadline: nothing to be late for
 *   overdue  — the deadline has passed and the goal is not done; nothing is
 *              counted any further (a number growing every day only scolds)
 *   ahead / onPace / behind — ±PACE_TOLERANCE_DAYS around the line
 */
export function paceOf(goal: PaceGoal, today: DateString): Pace {
  const fraction = fractionOf(goal);
  const start = goalDate(goal.startDate) ?? today;
  const elapsed = Math.max(1, daysBetween(start, today));
  const span = Math.abs(goal.targetValue - (goal.startValue ?? 0));
  const doneAmount = Math.min(1, fraction) * span;
  const perDay = doneAmount / elapsed;
  const remaining = Math.max(0, span - doneAmount);
  const yourPerWeek = perDay * 7;
  const quiet = { days: 0, expected: null, daysLeft: null, neededPerWeek: null };

  if (goal.status === GoalStatus.COMPLETED || fraction >= 1) {
    return { state: 'done', ...quiet, yourPerWeek, projected: null };
  }
  const projected =
    perDay > 0
      ? (addDays(today, Math.ceil(remaining / perDay)) as DateString)
      : null;
  const deadline = goalDate(goal.targetDate);
  if (!deadline) {
    return { state: 'none', ...quiet, yourPerWeek, projected };
  }
  const daysLeft = daysBetween(today, deadline);
  if (daysLeft < 0) {
    return { state: 'overdue', ...quiet, yourPerWeek, projected };
  }
  const total = Math.max(1, daysBetween(start, deadline));
  const expected = Math.min(1, Math.max(0, elapsed / total));
  const days = Math.round((fraction - expected) * total);
  return {
    state:
      days > PACE_TOLERANCE_DAYS
        ? 'ahead'
        : days < -PACE_TOLERANCE_DAYS
          ? 'behind'
          : 'onPace',
    days,
    expected,
    daysLeft,
    neededPerWeek: (remaining / Math.max(1, daysLeft)) * 7,
    yourPerWeek,
    projected,
  };
}

/**
 * The one-tap amounts on a goal card, from its target: a small goal counts by
 * one, a big one by a step that still moves the bar. Above 2 000 the steps grow
 * with every power of ten (10 000 → 50/100/250, 1 000 000 → 5 000/10 000/25 000).
 */
export function quickAmounts(targetValue: number): number[] {
  const target = Math.abs(targetValue);
  if (target <= 30) return [1];
  if (target <= 200) return [1, 5];
  if (target <= 2000) return [10, 50];
  const scale = 10 ** Math.max(1, Math.floor(Math.log10(target)) - 3);
  return [5 * scale, 10 * scale, 25 * scale];
}
