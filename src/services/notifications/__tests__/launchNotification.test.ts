/**
 * A reminder tap that launches a killed app must open the right screen — but
 * only once the startup windows are gone, never over onboarding, and never
 * twice (the live listener can see the same tap).
 */

type Deps = {
  waitForStartup: jest.Mock;
  settle: jest.Mock;
  isOnboardingActive: jest.Mock;
  open: jest.Mock;
  clear: jest.Mock;
};

// Fresh module per test: the "already handled" set lives for a whole process.
function load() {
  let mod!: typeof import('../launchNotification');
  jest.isolateModules(() => {
    mod = require('../launchNotification');
  });
  return mod;
}

function deps(overrides: Partial<Deps> = {}): Deps {
  return {
    waitForStartup: jest.fn(() => Promise.resolve()),
    settle: jest.fn(() => Promise.resolve()),
    isOnboardingActive: jest.fn(() => Promise.resolve(false)),
    open: jest.fn(),
    clear: jest.fn(),
    ...overrides,
  };
}

const RESPONSE = { category: 'evening_reminder' };
const KEY = 'evening_reminder_day_1|1760000000000';

describe('openLaunchNotification', () => {
  it('opens the tapped reminder and then forgets it', async () => {
    const { openLaunchNotification } = load();
    const d = deps();

    await openLaunchNotification(RESPONSE, KEY, d);

    expect(d.open).toHaveBeenCalledWith(RESPONSE);
    expect(d.clear).toHaveBeenCalledTimes(1);
  });

  it('waits for the startup windows before navigating', async () => {
    const { openLaunchNotification } = load();
    let finishStartup!: () => void;
    const d = deps({
      waitForStartup: jest.fn(() => new Promise<void>(resolve => (finishStartup = resolve))),
    });

    const pending = openLaunchNotification(RESPONSE, KEY, d);
    await new Promise(resolve => setImmediate(resolve));
    expect(d.open).not.toHaveBeenCalled(); // ATT / consent still on screen

    finishStartup();
    await pending;
    expect(d.open).toHaveBeenCalledTimes(1);
  });

  it('lets navigation settle after startup before navigating', async () => {
    const { openLaunchNotification } = load();
    let settled!: () => void;
    const order: string[] = [];
    const d = deps({
      waitForStartup: jest.fn(async () => {
        order.push('startup');
      }),
      settle: jest.fn(
        () =>
          new Promise<void>(resolve => {
            settled = () => {
              order.push('settled');
              resolve();
            };
          })
      ),
      open: jest.fn(() => order.push('open')),
    });

    const pending = openLaunchNotification(RESPONSE, KEY, d);
    await new Promise(resolve => setImmediate(resolve));
    expect(d.open).not.toHaveBeenCalled();

    settled();
    await pending;
    expect(order).toEqual(['startup', 'settled', 'open']);
  });

  it('does not navigate while onboarding owns the screen', async () => {
    const { openLaunchNotification } = load();
    const d = deps({ isOnboardingActive: jest.fn(() => Promise.resolve(true)) });

    await openLaunchNotification(RESPONSE, KEY, d);

    expect(d.open).not.toHaveBeenCalled();
  });

  it('does not navigate again for a tap the live listener already opened', async () => {
    const { openLaunchNotification, claimNotificationResponse } = load();
    const d = deps();

    expect(claimNotificationResponse(KEY)).toBe(true); // live listener got it first
    await openLaunchNotification(RESPONSE, KEY, d);

    expect(d.open).not.toHaveBeenCalled();
  });

  it('opens a launch tap only once even if asked twice (re-mount, reload)', async () => {
    const { openLaunchNotification } = load();
    const d = deps();

    await openLaunchNotification(RESPONSE, KEY, d);
    await openLaunchNotification(RESPONSE, KEY, d);

    expect(d.open).toHaveBeenCalledTimes(1);
  });

  it('never throws into app startup', async () => {
    const { openLaunchNotification } = load();
    const d = deps({
      open: jest.fn(() => {
        throw new Error('navigator not ready');
      }),
    });

    await expect(openLaunchNotification(RESPONSE, KEY, d)).resolves.toBeUndefined();
  });
});

describe('claimNotificationResponse', () => {
  it('lets each tap through exactly once', () => {
    const { claimNotificationResponse } = load();
    expect(claimNotificationResponse('a|1')).toBe(true);
    expect(claimNotificationResponse('a|1')).toBe(false);
    expect(claimNotificationResponse('b|2')).toBe(true);
  });
});
