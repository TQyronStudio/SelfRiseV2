// Goal recalculation replays entries in the order they were written
//
// WHY THIS EXISTS (data map E14–E16, 2026-11-24): getProgressByGoalId sorted by
// date only, and recalculateGoalValue replays the list oldest first — so two
// entries of the same day came back in any order. "+5, then set to 10" became
// 15 instead of 10 as soon as any entry was edited or deleted (which triggers
// the recalculation). Runs against the real in-memory SQLite.

import { SQLiteGoalStorage } from '../SQLiteGoalStorage';
import { GoalCategory } from '../../../types/goal';
import { getDatabase } from '../../database/init';
import { today } from '../../../utils/date';

jest.mock('../../gamificationService', () => ({
  GamificationService: {
    addXP: jest.fn(async () => ({ success: true })),
    subtractXP: jest.fn(async () => ({ success: true })),
  },
}));

const storage = new SQLiteGoalStorage();

async function createGoal(targetValue: number): Promise<string> {
  const goal = await storage.create({
    title: `Goal ${Math.random().toString(36).slice(2)}`,
    unit: 'km',
    targetValue,
    category: GoalCategory.HEALTH,
    targetDate: undefined,
  } as any);
  return goal.id;
}

const add = (goalId: string, value: number, progressType: 'add' | 'subtract' | 'set') =>
  storage.addProgress({ goalId, value, progressType, date: today(), note: '' } as any);

beforeEach(async () => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM goal_progress');
  await db.runAsync('DELETE FROM goal_milestones');
  await db.runAsync('DELETE FROM goals');
});

describe('recalculation keeps the order of one day', () => {
  test('"+5, then =10" stays 10 after another entry is deleted', async () => {
    const id = await createGoal(100);
    await add(id, 5, 'add');
    await add(id, 10, 'set');
    const extra = await add(id, 1, 'add'); // 11
    await storage.deleteProgress(extra.id); // triggers the recalculation
    const goal = await storage.getById(id);
    expect(goal?.currentValue).toBe(10);
  });

  test('"=10, then +5" stays 15', async () => {
    const id = await createGoal(100);
    await add(id, 10, 'set');
    await add(id, 5, 'add');
    const extra = await add(id, 1, 'add');
    await storage.deleteProgress(extra.id);
    const goal = await storage.getById(id);
    expect(goal?.currentValue).toBe(15);
  });

  test('the history lists a day newest first', async () => {
    const id = await createGoal(100);
    const first = await add(id, 1, 'add');
    const second = await add(id, 2, 'add');
    const list = await storage.getProgressByGoalId(id);
    expect(list.map(p => p.id)).toEqual([second.id, first.id]);
  });
});
