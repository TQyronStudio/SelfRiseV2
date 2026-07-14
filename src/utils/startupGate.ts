/**
 * Startup Gate — coordinates the first-launch native permission/consent modals
 * (Apple ATT + Google UMP) so the app never presents a React Native <Modal>
 * (the onboarding language/theme gate, then the tutorial) while a native modal
 * is still on screen.
 *
 * WHY: On iOS you cannot present two modals at once — doing so freezes the UI
 * (the same "dual-modal" problem the app already solves for in-app modals via
 * ModalQueueContext). On a fresh install the ATT prompt, the UMP consent form,
 * and the onboarding gate all fire at startup with no coordination, so the RN
 * gate collided with the native forms and the whole screen locked up until the
 * user killed and relaunched the app.
 *
 * This is a tiny one-shot barrier with STATE MEMORY (not an event on the bus):
 * completion can happen before the tutorial ever starts waiting, so a
 * fire-and-forget event could be missed. Each waiter also has a safety timeout
 * so the app can never get permanently stuck here (e.g. offline / SDK error).
 *
 * Ordering: UMP waits for ATT first (waitForATT) because Google recommends
 * requesting ATT before loading the consent form. The onboarding gate waits for
 * both (waitForStartupModals).
 */

type StartupTask = 'att' | 'consent';

let attComplete = false;
let consentComplete = false;

const attWaiters: Array<() => void> = [];
const allWaiters: Array<() => void> = [];

function flush(waiters: Array<() => void>): void {
  while (waiters.length) {
    const resolve = waiters.shift();
    resolve?.();
  }
}

/**
 * Mark a startup native-modal flow as finished (its native modal, if any, is
 * closed). Always call this once per task — including on the cached/skip path
 * (e.g. Android has no ATT) and in error handlers — so the gate never hangs.
 */
export function markStartupTaskComplete(task: StartupTask): void {
  if (task === 'att') {
    if (attComplete) return;
    attComplete = true;
    flush(attWaiters);
  } else {
    if (consentComplete) return;
    consentComplete = true;
  }

  if (attComplete && consentComplete) {
    flush(allWaiters);
  }
}

/**
 * Resolves once the ATT flow has finished, or after `timeoutMs` as a safety net.
 * Used by the UMP consent flow to run AFTER ATT.
 */
export function waitForATT(timeoutMs = 5000): Promise<void> {
  if (attComplete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    attWaiters.push(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/**
 * Resolves once BOTH the ATT and UMP consent flows have finished, or after
 * `timeoutMs` as a safety net. Used to defer the onboarding gate / tutorial so
 * its RN <Modal> never collides with a native modal on first launch.
 */
export function waitForStartupModals(timeoutMs = 8000): Promise<void> {
  if (attComplete && consentComplete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    allWaiters.push(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}
