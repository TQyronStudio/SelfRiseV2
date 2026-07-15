import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
} from 'react-native-google-mobile-ads';

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
 * Unconditional post-startup work: initialize the ads SDK and enable crash
 * reporting. MUST run regardless of whether a consent form was shown — gating this
 * behind "was a form required?" would leave non-EEA users with no ads and no crash
 * reporting. Call once, AFTER the consent step has finished (privacy-first). Never throws.
 */
export async function finalizeAdsAndDiagnostics(): Promise<void> {
  // 1. Ads SDK (SDK serves non-personalized ads automatically if consent not granted).
  await startGoogleMobileAds();

  // 2. Crash reporting (diagnostics-only — not ads/tracking data). Deliberately
  //    AFTER the privacy flow, so collection never starts before the user has seen
  //    the privacy form. Single call site — condition here if a stricter opt-in is
  //    ever required.
  try {
    const { CrashReportingService } = require('./crashReportingService') as typeof import('./crashReportingService');
    await CrashReportingService.enable();
  } catch (error) {
    console.warn('⚠️ AdConsent: could not enable crash reporting', error);
  }
}

/**
 * Optional helper: re-open the privacy options form so users can change their
 * choice later (e.g. from a Settings screen). Returns true if shown.
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
