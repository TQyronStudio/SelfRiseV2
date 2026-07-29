/**
 * First-launch notification opt-in.
 *
 * Called when the user taps "Yes, remind me" on the onboarding gate's notification
 * screen. That screen is a PRE-PERMISSION ("priming") step: the OS prompt can be shown
 * only once per install, so asking in our own UI first means a "Not now" costs nothing —
 * the OS prompt stays unburned and enabling reminders later from Settings still works.
 *
 * On success BOTH reminders are switched on (afternoon + evening) and scheduled
 * immediately, so the user does not have to find the toggles in Settings — the problem
 * testers reported: they never noticed the app had reminders at all.
 */

import { notificationService } from './notificationService';
import { notificationScheduler } from './notificationScheduler';
import { progressAnalyzer } from './progressAnalyzer';

/**
 * Request OS permission and, if granted, enable + schedule both daily reminders.
 *
 * @returns true when reminders are now on, false when the user (or the OS) declined.
 *          Never throws — a failed opt-in must not block onboarding.
 */
export async function enableAllRemindersAfterOptIn(): Promise<boolean> {
  try {
    // 1. OS permission. Resolves immediately when already granted (e.g. Android < 13,
    //    where notifications need no runtime permission).
    const permissions = await notificationService.requestPermissions();
    if (!permissions.granted) {
      console.log('[NotificationOptIn] Permission not granted — reminders stay off');
      return false;
    }

    // 2. Turn BOTH reminders on (they default to off / opt-in).
    await notificationScheduler.updateSettings({
      afternoonReminderEnabled: true,
      eveningReminderEnabled: true,
    });

    // 3. Schedule right away, mirroring what the Settings toggles do. The evening
    //    reminder is progress-aware, so it needs today's progress snapshot.
    const progress = await progressAnalyzer.analyzeDailyProgress();
    await notificationScheduler.rescheduleAll(progress);

    console.log('[NotificationOptIn] Both daily reminders enabled and scheduled');
    return true;
  } catch (error) {
    console.error('[NotificationOptIn] Failed to enable reminders:', error);
    return false;
  }
}
