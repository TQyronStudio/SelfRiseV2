// Banner retry (2026-10-29)
//
// A banner that fails to load is retried at most twice — 10 s, then 20 s later —
// and only for "no fill" and network errors. Meanwhile it is hidden. Every
// failure goes to Firebase as ad_banner_failed { code, attempt, will_retry }, so
// we can see how often no ad arrives at all.

import { act, renderHook } from '@testing-library/react-native';
import {
  AD_BANNER_FAILED_EVENT,
  BannerRetry,
  getBannerErrorCode,
  useBannerRetry,
} from '../useBannerRetry';

const mockLogEvent = jest.fn((..._args: unknown[]) => Promise.resolve());

jest.mock('../../../hooks/useFirebaseAnalytics', () => ({
  FirebaseAnalytics: { logEvent: (...args: unknown[]) => mockLogEvent(...args) },
}));

// The library's NativeError shape: code "googleMobileAds/<code>"
const adError = (code: string) => Object.assign(new Error(`[googleMobileAds/${code}] x`), {
  code: `googleMobileAds/${code}`,
});
const NO_FILL = adError('no-fill');
const NETWORK = adError('network-error');

function setup(isFocused = true) {
  return renderHook<BannerRetry, { focused: boolean }>(({ focused }) => useBannerRetry(focused), {
    initialProps: { focused: isFocused },
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockLogEvent.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getBannerErrorCode', () => {
  it('strips the library namespace', () => {
    expect(getBannerErrorCode(NO_FILL)).toBe('no-fill');
    expect(getBannerErrorCode(adError('invalid-request'))).toBe('invalid-request');
  });

  it('falls back to "unknown" for anything that is not a short code', () => {
    expect(getBannerErrorCode(new Error('plain'))).toBe('unknown');
    expect(getBannerErrorCode(null)).toBe('unknown');
    expect(getBannerErrorCode({ code: 'googleMobileAds/Some Message With Spaces' })).toBe('unknown');
  });
});

describe('useBannerRetry', () => {
  it('retries no-fill twice (10 s, then 20 s) and then gives up', () => {
    const { result } = setup();
    expect(result.current.shouldRender).toBe(true);
    const firstKey = result.current.adKey;

    act(() => result.current.onFailed(NO_FILL));
    expect(result.current.shouldRender).toBe(false);

    act(() => jest.advanceTimersByTime(9_999));
    expect(result.current.shouldRender).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.shouldRender).toBe(true);
    expect(result.current.adKey).not.toBe(firstKey);

    act(() => result.current.onFailed(NO_FILL));
    act(() => jest.advanceTimersByTime(19_999));
    expect(result.current.shouldRender).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.shouldRender).toBe(true);

    act(() => result.current.onFailed(NO_FILL));
    act(() => jest.advanceTimersByTime(10 * 60_000));
    expect(result.current.shouldRender).toBe(false);

    expect(mockLogEvent.mock.calls).toEqual([
      [AD_BANNER_FAILED_EVENT, { code: 'no-fill', attempt: 1, will_retry: 1 }],
      [AD_BANNER_FAILED_EVENT, { code: 'no-fill', attempt: 2, will_retry: 1 }],
      [AD_BANNER_FAILED_EVENT, { code: 'no-fill', attempt: 3, will_retry: 0 }],
    ]);
  });

  it('retries network errors too', () => {
    const { result } = setup();
    act(() => result.current.onFailed(NETWORK));
    act(() => jest.advanceTimersByTime(10_000));
    expect(result.current.shouldRender).toBe(true);
  });

  it.each(['invalid-request', 'internal-error', 'app-id-missing', 'timeout'])(
    'does not retry %s',
    code => {
      const { result } = setup();
      act(() => result.current.onFailed(adError(code)));
      act(() => jest.advanceTimersByTime(10 * 60_000));
      expect(result.current.shouldRender).toBe(false);
      expect(mockLogEvent).toHaveBeenCalledWith(AD_BANNER_FAILED_EVENT, {
        code,
        attempt: 1,
        will_retry: 0,
      });
    }
  );

  it('a successful load starts the retry budget over', () => {
    const { result } = setup();
    act(() => result.current.onFailed(NO_FILL));
    act(() => jest.advanceTimersByTime(10_000));
    act(() => result.current.onLoaded());

    // A later failure (e.g. a refresh) gets both retries again
    act(() => result.current.onFailed(NO_FILL));
    expect(mockLogEvent).toHaveBeenLastCalledWith(AD_BANNER_FAILED_EVENT, {
      code: 'no-fill',
      attempt: 1,
      will_retry: 1,
    });
    act(() => jest.advanceTimersByTime(10_000));
    expect(result.current.shouldRender).toBe(true);
  });

  it('pauses the pending retry while the screen is not focused', () => {
    const { result, rerender } = setup();
    act(() => result.current.onFailed(NO_FILL));
    act(() => jest.advanceTimersByTime(5_000));

    rerender({ focused: false });
    act(() => jest.advanceTimersByTime(60_000));
    expect(result.current.shouldRender).toBe(false);

    // Back on the screen: the retry is scheduled again with its full delay
    rerender({ focused: true });
    act(() => jest.advanceTimersByTime(9_999));
    expect(result.current.shouldRender).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.shouldRender).toBe(true);
  });

  it('cancels the pending retry on unmount', () => {
    const { result, unmount } = setup();
    act(() => result.current.onFailed(NO_FILL));
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('ignores a failure event while already waiting', () => {
    const { result } = setup();
    act(() => result.current.onFailed(NO_FILL));
    act(() => result.current.onFailed(NO_FILL));
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });
});
