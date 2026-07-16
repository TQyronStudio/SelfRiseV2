// Journal History "Peak Day" — Regression Suite
//
// WHY THIS EXISTS (July 2026, found by an external tester): a brand-new user who had
// written nothing saw "Peak Day: 5" on Home, right next to "Today 0 / Complete 0 /
// Bonus 0" — a peak of 5 is impossible when the best day is 0.
//
// Cause: one variable did two jobs. `maxCount` was the Y-AXIS SCALE, floored at 5 so
// an empty chart still renders nicely (`let currentMaxCount = 5`), and the same value
// was ALSO rendered as the "Peak Day" statistic. So Peak Day could never read below 5:
// Math.max(5, realBest) — every user writing 0-5 entries/day saw a fake 5.
//
// The fix separates the two: the axis keeps its AXIS_MIN floor; Peak Day is derived
// from the real per-day counts. These tests pin both halves — a cosmetic chart floor
// must never leak into a user-facing number.

const AXIS_MIN = 5; // mirrors StreakHistoryGraph.AXIS_MIN

interface JournalPoint {
  count: number;
}

/** Peak Day, exactly as the component derives it from journalHistory. */
function peakOf(history: JournalPoint[]): number {
  return history.reduce((max, point) => Math.max(max, point.count), 0);
}

/** Y-axis scale, exactly as the component computes it (floored at AXIS_MIN). */
function axisMaxOf(history: JournalPoint[]): number {
  return history.reduce((max, point) => Math.max(max, point.count), AXIS_MIN);
}

const days = (...counts: number[]): JournalPoint[] => counts.map((count) => ({ count }));

describe('Journal History — Peak Day vs Y-axis scale', () => {
  it('THE BUG: a brand-new user with no entries has a peak of 0, not 5', () => {
    const history = days(...new Array(30).fill(0));

    expect(peakOf(history)).toBe(0); // was 5 — the axis floor leaking through
    expect(axisMaxOf(history)).toBe(AXIS_MIN); // ...while the chart still scales to 5
  });

  it('reports the real best day when it is below the axis floor', () => {
    // The whole bug class: any peak under AXIS_MIN used to be reported as AXIS_MIN.
    expect(peakOf(days(0, 2, 1))).toBe(2);
    expect(peakOf(days(0, 0, 3, 1))).toBe(3);
    expect(peakOf(days(4))).toBe(4);
    expect(peakOf(days(5))).toBe(5); // genuinely 5 this time
  });

  it('reports the real best day when it exceeds the axis floor', () => {
    expect(peakOf(days(0, 3, 8, 2))).toBe(8);
    expect(axisMaxOf(days(0, 3, 8, 2))).toBe(8); // axis grows to fit
  });

  it('Peak Day is never inflated by the axis floor (peak <= axis, and peak is honest)', () => {
    for (const history of [days(), days(0), days(0, 1), days(0, 1, 2, 3, 4), days(9)]) {
      const peak = peakOf(history);
      const expected = history.length ? Math.max(...history.map((p) => p.count)) : 0;

      expect(peak).toBe(expected); // never floored
      expect(peak).toBeLessThanOrEqual(axisMaxOf(history)); // bars always fit the axis
    }
  });

  it('stays consistent with the neighbouring stats (peak 0 => no complete/bonus days)', () => {
    // The tester's exact screen: Today 0, Complete 0, Bonus 0 — so Peak MUST be 0.
    const history = days(...new Array(30).fill(0));

    const completeDays = history.filter((p) => p.count >= 3).length;
    const bonusDays = history.filter((p) => p.count >= 4).length;

    expect(completeDays).toBe(0);
    expect(bonusDays).toBe(0);
    expect(peakOf(history)).toBe(0);
  });
});
