// Regression tests: SQLite write/read consistency for the gamification system.
//
// Guards against the "split-brain" class of bugs found in the 2026-06 audit:
//  - transactions were WRITTEN to SQLite but READ from legacy AsyncStorage
//    (achievements / activity baselines saw frozen or empty data),
//  - xp_daily_summary was never updated for habit/journal/goal XP because of a
//    case-sensitive source check ('habit_completion'.includes('HABIT') === false),
//  - rollbackLastTransaction edited AsyncStorage while getTotalXP read SQLite,
//  - clearAllData removed only AsyncStorage keys and left SQLite data intact.

import { GamificationService } from '../../../src/services/gamificationService';
import { getDatabase } from '../../../src/services/database/init';
import { XPSourceType } from '../../../src/types/gamification';
import { today } from '../../../src/utils/date';

describe('Gamification SQLite consistency (split-brain regression)', () => {
  beforeEach(async () => {
    await GamificationService.clearAllData();
  });

  describe('transaction write → read consistency', () => {
    it('addXP makes the transaction visible via getAllTransactions', async () => {
      const result = await GamificationService.addXP(25, {
        source: XPSourceType.HABIT_COMPLETION,
        sourceId: 'habit-1',
        description: 'Test habit completion',
      });
      expect(result.success).toBe(true);

      const transactions = await GamificationService.getAllTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        amount: 25,
        source: XPSourceType.HABIT_COMPLETION,
        sourceId: 'habit-1',
        date: today(),
      });
      expect(transactions[0]!.createdAt).toBeInstanceOf(Date);
    });

    it('addXP makes the transaction visible via getTransactionsByDateRange (today)', async () => {
      await GamificationService.addXP(20, {
        source: XPSourceType.JOURNAL_ENTRY,
        description: 'Test journal entry',
      });

      const todayStr = today();
      const transactions = await GamificationService.getTransactionsByDateRange(todayStr, todayStr);
      expect(transactions).toHaveLength(1);
      expect(transactions[0]!.source).toBe(XPSourceType.JOURNAL_ENTRY);
    });

    it('getTransactionsByDateRange excludes dates outside the range', async () => {
      await GamificationService.addXP(20, {
        source: XPSourceType.JOURNAL_ENTRY,
        description: 'Test journal entry',
      });

      const transactions = await GamificationService.getTransactionsByDateRange(
        '2000-01-01',
        '2000-01-02'
      );
      expect(transactions).toHaveLength(0);
    });

    it('getTotalXP reflects the same store as the transactions', async () => {
      await GamificationService.addXP(30, {
        source: XPSourceType.HABIT_COMPLETION,
        description: 'Test',
      });

      const total = await GamificationService.getTotalXP();
      const transactions = await GamificationService.getAllTransactions();
      const txSum = transactions.reduce((sum, t) => sum + t.amount, 0);
      expect(total).toBe(txSum);
      expect(total).toBe(30);
    });
  });

  describe('xp_daily_summary source columns (case-mismatch regression)', () => {
    it('habit XP updates habit_xp and total_xp', async () => {
      await GamificationService.addXP(25, {
        source: XPSourceType.HABIT_COMPLETION,
        description: 'Test',
      });

      const db = getDatabase();
      const summary = await db.getFirstAsync<{
        total_xp: number;
        habit_xp: number;
        transaction_count: number;
      }>('SELECT total_xp, habit_xp, transaction_count FROM xp_daily_summary WHERE date = ?', [
        today(),
      ]);

      expect(summary).not.toBeNull();
      expect(summary!.habit_xp).toBe(25);
      expect(summary!.total_xp).toBe(25);
      expect(summary!.transaction_count).toBe(1);
    });

    it('journal XP updates journal_xp; goal XP updates goal_xp', async () => {
      await GamificationService.addXP(20, {
        source: XPSourceType.JOURNAL_ENTRY,
        description: 'Test',
      });
      await GamificationService.addXP(35, {
        source: XPSourceType.GOAL_PROGRESS,
        sourceId: 'goal-1',
        description: 'Test',
      });

      const db = getDatabase();
      const summary = await db.getFirstAsync<{
        total_xp: number;
        journal_xp: number;
        goal_xp: number;
      }>('SELECT total_xp, journal_xp, goal_xp FROM xp_daily_summary WHERE date = ?', [today()]);

      expect(summary!.journal_xp).toBe(20);
      expect(summary!.goal_xp).toBe(35);
      expect(summary!.total_xp).toBe(55);
    });

    it('sources without a dedicated column still count toward total_xp', async () => {
      await GamificationService.addXP(50, {
        source: XPSourceType.MONTHLY_CHALLENGE,
        description: 'Test challenge reward',
        skipLimits: true,
      });

      const db = getDatabase();
      const summary = await db.getFirstAsync<{ total_xp: number }>(
        'SELECT total_xp FROM xp_daily_summary WHERE date = ?',
        [today()]
      );
      expect(summary!.total_xp).toBe(50);
    });

    it('daily XP limits actually engage (were disabled by the empty summary)', async () => {
      // NOTE: addXP skips validation entirely in the jest environment
      // (performXPAdditionInternal isTestEnvironment check), so we exercise
      // validateXPAddition directly — it reads the same xp_daily_summary that
      // the case-mismatch bug used to leave empty.
      //
      // Pump journal XP above JOURNAL_MAX_DAILY (415), then ask the validator.
      for (let i = 0; i < 21; i++) {
        const result = await GamificationService.addXP(20, {
          source: XPSourceType.JOURNAL_ENTRY,
          description: `Entry ${i}`,
        });
        expect(result.success).toBe(true);
      }

      const validation = await (GamificationService as any).validateXPAddition(
        20,
        XPSourceType.JOURNAL_ENTRY,
        { source: XPSourceType.JOURNAL_ENTRY }
      );

      // 21 × 20 = 420 XP already granted today (> 415 limit) → no more allowed.
      expect(validation.allowedAmount).toBe(0);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('rollbackLastTransaction (SQLite)', () => {
    it('removes the last transaction and reverses total XP + daily summary', async () => {
      await GamificationService.addXP(25, {
        source: XPSourceType.HABIT_COMPLETION,
        description: 'Keep me',
      });
      await GamificationService.addXP(40, {
        source: XPSourceType.GOAL_PROGRESS,
        sourceId: 'goal-1',
        description: 'Roll me back',
      });
      expect(await GamificationService.getTotalXP()).toBe(65);

      const rolledBack = await GamificationService.rollbackLastTransaction();
      expect(rolledBack).toBe(true);

      expect(await GamificationService.getTotalXP()).toBe(25);

      const transactions = await GamificationService.getAllTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0]!.description).toBe('Keep me');

      const db = getDatabase();
      const summary = await db.getFirstAsync<{
        total_xp: number;
        goal_xp: number;
        habit_xp: number;
      }>('SELECT total_xp, goal_xp, habit_xp FROM xp_daily_summary WHERE date = ?', [today()]);
      expect(summary!.goal_xp).toBe(0);
      expect(summary!.habit_xp).toBe(25);
      expect(summary!.total_xp).toBe(25);
    });

    it('returns false when there is nothing to roll back', async () => {
      const rolledBack = await GamificationService.rollbackLastTransaction();
      expect(rolledBack).toBe(false);
    });
  });

  describe('clearAllData (SQLite)', () => {
    it('resets transactions, daily summary and total XP', async () => {
      await GamificationService.addXP(100, {
        source: XPSourceType.HABIT_COMPLETION,
        description: 'Test',
      });
      expect(await GamificationService.getTotalXP()).toBe(100);

      await GamificationService.clearAllData();

      expect(await GamificationService.getTotalXP()).toBe(0);
      expect(await GamificationService.getAllTransactions()).toHaveLength(0);

      const db = getDatabase();
      const summaryRows = await db.getAllAsync('SELECT * FROM xp_daily_summary');
      expect(summaryRows).toHaveLength(0);
    });
  });
});
