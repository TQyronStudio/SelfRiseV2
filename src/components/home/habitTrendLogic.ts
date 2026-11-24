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

export function overallTrend(weeklyRatesOldestFirst: number[]): {
  /** Average of the two most recent weeks. */
  recent: number;
  change: number;
  trend: Trend;
} {
  const rate = (i: number) => weeklyRatesOldestFirst[i] ?? 0;
  const earlier = (rate(0) + rate(1)) / 2;
  const recent = (rate(2) + rate(3)) / 2;
  const change = recent - earlier;
  const trend: Trend =
    change > TREND_THRESHOLD
      ? 'improving'
      : change < -TREND_THRESHOLD
        ? 'declining'
        : 'stable';
  return { recent, change, trend };
}
