import { XPSourceType, XPTransaction, XPAdditionOptions } from '../../../src/types/gamification';
import { GamificationService } from '../../../src/services/gamificationService';

describe('XP Calculation Accuracy Tests', () => {
  beforeEach(async () => {
    // Reset service state before each test
    await GamificationService.clearAllData();
  });

  afterEach(async () => {
    // Clean up after each test
    await GamificationService.clearAllData();
  });

  describe('Individual XP Source Tests', () => {
    test('HABIT_COMPLETION: Standard XP values', async () => {
      const testCases = [
        { amount: 10, expected: 10 },
        { amount: 25, expected: 25 },
        { amount: 50, expected: 50 },
        { amount: 1, expected: 1 },
        { amount: 100, expected: 100 }
      ];

      for (const { amount, expected } of testCases) {
        const initialXP = await GamificationService.getTotalXP();
        const result = await GamificationService.addXP(amount, { source: XPSourceType.HABIT_COMPLETION });
        const finalXP = await GamificationService.getTotalXP();
        
        expect(result.xpGained).toBe(expected);
        expect(finalXP - initialXP).toBe(expected);
      }
    });

    test('HABIT_BONUS: Bonus XP calculations', async () => {
      const testCases = [
        { amount: 15, expected: 15 },
        { amount: 30, expected: 30 },
        { amount: 5, expected: 5 }
      ];

      for (const { amount, expected } of testCases) {
        const initialXP = await GamificationService.getTotalXP();
        const result = await GamificationService.addXP(amount, { source: XPSourceType.HABIT_BONUS });
        const finalXP = await GamificationService.getTotalXP();
        
        expect(result.xpGained).toBe(expected);
        expect(finalXP - initialXP).toBe(expected);
      }
    });

    test('JOURNAL_ENTRY: Journal XP values', async () => {
      const testCases = [
        { amount: 20, expected: 20 },
        { amount: 40, expected: 40 },
        { amount: 10, expected: 10 }
      ];

      for (const { amount, expected } of testCases) {
        const initialXP = await GamificationService.getTotalXP();
        const result = await GamificationService.addXP(amount, { source: XPSourceType.JOURNAL_ENTRY });
        const finalXP = await GamificationService.getTotalXP();
        
        expect(result.xpGained).toBe(expected);
        expect(finalXP - initialXP).toBe(expected);
      }
    });

    test('GOAL_COMPLETION: High-value XP', async () => {
      const testCases = [
        { amount: 100, expected: 100 },
        { amount: 250, expected: 250 },
        { amount: 500, expected: 500 }
      ];

      for (const { amount, expected } of testCases) {
        const initialXP = await GamificationService.getTotalXP();
        const result = await GamificationService.addXP(amount, { source: XPSourceType.GOAL_COMPLETION });
        const finalXP = await GamificationService.getTotalXP();
        
        expect(result.xpGained).toBe(expected);
        expect(finalXP - initialXP).toBe(expected);
      }
    });

    test('ACHIEVEMENT_UNLOCK: Achievement XP', async () => {
      const testCases = [
        { amount: 50, expected: 50 },
        { amount: 150, expected: 150 },
        { amount: 300, expected: 300 }
      ];

      for (const { amount, expected } of testCases) {
        const initialXP = await GamificationService.getTotalXP();
        const result = await GamificationService.addXP(amount, { source: XPSourceType.ACHIEVEMENT_UNLOCK });
        const finalXP = await GamificationService.getTotalXP();
        
        expect(result.xpGained).toBe(expected);
        expect(finalXP - initialXP).toBe(expected);
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('Zero XP addition', async () => {
      const initialXP = await GamificationService.getTotalXP();
      
      // Zero XP should be rejected based on service validation
      try {
        await GamificationService.addXP(0, { source: XPSourceType.HABIT_COMPLETION });
        fail('Should throw error for zero XP');
      } catch (error) {
        // Expected to throw error
        const finalXP = await GamificationService.getTotalXP();
        expect(finalXP).toBe(initialXP);
      }
    });

    test('Negative XP values should be rejected', async () => {
      const initialXP = await GamificationService.getTotalXP();
      
      try {
        await GamificationService.addXP(-25, { source: XPSourceType.HABIT_COMPLETION });
        fail('Should throw error for negative XP');
      } catch (error) {
        // Expected to throw error
        const finalXP = await GamificationService.getTotalXP();
        expect(finalXP).toBe(initialXP);
      }
    });

    test('Very large XP values', async () => {
      const largeAmount = 999999;
      const initialXP = await GamificationService.getTotalXP();
      const result = await GamificationService.addXP(largeAmount, { source: XPSourceType.GOAL_COMPLETION });
      const finalXP = await GamificationService.getTotalXP();
      
      expect(result.xpGained).toBe(largeAmount);
      expect(finalXP - initialXP).toBe(largeAmount);
    });

    test('Fractional XP values (should be handled)', async () => {
      const fractionalAmount = 10.5;
      const initialXP = await GamificationService.getTotalXP();
      const result = await GamificationService.addXP(fractionalAmount, { source: XPSourceType.HABIT_COMPLETION });
      const finalXP = await GamificationService.getTotalXP();
      
      // Should handle fractional values appropriately
      expect(result.xpGained).toBe(fractionalAmount);
      expect(finalXP - initialXP).toBe(fractionalAmount);
    });
  });

  describe('Cumulative XP Calculations', () => {
    test('Multiple XP additions accumulate correctly', async () => {
      const additions = [
        { amount: 10, source: XPSourceType.HABIT_COMPLETION },
        { amount: 20, source: XPSourceType.JOURNAL_ENTRY },
        { amount: 15, source: XPSourceType.HABIT_BONUS },
        { amount: 30, source: XPSourceType.GOAL_PROGRESS }
      ];

      let expectedTotal = 0;
      for (const { amount, source } of additions) {
        await GamificationService.addXP(amount, { source });
        expectedTotal += amount;
      }

      const finalXP = await GamificationService.getTotalXP();
      expect(finalXP).toBe(expectedTotal);
    });
  });

  describe('XP Source Type Validation', () => {
    test('All XP source types work correctly', async () => {
      const sourceTypes = [
        XPSourceType.HABIT_COMPLETION,
        XPSourceType.HABIT_BONUS,
        XPSourceType.HABIT_STREAK_MILESTONE,
        XPSourceType.JOURNAL_ENTRY,
        XPSourceType.JOURNAL_BONUS,
        XPSourceType.JOURNAL_STREAK_MILESTONE,
        XPSourceType.GOAL_PROGRESS,
        XPSourceType.GOAL_COMPLETION,
        XPSourceType.ACHIEVEMENT_UNLOCK
      ];

      let expectedTotal = 0;
      for (let i = 0; i < sourceTypes.length; i++) {
        const amount = (i + 1) * 10;
        await GamificationService.addXP(amount, { source: sourceTypes[i] });
        expectedTotal += amount;
      }

      const finalXP = await GamificationService.getTotalXP();
      expect(finalXP).toBe(expectedTotal);

      // Verify each source type was recorded
      const transactions = await GamificationService.getAllTransactions();
      const uniqueSources = new Set(transactions.map(tx => tx.source));
      expect(uniqueSources.size).toBeGreaterThanOrEqual(sourceTypes.length);
    });
  });

  describe('Transaction Storage Verification', () => {
    test('Verify all transactions are stored correctly', async () => {
      const testTransactions = [
        { amount: 25, source: XPSourceType.HABIT_COMPLETION },
        { amount: 40, source: XPSourceType.JOURNAL_ENTRY },
        { amount: 15, source: XPSourceType.HABIT_BONUS }
      ];

      for (const { amount, source } of testTransactions) {
        await GamificationService.addXP(amount, { source });
      }

      const allTransactions = await GamificationService.getAllTransactions();
      expect(allTransactions.length).toBeGreaterThanOrEqual(testTransactions.length);
      
      // Verify XP amounts match
      const totalFromTransactions = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const totalXP = await GamificationService.getTotalXP();
      expect(totalFromTransactions).toBe(totalXP);
    });
  });
});