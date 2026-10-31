/**
 * Validation for the goal the user sketches on onboarding screen 2.
 *
 * Deliberately mirrors GoalForm's rules (`GoalForm.tsx:290,326-330`): whole
 * numbers, greater than zero, at most MAX_GOAL_VALUE. A goal created here and then
 * edited in the normal form must not obey two different sets of rules.
 *
 * Imports only a plain constant, so the edge cases — an empty field, a lone minus
 * sign, "abc", a value over the cap — can be tested without the theme and i18n stack.
 */
import { MAX_GOAL_VALUE } from '@/src/constants/goals';

/** The same bound as GoalForm's `targetValueTooLarge` check. */
export const GOAL_TARGET_MAX = MAX_GOAL_VALUE;

/** Returns the usable number, or null when the field cannot be submitted yet. */
export function parseGoalTarget(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Reject anything that is not plainly digits: parseInt would happily turn
  // "12abc" into 12 and let the user submit a number they never typed.
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0 || value > GOAL_TARGET_MAX) return null;
  return value;
}

export interface GoalDraft {
  title: string;
  unit: string;
  targetValue: string;
}

export function isGoalDraftComplete(draft: GoalDraft): boolean {
  return (
    draft.title.trim().length > 0 &&
    draft.unit.trim().length > 0 &&
    parseGoalTarget(draft.targetValue) !== null
  );
}
