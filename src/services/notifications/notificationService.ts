/**
 * Notification Service
 *
 * Handles all notification operations including:
 * - Permission management
 * - Notification scheduling
 * - Notification channel setup
 * - Platform-specific configuration
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import i18next from 'i18next';
import {
  NotificationCategory,
  NotificationPermissionStatus,
  NotificationPriority,
} from '../../types/notification';

// Configure notification handler (how notifications appear when app is foregrounded)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   * Sets up notification channels for Android
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Android: Create notification channels
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      this.isInitialized = true;
      console.log('[NotificationService] Initialized successfully');
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup Android notification channels
   * Channels are required on Android 8.0+ to show notifications
   */
  private async setupAndroidChannels(): Promise<void> {
    try {
      // Reminder channel (for daily reminders)
      await Notifications.setNotificationChannelAsync('reminders', {
        name: i18next.t('notifications.channels.reminders.name'),
        description: i18next.t('notifications.channels.reminders.description'),
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1', // Primary color
        enableVibrate: true,
        showBadge: true,
      });

      console.log('[NotificationService] Android channels created');
    } catch (error) {
      console.error('[NotificationService] Failed to create Android channels:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions from the user
   * Handles both iOS and Android permission flows
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      // If not already granted, request permissions
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const permissionStatus = await this.getPermissionStatus();

      console.log('[NotificationService] Permission status:', permissionStatus);

      return permissionStatus;
    } catch (error) {
      console.error('[NotificationService] Failed to request permissions:', error);
      throw error;
    }
  }

  /**
   * Get current notification permission status
   */
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const { status, ios, android } = await Notifications.getPermissionsAsync();

      const permissionStatus: NotificationPermissionStatus = {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
      };

      // iOS-specific permission details
      if (Platform.OS === 'ios' && ios) {
        permissionStatus.ios = {
          status: status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined',
          allowsAlert: ios.allowsAlert ?? false,
          allowsBadge: ios.allowsBadge ?? false,
          allowsSound: ios.allowsSound ?? false,
        };
      }

      // Android-specific permission details
      if (Platform.OS === 'android') {
        permissionStatus.android = {
          status: status === 'granted' ? 'granted' : 'denied',
        };
      }

      return permissionStatus;
    } catch (error) {
      console.error('[NotificationService] Failed to get permission status:', error);
      throw error;
    }
  }

  /**
   * Open system settings for notifications
   * Useful when user has denied permissions and wants to enable them
   */
  async openSystemSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openSettings();
      } else if (Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('[NotificationService] Failed to open system settings:', error);
      throw error;
    }
  }

  /**
   * Schedule a daily repeating notification
   *
   * @param identifier Unique identifier for the notification
   * @param title Notification title
   * @param body Notification body
   * @param hour Hour of day (0-23)
   * @param minute Minute of hour (0-59)
   * @param category Notification category
   */
  async scheduleDailyNotification(
    identifier: string,
    title: string,
    body: string,
    hour: number,
    minute: number,
    category: NotificationCategory
  ): Promise<string> {
    try {
      // Cancel existing notification with same identifier
      await this.cancelNotification(identifier);

      // Schedule new notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'android' && { channelId: 'reminders' }),
          categoryIdentifier: category,
          data: {
            category,
            scheduledAt: new Date().toISOString(),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`[NotificationService] Scheduled notification:`, {
        identifier,
        notificationId,
        hour,
        minute,
        category,
      });

      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a one-time notification for a specific date and time
   *
   * @param identifier Unique identifier for the notification
   * @param title Notification title
   * @param body Notification body
   * @param date Target date and time for the notification
   * @param category Notification category
   */
  async scheduleOneTimeNotification(
    identifier: string,
    title: string,
    body: string,
    date: Date,
    category: NotificationCategory
  ): Promise<string> {
    try {
      // Schedule notification for specific date
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'android' && { channelId: 'reminders' }),
          categoryIdentifier: category,
          data: {
            category,
            scheduledAt: new Date().toISOString(),
            targetDate: date.toISOString(),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: date,
        },
      });

      console.log(`[NotificationService] Scheduled one-time notification:`, {
        identifier,
        notificationId,
        date: date.toISOString(),
        category,
      });

      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to schedule one-time notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all notifications with a specific prefix
   * Useful for cancelling all evening reminders (evening-reminder-day-0, evening-reminder-day-1, etc.)
   */
  async cancelNotificationsWithPrefix(prefix: string): Promise<number> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const matchingNotifications = scheduledNotifications.filter(
        (notification) => notification.identifier.startsWith(prefix)
      );

      for (const notification of matchingNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      if (matchingNotifications.length > 0) {
        console.log(`[NotificationService] Cancelled ${matchingNotifications.length} notification(s) with prefix: ${prefix}`);
      }

      return matchingNotifications.length;
    } catch (error) {
      console.error('[NotificationService] Failed to cancel notifications with prefix:', error);
      throw error;
    }
  }

  /**
   * Cancel a specific notification by identifier
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      // Find notifications with matching identifier
      const matchingNotifications = scheduledNotifications.filter(
        (notification) => notification.identifier === identifier
      );

      // Cancel each matching notification
      for (const notification of matchingNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      if (matchingNotifications.length > 0) {
        console.log(`[NotificationService] Cancelled ${matchingNotifications.length} notification(s) with identifier: ${identifier}`);
      }
    } catch (error) {
      console.error('[NotificationService] Failed to cancel notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[NotificationService] Cancelled all notifications');
    } catch (error) {
      console.error('[NotificationService] Failed to cancel all notifications:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('[NotificationService] Failed to get scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * Parse time string (HH:mm) to hour and minute
   */
  parseTime(timeString: string): { hour: number; minute: number } {
    const parts = timeString.split(':');
    const hourStr = parts[0];
    const minuteStr = parts[1];

    if (!hourStr || !minuteStr) {
      throw new Error(`Invalid time format: ${timeString}. Expected HH:mm format.`);
    }

    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error(`Invalid time format: ${timeString}. Expected HH:mm format.`);
    }

    return { hour, minute };
  }

  /**
   * Format hour and minute to time string (HH:mm)
   */
  formatTime(hour: number, minute: number): string {
    const hourStr = hour.toString().padStart(2, '0');
    const minuteStr = minute.toString().padStart(2, '0');
    return `${hourStr}:${minuteStr}`;
  }

  /**
   * Add notification response listener
   * Handles what happens when user taps on a notification
   */
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Add notification received listener
   * Handles notifications received while app is in foreground
   */
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
