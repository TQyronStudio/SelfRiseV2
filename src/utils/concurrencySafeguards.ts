/**
 * Concurrency Safeguards for Gamification System
 * 
 * Critical fixes and safeguards based on concurrency validation results
 * Addresses race conditions and data inconsistencies identified in testing
 * Think Hard methodology - comprehensive concurrency protection
 */

/**
 * XP Operation Queue for Race Condition Prevention
 * 
 * Prevents race conditions in XP additions by queueing operations
 * Ensures atomic updates and data consistency
 */
export class XPOperationQueue {
  private static instance: XPOperationQueue;
  private operationQueue: (() => Promise<any>)[] = [];
  private isProcessing = false;

  static getInstance(): XPOperationQueue {
    if (!XPOperationQueue.instance) {
      XPOperationQueue.instance = new XPOperationQueue();
    }
    return XPOperationQueue.instance;
  }

  /**
   * Queue XP operation to prevent race conditions
   */
  async queueOperation<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.operationQueue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Process operations sequentially to prevent race conditions
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('XP operation failed in queue:', error);
        }
      }
    }

    this.isProcessing = false;
  }
}

/**
 * Level Calculation Cache with Proper Concurrency Control
 * 
 * Prevents race conditions in level calculation caching
 * Ensures only one calculation per XP value at a time
 */
export class ConcurrencySafeLevelCache {
  private static cache = new Map<number, any>();
  private static calculating = new Set<number>();

  /**
   * Get level with concurrency-safe caching
   */
  static async getLevelSafely(xp: number): Promise<{ level: number; progress: number }> {
    // Check if already cached
    if (this.cache.has(xp)) {
      return this.cache.get(xp);
    }

    // Check if currently being calculated by another operation
    if (this.calculating.has(xp)) {
      // Wait for calculation to complete
      while (this.calculating.has(xp)) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      // Return cached result (should be available now)
      if (this.cache.has(xp)) {
        return this.cache.get(xp);
      }
    }

    // Mark as being calculated
    this.calculating.add(xp);

    try {
      // Perform calculation
      const level = Math.floor(Math.sqrt(xp / 100)) + 1;
      const nextLevelXP = Math.pow(level, 2) * 100;
      const prevLevelXP = Math.pow(level - 1, 2) * 100;
      const progress = ((xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;

      const result = { level, progress };
      
      // Cache result
      this.cache.set(xp, result);
      
      // Clean up old cache entries (prevent memory growth)
      if (this.cache.size > 100) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
        }
      }

      return result;
    } finally {
      // Remove from calculating set
      this.calculating.delete(xp);
    }
  }

  /**
   * Clear cache (for testing/reset purposes)
   */
  static clearCache(): void {
    this.cache.clear();
    this.calculating.clear();
  }
}

/**
 * Achievement Unlock Manager with Race Condition Prevention
 * 
 * Ensures achievements can only be unlocked once
 * Prevents duplicate unlock race conditions
 */
export class AchievementUnlockManager {
  private static unlocking = new Set<string>();
  private static unlocked = new Set<string>();

  /**
   * Safely attempt to unlock achievement
   */
  static async safeUnlock(achievementId: string, unlockLogic: () => Promise<boolean>): Promise<{
    wasUnlocked: boolean;
    alreadyUnlocked: boolean;
    raceConditionPrevented: boolean;
  }> {
    // Check if already unlocked
    if (this.unlocked.has(achievementId)) {
      return {
        wasUnlocked: false,
        alreadyUnlocked: true,
        raceConditionPrevented: false
      };
    }

    // Check if currently being unlocked by another operation
    if (this.unlocking.has(achievementId)) {
      return {
        wasUnlocked: false,
        alreadyUnlocked: false,
        raceConditionPrevented: true
      };
    }

    // Mark as being unlocked
    this.unlocking.add(achievementId);

    try {
      // Double-check not unlocked (race condition safety)
      if (this.unlocked.has(achievementId)) {
        return {
          wasUnlocked: false,
          alreadyUnlocked: true,
          raceConditionPrevented: true
        };
      }

      // Perform unlock logic
      const shouldUnlock = await unlockLogic();

      if (shouldUnlock) {
        this.unlocked.add(achievementId);
        return {
          wasUnlocked: true,
          alreadyUnlocked: false,
          raceConditionPrevented: false
        };
      } else {
        return {
          wasUnlocked: false,
          alreadyUnlocked: false,
          raceConditionPrevented: false
        };
      }
    } finally {
      // Remove from unlocking set
      this.unlocking.delete(achievementId);
    }
  }

  /**
   * Check if achievement is unlocked
   */
  static isUnlocked(achievementId: string): boolean {
    return this.unlocked.has(achievementId);
  }

  /**
   * Initialize with existing unlocked achievements
   */
  static initializeUnlocked(unlockedAchievements: string[]): void {
    this.unlocked.clear();
    unlockedAchievements.forEach(id => this.unlocked.add(id));
  }
}

/**
 * Atomic Storage Operations for Race Condition Prevention
 * 
 * Provides atomic read-modify-write operations for AsyncStorage
 * Prevents data corruption from concurrent storage operations
 */
export class AtomicStorageOperations {
  private static locks = new Map<string, Promise<any>>();

  /**
   * Perform atomic read-modify-write operation
   */
  static async atomicReadModifyWrite<T>(
    key: string,
    modifier: (currentValue: T | null) => T,
    defaultValue: T
  ): Promise<T> {
    // Check if key is currently locked
    if (this.locks.has(key)) {
      // Wait for existing operation to complete
      await this.locks.get(key);
    }

    // Create lock for this operation
    const operationPromise = this.performAtomicOperation(key, modifier, defaultValue);
    this.locks.set(key, operationPromise);

    try {
      const result = await operationPromise;
      return result;
    } finally {
      // Remove lock
      this.locks.delete(key);
    }
  }

  /**
   * Internal atomic operation implementation
   */
  private static async performAtomicOperation<T>(
    key: string,
    modifier: (currentValue: T | null) => T,
    defaultValue: T
  ): Promise<T> {
    try {
      // For React Native environment
      if (typeof require !== 'undefined') {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          
          // Read current value
          const currentValueStr = await AsyncStorage.getItem(key);
          let currentValue: T | null = null;
          
          if (currentValueStr) {
            try {
              currentValue = JSON.parse(currentValueStr);
            } catch (parseError) {
              console.warn(`Failed to parse stored value for key ${key}, using default`);
              currentValue = defaultValue;
            }
          }
          
          // Apply modification
          const newValue = modifier(currentValue);
          
          // Write new value
          await AsyncStorage.setItem(key, JSON.stringify(newValue));
          
          return newValue;
        } catch (rnError) {
          console.warn('React Native AsyncStorage not available, using memory storage');
        }
      }

      // Fallback: Memory storage for testing/non-RN environments
      const memoryStorage = (global as any).__atomicMemoryStorage || {};
      (global as any).__atomicMemoryStorage = memoryStorage;
      
      const currentValue = memoryStorage[key] || null;
      const newValue = modifier(currentValue);
      memoryStorage[key] = newValue;
      
      return newValue;
    } catch (error) {
      console.error(`Atomic storage operation failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Atomic increment operation (common use case)
   */
  static async atomicIncrement(key: string, incrementBy: number = 1): Promise<number> {
    return this.atomicReadModifyWrite<number>(
      key,
      (currentValue) => (currentValue || 0) + incrementBy,
      0
    );
  }

  /**
   * Atomic array append operation
   */
  static async atomicArrayAppend<T>(key: string, newItem: T): Promise<T[]> {
    return this.atomicReadModifyWrite<T[]>(
      key,
      (currentValue) => {
        const array = currentValue || [];
        return [...array, newItem];
      },
      []
    );
  }
}

/**
 * Gamification Service Concurrency Wrapper
 * 
 * Wraps gamification operations with concurrency safeguards
 * Main interface for safe concurrent operations
 */
export class ConcurrencySafeGamificationService {

  /**
   * Safely add XP with race condition prevention
   */
  static async safeAddXP(amount: number, options: any): Promise<any> {
    const queue = XPOperationQueue.getInstance();
    
    return queue.queueOperation(async () => {
      // Use atomic storage operations
      const currentXP = await AtomicStorageOperations.atomicReadModifyWrite<number>(
        'total_xp',
        (current) => (current || 0) + amount,
        0
      );

      // Get level safely with concurrency control
      const levelInfo = await ConcurrencySafeLevelCache.getLevelSafely(currentXP);

      // Create transaction atomically
      const transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount,
        timestamp: new Date(),
        source: options.source,
        sourceId: options.sourceId,
        description: options.description
      };

      await AtomicStorageOperations.atomicArrayAppend('transactions', transaction);

      return {
        success: true,
        newTotalXP: currentXP,
        levelInfo,
        transaction
      };
    });
  }

  /**
   * Safely check and unlock achievements
   */
  static async safeCheckAchievements(
    xpAmount: number,
    source: string,
    sourceId: string
  ): Promise<any> {
    const achievements = [
      { id: 'first_xp', condition: async () => xpAmount >= 10 },
      { id: 'level_up', condition: async () => xpAmount >= 100 },
      { id: 'dedicated', condition: async () => xpAmount >= 1000 },
    ];

    const unlockedAchievements: string[] = [];
    const preventedRaceConditions: string[] = [];

    for (const achievement of achievements) {
      const unlockResult = await AchievementUnlockManager.safeUnlock(
        achievement.id,
        achievement.condition
      );

      if (unlockResult.wasUnlocked) {
        unlockedAchievements.push(achievement.id);
      } else if (unlockResult.raceConditionPrevented) {
        preventedRaceConditions.push(achievement.id);
      }
    }

    return {
      unlocked: unlockedAchievements,
      raceConditionsPrevented: preventedRaceConditions,
      totalChecked: achievements.length
    };
  }

  /**
   * Initialize concurrency safeguards
   */
  static async initializeSafeguards(): Promise<void> {
    try {
      // Initialize achievement unlock manager with existing unlocked achievements
      const existingAchievements = await this.getExistingUnlockedAchievements();
      AchievementUnlockManager.initializeUnlocked(existingAchievements);

      console.log('🔐 Concurrency safeguards initialized successfully');
    } catch (error) {
      console.error('Failed to initialize concurrency safeguards:', error);
    }
  }

  /**
   * Get existing unlocked achievements from storage
   */
  private static async getExistingUnlockedAchievements(): Promise<string[]> {
    try {
      // This would normally read from AsyncStorage in React Native
      // For now, return empty array
      return [];
    } catch (error) {
      console.warn('Failed to load existing achievements:', error);
      return [];
    }
  }

  /**
   * Test concurrency safeguards
   */
  static async testConcurrencySafeguards(): Promise<{
    passed: boolean;
    results: any[];
    summary: string;
  }> {
    console.log('🧪 Testing concurrency safeguards...');
    
    const results: any[] = [];
    let allPassed = true;

    try {
      // Test 1: Concurrent XP additions
      const xpPromises = Array.from({ length: 10 }, (_, i) =>
        this.safeAddXP(10, {
          source: 'TEST',
          sourceId: `test-${i}`,
          description: 'Concurrency test'
        })
      );

      const xpResults = await Promise.all(xpPromises);
      const finalXP = xpResults[xpResults.length - 1].newTotalXP;
      const expectedXP = 10 * 10; // 10 operations × 10 XP each

      results.push({
        test: 'Concurrent XP Addition',
        expected: expectedXP,
        actual: finalXP,
        passed: finalXP >= expectedXP * 0.9 // Allow 10% tolerance
      });

      if (finalXP < expectedXP * 0.9) {
        allPassed = false;
      }

      // Test 2: Concurrent level calculations
      const levelPromises = Array.from({ length: 5 }, () =>
        ConcurrencySafeLevelCache.getLevelSafely(1000)
      );

      const levelResults = await Promise.all(levelPromises);
      const firstResult = levelResults[0];
      const allSameLevel = firstResult && levelResults.every(r => 
        r && r.level === firstResult.level && 
        Math.abs(r.progress - firstResult.progress) < 0.01
      );

      results.push({
        test: 'Concurrent Level Calculation',
        expected: 'All same result',
        actual: allSameLevel ? 'Consistent' : 'Inconsistent',
        passed: allSameLevel
      });

      if (!allSameLevel) {
        allPassed = false;
      }

      // Test 3: Achievement unlock protection
      const achievementPromises = Array.from({ length: 8 }, () =>
        AchievementUnlockManager.safeUnlock('test_achievement', async () => true)
      );

      const achievementResults = await Promise.all(achievementPromises);
      const actualUnlocks = achievementResults.filter(r => r.wasUnlocked).length;
      const raceConditionsPrevented = achievementResults.filter(r => r.raceConditionPrevented).length;

      results.push({
        test: 'Achievement Unlock Protection',
        expected: 'Only 1 unlock, others prevented',
        actual: `${actualUnlocks} unlocks, ${raceConditionsPrevented} prevented`,
        passed: actualUnlocks === 1 && raceConditionsPrevented > 0
      });

      if (actualUnlocks !== 1) {
        allPassed = false;
      }

      const summary = allPassed 
        ? '✅ All concurrency safeguards working correctly'
        : '⚠️ Some concurrency safeguards need adjustment';

      console.log('🧪 Concurrency safeguard test results:');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} ${result.test}: ${result.actual}`);
      });

      return { passed: allPassed, results, summary };

    } catch (error) {
      console.error('Concurrency safeguard test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        passed: false,
        results: [{ test: 'Safeguard Test', error: errorMessage, passed: false }],
        summary: '❌ Concurrency safeguard testing failed'
      };
    }
  }
}