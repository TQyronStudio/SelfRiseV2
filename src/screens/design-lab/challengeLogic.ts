/**
 * The rules behind the monthly challenge screens (ChallengeDetailConcept.tsx, kolo
 * 36), free of React Native so they can be tested. Nothing here is invented for the
 * lab — every number mirrors the app (technical-guides:Monthly-Challenges.md and
 * MonthlyProgressTracker.completeMonthlyChallenge):
 * - XP by star level, full and warm-up;
 * - the month-streak bonus as a share of the base XP;
 * - the 25/50/75 % milestones and what they pay (the CODE's 50/100/150 — the guide
 *   still says 50/75/100);
 * - the calendar's four day levels (thresholds 10 / 51 / 91 %).
 * New for the design: the pace — is the user on track for the month?
 *
 * GOING LIVE (1:1): import the app's own constants instead of these copies where
 * they are exported; the pace rule moves next to the tracker (one function, as for
 * goals — R-17).
 */

export type StarLevel = 1 | 2 | 3 | 4 | 5;

const FULL_XP: Record<StarLevel, number> = {
  1: 5000,
  2: 7500,
  3: 12000,
  4: 17500,
  5: 25000,
};
const WARM_UP_XP: Record<StarLevel, number> = {
  1: 500,
  2: 750,
  3: 1125,
  4: 1688,
  5: 2532,
};

/** Share of the base XP added for consecutive completed months (this one included). */
export function streakBonusShare(months: number): number {
  if (months >= 12) return 0.25;
  if (months >= 6) return 0.15;
  if (months >= 4) return 0.1;
  if (months >= 2) return 0.05;
  return 0;
}

/** What finishing the challenge pays. `months` = the streak once this month counts. */
export function challengeReward(
  stars: StarLevel,
  warmUp: boolean,
  months: number
): { base: number; streakShare: number; streakBonus: number; total: number } {
  const base = (warmUp ? WARM_UP_XP : FULL_XP)[stars];
  const streakShare = streakBonusShare(months);
  const streakBonus = Math.round(base * streakShare);
  return { base, streakShare, streakBonus, total: base + streakBonus };
}

/** Progress milestones on the way: percent of the challenge and the XP each pays. */
export const CHALLENGE_MILESTONES = [
  { at: 25, xp: 50 },
  { at: 50, xp: 100 },
  { at: 75, xp: 150 },
] as const;

export interface RequirementProgress {
  done: number;
  target: number;
  /** The most a single day can add (1 for "days with…" requirements). */
  perDayMax?: number;
}

/** Below this share of the challenge a month counts as missed for the stars. */
export const KEEP_LEVEL_SHARE = 0.7;

/** One requirement's share, never above 1 (extra work does not count twice). */
export function requirementShare({
  done,
  target,
}: RequirementProgress): number {
  if (target <= 0) return 1;
  return Math.min(1, Math.max(0, done / target));
}

/** The whole challenge, 0..1: the average of its requirements. */
export function challengeShare(requirements: RequirementProgress[]): number {
  if (requirements.length === 0) return 0;
  const sum = requirements.reduce((s, r) => s + requirementShare(r), 0);
  return sum / requirements.length;
}

export type PaceState = 'done' | 'onTrack' | 'behind' | 'outOfReach';

export interface Pace {
  state: PaceState;
  /** Still to do, of the requirement that is furthest behind. */
  left: number;
  /** Days still open, today included. */
  daysLeft: number;
  /** What a day has to bring from now on (rounded up, at least 1 while not done). */
  perDay: number;
  /**
   * Out of reach only: how much more still protects the star level (70 % of the
   * challenge), or null when even that cannot be reached any more.
   */
  toKeepLevel: number | null;
}

/**
 * Is the user on track? The yardstick is an even month: by the start of today,
 * `(day - 1) / days` of every requirement should be done — today itself still
 * counts in the user's favour. The sentence speaks about the requirement that is
 * furthest behind, because that one decides the month.
 *
 * A requirement that can only grow so much a day ("days with…") can become
 * impossible; then the honest sentence is not "2 a day gets you there" but what
 * is still worth doing: 70 % keeps the star level.
 */
export function challengePace(
  requirements: RequirementProgress[],
  day: number,
  days: number
): Pace {
  const daysLeft = Math.max(1, days - day + 1);
  const open = requirements.filter(r => requirementShare(r) < 1);
  if (open.length === 0) {
    return { state: 'done', left: 0, daysLeft, perDay: 0, toKeepLevel: null };
  }
  const slowest = open.reduce((a, b) =>
    requirementShare(b) < requirementShare(a) ? b : a
  );
  const left = Math.ceil(slowest.target - slowest.done);
  const perDay = Math.max(1, Math.ceil(left / daysLeft));
  const room =
    slowest.perDayMax === undefined ? Infinity : daysLeft * slowest.perDayMax;
  if (left > room) {
    const toKeep = Math.max(
      0,
      Math.ceil(slowest.target * KEEP_LEVEL_SHARE - slowest.done)
    );
    return {
      state: 'outOfReach',
      left,
      daysLeft,
      perDay,
      toKeepLevel: toKeep <= room ? toKeep : null,
    };
  }
  const expected = (day - 1) / days;
  return {
    state: requirementShare(slowest) >= expected ? 'onTrack' : 'behind',
    left,
    daysLeft,
    perDay,
    toKeepLevel: null,
  };
}

export type DayLevel = 'none' | 'some' | 'good' | 'full';

/**
 * How a day looks in the calendar: its work against an even daily share of the
 * month's target. The app's thresholds (10 / 51 / 91 %) — the screen shows them as
 * four shades, never as percentages.
 */
export function dayLevel(value: number, dailyTarget: number): DayLevel {
  if (dailyTarget <= 0) return value > 0 ? 'full' : 'none';
  const share = value / dailyTarget;
  if (share >= 0.91) return 'full';
  if (share >= 0.51) return 'good';
  if (share >= 0.1) return 'some';
  return 'none';
}

/** After a finished challenge the app runs an XP multiplier (XP_MULTIPLIERS). */
export const COMPLETION_MULTIPLIER = { factor: 1.5, hours: 12 } as const;

export interface StarOutcome {
  stars: StarLevel;
  change: 'up' | 'same' | 'down';
  /** Months in a row without a full finish, after this one. */
  failures: number;
}

/**
 * What a month does to the star level of its category — StarRatingService's rule
 * for a full challenge (a warm-up never changes stars):
 * - 100 % → one star up (5 is the top), the failure count starts again;
 * - 70–99 % → the level stays, but the month counts as a miss;
 * - under 70 % → a miss; the second miss in a row costs a star (1 is the floor)
 *   and the count starts again.
 */
export function starAfter(
  stars: StarLevel,
  percent: number,
  failuresBefore: number
): StarOutcome {
  if (percent >= 100) {
    const up = Math.min(5, stars + 1) as StarLevel;
    return { stars: up, change: up > stars ? 'up' : 'same', failures: 0 };
  }
  const failures = failuresBefore + 1;
  if (percent >= 70 || failures < 2) {
    return { stars, change: 'same', failures };
  }
  const down = Math.max(1, stars - 1) as StarLevel;
  return { stars: down, change: down < stars ? 'down' : 'same', failures: 0 };
}
