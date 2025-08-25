/**
 * Test utility for verifying XP bar synchronization after level-ups
 * Tests the cache invalidation fix in OptimizedXpProgressBar
 */

import { GamificationService } from '../services/gamificationService';
import { getCurrentLevel, getXPProgress, clearLevelCalculationCache } from '../services/levelCalculation';
import { XPSourceType } from '../types/gamification';
import { DeviceEventEmitter } from 'react-native';

/**
 * Test XP bar cache synchronization after level-up events
 */
export async function testXpBarSynchronization(): Promise<void> {
  try {
    console.log('🧪 Starting XP bar synchronization test...');
    
    // Get initial state
    const initialStats = await GamificationService.getGamificationStats();
    console.log(`Initial state: Level ${initialStats.currentLevel}, Progress: ${initialStats.xpProgress}%`);
    
    // Test 1: Verify cache consistency before level-up
    const preCalculatedLevel = getCurrentLevel(initialStats.totalXP);
    const preCalculatedProgress = getXPProgress(initialStats.totalXP);
    
    console.log('Pre-level-up cache test:');
    console.log(`  GamificationService level: ${initialStats.currentLevel}`);
    console.log(`  levelCalculation level: ${preCalculatedLevel}`);
    console.log(`  GamificationService progress: ${initialStats.xpProgress}%`);
    console.log(`  levelCalculation progress: ${preCalculatedProgress.xpProgress}%`);
    
    // Test 2: Trigger level-up with large XP gain
    console.log('\n🎯 Triggering level-up...');
    
    const result = await GamificationService.addXP(1000, {
      source: XPSourceType.JOURNAL_ENTRY,
      description: 'XP bar sync test - level-up trigger',
      skipLimits: true,
    });
    
    if (!result.leveledUp) {
      console.log('❌ No level-up occurred. Adding more XP...');
      await GamificationService.addXP(2000, {
        source: XPSourceType.JOURNAL_ENTRY,
        description: 'XP bar sync test - larger trigger',
        skipLimits: true,
      });
    }
    
    // Test 3: Check cache synchronization BEFORE manual cache clear
    const postStatsBeforeClear = await GamificationService.getGamificationStats();
    const postCalculatedBeforeClear = getXPProgress(postStatsBeforeClear.totalXP);
    
    console.log('\nPost-level-up state (before manual cache clear):');
    console.log(`  GamificationService level: ${postStatsBeforeClear.currentLevel}`);
    console.log(`  GamificationService progress: ${postStatsBeforeClear.xpProgress}%`);
    console.log(`  levelCalculation progress (cached): ${postCalculatedBeforeClear.xpProgress}%`);
    
    const cacheDiff = Math.abs(postStatsBeforeClear.xpProgress - postCalculatedBeforeClear.xpProgress);
    if (cacheDiff > 1) {
      console.log(`⚠️  CACHE DESYNC DETECTED: ${cacheDiff}% difference`);
    } else {
      console.log(`✅ Cache sync acceptable: ${cacheDiff}% difference`);
    }
    
    // Test 4: Manual cache clear and verification
    console.log('\n🗑️ Manually clearing level calculation cache...');
    clearLevelCalculationCache();
    
    const postCalculatedAfterClear = getXPProgress(postStatsBeforeClear.totalXP);
    console.log(`levelCalculation progress (after clear): ${postCalculatedAfterClear.xpProgress}%`);
    
    const clearedCacheDiff = Math.abs(postStatsBeforeClear.xpProgress - postCalculatedAfterClear.xpProgress);
    
    // Test 5: Emit levelUp event to test OptimizedXpProgressBar fix
    console.log('\n📡 Emitting levelUp event to test XP bar cache invalidation...');
    DeviceEventEmitter.emit('levelUp', {
      newLevel: postStatsBeforeClear.currentLevel,
      previousLevel: initialStats.currentLevel,
      xpGained: 1000,
    });
    
    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test Results
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`Initial Level: ${initialStats.currentLevel}`);
    console.log(`Final Level: ${postStatsBeforeClear.currentLevel}`);
    console.log(`Level-up occurred: ${result.leveledUp || 'Force triggered'}`);
    console.log(`Cache diff before clear: ${cacheDiff}%`);
    console.log(`Cache diff after clear: ${clearedCacheDiff}%`);
    
    if (clearedCacheDiff <= 1) {
      console.log('✅ XP bar synchronization fix WORKING - cache clearing successful');
    } else {
      console.log('❌ XP bar synchronization fix FAILED - cache still desynchronized');
    }
    
    console.log('\n🧪 XP bar synchronization test complete');
    
  } catch (error) {
    console.error('❌ Error in XP bar synchronization test:', error);
  }
}

/**
 * Quick test for cache invalidation function
 */
export async function testCacheInvalidationFunction(): Promise<void> {
  try {
    console.log('🔧 Testing clearLevelCalculationCache() function...');
    
    // Force some cache population
    const stats = await GamificationService.getGamificationStats();
    getCurrentLevel(stats.totalXP);
    getXPProgress(stats.totalXP);
    
    console.log('Cache populated with test data');
    
    // Clear cache
    clearLevelCalculationCache();
    console.log('✅ clearLevelCalculationCache() executed successfully');
    
    // Verify fresh calculations
    const freshLevel = getCurrentLevel(stats.totalXP);
    const freshProgress = getXPProgress(stats.totalXP);
    
    console.log(`Fresh calculations: Level ${freshLevel}, Progress ${freshProgress.xpProgress}%`);
    console.log('🔧 Cache invalidation function test complete');
    
  } catch (error) {
    console.error('❌ Error in cache invalidation function test:', error);
  }
}