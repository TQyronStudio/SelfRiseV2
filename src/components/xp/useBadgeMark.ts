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
import { useI18n } from '@/src/hooks/useI18n';
import { XP_MULTIPLIERS } from '@/src/constants/gamification';
import { badgeMark } from '@/src/services/xpDisplay/multiplierDisplay';
import type { MultiplierState } from './useMultiplierState';
import type { BadgeMark } from './XpDisplay';

/** The badge's mark from the shared multiplier state (read once in the badge layer). */
export function useBadgeMark(state: MultiplierState): BadgeMark {
  const { t } = useI18n();
  const { status, print } = state;
  if (!status) return null;
  const kind = badgeMark(status);
  if (kind === 'tag' && status.kind === 'running') {
    const factor = print(status.factor);
    return { kind: 'tag', factor, label: t('gamification.badge.markRunning', { factor }) };
  }
  if (kind === 'dot') {
    const factor = print(XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER);
    return { kind: 'dot', label: t('gamification.badge.markReady', { factor }) };
  }
  return null;
}
