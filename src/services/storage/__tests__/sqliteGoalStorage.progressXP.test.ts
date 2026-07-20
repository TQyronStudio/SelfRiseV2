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
