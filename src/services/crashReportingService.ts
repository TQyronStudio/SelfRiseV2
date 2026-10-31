// Crash Reporting Service — thin, safe wrapper around Firebase Crashlytics
//
// DESIGN (July 2026):
// - Collection starts DISABLED (firebase.json: crashlytics_auto_collection_enabled
//   false) and is enabled from code AFTER the UMP privacy flow completes on
//   startup (see adConsentService.finalizeAdsAndDiagnostics, run by the startup
//   orchestrator wiring). Crash data is diagnostics-only (not linked to a user,
//   not used for ads/tracking).
// - Every method is a SAFE NO-OP when the native module is unavailable
//   (Jest, Expo Go, web) — callers never need try/catch around these.
// - Other code must import THIS wrapper, never '@react-native-firebase/crashlytics'
//   directly, so the whole codebase stays testable.
//
// Privacy policy note: adding Crashlytics requires the Diagnostics/Crash Data
// disclosure in the privacy policy, App Store App Privacy and Play Data Safety.

// MODULAR API (October 2026): RNFB 23 deprecated the namespaced API
// (`crashlytics()`, `instance.method()`) — it logged two deprecation warnings
// on every start and goes away in the next major. The modular functions take the
// instance as the first argument: `log(crashlytics, msg)`.
type CrashlyticsApi = typeof import('@react-native-firebase/crashlytics');

type Crashlytics = {
  api: CrashlyticsApi;
  instance: ReturnType<CrashlyticsApi['getCrashlytics']>;
};

let cachedInstance: Crashlytics | null | undefined;

/** Lazily resolve the native module; null when unavailable (tests, Expo Go). */
function getCrashlytics(): Crashlytics | null {
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
    const api = require('@react-native-firebase/crashlytics') as CrashlyticsApi;
    cachedInstance = { api, instance: api.getCrashlytics() };
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
      await crashlytics.api.setCrashlyticsCollectionEnabled(crashlytics.instance, true);
      console.log('✅ CrashReporting: collection enabled');
    } catch (error) {
      console.warn('⚠️ CrashReporting: enable failed (non-critical)', error);
    }
  },

  /** Disable collection (e.g. if a privacy setting is added later). */
  async disable(): Promise<void> {
    try {
      const crashlytics = getCrashlytics();
      if (!crashlytics) return;
      await crashlytics.api.setCrashlyticsCollectionEnabled(crashlytics.instance, false);
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
      const crashlytics = getCrashlytics();
      if (!crashlytics) return;
      crashlytics.api.log(crashlytics.instance, message);
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
      if (context) crashlytics.api.log(crashlytics.instance, `[context] ${context}`);
      const err = error instanceof Error ? error : new Error(String(error));
      crashlytics.api.recordError(crashlytics.instance, err, context);
    } catch {
      // no-op — crash reporting must never break the app
    }
  },

  /**
   * DEV/QA ONLY: force a native crash to verify the pipeline end-to-end.
   * (Report appears in Firebase Console after the NEXT app launch.)
   */
  testCrash(): void {
    const crashlytics = getCrashlytics();
    if (crashlytics) crashlytics.api.crash(crashlytics.instance);
  },
};
