/**
 * The overall habit trend on Home (HabitTrendAnalysis) — pure, tested in
 * __tests__/habitTrendLogic.test.ts.
 *
 * Takes the last four weekly completion rates OLDEST FIRST (the way the card
 * builds them: this week is the last one) and compares the two recent weeks with
 * the two before. Until 2026-11-24 the card averaged weeks [0] and [1] as
 * "recent" — the two OLDEST — so a user getting better read "declining".
 */
export type Trend = 'improving' | 'declining' | 'stable';

/** A change of more than this many percentage points counts as a trend. */
export const TREND_THRESHOLD = 10;

export function overallTrend(weeklyRatesOldestFirst: (number | null)[]): {
  /** Average of the recent weeks that had something to rate. */
  recent: number;
  change: number;
  trend: Trend;
} {
  // null = a week with nothing to rate (no habit yet, or paused all week). It
  // is left out — counted as 0 it made a first week read "improving".
  const avg = (rates: (number | null | undefined)[]) => {
    const known = rates.filter((r): r is number => typeof r === 'number');
    return known.length ? known.reduce((a, b) => a + b, 0) / known.length : null;
  };
  const w = weeklyRatesOldestFirst;
  const earlier = avg([w[0], w[1]]);
  const recent = avg([w[2], w[3]]);
  if (earlier === null || recent === null) {
    return { recent: recent ?? 0, change: 0, trend: 'stable' };
  }
  const change = recent - earlier;
  const trend: Trend =
    change > TREND_THRESHOLD
      ? 'improving'
      : change < -TREND_THRESHOLD
        ? 'declining'
        : 'stable';
  return { recent, change, trend };
}
