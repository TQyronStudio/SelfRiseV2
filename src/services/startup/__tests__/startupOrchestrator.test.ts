// Startup Orchestrator — Regression Suite
//
// WHY THIS EXISTS (July 2026): the first-launch freeze came from presenting an RN
// modal while a native permission/consent modal was still on screen. The orchestrator
// prevents that by running startup modals STRICTLY one at a time and gating app UI
// behind completion. Two earlier attempts got the details wrong; these tests pin the
// two rules that MUST hold, plus the sequencing/resume guarantees:
//
//   RULE #1  The interactive present() is NEVER cut off by a short timeout. A prompt
//            waits for the user for as long as they take; a timeout firing mid-display
//            would let the next modal present on top → the exact freeze. (Only the
//            non-interactive prepare() is timed out, fail-open.)
//   RULE #2  The sequence always COMPLETES (even when steps are skipped), so the
//            caller's unconditional post-startup work — ads init + Crashlytics enable —
//            always gets to run, including for non-EEA users who see no consent form.

import { createStartupOrchestrator } from '../startupOrchestrator';
import type { StartupStep } from '../types';

const noAppReady = async () => {};

function deferred<T = void>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function mkStep(
  id: string,
  o: {
    shouldRun?: () => Promise<boolean>;
    prepare?: () => Promise<void>;
    present?: () => Promise<void>;
    prepTimeoutMs?: number;
  } = {}
): StartupStep {
  return {
    id,
    prepTimeoutMs: o.prepTimeoutMs ?? 0,
    shouldRun: o.shouldRun ?? (async () => true),
    ...(o.prepare ? { prepare: o.prepare } : {}),
    present: o.present ?? (async () => {}),
  };
}

// Flush pending microtasks (and 0ms timers) under fake timers.
const flush = () => jest.advanceTimersByTimeAsync(0);

describe('StartupOrchestrator', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('runs steps STRICTLY one at a time — B waits for A to finish presenting', async () => {
    const order: string[] = [];
    const aPresent = deferred();

    const stepA = mkStep('a', {
      present: async () => {
        order.push('a:start');
        await aPresent.promise;
        order.push('a:end');
      },
    });
    const stepB = mkStep('b', { present: async () => void order.push('b:start') });

    const orch = createStartupOrchestrator([stepA, stepB], { waitForAppReady: noAppReady });
    const run = orch.runStartupSequence();

    await flush();
    expect(order).toEqual(['a:start']); // B must NOT have started

    aPresent.resolve();
    await flush();
    await run;
    expect(order).toEqual(['a:start', 'a:end', 'b:start']);
  });

  it('RULE #1: a slow present() is NEVER cut short by a timeout', async () => {
    const bPresent = jest.fn(async () => {});
    const aPresent = deferred();

    const stepA = mkStep('a', { present: () => aPresent.promise });
    const stepB = mkStep('b', { present: bPresent });

    const orch = createStartupOrchestrator([stepA, stepB], { waitForAppReady: noAppReady });
    const run = orch.runStartupSequence();
    await flush();

    // Simulate a user staring at the prompt for a long time. There is NO short
    // timeout, so the sequence must still be parked on step A.
    await jest.advanceTimersByTimeAsync(60_000);
    expect(bPresent).not.toHaveBeenCalled();

    // Only the user's dismissal advances it.
    aPresent.resolve();
    await flush();
    await run;
    expect(bPresent).toHaveBeenCalledTimes(1);
  });

  it('RULE #1 contrast: a hung prepare() IS timed out (fail-open) and its modal skipped', async () => {
    const aPrepare = deferred(); // never resolves — simulates a stalled network fetch
    const aPresent = jest.fn(async () => {});
    const bPresent = jest.fn(async () => {});

    const stepA = mkStep('a', { prepare: () => aPrepare.promise, present: aPresent, prepTimeoutMs: 5000 });
    const stepB = mkStep('b', { present: bPresent });

    const orch = createStartupOrchestrator([stepA, stepB], { waitForAppReady: noAppReady });
    const run = orch.runStartupSequence();

    await jest.advanceTimersByTimeAsync(5000); // fire the prepare timeout
    await run;

    expect(aPresent).not.toHaveBeenCalled(); // its modal was skipped
    expect(bPresent).toHaveBeenCalledTimes(1); // ...but the sequence continued
  });

  it('a prepare() that REJECTS skips its modal (fail-open) and the sequence continues', async () => {
    const aPresent = jest.fn(async () => {});
    const bPresent = jest.fn(async () => {});

    const stepA = mkStep('a', {
      prepare: async () => {
        throw new Error('network down');
      },
      present: aPresent,
      prepTimeoutMs: 5000,
    });
    const stepB = mkStep('b', { present: bPresent });

    const orch = createStartupOrchestrator([stepA, stepB], { waitForAppReady: noAppReady });
    await expect(orch.runStartupSequence()).resolves.toBeUndefined();

    expect(aPresent).not.toHaveBeenCalled();
    expect(bPresent).toHaveBeenCalledTimes(1);
  });

  it('idempotence/resume: a step whose shouldRun() is false is skipped entirely', async () => {
    const aPresent = jest.fn(async () => {});
    const bPresent = jest.fn(async () => {});

    const stepA = mkStep('a', { shouldRun: async () => false, present: aPresent });
    const stepB = mkStep('b', { present: bPresent });

    const orch = createStartupOrchestrator([stepA, stepB], { waitForAppReady: noAppReady });
    await orch.runStartupSequence();

    expect(aPresent).not.toHaveBeenCalled();
    expect(bPresent).toHaveBeenCalledTimes(1);
  });

  it('RULE #2: the sequence completes even when every step is skipped (so finalize always runs)', async () => {
    const orch = createStartupOrchestrator([mkStep('a', { shouldRun: async () => false })], {
      waitForAppReady: noAppReady,
    });
    await expect(orch.runStartupSequence()).resolves.toBeUndefined();
    await expect(orch.awaitStartupComplete()).resolves.toBeUndefined();
  });

  it('fail-open: a present() that throws does not abort the sequence', async () => {
    const bPresent = jest.fn(async () => {});
    const stepA = mkStep('a', {
      present: async () => {
        throw new Error('boom');
      },
    });
    const stepB = mkStep('b', { present: bPresent });

    const orch = createStartupOrchestrator([stepA, stepB], { waitForAppReady: noAppReady });
    await expect(orch.runStartupSequence()).resolves.toBeUndefined();
    expect(bPresent).toHaveBeenCalledTimes(1);
  });

  it('extensibility: adding a 3rd step just runs it in order, nothing else changes', async () => {
    const order: string[] = [];
    const steps = ['a', 'b', 'c'].map((id) =>
      mkStep(id, { present: async () => void order.push(id) })
    );

    const orch = createStartupOrchestrator(steps, { waitForAppReady: noAppReady });
    await orch.runStartupSequence();

    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('awaitStartupComplete resolves for both early and late waiters', async () => {
    const orch = createStartupOrchestrator([mkStep('a')], { waitForAppReady: noAppReady });

    let earlyResolved = false;
    orch.awaitStartupComplete().then(() => {
      earlyResolved = true;
    });

    await orch.runStartupSequence();
    await flush();

    expect(earlyResolved).toBe(true);
    // Late waiter (after completion) resolves immediately.
    await expect(orch.awaitStartupComplete()).resolves.toBeUndefined();
  });

  it('runStartupSequence is idempotent — a second call never re-runs the steps', async () => {
    const presentSpy = jest.fn(async () => {});
    const orch = createStartupOrchestrator([mkStep('a', { present: presentSpy })], {
      waitForAppReady: noAppReady,
    });

    await orch.runStartupSequence();
    await orch.runStartupSequence();

    expect(presentSpy).toHaveBeenCalledTimes(1);
  });
});
