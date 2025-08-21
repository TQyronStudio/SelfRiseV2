/**
 * Test utility for Inactive User Re-engagement System
 * 
 * This test utility allows manual testing of the inactive user boost system
 * by simulating different scenarios and verifying correct behavior.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { XPMultiplierService } from '../services/xpMultiplierService';
import { GamificationService } from '../services/gamificationService';
import { XPSourceType } from '../types/gamification';
import { formatDateToString, subtractDays } from '../utils/date';

/**
 * Test scenarios for inactive user boost system
 */
export class InactiveUserBoostTester {

  /**
   * Test 1: Simulate user being inactive for 4+ days
   */
  static async testInactiveUserDetection(): Promise<void> {
    console.log('🧪 Testing inactive user detection...');
    
    try {
      // Simulate last activity 5 days ago
      const fiveDaysAgoDate = new Date();
      fiveDaysAgoDate.setDate(fiveDaysAgoDate.getDate() - 5);
      const fiveDaysAgo = formatDateToString(fiveDaysAgoDate);
      await AsyncStorage.setItem('gamification_last_activity', fiveDaysAgo);
      
      // Check inactive status
      const status = await XPMultiplierService.checkInactiveUserStatus();
      
      console.log('📊 Inactive user status:', {
        isInactive: status.isInactive,
        daysSinceLastActivity: status.daysSinceLastActivity,
        shouldActivateBoost: status.shouldActivateBoost,
        lastActivityDate: status.lastActivityDate,
      });
      
      // Verify results
      if (status.isInactive && status.daysSinceLastActivity >= 4) {
        console.log('✅ Inactive user detection PASSED');
      } else {
        console.log('❌ Inactive user detection FAILED');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  /**
   * Test 2: Test boost activation for inactive user
   */
  static async testBoostActivation(): Promise<void> {
    console.log('🧪 Testing boost activation...');
    
    try {
      // Ensure no current multiplier
      await AsyncStorage.removeItem('xp_multiplier_active');
      
      // Simulate last activity 5 days ago
      const fiveDaysAgoDate = new Date();
      fiveDaysAgoDate.setDate(fiveDaysAgoDate.getDate() - 5);
      const fiveDaysAgo = formatDateToString(fiveDaysAgoDate);
      await AsyncStorage.setItem('gamification_last_activity', fiveDaysAgo);
      
      // Try to activate boost
      const result = await XPMultiplierService.activateInactiveUserBoost();
      
      console.log('🚀 Boost activation result:', {
        success: result.success,
        multiplier: result.multiplier?.multiplier,
        description: result.multiplier?.description,
        timeRemaining: result.multiplier?.timeRemaining,
        xpBonusAwarded: result.xpBonusAwarded,
      });
      
      // Verify results
      if (result.success && result.multiplier?.multiplier === 2) {
        console.log('✅ Boost activation PASSED');
        
        // Test active multiplier info
        const activeInfo = await XPMultiplierService.getActiveMultiplier();
        console.log('📋 Active multiplier info:', activeInfo);
        
      } else {
        console.log('❌ Boost activation FAILED');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  /**
   * Test 3: Test XP doubling during boost period
   */
  static async testXPDoubling(): Promise<void> {
    console.log('🧪 Testing XP doubling during boost...');
    
    try {
      // Ensure boost is active (from previous test)
      const activeMultiplier = await XPMultiplierService.getActiveMultiplier();
      
      if (!activeMultiplier.isActive) {
        console.log('⚠️ No active multiplier, running boost activation first...');
        await this.testBoostActivation();
      }
      
      // Get initial XP
      const initialStats = await GamificationService.getGamificationStats();
      const initialXP = initialStats.totalXP;
      
      console.log('📈 Initial XP:', initialXP);
      
      // Add some XP (should be doubled)
      const testXP = 50;
      const result = await GamificationService.addXP(testXP, {
        source: XPSourceType.JOURNAL_ENTRY,
        description: 'Test XP during boost period'
      });
      
      console.log('🎯 XP addition result:', {
        xpGained: result.xpGained,
        expectedDoubled: testXP * 2,
        actuallyDoubled: result.xpGained === testXP * 2,
      });
      
      // Verify XP was doubled
      if (result.xpGained === testXP * 2) {
        console.log('✅ XP doubling PASSED');
      } else {
        console.log('❌ XP doubling FAILED');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  /**
   * Test 4: Test countdown timer display
   */
  static async testCountdownTimer(): Promise<void> {
    console.log('🧪 Testing countdown timer...');
    
    try {
      const activeMultiplier = await XPMultiplierService.getActiveMultiplier();
      
      if (activeMultiplier.isActive) {
        console.log('⏰ Active multiplier countdown:', {
          timeRemaining: activeMultiplier.timeRemaining,
          timeRemainingHours: activeMultiplier.timeRemaining ? 
            (activeMultiplier.timeRemaining / (1000 * 60 * 60)).toFixed(2) : 0,
          expiresAt: activeMultiplier.expiresAt,
          description: activeMultiplier.description,
        });
        
        console.log('✅ Countdown timer data AVAILABLE');
        
        // Note: UI testing would require component testing framework
        console.log('📝 Note: UI countdown timer should display this data in Home screen header');
        
      } else {
        console.log('❌ No active multiplier for countdown test');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  /**
   * Test 5: Test system reset (cleanup)
   */
  static async testSystemReset(): Promise<void> {
    console.log('🧪 Testing system reset...');
    
    try {
      // Remove test data
      await AsyncStorage.multiRemove([
        'xp_multiplier_active',
        'gamification_last_activity'
      ]);
      
      // Reset last activity to today
      await AsyncStorage.setItem('gamification_last_activity', formatDateToString(new Date()));
      
      // Verify reset
      const status = await XPMultiplierService.checkInactiveUserStatus();
      const activeMultiplier = await XPMultiplierService.getActiveMultiplier();
      
      console.log('🔄 Reset verification:', {
        isInactive: status.isInactive,
        daysSinceLastActivity: status.daysSinceLastActivity,
        hasActiveMultiplier: activeMultiplier.isActive,
      });
      
      if (!status.isInactive && !activeMultiplier.isActive) {
        console.log('✅ System reset PASSED');
      } else {
        console.log('❌ System reset FAILED');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  /**
   * Run all tests in sequence
   */
  static async runAllTests(): Promise<void> {
    console.log('🚀 Starting complete inactive user boost system tests...');
    console.log('='.repeat(60));
    
    await this.testInactiveUserDetection();
    console.log('-'.repeat(40));
    
    await this.testBoostActivation();
    console.log('-'.repeat(40));
    
    await this.testXPDoubling();
    console.log('-'.repeat(40));
    
    await this.testCountdownTimer();
    console.log('-'.repeat(40));
    
    await this.testSystemReset();
    console.log('=' .repeat(60));
    console.log('🏁 All tests completed!');
  }
}

/**
 * Quick test runner function for console testing
 */
export const runInactiveUserBoostTests = () => {
  InactiveUserBoostTester.runAllTests();
};