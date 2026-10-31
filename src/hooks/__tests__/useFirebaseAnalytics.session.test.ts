/**
 * The Analytics bridge in the two kinds of session:
 * - development (Metro): collection is switched OFF and nothing is sent, so
 *   developer activity stays out of the real numbers;
 * - store build: unchanged — collection is enabled on every start (this is what
 *   heals the persisted "off" a development session leaves behind) and events flow.
 */
const mockFirebase = {
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  logEvent: jest.fn(() => Promise.resolve()),
  setUserProperty: jest.fn(() => Promise.resolve()),
  setUserId: jest.fn(() => Promise.resolve()),
};
let mockDevelopmentSession = false;

// The shared Jest setup registers its own 'react-native' stand-in without Platform,
// and an already-created mock cannot be replaced with doMock — so Platform is added
// to that same object (each test file has its own registry, nothing leaks).
(require('react-native') as { Platform?: { OS: string } }).Platform = { OS: 'ios' };

type Bridge = typeof import('../useFirebaseAnalytics');
let bridge: Bridge;

function loadBridge(): Bridge {
  let mod!: Bridge;
  jest.isolateModules(() => {
    jest.doMock('@react-native-firebase/analytics', () => ({
      getAnalytics: () => ({ app: 'default' }),
      logEvent: (...args: unknown[]) => (mockFirebase.logEvent as jest.Mock)(...args),
      setAnalyticsCollectionEnabled: (...args: unknown[]) =>
        (mockFirebase.setAnalyticsCollectionEnabled as jest.Mock)(...args),
      setUserId: (...args: unknown[]) => (mockFirebase.setUserId as jest.Mock)(...args),
      setUserProperty: (...args: unknown[]) => (mockFirebase.setUserProperty as jest.Mock)(...args),
    }));
    jest.doMock('../../config/diagnosticsMode', () => ({
      isDevelopmentSession: () => mockDevelopmentSession,
    }));
    mod = require('../useFirebaseAnalytics');
  });
  return mod;
}

beforeEach(() => {
  mockDevelopmentSession = false;
  Object.values(mockFirebase).forEach(fn => fn.mockClear());
  bridge = loadBridge();
});

describe('development session', () => {
  beforeEach(() => {
    mockDevelopmentSession = true;
  });

  it('switches collection OFF as soon as it is asked to', async () => {
    await expect(bridge.applyDevelopmentSessionPolicy()).resolves.toBe(true);

    expect(mockFirebase.setAnalyticsCollectionEnabled).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('never enables collection or sends app_open after startup', async () => {
    await bridge.initAnalyticsAfterConsent();

    expect(mockFirebase.setAnalyticsCollectionEnabled).not.toHaveBeenCalledWith(expect.anything(), true);
    expect(mockFirebase.logEvent).not.toHaveBeenCalled();
  });

  it('sends no events and no user properties from anywhere in the app', async () => {
    await bridge.FirebaseAnalytics.logEvent('att_permission_response', { status: 'granted' });
    await bridge.FirebaseAnalytics.setUserProperty('onb_result', 'completed');

    expect(mockFirebase.logEvent).not.toHaveBeenCalled();
    expect(mockFirebase.setUserProperty).not.toHaveBeenCalled();
  });

  it('survives a failing Firebase call', async () => {
    mockFirebase.setAnalyticsCollectionEnabled.mockRejectedValueOnce(new Error('native'));
    await expect(bridge.applyDevelopmentSessionPolicy()).resolves.toBe(true);
  });
});

describe('store build', () => {
  it('does not touch collection when asked to apply the development policy', async () => {
    await expect(bridge.applyDevelopmentSessionPolicy()).resolves.toBe(false);

    expect(mockFirebase.setAnalyticsCollectionEnabled).not.toHaveBeenCalled();
  });

  it('enables collection on every start and sends app_open', async () => {
    await bridge.initAnalyticsAfterConsent();

    expect(mockFirebase.setAnalyticsCollectionEnabled).toHaveBeenCalledWith(expect.anything(), true);
    expect(mockFirebase.logEvent).toHaveBeenCalledWith(
      expect.anything(),
      'app_open',
      expect.objectContaining({ platform: 'ios' })
    );
  });

  it('still sends events and user properties', async () => {
    await bridge.FirebaseAnalytics.logEvent('onb_start', { x: 1 });
    await bridge.FirebaseAnalytics.setUserProperty('onb_result', 'completed');

    expect(mockFirebase.logEvent).toHaveBeenCalledTimes(1);
    expect(mockFirebase.setUserProperty).toHaveBeenCalledTimes(1);
  });
});
