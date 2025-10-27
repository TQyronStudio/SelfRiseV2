/**
 * Notification Scheduler
 *
 * Handles scheduling of smart notifications based on user progress
 * - Afternoon reminders: Generic motivational messages
 * - Evening reminders: Smart contextual messages based on incomplete tasks
 */

import { notificationService } from './notificationService';
import {
  NotificationCategory,
  NotificationSettings,
  DailyTaskProgress,
  SmartNotificationContent,
  NotificationPriority,
} from '../../types/notification';
import { BaseStorage, STORAGE_KEYS } from '../storage/base';

// Storage key for notification preferences
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

// Notification identifiers
const NOTIFICATION_IDS = {
  AFTERNOON: 'daily_afternoon_reminder',
  EVENING: 'daily_evening_reminder',
};

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettings = {
  afternoonReminderEnabled: false, // OFF by default (user opts in)
  afternoonReminderTime: '16:00',
  eveningReminderEnabled: false, // OFF by default (user opts in)
  eveningReminderTime: '20:00',
};

// Afternoon reminder message variants (rotate randomly)
const AFTERNOON_MESSAGES = [
  {
    title: 'SelfRise Check-in ☀️',
    body: "How's your day going? Don't forget your goals and habits! 🚀",
  },
  {
    title: 'Afternoon Motivation 💪',
    body: "You still have time! Check your habits and goals 💪",
  },
  {
    title: 'Progress Time 🎯',
    body: "Afternoon check-in: How are you doing with your goals? 🎯",
  },
  {
    title: 'Micro-win Moment ✨',
    body: "Time for a micro-win! Can you complete one more habit? 🏃‍♂️",
  },
];

class NotificationScheduler {
  private static instance: NotificationScheduler;

  private constructor() {}

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  // ========================================
  // SETTINGS MANAGEMENT
  // ========================================

  /**
   * Get notification settings from storage
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const settings = await BaseStorage.get<NotificationSettings>(NOTIFICATION_SETTINGS_KEY);
      return settings || DEFAULT_SETTINGS;
    } catch (error) {
      console.error('[NotificationScheduler] Failed to get settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save notification settings to storage
   */
  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await BaseStorage.set(NOTIFICATION_SETTINGS_KEY, settings);
      console.log('[NotificationScheduler] Settings saved:', settings);
    } catch (error) {
      console.error('[NotificationScheduler] Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(updates: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        ...updates,
      };
      await this.saveSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('[NotificationScheduler] Failed to update settings:', error);
      throw error;
    }
  }

  // ========================================
  // NOTIFICATION SCHEDULING
  // ========================================

  /**
   * Schedule afternoon reminder (generic motivational)
   */
  async scheduleAfternoonReminder(enabled: boolean, time: string): Promise<void> {
    try {
      if (!enabled) {
        await notificationService.cancelNotification(NOTIFICATION_IDS.AFTERNOON);
        console.log('[NotificationScheduler] Afternoon reminder disabled');
        return;
      }

      // Parse time
      const { hour, minute } = notificationService.parseTime(time);

      // Get random message
      const message = this.getRandomAfternoonMessage();

      // Schedule notification
      await notificationService.scheduleDailyNotification(
        NOTIFICATION_IDS.AFTERNOON,
        message.title,
        message.body,
        hour,
        minute,
        NotificationCategory.AFTERNOON_REMINDER
      );

      console.log('[NotificationScheduler] Afternoon reminder scheduled:', { time, message });
    } catch (error) {
      console.error('[NotificationScheduler] Failed to schedule afternoon reminder:', error);
      throw error;
    }
  }

  /**
   * Schedule evening reminder (smart contextual)
   */
  async scheduleEveningReminder(
    enabled: boolean,
    time: string,
    progress?: DailyTaskProgress
  ): Promise<void> {
    try {
      if (!enabled) {
        await notificationService.cancelNotification(NOTIFICATION_IDS.EVENING);
        console.log('[NotificationScheduler] Evening reminder disabled');
        return;
      }

      // Parse time
      const { hour, minute } = notificationService.parseTime(time);

      // Generate smart message based on progress
      const message = progress
        ? this.generateSmartEveningMessage(progress)
        : this.getFallbackEveningMessage();

      // If all tasks complete, don't send notification (user earned rest)
      if (!message) {
        await notificationService.cancelNotification(NOTIFICATION_IDS.EVENING);
        console.log('[NotificationScheduler] All tasks complete - no evening notification');
        return;
      }

      // Schedule notification
      await notificationService.scheduleDailyNotification(
        NOTIFICATION_IDS.EVENING,
        message.title,
        message.body,
        hour,
        minute,
        NotificationCategory.EVENING_REMINDER
      );

      console.log('[NotificationScheduler] Evening reminder scheduled:', { time, message });
    } catch (error) {
      console.error('[NotificationScheduler] Failed to schedule evening reminder:', error);
      throw error;
    }
  }

  /**
   * Reschedule all notifications based on current settings
   */
  async rescheduleAll(progress?: DailyTaskProgress): Promise<void> {
    try {
      const settings = await this.getSettings();

      await Promise.all([
        this.scheduleAfternoonReminder(settings.afternoonReminderEnabled, settings.afternoonReminderTime),
        this.scheduleEveningReminder(settings.eveningReminderEnabled, settings.eveningReminderTime, progress),
      ]);

      console.log('[NotificationScheduler] All notifications rescheduled');
    } catch (error) {
      console.error('[NotificationScheduler] Failed to reschedule all:', error);
      throw error;
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAll(): Promise<void> {
    try {
      await notificationService.cancelAllNotifications();
      console.log('[NotificationScheduler] All notifications cancelled');
    } catch (error) {
      console.error('[NotificationScheduler] Failed to cancel all:', error);
      throw error;
    }
  }

  // ========================================
  // MESSAGE GENERATION
  // ========================================

  /**
   * Get random afternoon message
   */
  private getRandomAfternoonMessage(): { title: string; body: string } {
    const randomIndex = Math.floor(Math.random() * AFTERNOON_MESSAGES.length);
    const message = AFTERNOON_MESSAGES[randomIndex];
    if (!message) {
      return AFTERNOON_MESSAGES[0]!; // Fallback to first message
    }
    return message;
  }

  /**
   * Generate smart evening message based on user progress
   * Uses dynamic weighted system:
   * - Habits weight: (incomplete/scheduled) × 100
   * - Journal weight: (missing/3) × 100
   * - Bonus weight: fixed 15 (only if 3+ entries exist)
   */
  private generateSmartEveningMessage(progress: DailyTaskProgress): SmartNotificationContent | null {
    interface NotificationOption {
      type: 'habits' | 'journal' | 'bonus';
      weight: number;
      message: SmartNotificationContent;
    }

    const options: NotificationOption[] = [];

    // Option 1: Incomplete habits (if any scheduled today)
    if (progress.incompletedHabitsCount > 0 && progress.scheduledTodayCount > 0) {
      const weight = (progress.incompletedHabitsCount / progress.scheduledTodayCount) * 100;
      const habitWord = progress.incompletedHabitsCount === 1 ? 'habit' : 'habits';

      options.push({
        type: 'habits',
        weight: weight,
        message: {
          title: 'You still have habits to complete! 🏃‍♂️',
          body: `You have ${progress.incompletedHabitsCount} ${habitWord} left to complete. Let's do this!`,
          priority: NotificationPriority.HIGH,
        },
      });
    }

    // Option 2: Missing journal entries (if less than 3)
    if (!progress.hasThreeBasicEntries) {
      const missing = 3 - progress.journalEntriesCount;
      const weight = (missing / 3) * 100;
      const entryWord = missing === 1 ? 'entry' : 'entries';

      options.push({
        type: 'journal',
        weight: weight,
        message: {
          title: 'Evening reflection time 📝',
          body: `Don't forget to write ${missing} more journal ${entryWord}!`,
          priority: NotificationPriority.HIGH,
        },
      });
    }

    // Option 3: Bonus entries (ONLY if 3+ basic entries already written)
    if (progress.hasThreeBasicEntries && progress.bonusEntriesCount < 10) {
      options.push({
        type: 'bonus',
        weight: 15, // Fixed nice-to-have weight
        message: {
          title: 'Bonus opportunity! ⭐',
          body: `You still have time for bonus entries! (currently ${progress.bonusEntriesCount}/10)`,
          priority: NotificationPriority.DEFAULT,
        },
      });
    }

    // If no options available, all tasks complete → no notification
    if (options.length === 0) {
      return null;
    }

    // Weighted random selection
    return this.weightedRandomPick(options);
  }

  /**
   * Weighted random selection algorithm
   * Picks an option based on weights (higher weight = higher probability)
   */
  private weightedRandomPick(options: Array<{ weight: number; message: SmartNotificationContent }>): SmartNotificationContent {
    // Calculate total weight
    const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);

    // Generate random number between 0 and totalWeight
    const random = Math.random() * totalWeight;

    // Find which option was selected
    let cumulative = 0;
    for (const option of options) {
      cumulative += option.weight;
      if (random <= cumulative) {
        console.log('[NotificationScheduler] Weighted selection:', {
          selected: option.message.title,
          weight: option.weight,
          totalWeight,
          probability: `${((option.weight / totalWeight) * 100).toFixed(1)}%`,
        });
        return option.message;
      }
    }

    // Fallback (should never happen, but TypeScript safety)
    return options[0]!.message;
  }

  /**
   * Get fallback evening message
   * Used when progress data is unavailable (app not opened all day)
   */
  private getFallbackEveningMessage(): SmartNotificationContent {
    return {
      title: 'Evening check-in 🌙',
      body: 'Time for evening reflection! What did you accomplish today? 📝',
      priority: NotificationPriority.DEFAULT,
    };
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance();
