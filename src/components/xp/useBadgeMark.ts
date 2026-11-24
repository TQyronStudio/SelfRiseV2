/**
 * The XP multiplier on the level badge (migration E7 point 6a, L-10, O-4): a gold
 * tag with the factor that REALLY runs (harmony 2×, challenge 1.5×, combo 2.5×,
 * comeback 2× — whatever getActiveMultiplier() says), a still gold dot while the
 * harmony multiplier is ready to switch on, nothing otherwise. The rule is
 * multiplierDisplay.ts (badgeMark, multiplierStatus, formatFactor — tested).
 *
 * Read again when XP arrives (harmony may have just become ready), when a
 * multiplier starts, when the app comes back, and when the running one ends.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { XP_MULTIPLIERS } from '@/src/constants/gamification';
import { XPMultiplierService } from '@/src/services/xpMultiplierService';
import { addAppEventListener } from '@/src/utils/appEvents';
import {
  badgeMark,
  formatFactor,
  multiplierStatus,
  MultiplierStatus,
} from '@/src/services/xpDisplay/multiplierDisplay';
import type { BadgeMark } from './XpDisplay';

export function useBadgeMark(): BadgeMark {
  const { t } = useI18n();
  const locale = t('common.locale');
  const [status, setStatus] = useState<MultiplierStatus | null>(null);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [active, harmony] = await Promise.all([
        XPMultiplierService.getActiveMultiplier(),
        XPMultiplierService.calculateHarmonyStreak(),
      ]);
      const msLeft = active.isActive ? (active.timeRemaining ?? 0) : 0;
      const cooldownMs = harmony.nextActivationDate
        ? harmony.nextActivationDate.getTime() - Date.now()
        : 0;
      setStatus(
        multiplierStatus(
          {
            harmonyDays: harmony.currentStreak,
            running:
              active.isActive && msLeft > 0
                ? { factor: active.multiplier, minutesLeft: Math.ceil(msLeft / 60000) }
                : null,
            cooldownHoursLeft:
              harmony.canActivateMultiplier || cooldownMs <= 0 ? 0 : cooldownMs / 3600000,
          },
          XP_MULTIPLIERS.HARMONY_STREAK_DAYS_REQUIRED
        )
      );
      if (endTimer.current) clearTimeout(endTimer.current);
      if (active.isActive && msLeft > 0) {
        endTimer.current = setTimeout(() => void load(), Math.min(msLeft + 500, 2147483000));
      }
    } catch {
      setStatus(null); // no mark rather than a wrong one
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

  if (!status) return null;
  const kind = badgeMark(status);
  if (kind === 'tag' && status.kind === 'running') {
    const separator = new Intl.NumberFormat(locale).format(1.5).charAt(1) || '.';
    const factor = formatFactor(status.factor, separator);
    return { kind: 'tag', factor, label: t('gamification.badge.markRunning', { factor }) };
  }
  if (kind === 'dot') {
    const factor = formatFactor(XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER, '.');
    return { kind: 'dot', label: t('gamification.badge.markReady', { factor }) };
  }
  return null;
}
