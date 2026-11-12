// Month streak of monthly challenges — consecutive calendar months with a
// completed challenge, and the bonus it earns.
//
// WHY THIS EXISTS (November 12, 2026): the completion bonus was read from
// `progress.currentStreak`, a field that is initialised to 0 and never updated,
// so nobody ever received the +5…25 % described in the guide. The streak is now
// counted from the one reliable record — the stored challenges with their month
// and final status — and both the payout and the completion window use it.
// See technical-guides:Monthly-Challenges.md → "Monthly Streak Bonus".

export interface MonthResult {
  /** 'YYYY-MM' */
  month: string;
  /** 'completed' | 'failed' | 'expired' | 'active' */
  status: string;
}

/** 'YYYY-MM' of the month before `month`. */
export function previousMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return '';
  const y = monthNumber === 1 ? year - 1 : year;
  const m = monthNumber === 1 ? 12 : monthNumber - 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * How many months in a row, directly before `month`, had a completed challenge.
 * A month without a challenge, or with one that was not completed, ends the row.
 */
export function completedMonthsInRowBefore(
  month: string,
  history: MonthResult[]
): number {
  const completed = new Set(
    history.filter(entry => entry.status === 'completed').map(entry => entry.month)
  );
  let count = 0;
  let cursor = previousMonth(month);
  while (cursor && completed.has(cursor)) {
    count++;
    cursor = previousMonth(cursor);
  }
  return count;
}

/**
 * Bonus for the month streak as a share of the base XP. `months` counts the
 * month being completed: the first month in a row earns nothing extra.
 */
export function monthStreakBonusShare(months: number): number {
  if (months >= 12) return 0.25;
  if (months >= 6) return 0.15;
  if (months >= 4) return 0.1;
  if (months >= 2) return 0.05;
  return 0;
}
