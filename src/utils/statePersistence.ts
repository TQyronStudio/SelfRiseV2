import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSISTENCE_KEYS = {
  APP_STATE: '@selfrise_app_state',
  HABITS_STATE: '@selfrise_habits_state',
  GRATITUDE_STATE: '@selfrise_gratitude_state',
  GOALS_STATE: '@selfrise_goals_state',
} as const;

export interface PersistedState {
  timestamp: number;
  version: string;
  data: any;
}

export class StatePersistence {
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  static async saveState(key: keyof typeof PERSISTENCE_KEYS, data: any): Promise<void> {
    try {
      const persistedState: PersistedState = {
        timestamp: Date.now(),
        version: this.CURRENT_VERSION,
        data,
      };
      
      await AsyncStorage.setItem(
        PERSISTENCE_KEYS[key],
        JSON.stringify(persistedState)
      );
    } catch (error) {
      console.warn(`Failed to save state for ${key}:`, error);
    }
  }

  static async loadState<T>(key: keyof typeof PERSISTENCE_KEYS): Promise<T | null> {
    try {
      const storedData = await AsyncStorage.getItem(PERSISTENCE_KEYS[key]);
      
      if (!storedData) {
        return null;
      }

      const persistedState: PersistedState = JSON.parse(storedData);
      
      // Check if state is too old
      if (Date.now() - persistedState.timestamp > this.MAX_AGE) {
        await this.clearState(key);
        return null;
      }

      // Check version compatibility
      if (persistedState.version !== this.CURRENT_VERSION) {
        await this.clearState(key);
        return null;
      }

      return persistedState.data as T;
    } catch (error) {
      console.warn(`Failed to load state for ${key}:`, error);
      return null;
    }
  }

  static async clearState(key: keyof typeof PERSISTENCE_KEYS): Promise<void> {
    try {
      await AsyncStorage.removeItem(PERSISTENCE_KEYS[key]);
    } catch (error) {
      console.warn(`Failed to clear state for ${key}:`, error);
    }
  }

  static async clearAllStates(): Promise<void> {
    const promises = Object.keys(PERSISTENCE_KEYS).map(key =>
      this.clearState(key as keyof typeof PERSISTENCE_KEYS)
    );
    await Promise.all(promises);
  }

  static async getStorageSize(): Promise<number> {
    try {
      const keys = Object.values(PERSISTENCE_KEYS);
      let totalSize = 0;
      
      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.warn('Failed to calculate storage size:', error);
      return 0;
    }
  }
}