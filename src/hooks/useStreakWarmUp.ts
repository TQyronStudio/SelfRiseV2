/**
 * Warming up a frozen journal streak, right on the card (migration E11a moved the
 * logic here from Home's old GratitudeStreakCard; E11c rebuilt the flow for the
 * inline rescue — plan point 5c, decision E11/6). Shared by Home's streak card
 * and, from E12, the Journal. Tested in __tests__/useStreakWarmUp.test.tsx.
 *
 * - One ad = one missed day (adService → applySingleWarmUpPayment).
 * - After EVERY payment the shared streak is refreshed (refreshStats), so a day
 *   paid on Home is paid in the Journal at once (the context does not refresh
 *   after a payment on its own).
 * - `progress` = the missed days and how many are paid (getWarmUpPaymentProgress):
 *   the card draws one snowflake per day that turns into a sun.
 * - No success windows: the flame is the confirmation (ice → warming → fire).
 *   The technical branches (a day left frozen after the last ad, repeated
 *   failures) fix themselves without a window, as before.
 * - Problems go to the calm note (ProblemNote): ad errors with "Try again", a
 *   failed reset, and — only if warming truly failed — the ad error sentence.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGratitude } from '../contexts/GratitudeContext';
import { adService } from '../services/adService';
import { useProblemNote } from '../components/ui/ProblemNote';
import { useI18n } from './useI18n';

export interface WarmUpProgress {
  /** Missed days of the current freeze. */
  total: number;
  /** Of those, already paid with an ad. */
  paid: number;
}

export function useStreakWarmUp() {
  const { t } = useI18n();
  const { state, actions } = useGratitude();
  const { showProblem } = useProblemNote();
  const [progress, setProgress] = useState<WarmUpProgress | null>(null);
  // Prevents a second ad while one plays (a ref: two taps in one frame both
  // read a stale `false` from state).
  const watching = useRef(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const latest = useRef(actions);
  latest.current = actions;
  // "Try again" on the note calls the newest watchAd.
  const watchAdRef = useRef<() => Promise<boolean>>(async () => false);

  // A failed read keeps what the card shows (or the streak's frozen days) —
  // never a made-up "0 of 1".
  const loadProgress = useCallback(async () => {
    try {
      const p = await latest.current.getWarmUpPaymentProgress();
      setProgress({ total: p.totalMissedDays, paid: p.paidDays });
    } catch {
      // keep the last progress
    }
  }, []);

  // While frozen, follow the debt (it can change at midnight or in the Journal).
  // After the warm-up the last progress stays: the card shows the paid days
  // while the flame catches.
  const frozen = state.streakInfo?.isFrozen ?? false;
  const frozenDays = state.streakInfo?.frozenDays ?? 0;
  useEffect(() => {
    if (frozen) void loadProgress();
  }, [frozen, frozenDays, loadProgress]);

  /**
   * Debt-free without ads (the same payments, no ad): when the last ad was
   * watched but a day stayed frozen. Returns false if even that failed.
   */
  const forceResetDebt = useCallback(async (): Promise<boolean> => {
    try {
      const a = latest.current;
      let remaining = await a.adsNeededToWarmUp();
      for (let i = 0; i < 3 && remaining > 0; i++) {
        const result = await a.applySingleWarmUpPayment();
        remaining = result.remainingFrozenDays;
      }
      await a.refreshStats();
      return true;
    } catch {
      return false;
    }
  }, []);

  /** The last day is paid: make sure nothing stayed frozen, quietly. */
  const finish = useCallback(async () => {
    try {
      await latest.current.refreshStats();
      const remaining = await latest.current.calculateFrozenDays();
      if (remaining > 0 && !(await forceResetDebt())) {
        showProblem({ message: t('journal.rescue.adError.message') });
      }
    } catch {
      if (!(await forceResetDebt())) {
        showProblem({ message: t('journal.rescue.adError.message') });
      }
    }
  }, [forceResetDebt, showProblem, t]);

  /** Shows one rewarded ad; a full view pays one frozen day. True = paid. */
  const watchAd = useCallback(async (): Promise<boolean> => {
    if (watching.current) return false;
    watching.current = true;
    setIsWatchingAd(true);
    const retry = () => void watchAdRef.current();
    try {
      const adResult = await adService.showRewardedAd();
      if (!adResult.rewarded) {
        const key =
          adResult.error === 'AD_DISMISSED_EARLY'
            ? 'journal.rescue.adDismissed.message'
            : adResult.error === 'AD_LOAD_FAILED'
              ? 'journal.rescue.adLoadFailed.message'
              : 'journal.rescue.adError.message';
        showProblem({ message: t(key), retry });
        return false;
      }
      const payment = await latest.current.applySingleWarmUpPayment();
      if (payment.isFullyWarmed) {
        await finish();
      } else {
        await latest.current.refreshStats();
      }
      await loadProgress();
      return true;
    } catch {
      showProblem({ message: t('journal.rescue.adError.message'), retry });
      return false;
    } finally {
      watching.current = false;
      setIsWatchingAd(false);
    }
  }, [finish, loadProgress, showProblem, t]);
  watchAdRef.current = watchAd;

  /** "Start fresh": the streak goes to 0 (the card asks before). */
  const startFresh = useCallback(async () => {
    try {
      await latest.current.resetStreak();
      await latest.current.refreshStats();
      setProgress(null);
    } catch {
      showProblem({ message: t('journal.rescue.resetFailed.message') });
    }
  }, [showProblem, t]);

  return { progress, isWatchingAd, watchAd, startFresh };
}
