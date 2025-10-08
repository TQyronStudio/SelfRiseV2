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
    body: 'Jak ti dnes jde? Nezapomeň na své cíle a návyky! 🚀',
  },
  {
    title: 'Odpolední motivace 💪',
    body: 'Ještě máš čas! Zkontroluj své návyky a cíle 💪',
  },
  {
    title: 'Čas na progress 🎯',
    body: 'Odpolední check-in: Jak pokračuješ ve svých cílech? 🎯',
  },
  {
    title: 'Micro-win moment ✨',
    body: 'Čas na micro-win! Dokončíš ještě jeden návyk? 🏃‍♂️',
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
   * Priority order:
   * 1. Incomplete habits
   * 2. Missing journal entries (<3)
   * 3. Missing bonus entries (if 3 basic done)
   * 4. All complete → null (no notification)
   */
  private generateSmartEveningMessage(progress: DailyTaskProgress): SmartNotificationContent | null {
    // Priority 1: Incomplete habits
    if (progress.incompletedHabitsCount > 0) {
      return {
        title: 'Ještě ti chybí návyky! 🏃‍♂️',
        body: `Máš ještě ${progress.incompletedHabitsCount} návyk${progress.incompletedHabitsCount === 1 ? '' : 'y/ů'} k dokončení. Jdeš na to?`,
        priority: NotificationPriority.HIGH,
      };
    }

    // Priority 2: Missing journal entries
    if (!progress.hasThreeBasicEntries) {
      const missing = 3 - progress.journalEntriesCount;
      return {
        title: 'Čas na večerní reflexi 📝',
        body: `Nezapomeň zapsat ještě ${missing} záznam${missing === 1 ? '' : 'y'} do deníku!`,
        priority: NotificationPriority.HIGH,
      };
    }

    // Priority 3: Missing bonus entries (if 3 basic done)
    if (progress.hasThreeBasicEntries && progress.bonusEntriesCount < 10) {
      return {
        title: 'Bonus příležitost! ⭐',
        body: `Máš ještě čas na bonusové záznamy! (aktuálně ${progress.bonusEntriesCount}/10)`,
        priority: NotificationPriority.DEFAULT,
      };
    }

    // Priority 4: All complete → no notification
    return null;
  }

  /**
   * Get fallback evening message
   * Used when progress data is unavailable (app not opened all day)
   */
  private getFallbackEveningMessage(): SmartNotificationContent {
    return {
      title: 'Večerní check-in 🌙',
      body: 'Čas na večerní reflexi! Co jsi dnes dokázal? 📝',
      priority: NotificationPriority.DEFAULT,
    };
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance();
