/**
 * Startup Orchestrator — step contract.
 *
 * A StartupStep represents ONE first-launch modal (native permission/consent form,
 * or later an RN consent modal). The orchestrator runs steps STRICTLY one at a time
 * so two modals are never on screen together (iOS dual-modal freeze).
 *
 * The interface deliberately splits the timeout-guarded, non-interactive phase
 * (`prepare`) from the interactive, NEVER-timed-out phase (`present`). This makes
 * the #1 safety rule structural rather than per-step discipline:
 *
 *   ⛔ A short timeout must NEVER wrap the interactive prompt. A permission dialog
 *      waits for the user for as long as they need; timing it out mid-display lets
 *      the app present the next modal on top → the exact freeze this system prevents.
 */
export interface StartupStep {
  /** Stable id for logging/telemetry (e.g. 'att', 'ad-consent'). */
  id: string;

  /**
   * Cheap, LOCAL check whether this step needs to run at all (idempotence / resume
   * after a mid-sequence force-quit). MUST be fast and side-effect free — no network,
   * no UI. If it returns false the step (prepare + present) is skipped entirely.
   */
  shouldRun(): Promise<boolean>;

  /**
   * Optional NON-INTERACTIVE preparation (e.g. a network status fetch). The
   * orchestrator wraps this with `prepTimeoutMs`. If it throws or times out, this
   * step's `present()` is skipped but the overall sequence continues (fail-open).
   * Must show NO UI.
   */
  prepare?(): Promise<void>;

  /**
   * INTERACTIVE phase: shows the modal and resolves ONLY when the user has
   * dismissed it. The orchestrator applies NO short timeout here (only a long
   * crash-only safety net). Keep all user-facing waiting in this method.
   */
  present(): Promise<void>;

  /** Timeout (ms) for `prepare()` only. Ignored when the step has no `prepare()`. */
  prepTimeoutMs: number;

  /**
   * Reserved. If true, a failed step would abort the sequence. Default (false)
   * is fail-open: a broken step never blocks the app from starting.
   */
  critical?: boolean;
}
