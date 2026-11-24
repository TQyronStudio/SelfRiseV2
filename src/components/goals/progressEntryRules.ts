/**
 * The date of a goal progress entry (ProgressEntryForm) — pure, tested in
 * __tests__/progressEntryRules.test.ts.
 *
 * The field is free text. Until 2026-11-24 anything typed was saved: "2026-13-45",
 * "tomorrow" or a future day went into storage, where entries are sorted and
 * replayed by date (a wrong date reorders the goal's history and its value).
 */
import { DateString } from '@/src/types/common';
import { isValidDateString } from '@/src/utils/date';

export type ProgressDateError = 'format' | 'future';

export function progressDateError(
  date: string,
  todayStr: DateString
): ProgressDateError | null {
  const trimmed = date.trim();
  if (!isValidDateString(trimmed)) return 'format';
  if (trimmed > todayStr) return 'future';
  return null;
}
