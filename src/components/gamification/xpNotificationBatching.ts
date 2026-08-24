/**
 * XP summary bar — pure batching logic.
 *
 * Lives outside the component on purpose: this is the part that decides WHAT
 * the notification claims happened, and it has to be unit-testable. While it
 * sat inside `XpNotification.tsx` it silently counted EVENTS, so tapping one
 * habit five times reported "5 habits completed" and un-checking a habit
 * *increased* the count.
 */

import { XPSourceType } from '../../types/gamification';

export interface XpGainInput {
  id: string;
  amount: number;
  source: XPSourceType;
  timestamp: number;
  /** Which entity produced the XP (habit id, goal id, journal entry id). */
  sourceId?: string;
}

/**
 * How many "things" a stream of gains represents.
 *
 * - `entity`: the source is a TOGGLE. Tapping the same habit five times is
 *   still one habit, so gains are de-duplicated by `sourceId` and a negative
 *   gain cancels the earlier positive one.
 * - `event`: the source is an INCREMENT. Every goal progress entry and every
 *   journal entry is its own thing, so each positive gain counts. A negative
 *   gain (deleted entry, subtracted progress) decrements instead of adding.
 */
export type CountingMode = 'entity' | 'event';

export interface DisplayGroup {
  /** Translation key under `gamification.xp.xpNotification.sources*`. */
  nameKey: string;
  icon: string;
  color: string;
  countingMode: CountingMode;
}

export interface BatchedSource extends DisplayGroup {
  count: number;
  totalXP: number;
}

export interface BatchedNotification {
  totalXP: number;
  sources: BatchedSource[];
  timestamp: number;
}

/**
 * Maps an XP source to the group shown to the user.
 *
 * HABIT_COMPLETION + HABIT_BONUS share one group so a bonus tick does not read
 * as a second habit. GOAL_PROGRESS and GOAL_COMPLETION are deliberately kept
 * APART: a single tap that finishes a goal emits both, and while they shared a
 * group that one tap reported "2 goals".
 */
export const getDisplayGroup = (source: XPSourceType): DisplayGroup => {
  switch (source) {
    case XPSourceType.HABIT_COMPLETION:
    case XPSourceType.HABIT_BONUS:
      return { nameKey: 'habits', icon: '🏃‍♂️', color: '#4CAF50', countingMode: 'entity' };
    case XPSourceType.JOURNAL_ENTRY:
    case XPSourceType.JOURNAL_BONUS:
      return { nameKey: 'journalEntries', icon: '📝', color: '#2196F3', countingMode: 'event' };
    case XPSourceType.JOURNAL_BONUS_MILESTONE:
      return { nameKey: 'journalMilestones', icon: '⭐', color: '#2196F3', countingMode: 'event' };
    case XPSourceType.GOAL_PROGRESS:
      return { nameKey: 'goalProgress', icon: '🎯', color: '#FF9800', countingMode: 'event' };
    case XPSourceType.GOAL_COMPLETION:
      return { nameKey: 'goals', icon: '🎯', color: '#FF9800', countingMode: 'entity' };
    case XPSourceType.GOAL_MILESTONE:
      return { nameKey: 'goalMilestones', icon: '🎯', color: '#FF9800', countingMode: 'event' };
    case XPSourceType.HABIT_STREAK_MILESTONE:
    case XPSourceType.JOURNAL_STREAK_MILESTONE:
      return { nameKey: 'streaks', icon: '🔥', color: '#9C27B0', countingMode: 'event' };
    case XPSourceType.ACHIEVEMENT_UNLOCK:
      return { nameKey: 'achievements', icon: '🏆', color: '#FFD700', countingMode: 'entity' };
    case XPSourceType.MONTHLY_CHALLENGE:
      return { nameKey: 'monthlyChallenges', icon: '📅', color: '#673AB7', countingMode: 'entity' };
    case XPSourceType.XP_MULTIPLIER_BONUS:
      return { nameKey: 'multiplierBonuses', icon: '⚡', color: '#E91E63', countingMode: 'event' };
    default:
      return { nameKey: 'activities', icon: '✨', color: '#007AFF', countingMode: 'event' };
  }
};

interface GroupAccumulator {
  meta: DisplayGroup;
  totalXP: number;
  /** `entity` mode: the distinct things touched. */
  entityKeys: Set<string>;
  /** `entity` mode: gains that arrived without an id (level-up, batch commit). */
  anonymousCount: number;
  /** `event` mode: net number of positive gains. */
  eventCount: number;
}

const countOf = (group: GroupAccumulator): number =>
  group.meta.countingMode === 'entity'
    ? group.entityKeys.size + group.anonymousCount
    : group.eventCount;

/**
 * Folds raw XP gains into the summary the bar renders.
 *
 * Total XP always sums EVERY gain — including negative ones — because the XP
 * arithmetic was never the broken part. Only the *counts* are corrected.
 */
export const batchXpGains = (gains: XpGainInput[]): BatchedNotification => {
  const groups = new Map<string, GroupAccumulator>();
  let totalXP = 0;

  gains.forEach(gain => {
    totalXP += gain.amount;

    const meta = getDisplayGroup(gain.source);
    let group = groups.get(meta.nameKey);
    if (!group) {
      group = { meta, totalXP: 0, entityKeys: new Set(), anonymousCount: 0, eventCount: 0 };
      groups.set(meta.nameKey, group);
    }
    group.totalXP += gain.amount;

    // A zero-XP gain is neither an achievement nor an undo — it must not move
    // the counter in either direction.
    if (gain.amount === 0) return;

    const isPositive = gain.amount > 0;

    if (meta.countingMode === 'entity') {
      if (gain.sourceId) {
        if (isPositive) {
          group.entityKeys.add(gain.sourceId);
        } else {
          // Un-checking cancels the earlier check. If we never saw the check
          // (it happened in an older batch) this is simply a no-op — we must
          // not invent a count for something the user just undid.
          group.entityKeys.delete(gain.sourceId);
        }
      } else if (isPositive) {
        group.anonymousCount += 1;
      } else {
        group.anonymousCount = Math.max(0, group.anonymousCount - 1);
      }
    } else if (isPositive) {
      group.eventCount += 1;
    } else {
      group.eventCount = Math.max(0, group.eventCount - 1);
    }
  });

  const sources: BatchedSource[] = [];
  groups.forEach(group => {
    const count = countOf(group);
    // Groups the user ended up not adding anything to are dropped — their XP
    // stays in the total, so a pure undo still reads as "Progress reversed".
    if (count > 0) {
      sources.push({ ...group.meta, count, totalXP: group.totalXP });
    }
  });

  return {
    totalXP,
    sources,
    timestamp: gains.length > 0 ? Math.max(...gains.map(g => g.timestamp)) : Date.now(),
  };
};
