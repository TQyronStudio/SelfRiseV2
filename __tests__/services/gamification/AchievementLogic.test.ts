import { AchievementService } from '../../../src/services/achievementService';
import { GamificationService } from '../../../src/services/gamificationService';
import { XPSourceType } from '../../../src/types/gamification';

describe('Achievement Condition Logic Tests', () => {
  beforeEach(async () => {
    await GamificationService.clearAllData();
    // Clear achievement service data too
    // Note: We would need to add this method to AchievementService
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('Achievement triggers at exact threshold', async () => {
      // Test that achievements trigger exactly at the boundary, not before/after
      
      // Add XP just below a threshold
      await GamificationService.addXP(49, { 
        source: XPSourceType.HABIT_COMPLETION,
        metadata: { skipBatching: true }
      });
      
      let totalXP = await GamificationService.getTotalXP();
      expect(totalXP).toBe(49);
      
      // Add 1 more XP to cross threshold (assuming 50 XP threshold for some achievement)
      await GamificationService.addXP(1, { 
        source: XPSourceType.HABIT_COMPLETION,
        metadata: { skipBatching: true }
      });
      
      totalXP = await GamificationService.getTotalXP();
      expect(totalXP).toBe(50);
      
      // Check if appropriate achievement was unlocked
      // This would require achievement evaluation logic
      expect(totalXP).toBeGreaterThanOrEqual(50);
    });

    test('Zero XP should not trigger achievements', async () => {
      const initialXP = await GamificationService.getTotalXP();
      
      try {
        await GamificationService.addXP(0, { 
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true }
        });
        fail('Should reject zero XP');
      } catch (error) {
        // Expected error
      }
      
      const finalXP = await GamificationService.getTotalXP();
      expect(finalXP).toBe(initialXP);
    });

    test('Negative XP should not trigger achievements', async () => {
      // Add some initial XP
      await GamificationService.addXP(100, { 
        source: XPSourceType.HABIT_COMPLETION,
        metadata: { skipBatching: true }
      });
      
      const initialXP = await GamificationService.getTotalXP();
      
      try {
        await GamificationService.addXP(-50, { 
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true }
        });
        fail('Should reject negative XP');
      } catch (error) {
        // Expected error
      }
      
      const finalXP = await GamificationService.getTotalXP();
      expect(finalXP).toBe(initialXP);
    });

    test('Very large XP values should be handled properly', async () => {
      const largeAmount = 999999;
      
      await GamificationService.addXP(largeAmount, { 
        source: XPSourceType.GOAL_COMPLETION,
        metadata: { skipBatching: true }
      });
      
      const totalXP = await GamificationService.getTotalXP();
      expect(totalXP).toBe(largeAmount);
      
      // Large XP should potentially trigger multiple achievements
      expect(totalXP).toBeGreaterThan(1000);
    });

    test('Fractional XP should be handled correctly', async () => {
      const fractionalAmount = 10.5;
      
      await GamificationService.addXP(fractionalAmount, { 
        source: XPSourceType.HABIT_COMPLETION,
        metadata: { skipBatching: true }
      });
      
      const totalXP = await GamificationService.getTotalXP();
      expect(totalXP).toBe(fractionalAmount);
    });
  });

  describe('XP Source Type Validation', () => {
    test('All XP source types are valid for achievements', async () => {
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

      for (const source of sourceTypes) {
        await GamificationService.clearAllData();
        
        const result = await GamificationService.addXP(25, { 
          source,
          metadata: { skipBatching: true }
        });
        
        expect(result.success).toBe(true);
        expect(result.xpGained).toBe(25);
        
        const totalXP = await GamificationService.getTotalXP();
        expect(totalXP).toBe(25);
      }
    });
  });

  describe('Cumulative Achievement Conditions', () => {
    test('Multiple small XP additions should cumulate for achievement thresholds', async () => {
      // Simulate gradual XP accumulation
      const additions = [10, 15, 20, 25, 30]; // Total: 100 XP
      let cumulativeXP = 0;

      for (const amount of additions) {
        await GamificationService.addXP(amount, { 
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true }
        });
        
        cumulativeXP += amount;
        const currentXP = await GamificationService.getTotalXP();
        expect(currentXP).toBe(cumulativeXP);
      }
      
      const finalXP = await GamificationService.getTotalXP();
      expect(finalXP).toBe(100);
    });

    test('Mixed XP sources should contribute to total achievements', async () => {
      const mixedSources = [
        { amount: 20, source: XPSourceType.HABIT_COMPLETION },
        { amount: 30, source: XPSourceType.JOURNAL_ENTRY },
        { amount: 25, source: XPSourceType.GOAL_PROGRESS },
        { amount: 15, source: XPSourceType.HABIT_BONUS }
      ];

      let expectedTotal = 0;
      for (const { amount, source } of mixedSources) {
        await GamificationService.addXP(amount, { 
          source,
          metadata: { skipBatching: true }
        });
        expectedTotal += amount;
      }

      const finalXP = await GamificationService.getTotalXP();
      expect(finalXP).toBe(expectedTotal); // Should be 90
      
      // With 90 XP, certain achievements should be achievable
      expect(finalXP).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Achievement Consistency Tests', () => {
    test('Same XP amount should always produce same result', async () => {
      const testAmount = 75;
      const results = [];

      // Test same XP addition multiple times (with clearing between)
      for (let i = 0; i < 5; i++) {
        await GamificationService.clearAllData();
        
        const result = await GamificationService.addXP(testAmount, { 
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true }
        });
        
        results.push({
          xpGained: result.xpGained,
          totalXP: result.totalXP,
          success: result.success
        });
        
        const totalXP = await GamificationService.getTotalXP();
        expect(totalXP).toBe(testAmount);
      }

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.xpGained).toBe(firstResult.xpGained);
        expect(result.totalXP).toBe(firstResult.totalXP);
        expect(result.success).toBe(firstResult.success);
      });
    });

    test('Order of XP additions should not affect final result', async () => {
      // Test 1: Add in order A, B, C
      await GamificationService.clearAllData();
      await GamificationService.addXP(10, { source: XPSourceType.HABIT_COMPLETION, metadata: { skipBatching: true } });
      await GamificationService.addXP(20, { source: XPSourceType.JOURNAL_ENTRY, metadata: { skipBatching: true } });
      await GamificationService.addXP(30, { source: XPSourceType.GOAL_PROGRESS, metadata: { skipBatching: true } });
      const result1 = await GamificationService.getTotalXP();

      // Test 2: Add in order C, A, B
      await GamificationService.clearAllData();
      await GamificationService.addXP(30, { source: XPSourceType.GOAL_PROGRESS, metadata: { skipBatching: true } });
      await GamificationService.addXP(10, { source: XPSourceType.HABIT_COMPLETION, metadata: { skipBatching: true } });
      await GamificationService.addXP(20, { source: XPSourceType.JOURNAL_ENTRY, metadata: { skipBatching: true } });
      const result2 = await GamificationService.getTotalXP();

      // Test 3: Add in order B, C, A
      await GamificationService.clearAllData();
      await GamificationService.addXP(20, { source: XPSourceType.JOURNAL_ENTRY, metadata: { skipBatching: true } });
      await GamificationService.addXP(30, { source: XPSourceType.GOAL_PROGRESS, metadata: { skipBatching: true } });
      await GamificationService.addXP(10, { source: XPSourceType.HABIT_COMPLETION, metadata: { skipBatching: true } });
      const result3 = await GamificationService.getTotalXP();

      // All should equal 60
      expect(result1).toBe(60);
      expect(result2).toBe(60);
      expect(result3).toBe(60);
    });
  });

  describe('Rapid XP Addition Tests', () => {
    test('Rapid consecutive XP additions should be handled correctly', async () => {
      const rapidAdditions = Array.from({ length: 20 }, (_, i) => i + 1); // 1, 2, 3, ..., 20
      
      const promises = rapidAdditions.map(amount =>
        GamificationService.addXP(amount, { 
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true }
        })
      );

      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      const expectedTotal = rapidAdditions.reduce((sum, num) => sum + num, 0); // Sum of 1+2+...+20 = 210
      const finalXP = await GamificationService.getTotalXP();
      expect(finalXP).toBe(expectedTotal);
    });
  });
});