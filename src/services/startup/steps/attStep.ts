/**
 * Startup step: Apple App Tracking Transparency (ATT) prompt.
 *
 * - shouldRun(): iOS only, and only when the permission is still undetermined
 *   (so a restart / already-answered device never re-prompts — idempotent).
 * - present(): shows the native prompt and resolves when the user answers. No
 *   timeout — the user takes as long as they take.
 *
 * Native modules are lazy-required so importing this module (e.g. transitively
 * via the tutorial context) never pulls expo-tracking-transparency into a Jest
 * graph that doesn't mock it.
 */
import { Platform } from 'react-native';
import type { StartupStep } from '../types';

export const attStep: StartupStep = {
  id: 'att',
  prepTimeoutMs: 0, // no prepare phase

  async shouldRun(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      const { getTrackingPermissionsAsync } =
        require('expo-tracking-transparency') as typeof import('expo-tracking-transparency');
      const { status } = await getTrackingPermissionsAsync();
      return status === 'undetermined';
    } catch (error) {
      console.warn('⚠️ [startup:att] status check failed — skipping', error);
      return false;
    }
  },

  async present(): Promise<void> {
    const { requestTrackingPermissionsAsync } =
      require('expo-tracking-transparency') as typeof import('expo-tracking-transparency');

    // Interactive: resolves when the user responds. No timeout by design.
    const { status } = await requestTrackingPermissionsAsync();
    console.log(`📱 [startup:att] ATT result: ${status}`);

    // Best-effort analytics of the response (mirrors the previous inline behaviour).
    try {
      const { FirebaseAnalytics } =
        require('../../../hooks/useFirebaseAnalytics') as typeof import('../../../hooks/useFirebaseAnalytics');
      await FirebaseAnalytics.logEvent('att_permission_response', {
        status,
        granted: status === 'granted' ? 1 : 0,
      });
    } catch {
      /* analytics is best-effort; never block startup on it */
    }
  },
};
