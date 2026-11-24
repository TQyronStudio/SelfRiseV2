/**
 * XP for completing a goal: one rule, read by the storage that pays it and the
 * window that shows it. The window showed 250 for a big goal (target ≥ 10 000)
 * while the storage paid 350 — fixed 2026-11-23.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  BIG_GOAL_TARGET,
  goalCompletionXP,
  XP_REWARDS,
} from '../gamification';

const ROOT = path.resolve(__dirname, '../../..');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

describe('goalCompletionXP()', () => {
  it('pays the big reward from 10 000 up', () => {
    expect(BIG_GOAL_TARGET).toBe(10000);
    expect(goalCompletionXP(9999)).toBe(XP_REWARDS.GOALS.GOAL_COMPLETION);
    expect(goalCompletionXP(10000)).toBe(XP_REWARDS.GOALS.BIG_GOAL_COMPLETION);
    expect(goalCompletionXP(250000)).toBe(XP_REWARDS.GOALS.BIG_GOAL_COMPLETION);
  });

  it('is what the storage pays and what the completion window shows', () => {
    const storage = read('src/services/storage/SQLiteGoalStorage.ts');
    const window = read('src/components/goals/GoalCompletionModal.tsx');
    expect(storage).toContain('goalCompletionXP(goal.targetValue)');
    expect(window).toContain('goalCompletionXP(goal.targetValue)');
    // Nobody keeps an own copy of the threshold or shows the small reward fixed.
    expect(storage).not.toMatch(/targetValue >= 10000/);
    expect(window).not.toContain('GOALS.GOAL_COMPLETION');
  });
});
