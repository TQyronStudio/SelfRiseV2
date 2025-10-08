/**
 * Notification Types
 *
 * Types and interfaces for notification system
 */

export enum NotificationCategory {
  AFTERNOON_REMINDER = 'afternoon_reminder',
  EVENING_REMINDER = 'evening_reminder',
}

export enum NotificationPriority {
  HIGH = 'high',
  DEFAULT = 'default',
  LOW = 'low',
}

export interface NotificationSettings {
  afternoonReminderEnabled: boolean;
  afternoonReminderTime: string; // HH:mm format (e.g., "16:00")
  eveningReminderEnabled: boolean;
  eveningReminderTime: string; // HH:mm format (e.g., "20:00")
}

export interface ScheduledNotification {
  identifier: string;
  category: NotificationCategory;
  scheduledTime: Date;
  title: string;
  body: string;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  ios?: {
    status: 'granted' | 'denied' | 'undetermined';
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
  };
  android?: {
    status: 'granted' | 'denied';
  };
}

export interface DailyTaskProgress {
  incompletedHabitsCount: number;
  journalEntriesCount: number;
  hasThreeBasicEntries: boolean;
  bonusEntriesCount: number;
  goalProgressAddedToday: boolean;
}

export interface SmartNotificationContent {
  title: string;
  body: string;
  priority: NotificationPriority;
}
