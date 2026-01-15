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
import i18n from '../../config/i18n';

// Storage key for notification preferences
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

// Notification identifiers
const NOTIFICATION_IDS = {
  AFTERNOON: 'daily_afternoon_reminder',
  EVENING_PREFIX: 'evening_reminder_', // Prefix for evening notifications (evening_reminder_day_0, evening_reminder_day_1, etc.)
};

// How many days to schedule generic evening notifications in advance
const DAYS_TO_SCHEDULE_AHEAD = 30;

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettings = {
  afternoonReminderEnabled: false, // OFF by default (user opts in)
  afternoonReminderTime: '16:00',
  eveningReminderEnabled: false, // OFF by default (user opts in)
  eveningReminderTime: '20:00',
};

// Helper function to get afternoon messages from i18n
const getAfternoonMessages = (): Array<{ title: string; body: string }> => {
  const reminders = i18n.t('notifications.reminders.afternoon', { returnObjects: true }) as any;
  if (reminders && typeof reminders === 'object') {
    return [
      { title: reminders.variant1?.title || '', body: reminders.variant1?.body || '' },
      { title: reminders.variant2?.title || '', body: reminders.variant2?.body || '' },
      { title: reminders.variant3?.title || '', body: reminders.variant3?.body || '' },
      { title: reminders.variant4?.title || '', body: reminders.variant4?.body || '' },
    ].filter(m => m.title && m.body);
  }

  // Fallback to English if i18n fails
  return [
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
};

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
   * Schedule evening reminders using hybrid approach:
   * - TODAY: Personalized message based on current progress (if time hasn't passed)
   * - TOMORROW to +30 days: Generic messages (fallback for days when app isn't opened)
   *
   * This ensures users always get relevant notifications:
   * - If they open the app: personalized notification for today
   * - If they don't open the app: generic but truthful notification
   */
  async scheduleEveningReminder(
    enabled: boolean,
    time: string,
    progress?: DailyTaskProgress
  ): Promise<void> {
    try {
      // Cancel all existing evening notifications first
      await notificationService.cancelNotificationsWithPrefix(NOTIFICATION_IDS.EVENING_PREFIX);

      // Also cancel legacy notification identifier (from old implementation with repeats: true)
      await notificationService.cancelNotification('daily_evening_reminder');

      if (!enabled) {
        console.log('[NotificationScheduler] Evening reminder disabled');
        return;
      }

      // Parse time
      const { hour, minute } = notificationService.parseTime(time);
      const now = new Date();

      // Check if today's notification time has already passed
      const todayNotificationTime = new Date(now);
      todayNotificationTime.setHours(hour, minute, 0, 0);
      const isTodayTimePassed = now >= todayNotificationTime;

      // Schedule TODAY's notification (personalized) if time hasn't passed
      if (!isTodayTimePassed) {
        const personalizedMessage = progress
          ? this.generateSmartEveningMessage(progress)
          : null;

        // Only schedule if there are incomplete tasks (or no progress data)
        if (personalizedMessage) {
          await notificationService.scheduleOneTimeNotification(
            `${NOTIFICATION_IDS.EVENING_PREFIX}day_0`,
            personalizedMessage.title,
            personalizedMessage.body,
            todayNotificationTime,
            NotificationCategory.EVENING_REMINDER
          );
          console.log('[NotificationScheduler] Today\'s personalized evening reminder scheduled:', personalizedMessage);
        } else if (!progress) {
          // No progress data - schedule generic for today
          const genericMessage = this.getGenericEveningMessage();
          await notificationService.scheduleOneTimeNotification(
            `${NOTIFICATION_IDS.EVENING_PREFIX}day_0`,
            genericMessage.title,
            genericMessage.body,
            todayNotificationTime,
            NotificationCategory.EVENING_REMINDER
          );
          console.log('[NotificationScheduler] Today\'s generic evening reminder scheduled (no progress data)');
        } else {
          console.log('[NotificationScheduler] All tasks complete for today - no evening notification');
        }
      }

      // Schedule FUTURE notifications (generic) for the next 30 days
      // Each day gets a randomly selected message variant for variety
      for (let dayOffset = 1; dayOffset <= DAYS_TO_SCHEDULE_AHEAD; dayOffset++) {
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + dayOffset);
        futureDate.setHours(hour, minute, 0, 0);

        // Get a random message for each day (provides variety if user doesn't open app for multiple days)
        const genericMessage = this.getGenericEveningMessage();

        await notificationService.scheduleOneTimeNotification(
          `${NOTIFICATION_IDS.EVENING_PREFIX}day_${dayOffset}`,
          genericMessage.title,
          genericMessage.body,
          futureDate,
          NotificationCategory.EVENING_REMINDER
        );
      }

      console.log(`[NotificationScheduler] Scheduled ${DAYS_TO_SCHEDULE_AHEAD} generic evening reminders for future days (random variants)`);
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
    const messages = getAfternoonMessages();
    const randomIndex = Math.floor(Math.random() * messages.length);
    const message = messages[randomIndex];
    if (!message) {
      return messages[0]!; // Fallback to first message
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

    // Get evening notification templates from i18n
    const eveningTemplates = i18n.t('notifications.reminders.evening', { returnObjects: true }) as any;

    // Option 1: Incomplete habits (if any scheduled today)
    if (progress.incompletedHabitsCount > 0 && progress.scheduledTodayCount > 0) {
      const weight = (progress.incompletedHabitsCount / progress.scheduledTodayCount) * 100;
      const template = eveningTemplates?.incomplete_habits || {};
      const titleKey = template.title || 'You still have habits to complete! 🏃‍♂️';
      const bodyKey = progress.incompletedHabitsCount === 1 ? template.body_one : template.body_other;
      const bodyText = (bodyKey || 'You have {{count}} habits left to complete. Let\'s do this!')
        .replace('{{count}}', progress.incompletedHabitsCount.toString());

      options.push({
        type: 'habits',
        weight: weight,
        message: {
          title: titleKey,
          body: bodyText,
          priority: NotificationPriority.HIGH,
        },
      });
    }

    // Option 2: Missing journal entries (if less than 3)
    if (!progress.hasThreeBasicEntries) {
      const missing = 3 - progress.journalEntriesCount;
      const weight = (missing / 3) * 100;
      const template = eveningTemplates?.missing_journal || {};
      const titleKey = template.title || 'Evening reflection time 📝';
      const bodyKey = missing === 1 ? template.body_one : template.body_other;
      const bodyText = (bodyKey || 'Don\'t forget to write {{count}} more journal entries!')
        .replace('{{count}}', missing.toString());

      options.push({
        type: 'journal',
        weight: weight,
        message: {
          title: titleKey,
          body: bodyText,
          priority: NotificationPriority.HIGH,
        },
      });
    }

    // Option 3: Bonus entries (ONLY if 3+ basic entries already written)
    if (progress.hasThreeBasicEntries && progress.bonusEntriesCount < 10) {
      const template = eveningTemplates?.bonus_opportunity || {};
      const titleKey = template.title || 'Bonus opportunity! ⭐';
      const bodyKey = template.body || 'You still have time for bonus entries! (currently {{count}}/10)';
      const bodyText = bodyKey.replace('{{count}}', progress.bonusEntriesCount.toString());

      options.push({
        type: 'bonus',
        weight: 15, // Fixed nice-to-have weight
        message: {
          title: titleKey,
          body: bodyText,
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
    const template = i18n.t('notifications.reminders.evening.fallback', { returnObjects: true }) as any;
    return {
      title: template?.title || 'Evening check-in 🌙',
      body: template?.body || 'Time for evening reflection! What did you accomplish today? 📝',
      priority: NotificationPriority.DEFAULT,
    };
  }

  /**
   * Get generic evening message for future days
   * Used for days when app hasn't been opened - always truthful, no specific numbers
   * Rotates between different message variants for variety
   */
  private getGenericEveningMessage(): SmartNotificationContent {
    const templates = i18n.t('notifications.reminders.evening.generic', { returnObjects: true }) as any;

    // Get all available generic message variants
    const variants: Array<{ title: string; body: string }> = [];

    if (templates && typeof templates === 'object') {
      // Support multiple variants (generic.variant1, generic.variant2, etc.)
      for (let i = 1; i <= 4; i++) {
        const variant = templates[`variant${i}`];
        if (variant?.title && variant?.body) {
          variants.push({ title: variant.title, body: variant.body });
        }
      }
    }

    // Fallback messages if i18n fails
    if (variants.length === 0) {
      variants.push(
        {
          title: 'Evening Check-in 🌙',
          body: 'How did your day go? Check your habits and journal! 📝',
        },
        {
          title: 'Time for Reflection ✨',
          body: 'Don\'t forget to review your habits and add a journal entry!',
        },
        {
          title: 'Daily Progress 🎯',
          body: 'Have you completed your habits today? Take a moment to reflect.',
        },
        {
          title: 'Evening Reminder 💫',
          body: 'Your habits and journal are waiting! End the day strong.',
        }
      );
    }

    // Pick a random variant
    const randomIndex = Math.floor(Math.random() * variants.length);
    const selected = variants[randomIndex] || variants[0]!;

    return {
      title: selected.title,
      body: selected.body,
      priority: NotificationPriority.DEFAULT,
    };
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance();
