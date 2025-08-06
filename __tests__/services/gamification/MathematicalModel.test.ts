import { GamificationService } from '../../../src/services/gamificationService';
import { getCurrentLevel, getXPRequiredForLevel, isLevelMilestone } from '../../../src/services/levelCalculation';
import { XPSourceType } from '../../../src/types/gamification';

describe('Mathematical Model Validation Tests', () => {
  beforeEach(async () => {
    await GamificationService.clearAllData();
  });

  describe('Level Progression Formula Validation', () => {
    test('Level progression should follow mathematical model', async () => {
      console.log('=== Testing level progression formula ===');
      
      // Test level progression at key points
      const testPoints = [
        { xp: 0, expectedLevel: 0 },
        { xp: 100, expectedLevel: 1 },
        { xp: 300, expectedLevel: 2 },
        { xp: 600, expectedLevel: 3 },
        { xp: 1000, expectedLevel: 4 },
        { xp: 1500, expectedLevel: 5 },
        { xp: 2100, expectedLevel: 6 },
        { xp: 2800, expectedLevel: 7 },
        { xp: 3600, expectedLevel: 8 },
        { xp: 4500, expectedLevel: 9 },
        { xp: 5500, expectedLevel: 10 }
      ];

      for (const { xp, expectedLevel } of testPoints) {
        const actualLevel = getCurrentLevel(xp);
        expect(actualLevel).toBe(expectedLevel);
        
        console.log(`✅ XP ${xp} → Level ${actualLevel} (expected ${expectedLevel})`);
      }
    });

    test('Level requirements should increase progressively', async () => {
      console.log('=== Testing progressive level requirements ===');
      
      const maxTestLevel = 20;
      let previousRequirement = 0;

      for (let level = 1; level <= maxTestLevel; level++) {
        const requirement = getXPRequiredForLevel(level);
        
        // Each level should require more XP than the previous
        expect(requirement).toBeGreaterThan(previousRequirement);
        
        // Verify the level calculation is consistent
        const calculatedLevel = getCurrentLevel(requirement - 1);
        expect(calculatedLevel).toBe(level - 1);
        
        const calculatedLevelAt = getCurrentLevel(requirement);
        expect(calculatedLevelAt).toBe(level);
        
        console.log(`Level ${level}: ${requirement} XP required (increase: +${requirement - previousRequirement})`);
        previousRequirement = requirement;
      }
    });

    test('Milestone levels should be correctly identified', async () => {
      console.log('=== Testing milestone level identification ===');
      
      // Test expected milestone levels
      const expectedMilestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
      const nonMilestones = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19];

      for (const level of expectedMilestones) {
        expect(isLevelMilestone(level)).toBe(true);
        console.log(`✅ Level ${level} is correctly identified as milestone`);
      }

      for (const level of nonMilestones) {
        expect(isLevelMilestone(level)).toBe(false);
        console.log(`✅ Level ${level} is correctly identified as non-milestone`);
      }
    });
  });

  describe('XP Accumulation Model Validation', () => {
    test('XP accumulation should be mathematically consistent', async () => {
      console.log('=== Testing XP accumulation consistency ===');
      
      // Test various accumulation patterns
      const patterns = [
        { name: 'Linear', amounts: Array(10).fill(50) },
        { name: 'Increasing', amounts: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
        { name: 'Decreasing', amounts: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10] },
        { name: 'Variable', amounts: [25, 75, 30, 80, 45, 65, 35, 85, 55, 40] }
      ];

      for (const pattern of patterns) {
        await GamificationService.clearAllData();
        
        let expectedTotal = 0;
        let previousLevel = 0;

        for (const amount of pattern.amounts) {
          const result = await GamificationService.addXP(amount, {
            source: XPSourceType.HABIT_COMPLETION,
            metadata: { skipBatching: true }
          });

          expectedTotal += amount;
          const actualTotal = await GamificationService.getTotalXP();
          
          expect(result.success).toBe(true);
          expect(actualTotal).toBe(expectedTotal);
          
          // Verify level progression is mathematically correct
          const expectedLevel = getCurrentLevel(expectedTotal);
          expect(result.newLevel).toBe(expectedLevel);
          
          // Check for level ups
          if (expectedLevel > previousLevel) {
            expect(result.leveledUp).toBe(true);
            console.log(`🎉 Level up: ${previousLevel} → ${expectedLevel} at ${expectedTotal} XP`);
          }
          
          previousLevel = expectedLevel;
        }
        
        console.log(`✅ ${pattern.name} pattern: ${expectedTotal} XP, Level ${previousLevel}`);
      }
    });

    test('Extended usage simulation should maintain accuracy', async () => {
      console.log('=== Testing extended usage simulation ===');
      
      // Simulate extended app usage over time
      const simulationDays = 100;
      const dailyActivities = [
        { source: XPSourceType.HABIT_COMPLETION, baseAmount: 25, variance: 10 },
        { source: XPSourceType.JOURNAL_ENTRY, baseAmount: 30, variance: 15 },
        { source: XPSourceType.GOAL_PROGRESS, baseAmount: 20, variance: 8 }
      ];

      let totalExpectedXP = 0;
      let levelUps = 0;
      let milestones = 0;

      for (let day = 1; day <= simulationDays; day++) {
        let dailyXP = 0;

        // Simulate daily activities with variation
        for (const activity of dailyActivities) {
          // Add randomness to simulate real usage (but deterministic for testing)
          const variance = (day % 7) * 2 - 6; // -6 to +6 based on day of week
          const amount = Math.max(1, activity.baseAmount + variance);
          
          const result = await GamificationService.addXP(amount, {
            source: activity.source,
            metadata: { skipBatching: true }
          });

          totalExpectedXP += amount;
          dailyXP += amount;
          
          if (result.leveledUp) {
            levelUps++;
            if (result.milestoneReached) {
              milestones++;
            }
          }
        }

        // Verify totals every 10 days
        if (day % 10 === 0) {
          const actualTotal = await GamificationService.getTotalXP();
          expect(actualTotal).toBe(totalExpectedXP);
          
          const currentLevel = getCurrentLevel(actualTotal);
          console.log(`Day ${day}: ${actualTotal} XP, Level ${currentLevel}, Daily: ${dailyXP} XP`);
        }
      }

      const finalXP = await GamificationService.getTotalXP();
      const finalLevel = getCurrentLevel(finalXP);
      
      expect(finalXP).toBe(totalExpectedXP);
      
      console.log(`✅ Extended simulation completed:`);
      console.log(`   Total XP: ${finalXP}`);
      console.log(`   Final Level: ${finalLevel}`);
      console.log(`   Level Ups: ${levelUps}`);
      console.log(`   Milestones: ${milestones}`);
    });
  });

  describe('Mathematical Edge Cases', () => {
    test('Should handle level boundary conditions accurately', async () => {
      console.log('=== Testing level boundary conditions ===');
      
      // Test XP values right at level boundaries
      for (let level = 1; level <= 10; level++) {
        await GamificationService.clearAllData();
        
        const requiredXP = getXPRequiredForLevel(level);
        
        // Add XP to just below the level threshold
        const belowThreshold = requiredXP - 1;
        await GamificationService.addXP(belowThreshold, {
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true }
        });
        
        let currentLevel = getCurrentLevel(await GamificationService.getTotalXP());
        expect(currentLevel).toBe(level - 1);
        
        // Add 1 more XP to cross the threshold
        const result = await GamificationService.addXP(1, {
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true }
        });
        
        expect(result.leveledUp).toBe(true);
        expect(result.newLevel).toBe(level);
        
        currentLevel = getCurrentLevel(await GamificationService.getTotalXP());
        expect(currentLevel).toBe(level);
        
        console.log(`✅ Level ${level} boundary: ${belowThreshold} → ${requiredXP} XP`);
      }
    });

    test('Should handle very large XP values mathematically', async () => {
      console.log('=== Testing large XP mathematical accuracy ===');
      
      const largeValues = [10000, 50000, 100000, 500000, 1000000];
      
      for (const xp of largeValues) {
        const level = getCurrentLevel(xp);
        const requiredForLevel = getXPRequiredForLevel(level);
        const requiredForNext = getXPRequiredForLevel(level + 1);
        
        // Verify the level calculation is mathematically correct
        expect(xp).toBeGreaterThanOrEqual(requiredForLevel);
        expect(xp).toBeLessThan(requiredForNext);
        
        console.log(`XP ${xp} → Level ${level} (range: ${requiredForLevel}-${requiredForNext - 1})`);
      }
      
      // Test actual XP addition with large values
      await GamificationService.clearAllData();
      
      const largeAmount = 100000;
      const result = await GamificationService.addXP(largeAmount, {
        source: XPSourceType.GOAL_COMPLETION,
        metadata: { skipBatching: true }
      });
      
      expect(result.success).toBe(true);
      expect(result.xpGained).toBe(largeAmount);
      
      const totalXP = await GamificationService.getTotalXP();
      const level = getCurrentLevel(totalXP);
      
      console.log(`✅ Large XP handling: ${totalXP} XP → Level ${level}`);
    });

    test('Should handle fractional XP in mathematical model', async () => {
      console.log('=== Testing fractional XP mathematical accuracy ===');
      
      const fractionalValues = [10.5, 25.25, 50.75, 100.33, 250.66];
      let cumulativeXP = 0;

      for (const amount of fractionalValues) {
        const result = await GamificationService.addXP(amount, {
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true }
        });
        
        cumulativeXP += amount;
        const actualXP = await GamificationService.getTotalXP();
        
        expect(result.success).toBe(true);
        expect(actualXP).toBe(cumulativeXP);
        
        // Verify level calculation works with fractional XP
        const level = getCurrentLevel(actualXP);
        expect(level).toBeGreaterThanOrEqual(0);
        
        console.log(`Fractional XP: +${amount} → ${actualXP} total (Level ${level})`);
      }
      
      console.log(`✅ Fractional XP handled accurately: ${cumulativeXP} total`);
    });
  });

  describe('Statistical Accuracy Tests', () => {
    test('Should maintain statistical accuracy over many operations', async () => {
      console.log('=== Testing statistical accuracy ===');
      
      const operationCount = 500;
      const baseAmount = 10;
      let totalExpected = 0;
      let levelUpCount = 0;

      console.time('Statistical accuracy test');

      for (let i = 0; i < operationCount; i++) {
        // Vary amount slightly for statistical distribution
        const amount = baseAmount + (i % 5);
        
        const result = await GamificationService.addXP(amount, {
          source: XPSourceType.HABIT_COMPLETION,
          metadata: { skipBatching: true },
          sourceId: `stat_test_${i}`
        });
        
        totalExpected += amount;
        
        if (result.leveledUp) {
          levelUpCount++;
        }
        
        // Verify accuracy every 50 operations
        if ((i + 1) % 50 === 0) {
          const currentTotal = await GamificationService.getTotalXP();
          expect(currentTotal).toBe(totalExpected);
        }
      }

      console.timeEnd('Statistical accuracy test');

      const finalTotal = await GamificationService.getTotalXP();
      const finalLevel = getCurrentLevel(finalTotal);
      const transactions = await GamificationService.getAllTransactions();

      expect(finalTotal).toBe(totalExpected);
      expect(transactions.length).toBe(operationCount);

      // Calculate average XP per transaction
      const averageXP = finalTotal / operationCount;
      const expectedAverage = totalExpected / operationCount;
      
      expect(averageXP).toBe(expectedAverage);

      console.log(`✅ Statistical accuracy maintained:`);
      console.log(`   Operations: ${operationCount}`);
      console.log(`   Total XP: ${finalTotal}`);
      console.log(`   Final Level: ${finalLevel}`);
      console.log(`   Level Ups: ${levelUpCount}`);
      console.log(`   Average XP/operation: ${averageXP}`);
    });
  });
});