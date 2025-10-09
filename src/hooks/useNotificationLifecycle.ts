/**
 * Notification Lifecycle Hook
 *
 * Manages notification scheduling based on app lifecycle events:
 * - Reschedules notifications when app becomes active
 * - Handles notification tap events
 * - Updates notifications when user completes tasks
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  notificationService,
  notificationScheduler,
  progressAnalyzer,
} from '../services/notifications';

export function useNotificationLifecycle() {
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Initialize notification service
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        console.log('[useNotificationLifecycle] Notification service initialized');
      } catch (error) {
        console.error('[useNotificationLifecycle] Failed to initialize:', error);
      }
    };

    initializeNotifications();

    // App state change listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Notification received listener (when app is in foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[useNotificationLifecycle] Notification received:', notification);
      }
    );

    // Notification response listener (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Reschedule notifications on initial mount
    rescheduleNotifications();

    return () => {
      subscription.remove();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  /**
   * Handle app state changes (background -> foreground)
   */
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // App became active (from background or inactive)
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('[useNotificationLifecycle] App became active - rescheduling notifications');
      await rescheduleNotifications();
    }

    appState.current = nextAppState;
  };

  /**
   * Reschedule all notifications based on current user progress
   */
  const rescheduleNotifications = async () => {
    try {
      // Analyze current daily progress
      const progress = await progressAnalyzer.analyzeDailyProgress();

      // Reschedule both afternoon and evening notifications
      await notificationScheduler.rescheduleAll(progress);

      console.log('[useNotificationLifecycle] Notifications rescheduled successfully');
    } catch (error) {
      console.error('[useNotificationLifecycle] Failed to reschedule notifications:', error);
    }
  };

  /**
   * Handle notification tap - navigate to relevant screen
   */
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    try {
      const data = response.notification.request.content.data;
      const category = data?.category as string;

      console.log('[useNotificationLifecycle] Notification tapped:', category);

      // Navigate based on notification category
      switch (category) {
        case 'afternoon_reminder':
          // Afternoon reminder - go to home (shows overview of all tasks)
          router.push('/(tabs)');
          break;

        case 'evening_reminder':
          // Evening reminder - check what's missing and navigate accordingly
          navigateToMissingTask();
          break;

        default:
          // Default - go to home
          router.push('/(tabs)');
          break;
      }
    } catch (error) {
      console.error('[useNotificationLifecycle] Failed to handle notification tap:', error);
      // Fallback - go to home
      router.push('/(tabs)');
    }
  };

  /**
   * Navigate to the screen with missing tasks (smart navigation)
   */
  const navigateToMissingTask = async () => {
    try {
      const progress = await progressAnalyzer.analyzeDailyProgress();

      // Priority 1: Navigate to habits if incomplete
      if (progress.incompletedHabitsCount > 0) {
        router.push('/(tabs)/habits');
        return;
      }

      // Priority 2: Navigate to journal if entries missing
      if (!progress.hasThreeBasicEntries || progress.bonusEntriesCount < 10) {
        router.push('/(tabs)/journal');
        return;
      }

      // Priority 3: Navigate to goals if no progress today
      if (!progress.goalProgressAddedToday) {
        router.push('/(tabs)/goals');
        return;
      }

      // All tasks complete - go to home
      router.push('/(tabs)');
    } catch (error) {
      console.error('[useNotificationLifecycle] Failed to navigate to missing task:', error);
      // Fallback
      router.push('/(tabs)');
    }
  };

  // Return reschedule function for manual triggers (e.g., after completing a task)
  return {
    rescheduleNotifications,
  };
}
