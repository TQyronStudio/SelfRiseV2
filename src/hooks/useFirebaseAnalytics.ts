/**
 * Firebase Analytics Hook with App Tracking Transparency (ATT)
 *
 * This hook handles:
 * 1. ATT permission request on iOS 14+ (required before tracking)
 * 2. Firebase Analytics initialization
 * 3. Logging analytics events
 *
 * Usage: Call useFirebaseAnalytics() once in app/_layout.tsx
 */

import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId as firebaseSetUserId,
  setUserProperty as firebaseSetUserProperty,
} from '@react-native-firebase/analytics';
import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
  PermissionStatus,
} from 'expo-tracking-transparency';

// Types for analytics events
type AnalyticsEventParams = Record<string, string | number | boolean>;

interface UseFirebaseAnalyticsReturn {
  logEvent: (eventName: string, params?: AnalyticsEventParams) => Promise<void>;
  setUserId: (userId: string | null) => Promise<void>;
  setUserProperty: (name: string, value: string | null) => Promise<void>;
  trackingStatus: PermissionStatus | null;
}

/**
 * Hook for Firebase Analytics with ATT support
 *
 * Automatically:
 * - Requests ATT permission on iOS 14+ (first launch)
 * - Initializes Firebase Analytics
 * - Logs 'app_open' event
 *
 * @returns Object with logEvent, setUserId, setUserProperty functions and trackingStatus
 */
export function useFirebaseAnalytics(): UseFirebaseAnalyticsReturn {
  const isInitialized = useRef(false);
  const trackingStatusRef = useRef<PermissionStatus | null>(null);

  // Initialize analytics on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    initializeAnalytics();
  }, []);

  /**
   * Initialize Firebase Analytics with ATT flow
   */
  const initializeAnalytics = async () => {
    try {
      // Get Analytics instance
      const analytics = getAnalytics();

      // Step 1: Handle ATT on iOS
      if (Platform.OS === 'ios') {
        await handleATTPermission();
      }

      // Step 2: Enable analytics collection
      // Analytics works on both iOS and Android, but tracking data
      // is limited on iOS if user denies ATT
      await setAnalyticsCollectionEnabled(analytics, true);

      // Step 3: Log app_open event
      await logEvent(analytics, 'app_open', {
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      });

      console.log('✅ Firebase Analytics initialized');
    } catch (error) {
      console.error('❌ Firebase Analytics initialization error:', error);
    }
  };

  /**
   * Handle App Tracking Transparency permission on iOS
   * Must be called BEFORE any tracking/analytics
   */
  const handleATTPermission = async () => {
    try {
      // Check current status first
      const { status: currentStatus } = await getTrackingPermissionsAsync();

      if (currentStatus === 'undetermined') {
        // User hasn't been asked yet - request permission
        const { status } = await requestTrackingPermissionsAsync();
        trackingStatusRef.current = status;

        console.log(`📱 ATT Permission result: ${status}`);

        // Log ATT response to analytics (for your own tracking)
        const analytics = getAnalytics();
        await logEvent(analytics, 'att_permission_response', {
          status: status,
          granted: status === 'granted' ? 1 : 0,
        });
      } else {
        // Permission was already determined
        trackingStatusRef.current = currentStatus;
        console.log(`📱 ATT Permission (cached): ${currentStatus}`);
      }
    } catch (error) {
      console.error('❌ ATT Permission error:', error);
      trackingStatusRef.current = PermissionStatus.DENIED;
    }
  };

  /**
   * Log a custom analytics event
   *
   * @param eventName - Name of the event (e.g., 'habit_completed', 'goal_created')
   * @param params - Optional parameters for the event
   *
   * @example
   * logEvent('habit_completed', { habit_name: 'Exercise', streak: 5 });
   */
  const logEventWrapper = useCallback(async (eventName: string, params?: AnalyticsEventParams) => {
    try {
      const analytics = getAnalytics();
      await logEvent(analytics, eventName, params);
    } catch (error) {
      console.error(`❌ Analytics logEvent error (${eventName}):`, error);
    }
  }, []);

  /**
   * Set the user ID for analytics
   * Call with null to clear the user ID
   *
   * @param userId - Unique user identifier or null to clear
   */
  const setUserIdWrapper = useCallback(async (userId: string | null) => {
    try {
      const analytics = getAnalytics();
      await firebaseSetUserId(analytics, userId);
    } catch (error) {
      console.error('❌ Analytics setUserId error:', error);
    }
  }, []);

  /**
   * Set a user property for analytics
   *
   * @param name - Property name (e.g., 'subscription_type', 'language')
   * @param value - Property value or null to clear
   *
   * @example
   * setUserProperty('language', 'en');
   */
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
    trackingStatus: trackingStatusRef.current,
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
