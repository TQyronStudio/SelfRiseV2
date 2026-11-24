// Editing a goal's target re-decides "reached" — status and completion XP
//
// WHY THIS EXISTS (live bug, 2026-11-24): SQLiteGoalStorage.update only merged
// the edit. Raising the target above the progress left the goal COMPLETED with
// its XP paid; lowering it under the progress never completed it. Runs against
// the real in-memory SQLite.

import { SQLiteGoalStorage } from '../SQLiteGoalStorage';
import { GoalCategory, GoalStatus } from '../../../types/goal';
import { getDatabase } from '../../database/init';
import { today } from '../../../utils/date';
import { GamificationService } from '../../gamificationService';
import { goalCompletionXP } from '../../../constants/gamification';
import { XPSourceType } from '../../../types/gamification';

jest.mock('../../gamificationService', () => ({
  GamificationService: {
    addXP: jest.fn(async () => ({ success: true })),
    subtractXP: jest.fn(async () => ({ success: true })),
  },
}));

const addXP = GamificationService.addXP as jest.Mock;
const subtractXP = GamificationService.subtractXP as jest.Mock;
const storage = new SQLiteGoalStorage();

async function goalAt(targetValue: number, value: number): Promise<string> {
  const goal = await storage.create({
    title: `Goal ${Math.random().toString(36).slice(2)}`,
    unit: 'km',
    targetValue,
    category: GoalCategory.HEALTH,
    targetDate: undefined,
  } as any);
  await storage.addProgress({
    goalId: goal.id,
    value,
    progressType: 'set',
    date: today(),
    note: '',
  } as any);
  addXP.mockClear();
  subtractXP.mockClear();
  return goal.id;
}

const completionCalls = (mock: jest.Mock) =>
  mock.mock.calls.filter(([, o]) => o.source === XPSourceType.GOAL_COMPLETION);

beforeEach(async () => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM goal_progress');
  await db.runAsync('DELETE FROM goal_milestones');
  await db.runAsync('DELETE FROM goals');
});

describe('a new target re-decides completion', () => {
  test('raising the target above the progress reopens the goal and takes the XP back', async () => {
    const id = await goalAt(10, 10); // completed at 10/10
    expect((await storage.getById(id))?.status).toBe(GoalStatus.COMPLETED);

    await storage.update(id, { targetValue: 20 });

    const goal = await storage.getById(id);
    expect(goal?.status).toBe(GoalStatus.ACTIVE);
    expect(goal?.completedDate).toBeUndefined();
    expect(completionCalls(subtractXP)).toHaveLength(1);
    // Takes back what was paid — for the OLD target.
    expect(subtractXP.mock.calls[0][0]).toBe(goalCompletionXP(10));
    expect(addXP).not.toHaveBeenCalled();
  });

  test('lowering the target under the progress completes the goal and pays for the new target', async () => {
    const id = await goalAt(100, 60);
    expect((await storage.getById(id))?.status).toBe(GoalStatus.ACTIVE);

    const returned = await storage.update(id, { targetValue: 50 });

    const goal = await storage.getById(id);
    expect(returned.status).toBe(GoalStatus.COMPLETED);
    expect(goal?.status).toBe(GoalStatus.COMPLETED);
    expect(goal?.completedDate).toBeDefined();
    expect(completionCalls(addXP)).toHaveLength(1);
    expect(addXP.mock.calls[0][0]).toBe(goalCompletionXP(50));
    expect(subtractXP).not.toHaveBeenCalled();
  });

  test('a target change that keeps the state pays nothing', async () => {
    const id = await goalAt(100, 30);
    await storage.update(id, { targetValue: 80 });
    expect((await storage.getById(id))?.status).toBe(GoalStatus.ACTIVE);
    expect(addXP).not.toHaveBeenCalled();
    expect(subtractXP).not.toHaveBeenCalled();
  });

  test('a renamed goal keeps its state', async () => {
    const id = await goalAt(10, 10);
    await storage.update(id, { title: 'New name', targetValue: 10 });
    expect((await storage.getById(id))?.status).toBe(GoalStatus.COMPLETED);
    expect(subtractXP).not.toHaveBeenCalled();
  });
});
