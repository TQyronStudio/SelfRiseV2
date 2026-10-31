import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
} from 'react-native-google-mobile-ads';
import { isDevelopmentSession } from '../config/diagnosticsMode';

/**
 * AdConsentService - ads SDK init + Crashlytics enable + privacy-options helper.
 *
 * The UMP (GDPR) consent FORM itself is now a startup-orchestrator step
 * (`src/services/startup/steps/adConsentStep.ts`), which shows it one-at-a-time
 * with ATT so no two modals ever overlap (iOS freeze).
 *
 * This module keeps the work that must run UNCONDITIONALLY — even when no consent
 * form is shown (e.g. non-EEA users): initialize the ads SDK and enable crash
 * reporting. It runs AFTER the consent step (privacy-first) via the app wiring.
 */

let adsInitialized = false;

async function startGoogleMobileAds(): Promise<void> {
  if (adsInitialized) return;
  adsInitialized = true;
  try {
    await mobileAds().initialize();
    console.log('✅ AdConsent: Google Mobile Ads initialized');
  } catch (error) {
    adsInitialized = false;
    console.error('❌ AdConsent: Mobile Ads init failed', error);
  }
}

/**
 * Crash reporting, switched ON for real users and OFF in development sessions.
 *
 * Diagnostics-only (not ads/tracking data). Runs AFTER the privacy flow, so
 * collection never starts before the user has seen the privacy form. Single call
 * site — condition here if a stricter opt-in is ever required. Never throws.
 */
async function configureCrashReporting(): Promise<void> {
  try {
    const { CrashReportingService } = require('./crashReportingService') as typeof import('./crashReportingService');
    if (isDevelopmentSession()) {
      // Dev builds share the Firebase project with the store app: keep their
      // crashes (and red-box JS errors) out of the real numbers. On iOS the stored
      // preference decides the NEXT launch, so this also stops a persisted "on".
      await CrashReportingService.disable();
      return;
    }
    await CrashReportingService.enable();
  } catch (error) {
    console.warn('⚠️ AdConsent: could not configure crash reporting', error);
  }
}

/**
 * Unconditional post-startup work: configure crash reporting and initialize the
 * ads SDK. MUST run regardless of whether a consent form was shown — gating this
 * behind "was a form required?" would leave non-EEA users with no ads and no crash
 * reporting. Call once, AFTER the consent step has finished (privacy-first). Never throws.
 *
 * ORDER MATTERS: crash reporting goes FIRST and does not depend on the ads SDK.
 * It used to come after `await mobileAds().initialize()`, so a slow or hanging ads
 * initialization (seen as a risk on iOS) silently kept crash reporting off.
 */
export async function finalizeAdsAndDiagnostics(): Promise<void> {
  // 1. Crash reporting (independent of ads).
  await configureCrashReporting();

  // 2. Ads SDK (SDK serves non-personalized ads automatically if consent not granted).
  await startGoogleMobileAds();
}

/**
 * Whether this user must be offered a way to change their consent (EEA/UK and
 * other regions where Google requires a privacy options entry point). Settings
 * shows its "Privacy settings" row only when this is true — for everyone else
 * the form would not open, so the row would be a dead button. Never throws.
 */
export async function isPrivacyOptionsRequired(): Promise<boolean> {
  try {
    const consentInfo = await AdsConsent.getConsentInfo();
    return (
      consentInfo.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
    );
  } catch (error) {
    console.warn('⚠️ AdConsent: could not read privacy options requirement', error);
    return false;
  }
}

/**
 * Re-open the privacy options form so users can change their choice later
 * (Settings → Privacy settings). Returns true if shown.
 */
export async function showPrivacyOptionsForm(): Promise<boolean> {
  try {
    const consentInfo = await AdsConsent.getConsentInfo();
    if (
      consentInfo.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
    ) {
      await AdsConsent.showPrivacyOptionsForm();
      return true;
    }
    return false;
  } catch (error) {
    console.warn('⚠️ AdConsent: could not show privacy options form', error);
    return false;
  }
}
