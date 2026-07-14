// Tutorial ↔ achievement-modal handshake — Regression Suite
//
// WHY THIS EXISTS (July 14, 2026): the "create your first habit/goal" tutorial steps
// must hold until the user dismisses the achievement celebration, but must NOT wait at
// all when no celebration is coming. Two shipped regressions came from confusing those:
//
//   1. A 10s fallback fired on every first run (the goals split-brain meant `first-goal`
//      never unlocked) → tutorial looked frozen.
//   2. "Fixing" that by shortening the fallback to 1.5s meant the tutorial always jumped
//      ahead before the user could dismiss the modal → the user saw NO achievement at all,
//      on their very first run, and got no visible XP for it.
//
// These tests pin both ends: never wait for a modal that isn't coming, always wait for
// one that is.

import { DeviceEventEmitter } from 'react-native';
import { armTutorialAchievementGate } from '../tutorialAchievementGate';

// The gate asks the achievement store whether the achievement is already owned.
const mockHasAchievement = jest.fn();
jest.mock('@/src/contexts/TutorialContext', () => ({
  hasAchievement: (id: string) => mockHasAchievement(id),
}));

/**
 * The global setup stubs DeviceEventEmitter with inert jest.fn()s — emit() dispatches
 * nothing. This gate IS event plumbing, so give it a working emitter by implementing the
 * shared mock (same object the module under test imports).
 */
function installWorkingEventEmitter() {
  const listeners: Record<string, Array<(payload: any) => void>> = {};

  (DeviceEventEmitter.addListener as jest.Mock).mockImplementation(
    (name: string, cb: (payload: any) => void) => {
      (listeners[name] ??= []).push(cb);
      return {
        remove: () => {
          listeners[name] = (listeners[name] ?? []).filter(l => l !== cb);
        },
      };
    }
  );

  (DeviceEventEmitter.emit as jest.Mock).mockImplementation((name: string, payload?: any) => {
    [...(listeners[name] ?? [])].forEach(cb => cb(payload));
  });
}

/** Did `promise` settle within `ms`? Used to assert "waits" vs "does not wait". */
async function settledWithin(promise: Promise<unknown>, ms: number): Promise<boolean> {
  let settled = false;
  void promise.then(() => {
    settled = true;
  });

  await jest.advanceTimersByTimeAsync(ms);
  return settled;
}

const emitUnlock = (id: string) =>
  DeviceEventEmitter.emit('achievementUnlocked', { achievement: { id }, xpAwarded: 50 });
const emitDismiss = () => DeviceEventEmitter.emit('achievementCelebrationClosed');

describe('armTutorialAchievementGate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockHasAchievement.mockReset();
    installWorkingEventEmitter();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('FIRST RUN: waits for the user to dismiss the celebration, however long that takes', async () => {
    mockHasAchievement.mockResolvedValue(false); // not owned yet → it will unlock

    const gate = armTutorialAchievementGate('first-goal');
    const waiting = gate.wait();

    emitUnlock('first-goal');

    // The user is reading the modal. The tutorial must NOT run ahead — this is exactly
    // the 1.5s regression that hid the achievement from the user.
    expect(await settledWithin(waiting, 10000)).toBe(false);

    // Only the user's dismissal releases it.
    emitDismiss();
    await expect(waiting).resolves.toBeUndefined();
  });

  it('RESTART: does not wait at all when the achievement is already owned', async () => {
    mockHasAchievement.mockResolvedValue(true); // already unlocked → no modal will appear

    const gate = armTutorialAchievementGate('first-goal');
    const waiting = gate.wait();

    // Only the short form-close delay — no dead waiting on a modal that isn't coming.
    expect(await settledWithin(waiting, 500)).toBe(true);
    await expect(waiting).resolves.toBeUndefined();
  });

  it('BROKEN UNLOCK: advances instead of stranding the user when the unlock never fires', async () => {
    mockHasAchievement.mockResolvedValue(false); // expected to unlock...
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const gate = armTutorialAchievementGate('first-goal');
    const waiting = gate.wait();

    // ...but nothing ever unlocks (the split-brain scenario). The gate must give up.
    expect(await settledWithin(waiting, 3000)).toBe(false); // still within the unlock window
    expect(await settledWithin(waiting, 4000)).toBe(true); // window elapsed → advance
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('ignores unlock events for a different achievement', async () => {
    mockHasAchievement.mockResolvedValue(false);

    const gate = armTutorialAchievementGate('first-goal');
    const waiting = gate.wait();

    emitUnlock('first-habit'); // not ours — must not satisfy the gate
    emitDismiss();

    // Still waiting on OUR unlock; it never comes, so only the timeout releases it.
    expect(await settledWithin(waiting, 3000)).toBe(false);
  });
});
