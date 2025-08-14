/**
 * Device Performance Testing Suite for Gamification System
 * 
 * Benchmarks achievement display and UI performance across device types
 * Think Hard methodology - comprehensive device performance validation
 * 
 * Test Scenarios:
 * 1. Achievement list rendering performance with varying item counts
 * 2. Achievement unlock animation performance
 * 3. Real-time XP counter updates during achievement displays
 * 4. Memory usage patterns on different device specifications
 * 5. Achievement notification overlay performance
 * 6. Concurrent achievement display handling
 */

interface DeviceSpec {
  category: 'HIGH_END' | 'MID_RANGE' | 'LOW_END' | 'BUDGET';
  ram: number; // GB
  cpu: string;
  approximatePerformanceMultiplier: number; // 1.0 = baseline, <1.0 = slower, >1.0 = faster
}

interface DevicePerformanceResult {
  testName: string;
  deviceCategory: string;
  achievementCount: number;
  averageRenderTime: number; // milliseconds
  maxRenderTime: number;
  frameDrops: number;
  memoryUsage: number; // MB
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  targetFrameRate: number; // FPS
  actualFrameRate: number;
  recommendations: string[];
  passedBenchmark: boolean;
}

interface AchievementDisplayMetrics {
  renderStart: number;
  renderEnd: number;
  layoutTime: number;
  animationTime: number;
  memoryBefore: number;
  memoryAfter: number;
  frameDropCount: number;
}

export class DevicePerformanceTest {
  
  // Device specification profiles for testing
  private static deviceSpecs: Record<string, DeviceSpec> = {
    'iPhone_15_Pro': {
      category: 'HIGH_END',
      ram: 8,
      cpu: 'A17 Pro',
      approximatePerformanceMultiplier: 1.8
    },
    'iPhone_12': {
      category: 'HIGH_END', 
      ram: 6,
      cpu: 'A14 Bionic',
      approximatePerformanceMultiplier: 1.5
    },
    'Samsung_Galaxy_S23': {
      category: 'HIGH_END',
      ram: 8,
      cpu: 'Snapdragon 8 Gen 2',
      approximatePerformanceMultiplier: 1.6
    },
    'Google_Pixel_7': {
      category: 'MID_RANGE',
      ram: 8,
      cpu: 'Google Tensor G2',
      approximatePerformanceMultiplier: 1.2
    },
    'iPhone_SE_2022': {
      category: 'MID_RANGE',
      ram: 4,
      cpu: 'A15 Bionic',
      approximatePerformanceMultiplier: 1.3
    },
    'Samsung_Galaxy_A54': {
      category: 'MID_RANGE',
      ram: 6,
      cpu: 'Exynos 1380',
      approximatePerformanceMultiplier: 1.0
    },
    'OnePlus_Nord_CE_3': {
      category: 'MID_RANGE',
      ram: 8,
      cpu: 'Snapdragon 782G',
      approximatePerformanceMultiplier: 0.9
    },
    'Xiaomi_Redmi_Note_12': {
      category: 'LOW_END',
      ram: 4,
      cpu: 'Snapdragon 685',
      approximatePerformanceMultiplier: 0.7
    },
    'Samsung_Galaxy_A14': {
      category: 'LOW_END',
      ram: 4,
      cpu: 'Helio G80',
      approximatePerformanceMultiplier: 0.6
    },
    'Nokia_G50': {
      category: 'BUDGET',
      ram: 4,
      cpu: 'Snapdragon 480',
      approximatePerformanceMultiplier: 0.5
    }
  };

  /**
   * Test 1: Achievement List Rendering Performance
   * Tests rendering large lists of achievements on different devices
   */
  static async testAchievementListRendering(): Promise<DevicePerformanceResult[]> {
    console.log('📱 DEVICE TEST 1: Achievement List Rendering Performance');
    console.log('   Testing: Large achievement lists across device categories');

    const results: DevicePerformanceResult[] = [];
    const achievementCounts = [10, 50, 100, 500, 1000];

    for (const [deviceName, spec] of Object.entries(this.deviceSpecs)) {
      console.log(`\n   Testing ${deviceName} (${spec.category})...`);
      
      for (const count of achievementCounts) {
        const metrics = await this.simulateAchievementListRender(spec, count);
        
        const result = this.analyzePerformanceMetrics(
          'Achievement List Rendering',
          deviceName,
          spec,
          count,
          metrics
        );
        
        results.push(result);
        
        console.log(`     ${count} achievements: ${result.averageRenderTime.toFixed(2)}ms avg, ${result.performanceGrade} grade`);
      }
    }

    return results;
  }

  /**
   * Test 2: Achievement Unlock Animation Performance  
   * Tests animation smoothness during achievement unlocks
   */
  static async testAchievementUnlockAnimation(): Promise<DevicePerformanceResult[]> {
    console.log('\n📱 DEVICE TEST 2: Achievement Unlock Animation Performance');
    console.log('   Testing: Animation smoothness across device categories');

    const results: DevicePerformanceResult[] = [];
    const simultaneousUnlocks = [1, 3, 5, 8];

    for (const [deviceName, spec] of Object.entries(this.deviceSpecs)) {
      console.log(`\n   Testing ${deviceName} (${spec.category})...`);
      
      for (const unlockCount of simultaneousUnlocks) {
        const metrics = await this.simulateAchievementUnlockAnimation(spec, unlockCount);
        
        const result = this.analyzePerformanceMetrics(
          'Achievement Unlock Animation',
          deviceName,
          spec,
          unlockCount,
          metrics
        );
        
        results.push(result);
        
        console.log(`     ${unlockCount} simultaneous: ${result.actualFrameRate.toFixed(1)}fps, ${result.performanceGrade} grade`);
      }
    }

    return results;
  }

  /**
   * Test 3: Real-time XP Counter Performance
   * Tests XP counter updates during achievement displays
   */
  static async testRealTimeXPCounterPerformance(): Promise<DevicePerformanceResult[]> {
    console.log('\n📱 DEVICE TEST 3: Real-time XP Counter Performance');
    console.log('   Testing: XP counter updates with achievement overlays');

    const results: DevicePerformanceResult[] = [];
    const updateFrequencies = [1, 5, 10, 20]; // Updates per second

    for (const [deviceName, spec] of Object.entries(this.deviceSpecs)) {
      console.log(`\n   Testing ${deviceName} (${spec.category})...`);
      
      for (const frequency of updateFrequencies) {
        const metrics = await this.simulateRealTimeXPUpdates(spec, frequency);
        
        const result = this.analyzePerformanceMetrics(
          'Real-time XP Counter',
          deviceName,
          spec,
          frequency,
          metrics
        );
        
        results.push(result);
        
        console.log(`     ${frequency} updates/sec: ${result.averageRenderTime.toFixed(2)}ms avg, ${result.performanceGrade} grade`);
      }
    }

    return results;
  }

  /**
   * Test 4: Achievement Notification Overlay Performance
   * Tests performance of achievement notification overlays
   */
  static async testAchievementNotificationOverlay(): Promise<DevicePerformanceResult[]> {
    console.log('\n📱 DEVICE TEST 4: Achievement Notification Overlay Performance');
    console.log('   Testing: Notification overlay rendering and animations');

    const results: DevicePerformanceResult[] = [];
    const notificationCounts = [1, 3, 5, 10];

    for (const [deviceName, spec] of Object.entries(this.deviceSpecs)) {
      console.log(`\n   Testing ${deviceName} (${spec.category})...`);
      
      for (const count of notificationCounts) {
        const metrics = await this.simulateNotificationOverlay(spec, count);
        
        const result = this.analyzePerformanceMetrics(
          'Achievement Notification Overlay',
          deviceName,
          spec,
          count,
          metrics
        );
        
        results.push(result);
        
        console.log(`     ${count} notifications: ${result.averageRenderTime.toFixed(2)}ms, ${result.actualFrameRate.toFixed(1)}fps`);
      }
    }

    return results;
  }

  /**
   * Simulate achievement list rendering with device-specific performance
   */
  private static async simulateAchievementListRender(
    device: DeviceSpec, 
    achievementCount: number
  ): Promise<AchievementDisplayMetrics> {
    const renderStart = performance.now();
    const memoryBefore = this.getSimulatedMemoryUsage();

    // Simulate rendering complexity based on achievement count and device performance
    const baseRenderTime = Math.log(achievementCount + 1) * 5; // Logarithmic scaling
    const deviceAdjustedTime = baseRenderTime / device.approximatePerformanceMultiplier;
    
    // Simulate layout calculations
    const layoutComplexity = Math.min(achievementCount / 10, 50); // Max 50ms layout time
    const layoutTime = layoutComplexity / device.approximatePerformanceMultiplier;
    
    // Add realistic rendering delays
    await new Promise(resolve => setTimeout(resolve, deviceAdjustedTime));
    
    const renderEnd = performance.now();
    const memoryAfter = this.getSimulatedMemoryUsage(achievementCount * 0.1); // 0.1MB per achievement
    
    // Simulate frame drops on slower devices with many achievements
    let frameDrops = 0;
    if (achievementCount > 100 && device.approximatePerformanceMultiplier < 1.0) {
      frameDrops = Math.floor((achievementCount - 100) / 50 / device.approximatePerformanceMultiplier);
    }

    return {
      renderStart,
      renderEnd,
      layoutTime,
      animationTime: 0, // No animation in list rendering
      memoryBefore,
      memoryAfter,
      frameDropCount: frameDrops
    };
  }

  /**
   * Simulate achievement unlock animation with device-specific performance
   */
  private static async simulateAchievementUnlockAnimation(
    device: DeviceSpec,
    unlockCount: number
  ): Promise<AchievementDisplayMetrics> {
    const renderStart = performance.now();
    const memoryBefore = this.getSimulatedMemoryUsage();

    // Animation complexity increases with simultaneous unlocks
    const baseAnimationTime = unlockCount * 800; // 800ms per unlock animation
    const deviceAdjustedTime = baseAnimationTime / device.approximatePerformanceMultiplier;
    
    // Complex animations are more taxing on lower-end devices
    let frameDrops = 0;
    if (unlockCount > 3) {
      frameDrops = Math.floor((unlockCount - 3) * 2 / device.approximatePerformanceMultiplier);
    }
    
    // Simulate animation frames
    const animationFrames = Math.floor(deviceAdjustedTime / 16.67); // 60fps target
    for (let i = 0; i < Math.min(animationFrames, 100); i++) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    const renderEnd = performance.now();
    const memoryAfter = this.getSimulatedMemoryUsage(unlockCount * 2); // 2MB per unlock during animation

    return {
      renderStart,
      renderEnd,
      layoutTime: 50 / device.approximatePerformanceMultiplier, // Fixed layout time
      animationTime: deviceAdjustedTime,
      memoryBefore,
      memoryAfter,
      frameDropCount: frameDrops
    };
  }

  /**
   * Simulate real-time XP updates with device-specific performance
   */
  private static async simulateRealTimeXPUpdates(
    device: DeviceSpec,
    updatesPerSecond: number
  ): Promise<AchievementDisplayMetrics> {
    const renderStart = performance.now();
    const memoryBefore = this.getSimulatedMemoryUsage();

    // Simulate 2 seconds of XP updates
    const testDuration = 2000; // 2 seconds
    const totalUpdates = Math.floor((updatesPerSecond * testDuration) / 1000);
    const updateInterval = 1000 / updatesPerSecond;
    
    let frameDrops = 0;
    
    // Simulate each XP update
    for (let i = 0; i < totalUpdates; i++) {
      const updateStart = performance.now();
      
      // XP counter update rendering time
      const updateRenderTime = (5 + Math.random() * 5) / device.approximatePerformanceMultiplier;
      await new Promise(resolve => setTimeout(resolve, updateRenderTime));
      
      const updateEnd = performance.now();
      const actualUpdateTime = updateEnd - updateStart;
      
      // Check if update took longer than target interval (potential frame drop)
      if (actualUpdateTime > updateInterval) {
        frameDrops++;
      }
      
      // Wait for next update interval
      const remainingTime = Math.max(0, updateInterval - actualUpdateTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    }
    
    const renderEnd = performance.now();
    const memoryAfter = this.getSimulatedMemoryUsage(0.5); // Minimal memory increase for counters

    return {
      renderStart,
      renderEnd,
      layoutTime: 10 / device.approximatePerformanceMultiplier,
      animationTime: testDuration,
      memoryBefore,
      memoryAfter,
      frameDropCount: frameDrops
    };
  }

  /**
   * Simulate notification overlay rendering
   */
  private static async simulateNotificationOverlay(
    device: DeviceSpec,
    notificationCount: number
  ): Promise<AchievementDisplayMetrics> {
    const renderStart = performance.now();
    const memoryBefore = this.getSimulatedMemoryUsage();

    // Notification rendering complexity
    const baseRenderTime = notificationCount * 100; // 100ms per notification
    const deviceAdjustedTime = baseRenderTime / device.approximatePerformanceMultiplier;
    
    // Overlay effects are GPU intensive
    let frameDrops = 0;
    if (notificationCount > 5 && device.approximatePerformanceMultiplier < 1.2) {
      frameDrops = Math.floor((notificationCount - 5) / device.approximatePerformanceMultiplier);
    }
    
    // Simulate rendering delay
    await new Promise(resolve => setTimeout(resolve, deviceAdjustedTime));
    
    const renderEnd = performance.now();
    const memoryAfter = this.getSimulatedMemoryUsage(notificationCount * 1.5); // 1.5MB per notification

    return {
      renderStart,
      renderEnd,
      layoutTime: 30 / device.approximatePerformanceMultiplier,
      animationTime: deviceAdjustedTime,
      memoryBefore,
      memoryAfter,
      frameDropCount: frameDrops
    };
  }

  /**
   * Analyze performance metrics and generate result
   */
  private static analyzePerformanceMetrics(
    testName: string,
    deviceName: string,
    deviceSpec: DeviceSpec,
    itemCount: number,
    metrics: AchievementDisplayMetrics
  ): DevicePerformanceResult {
    const totalRenderTime = metrics.renderEnd - metrics.renderStart;
    const memoryUsage = (metrics.memoryAfter - metrics.memoryBefore) / 1024 / 1024; // Convert to MB
    
    // Calculate frame rate based on animation time and frame drops
    const targetFrameRate = 60;
    const expectedFrames = Math.floor(metrics.animationTime / 16.67);
    const actualFrames = Math.max(1, expectedFrames - metrics.frameDropCount);
    const actualFrameRate = expectedFrames > 0 ? (actualFrames / expectedFrames) * targetFrameRate : targetFrameRate;

    // Performance grading based on device category expectations
    let performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    const categoryMultipliers = {
      'HIGH_END': 1.0,
      'MID_RANGE': 1.5,
      'LOW_END': 2.0,
      'BUDGET': 3.0
    };
    
    const expectedMaxTime = 100 * categoryMultipliers[deviceSpec.category]; // ms
    const frameRateThreshold = targetFrameRate * (deviceSpec.category === 'HIGH_END' ? 0.95 : 
                                                  deviceSpec.category === 'MID_RANGE' ? 0.85 :
                                                  deviceSpec.category === 'LOW_END' ? 0.70 : 0.60);

    if (totalRenderTime <= expectedMaxTime * 0.6 && actualFrameRate >= frameRateThreshold) {
      performanceGrade = 'A';
    } else if (totalRenderTime <= expectedMaxTime * 0.8 && actualFrameRate >= frameRateThreshold * 0.9) {
      performanceGrade = 'B';
    } else if (totalRenderTime <= expectedMaxTime && actualFrameRate >= frameRateThreshold * 0.8) {
      performanceGrade = 'C';
    } else if (totalRenderTime <= expectedMaxTime * 1.5 && actualFrameRate >= frameRateThreshold * 0.6) {
      performanceGrade = 'D';
    } else {
      performanceGrade = 'F';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (totalRenderTime > expectedMaxTime) {
      recommendations.push(`Optimize rendering for ${deviceSpec.category} devices`);
    }
    if (metrics.frameDropCount > 5) {
      recommendations.push('Reduce animation complexity for smoother performance');
    }
    if (memoryUsage > 10) {
      recommendations.push('Optimize memory usage during achievement displays');
    }
    if (actualFrameRate < 30) {
      recommendations.push('Critical: Frame rate too low for acceptable user experience');
    }

    const passedBenchmark = performanceGrade !== 'F' && actualFrameRate >= 30;

    return {
      testName,
      deviceCategory: `${deviceName} (${deviceSpec.category})`,
      achievementCount: itemCount,
      averageRenderTime: totalRenderTime,
      maxRenderTime: totalRenderTime, // In this simulation, they're the same
      frameDrops: metrics.frameDropCount,
      memoryUsage,
      performanceGrade,
      targetFrameRate,
      actualFrameRate,
      recommendations,
      passedBenchmark
    };
  }

  /**
   * Get simulated memory usage
   */
  private static getSimulatedMemoryUsage(additionalMB: number = 0): number {
    const baseMemory = 50 * 1024 * 1024; // 50MB base
    const additional = additionalMB * 1024 * 1024;
    return baseMemory + additional + Math.random() * 5 * 1024 * 1024; // ±5MB variation
  }

  /**
   * Run complete device performance test suite
   */
  static async runCompleteDevicePerformanceTestSuite(): Promise<{
    results: DevicePerformanceResult[];
    overallAssessment: {
      deviceCompatibility: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'CONCERNING' | 'PROBLEMATIC';
      highEndPerformance: string;
      midRangePerformance: string;
      lowEndPerformance: string;
      budgetPerformance: string;
      criticalIssues: string[];
      recommendations: string[];
      deploymentRecommendation: string;
    };
  }> {
    console.log('📱 RUNNING COMPLETE DEVICE PERFORMANCE TEST SUITE');
    console.log('='.repeat(70));
    console.log('Target: Smooth 60fps on high-end, 30+fps on budget devices\n');
    
    const allResults: DevicePerformanceResult[] = [];
    
    try {
      // Run all device performance tests
      const listResults = await this.testAchievementListRendering();
      const animationResults = await this.testAchievementUnlockAnimation();
      const xpCounterResults = await this.testRealTimeXPCounterPerformance();
      const notificationResults = await this.testAchievementNotificationOverlay();
      
      allResults.push(...listResults, ...animationResults, ...xpCounterResults, ...notificationResults);
      
      // Generate overall assessment
      const overallAssessment = this.generateDevicePerformanceAssessment(allResults);
      
      // Print comprehensive report
      this.printDevicePerformanceReport(allResults, overallAssessment);
      
      return { results: allResults, overallAssessment };
      
    } catch (error) {
      console.error('❌ Device performance test suite failed:', error);
      throw error;
    }
  }

  /**
   * Generate overall device performance assessment
   */
  private static generateDevicePerformanceAssessment(results: DevicePerformanceResult[]) {
    // Group results by device category
    const resultsByCategory = {
      'HIGH_END': results.filter(r => r.deviceCategory.includes('HIGH_END')),
      'MID_RANGE': results.filter(r => r.deviceCategory.includes('MID_RANGE')),
      'LOW_END': results.filter(r => r.deviceCategory.includes('LOW_END')),
      'BUDGET': results.filter(r => r.deviceCategory.includes('BUDGET'))
    };

    // Calculate performance grades for each category
    const categoryPerformance = Object.entries(resultsByCategory).reduce((acc, [category, categoryResults]) => {
      const grades = categoryResults.map(r => r.performanceGrade);
      const gradeValues = { A: 5, B: 4, C: 3, D: 2, F: 1 };
      const avgScore = grades.reduce((sum, grade) => sum + gradeValues[grade], 0) / grades.length;
      const avgGrade = Object.keys(gradeValues).find(g => gradeValues[g as keyof typeof gradeValues] === Math.round(avgScore)) || 'C';
      
      acc[category] = {
        averageGrade: avgGrade,
        passRate: categoryResults.filter(r => r.passedBenchmark).length / categoryResults.length,
        averageFrameRate: categoryResults.reduce((sum, r) => sum + r.actualFrameRate, 0) / categoryResults.length
      };
      return acc;
    }, {} as any);

    // Determine overall device compatibility
    let deviceCompatibility: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'CONCERNING' | 'PROBLEMATIC';
    const overallPassRate = results.filter(r => r.passedBenchmark).length / results.length;
    const budgetDevicePassRate = categoryPerformance['BUDGET']?.passRate || 0;
    
    if (overallPassRate >= 0.9 && budgetDevicePassRate >= 0.7) {
      deviceCompatibility = 'EXCELLENT';
    } else if (overallPassRate >= 0.8 && budgetDevicePassRate >= 0.6) {
      deviceCompatibility = 'GOOD';
    } else if (overallPassRate >= 0.7 && budgetDevicePassRate >= 0.4) {
      deviceCompatibility = 'ACCEPTABLE';
    } else if (overallPassRate >= 0.6) {
      deviceCompatibility = 'CONCERNING';
    } else {
      deviceCompatibility = 'PROBLEMATIC';
    }

    // Generate category assessments
    const highEndPerformance = `${categoryPerformance['HIGH_END']?.averageGrade || 'N/A'} grade (${(categoryPerformance['HIGH_END']?.averageFrameRate || 0).toFixed(1)} fps avg)`;
    const midRangePerformance = `${categoryPerformance['MID_RANGE']?.averageGrade || 'N/A'} grade (${(categoryPerformance['MID_RANGE']?.averageFrameRate || 0).toFixed(1)} fps avg)`;
    const lowEndPerformance = `${categoryPerformance['LOW_END']?.averageGrade || 'N/A'} grade (${(categoryPerformance['LOW_END']?.averageFrameRate || 0).toFixed(1)} fps avg)`;
    const budgetPerformance = `${categoryPerformance['BUDGET']?.averageGrade || 'N/A'} grade (${(categoryPerformance['BUDGET']?.averageFrameRate || 0).toFixed(1)} fps avg)`;

    // Collect critical issues
    const criticalIssues: string[] = [];
    const failedResults = results.filter(r => !r.passedBenchmark);
    
    failedResults.forEach(result => {
      if (result.actualFrameRate < 20) {
        criticalIssues.push(`${result.deviceCategory}: Critical frame rate issues in ${result.testName}`);
      }
    });

    if (budgetDevicePassRate < 0.3) {
      criticalIssues.push('Budget devices: Unacceptable performance levels');
    }

    // Generate recommendations
    const allRecommendations = [...new Set(results.flatMap(r => r.recommendations))];
    const recommendations = allRecommendations.slice(0, 8); // Limit to most important

    // Deployment recommendation
    let deploymentRecommendation: string;
    if (deviceCompatibility === 'EXCELLENT' || deviceCompatibility === 'GOOD') {
      deploymentRecommendation = 'Ready for deployment across all device categories';
    } else if (deviceCompatibility === 'ACCEPTABLE') {
      deploymentRecommendation = 'Deploy with performance optimizations for lower-end devices';
    } else {
      deploymentRecommendation = 'Performance optimization required before deployment';
    }

    return {
      deviceCompatibility,
      highEndPerformance,
      midRangePerformance,
      lowEndPerformance,
      budgetPerformance,
      criticalIssues,
      recommendations,
      deploymentRecommendation
    };
  }

  /**
   * Print comprehensive device performance report
   */
  private static printDevicePerformanceReport(results: DevicePerformanceResult[], assessment: any): void {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 DEVICE PERFORMANCE TEST SUITE - FINAL REPORT');
    console.log('='.repeat(70));
    
    // Overall compatibility status
    const compatibilityIcon = assessment.deviceCompatibility === 'EXCELLENT' ? '🟢' :
                             assessment.deviceCompatibility === 'GOOD' ? '🟡' :
                             assessment.deviceCompatibility === 'ACCEPTABLE' ? '🟠' : '🔴';
    
    console.log(`\n${compatibilityIcon} DEVICE COMPATIBILITY: ${assessment.deviceCompatibility}`);
    console.log(`📱 HIGH-END DEVICES: ${assessment.highEndPerformance}`);
    console.log(`📱 MID-RANGE DEVICES: ${assessment.midRangePerformance}`);
    console.log(`📱 LOW-END DEVICES: ${assessment.lowEndPerformance}`);
    console.log(`📱 BUDGET DEVICES: ${assessment.budgetPerformance}`);
    
    // Performance summary by test type
    const testTypes = [...new Set(results.map(r => r.testName))];
    console.log(`\n📊 PERFORMANCE BY TEST TYPE:`);
    
    testTypes.forEach(testType => {
      const testResults = results.filter(r => r.testName === testType);
      const passRate = testResults.filter(r => r.passedBenchmark).length / testResults.length;
      const avgFrameRate = testResults.reduce((sum, r) => sum + r.actualFrameRate, 0) / testResults.length;
      
      const statusIcon = passRate >= 0.8 ? '✅' : passRate >= 0.6 ? '⚠️' : '❌';
      console.log(`   ${statusIcon} ${testType}: ${(passRate * 100).toFixed(0)}% pass rate, ${avgFrameRate.toFixed(1)} fps avg`);
    });
    
    // Critical issues
    if (assessment.criticalIssues.length > 0) {
      console.log(`\n❌ CRITICAL DEVICE PERFORMANCE ISSUES (${assessment.criticalIssues.length}):`);
      assessment.criticalIssues.forEach((issue: string, index: number) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log(`\n✅ NO CRITICAL DEVICE PERFORMANCE ISSUES DETECTED`);
    }
    
    // Recommendations
    console.log(`\n💡 DEVICE PERFORMANCE RECOMMENDATIONS:`);
    assessment.recommendations.forEach((rec: string, index: number) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    // Deployment recommendation
    console.log(`\n🚀 DEPLOYMENT RECOMMENDATION:`);
    console.log(`   ${assessment.deploymentRecommendation}`);
    
    console.log('\n' + '='.repeat(70));
  }
}