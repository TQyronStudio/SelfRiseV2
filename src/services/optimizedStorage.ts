// Optimized AsyncStorage layer with batching and compression
import AsyncStorage from '@react-native-async-storage/async-storage';

// ========================================
// INTERFACES & TYPES
// ========================================

interface StorageOperation {
  id: string;
  type: 'get' | 'set' | 'remove';
  key: string;
  value?: string;
  priority: 'high' | 'medium' | 'low';
  addedAt: number;
  retries: number;
  maxRetries: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

interface CompressionResult {
  data: string;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
}

// ========================================
// OPTIMIZED STORAGE CLASS
// ========================================

export class OptimizedStorage {
  private static operationQueue: StorageOperation[] = [];
  private static isProcessing = false;
  private static processingInterval: NodeJS.Timeout | null = null;
  private static readonly BATCH_INTERVAL_MS = 100; // 100ms batching window
  private static readonly MAX_OPERATIONS_PER_BATCH = 10;
  private static readonly COMPRESSION_THRESHOLD = 1000; // Compress if data > 1KB
  private static readonly MAX_RETRIES = 3;

  // Operation ID counter
  private static operationIdCounter = 0;

  /**
   * Get item with batching and decompression
   */
  static async getItem(key: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<string | null> {
    return new Promise<string | null>((resolve, reject) => {
      const operation: StorageOperation = {
        id: `get_${++this.operationIdCounter}`,
        type: 'get',
        key,
        priority,
        addedAt: Date.now(),
        retries: 0,
        maxRetries: this.MAX_RETRIES,
        resolve,
        reject,
      };

      this.addToQueue(operation);
    });
  }

  /**
   * Set item with batching and compression
   */
  static async setItem(key: string, value: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const operation: StorageOperation = {
        id: `set_${++this.operationIdCounter}`,
        type: 'set',
        key,
        value,
        priority,
        addedAt: Date.now(),
        retries: 0,
        maxRetries: this.MAX_RETRIES,
        resolve,
        reject,
      };

      this.addToQueue(operation);
    });
  }

  /**
   * Remove item with batching
   */
  static async removeItem(key: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const operation: StorageOperation = {
        id: `remove_${++this.operationIdCounter}`,
        type: 'remove',
        key,
        priority,
        addedAt: Date.now(),
        retries: 0,
        maxRetries: this.MAX_RETRIES,
        resolve,
        reject,
      };

      this.addToQueue(operation);
    });
  }

  /**
   * Multi-get with batching optimization
   */
  static async multiGet(keys: string[]): Promise<[string, string | null][]> {
    // For multi-get, execute immediately since it's already optimized
    try {
      const result = await AsyncStorage.multiGet(keys);
      
      // Decompress results if needed
      return result.map(([key, value]) => [
        key, 
        value ? this.decompress(value).data : null
      ]);
    } catch (error) {
      console.error('OptimizedStorage.multiGet error:', error);
      throw error;
    }
  }

  /**
   * Multi-set with compression
   */
  static async multiSet(keyValuePairs: [string, string][], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    try {
      // Compress large values
      const compressedPairs = keyValuePairs.map(([key, value]): [string, string] => {
        const compressed = this.compress(value);
        return [key, compressed.data];
      });

      await AsyncStorage.multiSet(compressedPairs);
      console.log(`💾 Multi-set ${keyValuePairs.length} items (priority: ${priority})`);
    } catch (error) {
      console.error('OptimizedStorage.multiSet error:', error);
      throw error;
    }
  }

  /**
   * Multi-remove
   */
  static async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
      console.log(`🗑️ Multi-removed ${keys.length} items`);
    } catch (error) {
      console.error('OptimizedStorage.multiRemove error:', error);
      throw error;
    }
  }

  // ========================================
  // BATCHING SYSTEM
  // ========================================

  /**
   * Add operation to queue
   */
  private static addToQueue(operation: StorageOperation): void {
    // Remove existing operation with same key and type
    this.operationQueue = this.operationQueue.filter(
      op => !(op.key === operation.key && op.type === operation.type)
    );

    this.operationQueue.push(operation);

    // Sort by priority and age
    this.operationQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.addedAt - b.addedAt;
    });

    this.startProcessing();
  }

  /**
   * Start processing queue
   */
  private static startProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processingInterval = setInterval(async () => {
      await this.processBatch();
    }, this.BATCH_INTERVAL_MS) as unknown as NodeJS.Timeout;
  }

  /**
   * Process a batch of operations
   */
  private static async processBatch(): Promise<void> {
    if (this.operationQueue.length === 0) {
      this.stopProcessing();
      return;
    }

    const batch = this.operationQueue.splice(0, this.MAX_OPERATIONS_PER_BATCH);
    const failedOperations: StorageOperation[] = [];

    // Group operations by type for optimization
    const getOps = batch.filter(op => op.type === 'get');
    const setOps = batch.filter(op => op.type === 'set');
    const removeOps = batch.filter(op => op.type === 'remove');

    // Process get operations with multiGet
    if (getOps.length > 0) {
      try {
        const keys = getOps.map(op => op.key);
        const results = await AsyncStorage.multiGet(keys);
        
        for (let i = 0; i < getOps.length; i++) {
          const operation = getOps[i];
          const [, value] = results[i] || [null, null];
          
          try {
            const decompressed = value ? this.decompress(value) : { data: null };
            operation?.resolve(decompressed.data);
          } catch (error) {
            operation?.reject(error);
          }
        }
        
        console.log(`📖 Batch processed ${getOps.length} GET operations`);
      } catch (error) {
        console.error('Batch GET error:', error);
        getOps.forEach(op => {
          if (op.retries < op.maxRetries) {
            op.retries++;
            failedOperations.push(op);
          } else {
            op.reject(error);
          }
        });
      }
    }

    // Process set operations with multiSet
    if (setOps.length > 0) {
      try {
        const keyValuePairs = setOps.map(op => {
          const compressed = this.compress(op.value!);
          return [op.key, compressed.data] as [string, string];
        });
        
        await AsyncStorage.multiSet(keyValuePairs);
        
        setOps.forEach(op => op.resolve(undefined));
        console.log(`💾 Batch processed ${setOps.length} SET operations`);
      } catch (error) {
        console.error('Batch SET error:', error);
        setOps.forEach(op => {
          if (op.retries < op.maxRetries) {
            op.retries++;
            failedOperations.push(op);
          } else {
            op.reject(error);
          }
        });
      }
    }

    // Process remove operations with multiRemove
    if (removeOps.length > 0) {
      try {
        const keys = removeOps.map(op => op.key);
        await AsyncStorage.multiRemove(keys);
        
        removeOps.forEach(op => op.resolve(undefined));
        console.log(`🗑️ Batch processed ${removeOps.length} REMOVE operations`);
      } catch (error) {
        console.error('Batch REMOVE error:', error);
        removeOps.forEach(op => {
          if (op.retries < op.maxRetries) {
            op.retries++;
            failedOperations.push(op);
          } else {
            op.reject(error);
          }
        });
      }
    }

    // Re-add failed operations to queue
    if (failedOperations.length > 0) {
      this.operationQueue.unshift(...failedOperations);
    }
  }

  /**
   * Stop processing queue
   */
  private static stopProcessing(): void {
    if (!this.isProcessing) return;

    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // ========================================
  // COMPRESSION SYSTEM
  // ========================================

  /**
   * Compress data if it exceeds threshold
   */
  private static compress(data: string): CompressionResult {
    const originalSize = data.length;
    
    if (originalSize < this.COMPRESSION_THRESHOLD) {
      return {
        data,
        compressed: false,
        originalSize,
        compressedSize: originalSize,
      };
    }

    try {
      // Simple run-length encoding for JSON data
      const compressed = this.simpleCompress(data);
      const compressedSize = compressed.length;
      
      // Only use compression if it actually reduces size
      if (compressedSize < originalSize * 0.9) { // 10% minimum reduction
        return {
          data: `__COMPRESSED__:${compressed}`,
          compressed: true,
          originalSize,
          compressedSize,
        };
      } else {
        return {
          data,
          compressed: false,
          originalSize,
          compressedSize: originalSize,
        };
      }
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return {
        data,
        compressed: false,
        originalSize,
        compressedSize: originalSize,
      };
    }
  }

  /**
   * Decompress data if it was compressed
   */
  private static decompress(data: string): CompressionResult {
    if (!data.startsWith('__COMPRESSED__:')) {
      return {
        data,
        compressed: false,
        originalSize: data.length,
        compressedSize: data.length,
      };
    }

    try {
      const compressedData = data.substring('__COMPRESSED__:'.length);
      const decompressed = this.simpleDecompress(compressedData);
      
      return {
        data: decompressed,
        compressed: true,
        originalSize: decompressed.length,
        compressedSize: data.length,
      };
    } catch (error) {
      console.error('Decompression failed:', error);
      throw new Error(`Failed to decompress data: ${error}`);
    }
  }

  /**
   * Simple compression algorithm for JSON strings
   */
  private static simpleCompress(str: string): string {
    // Replace common JSON patterns with shorter codes
    const replacements = [
      ['":', '@1'],
      [',"', '@2'],
      ['{"', '@3'],
      ['"}', '@4'],
      ['true', '@5'],
      ['false', '@6'],
      ['null', '@7'],
      ['[]', '@8'],
      ['{}', '@9'],
    ];
    
    let compressed = str;
    for (const [pattern, code] of replacements) {
      if (pattern) {
        compressed = compressed.split(pattern).join(code);
      }
    }
    
    return compressed;
  }

  /**
   * Simple decompression algorithm
   */
  private static simpleDecompress(str: string): string {
    const replacements = [
      ['@1', '":'],
      ['@2', ',"'],
      ['@3', '{"'],
      ['@4', '"}'],
      ['@5', 'true'],
      ['@6', 'false'],
      ['@7', 'null'],
      ['@8', '[]'],
      ['@9', '{}'],
    ];
    
    let decompressed = str;
    for (const [code, pattern] of replacements) {
      if (code) {
        decompressed = decompressed.split(code).join(pattern);
      }
    }
    
    return decompressed;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get queue status for debugging
   */
  static getQueueStatus(): {
    queueSize: number;
    isProcessing: boolean;
    highPriorityOps: number;
    mediumPriorityOps: number;
    lowPriorityOps: number;
  } {
    const opsByPriority = {
      high: this.operationQueue.filter(op => op.priority === 'high').length,
      medium: this.operationQueue.filter(op => op.priority === 'medium').length,
      low: this.operationQueue.filter(op => op.priority === 'low').length,
    };

    return {
      queueSize: this.operationQueue.length,
      isProcessing: this.isProcessing,
      highPriorityOps: opsByPriority.high,
      mediumPriorityOps: opsByPriority.medium,
      lowPriorityOps: opsByPriority.low,
    };
  }

  /**
   * Force flush all pending operations
   */
  static async flushAll(): Promise<void> {
    while (this.operationQueue.length > 0 && this.isProcessing) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Clear all pending operations
   */
  static clearQueue(): void {
    this.operationQueue.forEach(op => {
      op.reject(new Error('Operation cancelled due to queue clear'));
    });
    this.operationQueue = [];
    this.stopProcessing();
  }
}

// ========================================
// CONVENIENCE FUNCTIONS
// ========================================

/**
 * Drop-in replacement for AsyncStorage with optimization
 */
export const AsyncStorageOptimized = {
  getItem: (key: string) => OptimizedStorage.getItem(key, 'medium'),
  setItem: (key: string, value: string) => OptimizedStorage.setItem(key, value, 'medium'),
  removeItem: (key: string) => OptimizedStorage.removeItem(key, 'medium'),
  multiGet: (keys: string[]) => OptimizedStorage.multiGet(keys),
  multiSet: (pairs: [string, string][]) => OptimizedStorage.multiSet(pairs, 'medium'),
  multiRemove: (keys: string[]) => OptimizedStorage.multiRemove(keys),
  
  // High priority versions
  getItemHighPriority: (key: string) => OptimizedStorage.getItem(key, 'high'),
  setItemHighPriority: (key: string, value: string) => OptimizedStorage.setItem(key, value, 'high'),
  removeItemHighPriority: (key: string) => OptimizedStorage.removeItem(key, 'high'),
  
  // Low priority versions  
  getItemLowPriority: (key: string) => OptimizedStorage.getItem(key, 'low'),
  setItemLowPriority: (key: string, value: string) => OptimizedStorage.setItem(key, value, 'low'),
  removeItemLowPriority: (key: string) => OptimizedStorage.removeItem(key, 'low'),
};