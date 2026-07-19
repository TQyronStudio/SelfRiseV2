// Monthly Challenge Template Selection — Distribution Regression Suite (audit 3f)
//
// WHY THIS EXISTS (super audit Fáze 3, session #9): in October 2025 template
// selection was deterministic — the highest-priority template won every month
// ("Why do I always get Consistency Master?"). The fix introduced weighted
// random selection (priority + seasonal bonus − anti-repeat penalty ± variance).
// This suite drives the REAL selection with a seeded RNG and asserts that:
//   (A) no template monopolizes its category (the historical bug), and
//   (B) every non-gated template has a > 0 % chance of being selected,
//   (C) star-level gating works (minLevel templates never appear below level).
//
// Deterministic by design: seeded Math.random + fixed system time pinned to a
// NON-seasonal month (July). Seasonal months are a separate story — the +30
// seasonal bonus exceeds the ±20 variance and restores a de-facto monopoly
// (audit finding N-3.16, awaiting decision).

import { MonthlyChallengeService } from '../monthlyChallengeService';
import { AchievementCategory } from '../../types/gamification';
import { TFunction } from 'i18next';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn(),
  },
}));

const t = ((key: string) => key) as TFunction;

/** Small deterministic PRNG (mulberry32) so the distribution is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t2 = Math.imul(a ^ (a >>> 15), 1 | a);
    t2 = (t2 + Math.imul(t2 ^ (t2 >>> 7), 61 | t2)) ^ t2;
    return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296;
  };
}

const ITERATIONS = 5000;

function runDistribution(
  category: AchievementCategory,
  starLevel: 1 | 2 | 3 | 4 | 5
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (let i = 0; i < ITERATIONS; i++) {
    const result = MonthlyChallengeService.selectTemplateForCategory(
      category,
      null, // no baseline → data-quality filter passes for all
      starLevel,
      [],   // no recent templates → no anti-repeat penalty
      t
    );
    const id = result.selectedTemplate.id;
    counts[id] = (counts[id] || 0) + 1;
  }
  return counts;
}

describe('Monthly Challenge template selection — weighted random distribution (3f)', () => {
  beforeEach(() => {
    // Non-seasonal month (July) — seasonal bonus months are finding N-3.16
    jest.useFakeTimers({ doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    jest.setSystemTime(new Date(2026, 6, 15));
    jest.spyOn(Math, 'random').mockImplementation(mulberry32(42));
  });

  afterEach(() => {
    jest.useRealTimers();
    (Math.random as jest.Mock).mockRestore?.();
    jest.restoreAllMocks();
  });

  test.each([
    [AchievementCategory.HABITS, 4],
    [AchievementCategory.JOURNAL, 4],
    [AchievementCategory.GOALS, 2],
    [AchievementCategory.CONSISTENCY, 4],
  ] as Array<[AchievementCategory, number]>)(
    '%s at 5⭐: every template selectable, none monopolizes',
    (category, templateCount) => {
      const counts = runDistribution(category, 5);
      const ids = MonthlyChallengeService.getTemplatesForCategory(category, t).map(tpl => tpl.id);

      expect(ids).toHaveLength(templateCount);

      // (B) every non-gated template has > 0 % chance
      for (const id of ids) {
        expect({ id, selected: (counts[id] || 0) > 0 }).toEqual({ id, selected: true });
      }

      // (A) no monopoly — the October 2025 bug gave the top template 100 %
      const max = Math.max(...Object.values(counts));
      expect(max).toBeLessThan(ITERATIONS * 0.9);

      // Distribution is logged for the audit report
      console.log(`📊 [3f] ${category} @5⭐ distribution (${ITERATIONS} draws):`,
        Object.fromEntries(ids.map(id => [id, `${(((counts[id] || 0) / ITERATIONS) * 100).toFixed(1)}%`])));
    }
  );

  test('star gating: minLevel templates never appear below their level (HABITS @2⭐)', () => {
    const counts = runDistribution(AchievementCategory.HABITS, 2);

    // habits_streak_builder requires minLevel 3 → must never be selected at 2⭐
    expect(counts['habits_streak_builder']).toBeUndefined();

    // The remaining three all stay reachable
    for (const id of ['habits_consistency_master', 'habits_variety_champion', 'habits_bonus_hunter']) {
      expect({ id, selected: (counts[id] || 0) > 0 }).toEqual({ id, selected: true });
    }

    console.log(`📊 [3f] HABITS @2⭐ distribution (${ITERATIONS} draws):`, counts);
  });

  test('star gating: Balance Expert appears only at 4⭐+ (CONSISTENCY @3⭐ vs @4⭐)', () => {
    const at3 = runDistribution(AchievementCategory.CONSISTENCY, 3);
    expect(at3['consistency_balance_expert']).toBeUndefined();

    const at4 = runDistribution(AchievementCategory.CONSISTENCY, 4);
    expect((at4['consistency_balance_expert'] || 0)).toBeGreaterThan(0);

    console.log(`📊 [3f] CONSISTENCY @3⭐:`, at3, `@4⭐:`, at4);
  });

  test('seasonal month keeps a real lottery (N-3.16: +15 bonus < ±20 variance)', () => {
    // October is a seasonal month for habits_consistency_master. At the old
    // +30 bonus its weight range [110, 150] cleared every competitor's
    // maximum (streak_builder ≤ 110) — a deterministic monopoly. With +15
    // the ranges overlap again and competitors keep a real chance.
    jest.setSystemTime(new Date(2026, 9, 15)); // 15. 10. 2026

    const counts = runDistribution(AchievementCategory.HABITS, 5);

    // Measured with +15: ~90 % share (was a mathematical 100 % at +30).
    // Competitors regain a real ~10 % chance; anti-repeat further breaks
    // streaks of repeated seasonal wins across months.
    const seasonalShare = (counts['habits_consistency_master'] || 0) / ITERATIONS;
    expect(seasonalShare).toBeLessThan(0.95); // monopoly broken
    expect(seasonalShare).toBeGreaterThan(0.3); // seasonality still favors it

    // The strongest competitors must remain reachable even in season
    expect((counts['habits_streak_builder'] || 0)).toBeGreaterThan(0);
    expect((counts['habits_variety_champion'] || 0)).toBeGreaterThan(0);

    console.log(`📊 [3f] HABITS @5⭐ SEASONAL (October) distribution:`, counts);
  });

  test('seasonality follows the TARGET month, not the generation month [N-3.11]', () => {
    // Preview generation: late December prepares the JANUARY challenge.
    // January is seasonal for habits_consistency_master, December is not —
    // before the fix the check asked "is December seasonal?" and the New Year
    // boost missed exactly the month it exists for.
    jest.setSystemTime(new Date(2026, 11, 28)); // 28. 12. 2026

    const drawShare = (targetMonth?: string): number => {
      let hits = 0;
      for (let i = 0; i < ITERATIONS; i++) {
        const result = MonthlyChallengeService.selectTemplateForCategory(
          AchievementCategory.HABITS, null, 5, [], t, targetMonth
        );
        if (result.selectedTemplate.id === 'habits_consistency_master') hits++;
      }
      return hits / ITERATIONS;
    };

    const januaryShare = drawShare('2027-01'); // seasonal target → boosted (~90 %)
    const decemberShare = drawShare('2026-12'); // non-seasonal target → base (~60 %)

    expect(januaryShare).toBeGreaterThan(decemberShare + 0.1);
    expect(januaryShare).toBeGreaterThan(0.75);
    expect(decemberShare).toBeLessThan(0.75);

    console.log(`📊 [3f/N-3.11] consistency_master share — target Jan: ${(januaryShare * 100).toFixed(1)}%, target Dec: ${(decemberShare * 100).toFixed(1)}%`);
  });
});
