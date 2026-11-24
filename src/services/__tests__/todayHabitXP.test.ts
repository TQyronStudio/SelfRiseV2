/**
 * getTodayHabitXP(): the "+N XP" chip of the Habits screen's "Today" card (E5,
 * Petr 2026-11-23: option a) — XP from habits only, read from the daily record.
 */
import { GamificationService } from '../gamificationService';
import { XPSourceType } from '../../types/gamification';

const daily = (xpBySource: Partial<Record<XPSourceType, number>>) => ({
  date: '2026-11-23',
  totalXP: Object.values(xpBySource).reduce((a, b) => a + (b ?? 0), 0),
  xpBySource,
  transactionCount: 0,
  lastTransactionTime: 0,
});

const spyDaily = () =>
  jest.spyOn(GamificationService as unknown as { getDailyXPData: () => Promise<unknown> }, 'getDailyXPData');

afterEach(() => jest.restoreAllMocks());

describe('GamificationService.getTodayHabitXP()', () => {
  it('counts scheduled and bonus habit checks, nothing else', async () => {
    spyDaily().mockResolvedValue(
      daily({
        [XPSourceType.HABIT_COMPLETION]: 50,
        [XPSourceType.HABIT_BONUS]: 15,
        [XPSourceType.JOURNAL_ENTRY]: 20,
        [XPSourceType.GOAL_PROGRESS]: 35,
      })
    );
    await expect(GamificationService.getTodayHabitXP()).resolves.toBe(65);
  });

  it('never shows a negative number after XP was taken back', async () => {
    spyDaily().mockResolvedValue(daily({ [XPSourceType.HABIT_COMPLETION]: -25 }));
    await expect(GamificationService.getTodayHabitXP()).resolves.toBe(0);
  });

  it('shows 0 instead of failing', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    spyDaily().mockRejectedValue(new Error('db closed'));
    await expect(GamificationService.getTodayHabitXP()).resolves.toBe(0);
  });
});
