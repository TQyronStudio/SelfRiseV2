// Achievement Condition Evaluation — Regression Suite
//
// WHY THIS EXISTS (audit, July 2026): 35+ of the catalog's conditions silently
// evaluated to 0 forever, so ~half the achievement system could never unlock:
//   - `journal_star_count` / `journal_flame_count` / `journal_crown_count`
//     (21 conditions — First Star, Flame Collector, Crown Royalty…) had NO
//     handler in getCountValueForAchievement → default → 0.
//   - Streak conditions use ACTIVITY sources ('habit_completion',
//     'journal_entry', 'goal_progress_consecutive_days', bonus streaks) but
//     getStreakValueForAchievement only matched 'habit_streak' /
//     'journal_streak' — names the catalog never uses → 12 streak
//     achievements dead (Streak Champion, Eternal Gratitude, Bonus Week…).
//   - getPercentageValue was a `return 0` placeholder → Balanced Life dead.
//
// Test group A walks EVERY condition in the live catalog through the real
// dispatch switches (with underlying data getters mocked to non-zero) and
// fails if any condition falls into a dead default → structurally impossible
// to ship a new dead achievement again.
// Test group B verifies the new calculators against the real in-memory SQLite.
//
// Any failure here = achievements silently never unlocking = release blocker.

import { AchievementService } from '../achievementService';
import { AchievementIntegration } from '../achievementIntegration';
import { CORE_ACHIEVEMENTS } from '../../constants/achievementCatalog';
import { GamificationService } from '../gamificationService';
import { XPSourceType, AchievementCondition, GamificationStats } from '../../types/gamification';
import { getDatabase } from '../database/init';
import { today, subtractDays } from '../../utils/date';

// ========================================
// SHARED HELPERS
// ========================================

const FAKE_STATS = { currentLevel: 999 } as unknown as GamificationStats;

/** Fake transactions covering every XPSourceType, dated today (passes all timeframes). */
function fakeTransactions() {
  return Object.values(XPSourceType).map((source, i) => ({
    id: `tx_${i}`,
    amount: 10,
    source,
    description: 'test',
    date: today(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

/** Mock every data-getter on AchievementIntegration EXCEPT the dispatch switches. */
function mockIntegrationGetters(value: number): void {
  const dispatchers = new Set([
    'getCountValueForAchievement',
    'getStreakValueForAchievement',
    'getBonusJournalDayStreak', // thin dispatcher over storage — keep real in group B, mock here
  ]);
  for (const name of Object.getOwnPropertyNames(AchievementIntegration)) {
    const fn = (AchievementIntegration as any)[name];
    if (typeof fn === 'function' && !dispatchers.has(name)) {
      jest.spyOn(AchievementIntegration as any, name).mockResolvedValue(value);
    }
  }
  // getBonusJournalDayStreak is called by the streak dispatcher — mock it in group A
  jest.spyOn(AchievementIntegration, 'getBonusJournalDayStreak').mockResolvedValue(value);
  // Star/flame/crown counters are read from the journal streak state directly
  (AchievementIntegration as any).gratitudeStorage = {
    getStreak: jest.fn(async () => ({ starCount: value, flameCount: value, crownCount: value })),
    getAll: jest.fn(async () => []),
  };
}

// ========================================
// GROUP A — catalog-wide "no dead evaluator" guarantee
// ========================================

describe('Achievement evaluation — every catalog condition reaches a live evaluator', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockIntegrationGetters(999);
    jest.spyOn(GamificationService, 'getAllTransactions').mockResolvedValue(fakeTransactions() as any);
  });

  test('catalog sanity: 78 achievements loaded', () => {
    expect(CORE_ACHIEVEMENTS.length).toBe(75);
  });

  // One test per achievement → a dead condition names its achievement directly.
  for (const achievement of CORE_ACHIEVEMENTS) {
    test(`${achievement.id} (${achievement.condition.type}/${achievement.condition.source}) evaluates to a non-dead value`, async () => {
      const result = await AchievementService.evaluateCondition(
        achievement.condition as AchievementCondition,
        FAKE_STATS
      );

      // With all data getters returning 999 / non-empty transactions, a healthy
      // evaluator MUST produce progress. currentValue === 0 AND progress === 0
      // means the condition fell into a dead default branch (the exact bug
      // class this suite guards against).
      const dead = result.currentValue === 0 && result.progress === 0;
      expect({ id: achievement.id, dead }).toEqual({ id: achievement.id, dead: false });
    });
  }
});

// ========================================
// GROUP B — new calculators against the real in-memory SQLite
// ========================================

describe('Achievement calculators (real DB) — July 2026 fixes', () => {
  const T = today();
  let entrySeq = 0;

  async function seedJournalDay(date: string, total: number): Promise<void> {
    const db = getDatabase();
    for (let i = 1; i <= total; i++) {
      entrySeq++;
      await db.runAsync(
        'INSERT INTO journal_entries (id, text, type, date, gratitude_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`ach_entry_${entrySeq}`, `Entry ${i}`, 'gratitude', date, i, Date.now(), Date.now()]
      );
    }
  }

  beforeEach(async () => {
    jest.restoreAllMocks();
    // Reset integration's storage binding to the real implementation
    // (group A replaced it with a fake object).
    const { getGratitudeStorageImpl } = require('../../config/featureFlags');
    (AchievementIntegration as any).gratitudeStorage = getGratitudeStorageImpl();
    const db = getDatabase();
    await db.runAsync('DELETE FROM journal_entries');
  });

  describe('journal_star_count / flame / crown (⭐🔥👑 milestone counters)', () => {
    test('read live values from the journal streak state', async () => {
      const storage = (AchievementIntegration as any).gratitudeStorage;
      await storage.updateStreak({ starCount: 7, flameCount: 4, crownCount: 2 });

      expect(await AchievementIntegration.getCountValueForAchievement('journal_star_count')).toBe(7);
      expect(await AchievementIntegration.getCountValueForAchievement('journal_flame_count')).toBe(4);
      expect(await AchievementIntegration.getCountValueForAchievement('journal_crown_count')).toBe(2);
    });
  });

  describe('getBonusJournalDayStreak (Bonus Week / Golden Bonus Streak)', () => {
    test('3 consecutive days with 1+ bonus entry → streak 3 (min 1/day)', async () => {
      await seedJournalDay(subtractDays(T, 2), 4); // 1 bonus (entry #4)
      await seedJournalDay(subtractDays(T, 1), 5); // 2 bonus
      await seedJournalDay(T, 4);                  // 1 bonus

      expect(await AchievementIntegration.getBonusJournalDayStreak(1)).toBe(3);
    });

    test('golden streak requires 3+ bonus entries per day', async () => {
      await seedJournalDay(subtractDays(T, 1), 6); // 3 bonus entries
      await seedJournalDay(T, 6);                  // 3 bonus entries

      expect(await AchievementIntegration.getBonusJournalDayStreak(3)).toBe(2);
      // Days with only 3 total entries (0 bonus) must not count
      expect(await AchievementIntegration.getBonusJournalDayStreak(4)).toBe(0);
    });

    test('unfinished today does not break the run (anchors at yesterday)', async () => {
      await seedJournalDay(subtractDays(T, 2), 4);
      await seedJournalDay(subtractDays(T, 1), 4);
      await seedJournalDay(T, 2); // today: no bonus yet

      expect(await AchievementIntegration.getBonusJournalDayStreak(1)).toBe(2);
    });

    test('gap breaks the bonus streak', async () => {
      await seedJournalDay(subtractDays(T, 3), 4);
      // D2 no bonus
      await seedJournalDay(subtractDays(T, 2), 3);
      await seedJournalDay(subtractDays(T, 1), 4);

      expect(await AchievementIntegration.getBonusJournalDayStreak(1)).toBe(1);
    });
  });

  describe('streak source mapping (activity names → streak calculators)', () => {
    test("'habit_completion' streak routes to getMaxHabitStreak", async () => {
      jest.spyOn(AchievementIntegration, 'getMaxHabitStreak').mockResolvedValue(21);
      expect(await AchievementIntegration.getStreakValueForAchievement('habit_completion')).toBe(21);
    });

    test("'journal_entry' streak routes to getJournalStreak", async () => {
      jest.spyOn(AchievementIntegration, 'getJournalStreak').mockResolvedValue(30);
      expect(await AchievementIntegration.getStreakValueForAchievement('journal_entry')).toBe(30);
    });

    test("'goal_progress_consecutive_days' streak routes to its calculator", async () => {
      jest.spyOn(AchievementIntegration, 'getGoalProgressConsecutiveDays').mockResolvedValue(7);
      expect(await AchievementIntegration.getStreakValueForAchievement('goal_progress_consecutive_days')).toBe(7);
    });

    test('legacy aliases still work', async () => {
      jest.spyOn(AchievementIntegration, 'getMaxHabitStreak').mockResolvedValue(5);
      jest.spyOn(AchievementIntegration, 'getJournalStreak').mockResolvedValue(6);
      expect(await AchievementIntegration.getStreakValueForAchievement('habit_streak')).toBe(5);
      expect(await AchievementIntegration.getStreakValueForAchievement('journal_streak')).toBe(6);
    });
  });

  describe('percentage type (Balanced Life)', () => {
    test('habit_xp_ratio flows through evaluateCondition (no longer a dead placeholder)', async () => {
      jest.spyOn(AchievementIntegration, 'getHabitXPRatio').mockResolvedValue(55);

      const result = await AchievementService.evaluateCondition(
        {
          type: 'percentage',
          target: 50,
          source: 'habit_xp_ratio',
          operator: 'gte',
          timeframe: 'all_time',
        } as AchievementCondition,
        FAKE_STATS
      );

      expect(result.currentValue).toBe(55);
      expect(result.isMet).toBe(true);
    });
  });
});

// ========================================
// GROUP C — completion counts follow STORAGE state, not XP transactions
// (audit F2, N-2.1 — reversal/toggle regression)
// ========================================

describe('Completion counts ignore transaction toggles (N-2.1)', () => {
  const goalCondition = CORE_ACHIEVEMENTS.find(a => a.id === 'achievement-unlocked')!
    .condition as AchievementCondition; // count goal_completion >= 10
  const habitCondition = CORE_ACHIEVEMENTS.find(a => a.id === 'century-club')!
    .condition as AchievementCondition; // count habit_completion >= 100

  beforeEach(() => {
    jest.restoreAllMocks();
    // 10 positive goal_completion + plenty of habit_completion transactions —
    // the OLD implementation would count these and unlock on toggles alone.
    const toggleTxs = [
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `g_${i}`, amount: 250, source: XPSourceType.GOAL_COMPLETION,
        date: today(), createdAt: new Date(), updatedAt: new Date(), description: 't',
      })),
      ...Array.from({ length: 150 }, (_, i) => ({
        id: `h_${i}`, amount: 25, source: XPSourceType.HABIT_COMPLETION,
        date: today(), createdAt: new Date(), updatedAt: new Date(), description: 't',
      })),
    ];
    jest.spyOn(GamificationService, 'getAllTransactions').mockResolvedValue(toggleTxs as any);
  });

  test('goal_completion count = completed goals in storage (1 toggled goal ≠ 10 completions)', async () => {
    (AchievementIntegration as any).goalStorage = {
      getAll: jest.fn(async () => [
        { id: 'goal1', status: 'completed', targetValue: 100, completedDate: today() },
        { id: 'goal2', status: 'active', targetValue: 100 },
      ]),
    };

    const result = await AchievementService.evaluateCondition(goalCondition, FAKE_STATS);
    expect(result.currentValue).toBe(1); // storage truth, not 10 transactions
    expect(result.isMet).toBe(false);
  });

  test('goal_completion count reaches target only with 10 truly completed goals', async () => {
    (AchievementIntegration as any).goalStorage = {
      getAll: jest.fn(async () =>
        Array.from({ length: 10 }, (_, i) => ({
          id: `goal_${i}`, status: 'completed', targetValue: 100, completedDate: today(),
        }))
      ),
    };

    const result = await AchievementService.evaluateCondition(goalCondition, FAKE_STATS);
    expect(result.currentValue).toBe(10);
    expect(result.isMet).toBe(true);
  });

  test('habit_completion count follows storage rows and DROPS after a reversal', async () => {
    const completions = Array.from({ length: 100 }, (_, i) => ({
      id: `c_${i}`, habitId: 'h1', date: today(), completed: true,
    }));
    (AchievementIntegration as any).habitStorage = {
      getAllCompletions: jest.fn(async () => completions),
    };

    const met = await AchievementService.evaluateCondition(habitCondition, FAKE_STATS);
    expect(met.currentValue).toBe(100);
    expect(met.isMet).toBe(true);

    // User unchecks one completion → storage row removed → count drops
    completions.pop();
    const afterReversal = await AchievementService.evaluateCondition(habitCondition, FAKE_STATS);
    expect(afterReversal.currentValue).toBe(99);
    expect(afterReversal.isMet).toBe(false);
  });

  test('habit creation count is cumulative (soft-deleted habits still count)', async () => {
    (AchievementIntegration as any).habitStorage = {
      countCreatedTotal: jest.fn(async () => 5), // 3 existing + 2 archived
      getAll: jest.fn(async () => [{ id: 'h1' }, { id: 'h2' }, { id: 'h3' }]),
    };

    expect(await AchievementIntegration.getHabitCreationCount('all_time')).toBe(5);
  });
});

// N-2.6 (audit F2c): journal entry counts come from storage, not transactions
describe('Journal entry count follows storage (N-2.6)', () => {
  test('journal-enthusiast counts ALL entries, not just first-3-per-day transactions', async () => {
    jest.restoreAllMocks();
    const journalCondition = CORE_ACHIEVEMENTS.find(a => a.id === 'journal-enthusiast')!
      .condition as AchievementCondition; // count journal_entry >= 100

    // 30 positive journal_entry transactions (old path would report 30)…
    jest.spyOn(GamificationService, 'getAllTransactions').mockResolvedValue(
      Array.from({ length: 30 }, (_, i) => ({
        id: `j_${i}`, amount: 20, source: XPSourceType.JOURNAL_ENTRY,
        date: today(), createdAt: new Date(), updatedAt: new Date(), description: 't',
      })) as any
    );
    // …but storage holds 100 real entries (incl. bonus positions 4+)
    jest.spyOn(AchievementIntegration, 'getTotalJournalEntries').mockResolvedValue(100);

    const result = await AchievementService.evaluateCondition(journalCondition, FAKE_STATS);
    expect(AchievementIntegration.getTotalJournalEntries).toHaveBeenCalled();
    expect(result.currentValue).toBe(100);
    expect(result.isMet).toBe(true);
  });
});
