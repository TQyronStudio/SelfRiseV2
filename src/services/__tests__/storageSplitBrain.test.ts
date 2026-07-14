// Storage Split-Brain — Regression Suite
//
// WHY THIS EXISTS (July 14, 2026): goals are WRITTEN to SQLite
// (FEATURE_FLAGS.USE_SQLITE_GOALS) but several services READ them through the
// legacy AsyncStorage `GoalStorage` singleton, which is empty. Every read
// returned zero goals, so:
//
//   * `first-goal` (condition: goal_creation >= 1) could NEVER unlock —
//     together with all 8 GOALS-category achievements.
//   * The onboarding tutorial waited on that achievement's modal and only moved
//     on when its 10s fallback expired → the "frozen tutorial" users reported.
//   * Journal search (`searchByContent`) was missing from the SQLite storage
//     entirely, so it threw and — swallowed by GratitudeContext's catch —
//     always returned "no results".
//
// The compiler could not catch any of this because the storage helpers returned
// `any`. They are typed now; these tests guard the runtime behaviour.
//
// Everything below runs against the real in-memory SQLite (global jest setup).
// A failure here means a whole reward/search surface is dead in production.

import { AchievementIntegration } from '../achievementIntegration';
import { getGoalStorageImpl, getGratitudeStorageImpl } from '../../config/featureFlags';
import { CORE_ACHIEVEMENTS } from '../../constants/achievementCatalog';
import { ACHIEVEMENT_EVALUATION } from '../../constants/achievements';
import { GoalCategory } from '../../types/goal';
import { today } from '../../utils/date';

jest.mock('../gamificationService', () => ({
  GamificationService: {
    addXP: jest.fn(async () => ({ success: true, leveledUp: false })),
    subtractXP: jest.fn(async () => ({ success: true })),
    getGamificationStats: jest.fn(async () => ({})),
  },
}));
jest.mock('uuid', () => ({ v4: () => `uuid-${Math.random().toString(36).slice(2)}` }));

const goalStorage = getGoalStorageImpl();
const gratitudeStorage = getGratitudeStorageImpl();

describe('Storage split-brain regression (goals + journal)', () => {
  // ========================================
  // GOALS: the achievement layer must read the SAME store the app writes to
  // ========================================

  describe('AchievementIntegration reads goals from the live store', () => {
    it('counts a goal that was just created (first-goal can unlock)', async () => {
      // Baseline: nothing yet.
      expect(await AchievementIntegration.getCountValueForAchievement('goal_creation', 'all_time')).toBe(0);

      // Create a goal through the SAME storage the app (GoalsContext) uses.
      await goalStorage.create({
        title: 'Read 12 books',
        unit: 'books',
        targetValue: 12,
        category: GoalCategory.PERSONAL,
        targetDate: today(),
      } as any);

      // THE BUG: this returned 0 forever (legacy AsyncStorage read), so the
      // `first-goal` condition (goal_creation >= 1) was never met.
      const count = await AchievementIntegration.getCountValueForAchievement('goal_creation', 'all_time');
      expect(count).toBe(1);
    });

    it('satisfies the real first-goal achievement condition from the catalog', async () => {
      const firstGoal = CORE_ACHIEVEMENTS.find(a => a.id === 'first-goal');
      expect(firstGoal).toBeDefined();
      expect(firstGoal!.condition.source).toBe('goal_creation');

      await goalStorage.create({
        title: 'Run 100 km',
        unit: 'km',
        targetValue: 100,
        category: GoalCategory.HEALTH,
        targetDate: today(),
      } as any);

      const value = await AchievementIntegration.getCountValueForAchievement(
        firstGoal!.condition.source,
        firstGoal!.condition.timeframe
      );

      expect(value).toBeGreaterThanOrEqual(firstGoal!.condition.target); // target = 1
    });
  });

  // ========================================
  // JOURNAL: search must actually search
  // ========================================

  describe('Journal search works on the live store', () => {
    it('finds an entry by content (searchByContent exists on the SQLite impl)', async () => {
      // THE BUG: SQLiteGratitudeStorage had no searchByContent at all → TypeError
      // → swallowed → user always saw "no results".
      expect(typeof (gratitudeStorage as any).searchByContent).toBe('function');

      await gratitudeStorage.create({
        content: 'Grateful for the sunny weather',
        type: 'gratitude',
        date: today(),
      });

      const hits = await gratitudeStorage.searchByContent('sunny');
      expect(hits).toHaveLength(1);
      expect(hits[0]!.content).toContain('sunny');
    });

    it('matches case-insensitively, including accented (DE/ES) characters', async () => {
      // SQL LIKE/LOWER in SQLite are ASCII-only — this is why the filter runs in
      // JS. If someone "optimises" it into SQL, this test fails.
      await gratitudeStorage.create({
        content: 'Dankbar für schöne Momente',
        type: 'gratitude',
        date: today(),
      });

      expect(await gratitudeStorage.searchByContent('SCHÖNE')).toHaveLength(1);
    });

    it('returns an empty array when nothing matches (not a thrown error)', async () => {
      await expect(gratitudeStorage.searchByContent('zzz-no-such-entry')).resolves.toEqual([]);
    });

    it('defaults a missing entry type to "gratitude" instead of storing undefined', async () => {
      const entry = await gratitudeStorage.create({
        content: 'Type omitted on purpose',
        date: today(),
      });

      expect(entry.type).toBe('gratitude');
    });
  });

  // ========================================
  // ACHIEVEMENT BATCH: the catalog must not be silently truncated
  // ========================================

  describe('Batch achievement check covers the whole catalog', () => {
    it('allows every achievement to be evaluated for a brand-new user', () => {
      // runBatchAchievementCheck caps the batch at MAX_BATCH_SIZE. A brand-new
      // user has every achievement locked, so a cap below the catalog size means
      // the tail of the catalog can never unlock. This was 50 vs a catalog of 78.
      expect(ACHIEVEMENT_EVALUATION.MAX_BATCH_SIZE).toBeGreaterThanOrEqual(CORE_ACHIEVEMENTS.length);
    });
  });
});
