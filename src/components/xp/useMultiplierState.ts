/**
 * The XP multiplier as the badge and the level panel show it (migration E7 6a /
 * E9 2b): one read of the services, three states (multiplierStatus — running /
 * ready / building), today's three harmony parts, and switching it on.
 *
 * Read again when XP arrives, when a multiplier starts, when the app comes back
 * and when the running one ends.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { XP_MULTIPLIERS } from '@/src/constants/gamification';
import { XPMultiplierService } from '@/src/services/xpMultiplierService';
import { addAppEventListener } from '@/src/utils/appEvents';
import { today as todayString } from '@/src/utils/date';
import {
  formatFactor,
  multiplierStatus,
  MultiplierStatus,
} from '@/src/services/xpDisplay/multiplierDisplay';

export interface MultiplierState {
  status: MultiplierStatus | null;
  /** Today's harmony parts (a habit, three journal entries, a goal step). */
  today: { habits: boolean; journal: boolean; goals: boolean };
  /** Harmony days in a row (for the windows' overline). */
  harmonyDays: number;
  /** "2×", "2,5×" in the app's language. */
  print: (factor: number) => string;
  /** Switches the harmony multiplier on (ready only; one at a time). */
  activate: () => Promise<Awaited<ReturnType<typeof XPMultiplierService.activateHarmonyMultiplier>> | null>;
}

export function useMultiplierState(): MultiplierState {
  const { t } = useI18n();
  const locale = t('common.locale');
  const [status, setStatus] = useState<MultiplierStatus | null>(null);
  const [today, setToday] = useState({ habits: false, journal: false, goals: false });
  const [harmonyDays, setHarmonyDays] = useState(0);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activating = useRef(false);

  const load = useCallback(async () => {
    try {
      const [active, harmony] = await Promise.all([
        XPMultiplierService.getActiveMultiplier(),
        XPMultiplierService.calculateHarmonyStreak(),
      ]);
      const msLeft = active.isActive ? (active.timeRemaining ?? 0) : 0;
      const cooldownMs = harmony.nextActivationDate ? harmony.nextActivationDate.getTime() - Date.now() : 0;
      setStatus(
        multiplierStatus(
          {
            harmonyDays: harmony.currentStreak,
            running:
              active.isActive && msLeft > 0
                ? { factor: active.multiplier, minutesLeft: Math.ceil(msLeft / 60000) }
                : null,
            cooldownHoursLeft: harmony.canActivateMultiplier || cooldownMs <= 0 ? 0 : cooldownMs / 3600000,
          },
          XP_MULTIPLIERS.HARMONY_STREAK_DAYS_REQUIRED
        )
      );
      setHarmonyDays(harmony.currentStreak);
      const day = harmony.streakHistory.find(d => d.date === todayString());
      setToday({
        habits: !!day?.hasHabitActivity,
        journal: !!day?.hasJournalActivity,
        goals: !!day?.hasGoalActivity,
      });
      if (endTimer.current) clearTimeout(endTimer.current);
      if (active.isActive && msLeft > 0) {
        endTimer.current = setTimeout(() => void load(), Math.min(msLeft + 500, 2147483000));
      }
    } catch {
      setStatus(null); // nothing rather than something wrong
    }
  }, []);

  useEffect(() => {
    void load();
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const soon = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => void load(), 1500);
    };
    const subs = [
      addAppEventListener('xpGained', soon),
      addAppEventListener('xpMultiplierActivated', () => void load()),
      AppState.addEventListener('change', s => {
        if (s === 'active') void load();
      }),
    ];
    return () => {
      subs.forEach(s => s.remove());
      if (debounce) clearTimeout(debounce);
      if (endTimer.current) clearTimeout(endTimer.current);
    };
  }, [load]);

  const print = useCallback(
    (factor: number) => formatFactor(factor, new Intl.NumberFormat(locale).format(1.5).charAt(1) || '.'),
    [locale]
  );

  const activate = useCallback(async () => {
    if (activating.current || status?.kind !== 'ready') return null;
    activating.current = true;
    try {
      const result = await XPMultiplierService.activateHarmonyMultiplier();
      await load();
      return result;
    } finally {
      activating.current = false;
    }
  }, [status, load]);

  return { status, today, harmonyDays, print, activate };
}
