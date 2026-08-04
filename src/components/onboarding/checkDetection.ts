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
