/**
 * Performance Profiler for Gamification System
 * Measures and validates performance of critical gamification operations
 * 
 * Target: <50ms for all core operations
 * Think Hard methodology - comprehensive testing
 */

interface PerformanceResult {
  operation: string;
  duration: number; // milliseconds
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface PerformanceBenchmark {
  operation: string;
  samples: number[];
  average: number;
  min: number;
  max: number;
  p95: number; // 95th percentile
  p99: number; // 99th percentile
  passesRequirement: boolean; // <50ms requirement
}

export class PerformanceProfiler {
  private static results: PerformanceResult[] = [];
  private static readonly TARGET_TIME_MS = 50; // <50ms requirement

  /**
   * Profile a single operation with high precision timing
   */
  static async profileOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; performance: PerformanceResult }> {
    const startTime = performance.now();
    let success = true;
    let error: string | undefined;
    let result: T;

    try {
      result = await operation();
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const performanceResult: PerformanceResult = {
        operation: operationName,
        duration,
        success,
        ...(error && { error }),
        ...(metadata && { metadata })
      };

      this.results.push(performanceResult);
      
      // Log immediate result for monitoring
      const status = duration < this.TARGET_TIME_MS ? '✅' : '⚠️';
      console.log(`${status} ${operationName}: ${duration.toFixed(2)}ms ${success ? '' : '(FAILED)'}`);
    }

    const latestResult = this.results[this.results.length - 1];
    if (!latestResult) {
      throw new Error('No performance result available');
    }
    return { result: result!, performance: latestResult };
  }

  /**
   * Run multiple samples of an operation for statistical analysis
   */
  static async benchmarkOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    sampleCount: number = 10,
    warmupCount: number = 3
  ): Promise<PerformanceBenchmark> {
    console.log(`🔥 Benchmarking ${operationName} (${warmupCount} warmup + ${sampleCount} samples)...`);

    // Warmup runs to minimize JIT compilation effects
    for (let i = 0; i < warmupCount; i++) {
      try {
        await operation();
      } catch (error) {
        console.warn(`Warmup ${i + 1} failed:`, error);
      }
    }

    const samples: number[] = [];
    
    // Collect samples
    for (let i = 0; i < sampleCount; i++) {
      const startTime = performance.now();
      try {
        await operation();
        const duration = performance.now() - startTime;
        samples.push(duration);
      } catch (error) {
        console.warn(`Sample ${i + 1} failed:`, error);
        samples.push(Infinity); // Mark failed samples
      }
    }

    // Calculate statistics
    const validSamples = samples.filter(s => s !== Infinity).sort((a, b) => a - b);
    const average = validSamples.reduce((sum, val) => sum + val, 0) / validSamples.length;
    const min = validSamples[0] || Infinity;
    const max = validSamples[validSamples.length - 1] || 0;
    
    // Calculate percentiles
    const p95Index = Math.floor(0.95 * validSamples.length);
    const p99Index = Math.floor(0.99 * validSamples.length);
    const p95 = validSamples[p95Index] || Infinity;
    const p99 = validSamples[p99Index] || Infinity;

    const benchmark: PerformanceBenchmark = {
      operation: operationName,
      samples: validSamples,
      average,
      min,
      max,
      p95,
      p99,
      passesRequirement: p95 < this.TARGET_TIME_MS // 95% of operations must be <50ms
    };

    // Log results
    const status = benchmark.passesRequirement ? '✅' : '❌';
    console.log(`${status} ${operationName} Benchmark:`);
    console.log(`   Average: ${average.toFixed(2)}ms`);
    console.log(`   Min/Max: ${min.toFixed(2)}ms / ${max.toFixed(2)}ms`);
    console.log(`   P95/P99: ${p95.toFixed(2)}ms / ${p99.toFixed(2)}ms`);
    console.log(`   Target: <${this.TARGET_TIME_MS}ms (${benchmark.passesRequirement ? 'PASS' : 'FAIL'})`);

    return benchmark;
  }

  /**
   * Profile memory usage during operation
   */
  static async profileMemory<T>(
    operationName: string,
    operation: () => Promise<T>,
    iterations: number = 100
  ): Promise<{ 
    result: T; 
    memoryStats: {
      initialMemory: number;
      peakMemory: number;
      finalMemory: number;
      memoryLeak: boolean;
      iterations: number;
    }
  }> {
    // Force garbage collection if available (development/test environment)
    if (global.gc) {
      global.gc();
    }

    const initialMemory = this.getMemoryUsage();
    let peakMemory = initialMemory;
    let result: T;

    console.log(`🧠 Memory profiling ${operationName} (${iterations} iterations)...`);

    // Run operation multiple times to detect memory leaks
    for (let i = 0; i < iterations; i++) {
      result = await operation();
      
      const currentMemory = this.getMemoryUsage();
      if (currentMemory > peakMemory) {
        peakMemory = currentMemory;
      }

      // Check for memory leak every 10 iterations
      if (i % 10 === 9) {
        const leakCheck = currentMemory - initialMemory;
        if (leakCheck > 10 * 1024 * 1024) { // More than 10MB increase
          console.warn(`⚠️ Potential memory leak detected at iteration ${i + 1}: +${(leakCheck / 1024 / 1024).toFixed(2)}MB`);
        }
      }
    }

    if (global.gc) {
      global.gc();
    }

    const finalMemory = this.getMemoryUsage();
    const memoryGrowth = finalMemory - initialMemory;
    const memoryLeak = memoryGrowth > 5 * 1024 * 1024; // >5MB growth indicates leak

    const memoryStats = {
      initialMemory,
      peakMemory,
      finalMemory,
      memoryLeak,
      iterations
    };

    console.log(`🧠 Memory Stats for ${operationName}:`);
    console.log(`   Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Peak: ${(peakMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Memory Leak: ${memoryLeak ? '❌ YES' : '✅ NO'}`);

    return { result: result!, memoryStats };
  }

  /**
   * Test concurrent operations for race conditions
   */
  static async testConcurrency<T>(
    operationName: string,
    operation: () => Promise<T>,
    concurrentCount: number = 10,
    iterations: number = 5
  ): Promise<{
    successCount: number;
    failureCount: number;
    averageTime: number;
    raceConditionsDetected: boolean;
    results: T[];
  }> {
    console.log(`🏃‍♂️ Concurrency testing ${operationName} (${concurrentCount} concurrent × ${iterations} iterations)...`);

    let successCount = 0;
    let failureCount = 0;
    const times: number[] = [];
    const results: T[] = [];
    const errors: string[] = [];

    for (let iteration = 0; iteration < iterations; iteration++) {
      const promises: Promise<{ result: T; time: number }>[] = [];

      // Launch concurrent operations
      for (let i = 0; i < concurrentCount; i++) {
        promises.push(
          (async () => {
            const startTime = performance.now();
            try {
              const result = await operation();
              const time = performance.now() - startTime;
              return { result, time };
            } catch (error) {
              const time = performance.now() - startTime;
              throw { error, time };
            }
          })()
        );
      }

      // Wait for all concurrent operations
      const settled = await Promise.allSettled(promises);

      // Analyze results
      settled.forEach((result) => {
        if (result.status === 'fulfilled') {
          successCount++;
          times.push(result.value.time);
          results.push(result.value.result);
        } else {
          failureCount++;
          const reason = result.reason;
          if (reason.time) times.push(reason.time);
          if (reason.error instanceof Error) {
            errors.push(reason.error.message);
          }
        }
      });
    }

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const raceConditionsDetected = failureCount > 0 || errors.some(err => 
      err.includes('concurrent') || err.includes('race') || err.includes('lock')
    );

    console.log(`🏃‍♂️ Concurrency Results for ${operationName}:`);
    console.log(`   Success: ${successCount}/${successCount + failureCount}`);
    console.log(`   Average Time: ${averageTime.toFixed(2)}ms`);
    console.log(`   Race Conditions: ${raceConditionsDetected ? '❌ DETECTED' : '✅ NONE'}`);

    if (errors.length > 0) {
      console.log(`   Errors:`, [...new Set(errors)]);
    }

    return {
      successCount,
      failureCount,
      averageTime,
      raceConditionsDetected,
      results
    };
  }

  /**
   * Generate comprehensive performance report
   */
  static generateReport(): {
    summary: {
      totalOperations: number;
      passedOperations: number;
      failedOperations: number;
      averageTime: number;
      slowestOperation: PerformanceResult | null;
      overallPass: boolean;
    };
    detailed: PerformanceResult[];
  } {
    const totalOperations = this.results.length;
    const passedOperations = this.results.filter(r => r.duration < this.TARGET_TIME_MS && r.success).length;
    const failedOperations = totalOperations - passedOperations;
    const averageTime = this.results.reduce((sum, r) => sum + r.duration, 0) / totalOperations;
    const slowestOperation = this.results.reduce((slowest, current) => 
      !slowest || current.duration > slowest.duration ? current : slowest, null as PerformanceResult | null
    );

    const summary = {
      totalOperations,
      passedOperations,
      failedOperations,
      averageTime,
      slowestOperation,
      overallPass: failedOperations === 0
    };

    return {
      summary,
      detailed: [...this.results]
    };
  }

  /**
   * Clear all collected results
   */
  static clearResults(): void {
    this.results = [];
  }

  /**
   * Get current memory usage (approximation)
   */
  private static getMemoryUsage(): number {
    // React Native/mobile environment approximation
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    
    // Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    // Fallback - return 0 if memory measurement unavailable
    return 0;
  }
}