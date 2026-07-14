import { DeviceEventEmitter } from 'react-native';
import { hasAchievement } from '@/src/contexts/TutorialContext';

/**
 * Tutorial ↔ achievement-modal handshake for the "create your first habit/goal" steps.
 *
 * Creating the first habit/goal unlocks `first-habit` / `first-goal`, whose celebration
 * modal the user must dismiss BEFORE the tutorial advances — otherwise the tutorial's
 * own completion modal (a second RN <Modal>) fights it, and on iOS two modals at once
 * freeze the UI.
 *
 * The whole difficulty is a single question: **is a modal actually coming?**
 *
 *   - First ever run          → achievement unlocks → modal WILL appear → wait for dismissal
 *   - Restart / already owned → no unlock          → NO modal          → must not wait at all
 *
 * Two earlier attempts got this wrong:
 *   1. `isTutorialRestarted()` was used as the proxy. It answers a different question (the
 *      flag is cleared whenever a tutorial completes), so on a first run where the unlock
 *      silently failed — which is exactly what the goals split-brain caused — the code
 *      waited out a 10s fallback and the tutorial looked frozen.
 *   2. Shortening that fallback to 1.5s "fixed" the freeze by breaking the feature: nobody
 *      dismisses a modal in 1.5s, so the tutorial always jumped ahead and the achievement
 *      modal never got its turn. The user saw no achievement at all.
 *
 * So: ask the achievement store directly (before the entity exists), then confirm against
 * the real unlock event. Timeouts are safety nets only — never pacing devices.
 */

// The unlock pipeline is: create → 100ms → runBatchAchievementCheck → emit. Generous
// enough for a slow device, short enough that a genuinely failed unlock does not strand
// the user staring at a dead tutorial.
const UNLOCK_TIMEOUT_MS = 5000;

// The user is READING a celebration modal here. This is a crash-safety net, not a deadline.
const DISMISS_TIMEOUT_MS = 120000;

// Just long enough for the form's close animation when no modal is coming.
const FORM_CLOSE_MS = 400;

interface PendingEvent {
  promise: Promise<boolean>;
  cancel: () => void;
}

/** Resolves true if the event fires (and matches), false on timeout. Listener attaches immediately. */
function eventOnce(
  eventName: string,
  timeoutMs: number,
  match?: (payload: any) => boolean
): PendingEvent {
  let settle: (fired: boolean) => void = () => {};
  let done = false;

  const finish = (fired: boolean) => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    subscription.remove();
    settle(fired);
  };

  const subscription = DeviceEventEmitter.addListener(eventName, (payload: any) => {
    if (match && !match(payload)) return;
    finish(true);
  });

  const timer = setTimeout(() => finish(false), timeoutMs);

  const promise = new Promise<boolean>(resolve => {
    settle = resolve;
  });

  return { promise, cancel: () => finish(false) };
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export interface TutorialAchievementGate {
  /**
   * Resolves once the tutorial may advance: after the user dismissed the achievement
   * modal, or immediately-ish when no modal was ever coming.
   */
  wait: () => Promise<void>;
}

/**
 * Arm the gate BEFORE creating the habit/goal.
 *
 * Listeners must be attached before the entity is created — the unlock fires ~100ms
 * later, which would otherwise race us and be missed.
 */
export function armTutorialAchievementGate(achievementId: string): TutorialAchievementGate {
  // Snapshot the lock state now, while the entity does not exist yet.
  const wasLockedPromise = hasAchievement(achievementId)
    .then(owned => !owned)
    .catch(() => true); // on error assume it can unlock — waiting is safer than skipping

  const unlocked = eventOnce(
    'achievementUnlocked',
    UNLOCK_TIMEOUT_MS,
    payload => payload?.achievement?.id === achievementId
  );
  const dismissed = eventOnce('achievementCelebrationClosed', DISMISS_TIMEOUT_MS);

  return {
    async wait() {
      const wasLocked = await wasLockedPromise;

      if (!wasLocked) {
        // Already owned (tutorial restart) — no modal will appear. Do not wait for one.
        unlocked.cancel();
        dismissed.cancel();
        await delay(FORM_CLOSE_MS);
        return;
      }

      const didUnlock = await unlocked.promise;
      if (!didUnlock) {
        // The achievement should have unlocked but didn't. Something is broken upstream;
        // log it loudly, but never hold the tutorial hostage to it.
        console.warn(
          `⚠️ [TUTORIAL] Expected "${achievementId}" to unlock but no event arrived within ` +
          `${UNLOCK_TIMEOUT_MS}ms — advancing without its celebration.`
        );
        dismissed.cancel();
        await delay(FORM_CLOSE_MS);
        return;
      }

      // A celebration modal is on screen. Let the user actually read and close it.
      await dismissed.promise;
    },
  };
}
