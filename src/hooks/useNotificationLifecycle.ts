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
import { FirstDayAnalytics } from '../services/analytics';
import {
  claimNotificationResponse,
  openLaunchNotification,
} from '../services/notifications/launchNotification';
import { awaitStartupComplete } from '../services/startup';
import { isTutorialActive } from '../contexts/TutorialContext';

/** Identifies one tap across both delivery paths (live listener + launch lookup). */
function responseKey(response: Notifications.NotificationResponse): string {
  const { notification } = response;
  return `${notification.request.identifier}|${notification.date}`;
}

/** Fire-and-forget `reminder_open` (deduplicated by the same key). */
function trackReminderOpen(response: Notifications.NotificationResponse): void {
  void FirstDayAnalytics.reminderOpened(
    response.notification.request.content.data?.category,
    responseKey(response)
  );
}

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

    // A tap that LAUNCHED the app (cold start) is not replayed to the listener
    // above — it is only available as the "last response". Count it, and open
    // the same screen a live tap would — but only after the startup windows and
    // never during onboarding (see launchNotification.ts). Each tap navigates
    // once, whichever path sees it first.
    try {
      const launchResponse = Notifications.getLastNotificationResponse();
      if (launchResponse) {
        trackReminderOpen(launchResponse);
        void openLaunchNotification(launchResponse, responseKey(launchResponse), {
          waitForStartup: awaitStartupComplete,
          // Same settle time onboarding's autoStart gives navigation.
          settle: () => new Promise(resolve => setTimeout(resolve, 300)),
          isOnboardingActive: isTutorialActive,
          open: navigateForResponse,
          clear: () => Notifications.clearLastNotificationResponse(),
        });
      }
    } catch (error) {
      console.warn('[useNotificationLifecycle] Could not read launch notification:', error);
    }

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
   * Handle a live notification tap (app running or in background).
   */
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    trackReminderOpen(response);
    if (!claimNotificationResponse(responseKey(response))) return; // already opened
    navigateForResponse(response);
  };

  /**
   * Navigate to the screen a notification points at (shared by both tap paths).
   */
  const navigateForResponse = (response: Notifications.NotificationResponse) => {
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

      // Priority 2: Navigate to journal if the daily minimum is missing.
      // N-7.1: the old condition also fired on `bonusEntriesCount < 10`, which
      // is true until the user writes 13+ entries in a day — so priority 3
      // below was unreachable and a neglected goal never got the user to Goals.
      if (!progress.hasThreeBasicEntries) {
        router.push('/(tabs)/journal');
        return;
      }

      // Priority 3: Navigate to goals if no progress today
      if (progress.hasActiveGoals && !progress.goalProgressAddedToday) {
        router.push('/(tabs)/goals');
        return;
      }

      // Priority 4: basics done — offer bonus journal entries
      if (progress.bonusEntriesCount < 10) {
        router.push('/(tabs)/journal');
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
