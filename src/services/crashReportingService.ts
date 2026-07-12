// Crash Reporting Service — thin, safe wrapper around Firebase Crashlytics
//
// DESIGN (July 2026):
// - Collection starts DISABLED (firebase.json: crashlytics_auto_collection_enabled
//   false) and is enabled from code AFTER the UMP privacy flow completes on
//   startup (see adConsentService.initializeAdsWithConsent). Crash data is
//   diagnostics-only (not linked to a user, not used for ads/tracking).
// - Every method is a SAFE NO-OP when the native module is unavailable
//   (Jest, Expo Go, web) — callers never need try/catch around these.
// - Other code must import THIS wrapper, never '@react-native-firebase/crashlytics'
//   directly, so the whole codebase stays testable.
//
// Privacy policy note: adding Crashlytics requires the Diagnostics/Crash Data
// disclosure in the privacy policy, App Store App Privacy and Play Data Safety.

type CrashlyticsModule = {
  setCrashlyticsCollectionEnabled: (enabled: boolean) => Promise<void>;
  log: (message: string) => void;
  recordError: (error: Error, jsErrorName?: string) => void;
  setAttribute: (name: string, value: string) => Promise<void>;
  crash: () => void;
  isCrashlyticsCollectionEnabled: boolean;
};

let cachedInstance: CrashlyticsModule | null | undefined;

/** Lazily resolve the native module; null when unavailable (tests, Expo Go). */
function getCrashlytics(): CrashlyticsModule | null {
  if (cachedInstance !== undefined) return cachedInstance;
  try {
    // FIRST check the native module is actually linked. Calling
    // firebase.crashlytics() without it makes RNFB log a loud red-box ERROR
    // internally (even when we catch the throw) — this happens whenever the
    // JS bundle is newer than the installed binary (before `expo prebuild`
    // + rebuild). Probing NativeModules avoids triggering RNFB entirely.
    const { NativeModules } = require('react-native') as typeof import('react-native');
    if (!NativeModules?.RNFBCrashlyticsModule) {
      console.warn(
        '⚠️ CrashReporting: native module not present in this binary — crash reporting disabled. ' +
        'Run `npx expo prebuild --clean` and rebuild the app to enable it.'
      );
      cachedInstance = null;
      return cachedInstance;
    }

    // Lazy require (project convention) — must not throw at import time
    const mod = require('@react-native-firebase/crashlytics') as typeof import('@react-native-firebase/crashlytics');
    cachedInstance = mod.default() as unknown as CrashlyticsModule;
  } catch {
    cachedInstance = null;
  }
  return cachedInstance;
}

export const CrashReportingService = {
  /**
   * Enable crash collection. Called once on startup, after the UMP privacy
   * flow has completed. Never throws.
   */
  async enable(): Promise<void> {
    try {
      const crashlytics = getCrashlytics();
      if (!crashlytics) return;
      await crashlytics.setCrashlyticsCollectionEnabled(true);
      console.log('✅ CrashReporting: collection enabled');
    } catch (error) {
      console.warn('⚠️ CrashReporting: enable failed (non-critical)', error);
    }
  },

  /** Disable collection (e.g. if a privacy setting is added later). */
  async disable(): Promise<void> {
    try {
      await getCrashlytics()?.setCrashlyticsCollectionEnabled(false);
    } catch {
      // no-op
    }
  },

  /**
   * Breadcrumb log — shows up in the crash report timeline.
   * Cheap; use at significant state transitions.
   */
  log(message: string): void {
    try {
      getCrashlytics()?.log(message);
    } catch {
      // no-op
    }
  },

  /**
   * Record a HANDLED error (caught exception that indicates something is
   * wrong). Appears in Crashlytics as a non-fatal issue with stack trace.
   * Use in catch blocks of critical systems (data layer, streaks, XP).
   */
  recordError(error: unknown, context?: string): void {
    try {
      const crashlytics = getCrashlytics();
      if (!crashlytics) return;
      if (context) crashlytics.log(`[context] ${context}`);
      const err = error instanceof Error ? error : new Error(String(error));
      crashlytics.recordError(err, context);
    } catch {
      // no-op — crash reporting must never break the app
    }
  },

  /**
   * DEV/QA ONLY: force a native crash to verify the pipeline end-to-end.
   * (Report appears in Firebase Console after the NEXT app launch.)
   */
  testCrash(): void {
    getCrashlytics()?.crash();
  },
};
