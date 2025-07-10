import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateToString } from './date';

const LAST_RESET_KEY = 'habitTracker:lastReset';

export class HabitResetUtils {
  /**
   * Get the last reset date from storage
   */
  static async getLastResetDate(): Promise<string | null> {
    try {
      const lastReset = await AsyncStorage.getItem(LAST_RESET_KEY);
      return lastReset;
    } catch (error) {
      console.error('Failed to get last reset date:', error);
      return null;
    }
  }

  /**
   * Set the last reset date in storage
   */
  static async setLastResetDate(date: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_RESET_KEY, date);
    } catch (error) {
      console.error('Failed to set last reset date:', error);
    }
  }

  /**
   * Check if habits need to be reset (new day)
   */
  static async shouldResetHabits(): Promise<boolean> {
    try {
      const lastReset = await this.getLastResetDate();
      const today = formatDateToString(new Date());
      
      // If no last reset date, or if it's a new day, reset is needed
      return !lastReset || lastReset !== today;
    } catch (error) {
      console.error('Failed to check if reset is needed:', error);
      return false;
    }
  }

  /**
   * Perform daily habit reset
   */
  static async performDailyReset(): Promise<void> {
    try {
      const today = formatDateToString(new Date());
      
      // Mark today as the last reset date
      await this.setLastResetDate(today);
      
      // Log reset for debugging
      console.log('Daily habit reset performed for:', today);
    } catch (error) {
      console.error('Failed to perform daily reset:', error);
    }
  }

  /**
   * Initialize habit reset system
   * This should be called when the app starts
   */
  static async initializeResetSystem(): Promise<void> {
    try {
      const shouldReset = await this.shouldResetHabits();
      
      if (shouldReset) {
        await this.performDailyReset();
      }
    } catch (error) {
      console.error('Failed to initialize reset system:', error);
    }
  }

  /**
   * Check if a date is today
   */
  static isToday(date: string): boolean {
    const today = formatDateToString(new Date());
    return date === today;
  }

  /**
   * Check if a date is yesterday
   */
  static isYesterday(date: string): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateToString(yesterday);
    return date === yesterdayStr;
  }

  /**
   * Get the number of days since a date
   */
  static getDaysSince(date: string): number {
    try {
      const targetDate = new Date(date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - targetDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Failed to calculate days since:', error);
      return 0;
    }
  }

  /**
   * Clear all reset data (for testing purposes)
   */
  static async clearResetData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LAST_RESET_KEY);
      console.log('Habit reset data cleared');
    } catch (error) {
      console.error('Failed to clear reset data:', error);
    }
  }
}