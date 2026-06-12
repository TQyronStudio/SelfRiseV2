import mobileAds, {
  AdsConsent,
  AdsConsentStatus,
  AdsConsentPrivacyOptionsRequirementStatus,
} from 'react-native-google-mobile-ads';

/**
 * AdConsentService - UMP (User Messaging Platform) GDPR consent flow.
 *
 * Google AdMob requires that EEA/UK users are shown a consent form before
 * personalized ads are served. This is SEPARATE from Apple's ATT prompt
 * (handled in useFirebaseAnalytics). ATT = Apple tracking permission;
 * UMP = Google/GDPR ad-personalization consent.
 *
 * Flow (per Google UMP guidelines):
 *   1. requestInfoUpdate()                  -> fetch latest consent requirement
 *   2. loadAndShowConsentFormIfRequired()   -> show form only if required & available
 *   3. mobileAds().initialize()             -> start ads (SDK serves non-personalized
 *                                              ads automatically if consent not granted)
 *
 * Ads are initialized even if the consent step fails, so a network hiccup never
 * silently disables all ads — the SDK falls back to non-personalized ads.
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
 * Run the UMP consent flow and initialize the ads SDK.
 * Safe to call once on app startup. Never throws.
 */
export async function initializeAdsWithConsent(): Promise<void> {
  try {
    // 1. Request the latest consent information for this device/region.
    const consentInfo = await AdsConsent.requestInfoUpdate();

    // 2. If a form is required (typically EEA/UK) and available, show it.
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdsConsentStatus.REQUIRED
    ) {
      await AdsConsent.loadAndShowConsentFormIfRequired();
    }
  } catch (error) {
    // Consent flow failed (e.g. offline). Continue — SDK will serve
    // non-personalized ads, which is the GDPR-safe fallback.
    console.warn('⚠️ AdConsent: consent flow error, continuing with limited ads', error);
  } finally {
    // 3. Initialize ads regardless of consent outcome.
    await startGoogleMobileAds();
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
