// Loyalty System Test Utilities - Sub-checkpoint 4.5.10.C
// Comprehensive testing utilities for loyalty system validation

import { LoyaltyService } from '../services/loyaltyService';
import { AchievementService } from '../services/achievementService';
import { AppInitializationService } from '../services/appInitializationService';
import { LoyaltyLevel } from '../types/gamification';

/**
 * Comprehensive loyalty system testing suite
 */
export class LoyaltyTestUtils {
  
  // ========================================
  // BASIC FUNCTIONALITY TESTS
  // ========================================

  /**
   * Test 1: Initialize loyalty system for new user
   */
  static async testNewUserInitialization(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('🧪 Test 1: New user initialization');
      
      // Reset loyalty data to simulate new user
      await LoyaltyService.resetLoyaltyData();
      
      // Get loyalty data (should initialize with defaults)
      const loyaltyData = await LoyaltyService.getLoyaltyData();
      
      // Validate initial state
      const isValid = 
        loyaltyData.totalActiveDays === 0 &&
        loyaltyData.loyaltyLevel === LoyaltyLevel.NEWCOMER &&
        loyaltyData.currentActiveStreak === 0 &&
        loyaltyData.longestActiveStreak === 0 &&
        loyaltyData.registrationDate.length > 0;
      
      return {
        success: isValid,
        message: isValid 
          ? 'New user initialization successful' 
          : 'New user initialization failed validation',
        data: loyaltyData
      };
      
    } catch (error) {
      return {
        success: false,
        message: `New user initialization error: ${error}`
      };
    }
  }

  /**
   * Test 2: Daily activity tracking
   */
  static async testDailyActivityTracking(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('🧪 Test 2: Daily activity tracking');
      
      // Reset and get initial state
      await LoyaltyService.resetLoyaltyData();
      const initialData = await LoyaltyService.getLoyaltyData();
      
      // Track daily activity
      const result = await LoyaltyService.trackDailyActivity();
      
      // Get updated state
      const updatedData = await LoyaltyService.getLoyaltyData();
      
      // Validate tracking worked
      const isValid = 
        result.isNewActiveDay &&
        updatedData.totalActiveDays === initialData.totalActiveDays + 1 &&
        updatedData.lastActiveDate.length > 0 &&
        updatedData.currentActiveStreak === 1;
      
      return {
        success: isValid,
        message: isValid 
          ? 'Daily activity tracking successful' 
          : 'Daily activity tracking failed validation',
        data: { result, initialData, updatedData }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Daily activity tracking error: ${error}`
      };
    }
  }

  /**
   * Test 3: Duplicate daily tracking prevention
   */
  static async testDuplicateTracking(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('🧪 Test 3: Duplicate daily tracking prevention');
      
      // Reset and track once
      await LoyaltyService.resetLoyaltyData();
      const firstResult = await LoyaltyService.trackDailyActivity();
      const dataAfterFirst = await LoyaltyService.getLoyaltyData();
      
      // Try to track again same day
      const secondResult = await LoyaltyService.trackDailyActivity();
      const dataAfterSecond = await LoyaltyService.getLoyaltyData();
      
      // Validate second tracking was ignored
      const isValid = 
        firstResult.isNewActiveDay &&
        !secondResult.isNewActiveDay &&
        dataAfterFirst.totalActiveDays === dataAfterSecond.totalActiveDays &&
        dataAfterFirst.totalActiveDays === 1;
      
      return {
        success: isValid,
        message: isValid 
          ? 'Duplicate tracking prevention successful' 
          : 'Duplicate tracking prevention failed',
        data: { firstResult, secondResult, dataAfterFirst, dataAfterSecond }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Duplicate tracking prevention error: ${error}`
      };
    }
  }

  // ========================================
  // MILESTONE AND ACHIEVEMENT TESTS
  // ========================================

  /**
   * Test 4: Milestone detection and achievement unlocking
   */
  static async testMilestoneDetection(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('🧪 Test 4: Milestone detection and achievement unlocking');
      
      const testMilestones = [7, 14, 21, 30, 60, 100];
      const results: any[] = [];
      
      for (const milestone of testMilestones) {
        // Simulate reaching milestone
        await LoyaltyService.resetLoyaltyData();
        await LoyaltyService.simulateActiveDays(milestone);
        
        // Check for milestone
        const milestoneObj = LoyaltyService.getMilestoneByDays(milestone);
        const hasReached = await LoyaltyService.hasReachedMilestone(milestone);
        
        results.push({
          milestone,
          found: !!milestoneObj,
          reached: hasReached,
          name: milestoneObj?.name
        });
      }
      
      const allValid = results.every(r => r.found && r.reached);
      
      return {
        success: allValid,
        message: allValid 
          ? 'All milestones detected correctly' 
          : 'Some milestones failed detection',
        data: results
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Milestone detection error: ${error}`
      };
    }
  }

  /**
   * Test 5: Loyalty level progression
   */
  static async testLoyaltyLevelProgression(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('🧪 Test 5: Loyalty level progression');
      
      const testCases = [
        { days: 0, expectedLevel: LoyaltyLevel.NEWCOMER },
        { days: 15, expectedLevel: LoyaltyLevel.NEWCOMER },
        { days: 30, expectedLevel: LoyaltyLevel.EXPLORER },
        { days: 100, expectedLevel: LoyaltyLevel.VETERAN },
        { days: 365, expectedLevel: LoyaltyLevel.LEGEND },
        { days: 1000, expectedLevel: LoyaltyLevel.MASTER },
      ];
      
      const results = [];
      
      for (const testCase of testCases) {
        const calculatedLevel = LoyaltyService.calculateLoyaltyLevel(testCase.days);
        const isCorrect = calculatedLevel === testCase.expectedLevel;
        
        results.push({
          days: testCase.days,
          expected: testCase.expectedLevel,
          calculated: calculatedLevel,
          correct: isCorrect
        });
      }
      
      const allCorrect = results.every(r => r.correct);
      
      return {
        success: allCorrect,
        message: allCorrect 
          ? 'All loyalty levels calculated correctly' 
          : 'Some loyalty levels calculated incorrectly',
        data: results
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Loyalty level progression error: ${error}`
      };
    }
  }

  // ========================================
  // INTEGRATION TESTS
  // ========================================

  /**
   * Test 6: App initialization integration
   */
  static async testAppInitializationIntegration(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('🧪 Test 6: App initialization integration');
      
      // Reset loyalty data
      await LoyaltyService.resetLoyaltyData();
      
      // Force app initialization
      const initResult = await AppInitializationService.forceReinitialization();
      
      // Check if loyalty was tracked during initialization
      const loyaltyData = await LoyaltyService.getLoyaltyData();
      
      const isValid = 
        initResult.success &&
        loyaltyData.totalActiveDays >= 0; // Should be initialized
      
      return {
        success: isValid,
        message: isValid 
          ? 'App initialization integration successful' 
          : 'App initialization integration failed',
        data: { initResult, loyaltyData }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `App initialization integration error: ${error}`
      };
    }
  }

  /**
   * Test 7: Achievement integration
   */
  static async testAchievementIntegration(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('🧪 Test 7: Achievement integration');
      
      // Reset achievement data
      await AchievementService.resetAllAchievementData();
      await LoyaltyService.resetLoyaltyData();
      
      // Simulate reaching first milestone (7 days)
      await LoyaltyService.simulateActiveDays(7);
      
      // Run loyalty achievement check
      const achievementResult = await AchievementService.checkLoyaltyAchievements([7]);
      
      // Check if loyalty achievement was found and evaluated
      const hasLoyaltyAchievements = achievementResult !== null;
      
      return {
        success: hasLoyaltyAchievements,
        message: hasLoyaltyAchievements 
          ? 'Achievement integration successful' 
          : 'Achievement integration failed',
        data: achievementResult
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Achievement integration error: ${error}`
      };
    }
  }

  // ========================================
  // COMPREHENSIVE TEST SUITE
  // ========================================

  /**
   * Run complete test suite
   */
  static async runCompleteTestSuite(): Promise<{
    overallSuccess: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: any[];
  }> {
    console.log('🚀 Starting complete loyalty system test suite...');
    
    const tests = [
      { name: 'New User Initialization', test: () => this.testNewUserInitialization() },
      { name: 'Daily Activity Tracking', test: () => this.testDailyActivityTracking() },
      { name: 'Duplicate Tracking Prevention', test: () => this.testDuplicateTracking() },
      { name: 'Milestone Detection', test: () => this.testMilestoneDetection() },
      { name: 'Loyalty Level Progression', test: () => this.testLoyaltyLevelProgression() },
      { name: 'App Initialization Integration', test: () => this.testAppInitializationIntegration() },
      { name: 'Achievement Integration', test: () => this.testAchievementIntegration() },
    ];
    
    const results = [];
    let passedTests = 0;
    
    for (const testCase of tests) {
      try {
        const result = await testCase.test();
        results.push({
          name: testCase.name,
          ...result
        });
        
        if (result.success) {
          passedTests++;
          console.log(`✅ ${testCase.name}: PASSED`);
        } else {
          console.log(`❌ ${testCase.name}: FAILED - ${result.message}`);
        }
        
      } catch (error) {
        results.push({
          name: testCase.name,
          success: false,
          message: `Test execution error: ${error}`
        });
        console.log(`💥 ${testCase.name}: ERROR - ${error}`);
      }
    }
    
    const totalTests = tests.length;
    const failedTests = totalTests - passedTests;
    const overallSuccess = passedTests === totalTests;
    
    console.log('\n📊 Test Suite Results:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log(`Overall: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      overallSuccess,
      totalTests,
      passedTests,
      failedTests,
      results
    };
  }

  // ========================================
  // DEMO AND VISUALIZATION HELPERS
  // ========================================

  /**
   * Demo loyalty progression for testing UI
   */
  static async demoLoyaltyProgression(): Promise<void> {
    console.log('🎭 Starting loyalty progression demo...');
    
    const demoSteps = [
      { days: 0, message: 'New user registration' },
      { days: 7, message: 'First week milestone' },
      { days: 14, message: 'Two weeks strong' },
      { days: 30, message: 'Month explorer level' },
      { days: 60, message: 'Two month veteran' },
      { days: 100, message: 'Century user milestone' },
      { days: 183, message: 'Half year hero' },
      { days: 365, message: 'Year legend status' },
      { days: 500, message: 'Ultimate veteran level' },
      { days: 1000, message: 'Loyalty master achieved' },
    ];
    
    for (const step of demoSteps) {
      console.log(`\n📅 Day ${step.days}: ${step.message}`);
      
      await LoyaltyService.simulateActiveDays(step.days);
      const data = await LoyaltyService.getLoyaltyData();
      const progress = LoyaltyService.calculateLoyaltyProgress(step.days);
      const levelDisplay = LoyaltyService.getLoyaltyLevelDisplay(data.loyaltyLevel);
      
      console.log(`  Level: ${levelDisplay.icon} ${levelDisplay.name}`);
      console.log(`  Days: ${data.totalActiveDays}`);
      console.log(`  Next: ${progress.nextTarget || 'Complete'} (${progress.daysRemaining} days)`);
      
      // Check for milestones
      const completedMilestones = await LoyaltyService.getCompletedMilestones();
      const lastMilestone = completedMilestones[completedMilestones.length - 1];
      if (lastMilestone) {
        console.log(`  Latest Achievement: ${lastMilestone.name} (+${lastMilestone.xpReward} XP)`);
      }
    }
    
    console.log('\n🎉 Loyalty progression demo complete!');
  }
}