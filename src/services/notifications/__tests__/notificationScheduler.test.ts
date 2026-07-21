// Evening Notification Selection — Regression Suite (super audit Fáze 7, N-7.7)
//
// WHY THIS EXISTS: the whole notification area had ZERO tests, even though the
// evening message is chosen by a weighted lottery — exactly the kind of logic
// where a wrong denominator or a missing guard is invisible in review but
// changes what every user receives. Covers:
//   - the weight formulas from technical-guides:Notifications.md (habits,
//     journal, bonus) and the goals option added 2026-07-20 (N-7.8, weight 40)
//   - the "all requirements met → NO notification" early-exit (never a
//     fallback to a random text)
//   - the guard rules (bonus only after 3 basic entries; goals only when the
//     user actually has active goals)
//
// The weighted pick is driven through the REAL scheduler with a seeded RNG, so
// the assertions verify the actual probability math, not a re-implementation.

import { notificationScheduler } from '../notificationScheduler';
import { notificationService } from '../notificationService';
import { DailyTaskProgress } from '../../../types/notification';

jest.mock('../notificationService', () => ({
  notificationService: {
    parseTime: (time: string) => {
      const [hour, minute] = time.split(':').map(Number);
      return { hour, minute };
    },
    cancelNotification: jest.fn(async () => {}),
    cancelNotificationsWithPrefix: jest.fn(async () => 0),
    scheduleOneTimeNotification: jest.fn(async () => 'mock-id'),
    scheduleDailyNotification: jest.fn(async () => 'mock-id'),
  },
}));

const scheduleOneTime = notificationService.scheduleOneTimeNotification as jest.Mock;

/** Deterministic PRNG (mulberry32) so the weighted lottery is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE: DailyTaskProgress = {
  incompletedHabitsCount: 0,
  scheduledTodayCount: 0,
  journalEntriesCount: 3,
  hasThreeBasicEntries: true,
  bonusEntriesCount: 10, // bonus option closed by default
  goalProgressAddedToday: true,
  hasActiveGoals: true,
};

const progress = (overrides: Partial<DailyTaskProgress> = {}): DailyTaskProgress => ({
  ...BASE,
  ...overrides,
});

/** Runs the real scheduler and returns TODAY's (day_0) notification, or null. */
async function scheduleToday(p: DailyTaskProgress): Promise<{ title: string; body: string } | null> {
  scheduleOneTime.mockClear();
  await notificationScheduler.scheduleEveningReminder(true, '20:00', p);

  const dayZero = scheduleOneTime.mock.calls.find((call) =>
    String(call[0]).endsWith('day_0')
  );
  return dayZero ? { title: dayZero[1], body: dayZero[2] } : null;
}

/** Which option won, derived from the scheduled title. */
function classify(title: string): 'habits' | 'journal' | 'bonus' | 'goals' | 'other' {
  if (/habits to complete/i.test(title)) return 'habits';
  if (/reflection time/i.test(title)) return 'journal';
  if (/Bonus opportunity/i.test(title)) return 'bonus';
  if (/goals are waiting/i.test(title)) return 'goals';
  return 'other';
}

/** Distribution of winners over `runs` seeded draws.
 *  800 draws keeps the suite fast while staying statistically tight: for a
 *  50/50 split the standard deviation is ~1.8 %, so the ±5 % assertions below
 *  are ~3 sigma — they catch a broken weight formula, not sampling noise. */
async function distribution(p: DailyTaskProgress, runs = 800): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (let i = 0; i < runs; i++) {
    const result = await scheduleToday(p);
    const key = result ? classify(result.title) : 'none';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  // 10:00 — before the 20:00 evening time, so today's notification is eligible
  jest.setSystemTime(new Date(2026, 6, 15, 10, 0, 0));
  jest.spyOn(Math, 'random').mockImplementation(mulberry32(42));
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Evening notification — early exit (7.2)', () => {
  test('all requirements met → NO notification for today (not a random fallback)', async () => {
    const result = await scheduleToday(progress()); // everything done, bonus maxed
    expect(result).toBeNull();
  });

  test('future days still get generic reminders even when today is complete', async () => {
    await scheduleToday(progress());
    const futureCalls = scheduleOneTime.mock.calls.filter((c) => !String(c[0]).endsWith('day_0'));
    expect(futureCalls).toHaveLength(30); // DAYS_TO_SCHEDULE_AHEAD
  });
});

describe('Evening notification — option guards', () => {
  test('bonus is NOT offered before the 3 basic entries exist', async () => {
    // 2 entries: journal must be the only option (bonus locked behind 3 basics)
    const counts = await distribution(
      progress({ journalEntriesCount: 2, hasThreeBasicEntries: false, bonusEntriesCount: 0 }),
      300
    );
    expect(counts['bonus']).toBeUndefined();
    expect(counts['journal']).toBe(300);
  });

  test('goals are NOT offered when the user has no active goals [N-7.8]', async () => {
    const counts = await distribution(
      progress({ hasActiveGoals: false, goalProgressAddedToday: false }),
      300
    );
    expect(counts['goals']).toBeUndefined();
    expect(counts['none']).toBe(300); // nothing else pending → no notification
  });

  test('goals ARE offered when active goals had no progress today [N-7.8]', async () => {
    const result = await scheduleToday(progress({ goalProgressAddedToday: false }));
    expect(result).not.toBeNull();
    expect(classify(result!.title)).toBe('goals');
  });

  test('habits option needs a habit actually scheduled today', async () => {
    // incomplete count > 0 but nothing scheduled → habits must not be offered
    const counts = await distribution(
      progress({ incompletedHabitsCount: 2, scheduledTodayCount: 0 }),
      300
    );
    expect(counts['habits']).toBeUndefined();
  });
});

describe('Evening notification — weight math (7.1)', () => {
  // Guide example C: 5/5 habits incomplete (100) vs 0 journal entries (100)
  test('equal weights → ~50/50 split', async () => {
    const counts = await distribution(
      progress({
        incompletedHabitsCount: 5,
        scheduledTodayCount: 5,
        journalEntriesCount: 0,
        hasThreeBasicEntries: false,
        bonusEntriesCount: 0,
        goalProgressAddedToday: true, // keep goals out of this comparison
      })
    );
    const habitsShare = (counts['habits'] || 0) / 800;
    expect(habitsShare).toBeGreaterThan(0.45);
    expect(habitsShare).toBeLessThan(0.55);
  });

  // Guide example B: habits 1/5 (weight 20) vs bonus (fixed 15) → 57.1 % / 42.9 %
  test('habits 20 vs bonus 15 → ~57/43 split', async () => {
    const counts = await distribution(
      progress({
        incompletedHabitsCount: 1,
        scheduledTodayCount: 5,
        bonusEntriesCount: 4, // bonus option open (3+ basics, <10 bonuses)
      })
    );
    const habitsShare = (counts['habits'] || 0) / 800;
    expect(habitsShare).toBeGreaterThan(0.52);
    expect(habitsShare).toBeLessThan(0.62);
    expect((counts['bonus'] || 0) / 800).toBeGreaterThan(0.38);
  });

  // Goals (40) vs bonus (15) → 72.7 % / 27.3 %
  test('goals 40 outweigh bonus 15 [N-7.8]', async () => {
    const counts = await distribution(
      progress({ goalProgressAddedToday: false, bonusEntriesCount: 4 })
    );
    const goalsShare = (counts['goals'] || 0) / 800;
    expect(goalsShare).toBeGreaterThan(0.67);
    expect(goalsShare).toBeLessThan(0.78);
  });

  // Fully neglected basics must still dominate goals: habits 100 vs goals 40
  test('a fully neglected habit day outweighs goals [N-7.8 balance]', async () => {
    const counts = await distribution(
      progress({
        incompletedHabitsCount: 3,
        scheduledTodayCount: 3,
        goalProgressAddedToday: false,
      })
    );
    const habitsShare = (counts['habits'] || 0) / 800;
    expect(habitsShare).toBeGreaterThan(0.66); // 100/140 = 71.4 %
    expect((counts['goals'] || 0) / 800).toBeGreaterThan(0.22);
  });
});

describe('Evening notification — message content', () => {
  test('singular habit message is used for exactly one habit', async () => {
    const result = await scheduleToday(
      progress({ incompletedHabitsCount: 1, scheduledTodayCount: 1, goalProgressAddedToday: true })
    );
    expect(result!.body).toMatch(/\b1 habit\b/);
    expect(result!.body).not.toMatch(/habits/);
  });

  test('plural habit message carries the real count', async () => {
    const result = await scheduleToday(
      progress({ incompletedHabitsCount: 3, scheduledTodayCount: 3, goalProgressAddedToday: true })
    );
    expect(result!.body).toMatch(/3 habits/);
    expect(result!.body).not.toMatch(/\{\{count\}\}/); // placeholder must be substituted
  });

  test('journal message reports how many entries are still missing', async () => {
    const result = await scheduleToday(
      progress({ journalEntriesCount: 1, hasThreeBasicEntries: false, bonusEntriesCount: 0 })
    );
    expect(result!.body).toMatch(/2 more journal entries/);
  });
});
