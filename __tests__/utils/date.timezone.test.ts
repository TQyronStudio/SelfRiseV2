// Timezone regression tests for date utilities.
//
// Guards against the UTC-parsing bug found in the 2026-06 audit:
// `new Date('YYYY-MM-DD')` and `new Date(s + 'T00:00:00.000Z')` are parsed as
// UTC midnight (ES spec). For every user west of UTC the parsed Date fell on
// the PREVIOUS local calendar day, which:
//  - shifted day-of-week by one (wrong scheduled-day detection, wrong
//    scheduled-vs-bonus XP classification, wrong habit charts),
//  - made isValidDateString reject every valid date,
//  - froze the UserActivityTracker day-iteration loop (addDays via UTC parse
//    formatted back to the SAME date string → infinite loop).
//
// Node honors process.env.TZ changes at runtime, so we run the suite across
// a negative offset (LA), UTC, and a positive offset (Auckland).

import {
  parseDate,
  formatDateToString,
  getDayOfWeekFromDateString,
  isValidDateString,
  addDays,
  subtractDays,
} from '../../src/utils/date';
import { DayOfWeek, DateString } from '../../src/types/common';

const ORIGINAL_TZ = process.env.TZ;

describe.each([
  ['America/Los_Angeles (UTC-7/-8)', 'America/Los_Angeles'],
  ['UTC', 'UTC'],
  ['Pacific/Auckland (UTC+12/+13)', 'Pacific/Auckland'],
])('date utils in %s', (_label, tz) => {
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

  it('parseDate returns the SAME local calendar day as the date string', () => {
    const date = parseDate('2026-06-12');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5); // June (0-based)
    expect(date.getDate()).toBe(12);
    expect(date.getHours()).toBe(0); // local midnight
  });

  it('formatDateToString(parseDate(s)) round-trips for boundary dates', () => {
    const samples: DateString[] = [
      '2026-01-01', // year start
      '2026-06-12',
      '2026-12-31', // year end
      '2024-02-29', // leap day
      '2026-03-01',
    ];
    for (const s of samples) {
      expect(formatDateToString(parseDate(s))).toBe(s);
    }
  });

  it('getDayOfWeekFromDateString returns the correct weekday', () => {
    // 2026-06-12 is a Friday in every timezone's local calendar.
    expect(getDayOfWeekFromDateString('2026-06-12')).toBe(DayOfWeek.FRIDAY);
    // 2026-06-08 is a Monday.
    expect(getDayOfWeekFromDateString('2026-06-08')).toBe(DayOfWeek.MONDAY);
    // 2026-06-14 is a Sunday.
    expect(getDayOfWeekFromDateString('2026-06-14')).toBe(DayOfWeek.SUNDAY);
  });

  it('isValidDateString accepts valid dates and rejects invalid ones', () => {
    expect(isValidDateString('2026-06-12')).toBe(true);
    expect(isValidDateString('2024-02-29')).toBe(true); // leap day
    expect(isValidDateString('2026-02-29')).toBe(false); // not a leap year
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026-00-10')).toBe(false);
    expect(isValidDateString('garbage')).toBe(false);
  });

  it('addDays on a DateString ALWAYS advances the calendar day (no infinite-loop regression)', () => {
    // The UserActivityTracker loop bug: UTC-parsed +1 day formatted back to
    // the same string west of UTC. Walk a month and assert strict progress.
    let current: DateString = '2026-05-13';
    const seen = new Set<string>([current]);

    for (let i = 0; i < 31; i++) {
      const next = addDays(current, 1) as DateString;
      expect(next > current).toBe(true); // strictly increasing
      expect(seen.has(next)).toBe(false); // never repeats
      seen.add(next);
      current = next;
    }

    expect(current).toBe('2026-06-13');
  });

  it('subtractDays crosses month boundaries correctly', () => {
    expect(subtractDays('2026-06-12', 30)).toBe('2026-05-13');
    expect(subtractDays('2026-03-01', 1)).toBe('2026-02-28');
    expect(subtractDays('2024-03-01', 1)).toBe('2024-02-29'); // leap year
    expect(subtractDays('2026-01-01', 1)).toBe('2025-12-31'); // year boundary
  });
});
