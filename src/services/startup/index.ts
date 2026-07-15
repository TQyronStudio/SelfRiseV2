/**
 * Startup Orchestrator — app wiring (the shared singleton).
 *
 * This is the ONE instance both `app/_layout.tsx` (runs the sequence) and
 * `TutorialContext` (waits on it) must import, so they coordinate on the same
 * barrier. The pipeline order IS the modal order: ATT first, then UMP consent.
 *
 * Adding a future startup modal (an EU consent, etc.) = one more entry here.
 */
import { createStartupOrchestrator } from './startupOrchestrator';
import { attStep } from './steps/attStep';
import { adConsentStep } from './steps/adConsentStep';

const orchestrator = createStartupOrchestrator([attStep, adConsentStep]);

/** Run the first-launch modal sequence (ATT → UMP). Safe to call once on startup. */
export const runStartupSequence = (): Promise<void> => orchestrator.runStartupSequence();

/** Resolves once every startup modal has been dismissed. Gate app UI behind this. */
export const awaitStartupComplete = (): Promise<void> => orchestrator.awaitStartupComplete();
