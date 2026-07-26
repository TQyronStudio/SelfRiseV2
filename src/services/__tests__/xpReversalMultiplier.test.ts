/**
 * Regression tests: undoing an action must reverse the XP that was ACTUALLY
 * granted, not the base reward.
 *
 * THE BUG (device test 2026-07-26, found by Petr): `performXPAdditionInternal`
 * multiplies a grant by the active XP multiplier before storing it, but
 * `subtractXP` used to subtract the raw base reward its caller passed. With a 2×
 * Harmony Streak active, completing a habit granted +50 while un-completing it
 * took back only −25 — so tapping one checkbox on and off netted +25 per cycle.
 * Petr reached level 8 that way in a few seconds.
 *
 * Note on the fixture: `getActiveXPMultiplier()` hard-returns 1× under Jest
 * (gamificationService.ts:2351), so an active multiplier has to be spied in.
 */

import { GamificationService } from '../gamificationService';
import { XPSourceType } from '../../types/gamification';
import { today } from '../../utils/date';

const HABIT_ID = 'habit-multiplier-test';
const BASE_REWARD = 25; // XP_REWARDS.HABIT.SCHEDULED_COMPLETION

/** Pretend a 2× multiplier (Harmony Streak) is running. */
const activateDoubleXP = () =>
  jest
    .spyOn(GamificationService, 'getActiveXPMultiplier')
    .mockResolvedValue({ isActive: true, multiplier: 2 });

/** Pretend no multiplier is running (the app's normal state). */
const deactivateMultiplier = () =>
  jest
    .spyOn(GamificationService, 'getActiveXPMultiplier')
    .mockResolvedValue({ isActive: false, multiplier: 1 });

const completeHabit = () =>
  GamificationService.addXP(BASE_REWARD, {
    source: XPSourceType.HABIT_COMPLETION,
    sourceId: HABIT_ID,
    description: 'Completed scheduled habit',
  });

const uncompleteHabit = () =>
  GamificationService.subtractXP(BASE_REWARD, {
    source: XPSourceType.HABIT_COMPLETION,
    sourceId: HABIT_ID,
    description: 'Uncompleted scheduled habit',
    metadata: { date: today() },
  });

describe('XP reversal with an active multiplier', () => {
  beforeEach(async () => {
    await GamificationService.clearAllData();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('grants the multiplied amount (sanity check on the fixture)', async () => {
    activateDoubleXP();

    await completeHabit();

    expect(await GamificationService.getTotalXP()).toBe(BASE_REWARD * 2);
  });

  it('reverses the multiplied amount, not the base reward', async () => {
    activateDoubleXP();

    await completeHabit();
    await uncompleteHabit();

    expect(await GamificationService.getTotalXP()).toBe(0);
  });

  it('closes the checkbox farm: repeated toggling never accumulates XP', async () => {
    activateDoubleXP();

    for (let i = 0; i < 5; i++) {
      await completeHabit();
      await uncompleteHabit();
    }

    // Pre-fix this ended at 5 × (+50 − 25) = 125 XP out of thin air.
    expect(await GamificationService.getTotalXP()).toBe(0);
  });

  it('still reverses the full grant after the multiplier expires', async () => {
    activateDoubleXP();
    await completeHabit(); // +50

    // Multiplier runs out before the user un-checks the habit.
    deactivateMultiplier();
    await uncompleteHabit();

    // Recomputing from the CURRENT multiplier would have subtracted only 25 and
    // left 25 XP behind.
    expect(await GamificationService.getTotalXP()).toBe(0);
  });

  it('never takes more than was granted when a multiplier starts after the grant', async () => {
    deactivateMultiplier();
    await completeHabit(); // +25, no multiplier

    // Multiplier activates only afterwards.
    activateDoubleXP();
    await uncompleteHabit();

    // Recomputing from the CURRENT multiplier would have subtracted 50 and stolen
    // 25 XP the user never received.
    expect(await GamificationService.getTotalXP()).toBe(0);
  });

  it('behaves exactly as before when no multiplier is involved', async () => {
    deactivateMultiplier();

    await completeHabit();
    expect(await GamificationService.getTotalXP()).toBe(BASE_REWARD);

    await uncompleteHabit();
    expect(await GamificationService.getTotalXP()).toBe(0);
  });

  it('reverses each grant once when the same habit is toggled twice under 2x', async () => {
    activateDoubleXP();

    await completeHabit(); // +50
    await uncompleteHabit(); // -50
    await completeHabit(); // +50

    expect(await GamificationService.getTotalXP()).toBe(BASE_REWARD * 2);

    await uncompleteHabit(); // -50
    expect(await GamificationService.getTotalXP()).toBe(0);
  });

  it('falls back to the base reward when no matching grant exists', async () => {
    deactivateMultiplier();

    // Give the user some XP from an unrelated source, then reverse a habit that
    // was never granted here (e.g. XP predating this bookkeeping).
    await GamificationService.addXP(100, {
      source: XPSourceType.JOURNAL_ENTRY,
      sourceId: 'journal-1',
    });

    await uncompleteHabit();

    expect(await GamificationService.getTotalXP()).toBe(100 - BASE_REWARD);
  });

  // Goal call sites (SQLiteGoalStorage) do not pass metadata.date, so the
  // reversal defaults the day to today. Same-day undo must still be symmetric.
  it('works for goals, which pass no date in metadata', async () => {
    activateDoubleXP();

    await GamificationService.addXP(35, {
      source: XPSourceType.GOAL_PROGRESS,
      sourceId: 'goal-1',
    });
    expect(await GamificationService.getTotalXP()).toBe(70);

    await GamificationService.subtractXP(35, {
      source: XPSourceType.GOAL_PROGRESS,
      sourceId: 'goal-1',
    });

    expect(await GamificationService.getTotalXP()).toBe(0);
  });

  it('does not reverse a different day\'s grant', async () => {
    activateDoubleXP();
    await completeHabit(); // +50 today

    // Undo dated to a day with no grant → nothing matches → base reward is used.
    await GamificationService.subtractXP(BASE_REWARD, {
      source: XPSourceType.HABIT_COMPLETION,
      sourceId: HABIT_ID,
      metadata: { date: '2020-01-01' },
    });

    expect(await GamificationService.getTotalXP()).toBe(BASE_REWARD * 2 - BASE_REWARD);
  });
});
