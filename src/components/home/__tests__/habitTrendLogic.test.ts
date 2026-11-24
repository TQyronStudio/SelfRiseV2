/**
 * The overall habit trend reads the weeks in the right direction (live bug,
 * 2026-11-24: "recent" averaged the two OLDEST weeks, so the card said
 * "declining" to a user who was getting better).
 */
import { overallTrend } from '../habitTrendLogic';

describe('overallTrend() — weeks oldest first, this week last', () => {
  it('calls a rise improving', () => {
    expect(overallTrend([40, 50, 80, 90])).toEqual({ recent: 85, change: 40, trend: 'improving' });
  });

  it('calls a fall declining', () => {
    expect(overallTrend([90, 80, 50, 40])).toEqual({ recent: 45, change: -40, trend: 'declining' });
  });

  it('calls a small change stable', () => {
    expect(overallTrend([60, 60, 65, 65]).trend).toBe('stable');
  });

  it('treats missing weeks as 0', () => {
    expect(overallTrend([]).trend).toBe('stable');
  });

  it('a first week is no trend — weeks without data are left out, not 0', () => {
    expect(overallTrend([null, null, null, 80])).toEqual({ recent: 80, change: 0, trend: 'stable' });
  });

  it('compares the weeks that have data', () => {
    expect(overallTrend([null, 40, 80, 90]).change).toBe(45);
  });
});

