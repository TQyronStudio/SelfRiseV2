/**
 * Tutorial / onboarding AsyncStorage keys — SINGLE SOURCE OF TRUTH.
 *
 * WHY THIS FILE EXISTS (super audit Fáze 8, N-8.1): these key strings used to be
 * typed out twice — in `TutorialContext` (owner) and again in
 * `XpAnimationContext`, which reads them to SUPPRESS the level-up modal while the
 * tutorial is running. That suppression is what keeps a level-up modal from
 * opening on top of a tutorial modal — the iOS dual-modal freeze.
 *
 * A rename or typo on one side would have silently disabled that protection:
 * plain string literals, so neither `tsc` nor any test would notice, and the bug
 * would only ever show up as "the app freezes during the tutorial" on a device.
 *
 * This module deliberately has NO imports, so both contexts can use it without
 * creating the circular dependency the duplication was working around.
 */
export const TUTORIAL_STORAGE_KEYS = {
  COMPLETED: 'onboarding_tutorial_completed',
  CURRENT_STEP: 'onboarding_current_step',
  SKIPPED: 'onboarding_tutorial_skipped',
  SESSION: 'onboarding_tutorial_session',
  SESSION_TIMESTAMP: 'onboarding_tutorial_timestamp',
  CRASH_LOG: 'onboarding_tutorial_crash_log',
  ERROR_COUNT: 'onboarding_tutorial_error_count',
  RECOVERY_STATE: 'onboarding_tutorial_recovery_state',
  RESTARTED: 'onboarding_tutorial_restarted',
  PREFS_COMPLETED: 'onboarding_prefs_completed',
} as const;
