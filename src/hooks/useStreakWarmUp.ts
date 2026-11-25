/**
 * Warming up a frozen journal streak (migration E11a, plan point 5b): the logic
 * that lived inside Home's GratitudeStreakCard — rewarded ad, payment per ad,
 * completion check with its automatic fixes, "start fresh" — moved here
 * UNCHANGED, so Home and the Journal (E12) share one copy. Tested in
 * __tests__/useStreakWarmUp.test.tsx.
 *
 * The hook keeps the state the warm-up sheet needs and a `notice` (success,
 * error, congratulations) for the caller to show; it shows nothing itself.
 */
import { useCallback, useRef, useState } from 'react';
import { useGratitude } from '../contexts/GratitudeContext';
import { adService } from '../services/adService';
import { useI18n } from './useI18n';

export type WarmUpNotice =
  | { kind: 'success' | 'error' | 'congratulations'; title: string; message: string }
  | null;

export function useStreakWarmUp() {
  const { t } = useI18n();
  const { actions } = useGratitude();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);
  const [totalAdsNeeded, setTotalAdsNeeded] = useState(0);
  const [notice, setNotice] = useState<WarmUpNotice>(null);
  // Prevents a second ad while one plays (a ref: two taps in one frame both
  // read a stale `false` from state).
  const watching = useRef(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const retries = useRef(0);

  const success = useCallback((title: string, message: string) => setNotice({ kind: 'success', title, message }), []);
  const error = useCallback((title: string, message: string) => setNotice({ kind: 'error', title, message }), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  /** Opens the warm-up (fresh count of ads needed); nothing to pay = a success note. */
  const openWarmUp = useCallback(async () => {
    setAdsWatched(0);
    const adsNeeded = await actions.adsNeededToWarmUp();
    setTotalAdsNeeded(adsNeeded);
    if (adsNeeded === 0) {
      success(t('journal.rescue.noDebt.title'), t('journal.rescue.noDebt.message'));
      return;
    }
    setSheetOpen(true);
  }, [actions, success, t]);

  /** Shows one rewarded ad; a full view pays one frozen day. True = paid. */
  const watchAd = useCallback(async (): Promise<boolean> => {
    if (watching.current) return false;
    watching.current = true;
    setIsWatchingAd(true);
    try {
      const adResult = await adService.showRewardedAd();
      if (!adResult.rewarded) {
        if (adResult.error === 'AD_DISMISSED_EARLY') {
          error(t('journal.rescue.adDismissed.title'), t('journal.rescue.adDismissed.message'));
        } else if (adResult.error === 'AD_LOAD_FAILED') {
          error(t('journal.rescue.adLoadFailed.title'), t('journal.rescue.adLoadFailed.message'));
        } else {
          error(t('journal.rescue.adError.title'), t('journal.rescue.adError.message'));
        }
        return false;
      }
      const payment = await actions.applySingleWarmUpPayment();
      setAdsWatched(prev => {
        const next = prev + 1;
        if (payment.isFullyWarmed) setTotalAdsNeeded(next);
        return next;
      });
      return true;
    } catch {
      error(t('journal.rescue.adError.title'), t('journal.rescue.adError.message'));
      return false;
    } finally {
      watching.current = false;
      setIsWatchingAd(false);
    }
  }, [actions, error, t]);

  /**
   * Debt-free without ads (the same payments, no ad): used when the warm-up was
   * fully watched but a day stayed frozen, or after repeated technical failures.
   */
  const forceResetDebt = useCallback(async () => {
    try {
      let remaining = await actions.adsNeededToWarmUp();
      for (let i = 0; i < 3 && remaining > 0; i++) {
        const result = await actions.applySingleWarmUpPayment();
        remaining = result.remainingFrozenDays;
      }
      setAdsWatched(0);
      setTotalAdsNeeded(0);
      await actions.refreshStats();
      success(t('journal.rescue.issueResolved.title'), t('journal.rescue.issueResolved.message'));
    } catch {
      error(t('journal.rescue.resetFailed.title'), t('journal.rescue.resetFailed.message'));
    }
  }, [actions, success, error, t]);

  /** The sheet says all ads were watched: verify, fix leftovers, congratulate. */
  const completeWarmUp = useCallback(async () => {
    try {
      setSheetOpen(false);
      setAdsWatched(0);
      setTotalAdsNeeded(0);
      await actions.refreshStats();
      const remainingDebt = await actions.calculateFrozenDays();
      if (remainingDebt > 0) {
        try {
          await forceResetDebt();
          success(t('journal.rescue.autoFixed.title'), t('journal.rescue.autoFixed.message'));
        } catch {
          error(t('journal.rescue.technicalIssue.title'), t('journal.rescue.technicalIssue.message'));
        }
        return;
      }
      setNotice({
        kind: 'congratulations',
        title: t('journal.rescue.congratulations.title'),
        message: t('journal.rescue.congratulations.message'),
      });
    } catch {
      // Progressive: twice "try again", then fix it with an apology.
      if (retries.current < 2) {
        retries.current += 1;
        error(
          t('journal.rescue.technicalIssueRetry.title'),
          t('journal.rescue.technicalIssueRetry.message', { attempt: retries.current })
        );
      } else {
        try {
          await forceResetDebt();
          success(t('journal.rescue.issueResolved.title'), t('journal.rescue.issueResolved.message'));
        } catch {
          error(t('journal.rescue.criticalError.title'), t('journal.rescue.criticalError.message'));
        }
        retries.current = 0;
      }
    }
  }, [actions, forceResetDebt, success, error, t]);

  /** "Start fresh": the streak goes to 0 (the sheet asks before). */
  const startFresh = useCallback(async () => {
    try {
      await actions.resetStreak();
      await actions.refreshStats();
    } catch {
      // the old card only logged it
    }
  }, [actions]);

  return {
    sheetOpen,
    closeSheet: () => setSheetOpen(false),
    adsWatched,
    totalAdsNeeded,
    isWatchingAd,
    notice,
    clearNotice,
    openWarmUp,
    watchAd,
    completeWarmUp,
    startFresh,
  };
}
