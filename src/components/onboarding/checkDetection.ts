/**
 * Deciding when the final onboarding card has served its purpose.
 *
 * Looks simple ("did they check a habit today?") and is not, because of the
 * restart case: someone who reruns onboarding from Settings in the evening may
 * ALREADY have checked habits today. A naive predicate would see those, declare
 * victory the instant the card appeared, and rob the user of the one moment the
 * screen exists for.
 *
 * So the card records a baseline when it mounts and waits for that count to
 * GROW. Import-free so both cases can be tested directly.
 *
 * Since 2026-10-11 screen 3 normally knows WHICH habit the onboarding created
 * and asks `isHabitCheckedOn` instead; the count-based check is the fallback
 * for when that habit is unknown (deleted, or remembered state lost).
 */

export interface CompletionLike {
  date: string;
  completed: boolean;
}

/** Ticks recorded for `today`. Unchecking removes/falsifies a record, so this can fall. */
export function countChecksOn(completions: CompletionLike[], today: string): number {
  return completions.filter(c => c.date === today && c.completed).length;
}

/** True once the user has ticked something they had not ticked when the card appeared. */
export function hasNewCheckSince(
  completions: CompletionLike[],
  today: string,
  baseline: number
): boolean {
  return countChecksOn(completions, today) > baseline;
}

/** A completion that also says which habit it belongs to. */
export interface HabitCompletionLike extends CompletionLike {
  habitId: string;
}

/**
 * Has THIS habit been ticked on `today`? Used when screen 3 knows which habit
 * the onboarding created — the normal case. It needs no baseline: that habit
 * was created minutes ago in this very run, so any tick on it is the user's
 * first. It also survives a force-quit: a habit ticked before the kill is
 * still ticked on resume, so the flow continues to the Day 1 screen.
 */
export function isHabitCheckedOn(
  completions: HabitCompletionLike[],
  habitId: string,
  today: string
): boolean {
  return completions.some(c => c.habitId === habitId && c.date === today && c.completed);
}
