import { DateString } from '../types/common';
import { GoalTimelineStatus } from '../types/goal';

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
