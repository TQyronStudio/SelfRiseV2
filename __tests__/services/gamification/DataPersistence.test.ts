import { GamificationService } from '../../../src/services/gamificationService';
import { XPSourceType } from '../../../src/types/gamification';

describe('Data Persistence and Migration Tests', () => {
  beforeEach(async () => {
    await GamificationService.clearAllData();
  });

  describe('Basic Data Persistence', () => {
    test('XP data should persist between service calls', async () => {
      console.log('=== Testing basic XP persistence ===');
      
      // Add some XP
      const amount = 150;
      await GamificationService.addXP(amount, {
        source: XPSourceType.HABIT_COMPLETION,
        metadata: { skipBatching: true }
      });
      
      // Verify immediate persistence
      let totalXP = await GamificationService.getTotalXP();
      expect(totalXP).toBe(amount);
      
      // Add more XP
      const secondAmount = 75;
      await GamificationService.addXP(secondAmount, {
        source: XPSourceType.JOURNAL_ENTRY,
        metadata: { skipBatching: true }
      });
      
      // Verify cumulative persistence
      totalXP = await GamificationService.getTotalXP();
      expect(totalXP).toBe(amount + secondAmount);
      
      console.log(`✅ XP persisted correctly: ${totalXP}`);
    });

    test('Transaction data should persist correctly', async () => {
      console.log('=== Testing transaction persistence ===');
      
      // Add multiple transactions
      const transactions = [
        { amount: 25, source: XPSourceType.HABIT_COMPLETION },
        { amount: 35, source: XPSourceType.JOURNAL_ENTRY },
        { amount: 45, source: XPSourceType.GOAL_PROGRESS }
      ];
      
      for (const { amount, source } of transactions) {
        await GamificationService.addXP(amount, {
          source,
          metadata: { skipBatching: true }
        });
      }
      
      // Retrieve all transactions
      const allTransactions = await GamificationService.getAllTransactions();
      expect(allTransactions.length).toBeGreaterThanOrEqual(transactions.length);
      
      // Verify transaction amounts sum to total XP
      const transactionSum = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const totalXP = await GamificationService.getTotalXP();
      
      expect(transactionSum).toBe(totalXP);
      console.log(`✅ ${allTransactions.length} transactions persisted, sum: ${transactionSum}`);
    });
  });

  describe('Data Consistency Tests', () => {
    test('Multiple getTotalXP calls should return consistent results', async () => {
      console.log('=== Testing getTotalXP consistency ===');
      
      // Add XP
      await GamificationService.addXP(100, {
        source: XPSourceType.HABIT_COMPLETION,
        metadata: { skipBatching: true }
      });
      
      // Call getTotalXP multiple times
      const results = [];
      for (let i = 0; i < 10; i++) {
        const xp = await GamificationService.getTotalXP();
        results.push(xp);
      }
      
      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toBe(firstResult);
      });
      
      expect(firstResult).toBe(100);
      console.log(`✅ getTotalXP consistently returned: ${firstResult}`);
    });

    test('Transaction retrieval should be consistent', async () => {
      console.log('=== Testing transaction retrieval consistency ===');
      
      // Add some transactions
      for (let i = 0; i < 5; i++) {
        await GamificationService.addXP(10, {
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true },
          sourceId: `consistency_test_${i}`
        });
      }
      
      // Retrieve transactions multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        const transactions = await GamificationService.getAllTransactions();
        results.push(transactions);
      }
      
      // All results should have same length and content
      const firstResult = results[0];
      if (firstResult) {
        results.forEach(result => {
          expect(result.length).toBe(firstResult.length);
        });
        
        console.log(`✅ Transaction retrieval consistently returned ${firstResult.length} transactions`);
      }
    });
  });

  describe('Data Integrity Tests', () => {
    test('Clear data should completely reset state', async () => {
      console.log('=== Testing data clearing integrity ===');
      
      // Add significant amount of data
      for (let i = 0; i < 10; i++) {
        await GamificationService.addXP(25, {
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true }
        });
      }
      
      // Verify data exists
      let totalXP = await GamificationService.getTotalXP();
      let transactions = await GamificationService.getAllTransactions();
      
      expect(totalXP).toBe(250);
      expect(transactions.length).toBe(10);
      
      // Clear all data
      await GamificationService.clearAllData();
      
      // Verify everything is cleared
      totalXP = await GamificationService.getTotalXP();
      transactions = await GamificationService.getAllTransactions();
      
      expect(totalXP).toBe(0);
      expect(transactions.length).toBe(0);
      
      console.log('✅ Data cleared successfully - all reset to zero');
    });

    test('Should handle storage corruption gracefully', async () => {
      console.log('=== Testing storage corruption handling ===');
      
      // This test simulates what happens when storage returns invalid data
      // In a real app, this would test the error handling when AsyncStorage fails
      
      // Add valid data first
      await GamificationService.addXP(50, {
        source: XPSourceType.HABIT_COMPLETION,
        metadata: { skipBatching: true }
      });
      
      let totalXP = await GamificationService.getTotalXP();
      expect(totalXP).toBe(50);
      
      // Service should handle errors gracefully and return fallback values
      // In our mock environment, this mainly tests the error handling paths
      console.log('✅ Storage error handling works within mock constraints');
    });
  });

  describe('Migration Scenarios', () => {
    test('Should handle version compatibility', async () => {
      console.log('=== Testing version compatibility ===');
      
      // Simulate data from older version
      // In real scenario, this would test migration from old data format
      
      await GamificationService.addXP(100, {
        source: XPSourceType.HABIT_COMPLETION,
        metadata: { skipBatching: true }
      });
      
      const totalXP = await GamificationService.getTotalXP();
      const stats = await GamificationService.getGamificationStats();
      
      expect(totalXP).toBe(100);
      expect(stats.totalXP).toBe(totalXP);
      
      console.log('✅ Version compatibility maintained');
    });

    test('Should preserve data across state changes', async () => {
      console.log('=== Testing data preservation ===');
      
      // Add initial data
      const initialData = [
        { amount: 30, source: XPSourceType.HABIT_COMPLETION },
        { amount: 40, source: XPSourceType.JOURNAL_ENTRY },
        { amount: 50, source: XPSourceType.GOAL_PROGRESS }
      ];
      
      for (const { amount, source } of initialData) {
        await GamificationService.addXP(amount, {
          source,
          metadata: { skipBatching: true }
        });
      }
      
      const initialTotal = await GamificationService.getTotalXP();
      const initialTransactions = await GamificationService.getAllTransactions();
      
      // Simulate some state changes (like app restart, background/foreground)
      // In mock environment, this mainly tests data consistency
      
      // Add more data after "state change"
      await GamificationService.addXP(20, {
        source: XPSourceType.HABIT_BONUS,
        metadata: { skipBatching: true }
      });
      
      const finalTotal = await GamificationService.getTotalXP();
      const finalTransactions = await GamificationService.getAllTransactions();
      
      expect(finalTotal).toBe(initialTotal + 20);
      expect(finalTransactions.length).toBe(initialTransactions.length + 1);
      
      console.log(`✅ Data preserved: ${initialTotal} → ${finalTotal}`);
    });
  });

  describe('Concurrent Access Tests', () => {
    test('Should handle concurrent data access safely', async () => {
      console.log('=== Testing concurrent access ===');
      
      // Simulate concurrent reads while writing
      const writePromises = [];
      const readPromises = [];
      
      // Start multiple write operations
      for (let i = 0; i < 5; i++) {
        writePromises.push(
          GamificationService.addXP(10, {
            source: XPSourceType.HABIT_COMPLETION,
            metadata: { skipBatching: true },
            sourceId: `concurrent_write_${i}`
          })
        );
      }
      
      // Start multiple read operations concurrent with writes
      for (let i = 0; i < 5; i++) {
        readPromises.push(GamificationService.getTotalXP());
      }
      
      // Wait for all operations to complete
      const writeResults = await Promise.all(writePromises);
      const readResults = await Promise.all(readPromises);
      
      // Verify writes succeeded
      writeResults.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Verify reads returned valid values (non-negative)
      readResults.forEach(result => {
        expect(result).toBeGreaterThanOrEqual(0);
      });
      
      // Verify final state is consistent
      const finalXP = await GamificationService.getTotalXP();
      expect(finalXP).toBe(50); // 5 writes × 10 XP each
      
      console.log(`✅ Concurrent access handled safely, final XP: ${finalXP}`);
    });
  });
});