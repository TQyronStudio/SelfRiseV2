/**
 * Opening the reminder that LAUNCHED the app (cold start).
 *
 * expo-notifications delivers a tap on a running app to
 * `addNotificationResponseReceivedListener`, but a tap that starts a killed app
 * is not replayed to it — it is only available as the "last response". Before
 * this module that tap was simply lost: the app opened on Home instead of the
 * missing habit or journal entry. That is exactly the day-2 return the
 * reminders exist for.
 *
 * Rules (see technical-guides:Notifications.md):
 * - Wait for the startup sequence (ATT / consent windows) first — navigating
 *   underneath a native modal is the iOS freeze the orchestrator prevents — and
 *   then let navigation settle, as onboarding's autoStart does, so router.push
 *   never runs before the navigator is ready.
 * - Never while onboarding is running: onboarding owns the screen.
 * - Every tap navigates at most once, whichever path sees it first (the live
 *   listener can also receive it on some platforms).
 *
 * No native imports: the caller injects them, so this is testable in Jest.
 */

export interface LaunchNotificationDeps<R> {
  /** Resolves once the startup windows are done (awaitStartupComplete). */
  waitForStartup: () => Promise<void>;
  /** Short pause for contexts and navigation to finish mounting. */
  settle: () => Promise<void>;
  /** True while onboarding is running (it owns the screen). */
  isOnboardingActive: () => Promise<boolean>;
  /** The same handler a live tap uses (navigates by category). */
  open: (response: R) => void;
  /** Forget the launch response so a JS reload cannot replay it. */
  clear: () => void;
}

const handledResponseKeys = new Set<string>();

/**
 * True the first time `key` is seen in this process, false afterwards. Both the
 * live listener and the launch path call this before navigating.
 */
export function claimNotificationResponse(key: string): boolean {
  if (handledResponseKeys.has(key)) return false;
  handledResponseKeys.add(key);
  return true;
}

/** Navigate for the launch tap once it is safe. Never throws. */
export async function openLaunchNotification<R>(
  response: R,
  key: string,
  deps: LaunchNotificationDeps<R>
): Promise<void> {
  try {
    await deps.waitForStartup();
    await deps.settle();
    if (await deps.isOnboardingActive()) return;
    if (!claimNotificationResponse(key)) return;
    deps.open(response);
    deps.clear();
  } catch (error) {
    console.warn('[launchNotification] Could not open the launch notification:', error);
  }
}
