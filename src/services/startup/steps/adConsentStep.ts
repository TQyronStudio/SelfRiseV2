/**
 * Startup step: Google UMP (GDPR) consent form.
 *
 * Split cleanly along the timeout boundary (see types.ts):
 * - prepare(): AdsConsent.requestInfoUpdate() — a NETWORK call, timeout-guarded by
 *   the orchestrator. Determines whether a form must actually be shown.
 * - present(): loadAndShowConsentFormIfRequired() — INTERACTIVE, never timed out
 *   (includes the deeper "Manage options" / partners screens).
 *
 * Runs AFTER attStep purely by its position in the pipeline array (ATT before UMP,
 * per Google's guidance) — no cross-step signalling needed.
 *
 * ⚠️ This step is ONLY the consent modal. Initializing the ads SDK and enabling
 * Crashlytics is unconditional startup work (must run even when no form is shown)
 * and lives in `finalizeAdsAndDiagnostics()` (adConsentService), invoked by the app
 * wiring after the sequence — NOT gated behind this step's shouldRun.
 */
import type { StartupStep } from '../types';

// Set by prepare(), read by present(). Module-scoped: one consent flow per launch.
let consentFormRequired = false;

export const adConsentStep: StartupStep = {
  id: 'ad-consent',
  prepTimeoutMs: 6000,

  async shouldRun(): Promise<boolean> {
    // Always enter the step; prepare()/present() decide whether a form appears.
    return true;
  },

  async prepare(): Promise<void> {
    const { AdsConsent, AdsConsentStatus } =
      require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');

    const info = await AdsConsent.requestInfoUpdate();
    consentFormRequired = info.isConsentFormAvailable && info.status === AdsConsentStatus.REQUIRED;
    console.log(`🔒 [startup:consent] form required: ${consentFormRequired}`);
  },

  async present(): Promise<void> {
    if (!consentFormRequired) return; // non-EEA / already handled → no modal

    const { AdsConsent } =
      require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
    await AdsConsent.loadAndShowConsentFormIfRequired();
  },
};
