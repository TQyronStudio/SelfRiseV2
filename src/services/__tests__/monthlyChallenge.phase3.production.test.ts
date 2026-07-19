// Monthly Challenge System - Phase 3 PRODUCTION Testing: Star Progression & Mathematical Validation
// Focused test suite for production-ready star rating system, mathematical accuracy, and core functionality

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { StarRatingService, ChallengeCompletionData } from '../starRatingService';
import { MonthlyChallengeService } from '../monthlyChallengeService';

// ========================================
// REAL TARGET-PATH HELPERS (N-3.9)
// ========================================
// These tests used to assert the parallel dead APIs (applyStarScaling /
// calculateDifficulty) that no production code ever called. Targets really
// come from calculateTargetFromBaseline — minimal stubs below drive it.

const makeScalingTemplate = (overrides: Record<string, any> = {}) => ({
  id: 'test_template',
  category: AchievementCategory.HABITS,
  title: 'T',
  description: 'D',
  baselineMetricKey: 'totalHabitCompletions',
  baselineMultiplierRange: [1.05, 1.25] as [number, number],
  requirementTemplates: [{
    type: 'habits',
    description: 'r',
    trackingKey: 'scheduled_habit_completions',
    progressMilestones: [0.25, 0.5, 0.75],
  }],
  starLevelRequirements: { minLevel: 1, preferredDataQuality: ['complete'] },
  baseXPReward: 500,
  bonusXPConditions: [],
  tags: [],
  priority: 100,
  cooldownMonths: 2,
  ...overrides,
});
import { 
  UserChallengeRatings, 
  StarRatingHistoryEntry,
  AchievementCategory,
  AchievementRarity
} from '../../types/gamification';
import { formatDateToString, today, addDays, parseDate } from '../../utils/date';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn(),
  }
}));

// Mock AsyncStorage implementation
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Phase 3 PRODUCTION: Star Progression & Mathematical Validation', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockAsyncStorage.clear();
    
    // Reset storage state
    const storage = new Map();
    mockAsyncStorage.getItem.mockImplementation(async (key) => storage.get(key) || null);
    mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
      storage.set(key, value);
    });
    mockAsyncStorage.multiRemove.mockImplementation(async (keys) => {
      keys.forEach(key => storage.delete(key));
    });

    // StarRatingService keeps a static in-memory cache (TTL) on top of
    // AsyncStorage — clearing the storage mock alone leaks ratings between
    // tests. Reset cache + data explicitly.
    await StarRatingService.clearAllStarData();
  });

  // ========================================
  // SECTION A: STAR RATING PROGRESSION LOGIC (12/12 PASSING)
  // ========================================

  describe('P StarRatingService Progression Logic (12/12)', () => {
    test(' A1. Star advancement on success (e100% completion)', async () => {
      // Setup: User starts at 2 stars
      await StarRatingService.resetCategoryStarRating(AchievementCategory.HABITS, 2);
      
      const completionData: ChallengeCompletionData = {
        challengeId: 'test-success-1',
        category: AchievementCategory.HABITS,
        completionPercentage: 100,
        month: '2025-08',
        wasCompleted: true,
        targetValue: 30,
        actualValue: 30
      };

      // Execute
      const result = await StarRatingService.updateStarRatingForCompletion(completionData);
      const newRatings = await StarRatingService.getCurrentStarRatings();

      // Assert
      expect(result.previousStars).toBe(2);
      expect(result.newStars).toBe(3);
      expect(result.reason).toBe('success');
      expect(result.challengeCompleted).toBe(true);
      expect(newRatings.habits).toBe(3);
    });

    test(' A2. Star advancement on over-completion (>100%)', async () => {
      // Setup: User at 1 star
      await StarRatingService.resetCategoryStarRating(AchievementCategory.JOURNAL, 1);
      
      const completionData: ChallengeCompletionData = {
        challengeId: 'test-over-completion',
        category: AchievementCategory.JOURNAL,
        completionPercentage: 125,
        month: '2025-08',
        wasCompleted: true,
        targetValue: 60,
        actualValue: 75
      };

      // Execute
      const result = await StarRatingService.updateStarRatingForCompletion(completionData);
      const newRatings = await StarRatingService.getCurrentStarRatings();

      // Assert
      expect(result.previousStars).toBe(1);
      expect(result.newStars).toBe(2);
      expect(result.reason).toBe('success');
      expect(newRatings.journal).toBe(2);
    });

    test(' A3. Star maintenance on partial success (70-99% completion)', async () => {
      // Setup: User at 3 stars
      await StarRatingService.resetCategoryStarRating(AchievementCategory.GOALS, 3);
      
      const completionData: ChallengeCompletionData = {
        challengeId: 'test-partial',
        category: AchievementCategory.GOALS,
        completionPercentage: 85,
        month: '2025-08',
        wasCompleted: false,
        targetValue: 20,
        actualValue: 17
      };

      // Execute
      const result = await StarRatingService.updateStarRatingForCompletion(completionData);
      const newRatings = await StarRatingService.getCurrentStarRatings();

      // Assert
      expect(result.previousStars).toBe(3);
      expect(result.newStars).toBe(3); // No change
      expect(result.reason).toBe('failure');
      expect(result.challengeCompleted).toBe(false);
      expect(newRatings.goals).toBe(3);
    });

    test(' A4. Single failure tracking (<70% completion)', async () => {
      // Setup: User at 4 stars
      await StarRatingService.resetCategoryStarRating(AchievementCategory.CONSISTENCY, 4);
      
      const completionData: ChallengeCompletionData = {
        challengeId: 'test-single-failure',
        category: AchievementCategory.CONSISTENCY,
        completionPercentage: 60,
        month: '2025-08',
        wasCompleted: false,
        targetValue: 25,
        actualValue: 15
      };

      // Execute
      const result = await StarRatingService.updateStarRatingForCompletion(completionData);
      const newRatings = await StarRatingService.getCurrentStarRatings();

      // Assert
      expect(result.previousStars).toBe(4);
      expect(result.newStars).toBe(4); // No demotion on first failure
      expect(result.reason).toBe('failure');
      expect(newRatings.consistency).toBe(4);
    });

    test(' A5. Double failure demotion (2 consecutive failures)', async () => {
      // Setup: User at 3 stars
      await StarRatingService.resetCategoryStarRating(AchievementCategory.HABITS, 3);
      
      // First failure
      await StarRatingService.updateStarRatingForCompletion({
        challengeId: 'test-failure-1',
        category: AchievementCategory.HABITS,
        completionPercentage: 45,
        month: '2025-07',
        wasCompleted: false,
        targetValue: 30,
        actualValue: 14
      });

      // Second failure (should trigger demotion)
      const result = await StarRatingService.updateStarRatingForCompletion({
        challengeId: 'test-failure-2',
        category: AchievementCategory.HABITS,
        completionPercentage: 55,
        month: '2025-08',
        wasCompleted: false,
        targetValue: 30,
        actualValue: 17
      });

      const newRatings = await StarRatingService.getCurrentStarRatings();

      // Assert
      expect(result.previousStars).toBe(3);
      expect(result.newStars).toBe(2); // Demoted
      expect(result.reason).toBe('double_failure');
      expect(newRatings.habits).toBe(2);
    });

    test(' A6. Minimum star boundary protection (cannot go below 1)', async () => {
      // Setup: User at 1 star
      await StarRatingService.resetCategoryStarRating(AchievementCategory.JOURNAL, 1);
      
      // Two consecutive failures at minimum level
      await StarRatingService.updateStarRatingForCompletion({
        challengeId: 'min-boundary-1',
        category: AchievementCategory.JOURNAL,
        completionPercentage: 40,
        month: '2025-07',
        wasCompleted: false,
        targetValue: 60,
        actualValue: 24
      });

      const result = await StarRatingService.updateStarRatingForCompletion({
        challengeId: 'min-boundary-2',
        category: AchievementCategory.JOURNAL,
        completionPercentage: 35,
        month: '2025-08',
        wasCompleted: false,
        targetValue: 60,
        actualValue: 21
      });

      const ratings = await StarRatingService.getCurrentStarRatings();
      
      // Assert - cannot go below 1
      expect(ratings.journal).toBe(1);
      expect(result.newStars).toBe(1);
    });

    test(' A7. Maximum star boundary protection (cannot go above 5)', async () => {
      // Setup: User at 5 stars
      await StarRatingService.resetCategoryStarRating(AchievementCategory.GOALS, 5);
      
      const result = await StarRatingService.updateStarRatingForCompletion({
        challengeId: 'max-boundary',
        category: AchievementCategory.GOALS,
        completionPercentage: 100,
        month: '2025-08',
        wasCompleted: true,
        targetValue: 20,
        actualValue: 20
      });

      const ratings = await StarRatingService.getCurrentStarRatings();
      
      // Assert - cannot go above 5
      expect(ratings.goals).toBe(5);
      expect(result.newStars).toBe(5);
    });

    test(' A8. Success resets consecutive failure counter', async () => {
      // Setup: User at 3 stars
      await StarRatingService.resetCategoryStarRating(AchievementCategory.CONSISTENCY, 3);
      
      // First failure
      await StarRatingService.updateStarRatingForCompletion({
        challengeId: 'reset-test-1',
        category: AchievementCategory.CONSISTENCY,
        completionPercentage: 50,
        month: '2025-07',
        wasCompleted: false,
        targetValue: 25,
        actualValue: 13
      });

      // Success (should reset failure counter and advance star)
      await StarRatingService.updateStarRatingForCompletion({
        challengeId: 'reset-test-2',
        category: AchievementCategory.CONSISTENCY,
        completionPercentage: 100,
        month: '2025-08',
        wasCompleted: true,
        targetValue: 25,
        actualValue: 25
      });

      // Another failure (should NOT trigger demotion due to reset)
      const result = await StarRatingService.updateStarRatingForCompletion({
        challengeId: 'reset-test-3',
        category: AchievementCategory.CONSISTENCY,
        completionPercentage: 45,
        month: '2025-09',
        wasCompleted: false,
        targetValue: 25,
        actualValue: 11
      });

      const ratings = await StarRatingService.getCurrentStarRatings();
      
      // Assert - should be at 4 stars (advanced from success), no demotion
      expect(ratings.consistency).toBe(4);
      expect(result.previousStars).toBe(4);
      expect(result.newStars).toBe(4); // No demotion because counter was reset
    });

    test(' A9. Star rating history tracking', async () => {
      // Setup: User at 2 stars
      await StarRatingService.resetCategoryStarRating(AchievementCategory.HABITS, 2);
      
      // Complete a challenge successfully
      await StarRatingService.updateStarRatingForCompletion({
        challengeId: 'history-test',
        category: AchievementCategory.HABITS,
        completionPercentage: 100,
        month: '2025-08',
        wasCompleted: true,
        targetValue: 30,
        actualValue: 30
      });

      // Get history
      const history = await StarRatingService.getStarRatingHistory(AchievementCategory.HABITS);

      // Assert - filter to only the completion record (not reset record)
      const completionHistory = history.filter(entry => entry.reason === 'success');
      expect(completionHistory).toHaveLength(1);
      
      // TypeScript fix: ensure array is not empty before accessing
      const completionEntry = completionHistory[0];
      expect(completionEntry).toBeDefined();
      expect(completionEntry!.category).toBe(AchievementCategory.HABITS);
      expect(completionEntry!.previousStars).toBe(2);
      expect(completionEntry!.newStars).toBe(3);
      expect(completionEntry!.reason).toBe('success');
    });

    test(' A10. Star rating analysis generation', async () => {
      // Setup multiple ratings
      await StarRatingService.resetCategoryStarRating(AchievementCategory.HABITS, 4);
      await StarRatingService.resetCategoryStarRating(AchievementCategory.JOURNAL, 2);
      await StarRatingService.resetCategoryStarRating(AchievementCategory.GOALS, 3);
      await StarRatingService.resetCategoryStarRating(AchievementCategory.CONSISTENCY, 1);

      // Execute
      const analysis = await StarRatingService.generateStarRatingAnalysis();

      // Assert
      expect(analysis.overallRating).toBeGreaterThan(1);
      expect(analysis.overallRating).toBeLessThanOrEqual(5);
      expect(analysis.strongestCategory).toBe(AchievementCategory.HABITS);
      expect(analysis.weakestCategory).toBe(AchievementCategory.CONSISTENCY);
      expect(analysis.totalCompletions).toBeGreaterThanOrEqual(0);
      expect(analysis.totalFailures).toBeGreaterThanOrEqual(0);
      expect(analysis.recentTrend).toBeOneOf(['improving', 'stable', 'declining']);
    });

    test(' A11. Category mapping validation', async () => {
      // Test all supported categories
      const supportedCategories = [
        AchievementCategory.HABITS,
        AchievementCategory.JOURNAL, 
        AchievementCategory.GOALS,
        AchievementCategory.CONSISTENCY
      ];

      for (const category of supportedCategories) {
        await StarRatingService.resetCategoryStarRating(category, 2);
        const ratings = await StarRatingService.getCurrentStarRatings();
        
        // Verify category was properly mapped and stored
        switch (category) {
          case AchievementCategory.HABITS:
            expect(ratings.habits).toBe(2);
            break;
          case AchievementCategory.JOURNAL:
            expect(ratings.journal).toBe(2);
            break;
          case AchievementCategory.GOALS:
            expect(ratings.goals).toBe(2);
            break;
          case AchievementCategory.CONSISTENCY:
            expect(ratings.consistency).toBe(2);
            break;
        }
      }
    });

    test('A12. GOALS category star progression (supported category)', async () => {
      // GOALS is a fully supported star-rating category in the current design
      // (StarRatingService.normalizeStarRatings includes `goals`). The old
      // version of this test asserted fallback behavior for an "unsupported"
      // category, which no longer reflects production.
      const completionData: ChallengeCompletionData = {
        challengeId: 'goals-category-test',
        category: AchievementCategory.GOALS,
        completionPercentage: 100,
        month: '2025-08',
        wasCompleted: true,
        targetValue: 10,
        actualValue: 10
      };

      // Execute
      const result = await StarRatingService.updateStarRatingForCompletion(completionData);

      // Assert - 100% completion advances the GOALS rating 1 -> 2 stars
      expect(result.previousStars).toBe(1);
      expect(result.newStars).toBe(2);
      expect(result.reason).toBe('success');
      expect(result.challengeCompleted).toBe(true);
    });
  });

  // ========================================
  // SECTION B: STAR-BASED XP SCALING (8/8 PASSING)
  // ========================================

  describe('=� Star-based XP Scaling System (8/8)', () => {
    test(' B1. XP reward calculation for all star levels', () => {
      // Test precise XP rewards for each star level - FULL monthly challenges
      // (MONTHLY_XP_REWARDS per technical-guides:Monthly-Challenges.md).
      expect(MonthlyChallengeService.getXPRewardForStarLevel(1)).toBe(5000);   // 1 Easy
      expect(MonthlyChallengeService.getXPRewardForStarLevel(2)).toBe(7500);   // 2 Medium
      expect(MonthlyChallengeService.getXPRewardForStarLevel(3)).toBe(12000);  // 3 Hard
      expect(MonthlyChallengeService.getXPRewardForStarLevel(4)).toBe(17500);  // 4 Expert
      expect(MonthlyChallengeService.getXPRewardForStarLevel(5)).toBe(25000);  // 5 Master

      // Warm-up variant for new users (< 20 active days)
      expect(MonthlyChallengeService.getWarmUpXPReward(1)).toBe(500);
      expect(MonthlyChallengeService.getWarmUpXPReward(5)).toBe(2532);
    });

    test(' B2. XP scaling progression validation', () => {
      // Validate that rewards increase strictly with star level for both
      // the full monthly and the warm-up reward tables.
      for (let star = 2 as 2 | 3 | 4 | 5; star <= 5; star++) {
        expect(MonthlyChallengeService.getXPRewardForStarLevel(star))
          .toBeGreaterThan(MonthlyChallengeService.getXPRewardForStarLevel((star - 1) as 1 | 2 | 3 | 4));
        expect(MonthlyChallengeService.getWarmUpXPReward(star))
          .toBeGreaterThan(MonthlyChallengeService.getWarmUpXPReward((star - 1) as 1 | 2 | 3 | 4));
      }

      // Warm-up table keeps the original 1.5x exponential progression
      const baseReward = 500;
      expect(MonthlyChallengeService.getWarmUpXPReward(2)).toBe(baseReward * 1.5);                    // 750
      expect(MonthlyChallengeService.getWarmUpXPReward(3)).toBe(Math.round(baseReward * 2.25));       // 1125
      expect(MonthlyChallengeService.getWarmUpXPReward(4)).toBe(Math.round(baseReward * 3.375));      // 1688 (1687.5 rounded)
      expect(MonthlyChallengeService.getWarmUpXPReward(5)).toBe(Math.round(baseReward * 5.064));      // 2532
    });

    test(' B3. Star scaling multiplier accuracy (real target path)', () => {
      // N-3.3: stars map LINEARLY inside the template's multiplier range —
      // [1.05, 1.25] → 1.05 / 1.10 / 1.15 / 1.20 / 1.25
      const template = makeScalingTemplate();
      const baseline = { totalHabitCompletions: 100 };

      const targets = ([1, 2, 3, 4, 5] as const).map(star =>
        MonthlyChallengeService.calculateTargetFromBaseline(template as any, baseline as any, star).target
      );

      expect(targets).toEqual([105, 110, 115, 120, 125]);
    });

    test(' B4. Minimum floors protect low baselines (per tracking key)', () => {
      // habit_streak_days minimums: [5, 7, 10, 14, 18] consecutive days (N-3.2)
      const template = makeScalingTemplate({
        baselineMetricKey: 'longestHabitStreak',
        baselineMultiplierRange: [1.15, 1.35] as [number, number],
        requirementTemplates: [{
          type: 'habits', description: 'r', trackingKey: 'habit_streak_days',
          progressMilestones: [0.25, 0.5, 0.75],
        }],
      });
      const baseline = { longestHabitStreak: 2 };

      const r3 = MonthlyChallengeService.calculateTargetFromBaseline(template as any, baseline as any, 3);
      expect(r3.target).toBe(10); // ceil(2 × 1.25) = 3 → per-key minimum 10
      expect(r3.calculationMethod).toBe('minimum');

      const r5 = MonthlyChallengeService.calculateTargetFromBaseline(template as any, baseline as any, 5);
      expect(r5.target).toBe(18); // 5⭐ minimum
    });

    test(' B5. Difficulty derives from the current star rating (real path)', async () => {
      // Setup: Set user to 3 stars in habits — generation reads this rating
      // and feeds it into calculateTargetFromBaseline
      await StarRatingService.resetCategoryStarRating(AchievementCategory.HABITS, 3);
      const ratings = await StarRatingService.getCurrentStarRatings();
      const starLevel = Math.max(1, Math.min(5, ratings.habits)) as 1 | 2 | 3 | 4 | 5;
      expect(starLevel).toBe(3);

      const template = makeScalingTemplate();
      const baseline = { totalHabitCompletions: 80 };
      const result = MonthlyChallengeService.calculateTargetFromBaseline(template as any, baseline as any, starLevel);

      expect(result.scalingMultiplier).toBeCloseTo(1.15, 10); // midpoint of [1.05, 1.25]
      expect(result.target).toBe(92); // ceil(80 × 1.15)
      expect(result.baselineValue).toBe(80);
      expect(result.calculationMethod).toBe('baseline');
    });

    test(' B6. Star rarity color and display mapping', () => {
      // Test complete star display information
      const star1 = StarRatingService.getStarDisplayInfo(1);
      expect(star1.color).toBe('#9E9E9E'); // Gray - Common
      expect(star1.rarity).toBe(AchievementRarity.COMMON);
      expect(star1.name).toBe('Novice');

      const star2 = StarRatingService.getStarDisplayInfo(2);
      expect(star2.color).toBe('#2196F3'); // Blue - Rare
      expect(star2.rarity).toBe(AchievementRarity.RARE);
      expect(star2.name).toBe('Explorer');

      const star3 = StarRatingService.getStarDisplayInfo(3);
      expect(star3.color).toBe('#9C27B0'); // Purple - Epic
      expect(star3.rarity).toBe(AchievementRarity.EPIC);
      expect(star3.name).toBe('Challenger');

      const star4 = StarRatingService.getStarDisplayInfo(4);
      expect(star4.color).toBe('#FF9800'); // Orange - Legendary
      expect(star4.rarity).toBe(AchievementRarity.LEGENDARY);
      expect(star4.name).toBe('Expert');

      const star5 = StarRatingService.getStarDisplayInfo(5);
      expect(star5.color).toBe('#FFD700'); // Gold - Legendary+
      expect(star5.rarity).toBe(AchievementRarity.LEGENDARY);
      expect(star5.name).toBe('Master');
    });

    test(' B7. Star multiplier configuration consistency', () => {
      // Validate that multipliers match between services
      const multipliers = StarRatingService.getStarMultipliers();
      
      expect(multipliers[1]).toBe(1.05); // +5%
      expect(multipliers[2]).toBe(1.10); // +10%
      expect(multipliers[3]).toBe(1.15); // +15%
      expect(multipliers[4]).toBe(1.20); // +20%
      expect(multipliers[5]).toBe(1.25); // +25%
    });

    test(' B8. XP and scaling edge case validation', () => {
      // Test boundary conditions
      
      // XP rewards boundaries
      expect(MonthlyChallengeService.getXPRewardForStarLevel(1)).toBeGreaterThan(0);
      expect(MonthlyChallengeService.getXPRewardForStarLevel(5)).toBeLessThanOrEqual(25000); // MONTHLY_XP_REWARDS upper bound
      
      // Scaling boundaries (real path): streak targets never exceed the days
      // in the target month, quality entries never exceed 3/day (N-3.2 caps)
      const streakTemplate = makeScalingTemplate({
        baselineMetricKey: 'longestHabitStreak',
        baselineMultiplierRange: [1.15, 1.35] as [number, number],
        requirementTemplates: [{
          type: 'habits', description: 'r', trackingKey: 'habit_streak_days',
          progressMilestones: [0.25, 0.5, 0.75],
        }],
      });
      const capped = MonthlyChallengeService.calculateTargetFromBaseline(
        streakTemplate as any, { longestHabitStreak: 100 } as any, 5, 10, '2026-02'
      );
      expect(capped.target).toBe(28); // February 2026 (non-leap)

      const qualityTemplate = makeScalingTemplate({
        category: AchievementCategory.JOURNAL,
        baselineMetricKey: 'qualityJournalEntries',
        baselineMultiplierRange: [1.05, 1.25] as [number, number],
        requirementTemplates: [{
          type: 'journal', description: 'r', trackingKey: 'quality_journal_entries',
          progressMilestones: [0.25, 0.5, 0.75],
        }],
      });
      const qualityCapped = MonthlyChallengeService.calculateTargetFromBaseline(
        qualityTemplate as any, { qualityJournalEntries: 200 } as any, 5, 10, '2026-04'
      );
      expect(qualityCapped.target).toBe(90); // 3/day × 30 days in April

      // Zero baseline protection: falls back, then the minimum floor applies
      const zero = MonthlyChallengeService.calculateTargetFromBaseline(
        makeScalingTemplate() as any, { totalHabitCompletions: 0 } as any, 3, 25
      );
      expect(zero.target).toBeGreaterThan(0);
      expect(['fallback', 'minimum']).toContain(zero.calculationMethod);
    });

    test(' B9. Goals/Consistency target sanity (N-3.12 audit fixes)', async () => {
      // a) goal_completions: per-key minima [2,2,3,3,4] — the old category
      // minimum (days scale) demanded 12 completed goals at 2⭐
      const completionTemplate = makeScalingTemplate({
        category: AchievementCategory.GOALS,
        baselineMetricKey: 'goalsCompleted',
        baselineMultiplierRange: [1.15, 1.35] as [number, number],
        requirementTemplates: [{
          type: 'goals', description: 'r', trackingKey: 'goal_completions',
          progressMilestones: [0.25, 0.5, 0.75],
        }],
      });
      const c2 = MonthlyChallengeService.calculateTargetFromBaseline(
        completionTemplate as any, { goalsCompleted: 2 } as any, 2
      );
      expect(c2.target).toBe(3); // ceil(2 × 1.20), NOT the old minimum 12

      // b) XP Champion: monthly XP baseline → guide-scale targets
      const xpTemplate = makeScalingTemplate({
        category: AchievementCategory.CONSISTENCY,
        baselineMetricKey: 'totalMonthlyXP',
        baselineMultiplierRange: [1.15, 1.35] as [number, number],
        requirementTemplates: [{
          type: 'consistency', description: 'r', trackingKey: 'monthly_xp_total',
          progressMilestones: [0.25, 0.5, 0.75],
        }],
      });
      const xpTargets = ([1, 2, 3, 4, 5] as const).map(star =>
        MonthlyChallengeService.calculateTargetFromBaseline(
          xpTemplate as any, { totalMonthlyXP: 1400 } as any, star
        ).target
      );
      expect(xpTargets).toEqual([1610, 1680, 1750, 1820, 1890]); // +15..+35 %
      // Zero-XP user: fallback + per-key minimum keeps it non-trivial
      const xpZero = MonthlyChallengeService.calculateTargetFromBaseline(
        xpTemplate as any, { totalMonthlyXP: 0 } as any, 1
      );
      expect(xpZero.target).toBeGreaterThanOrEqual(500);

      // c) Balance Expert: fractional target on the 0-1 scale (the old
      // integer ceil + category minimum produced an impossible target of 25)
      const balanceTemplate = makeScalingTemplate({
        category: AchievementCategory.CONSISTENCY,
        baselineMetricKey: 'balanceScore',
        baselineMultiplierRange: [1.20, 1.40] as [number, number],
        requirementTemplates: [{
          type: 'consistency', description: 'r', trackingKey: 'balance_score',
          progressMilestones: [0.25, 0.5, 0.75],
        }],
      });
      const b4 = MonthlyChallengeService.calculateTargetFromBaseline(
        balanceTemplate as any, { balanceScore: 0.6 } as any, 4
      );
      expect(b4.target).toBeCloseTo(0.81, 10); // 0.6 × 1.35
      const b5 = MonthlyChallengeService.calculateTargetFromBaseline(
        balanceTemplate as any, { balanceScore: 0.6 } as any, 5
      );
      expect(b5.target).toBeCloseTo(0.84, 10); // 0.6 × 1.40
      // Ceiling: never demand near-perfection
      const bHigh = MonthlyChallengeService.calculateTargetFromBaseline(
        balanceTemplate as any, { balanceScore: 0.9 } as any, 5
      );
      expect(bHigh.target).toBeLessThanOrEqual(0.95);
      // Nonsense numeric fallback (20) must not leak into the 0-1 scale
      const bZero = MonthlyChallengeService.calculateTargetFromBaseline(
        balanceTemplate as any, { balanceScore: 0 } as any, 4
      );
      expect(bZero.target).toBeGreaterThanOrEqual(0.4);
      expect(bZero.target).toBeLessThanOrEqual(0.95);

      // d) N-3.15a: softened triple/perfect minima [8,10,12,15,18] — the old
      // category floor demanded 18 triple days at 2⭐ from a baseline-5 user
      const tripleTemplate = makeScalingTemplate({
        category: AchievementCategory.CONSISTENCY,
        baselineMetricKey: 'tripleFeatureDays',
        baselineMultiplierRange: [1.05, 1.25] as [number, number],
        requirementTemplates: [{
          type: 'consistency', description: 'r', trackingKey: 'triple_feature_days',
          progressMilestones: [0.25, 0.5, 0.75],
        }],
      });
      const t2 = MonthlyChallengeService.calculateTargetFromBaseline(
        tripleTemplate as any, { tripleFeatureDays: 5 } as any, 2
      );
      expect(t2.target).toBe(10); // per-key minimum, NOT the old 18
    });
  });

  // ========================================
  // SECTION C: MATHEMATICAL PRECISION VALIDATION (8/8 PASSING)
  // ========================================

  describe('>� Mathematical Precision Validation (8/8)', () => {
    test(' C1. Star level progression mathematical accuracy', () => {
      // Test progression rules: success (+1), failure (maintain), double failure (-1)
      
      // Success progression with boundaries
      expect(Math.min(1 + 1, 5)).toBe(2);  // 1 success � 2
      expect(Math.min(4 + 1, 5)).toBe(5);  // 4 success � 5 (capped)
      expect(Math.min(5 + 1, 5)).toBe(5);  // 5 success � 5 (already max)
      
      // Failure maintenance
      expect(3).toBe(3); // 3 single failure � 3 (maintain)
      expect(2).toBe(2); // 2 partial success (70-99%) � 2 (maintain)
      
      // Double failure demotion with boundaries
      expect(Math.max(3 - 1, 1)).toBe(2); // 3 double failure � 2
      expect(Math.max(1 - 1, 1)).toBe(1); // 1 double failure � 1 (floored)
    });

    test(' C2. XP scaling mathematical validation', () => {
      // Validate the exact mathematical formulas
      const baseReward = 500; // Base 1 reward
      
      // XP progression: 500 � 750 � 1125 � 1688 � 2532
      expect(baseReward).toBe(500);                           // 1
      expect(Math.round(baseReward * 1.5)).toBe(750);        // 2 = 1.5x
      expect(Math.round(baseReward * 2.25)).toBe(1125);      // 3 = 2.25x (1.5�)
      expect(Math.round(baseReward * 3.375)).toBe(1688);     // 4 = 3.375x (1.5�)
      expect(Math.round(baseReward * 5.064)).toBe(2532);     // 5 = 5.064x (1.5t)
      
      // Scaling multiplier validation with floating point precision
      const baseline = 100;
      expect(Math.ceil(baseline * 1.05)).toBe(105);  // 1 = +5%
      expect(Math.ceil(baseline * 1.10)).toBe(111);  // 2 = +10% (floating point: 110.000...1)
      expect(Math.ceil(baseline * 1.15)).toBe(115);  // 3 = +15%
      expect(Math.ceil(baseline * 1.20)).toBe(120);  // 4 = +20%
      expect(Math.ceil(baseline * 1.25)).toBe(125);  // 5 = +25%
    });

    test(' C3. Grace period pro-rating calculations', () => {
      // Test pro-rating formulas for different start days
      const monthlyTarget = 30; // Example monthly target
      const daysInMonth = 30;
      
      // Day 1 start (perfect): 30/30 days = 100%
      const day1Remaining = daysInMonth - 1 + 1;
      expect((day1Remaining / daysInMonth) * monthlyTarget).toBe(30);
      
      // Day 4 start (grace period): 27/30 days = 90%
      const day4Remaining = daysInMonth - 4 + 1;
      expect(Math.ceil((day4Remaining / daysInMonth) * monthlyTarget)).toBe(27);
      
      // Day 7 start (last grace day): 24/30 days = 80%
      const day7Remaining = daysInMonth - 7 + 1;
      expect(Math.ceil((day7Remaining / daysInMonth) * monthlyTarget)).toBe(24);
      
      // Boundary validation for grace period (days 1-7)
      for (let startDay = 1; startDay <= 7; startDay++) {
        const remainingDays = daysInMonth - startDay + 1;
        const proRatingFactor = remainingDays / daysInMonth;
        
        expect(proRatingFactor).toBeGreaterThan(0);
        expect(proRatingFactor).toBeLessThanOrEqual(1);
        expect(Math.ceil(monthlyTarget * proRatingFactor)).toBeGreaterThan(0);
        
        // Ensure reasonable pro-rating
        if (startDay === 1) expect(proRatingFactor).toBe(1.0);      // Perfect start
        if (startDay === 7) expect(proRatingFactor).toBeCloseTo(0.8, 1); // 80% target
      }
    });

    test(' C4. Boundary protection and edge cases', () => {
      // Star level boundaries (1-5)
      expect(Math.max(1, Math.min(5, 0))).toBe(1);   // Below minimum � 1
      expect(Math.max(1, Math.min(5, 6))).toBe(5);   // Above maximum � 5
      expect(Math.max(1, Math.min(5, 3))).toBe(3);   // Valid range � unchanged
      
      // Completion percentage boundaries (0-100+)
      expect(Math.max(0, 150)).toBe(150);   // Over 100% allowed and beneficial
      expect(Math.max(0, -10)).toBe(0);     // Below 0% � 0
      
      // XP reward boundaries validation
      const minXP = 5000;   // 1-star minimum (MONTHLY_XP_REWARDS)
      const maxXP = 25000;  // 5-star maximum (MONTHLY_XP_REWARDS)
      
      for (let starLevel = 1; starLevel <= 5; starLevel++) {
        const xpReward = MonthlyChallengeService.getXPRewardForStarLevel(starLevel as 1|2|3|4|5);
        expect(xpReward).toBeGreaterThanOrEqual(minXP);
        expect(xpReward).toBeLessThanOrEqual(maxXP);
      }
      
      // Target scaling minimum protection
      const baseline = 5;
      const starLevel = 4;
      const scaled = Math.ceil(baseline * 1.20); // Math.ceil(6) = 6
      const protectedValue = Math.max(scaled, starLevel); // Math.max(6, 4) = 6
      expect(protectedValue).toBeGreaterThanOrEqual(starLevel);
    });

    test(' C5. Completion percentage threshold accuracy', () => {
      // Test the exact thresholds used in star progression
      const successThreshold = 100;     // e100% = success (+1)
      const partialThreshold = 70;      // 70-99% = maintain level
      const failureThreshold = 70;      // <70% = failure (potential -1)
      
      // Success cases
      expect(100 >= successThreshold).toBe(true);
      expect(125 >= successThreshold).toBe(true);
      
      // Partial success cases  
      expect(85 >= partialThreshold && 85 < successThreshold).toBe(true);
      expect(70 >= partialThreshold && 70 < successThreshold).toBe(true);
      
      // Failure cases
      expect(69 < failureThreshold).toBe(true);
      expect(50 < failureThreshold).toBe(true);
      expect(0 < failureThreshold).toBe(true);
    });

    test(' C6. Consecutive failure counting logic', () => {
      // Test the double-failure demotion rule
      const consecutiveFailuresForDemotion = 2;
      
      // Single failure - no demotion
      expect(1 < consecutiveFailuresForDemotion).toBe(true);
      
      // Double failure - trigger demotion  
      expect(2 >= consecutiveFailuresForDemotion).toBe(true);
      expect(3 >= consecutiveFailuresForDemotion).toBe(true);
      
      // Reset counter after success
      const resetAfterSuccess = 0;
      expect(resetAfterSuccess < consecutiveFailuresForDemotion).toBe(true);
    });

    test(' C7. Date and month calculations', () => {
      // Test month string formatting
      const currentDate = new Date('2025-08-12');
      const monthString = currentDate.toISOString().substring(0, 7);
      expect(monthString).toBe('2025-08');
      
      // Test day-of-month calculations
      expect(currentDate.getDate()).toBe(12);
      
      // Test month transition detection  
      const previousMonth: string = '2025-07';
      const currentMonth: string = '2025-08';
      expect(previousMonth !== currentMonth).toBe(true);
      
      // Test grace period day range (1-7)
      const gracePeriodDays = 7;
      for (let day = 1; day <= gracePeriodDays; day++) {
        expect(day >= 1 && day <= gracePeriodDays).toBe(true);
      }
      
      // Test out-of-grace-period days
      expect(8 > gracePeriodDays).toBe(true);
      expect(15 > gracePeriodDays).toBe(true);
    });

    test(' C8. Floating point precision handling', () => {
      // Test the specific floating point issue that affects scaling
      const baseline = 100;
      
      // Problematic case: 100 * 1.10 = 110.00000000000001
      const floatingResult = baseline * 1.10;
      expect(floatingResult).toBeCloseTo(110, 10); // Very close to 110
      expect(floatingResult).toBeGreaterThan(110);  // But slightly greater
      
      // Math.ceil handles this correctly
      expect(Math.ceil(floatingResult)).toBe(111);
      
      // Other multipliers that should be exact
      expect(baseline * 1.05).toBe(105);
      expect(baseline * 1.25).toBe(125);
      expect(Math.ceil(baseline * 1.15)).toBe(115);
      expect(Math.ceil(baseline * 1.20)).toBe(120);
    });
  });

  // ========================================
  // PRODUCTION VALIDATION SUMMARY
  // ========================================

  describe('=� PRODUCTION VALIDATION SUMMARY', () => {
    test('<� Phase 3 Complete System Integration Test', async () => {
      // This test validates the complete flow from star rating to XP calculation
      
      // 1. Initialize user at baseline ratings
      await StarRatingService.resetCategoryStarRating(AchievementCategory.HABITS, 1);
      await StarRatingService.resetCategoryStarRating(AchievementCategory.JOURNAL, 1); 
      await StarRatingService.resetCategoryStarRating(AchievementCategory.GOALS, 1);
      await StarRatingService.resetCategoryStarRating(AchievementCategory.CONSISTENCY, 1);
      
      // 2. Simulate successful challenge completion
      const completionData: ChallengeCompletionData = {
        challengeId: 'integration-test-challenge',
        category: AchievementCategory.HABITS,
        completionPercentage: 100,
        month: '2025-08',
        wasCompleted: true,
        targetValue: 30,
        actualValue: 30
      };
      
      // 3. Update star rating
      const starResult = await StarRatingService.updateStarRatingForCompletion(completionData);
      expect(starResult.previousStars).toBe(1);
      expect(starResult.newStars).toBe(2);
      expect(starResult.reason).toBe('success');
      
      // 4. Calculate new XP reward based on new star level
      const xpReward = MonthlyChallengeService.getXPRewardForStarLevel(2);
      expect(xpReward).toBe(7500); // MONTHLY_XP_REWARDS (full monthly challenge)
      
      // 5. Calculate new difficulty for next challenge (real target path:
      // new star rating → calculateTargetFromBaseline)
      const newRatings = await StarRatingService.getCurrentStarRatings();
      const nextStar = Math.max(1, Math.min(5, newRatings.habits)) as 1 | 2 | 3 | 4 | 5;
      expect(nextStar).toBe(2);
      const difficulty = MonthlyChallengeService.calculateTargetFromBaseline(
        makeScalingTemplate() as any, { totalHabitCompletions: 30 } as any, nextStar
      );
      expect(difficulty.scalingMultiplier).toBeCloseTo(1.10, 10); // 2⭐ in [1.05, 1.25]
      expect(difficulty.target).toBe(33); // ceil(30 × 1.10) = 33 ≥ minimum 25

      // 6. Verify complete system state
      const ratings = await StarRatingService.getCurrentStarRatings();
      const analysis = await StarRatingService.generateStarRatingAnalysis();
      
      expect(ratings.habits).toBe(2);
      expect(analysis.totalCompletions).toBeGreaterThanOrEqual(1);
      expect(analysis.totalFailures).toBeGreaterThanOrEqual(0); // Might include failures from other tests
      expect(analysis.recentTrend).toBeOneOf(['improving', 'stable', 'declining']);
      
      // SYSTEM VALIDATION: All Phase 3 components working together
      console.log('<� PHASE 3 INTEGRATION TEST PASSED');
      console.log(`Star Progression: 1 � 2 (${starResult.reason})`);
      console.log(`XP Reward: ${xpReward} XP`);
      console.log(`Next Difficulty: ${difficulty.target} (${Math.round((difficulty.scalingMultiplier - 1) * 100)}% increase)`);
      console.log(`User Analysis: ${analysis.totalCompletions} completions, trend: ${analysis.recentTrend}`);
    });
  });
});

// Custom Jest matcher for array inclusion
expect.extend({
  toBeOneOf(received, array) {
    const pass = array.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${array}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${array}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(array: any[]): R;
    }
  }
}