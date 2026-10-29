import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Banner load retry policy (see technical-guides:AdMob.md → Banner retry).
 *
 * A failed banner load is retried at most twice: 10 s after the first failure,
 * then 20 s after the second. Only "no fill" and network errors are retried —
 * other errors (invalid request, app id missing, …) will not fix themselves.
 * While waiting, and after giving up, the banner is hidden without empty space.
 */
export const BANNER_RETRY_DELAYS_MS = [10_000, 20_000] as const;

export const AD_BANNER_FAILED_EVENT = 'ad_banner_failed';

// react-native-google-mobile-ads reports string codes ("googleMobileAds/no-fill"),
// not the SDK's numeric ones — and those differ per platform (no fill is 3 on
// Android, 1 on iOS), so the string is the only portable identity.
const RETRYABLE_CODES = new Set(['no-fill', 'network-error']);

/** Short, Firebase-safe error code: "googleMobileAds/no-fill" → "no-fill". */
export function getBannerErrorCode(error: unknown): string {
  const raw = (error as { code?: unknown } | null)?.code;
  if (typeof raw !== 'string') return 'unknown';
  const code = raw.replace(/^googleMobileAds\//, '');
  return /^[a-z0-9-]{1,40}$/.test(code) ? code : 'unknown';
}

export function isRetryableBannerError(code: string): boolean {
  return RETRYABLE_CODES.has(code);
}

// Fire-and-forget; lazy bridge keeps the native Firebase module out of the Jest
// graph (technical-guides:Analytics.md, rule 5). logEvent never throws.
function logBannerFailure(code: string, attempt: number, willRetry: boolean): void {
  try {
    const { FirebaseAnalytics } =
      require('../../hooks/useFirebaseAnalytics') as typeof import('../../hooks/useFirebaseAnalytics');
    void FirebaseAnalytics.logEvent(AD_BANNER_FAILED_EVENT, {
      code,
      attempt,
      will_retry: willRetry ? 1 : 0,
    });
  } catch (error) {
    console.warn('[AdBanner] analytics failed (ignored):', error);
  }
}

type Phase = 'loading' | 'waiting' | 'gaveUp';

interface BannerRetryState {
  phase: Phase;
  /** Consecutive failed loads since the last successful one. */
  failures: number;
  /** Changes on every retry so the BannerAd remounts and requests a new ad. */
  adKey: number;
}

export interface BannerRetry {
  /** Render the BannerAd; false while waiting for a retry and after giving up. */
  shouldRender: boolean;
  adKey: number;
  onLoaded: () => void;
  onFailed: (error: unknown) => void;
}

/**
 * @param isFocused the hosting screen is focused; tab screens stay mounted when
 *   the user switches tabs, so the pending retry is paused on blur (not just on
 *   unmount) and rescheduled with its full delay on return.
 */
export function useBannerRetry(isFocused: boolean): BannerRetry {
  const [state, setState] = useState<BannerRetryState>({ phase: 'loading', failures: 0, adKey: 0 });
  // Mirror for the callbacks: logging must happen once per failure, outside a
  // state updater (StrictMode may run updaters twice).
  const stateRef = useRef(state);

  const update = useCallback((next: BannerRetryState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const onLoaded = useCallback(() => {
    const prev = stateRef.current;
    if (prev.failures !== 0) update({ ...prev, failures: 0 });
  }, [update]);

  const onFailed = useCallback(
    (error: unknown) => {
      const prev = stateRef.current;
      // A late event from a BannerAd that is no longer shown must not count.
      if (prev.phase !== 'loading') return;
      const code = getBannerErrorCode(error);
      const failures = prev.failures + 1;
      const willRetry = isRetryableBannerError(code) && failures <= BANNER_RETRY_DELAYS_MS.length;
      logBannerFailure(code, failures, willRetry);
      update({ ...prev, failures, phase: willRetry ? 'waiting' : 'gaveUp' });
    },
    [update]
  );

  useEffect(() => {
    if (state.phase !== 'waiting' || !isFocused) return;
    const timer = setTimeout(() => {
      const prev = stateRef.current;
      update({ ...prev, phase: 'loading', adKey: prev.adKey + 1 });
    }, BANNER_RETRY_DELAYS_MS[state.failures - 1]);
    return () => clearTimeout(timer);
  }, [state.phase, state.failures, isFocused, update]);

  return { shouldRender: state.phase === 'loading', adKey: state.adKey, onLoaded, onFailed };
}
