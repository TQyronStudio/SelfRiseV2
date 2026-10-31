/**
 * Trophy collections and the trophies that depend on large goals.
 *
 * Guards four bugs found in October 2026: 4 of 8 collections waited for trophies
 * that no longer existed, the promised bonus XP was never paid, and the goal forms'
 * cap of 999 999 made Mega Dreamer and Million Achiever impossible to earn.
 *
 * The payout runs against the real in-memory SQLite and the real addXP: "paid" is
 * an XP transaction, so a mocked grant would prove nothing.
 */
import { CORE_ACHIEVEMENTS } from '@/src/constants/achievementCatalog';
import { MAX_GOAL_VALUE } from '@/src/constants/goals';
import { TROPHY_COLLECTIONS } from '@/src/constants/trophyCollections';
import { GOAL_TARGET_MAX } from '@/src/components/onboarding/goalDraft';
import { AchievementService } from '../achievementService';
import { AchievementStorage } from '../achievementStorage';
import { getDatabase } from '../database/init';
import { GamificationService } from '../gamificationService';
import { TrophyCollectionService } from '../trophyCollectionService';

const firstSteps = ['first-habit', 'first-journal', 'first-goal'];

const paidXp = async () =>
  (
    await getDatabase().getAllAsync<{ amount: number }>(
      "SELECT amount FROM xp_transactions WHERE source_id LIKE 'trophy_collection:%'"
    )
  ).reduce((sum, row) => sum + row.amount, 0);

beforeEach(async () => {
  await getDatabase().execAsync('DELETE FROM xp_transactions');
  jest.restoreAllMocks();
});

describe('collection definitions', () => {
  const known = new Set(CORE_ACHIEVEMENTS.map(a => a.id));

  it.each(TROPHY_COLLECTIONS.map(c => [c.id, c.requiredAchievements] as const))(
    '%s only needs trophies that exist',
    (_id, required) => {
      expect(required.filter(id => !known.has(id))).toEqual([]);
    }
  );

  it('has unique ids and a positive bonus', () => {
    expect(new Set(TROPHY_COLLECTIONS.map(c => c.id)).size).toBe(
      TROPHY_COLLECTIONS.length
    );
    expect(TROPHY_COLLECTIONS.every(c => c.bonusXP > 0)).toBe(true);
  });
});

describe('bonus payout', () => {
  it('pays a completed collection', async () => {
    await expect(
      TrophyCollectionService.payCompletedCollections(firstSteps)
    ).resolves.toBe(75);
    expect(await paidXp()).toBe(75);
  });

  it('never pays the same collection twice', async () => {
    await TrophyCollectionService.payCompletedCollections(firstSteps);
    await expect(
      TrophyCollectionService.payCompletedCollections(firstSteps)
    ).resolves.toBe(0);
    expect(await paidXp()).toBe(75);
  });

  it('does not double-pay overlapping checks', async () => {
    await Promise.all([
      TrophyCollectionService.payCompletedCollections(firstSteps),
      TrophyCollectionService.payCompletedCollections(firstSteps),
      TrophyCollectionService.payCompletedCollections(firstSteps),
    ]);
    expect(await paidXp()).toBe(75);
  });

  it('pays nothing for an unfinished collection', async () => {
    await expect(
      TrophyCollectionService.payCompletedCollections(firstSteps.slice(0, 2))
    ).resolves.toBe(0);
    expect(await paidXp()).toBe(0);
  });

  it('pays every collection finished at once', async () => {
    await TrophyCollectionService.payCompletedCollections([
      ...firstSteps,
      'goal-achiever',
    ]);
    expect(await paidXp()).toBe(75 + 100);
  });

  it('retries after a refused grant', async () => {
    jest.spyOn(GamificationService, 'addXP').mockResolvedValueOnce({
      success: false,
      xpGained: 0,
      totalXP: 0,
      previousLevel: 1,
      newLevel: 1,
      leveledUp: false,
      milestoneReached: false,
    });
    await TrophyCollectionService.payCompletedCollections(firstSteps);
    expect(await paidXp()).toBe(0);
    await TrophyCollectionService.payCompletedCollections(firstSteps);
    expect(await paidXp()).toBe(75);
  });

  it('never throws', async () => {
    jest
      .spyOn(GamificationService, 'addXP')
      .mockRejectedValueOnce(new Error('database is gone'));
    await expect(
      TrophyCollectionService.payCompletedCollections(firstSteps)
    ).resolves.toBe(0);
  });

  it('a full data reset allows the bonus again', async () => {
    await TrophyCollectionService.payCompletedCollections(firstSteps);
    await getDatabase().execAsync('DELETE FROM xp_transactions');
    await expect(
      TrophyCollectionService.payCompletedCollections(firstSteps)
    ).resolves.toBe(75);
  });
});

describe('wiring into the app', () => {
  it('every unlock path pays through updateUserAchievements', async () => {
    const empty = {
      unlockedAchievements: ['first-habit'],
      achievementProgress: {},
      lastChecked: '2026-10-31',
      totalXPFromAchievements: 0,
      rarityCount: {},
      categoryProgress: {},
      progressHistory: [],
      streakData: {},
    };
    jest
      .spyOn(AchievementStorage, 'getUserAchievements')
      .mockResolvedValue(empty as never);
    jest
      .spyOn(AchievementStorage, 'saveUserAchievements')
      .mockResolvedValue(undefined);
    const pay = jest
      .spyOn(TrophyCollectionService, 'payCompletedCollections')
      .mockResolvedValue(0);

    const unlocked = CORE_ACHIEVEMENTS.find(a => a.id === 'first-goal');
    await (
      AchievementService as unknown as {
        updateUserAchievements: (
          newlyUnlocked: unknown[],
          results: unknown[]
        ) => Promise<void>;
      }
    ).updateUserAchievements([unlocked], []);

    expect(pay).toHaveBeenCalledTimes(1);
    expect(pay.mock.calls[0]?.[0]).toEqual(['first-habit', 'first-goal']);
  });
});

describe('trophies that need a large goal', () => {
  it.each(['mega-dreamer', 'million-achiever'])(
    '%s can be reached through the goal form',
    id => {
      const trophy = CORE_ACHIEVEMENTS.find(a => a.id === id);
      expect(trophy).toBeDefined();
      // The 1 000 000 lives in the condition or in its evaluator.
      expect(MAX_GOAL_VALUE).toBeGreaterThanOrEqual(1_000_000);
      if (trophy!.condition.source === 'goal_target_value') {
        expect(MAX_GOAL_VALUE).toBeGreaterThanOrEqual(trophy!.condition.target);
      }
    }
  );

  it('onboarding and the forms share one limit', () => {
    expect(GOAL_TARGET_MAX).toBe(MAX_GOAL_VALUE);
  });
});
