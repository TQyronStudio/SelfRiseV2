import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseEntity } from '../../types/common';

// Storage keys constants
export const STORAGE_KEYS = {
  HABITS: 'habits',
  HABIT_COMPLETIONS: 'habit_completions',
  GRATITUDES: 'gratitudes',
  GRATITUDE_STREAK: 'gratitude_streak',
  GOALS: 'goals',
  GOAL_PROGRESS: 'goal_progress',
  USER: 'user',
  USER_SETTINGS: 'user_settings',
  APP_VERSION: 'app_version',
  MIGRATION_VERSION: 'migration_version',
} as const;

// Storage version for migrations
export const CURRENT_STORAGE_VERSION = '1.0.0';
export const CURRENT_MIGRATION_VERSION = 1;

// Generic storage operations
export class BaseStorage {
  private static async serialize<T>(data: T): Promise<string> {
    try {
      return JSON.stringify(data, (key, value) => {
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      });
    } catch (error) {
      throw new Error(`Failed to serialize data: ${error}`);
    }
  }

  private static async deserialize<T>(jsonString: string): Promise<T> {
    try {
      return JSON.parse(jsonString, (key, value) => {
        // Restore Date objects from ISO strings
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });
    } catch (error) {
      throw new Error(`Failed to deserialize data: ${error}`);
    }
  }

  // Get data from storage
  static async get<T>(key: string): Promise<T | null> {
    try {
      const jsonString = await AsyncStorage.getItem(key);
      if (jsonString === null) {
        return null;
      }
      return await this.deserialize<T>(jsonString);
    } catch (error) {
      console.error(`Failed to get data for key ${key}:`, error);
      throw new Error(`Storage get operation failed: ${error}`);
    }
  }

  // Set data in storage
  static async set<T>(key: string, data: T): Promise<void> {
    try {
      const jsonString = await this.serialize(data);
      await AsyncStorage.setItem(key, jsonString);
    } catch (error) {
      console.error(`Failed to set data for key ${key}:`, error);
      throw new Error(`Storage set operation failed: ${error}`);
    }
  }

  // Remove data from storage
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove data for key ${key}:`, error);
      throw new Error(`Storage remove operation failed: ${error}`);
    }
  }

  // Clear all data
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error(`Storage clear operation failed: ${error}`);
    }
  }

  // Get all keys
  static async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Failed to get all keys:', error);
      throw new Error(`Storage getAllKeys operation failed: ${error}`);
    }
  }

  // Get multiple items
  static async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Failed to get multiple items:', error);
      throw new Error(`Storage multiGet operation failed: ${error}`);
    }
  }

  // Set multiple items
  static async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Failed to set multiple items:', error);
      throw new Error(`Storage multiSet operation failed: ${error}`);
    }
  }

  // Remove multiple items
  static async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to remove multiple items:', error);
      throw new Error(`Storage multiRemove operation failed: ${error}`);
    }
  }

  // Check if storage is available
  static async isAvailable(): Promise<boolean> {
    try {
      const testKey = '__storage_test__';
      const testValue = 'test';
      await AsyncStorage.setItem(testKey, testValue);
      const retrieved = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      return retrieved === testValue;
    } catch (error) {
      console.error('Storage availability check failed:', error);
      return false;
    }
  }

  // Get storage size information
  static async getStorageSize(): Promise<{ used: number; total: number } | null> {
    try {
      // Note: AsyncStorage doesn't provide native size info
      // This is an approximation based on stored data
      const allKeys = await this.getAllKeys();
      const allData = await this.multiGet(allKeys);
      
      let totalSize = 0;
      allData.forEach(([key, value]) => {
        if (value) {
          totalSize += key.length + value.length;
        }
      });

      return {
        used: totalSize,
        total: -1, // Unknown for AsyncStorage
      };
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return null;
    }
  }
}

// Entity storage interface
export interface EntityStorage<T extends BaseEntity> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  count(): Promise<number>;
}

// Storage error types
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly key?: string
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export const STORAGE_ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  SERIALIZATION_FAILED: 'SERIALIZATION_FAILED',
  DESERIALIZATION_FAILED: 'DESERIALIZATION_FAILED',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  UNKNOWN: 'UNKNOWN',
} as const;