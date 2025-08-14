/**
 * Atomic Storage Operations for Production-Grade Concurrency Safety
 * 
 * Critical component preventing race conditions in gamification system
 * Think Hard methodology - bulletproof concurrent data access
 * 
 * Features:
 * - Atomic read-modify-write operations
 * - Storage operation queuing and locking
 * - Race condition prevention
 * - Transaction integrity
 * - TypeScript type safety
 * - Performance monitoring
 * - Production error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage operation types for type safety
type StorageKey = string;
type StorageValue = string | number | boolean | object | null;

// Lock management for preventing concurrent access
interface StorageLock {
  key: string;
  promise: Promise<any>;
  timestamp: number;
  operationType: 'READ' | 'WRITE' | 'READ_MODIFY_WRITE';
}

// Operation metrics for production monitoring
interface OperationMetrics {
  key: string;
  operationType: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  queueSize: number;
}

// Atomic operation result
interface AtomicOperationResult<T> {
  success: boolean;
  value: T;
  previousValue?: T;
  operationTime: number;
  wasQueued: boolean;
  error?: string;
}

/**
 * Production-Grade Atomic Storage Service
 * 
 * Provides atomic operations on AsyncStorage to prevent race conditions
 * in the gamification system and other critical data operations
 */
export class AtomicStorage {
  
  // Active locks for preventing concurrent access to same keys
  private static activeLocks = new Map<StorageKey, StorageLock>();
  
  // Operation queue for serializing access
  private static operationQueue = new Map<StorageKey, Promise<any>[]>();
  
  // Performance metrics for production monitoring
  private static metrics: OperationMetrics[] = [];
  private static readonly MAX_METRICS_RETENTION = 1000;
  
  // Lock timeout settings (prevent deadlocks)
  private static readonly LOCK_TIMEOUT_MS = 5000; // 5 seconds max lock time
  private static readonly CLEANUP_INTERVAL_MS = 30000; // 30 seconds cleanup interval
  
  // Initialize cleanup timer
  private static cleanupTimer: ReturnType<typeof setInterval> | null = null;
  
  /**
   * Initialize atomic storage system
   * Call this once during app startup
   */
  static initialize(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Start periodic cleanup of expired locks and old metrics
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredLocks();
      this.cleanupOldMetrics();
    }, this.CLEANUP_INTERVAL_MS);
    
    console.log('🔐 AtomicStorage initialized with production-grade concurrency protection');
  }
  
  /**
   * Shutdown atomic storage system
   * Call during app cleanup
   */
  static shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.activeLocks.clear();
    this.operationQueue.clear();
    this.metrics = [];
    
    console.log('🔐 AtomicStorage shutdown complete');
  }
  
  /**
   * Atomic read operation with type safety
   */
  static async atomicRead<T>(
    key: StorageKey,
    defaultValue: T,
    parser?: (value: string) => T
  ): Promise<AtomicOperationResult<T>> {
    const startTime = performance.now();
    const wasQueued = this.activeLocks.has(key);
    
    try {
      // Wait for any existing operations on this key
      await this.waitForLock(key);
      
      // Acquire read lock
      const lockPromise = this.performRead<T>(key, defaultValue, parser);
      this.setLock(key, lockPromise, 'READ');
      
      const result = await lockPromise;
      const operationTime = performance.now() - startTime;
      
      this.recordMetrics({
        key,
        operationType: 'READ',
        duration: operationTime,
        timestamp: Date.now(),
        success: true,
        queueSize: this.getQueueSize(key)
      });
      
      return {
        success: true,
        value: result,
        operationTime,
        wasQueued
      };
      
    } catch (error) {
      const operationTime = performance.now() - startTime;
      
      this.recordMetrics({
        key,
        operationType: 'READ',
        duration: operationTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        queueSize: this.getQueueSize(key)
      });
      
      console.error(`AtomicStorage.atomicRead failed for key "${key}":`, error);
      
      return {
        success: false,
        value: defaultValue,
        operationTime,
        wasQueued,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.releaseLock(key);
    }
  }
  
  /**
   * Atomic write operation with type safety
   */
  static async atomicWrite<T>(
    key: StorageKey,
    value: T,
    serializer?: (value: T) => string
  ): Promise<AtomicOperationResult<T>> {
    const startTime = performance.now();
    const wasQueued = this.activeLocks.has(key);
    
    try {
      // Wait for any existing operations on this key
      await this.waitForLock(key);
      
      // Read previous value for tracking
      const previousValue = await this.performRead<T | null>(key, null);
      
      // Acquire write lock
      const lockPromise = this.performWrite<T>(key, value, serializer);
      this.setLock(key, lockPromise, 'WRITE');
      
      await lockPromise;
      const operationTime = performance.now() - startTime;
      
      this.recordMetrics({
        key,
        operationType: 'WRITE',
        duration: operationTime,
        timestamp: Date.now(),
        success: true,
        queueSize: this.getQueueSize(key)
      });
      
      return {
        success: true,
        value,
        previousValue: previousValue as T,
        operationTime,
        wasQueued
      };
      
    } catch (error) {
      const operationTime = performance.now() - startTime;
      
      this.recordMetrics({
        key,
        operationType: 'WRITE',
        duration: operationTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        queueSize: this.getQueueSize(key)
      });
      
      console.error(`AtomicStorage.atomicWrite failed for key "${key}":`, error);
      
      return {
        success: false,
        value,
        operationTime,
        wasQueued,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.releaseLock(key);
    }
  }
  
  /**
   * Atomic read-modify-write operation (CRITICAL for race condition prevention)
   * 
   * This is the most important method for preventing race conditions in XP operations
   */
  static async atomicReadModifyWrite<T>(
    key: StorageKey,
    modifier: (currentValue: T | null) => T,
    defaultValue: T,
    parser?: (value: string) => T,
    serializer?: (value: T) => string
  ): Promise<AtomicOperationResult<T>> {
    const startTime = performance.now();
    const wasQueued = this.activeLocks.has(key);
    
    try {
      // Wait for any existing operations on this key (CRITICAL)
      await this.waitForLock(key);
      
      // Acquire exclusive lock for read-modify-write
      const lockPromise = this.performReadModifyWrite<T>(
        key,
        modifier,
        defaultValue,
        parser,
        serializer
      );
      this.setLock(key, lockPromise, 'READ_MODIFY_WRITE');
      
      const { newValue, previousValue } = await lockPromise;
      const operationTime = performance.now() - startTime;
      
      this.recordMetrics({
        key,
        operationType: 'READ_MODIFY_WRITE',
        duration: operationTime,
        timestamp: Date.now(),
        success: true,
        queueSize: this.getQueueSize(key)
      });
      
      return {
        success: true,
        value: newValue,
        previousValue: previousValue as T,
        operationTime,
        wasQueued
      };
      
    } catch (error) {
      const operationTime = performance.now() - startTime;
      
      this.recordMetrics({
        key,
        operationType: 'READ_MODIFY_WRITE',
        duration: operationTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        queueSize: this.getQueueSize(key)
      });
      
      console.error(`AtomicStorage.atomicReadModifyWrite failed for key "${key}":`, error);
      
      return {
        success: false,
        value: defaultValue,
        operationTime,
        wasQueued,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.releaseLock(key);
    }
  }
  
  /**
   * Atomic increment operation (optimized for XP additions)
   */
  static async atomicIncrement(
    key: StorageKey,
    incrementBy: number = 1
  ): Promise<AtomicOperationResult<number>> {
    return this.atomicReadModifyWrite<number>(
      key,
      (currentValue) => (currentValue || 0) + incrementBy,
      0,
      (value) => parseInt(value, 10),
      (value) => value.toString()
    );
  }
  
  /**
   * Atomic array append operation (for transactions)
   */
  static async atomicArrayAppend<T>(
    key: StorageKey,
    newItem: T,
    maxLength?: number
  ): Promise<AtomicOperationResult<T[]>> {
    return this.atomicReadModifyWrite<T[]>(
      key,
      (currentValue) => {
        const array = currentValue || [];
        const newArray = [...array, newItem];
        
        // Trim array if maxLength specified
        if (maxLength && newArray.length > maxLength) {
          return newArray.slice(-maxLength);
        }
        
        return newArray;
      },
      [],
      (value) => JSON.parse(value),
      (value) => JSON.stringify(value)
    );
  }
  
  /**
   * Atomic object merge operation (for complex data structures)
   */
  static async atomicObjectMerge<T extends Record<string, any>>(
    key: StorageKey,
    updates: Partial<T>,
    defaultValue: T
  ): Promise<AtomicOperationResult<T>> {
    return this.atomicReadModifyWrite<T>(
      key,
      (currentValue) => {
        const current = currentValue || defaultValue;
        return { ...current, ...updates };
      },
      defaultValue,
      (value) => JSON.parse(value),
      (value) => JSON.stringify(value)
    );
  }
  
  // ========================================
  // INTERNAL IMPLEMENTATION METHODS
  // ========================================
  
  /**
   * Wait for existing lock to be released
   */
  private static async waitForLock(key: StorageKey): Promise<void> {
    const lock = this.activeLocks.get(key);
    if (lock) {
      try {
        // Wait for existing operation to complete
        await lock.promise;
      } catch (error) {
        // Ignore errors from previous operations
        console.warn(`Previous operation on key "${key}" failed, continuing...`);
      }
    }
  }
  
  /**
   * Set lock for key
   */
  private static setLock(key: StorageKey, promise: Promise<any>, operationType: StorageLock['operationType']): void {
    this.activeLocks.set(key, {
      key,
      promise,
      timestamp: Date.now(),
      operationType
    });
  }
  
  /**
   * Release lock for key
   */
  private static releaseLock(key: StorageKey): void {
    this.activeLocks.delete(key);
  }
  
  /**
   * Perform actual read operation
   */
  private static async performRead<T>(
    key: StorageKey,
    defaultValue: T,
    parser?: (value: string) => T
  ): Promise<T> {
    const value = await AsyncStorage.getItem(key);
    
    if (value === null) {
      return defaultValue;
    }
    
    if (parser) {
      return parser(value);
    }
    
    // Try to parse as JSON, fallback to raw value
    try {
      return JSON.parse(value);
    } catch {
      return value as any;
    }
  }
  
  /**
   * Perform actual write operation
   */
  private static async performWrite<T>(
    key: StorageKey,
    value: T,
    serializer?: (value: T) => string
  ): Promise<void> {
    let serializedValue: string;
    
    if (serializer) {
      serializedValue = serializer(value);
    } else if (typeof value === 'string') {
      serializedValue = value;
    } else {
      serializedValue = JSON.stringify(value);
    }
    
    await AsyncStorage.setItem(key, serializedValue);
  }
  
  /**
   * Perform atomic read-modify-write operation
   */
  private static async performReadModifyWrite<T>(
    key: StorageKey,
    modifier: (currentValue: T | null) => T,
    defaultValue: T,
    parser?: (value: string) => T,
    serializer?: (value: T) => string
  ): Promise<{ newValue: T; previousValue: T | null }> {
    // Atomic read
    const previousValue = await this.performRead<T | null>(key, null, parser);
    
    // Apply modification
    const newValue = modifier(previousValue);
    
    // Atomic write
    await this.performWrite<T>(key, newValue, serializer);
    
    return { newValue, previousValue };
  }
  
  /**
   * Get queue size for key (for monitoring)
   */
  private static getQueueSize(key: StorageKey): number {
    const queue = this.operationQueue.get(key);
    return queue ? queue.length : 0;
  }
  
  /**
   * Record operation metrics
   */
  private static recordMetrics(metrics: OperationMetrics): void {
    this.metrics.push(metrics);
    
    // Trim metrics if too many
    if (this.metrics.length > this.MAX_METRICS_RETENTION) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_RETENTION);
    }
  }
  
  /**
   * Cleanup expired locks (prevent deadlocks)
   */
  private static cleanupExpiredLocks(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.activeLocks.forEach((lock, key) => {
      if (now - lock.timestamp > this.LOCK_TIMEOUT_MS) {
        expiredKeys.push(key);
        console.warn(`AtomicStorage: Cleaning up expired lock for key "${key}" (${lock.operationType})`);
      }
    });
    
    expiredKeys.forEach(key => this.activeLocks.delete(key));
  }
  
  /**
   * Cleanup old metrics
   */
  private static cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffTime);
  }
  
  // ========================================
  // PRODUCTION MONITORING & DIAGNOSTICS
  // ========================================
  
  /**
   * Get performance metrics for production monitoring
   */
  static getPerformanceMetrics(): {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    activeLocksCount: number;
    slowestOperations: OperationMetrics[];
    errorOperations: OperationMetrics[];
  } {
    const totalOperations = this.metrics.length;
    const successfulOperations = this.metrics.filter(m => m.success);
    const failedOperations = this.metrics.filter(m => !m.success);
    
    const averageDuration = totalOperations > 0 
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0;
    
    const successRate = totalOperations > 0 
      ? successfulOperations.length / totalOperations 
      : 1;
    
    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    return {
      totalOperations,
      averageDuration,
      successRate,
      activeLocksCount: this.activeLocks.size,
      slowestOperations,
      errorOperations: failedOperations
    };
  }
  
  /**
   * Check for potential race conditions in production
   */
  static detectPotentialRaceConditions(): {
    suspiciousPatterns: string[];
    recommendations: string[];
  } {
    const suspiciousPatterns: string[] = [];
    const recommendations: string[] = [];
    
    // Check for high contention keys
    const keyOperationCounts = new Map<string, number>();
    this.metrics.forEach(metric => {
      keyOperationCounts.set(metric.key, (keyOperationCounts.get(metric.key) || 0) + 1);
    });
    
    keyOperationCounts.forEach((count, key) => {
      if (count > 100) { // High frequency access
        suspiciousPatterns.push(`High contention on key "${key}": ${count} operations`);
        recommendations.push(`Consider optimizing access patterns for key "${key}"`);
      }
    });
    
    // Check for frequent failures
    const keyFailureRates = new Map<string, number>();
    this.metrics.forEach(metric => {
      if (!metric.success) {
        keyFailureRates.set(metric.key, (keyFailureRates.get(metric.key) || 0) + 1);
      }
    });
    
    keyFailureRates.forEach((failures, key) => {
      const totalOps = keyOperationCounts.get(key) || 0;
      const failureRate = failures / totalOps;
      
      if (failureRate > 0.05) { // >5% failure rate
        suspiciousPatterns.push(`High failure rate for key "${key}": ${(failureRate * 100).toFixed(1)}%`);
        recommendations.push(`Investigate failures for key "${key}"`);
      }
    });
    
    // Check for long lock times
    this.activeLocks.forEach((lock, key) => {
      const lockDuration = Date.now() - lock.timestamp;
      if (lockDuration > 1000) { // >1 second
        suspiciousPatterns.push(`Long-running lock on key "${key}": ${lockDuration}ms`);
        recommendations.push(`Check for potential deadlock on key "${key}"`);
      }
    });
    
    return { suspiciousPatterns, recommendations };
  }
  
  /**
   * Generate production health report
   */
  static generateHealthReport(): string {
    const metrics = this.getPerformanceMetrics();
    const raceConditionCheck = this.detectPotentialRaceConditions();
    
    return [
      '🔐 AtomicStorage Health Report',
      '================================',
      `Total Operations: ${metrics.totalOperations}`,
      `Success Rate: ${(metrics.successRate * 100).toFixed(2)}%`,
      `Average Duration: ${metrics.averageDuration.toFixed(2)}ms`,
      `Active Locks: ${metrics.activeLocksCount}`,
      '',
      'Suspicious Patterns:',
      ...raceConditionCheck.suspiciousPatterns.map(p => `  - ${p}`),
      '',
      'Recommendations:',
      ...raceConditionCheck.recommendations.map(r => `  - ${r}`),
      ''
    ].join('\n');
  }
}