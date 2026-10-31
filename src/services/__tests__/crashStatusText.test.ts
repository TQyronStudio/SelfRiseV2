import { describeCrashStatus, isReadyForTestCrash, CrashStatusInput } from '../crashStatusText';

const status = (overrides: Partial<CrashStatusInput> = {}): CrashStatusInput => ({
  moduleAvailable: true,
  enabledAtLaunch: true,
  requestedThisSession: true,
  crashedOnPreviousExecution: false,
  ...overrides,
});

describe('isReadyForTestCrash', () => {
  it('is ready only when the module exists, collection was ON at launch and it is not a dev session', () => {
    expect(isReadyForTestCrash(status(), false)).toBe(true);
  });

  it('is not ready when collection was OFF at launch — even if JS has requested ON', () => {
    // The iOS trap: enable() only takes effect from the next launch.
    expect(isReadyForTestCrash(status({ enabledAtLaunch: false, requestedThisSession: true }), false)).toBe(false);
  });

  it('is not ready in a development session', () => {
    expect(isReadyForTestCrash(status(), true)).toBe(false);
  });

  it('is not ready without the native module, and not when the state is unknown', () => {
    expect(isReadyForTestCrash(status({ moduleAvailable: false }), false)).toBe(false);
    expect(isReadyForTestCrash(status({ enabledAtLaunch: null }), false)).toBe(false);
  });
});

describe('describeCrashStatus', () => {
  it('tells a ready device to force a crash', () => {
    expect(describeCrashStatus(status(), false)).toContain('READY: collection was ON at launch');
  });

  it('explains the iOS next-launch rule when collection was OFF at launch', () => {
    const text = describeCrashStatus(status({ enabledAtLaunch: false }), false);
    expect(text).toContain('NOT READY');
    expect(text).toContain('NEXT launch');
  });

  it('tells how to opt in during a development session', () => {
    const text = describeCrashStatus(status(), true);
    expect(text).toContain('EXPO_PUBLIC_ANALYTICS_IN_DEV=true');
    expect(text).not.toContain('READY: collection');
  });

  it('flags a missing module before anything else', () => {
    const text = describeCrashStatus(
      status({ moduleAvailable: false, enabledAtLaunch: null, requestedThisSession: null }),
      true
    );
    expect(text).toContain('Native module: MISSING');
    expect(text).toContain('no Crashlytics module');
  });

  it('shows the values it reports', () => {
    const text = describeCrashStatus(status({ crashedOnPreviousExecution: true }), false);
    expect(text).toContain('Collection at launch: ON');
    expect(text).toContain('Crashed on previous run: yes');
  });
});
