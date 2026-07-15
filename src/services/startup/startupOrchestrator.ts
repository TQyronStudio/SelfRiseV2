/**
 * Startup Orchestrator — core (pure, testable).
 *
 * Runs first-launch modal steps STRICTLY one at a time, so two modals are never
 * presented together (the iOS dual-modal freeze). App UI (onboarding gate,
 * tutorial) waits on `awaitStartupComplete()` before presenting anything of its
 * own — replacing the old fixed 1000 ms timer.
 *
 * This module has NO step imports and NO hard native dependency: the real pipeline
 * and the app-ready gate are injected. See `src/services/startup/index.ts` for the
 * app wiring, and types.ts for the timeout rules.
 */
import type { StartupStep } from './types';

// Long, crash-ONLY safety for the interactive present() — NOT a pacing timeout.
// A prompt legitimately waits for the user for minutes; we only guard against a
// truly wedged native SDK that never resolves at all.
const DEFAULT_PRESENT_SAFETY_MS = 5 * 60 * 1000;
const DEFAULT_PREP_TIMEOUT_MS = 8000;

export interface OrchestratorOptions {
  /**
   * Runs once before the first step. Real app: wait for AppState 'active' and the
   * first frame (iOS drops the ATT prompt if requested too early). Tests pass a no-op.
   */
  waitForAppReady?: () => Promise<void>;
  /** Crash-only safety for present() (see above). */
  presentSafetyMs?: number;
}

export interface StartupOrchestrator {
  runStartupSequence(): Promise<void>;
  awaitStartupComplete(): Promise<void>;
}

/** Real app-ready gate: AppState active + one frame. Never used by the unit tests. */
export async function defaultWaitForAppReady(): Promise<void> {
  const { AppState } = require('react-native') as typeof import('react-native');

  if (AppState.currentState !== 'active') {
    await new Promise<void>((resolve) => {
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          sub.remove();
          resolve();
        }
      });
    });
  }

  // Wait for the first frame so prompts fire against a live UI, not during launch.
  await new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Resolves 'ok' if `p` fulfils first, 'error' if `p` rejects first, 'timeout' if
 * `ms` elapses first. NEVER rejects — and a `p` that settles AFTER the timeout has
 * already won is still consumed (its fulfil/reject is mapped up front), so a slow
 * prepare() rejecting late can never surface as an unhandled rejection.
 */
function raceTimeout(p: Promise<void>, ms: number): Promise<'ok' | 'timeout' | 'error'> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), ms);
  });
  const settled = p.then(
    () => 'ok' as const,
    () => 'error' as const
  );
  return Promise.race([settled, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Resolves when `p` settles OR after `ms` (crash-only safety). If `p` rejects
 * BEFORE the safety net fires the rejection propagates (the caller logs + continues);
 * if it rejects AFTER, the rejection is swallowed — we have already moved on, so it
 * can never surface as an unhandled rejection.
 */
function withSafety(p: Promise<void>, ms: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout>;
  let firedSafety = false;
  const safety = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      firedSafety = true;
      resolve();
    }, ms);
  });
  const guarded = p.catch((err) => {
    if (firedSafety) return; // already moved on — drop the late failure
    throw err;
  });
  return Promise.race([guarded, safety]).finally(() => clearTimeout(timer));
}

export function createStartupOrchestrator(
  pipeline: StartupStep[],
  opts: OrchestratorOptions = {}
): StartupOrchestrator {
  const waitForAppReady = opts.waitForAppReady ?? defaultWaitForAppReady;
  const presentSafetyMs = opts.presentSafetyMs ?? DEFAULT_PRESENT_SAFETY_MS;

  let started = false;
  let complete = false;
  const waiters: (() => void)[] = [];

  function resolveComplete(): void {
    if (complete) return;
    complete = true;
    while (waiters.length) {
      const w = waiters.shift();
      w?.();
    }
  }

  function awaitStartupComplete(): Promise<void> {
    if (complete) return Promise.resolve();
    return new Promise<void>((resolve) => waiters.push(resolve));
  }

  async function runStartupSequence(): Promise<void> {
    // Idempotent: only the first caller runs the sequence; the rest await completion.
    if (started) return awaitStartupComplete();
    started = true;

    try {
      await waitForAppReady();
    } catch (error) {
      console.warn('⚠️ [startup] app-ready gate failed — continuing', error);
    }

    for (const step of pipeline) {
      try {
        if (!(await step.shouldRun())) {
          console.log(`⏭️ [startup] "${step.id}" not needed — skipping`);
          continue;
        }

        // Non-interactive prep is the ONLY thing we time out (fail-open).
        // raceTimeout never throws — it maps a rejection to 'error'.
        if (step.prepare) {
          const outcome = await raceTimeout(step.prepare(), step.prepTimeoutMs || DEFAULT_PREP_TIMEOUT_MS);
          if (outcome !== 'ok') {
            console.warn(`⚠️ [startup] "${step.id}" prepare ${outcome} — skipping its modal, continuing`);
            continue;
          }
        }

        // ⛔ RULE #1: NEVER a short timeout here. The user drives this interaction;
        // only a long crash-only safety net guards against a wedged SDK.
        console.log(`🪟 [startup] presenting "${step.id}"`);
        await withSafety(step.present(), presentSafetyMs);
        console.log(`✅ [startup] "${step.id}" dismissed`);
      } catch (error) {
        // Fail-open: one broken step never blocks the app from starting.
        console.warn(`⚠️ [startup] step "${step.id}" errored — continuing`, error);
      }
    }

    resolveComplete();
  }

  return { runStartupSequence, awaitStartupComplete };
}
