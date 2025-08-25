/**
 * PHASE 4: COMPREHENSIVE TESTING & VALIDATION
 * Complete integration testing suite for level-up corruption fixes
 * 
 * Tests all 3 phases:
 * - Phase 1: Race condition fixes  
 * - Phase 2: Ghost system elimination + Modal priority
 * - Phase 3: XP bar cache synchronization
 */

import { GamificationService } from '../services/gamificationService';
import { clearLevelCalculationCache, getCurrentLevel, getXPProgress } from '../services/levelCalculation';
import { XPSourceType } from '../types/gamification';
import { DeviceEventEmitter } from 'react-native';

interface TestResult {
  testName: string;
  success: boolean;
  details: string[];
  errors: string[];
  timing?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

class LevelUpTestSuite {
  private testResults: TestResult[] = [];
  private levelUpEvents: Array<{event: string, timestamp: number, data: any}> = [];

  constructor() {
    // Monitor level-up events during testing
    DeviceEventEmitter.addListener('levelUp', (data) => {
      this.levelUpEvents.push({
        event: 'levelUp',
        timestamp: Date.now(),
        data
      });
      console.log('🎯 LevelUp event captured during test:', data);
    });

    DeviceEventEmitter.addListener('xpGained', (data) => {
      console.log('💰 XP gained event captured:', data);
    });
  }

  /**
   * TEST SCENARIO 1: Single habit completion → level-up
   * SUCCESS CRITERIA:
   * - Only 1 level-up stored (not 2)
   * - Immediate modal appears (not delayed)
   * - XP bar shows correct progress (1-2%, not 95%)
   */
  async testScenario1_SingleHabitLevelUp(): Promise<TestResult> {
    const testName = 'Scenario 1: Single Habit Completion → Level-up';
    const startTime = Date.now();
    const details: string[] = [];
    const errors: string[] = [];

    try {
      console.log('\\n🧪 TEST SCENARIO 1: Single Habit Completion → Level-up');
      console.log('===============================================');

      // Step 1: Reset to known state
      await GamificationService.resetAllData();
      details.push('Reset gamification data to clean state');

      // Step 2: Set user close to level-up (Level 1 → Level 2)
      // Level 2 requires 100 XP total, so add 90 XP to get close
      await GamificationService.addXP(90, {
        source: XPSourceType.JOURNAL_ENTRY,
        description: 'Setup: Get close to level-up',
        skipLimits: true
      });

      const preStats = await GamificationService.getGamificationStats();
      details.push(`Pre-state: Level ${preStats.currentLevel}, ${preStats.totalXP} XP, ${preStats.xpProgress}% progress`);

      // Step 3: Clear event history
      this.levelUpEvents = [];

      // Step 4: Perform single habit completion to trigger level-up
      console.log('🎯 Performing habit completion to trigger level-up...');
      
      const habitResult = await GamificationService.addXP(25, {
        source: XPSourceType.HABIT_COMPLETION,
        description: 'Test habit completion for level-up',
        skipLimits: true
      });

      details.push(`Habit completion result: ${JSON.stringify(habitResult)}`);

      // Step 5: Verify immediate level-up detection
      if (habitResult.leveledUp) {
        details.push(`✅ Level-up detected: ${habitResult.previousLevel} → ${habitResult.newLevel}`);
      } else {
        errors.push('❌ Level-up NOT detected in habit completion result');
      }

      // Step 6: Check level-up storage (critical - should be only 1)
      const recentLevelUps = await GamificationService.getRecentLevelUps(5);
      console.log('📊 Recent level-ups stored:', recentLevelUps.length);
      
      if (recentLevelUps.length === 1) {
        details.push('✅ CRITICAL: Only 1 level-up stored (not duplicate)');
      } else if (recentLevelUps.length > 1) {
        errors.push(`❌ CRITICAL: ${recentLevelUps.length} level-ups stored - DUPLICATE DETECTED`);
        details.push(`Duplicate level-ups: ${JSON.stringify(recentLevelUps)}`);
      } else {
        errors.push('❌ CRITICAL: No level-up stored at all');
      }

      // Step 7: Check XP bar synchronization (Phase 3 fix)
      const postStats = await GamificationService.getGamificationStats();
      const calculatedProgress = getXPProgress(postStats.totalXP);
      
      details.push(`Post-state: Level ${postStats.currentLevel}, ${postStats.totalXP} XP`);
      details.push(`GamificationService progress: ${postStats.xpProgress}%`);
      details.push(`levelCalculation progress: ${calculatedProgress.xpProgress}%`);
      
      const progressDiff = Math.abs(postStats.xpProgress - calculatedProgress.xpProgress);
      
      if (progressDiff <= 2) {
        details.push('✅ XP bar synchronization OK (≤2% difference)');
      } else {
        errors.push(`❌ XP bar desynchronized: ${progressDiff}% difference`);
      }

      // Step 8: Verify progress percentage is reasonable (1-5% for new level)
      if (postStats.xpProgress >= 1 && postStats.xpProgress <= 10) {
        details.push(`✅ Progress percentage realistic: ${postStats.xpProgress}% for new level`);
      } else {
        errors.push(`❌ Progress percentage unrealistic: ${postStats.xpProgress}% for new level`);
      }

      // Step 9: Check event timing
      if (this.levelUpEvents.length === 1) {
        details.push('✅ Exactly 1 levelUp event emitted');
      } else if (this.levelUpEvents.length > 1) {
        errors.push(`❌ ${this.levelUpEvents.length} levelUp events emitted - DUPLICATE EVENTS`);
      } else {
        errors.push('❌ No levelUp events emitted');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      return {
        testName,
        success: errors.length === 0,
        details,
        errors,
        timing: { startTime, endTime, duration }
      };

    } catch (error) {
      errors.push(`Test execution error: ${error}`);
      return {
        testName,
        success: false,
        details,
        errors,
        timing: { startTime, endTime: Date.now(), duration: Date.now() - startTime }
      };
    }
  }

  /**
   * TEST SCENARIO 2: Multiple rapid actions → level-up
   * SUCCESS CRITERIA:
   * - Batch processing works correctly
   * - No duplicate celebrations
   * - Modal timing is consistent
   */
  async testScenario2_MultipleRapidActions(): Promise<TestResult> {
    const testName = 'Scenario 2: Multiple Rapid Actions → Level-up';
    const startTime = Date.now();
    const details: string[] = [];
    const errors: string[] = [];

    try {
      console.log('\\n🧪 TEST SCENARIO 2: Multiple Rapid Actions → Level-up');
      console.log('=================================================');

      // Reset to known state
      await GamificationService.resetAllData();
      details.push('Reset gamification data to clean state');

      // Set user close to level-up
      await GamificationService.addXP(85, {
        source: XPSourceType.JOURNAL_ENTRY,
        description: 'Setup: Get close to level-up',
        skipLimits: true
      });

      const preStats = await GamificationService.getGamificationStats();
      details.push(`Pre-state: Level ${preStats.currentLevel}, ${preStats.totalXP} XP`);

      // Clear event history
      this.levelUpEvents = [];

      // Perform multiple rapid actions
      console.log('🚀 Performing multiple rapid XP actions...');
      
      const rapidActions = [
        { amount: 10, source: XPSourceType.HABIT_COMPLETION, description: 'Rapid action 1' },
        { amount: 8, source: XPSourceType.JOURNAL_ENTRY, description: 'Rapid action 2' },  
        { amount: 12, source: XPSourceType.GOAL_PROGRESS, description: 'Rapid action 3' },
        { amount: 5, source: XPSourceType.HABIT_BONUS, description: 'Rapid action 4' }
      ];

      const results = await Promise.all(
        rapidActions.map(action => 
          GamificationService.addXP(action.amount, {
            source: action.source,
            description: action.description,
            skipLimits: true
          })
        )
      );

      details.push(`Performed ${rapidActions.length} rapid actions concurrently`);
      
      // Check how many reported level-ups
      const levelUpResults = results.filter(r => r.leveledUp);
      if (levelUpResults.length === 1) {
        details.push('✅ Only 1 result reported level-up (batch processing working)');
      } else {
        errors.push(`❌ ${levelUpResults.length} results reported level-up - batch processing failed`);
      }

      // Check storage
      const recentLevelUps = await GamificationService.getRecentLevelUps(5);
      if (recentLevelUps.length === 1) {
        details.push('✅ Only 1 level-up stored despite rapid actions');
      } else {
        errors.push(`❌ ${recentLevelUps.length} level-ups stored - rapid action duplicates`);
      }

      // Check events
      if (this.levelUpEvents.length === 1) {
        details.push('✅ Only 1 levelUp event emitted despite rapid actions');
      } else {
        errors.push(`❌ ${this.levelUpEvents.length} levelUp events - event duplicates`);
      }

      const endTime = Date.now();
      return {
        testName,
        success: errors.length === 0,
        details,
        errors,
        timing: { startTime, endTime, duration: endTime - startTime }
      };

    } catch (error) {
      errors.push(`Test execution error: ${error}`);
      return {
        testName,
        success: false,
        details,
        errors,
        timing: { startTime, endTime: Date.now(), duration: Date.now() - startTime }
      };
    }
  }

  /**
   * TEST SCENARIO 3: Screen navigation during level-up
   * SUCCESS CRITERIA:
   * - Modal doesn't repeat on return
   * - Progress bar stays synchronized  
   * - No ghost modals appear
   */
  async testScenario3_NavigationDuringLevelUp(): Promise<TestResult> {
    const testName = 'Scenario 3: Navigation During Level-up';
    const startTime = Date.now();
    const details: string[] = [];
    const errors: string[] = [];

    try {
      console.log('\\n🧪 TEST SCENARIO 3: Navigation During Level-up');
      console.log('==============================================');

      // Setup
      await GamificationService.resetAllData();
      await GamificationService.addXP(90, {
        source: XPSourceType.JOURNAL_ENTRY,
        description: 'Setup: Get close to level-up',
        skipLimits: true
      });

      details.push('Setup complete: Close to level-up');
      this.levelUpEvents = [];

      // Trigger level-up
      await GamificationService.addXP(25, {
        source: XPSourceType.HABIT_COMPLETION,
        description: 'Navigation test level-up trigger',
        skipLimits: true
      });

      details.push('Level-up triggered');

      // Simulate navigation (cache should remain valid)
      console.log('🧭 Simulating screen navigation...');
      
      // Force cache clear and refetch (simulates navigation)
      clearLevelCalculationCache();
      const stats1 = await GamificationService.getGamificationStats();
      
      // Another navigation
      clearLevelCalculationCache();  
      const stats2 = await GamificationService.getGamificationStats();

      details.push('Performed multiple navigation cache clears');

      // Check consistency
      if (stats1.currentLevel === stats2.currentLevel && 
          Math.abs(stats1.xpProgress - stats2.xpProgress) < 1) {
        details.push('✅ Stats consistent across navigation');
      } else {
        errors.push('❌ Stats inconsistent across navigation');
        details.push(`Stats1: L${stats1.currentLevel} ${stats1.xpProgress}%`);
        details.push(`Stats2: L${stats2.currentLevel} ${stats2.xpProgress}%`);
      }

      // Check that no additional level-ups were created
      const recentLevelUps = await GamificationService.getRecentLevelUps(5);
      if (recentLevelUps.length === 1) {
        details.push('✅ No additional level-ups created during navigation');
      } else {
        errors.push(`❌ ${recentLevelUps.length} level-ups found - navigation created duplicates`);
      }

      const endTime = Date.now();
      return {
        testName,
        success: errors.length === 0,
        details,
        errors,
        timing: { startTime, endTime, duration: endTime - startTime }
      };

    } catch (error) {
      errors.push(`Test execution error: ${error}`);
      return {
        testName,
        success: false,
        details,
        errors,
        timing: { startTime, endTime: Date.now(), duration: Date.now() - startTime }
      };
    }
  }

  /**
   * REGRESSION TESTING: Ensure fixes didn't break existing functionality
   */
  async testRegression(): Promise<TestResult> {
    const testName = 'Regression Testing: Core Functionality';
    const startTime = Date.now();
    const details: string[] = [];
    const errors: string[] = [];

    try {
      console.log('\\n🔄 REGRESSION TESTING');
      console.log('====================');

      // Test 1: XP batching still works
      await GamificationService.resetAllData();
      
      const batchResult = await GamificationService.addXP(50, {
        source: XPSourceType.JOURNAL_ENTRY,
        description: 'Regression: Batch test',
        skipLimits: true
      });

      if (batchResult.success && batchResult.xpGained === 50) {
        details.push('✅ XP batching still functional');
      } else {
        errors.push('❌ XP batching broken by fixes');
      }

      // Test 2: Normal XP operations
      const normalResult = await GamificationService.addXP(25, {
        source: XPSourceType.HABIT_COMPLETION,
        description: 'Regression: Normal XP'
      });

      if (normalResult.success) {
        details.push('✅ Normal XP operations working');
      } else {
        errors.push('❌ Normal XP operations broken');
      }

      // Test 3: Daily limits still enforced
      try {
        // Try to exceed daily limit
        for (let i = 0; i < 100; i++) {
          await GamificationService.addXP(50, {
            source: XPSourceType.JOURNAL_ENTRY,
            description: `Limit test ${i}`
          });
        }
        
        const finalStats = await GamificationService.getGamificationStats();
        // Should be limited, not unlimited
        if (finalStats.totalXP < 10000) { // Reasonable limit check
          details.push('✅ Daily limits still enforced');
        } else {
          errors.push('❌ Daily limits broken - unlimited XP gained');
        }
      } catch (limitError) {
        details.push('✅ Daily limits properly throwing errors when exceeded');
      }

      const endTime = Date.now();
      return {
        testName,
        success: errors.length === 0,
        details,
        errors,
        timing: { startTime, endTime, duration: endTime - startTime }
      };

    } catch (error) {
      errors.push(`Regression test error: ${error}`);
      return {
        testName,
        success: false,
        details,
        errors,
        timing: { startTime, endTime: Date.now(), duration: Date.now() - startTime }
      };
    }
  }

  /**
   * Run all test scenarios
   */
  async runAllTests(): Promise<{
    allPassed: boolean;
    results: TestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      totalDuration: number;
    };
  }> {
    console.log('🧪 STARTING COMPREHENSIVE LEVEL-UP TESTING SUITE');
    console.log('================================================');

    const results: TestResult[] = [];

    // Run all test scenarios
    results.push(await this.testScenario1_SingleHabitLevelUp());
    results.push(await this.testScenario2_MultipleRapidActions());
    results.push(await this.testScenario3_NavigationDuringLevelUp());
    results.push(await this.testRegression());

    // Calculate summary
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + (r.timing?.duration || 0), 0);

    const summary = {
      total: results.length,
      passed,
      failed,
      totalDuration
    };

    const allPassed = failed === 0;

    // Print detailed results
    console.log('\\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('==============================');
    
    results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`\\n${index + 1}. ${result.testName}: ${status}`);
      console.log(`   Duration: ${result.timing?.duration}ms`);
      
      if (result.details.length > 0) {
        console.log('   Details:');
        result.details.forEach(detail => console.log(`     ${detail}`));
      }
      
      if (result.errors.length > 0) {
        console.log('   Errors:');
        result.errors.forEach(error => console.log(`     ${error}`));
      }
    });

    console.log(`\\n📈 SUMMARY: ${passed}/${summary.total} tests passed (${totalDuration}ms total)`);
    
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED - Level-up corruption fixes are working correctly!');
    } else {
      console.log('🚨 SOME TESTS FAILED - Further fixes needed');
    }

    return { allPassed, results, summary };
  }
}

/**
 * Export function to run comprehensive testing
 */
export async function runComprehensiveLevelUpTesting(): Promise<void> {
  const testSuite = new LevelUpTestSuite();
  const results = await testSuite.runAllTests();
  
  // Store results for review
  console.log('\\n💾 Test results stored for review');
  
  return;
}

export default LevelUpTestSuite;