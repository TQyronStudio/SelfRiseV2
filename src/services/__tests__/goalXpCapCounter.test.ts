/**
 * Goals' daily XP cap and exact refunds (review of E14, 2026-11-25).
 *
 * 1. The cap counts the goal's grants MINUS their reversals: "+1 → Undo" three
 *    times used to fill the 3 slots for the day, so the real log got nothing.
 *    A completion never takes a slot (only progress and milestones are capped).
 * 2. An exact refund (deleting a subtraction) is not multiplied again: under 2×
 *    "subtract → Undo" was +70 XP a cycle.
 */
import { GamificationService } from '../gamificationService';
import { XPSourceType } from '../../types/gamification';

const GOAL = 'goal-cap-test';
const counter = async (): Promise<number> => {
  const data = await (GamificationService as any).getDailyXPData();
  return data.goalTransactions[GOAL] ?? 0;
};
const grant = (source: XPSourceType, amount = 35) =>
  GamificationService.addXP(amount, { source, sourceId: GOAL, description: 'test' });

describe('goal daily cap counter', () => {
  beforeEach(async () => {
    await GamificationService.clearAllData();
    jest.restoreAllMocks();
  });

  it('an undone log gives its slot back', async () => {
    await grant(XPSourceType.GOAL_PROGRESS);
    await grant(XPSourceType.GOAL_PROGRESS);
    await grant(XPSourceType.GOAL_MILESTONE, 50);
    expect(await counter()).toBe(3);
    await GamificationService.subtractXP(35, {
      source: XPSourceType.GOAL_PROGRESS,
      sourceId: GOAL,
      description: 'undo',
      metadata: { exactAmount: true },
    });
    expect(await counter()).toBe(2);
  });

  it('a completion does not take one of the 3 slots', async () => {
    await grant(XPSourceType.GOAL_PROGRESS);
    await grant(XPSourceType.GOAL_COMPLETION, 250);
    expect(await counter()).toBe(1);
  });
});

describe('exact refund', () => {
  beforeEach(async () => {
    await GamificationService.clearAllData();
    jest.restoreAllMocks();
  });

  it('is not multiplied by an active multiplier', async () => {
    jest
      .spyOn(GamificationService, 'getActiveXPMultiplier')
      .mockResolvedValue({ isActive: true, multiplier: 2 });
    const refund = await GamificationService.addXP(70, {
      source: XPSourceType.GOAL_PROGRESS,
      sourceId: GOAL,
      description: 'refund',
      skipLimits: true,
      metadata: { exactAmount: true },
    });
    expect(refund.xpGained).toBe(70);
    const normal = await grant(XPSourceType.GOAL_PROGRESS);
    expect(normal.xpGained).toBe(70); // a normal grant still doubles
  });
});
