/**
 * Which days the Year view counts (Home's HabitStatsCard since E11d; until then
 * YearlyHabitOverview) — pure, tested in __tests__/yearlyOverviewLogic.test.ts.
 *
 * The data range runs from the first habit / check to today. The Year view
 * shows at most the last 365 days of it: until 2026-11-24 it took the whole
 * range, so after a year of use "Year" quietly meant "all time".
 */
import { DateString } from '@/src/types/common';

export const YEAR_DAYS = 365;

/** The last 365 days of an ascending range that ends today (or all of a shorter one). */
export function yearWindow(dataRangeAscending: DateString[]): DateString[] {
  return dataRangeAscending.slice(-YEAR_DAYS);
}
