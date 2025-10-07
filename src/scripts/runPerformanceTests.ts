#!/usr/bin/env npx tsx
// @ts-nocheck - Test/script file, not part of production build


/**
 * Performance Test Runner for Gamification System
 * Executes comprehensive performance validation
 * 
 * Usage: npx tsx src/scripts/runPerformanceTests.ts
 */

import { GamificationPerformanceTest } from '../utils/gamificationPerformanceTest';

async function main() {
  console.log('🎯 Starting Gamification Performance Tests...');
  console.log('📱 Environment: React Native/Expo');
  console.log('🎯 Target: <50ms for all operations\n');

  try {
    // Ensure clean environment
    console.log('🧹 Preparing test environment...');
    
    // Clear any existing data for consistent testing
    if (global.gc) {
      global.gc();
      console.log('🗑️ Garbage collection triggered');
    }

    // Run full test suite
    const results = await GamificationPerformanceTest.runFullTestSuite();

    // Exit with appropriate code
    const exitCode = results.overallAssessment.allTestsPassed ? 0 : 1;
    console.log(`\n🏁 Tests completed with exit code: ${exitCode}`);
    
    if (!results.overallAssessment.deploymentReady) {
      console.error('⚠️ Critical performance issues detected - not ready for production deployment');
    }

    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Performance test suite failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runPerformanceTests };
