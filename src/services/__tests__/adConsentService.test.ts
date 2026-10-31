/**
 * Startup work that must run after the consent flow: crash reporting and ads.
 *
 * The point of these tests is independence and the development-session switch:
 * crash reporting used to wait for `mobileAds().initialize()`, so a slow or hanging
 * ads SDK kept it off — and a dev build's crashes went to the real Crashlytics data.
 */

const flush = () => new Promise(resolve => setImmediate(resolve));

const mockCrashReporting = { enable: jest.fn(), disable: jest.fn() };

let mockAdsInitialize: jest.Mock;
let mockDevelopmentSession = false;

jest.mock('../crashReportingService', () => ({
  CrashReportingService: {
    enable: (...args: unknown[]) => mockCrashReporting.enable(...args),
    disable: (...args: unknown[]) => mockCrashReporting.disable(...args),
  },
}));

jest.mock('../../config/diagnosticsMode', () => ({
  isDevelopmentSession: () => mockDevelopmentSession,
}));

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({ initialize: (...args: unknown[]) => mockAdsInitialize(...args) }),
  AdsConsent: {},
  AdsConsentPrivacyOptionsRequirementStatus: { REQUIRED: 'REQUIRED' },
}));

function loadService() {
  let mod!: typeof import('../adConsentService');
  jest.isolateModules(() => {
    mod = require('../adConsentService');
  });
  return mod;
}

beforeEach(() => {
  mockDevelopmentSession = false;
  mockCrashReporting.enable.mockReset().mockResolvedValue(undefined);
  mockCrashReporting.disable.mockReset().mockResolvedValue(undefined);
  mockAdsInitialize = jest.fn(() => Promise.resolve());
});

describe('finalizeAdsAndDiagnostics', () => {
  it('turns crash reporting on and initializes ads for real users', async () => {
    const { finalizeAdsAndDiagnostics } = loadService();

    await finalizeAdsAndDiagnostics();

    expect(mockCrashReporting.enable).toHaveBeenCalledTimes(1);
    expect(mockCrashReporting.disable).not.toHaveBeenCalled();
    expect(mockAdsInitialize).toHaveBeenCalledTimes(1);
  });

  it('turns crash reporting on even when ads initialization never finishes', async () => {
    mockAdsInitialize = jest.fn(() => new Promise(() => {})); // hangs forever
    const { finalizeAdsAndDiagnostics } = loadService();

    void finalizeAdsAndDiagnostics(); // never resolves — by design of this test
    await flush();

    expect(mockCrashReporting.enable).toHaveBeenCalledTimes(1);
  });

  it('still initializes ads when crash reporting fails', async () => {
    mockCrashReporting.enable.mockRejectedValue(new Error('native module exploded'));
    const { finalizeAdsAndDiagnostics } = loadService();

    await expect(finalizeAdsAndDiagnostics()).resolves.toBeUndefined();

    expect(mockAdsInitialize).toHaveBeenCalledTimes(1);
  });

  it('in a development session switches crash reporting OFF instead of on', async () => {
    mockDevelopmentSession = true;
    const { finalizeAdsAndDiagnostics } = loadService();

    await finalizeAdsAndDiagnostics();

    expect(mockCrashReporting.disable).toHaveBeenCalledTimes(1);
    expect(mockCrashReporting.enable).not.toHaveBeenCalled();
    expect(mockAdsInitialize).toHaveBeenCalledTimes(1); // ads are unaffected
  });
});
