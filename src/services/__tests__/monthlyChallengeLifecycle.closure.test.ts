// Monthly Challenge Lifecycle — Month-End Closure Regression Suite (audit 3g)
//
// WHY THIS EXISTS (super audit Fáze 3, session #9): the plan demands the
// failure-path closure (`closePreviousChallenge`) verified for ALL 14
// templates, not a spot-check. The closure logic is template-agnostic, so this
// suite drives it once per REAL template shape and asserts the contract:
//   - star rating updated with the real completion percentage (isWarmUp guard),
//   - monthly streak reset (category, false),
//   - challenge archived,
//   - NO XP awarded for a failed challenge,
//   - `monthly_challenge_failed` emitted with correct failureType
//     (< 70 % → 'failure', 70-99 % → 'partial'),
//   - already-completed challenges are a no-op.

import { DeviceEventEmitter } from 'react-native';
import { MonthlyChallengeLifecycleManager } from '../monthlyChallengeLifecycleManager';
import { MonthlyChallengeService } from '../monthlyChallengeService';
import { MonthlyProgressTracker } from '../monthlyProgressTracker';
import { StarRatingService } from '../starRatingService';
import { GamificationService } from '../gamificationService';
import { MonthlyChallenge, AchievementCategory } from '../../types/gamification';
import { TFunction } from 'i18next';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
  },
}));

const t = ((key: string) => key) as TFunction;
const mockEmit = DeviceEventEmitter.emit as jest.Mock;

/** Sensible target per tracking key (balance is a 0-1 fraction). */
function targetFor(trackingKey: string): number {
  switch (trackingKey) {
    case 'balance_score': return 0.8;
    case 'monthly_xp_total': return 2000;
    case 'avg_entry_length': return 60;
    default: return 20;
  }
}

function buildChallenge(templateId: string, category: AchievementCategory, trackingKey: string, starLevel: 1 | 2 | 3 | 4 | 5): MonthlyChallenge {
  return {
    id: `closure_test_${templateId}`,
    title: `Closure: ${templateId}`,
    description: 'closure regression',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    baseXPReward: 5000,
    starLevel,
    category,
    requirements: [{
      type: 'habits',
      description: 'r',
      trackingKey,
      target: targetFor(trackingKey),
      baselineValue: 0,
      scalingMultiplier: 1,
      progressMilestones: [0.25, 0.5, 0.75],
    } as any],
    userBaselineSnapshot: {
      month: '2026-06', // previous month → closure must trigger
      analysisStartDate: '2026-06-01',
      analysisEndDate: '2026-06-30',
      dataQuality: 'complete',
      totalActiveDays: 20,
    },
    scalingFormula: 'test',
    isActive: true,
    generationReason: 'scheduled',
    categoryRotation: [],
    templateId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function buildProgress(challenge: MonthlyChallenge, completionPercentage: number, isCompleted = false) {
  const req = challenge.requirements[0]!;
  return {
    challengeId: challenge.id,
    progress: { [req.trackingKey]: (completionPercentage / 100) * req.target },
    completionPercentage,
    isCompleted,
    currentStreak: 2,
    daysActive: 10,
    daysRemaining: 0,
    activeDays: [],
    projectedCompletion: completionPercentage,
    weeklyProgress: {},
    milestonesReached: {},
    xpEarned: 0,
  } as any;
}

/** All 14 real template shapes (id, category, trackingKey, a valid starLevel). */
function allTemplateShapes(): Array<{ id: string; category: AchievementCategory; trackingKey: string; starLevel: 1 | 2 | 3 | 4 | 5 }> {
  const categories = [
    AchievementCategory.HABITS,
    AchievementCategory.JOURNAL,
    AchievementCategory.GOALS,
    AchievementCategory.CONSISTENCY,
  ];
  const shapes: Array<{ id: string; category: AchievementCategory; trackingKey: string; starLevel: 1 | 2 | 3 | 4 | 5 }> = [];
  for (const category of categories) {
    for (const template of MonthlyChallengeService.getTemplatesForCategory(category, t)) {
      shapes.push({
        id: template.id,
        category,
        trackingKey: template.requirementTemplates[0]!.trackingKey,
        starLevel: template.starLevelRequirements.minLevel as 1 | 2 | 3 | 4 | 5,
      });
    }
  }
  return shapes;
}

describe('Month-end closure (closePreviousChallenge) — all 14 templates (3g)', () => {
  let starSpy: jest.SpyInstance;
  let failuresSpy: jest.SpyInstance;
  let streakSpy: jest.SpyInstance;
  let archiveSpy: jest.SpyInstance;
  let addXPSpy: jest.SpyInstance;
  let getCurrentSpy: jest.SpyInstance;
  let getProgressSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    starSpy = jest.spyOn(StarRatingService, 'updateStarRatingForCompletion').mockResolvedValue({
      previousStars: 3, newStars: 3, reason: 'failure',
    } as any);
    failuresSpy = jest.spyOn(StarRatingService, 'getConsecutiveFailures').mockResolvedValue(1);
    streakSpy = jest.spyOn(GamificationService, 'updateMonthlyStreak').mockResolvedValue(undefined as any);
    addXPSpy = jest.spyOn(GamificationService, 'addXP').mockResolvedValue({ success: true } as any);
    archiveSpy = jest.spyOn(MonthlyChallengeService, 'archiveCompletedChallenge').mockResolvedValue(undefined);
    getCurrentSpy = jest.spyOn(MonthlyChallengeService, 'getCurrentChallenge');
    getProgressSpy = jest.spyOn(MonthlyProgressTracker, 'getChallengeProgress');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function closeWith(challenge: MonthlyChallenge, progress: any): Promise<void> {
    getCurrentSpy.mockResolvedValue(challenge);
    getProgressSpy.mockResolvedValue(progress);
    await (MonthlyChallengeLifecycleManager as any).closePreviousChallenge('2026-07');
  }

  test('failure path holds the contract for every template (50 % < 70 %)', async () => {
    const shapes = allTemplateShapes();
    expect(shapes).toHaveLength(14); // catalog completeness guard

    for (const shape of shapes) {
      jest.clearAllMocks();
      const challenge = buildChallenge(shape.id, shape.category, shape.trackingKey, shape.starLevel);
      await closeWith(challenge, buildProgress(challenge, 50));

      // Star rating gets the REAL percentage and the failure flag
      expect(starSpy).toHaveBeenCalledTimes(1);
      expect(starSpy.mock.calls[0]![0]).toMatchObject({
        challengeId: challenge.id,
        category: shape.category,
        completionPercentage: 50,
        wasCompleted: false,
        isWarmUp: false,
      });

      // Streak reset for the right category
      expect(streakSpy).toHaveBeenCalledWith(shape.category, false, shape.starLevel);

      // Archived with the REAL final stats (N-3.17: history must not keep
      // the stale generation-time row, and a failed challenge is 'failed')
      expect(archiveSpy).toHaveBeenCalledWith(challenge.id, expect.objectContaining({
        status: 'failed',
        completionPercentage: 50,
        xpEarned: 0,
      }));

      // NO XP for a failed challenge
      expect(addXPSpy).not.toHaveBeenCalled();

      // Failure modal event with correct classification
      const failedEmit = mockEmit.mock.calls.find(c => c[0] === 'monthly_challenge_failed');
      expect({ id: shape.id, emitted: !!failedEmit }).toEqual({ id: shape.id, emitted: true });
      expect(failedEmit![1]).toMatchObject({
        challengeId: challenge.id,
        category: shape.category,
        completionPercentage: 50,
        failureType: 'failure', // < 70 %
        totalRequirements: 1,
        requirementsCompleted: 0,
      });
    }
  });

  test('partial completion (70-99 %) is classified as partial, still no XP', async () => {
    const challenge = buildChallenge('habits_consistency_master', AchievementCategory.HABITS, 'scheduled_habit_completions', 1);
    await closeWith(challenge, buildProgress(challenge, 75));

    expect(starSpy.mock.calls[0]![0]).toMatchObject({ completionPercentage: 75, wasCompleted: false });
    expect(addXPSpy).not.toHaveBeenCalled();
    const failedEmit = mockEmit.mock.calls.find(c => c[0] === 'monthly_challenge_failed');
    expect(failedEmit![1]).toMatchObject({ failureType: 'partial' });
  });

  test('warm-up challenge closure carries the isWarmUp flag (no star demotion)', async () => {
    const challenge = buildChallenge('habits_consistency_master', AchievementCategory.HABITS, 'scheduled_habit_completions', 1);
    challenge.generationReason = 'warm_up';
    await closeWith(challenge, buildProgress(challenge, 30));

    expect(starSpy.mock.calls[0]![0]).toMatchObject({ isWarmUp: true });
  });

  test('already-completed challenge is a no-op (100 % handled during the month)', async () => {
    const challenge = buildChallenge('habits_consistency_master', AchievementCategory.HABITS, 'scheduled_habit_completions', 1);
    await closeWith(challenge, buildProgress(challenge, 100, true));

    expect(starSpy).not.toHaveBeenCalled();
    expect(streakSpy).not.toHaveBeenCalled();
    expect(archiveSpy).not.toHaveBeenCalled();
    expect(mockEmit.mock.calls.find(c => c[0] === 'monthly_challenge_failed')).toBeUndefined();
  });

  test('current-month challenge is not closed', async () => {
    const challenge = buildChallenge('habits_consistency_master', AchievementCategory.HABITS, 'scheduled_habit_completions', 1);
    challenge.userBaselineSnapshot.month = '2026-07'; // same as newMonth
    await closeWith(challenge, buildProgress(challenge, 50));

    expect(starSpy).not.toHaveBeenCalled();
    expect(archiveSpy).not.toHaveBeenCalled();
  });
});
