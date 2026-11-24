/**
 * The Year view counts at most the last 365 days (live bug, 2026-11-24: it took
 * the whole history, so after a year "Year" meant "all time").
 */
import { getDateRange } from '@/src/utils/date';
import { yearWindow } from '../yearlyOverviewLogic';

describe('yearWindow()', () => {
  it('cuts a longer history to the last 365 days, ending today', () => {
    const range = getDateRange('2025-01-01', '2026-11-24');
    const window = yearWindow(range);
    expect(window).toHaveLength(365);
    expect(window[window.length - 1]).toBe('2026-11-24');
    expect(window[0]).toBe('2025-11-25');
  });

  it('keeps a shorter history whole', () => {
    const range = getDateRange('2026-11-01', '2026-11-24');
    expect(yearWindow(range)).toEqual(range);
  });
});
