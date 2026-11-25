// Goal Progress XP — Milestones / Completion Reversal / Local Dates
//
// WHY THIS EXISTS (super audit Fáze 5, July 2026):
//  - N-5.1: milestone XP (25/50/75 % → 50/75/100) was DEAD in the live SQLite
//    path — only the legacy AsyncStorage goalStorage awarded it, so users
//    silently lost 225 XP per goal. The awarded set now persists in the
//    goal_milestones table (oscillating around a threshold must not re-earn).
//  - N-5.2: subtracting progress below target left the goal COMPLETED and the
//    +250 completion XP was never reversed (the entry-deletion path reversed
//    it correctly — two paths, two behaviors).
//  - N-5.3: completedDate was stamped with the UTC date (yesterday between
//    local and UTC midnight for CET users).
//
// Runs against the real in-memory SQLite (global jest setup).

import { SQLiteGoalStorage } from '../SQLiteGoalStorage';
import { GamificationService } from '../../gamificationService';
import { GoalStatus, GoalCategory } from '../../../types/goal';
import { XPSourceType } from '../../../types/gamification';
import { getDatabase } from '../../database/init';
import { today } from '../../../utils/date';

jest.mock('../../gamificationService', () => ({
  GamificationService: {
    addXP: jest.fn(async () => ({ success: true })),
    subtractXP: jest.fn(async () => ({ success: true })),
  },
}));

const addXPMock = GamificationService.addXP as jest.Mock;
const subtractXPMock = GamificationService.subtractXP as jest.Mock;

const storage = new SQLiteGoalStorage();

function xpCalls(mock: jest.Mock, source: XPSourceType): Array<[number, any]> {
  return mock.mock.calls.filter(([, opts]) => opts.source === source);
}

async function createGoal(targetValue: number): Promise<string> {
  const goal = await storage.create({
    title: `Goal ${Math.random().toString(36).slice(2)}`,
    unit: 'kg',
    targetValue,
    category: GoalCategory.HEALTH,
    targetDate: undefined,
  } as any);
  return goal.id;
}

async function addProgress(goalId: string, value: number, progressType: 'add' | 'subtract' | 'set' = 'add') {
  return storage.addProgress({ goalId, value, progressType, date: today(), note: '' } as any);
}

beforeEach(async () => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM goal_progress');
  await db.runAsync('DELETE FROM goal_milestones');
  await db.runAsync('DELETE FROM goals');
  jest.clearAllMocks();
});

describe('Goal milestone XP (N-5.1)', () => {
  test('crossing 25 % awards exactly 50 XP with GOAL_MILESTONE source', async () => {
    const id = await createGoal(100);
    await addProgress(id, 30); // 0 → 30 %

    const milestoneCalls = xpCalls(addXPMock, XPSourceType.GOAL_MILESTONE);
    expect(milestoneCalls).toHaveLength(1);
    expect(milestoneCalls[0]![0]).toBe(50);
    expect(milestoneCalls[0]![1].sourceId).toBe(id);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Refused rewards must stay outstanding, not be marked as paid
  //
  // Device test 2026-07-26: milestone XP counts against
  // MAX_GOAL_TRANSACTIONS_PER_DAY (3 per goal per day, shared with progress
  // entries), so a small goal finished in one step — progress plus three
  // thresholds = four transactions — always lost its 75 % reward. The
  // goal_milestones row had already been written, so it was gone for good.
  //
  // These cases cannot be produced through addXP itself: validation is skipped
  // entirely under Jest (gamificationService.ts, `isTestEnvironment`), which is
  // precisely why this class of bug survived every audit phase. The refusal is
  // therefore injected at the mock.
  // ────────────────────────────────────────────────────────────────────────
  describe('refused milestone XP', () => {
    const milestoneRows = async (goalId: string): Promise<number[]> => {
      const rows = await getDatabase().getAllAsync<{ value: number }>(
        'SELECT value FROM goal_milestones WHERE goal_id = ? ORDER BY value ASC',
        [goalId]
      );
      return rows.map(r => r.value);
    };

    test('a refused milestone is NOT recorded as awarded', async () => {
      addXPMock.mockImplementation(async (_amount: number, opts: any) =>
        opts.source === XPSourceType.GOAL_MILESTONE
          ? { success: false, error: 'Goal has reached daily XP limit' }
          : { success: true }
      );

      const id = await createGoal(100);
      await addProgress(id, 30); // reaches 25 %

      expect(await milestoneRows(id)).toEqual([]); // nothing settled
    });

    test('an outstanding milestone is retried on the next progress entry', async () => {
      addXPMock.mockImplementation(async (_amount: number, opts: any) =>
        opts.source === XPSourceType.GOAL_MILESTONE
          ? { success: false, error: 'Goal has reached daily XP limit' }
          : { success: true }
      );

      const id = await createGoal(100);
      await addProgress(id, 30);
      expect(await milestoneRows(id)).toEqual([]);

      // Budget resets (next day / next entry) — XP is accepted now.
      addXPMock.mockImplementation(async () => ({ success: true, xpGained: 50 }));
      addXPMock.mockClear();
      await addProgress(id, 1); // 30 → 31 %, still only past the 25 % mark

      const retried = xpCalls(addXPMock, XPSourceType.GOAL_MILESTONE);
      expect(retried).toHaveLength(1);
      expect(retried[0]![0]).toBe(50);
      expect(await milestoneRows(id)).toEqual([25]);
    });

    test('only the refused threshold is retried; settled ones are left alone', async () => {
      // 25 % and 50 % are accepted, 75 % is refused (the 4th transaction).
      addXPMock.mockImplementation(async (amount: number, opts: any) =>
        opts.source === XPSourceType.GOAL_MILESTONE && amount === 100
          ? { success: false, error: 'Goal has reached daily XP limit' }
          : { success: true }
      );

      const id = await createGoal(100);
      await addProgress(id, 80); // crosses 25, 50, 75 at once
      expect(await milestoneRows(id)).toEqual([25, 50]); // 75 still outstanding

      addXPMock.mockImplementation(async () => ({ success: true }));
      addXPMock.mockClear();
      await addProgress(id, 1); // 80 → 81 %

      const retried = xpCalls(addXPMock, XPSourceType.GOAL_MILESTONE);
      expect(retried.map(c => c[0])).toEqual([100]); // only the 75 % reward
      expect(await milestoneRows(id)).toEqual([25, 50, 75]);
    });

    test('settled milestones are never re-awarded despite the "at or above" trigger', async () => {
      const id = await createGoal(100);
      await addProgress(id, 80); // 25, 50, 75 all settled
      addXPMock.mockClear();

      await addProgress(id, 5); // 80 → 85 %, still above every threshold

      expect(xpCalls(addXPMock, XPSourceType.GOAL_MILESTONE)).toHaveLength(0);
      expect(await milestoneRows(id)).toEqual([25, 50, 75]);
    });
  });

  test('one entry crossing several thresholds awards each of them (50+75+100)', async () => {
    const id = await createGoal(100);
    await addProgress(id, 80); // 0 → 80 % crosses 25, 50, 75

    const amounts = xpCalls(addXPMock, XPSourceType.GOAL_MILESTONE).map(c => c[0]);
    expect(amounts).toEqual([50, 75, 100]);
  });

  test('oscillating around a threshold does NOT re-earn the milestone', async () => {
    const id = await createGoal(100);
    await addProgress(id, 30);              // crosses 25 → +50 XP
    await addProgress(id, 20, 'subtract');  // back to 10 %
    await addProgress(id, 30);              // crosses 25 again

    const milestoneCalls = xpCalls(addXPMock, XPSourceType.GOAL_MILESTONE);
    expect(milestoneCalls).toHaveLength(1); // only the first crossing paid

    // The awarded set is persisted in goal_milestones
    const db = getDatabase();
    const row = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM goal_milestones WHERE id = ?', [`${id}_xp_25`]
    );
    expect(row).not.toBeNull();
  });

  test('subtract-direction crossings never award milestones', async () => {
    const id = await createGoal(100);
    await addProgress(id, 60);              // crosses 25+50
    addXPMock.mockClear();
    await addProgress(id, 40, 'subtract');  // 60 % → 20 %

    expect(xpCalls(addXPMock, XPSourceType.GOAL_MILESTONE)).toHaveLength(0);
  });
});

describe('Goal completion XP and reversal (N-5.2)', () => {
  test('reaching target awards 250 XP (standard goal)', async () => {
    const id = await createGoal(100);
    await addProgress(id, 100);

    const calls = xpCalls(addXPMock, XPSourceType.GOAL_COMPLETION);
    expect(calls).toHaveLength(1);
    expect(calls[0]![0]).toBe(250);

    const goal = (await storage.getById(id))!;
    expect(goal.status).toBe(GoalStatus.COMPLETED);
  });

  test('big goal (target ≥ 10 000) awards 350 XP', async () => {
    const id = await createGoal(10000);
    await addProgress(id, 10000);

    const calls = xpCalls(addXPMock, XPSourceType.GOAL_COMPLETION);
    expect(calls[0]![0]).toBe(350);
  });

  test('subtracting below target un-completes the goal and reverses the 250 XP [N-5.2]', async () => {
    const id = await createGoal(100);
    await addProgress(id, 100); // completed, +250

    await addProgress(id, 30, 'subtract'); // 70 % — must revert

    const goal = (await storage.getById(id))!;
    expect(goal.status).toBe(GoalStatus.ACTIVE);
    expect(goal.completedDate).toBeUndefined();

    const reversals = xpCalls(subtractXPMock, XPSourceType.GOAL_COMPLETION);
    expect(reversals).toHaveLength(1);
    expect(reversals[0]![0]).toBe(250);
  });

  test('re-completing after a reversal awards the 250 XP again (symmetric cycle)', async () => {
    const id = await createGoal(100);
    await addProgress(id, 100);            // +250
    await addProgress(id, 30, 'subtract'); // −250
    await addProgress(id, 30);             // +250 again

    expect(xpCalls(addXPMock, XPSourceType.GOAL_COMPLETION)).toHaveLength(2);
    expect(xpCalls(subtractXPMock, XPSourceType.GOAL_COMPLETION)).toHaveLength(1);
  });
});

describe('Goal dates are LOCAL calendar dates (N-5.3)', () => {
  test('completedDate equals the local today, not the UTC date', async () => {
    const id = await createGoal(100);
    await addProgress(id, 100);

    const goal = (await storage.getById(id))!;
    expect(goal.completedDate).toBe(today());
  });

  test('startDate equals the local today on creation', async () => {
    const id = await createGoal(100);
    const goal = (await storage.getById(id))!;
    expect(goal.startDate).toBe(today());
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Undo gives back exactly what the entry got (2026-11-25, replaces N-5.9)
//
// The accepted edge N-5.9 — deleting an entry logged over the daily cap took
// 35 XP that never came — became everyday with one-tap logging + Undo (4th tap
// of the day + Undo). Each entry now records its real XP (xp_awarded).
// ────────────────────────────────────────────────────────────────────────────
describe('deleting a progress entry reverses exactly its own XP', () => {
  const progressReversals = () =>
    xpCalls(subtractXPMock, XPSourceType.GOAL_PROGRESS);

  test('an entry that earned 35 gives back 35, exactly', async () => {
    addXPMock.mockImplementation(async () => ({ success: true, xpGained: 35 }));
    const id = await createGoal(1000);
    const entry = await addProgress(id, 1);
    subtractXPMock.mockClear();

    await storage.deleteProgress(entry.id);
    expect(progressReversals()).toHaveLength(1);
    expect(progressReversals()[0]![0]).toBe(35);
    expect(progressReversals()[0]![1].metadata).toEqual({ exactAmount: true });
  });

  test('an entry over the daily cap (no XP) takes nothing back', async () => {
    addXPMock.mockImplementation(async () => ({ success: false, error: 'Goal has reached daily XP limit' }));
    const id = await createGoal(1000);
    const entry = await addProgress(id, 1);
    subtractXPMock.mockClear();

    await storage.deleteProgress(entry.id);
    expect(progressReversals()).toHaveLength(0);
  });

  test('an entry under a 2× multiplier gives back its 70', async () => {
    addXPMock.mockImplementation(async () => ({ success: true, xpGained: 70 }));
    const id = await createGoal(1000);
    const entry = await addProgress(id, 1);
    subtractXPMock.mockClear();

    await storage.deleteProgress(entry.id);
    expect(progressReversals()[0]![0]).toBe(70);
  });

  test('a subtraction that took 35 is given back 35; "set" moves no XP', async () => {
    addXPMock.mockImplementation(async () => ({ success: true, xpGained: 35 }));
    subtractXPMock.mockImplementation(async () => ({ success: true, xpGained: -35 }));
    const id = await createGoal(1000);
    await addProgress(id, 10);
    const minus = await addProgress(id, 2, 'subtract');
    const set = await addProgress(id, 8, 'set');
    addXPMock.mockClear();
    subtractXPMock.mockClear();

    await storage.deleteProgress(minus.id);
    const giveBack = xpCalls(addXPMock, XPSourceType.GOAL_PROGRESS);
    expect(giveBack).toHaveLength(1);
    expect(giveBack[0]![0]).toBe(35);
    // exact: neither refused by the daily cap nor multiplied again
    expect(giveBack[0]![1].skipLimits).toBe(true);
    expect(giveBack[0]![1].metadata).toEqual({ exactAmount: true });

    addXPMock.mockClear();
    await storage.deleteProgress(set.id);
    expect(xpCalls(addXPMock, XPSourceType.GOAL_PROGRESS)).toHaveLength(0);
    expect(progressReversals()).toHaveLength(0);
  });

  test('an entry from before (amount unknown) keeps the old reversal', async () => {
    addXPMock.mockImplementation(async () => ({ success: true, xpGained: 35 }));
    const id = await createGoal(1000);
    const entry = await addProgress(id, 1);
    await getDatabase().runAsync('UPDATE goal_progress SET xp_awarded = NULL WHERE id = ?', [entry.id]);
    subtractXPMock.mockClear();

    await storage.deleteProgress(entry.id);
    expect(progressReversals()).toHaveLength(1);
    expect(progressReversals()[0]![0]).toBe(35);
    expect(progressReversals()[0]![1].metadata).toBeUndefined();
  });
});

// What a log reports back (E14c): the Goals note says only what really happened.
describe('addProgress reports its real XP and the milestones it paid', () => {
  test('a log that crosses 25 % and 50 % reports both, with its XP', async () => {
    addXPMock.mockImplementation(async (amount: number) => ({ success: true, xpGained: amount }));
    const id = await createGoal(100);
    const logged = await addProgress(id, 60);
    expect(logged.xpAwarded).toBe(35);
    expect(logged.milestonesPaid).toEqual([25, 50]);
    const stored = await storage.getProgressByGoalId(id);
    expect(stored[0]!.xpAwarded).toBe(35);
  });

  test('over the daily cap: 0 XP and no milestone (it stays outstanding)', async () => {
    addXPMock.mockImplementation(async () => ({ success: false, error: 'Goal has reached daily XP limit' }));
    const id = await createGoal(100);
    const logged = await addProgress(id, 60);
    expect(logged.xpAwarded).toBe(0);
    expect(logged.milestonesPaid).toEqual([]);
  });

  test('a milestone paid once is not reported again', async () => {
    addXPMock.mockImplementation(async (amount: number) => ({ success: true, xpGained: amount }));
    const id = await createGoal(100);
    await addProgress(id, 30);
    const second = await addProgress(id, 5);
    expect(second.milestonesPaid).toEqual([]);
  });
});
