/**
 * The XP multiplier on the level badge (kolo 44, lab debt L-10, O-4), free of React
 * Native so it can be tested.
 *
 * The app's rules (xpMultiplierService.ts, technical-guides:Gamification-Core.md):
 * - A HARMONY day = habits, journal AND goals all used that day. Seven in a row
 *   (HARMONY_STREAK_DAYS_REQUIRED) make the multiplier ready.
 * - The user switches it on; it then runs for HARMONY_STREAK_DURATION hours, and
 *   the next one can only start after HARMONY_STREAK_COOLDOWN hours.
 * - Other sources run multipliers too (monthly challenge 1.5×, achievement combo
 *   2.5×, comeback boost) — the badge shows whatever runs, not a fixed 2×.
 *
 * What the user sees:
 *   running  → a gold "2×" tag on the badge; the panel says the time left
 *   ready    → a still gold dot on the badge; a quiet note slides out once, the
 *              panel keeps the button (a missed note must not lose the reward)
 *   building → nothing on the badge; the panel shows the seven days and today's three
 *
 * GOING LIVE (1:1): status from XPMultiplierService.getActiveMultiplier() and
 * calculateHarmonyStreak() (canActivateMultiplier, nextActivationDate).
 */

import { XP_MULTIPLIERS } from '@/src/constants/gamification';

export interface RunningMultiplier {
  factor: number;
  minutesLeft: number;
}

export interface MultiplierState {
  /** Harmony days in a row (today counts once it is a harmony day). */
  harmonyDays: number;
  running: RunningMultiplier | null;
  /** Hours until the harmony multiplier may start again (0 = no cooldown). */
  cooldownHoursLeft: number;
}

export type MultiplierStatus =
  | { kind: 'running'; factor: number; minutesLeft: number }
  | { kind: 'ready' }
  | {
      kind: 'building';
      /** Lit segments, never more than `required`. */
      days: number;
      required: number;
      /** Whole days until it may start again (0 = only the days are missing). */
      cooldownDays: number;
    };

export function multiplierStatus(
  state: MultiplierState,
  required: number
): MultiplierStatus {
  const { running } = state;
  if (running && running.minutesLeft > 0) {
    return {
      kind: 'running',
      factor: running.factor,
      minutesLeft: running.minutesLeft,
    };
  }
  const cooldownDays =
    state.cooldownHoursLeft > 0 ? Math.ceil(state.cooldownHoursLeft / 24) : 0;
  if (state.harmonyDays >= required && cooldownDays === 0) {
    return { kind: 'ready' };
  }
  return {
    kind: 'building',
    days: Math.max(0, Math.min(state.harmonyDays, required)),
    required,
    cooldownDays,
  };
}

/** What sits on the level badge. */
export function badgeMark(status: MultiplierStatus): 'tag' | 'dot' | null {
  if (status.kind === 'running') return 'tag';
  if (status.kind === 'ready') return 'dot';
  return null;
}

/**
 * The quiet "ready" note slides out of the badge ONCE per readiness — also when it
 * became ready overnight and the app has only just opened — and not again on every
 * open while it waits (the dot and the panel stay). `readyKey` names this readiness
 * (live: the harmony streak's start date); `announcedFor` is the stored key of the
 * last one announced.
 */
export function shouldAnnounceReady(
  status: MultiplierStatus,
  readyKey: string,
  announcedFor: string | null
): boolean {
  return status.kind === 'ready' && announcedFor !== readyKey;
}

/** "2×", "1.5×" / "1,5×" — the factor as the badge and the panel print it. */
export function formatFactor(factor: number, decimalSeparator: string): string {
  const rounded = Math.round(factor * 10) / 10;
  const text = Number.isInteger(rounded)
    ? `${rounded}`
    : rounded.toFixed(1).replace('.', decimalSeparator);
  return `${text}×`;
}

// ---------------------------------------------------------------------------
// The multipliers that switch on by themselves (kolo 53, lab debt L-11)
// ---------------------------------------------------------------------------

export type MultiplierSource =
  | 'harmony_streak'
  | 'achievement_combo'
  | 'challenge_completion'
  | 'inactive_user_return';

/**
 * What each source runs, as the app's service sets it (xpMultiplierService.ts).
 * The comeback boost's 2× / 48 h are local constants in the service
 * (`BOOST_DURATION_HOURS`) — going live they move to XP_MULTIPLIERS.
 */
export function boostOf(source: MultiplierSource): {
  factor: number;
  hours: number;
} {
  switch (source) {
    case 'harmony_streak':
      return {
        factor: XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER,
        hours: XP_MULTIPLIERS.HARMONY_STREAK_DURATION,
      };
    case 'achievement_combo':
      return {
        factor: XP_MULTIPLIERS.ACHIEVEMENT_COMBO_MULTIPLIER,
        hours: XP_MULTIPLIERS.ACHIEVEMENT_COMBO_DURATION,
      };
    case 'challenge_completion':
      return {
        factor: XP_MULTIPLIERS.CHALLENGE_COMPLETION_MULTIPLIER,
        hours: XP_MULTIPLIERS.CHALLENGE_COMPLETION_DURATION,
      };
    case 'inactive_user_return':
      return { factor: COMEBACK_FACTOR, hours: COMEBACK_HOURS };
  }
}

/** xpMultiplierService.activateInactiveUserBoost: `multiplier: 2.0`, 48 h. */
export const COMEBACK_FACTOR = 2;
export const COMEBACK_HOURS = 48;

/**
 * Where a multiplier that switched on by itself is told (one action → one moment,
 * P75): never a window of its own.
 * - harmony: the user switched it on — its own window (R-41).
 * - challenge: a line in the "Challenge complete" window that caused it.
 * - combo: a tag on the trophy moment whose trophy completed the combo.
 * - comeback: a quiet "Welcome back" note from the badge, with the bonus XP.
 */
export function boostMoment(
  source: MultiplierSource
): 'ownWindow' | 'challengeWindow' | 'trophyMoment' | 'welcomeNote' {
  switch (source) {
    case 'harmony_streak':
      return 'ownWindow';
    case 'challenge_completion':
      return 'challengeWindow';
    case 'achievement_combo':
      return 'trophyMoment';
    case 'inactive_user_return':
      return 'welcomeNote';
  }
}
