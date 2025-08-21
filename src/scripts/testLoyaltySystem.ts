// Loyalty System Test Runner - Sub-checkpoint 4.5.10.C
// Simple script to test loyalty system functionality during development

import { LoyaltyTestUtils } from '../utils/loyaltyTestUtils';

/**
 * Main test runner function
 * Can be called from development tools or debug menu
 */
export const runLoyaltySystemTests = async (): Promise<void> => {
  console.log('🔬 Starting Loyalty System Tests...\n');
  
  try {
    // Run complete test suite
    const suiteResults = await LoyaltyTestUtils.runCompleteTestSuite();
    
    // Show summary
    console.log('\n' + '='.repeat(50));
    console.log('🎯 LOYALTY SYSTEM TEST SUMMARY');
    console.log('='.repeat(50));
    
    if (suiteResults.overallSuccess) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ Loyalty system is fully functional');
    } else {
      console.log('⚠️  SOME TESTS FAILED');
      console.log(`❌ ${suiteResults.failedTests}/${suiteResults.totalTests} tests failed`);
      
      // Show failed tests
      const failedTests = suiteResults.results.filter(r => !r.success);
      console.log('\nFailed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
    }
    
    console.log(`\n📊 Success Rate: ${Math.round((suiteResults.passedTests / suiteResults.totalTests) * 100)}%`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('💥 Test runner crashed:', error);
  }
};

/**
 * Quick validation test for basic functionality
 */
export const quickLoyaltyTest = async (): Promise<boolean> => {
  console.log('⚡ Quick loyalty system validation...');
  
  try {
    // Test basic initialization and tracking
    const initTest = await LoyaltyTestUtils.testNewUserInitialization();
    const trackingTest = await LoyaltyTestUtils.testDailyActivityTracking();
    
    const isWorking = initTest.success && trackingTest.success;
    
    if (isWorking) {
      console.log('✅ Loyalty system basic functionality: WORKING');
    } else {
      console.log('❌ Loyalty system basic functionality: FAILED');
      if (!initTest.success) console.log(`  - Init: ${initTest.message}`);
      if (!trackingTest.success) console.log(`  - Tracking: ${trackingTest.message}`);
    }
    
    return isWorking;
    
  } catch (error) {
    console.error('💥 Quick test failed:', error);
    return false;
  }
};

/**
 * Demo loyalty progression for UI testing
 */
export const demoLoyaltyProgression = async (): Promise<void> => {
  console.log('🎭 Starting loyalty progression demo for UI testing...');
  
  try {
    await LoyaltyTestUtils.demoLoyaltyProgression();
    console.log('✅ Demo completed successfully');
  } catch (error) {
    console.error('💥 Demo failed:', error);
  }
};

// Export for easy access in development
export const loyaltySystemTests = {
  runFullSuite: runLoyaltySystemTests,
  quickTest: quickLoyaltyTest,
  demo: demoLoyaltyProgression,
};

// Auto-run if in development mode and explicitly called
if (__DEV__ && process.env.NODE_ENV === 'development') {
  // Uncomment to auto-run tests on import
  // runLoyaltySystemTests().catch(console.error);
}