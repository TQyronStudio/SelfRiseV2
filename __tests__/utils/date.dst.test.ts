// Daylight-saving regression tests for daysBetween.
//
// Both ends are local midnights, so the gap is a whole number of days give or
// take one DST hour. The old Math.ceil turned the 25-hour autumn day into
// "2 days" (Oct 25 → Oct 26, 2026 in Europe), which inflated "days since the
// habit was created" from then on; the 23-hour spring day broke negative
// differences the same way. Each zone below crosses BOTH of its changes.
//
// Node honors process.env.TZ changes at runtime (see date.timezone.test.ts).

import { daysBetween } from '../../src/utils/date';

const ORIGINAL_TZ = process.env.TZ;

describe.each([
  // [zone, autumn change day, spring change day]
  ['Europe/Prague', '2026-10-25', '2026-03-29'],
  ['America/Los_Angeles', '2026-11-01', '2026-03-08'],
  ['Pacific/Auckland', '2026-04-05', '2026-09-27'],
])('daysBetween across DST in %s', (tz, autumnDay, springDay) => {
  beforeAll(() => {
    process.env.TZ = tz;
  });

  afterAll(() => {
    if (ORIGINAL_TZ === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = ORIGINAL_TZ;
    }
  });

  const shift = (date: string, days: number): string => {
    const [y, m, d] = date.split('-').map(Number);
    const local = new Date(y!, m! - 1, d! + days);
    const mm = String(local.getMonth() + 1).padStart(2, '0');
    const dd = String(local.getDate()).padStart(2, '0');
    return `${local.getFullYear()}-${mm}-${dd}`;
  };

  it.each([
    ['autumn', autumnDay],
    ['spring', springDay],
  ])('counts the %s change day as exactly one day', (_season, changeDay) => {
    expect(daysBetween(changeDay, shift(changeDay, 1))).toBe(1);
    expect(daysBetween(shift(changeDay, -1), shift(changeDay, 1))).toBe(2);
    expect(daysBetween(shift(changeDay, -10), shift(changeDay, 10))).toBe(20);
  });

  it.each([
    ['autumn', autumnDay],
    ['spring', springDay],
  ])('counts backwards across the %s change correctly', (_season, changeDay) => {
    expect(daysBetween(shift(changeDay, 1), changeDay)).toBe(-1);
    expect(daysBetween(shift(changeDay, 3), shift(changeDay, -3))).toBe(-6);
  });

  it('is zero for the same day', () => {
    expect(daysBetween(autumnDay, autumnDay)).toBe(0);
  });
});
