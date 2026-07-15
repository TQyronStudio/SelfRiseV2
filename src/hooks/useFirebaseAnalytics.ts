/**
 * Firebase Analytics helpers.
 *
 * ATT (App Tracking Transparency) is NO LONGER handled here — it is a startup
 * orchestrator step (`src/services/startup/steps/attStep.ts`) so it can be shown
 * one-at-a-time with the UMP consent form (no iOS dual-modal freeze).
 *
 * This module now exposes:
 *  - `initAnalyticsAfterConsent()` — enable collection + log app_open, called by the
 *    app wiring AFTER the startup sequence (preserves the ATT-before-tracking order).
 *  - `useFirebaseAnalytics()` — hook with logEvent/setUserId/setUserProperty wrappers.
 *  - `FirebaseAnalytics` — singleton for logging from non-React code.
 */

import { useCallback } from 'react';
import { Platform } from 'react-native';
import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId as firebaseSetUserId,
  setUserProperty as firebaseSetUserProperty,
} from '@react-native-firebase/analytics';

// Types for analytics events
type AnalyticsEventParams = Record<string, string | number | boolean>;

interface UseFirebaseAnalyticsReturn {
  logEvent: (eventName: string, params?: AnalyticsEventParams) => Promise<void>;
  setUserId: (userId: string | null) => Promise<void>;
  setUserProperty: (name: string, value: string | null) => Promise<void>;
}

/**
 * Enable analytics collection and log `app_open`.
 *
 * Called by the app wiring AFTER `runStartupSequence()` — i.e. after the ATT prompt
 * has been answered — so tracking never starts before the user has seen ATT. Safe to
 * call once on startup; never throws.
 */
export async function initAnalyticsAfterConsent(): Promise<void> {
  try {
    const analytics = getAnalytics();

    // Analytics works on both platforms; on iOS tracking data is limited if the
    // user denied ATT (Firebase respects the ATT status automatically).
    await setAnalyticsCollectionEnabled(analytics, true);

    await logEvent(analytics, 'app_open', {
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });

    console.log('✅ Firebase Analytics initialized (post-startup)');
  } catch (error) {
    console.error('❌ Firebase Analytics initialization error:', error);
  }
}

/**
 * Hook exposing analytics wrappers for React components.
 * (Startup init is handled by `initAnalyticsAfterConsent`, not by this hook.)
 */
export function useFirebaseAnalytics(): UseFirebaseAnalyticsReturn {
  const logEventWrapper = useCallback(async (eventName: string, params?: AnalyticsEventParams) => {
    try {
      const analytics = getAnalytics();
      await logEvent(analytics, eventName, params);
    } catch (error) {
      console.error(`❌ Analytics logEvent error (${eventName}):`, error);
    }
  }, []);

  const setUserIdWrapper = useCallback(async (userId: string | null) => {
    try {
      const analytics = getAnalytics();
      await firebaseSetUserId(analytics, userId);
    } catch (error) {
      console.error('❌ Analytics setUserId error:', error);
    }
  }, []);

  const setUserPropertyWrapper = useCallback(async (name: string, value: string | null) => {
    try {
      const analytics = getAnalytics();
      await firebaseSetUserProperty(analytics, name, value);
    } catch (error) {
      console.error(`❌ Analytics setUserProperty error (${name}):`, error);
    }
  }, []);

  return {
    logEvent: logEventWrapper,
    setUserId: setUserIdWrapper,
    setUserProperty: setUserPropertyWrapper,
  };
}

// Export singleton instance for use outside of React components
// Note: Prefer using the hook in React components
export const FirebaseAnalytics = {
  /**
   * Log event from non-React code (services, utilities)
   */
  logEvent: async (eventName: string, params?: AnalyticsEventParams) => {
    try {
      const analytics = getAnalytics();
      await logEvent(analytics, eventName, params);
    } catch (error) {
      console.error(`❌ Analytics logEvent error (${eventName}):`, error);
    }
  },
};
