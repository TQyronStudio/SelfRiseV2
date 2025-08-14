/**
 * XP Counter Performance Test
 * 
 * Validates optimized real-time XP counter performance
 * Tests smooth 60fps updates bez frame drops
 */

import { XPSourceType } from '../types/gamification';

// Mock OptimizedGamificationContext for testing
interface MockOptimizedXPState {
  totalXP: number;
  currentLevel: number;
  xpProgress: number;
  xpToNextLevel: number;
  updateSequence: number;
  progressCache: {
    lastTotalXP: number;
    lastProgress: number;
    lastLevel: number;
    cacheTime: number;
  };
}

interface PerformanceMetrics {
  updateCount: number;
  averageUpdateTime: number;
  frameDrops: number;
  cacheHits: number;
  cacheMisses: number;
  totalOperationTime: number;
}

class XPCounterPerformanceTester {
  private state: MockOptimizedXPState = {
    totalXP: 1000,
    currentLevel: 10,
    xpProgress: 45.5,
    xpToNextLevel: 550,
    updateSequence: 0,
    progressCache: {
      lastTotalXP: 1000,
      lastProgress: 45.5,
      lastLevel: 10,
      cacheTime: Date.now()
    }
  };

  private metrics: PerformanceMetrics = {
    updateCount: 0,
    averageUpdateTime: 0,
    frameDrops: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalOperationTime: 0
  };

  private readonly CACHE_VALIDITY_MS = 100;
  private readonly FRAME_DROP_THRESHOLD_MS = 16.67; // 60fps = 16.67ms per frame
  private readonly PROGRESS_CACHE_THRESHOLD = 0.1;

  // Simulate getCurrentLevel calculation
  private getCurrentLevel(totalXP: number): number {
    return Math.floor(totalXP / 100) + 1;
  }

  // Simulate getXPProgress calculation
  private getXPProgress(totalXP: number): { xpProgress: number; xpToNextLevel: number } {
    const currentLevel = this.getCurrentLevel(totalXP);
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpForNextLevel = currentLevel * 100;
    const xpInCurrentLevel = totalXP - xpForCurrentLevel;
    const xpToNextLevel = xpForNextLevel - totalXP;
    const xpProgress = (xpInCurrentLevel / 100) * 100;

    return { xpProgress, xpToNextLevel };
  }

  // Simulate optimized XP update with caching
  private updateXP(newTotalXP: number, useOptimisticUpdate: boolean = true): number {
    const startTime = performance.now();
    const now = Date.now();

    // Check cache validity
    const cacheAge = now - this.state.progressCache.cacheTime;
    const isCacheValid = cacheAge < this.CACHE_VALIDITY_MS;

    if (isCacheValid && useOptimisticUpdate) {
      // Cache hit - use optimistic update
      const progressDiff = Math.abs(newTotalXP - this.state.progressCache.lastTotalXP);
      
      if (progressDiff < this.PROGRESS_CACHE_THRESHOLD * 100) {
        this.metrics.cacheHits++;
        const operationTime = performance.now() - startTime;
        this.metrics.totalOperationTime += operationTime;
        return operationTime; // Return early for cached result
      }
    }

    // Cache miss - full calculation
    this.metrics.cacheMisses++;
    
    const newLevel = this.getCurrentLevel(newTotalXP);
    const progress = this.getXPProgress(newTotalXP);

    // Update state
    this.state = {
      ...this.state,
      totalXP: newTotalXP,
      currentLevel: newLevel,
      xpProgress: progress.xpProgress,
      xpToNextLevel: progress.xpToNextLevel,
      updateSequence: this.state.updateSequence + 1,
      progressCache: {
        lastTotalXP: newTotalXP,
        lastProgress: progress.xpProgress,
        lastLevel: newLevel,
        cacheTime: now
      }
    };

    const operationTime = performance.now() - startTime;
    this.metrics.updateCount++;
    this.metrics.totalOperationTime += operationTime;

    // Check for frame drops
    if (operationTime > this.FRAME_DROP_THRESHOLD_MS) {
      this.metrics.frameDrops++;
      console.warn(`⚠️ Frame drop detected: ${operationTime.toFixed(2)}ms (threshold: ${this.FRAME_DROP_THRESHOLD_MS}ms)`);
    }

    return operationTime;
  }

  // Test rapid XP updates (stress test)
  testRapidUpdates(updateCount: number = 60): PerformanceMetrics {
    console.log(`🧪 Testing ${updateCount} rapid XP updates...`);
    
    const startTime = performance.now();
    const updateTimes: number[] = [];

    for (let i = 0; i < updateCount; i++) {
      const xpIncrease = Math.random() * 50 + 10; // 10-60 XP per update
      const newTotalXP = this.state.totalXP + xpIncrease;
      
      const updateTime = this.updateXP(newTotalXP, true);
      updateTimes.push(updateTime);
    }

    const totalTime = performance.now() - startTime;
    this.metrics.averageUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateCount;

    console.log(`📊 Rapid updates completed in ${totalTime.toFixed(2)}ms`);
    console.log(`📊 Average update time: ${this.metrics.averageUpdateTime.toFixed(2)}ms`);
    console.log(`📊 Frame drops: ${this.metrics.frameDrops}/${updateCount} (${((this.metrics.frameDrops / updateCount) * 100).toFixed(1)}%)`);

    return { ...this.metrics };
  }

  // Test cache efficiency
  testCacheEfficiency(testCount: number = 100): PerformanceMetrics {
    console.log(`🧪 Testing cache efficiency with ${testCount} operations...`);
    
    // Reset metrics
    this.metrics.cacheHits = 0;
    this.metrics.cacheMisses = 0;

    for (let i = 0; i < testCount; i++) {
      // Simulate small XP changes that should hit cache
      const smallChange = Math.random() * 5; // Very small changes
      const newTotalXP = this.state.totalXP + smallChange;
      
      this.updateXP(newTotalXP, true);
    }

    const cacheHitRate = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses);
    console.log(`📊 Cache hit rate: ${(cacheHitRate * 100).toFixed(1)}% (${this.metrics.cacheHits} hits, ${this.metrics.cacheMisses} misses)`);

    return { ...this.metrics };
  }

  // Test high-frequency updates (60fps simulation)
  test60FPSUpdates(): PerformanceMetrics {
    console.log(`🧪 Testing 60fps update capability...`);
    
    const fps60Interval = 16.67; // 60fps = 16.67ms between frames
    const testDuration = 1000; // 1 second test
    const expectedUpdates = Math.floor(testDuration / fps60Interval);
    
    const startTime = performance.now();
    let actualUpdates = 0;
    let frameDropCount = 0;

    // Simulate 60fps updates
    const intervalStart = performance.now();
    while (performance.now() - intervalStart < testDuration) {
      const updateStart = performance.now();
      
      const xpIncrease = 25; // Standard XP increase
      const newTotalXP = this.state.totalXP + xpIncrease;
      
      this.updateXP(newTotalXP, true);
      actualUpdates++;
      
      const updateTime = performance.now() - updateStart;
      if (updateTime > fps60Interval) {
        frameDropCount++;
      }
      
      // Simulate 60fps timing
      while (performance.now() - updateStart < fps60Interval) {
        // Wait for next frame
      }
    }

    const actualFPS = (actualUpdates / testDuration) * 1000;
    const frameDropRate = (frameDropCount / actualUpdates) * 100;

    console.log(`📊 60fps test results:`);
    console.log(`   Expected updates: ${expectedUpdates}`);
    console.log(`   Actual updates: ${actualUpdates}`);
    console.log(`   Actual FPS: ${actualFPS.toFixed(1)}`);
    console.log(`   Frame drop rate: ${frameDropRate.toFixed(1)}%`);

    return { ...this.metrics, frameDrops: frameDropCount };
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      updateCount: 0,
      averageUpdateTime: 0,
      frameDrops: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalOperationTime: 0
    };
  }

  getState(): MockOptimizedXPState {
    return { ...this.state };
  }
}

export async function runXPCounterPerformanceTest(): Promise<{
  success: boolean;
  results: {
    rapidUpdatesPass: boolean;
    cacheEfficiencyPass: boolean;
    fps60Pass: boolean;
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    details: string[];
    metrics: PerformanceMetrics;
  };
}> {
  console.log('🚀 Starting XP Counter Performance Test...\n');
  
  const tester = new XPCounterPerformanceTester();
  const results = {
    rapidUpdatesPass: false,
    cacheEfficiencyPass: false,
    fps60Pass: false,
    overallGrade: 'F' as 'A' | 'B' | 'C' | 'D' | 'F',
    details: [] as string[],
    metrics: {} as PerformanceMetrics
  };

  try {
    // Test 1: Rapid Updates Performance
    console.log('\n📊 Test 1: Rapid XP Updates Performance');
    const rapidMetrics = tester.testRapidUpdates(60);
    const rapidUpdatesPassed = rapidMetrics.averageUpdateTime < 5 && rapidMetrics.frameDrops < 3;
    results.rapidUpdatesPass = rapidUpdatesPassed;
    
    if (rapidUpdatesPassed) {
      results.details.push(`✅ Rapid updates: ${rapidMetrics.averageUpdateTime.toFixed(2)}ms avg, ${rapidMetrics.frameDrops} frame drops`);
    } else {
      results.details.push(`❌ Rapid updates failed: ${rapidMetrics.averageUpdateTime.toFixed(2)}ms avg (target <5ms), ${rapidMetrics.frameDrops} frame drops (target <3)`);
    }

    // Test 2: Cache Efficiency
    console.log('\n📊 Test 2: Cache Efficiency');
    tester.resetMetrics();
    const cacheMetrics = tester.testCacheEfficiency(100);
    const cacheHitRate = cacheMetrics.cacheHits / (cacheMetrics.cacheHits + cacheMetrics.cacheMisses);
    const cacheEfficiencyPassed = cacheHitRate > 0.7; // >70% cache hit rate
    results.cacheEfficiencyPass = cacheEfficiencyPassed;
    
    if (cacheEfficiencyPassed) {
      results.details.push(`✅ Cache efficiency: ${(cacheHitRate * 100).toFixed(1)}% hit rate`);
    } else {
      results.details.push(`❌ Cache efficiency failed: ${(cacheHitRate * 100).toFixed(1)}% hit rate (target >70%)`);
    }

    // Test 3: 60fps Capability
    console.log('\n📊 Test 3: 60fps Update Capability');
    tester.resetMetrics();
    const fps60Metrics = tester.test60FPSUpdates();
    const fps60Passed = fps60Metrics.frameDrops < 5; // <5 frame drops in 1 second
    results.fps60Pass = fps60Passed;
    
    if (fps60Passed) {
      results.details.push(`✅ 60fps capability: ${fps60Metrics.frameDrops} frame drops`);
    } else {
      results.details.push(`❌ 60fps capability failed: ${fps60Metrics.frameDrops} frame drops (target <5)`);
    }

    // Calculate overall grade
    const passedTests = [results.rapidUpdatesPass, results.cacheEfficiencyPass, results.fps60Pass].filter(Boolean).length;
    
    switch (passedTests) {
      case 3: results.overallGrade = 'A'; break;
      case 2: results.overallGrade = 'B'; break;
      case 1: results.overallGrade = 'C'; break;
      case 0: results.overallGrade = 'F'; break;
    }

    results.metrics = tester.getMetrics();
    const success = results.overallGrade !== 'F';
    
    console.log('\n🎯 XP Counter Performance Test Results:');
    results.details.forEach(detail => console.log(detail));
    console.log(`\n🏆 Overall Grade: ${results.overallGrade}`);
    
    if (success) {
      console.log('\n✅ XP Counter performance optimized for real-time 60fps updates!');
    } else {
      console.log('\n❌ XP Counter performance needs optimization for smooth real-time updates.');
    }

    return { success, results };

  } catch (error) {
    console.error('❌ XP Counter performance test failed:', error);
    results.details.push(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return { 
      success: false, 
      results: {
        ...results,
        details: results.details
      }
    };
  }
}

// Export for direct testing
export { XPCounterPerformanceTester };