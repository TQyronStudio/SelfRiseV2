// Weekly Challenge System Cleanup Service
// Removes all Weekly Challenge AsyncStorage data

import AsyncStorage from '@react-native-async-storage/async-storage';

// Weekly Challenge AsyncStorage keys to be removed
const WEEKLY_CHALLENGE_STORAGE_KEYS = [
  'weekly_challenges_active',
  'weekly_challenges_progress', 
  'weekly_challenges_history',
  'weekly_challenges_user_level_cache',
  'weekly_challenges_generation_data',
] as const;

export class WeeklyChallengeCleanupService {
  /**
   * Remove all Weekly Challenge data from AsyncStorage
   * This is a one-time cleanup operation for migration to Monthly Challenges
   */
  static async cleanupWeeklyChallengeData(): Promise<void> {
    try {
      console.log('🧹 Starting Weekly Challenge data cleanup...');
      
      // Remove all Weekly Challenge keys
      const removalPromises = WEEKLY_CHALLENGE_STORAGE_KEYS.map(async (key) => {
        try {
          await AsyncStorage.removeItem(key);
          console.log(`🗑️ Removed: ${key}`);
          return { key, success: true };
        } catch (error) {
          console.error(`❌ Failed to remove ${key}:`, error);
          return { key, success: false, error };
        }
      });
      
      const results = await Promise.allSettled(removalPromises);
      const successCount = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      ).length;
      
      console.log(`✅ Weekly Challenge cleanup completed: ${successCount}/${WEEKLY_CHALLENGE_STORAGE_KEYS.length} keys removed`);
      
      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected' || 
           (result.status === 'fulfilled' && !result.value.success)) {
          console.warn(`⚠️ Issue with key ${WEEKLY_CHALLENGE_STORAGE_KEYS[index]}`);
        }
      });
      
    } catch (error) {
      console.error('❌ Weekly Challenge cleanup failed:', error);
      throw error;
    }
  }
  
  /**
   * Check if Weekly Challenge data exists in storage
   */
  static async hasWeeklyChallengeData(): Promise<boolean> {
    try {
      for (const key of WEEKLY_CHALLENGE_STORAGE_KEYS) {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking Weekly Challenge data:', error);
      return false;
    }
  }
  
  /**
   * Get info about existing Weekly Challenge data
   */
  static async getWeeklyChallengeDataInfo(): Promise<Record<string, boolean>> {
    const info: Record<string, boolean> = {};
    
    try {
      for (const key of WEEKLY_CHALLENGE_STORAGE_KEYS) {
        const value = await AsyncStorage.getItem(key);
        info[key] = value !== null;
      }
    } catch (error) {
      console.error('Error getting Weekly Challenge data info:', error);
    }
    
    return info;
  }
}

export default WeeklyChallengeCleanupService;