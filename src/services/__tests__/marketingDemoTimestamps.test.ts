// Marketing demo seed times — nothing may be stamped in the future.
//
// Device test 2026-09-24: the demo stamped today's XP row at 20:29. Loaded at
// 20:06, that row sat in the future, the anti-spam rate limit read the negative
// gap as "< 100 ms" and rejected every habit, journal and goal XP gain — the
// demo is loaded right before filming, so no +XP could be shown on camera.

import { asTimestamp } from '../marketingDemoDataService';

const TODAY = '2026-09-24';
const YESTERDAY = '2026-09-23';
const at = (date: string, time: string) => new Date(`${date}T${time}`).getTime();

describe('marketing demo — asTimestamp', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test.each([
    ['right after midnight', '00:00:30'],
    ['early morning', '07:15:00'],
    ['before the XP row time (the reported case)', '20:06:00'],
    ['late evening', '23:59:00'],
  ])('no record of today is in the future: %s', (_label, time) => {
    const now = at(TODAY, time);
    jest.useFakeTimers({ now });

    for (let hour = 0; hour < 24; hour += 1) {
      for (const minute of [0, 29, 59]) {
        expect(asTimestamp(TODAY, hour, minute)).toBeLessThanOrEqual(now);
      }
    }
  });

  test("today's records keep their order", () => {
    jest.useFakeTimers({ now: at(TODAY, '10:00:00') });

    const journal = [1, 2, 3, 13].map(entry => asTimestamp(TODAY, 19, entry));
    const xpRow = asTimestamp(TODAY, 20, 29);
    const levelUp = asTimestamp(TODAY, 21, 16);

    expect(journal).toEqual([...journal].sort((a, b) => a - b));
    expect(new Set(journal).size).toBe(journal.length);
    expect(journal[journal.length - 1]).toBeLessThan(xpRow);
    expect(xpRow).toBeLessThan(levelUp);
  });

  test('past days keep their wall-clock time', () => {
    jest.useFakeTimers({ now: at(TODAY, '10:00:00') });

    expect(asTimestamp(YESTERDAY, 20, 29)).toBe(at(YESTERDAY, '20:29:00'));
  });
});
