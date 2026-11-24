/**
 * One action, one moment (R-29) — the pure rules of the celebration director
 * (moved from the Design Lab's celebrationDirector.tsx in migration E8; the lab
 * keeps its copy — O-6). Tested in __tests__/moments.test.ts.
 *
 * - What one action unlocked becomes exactly ONE moment: an epic or legendary
 *   trophy in the batch → one big window for the rarest, the others inside it
 *   ("Also unlocked"); otherwise one quiet note listing them all.
 * - Moments of different actions wait in line. The head is on screen and never
 *   changes; quiet moments waiting behind it fold into one. A window never folds.
 * - A multiplier the action switched on (a trophy combo, L-11) rides inside the
 *   same moment as `boost` — never a window of its own.
 */
import { AchievementRarity } from '@/src/types/gamification';

export interface MomentTrophy {
  id: string;
  rarity: AchievementRarity | `${AchievementRarity}`;
  /** XP the trophy paid (what really arrived — the app's catalogue value). */
  xp: number;
}

/** A multiplier the action switched on by itself, told inside the moment. */
export interface MomentBoost {
  /** Printed factor without the sign ("2,5") — the texts add the ×. */
  factor: string;
  hours: number;
}

export type TrophyMoment<T extends MomentTrophy = MomentTrophy> =
  | { id: number; kind: 'quiet'; items: T[]; boost?: MomentBoost }
  | { id: number; kind: 'big'; headliner: T; also: T[]; boost?: MomentBoost };

const RANK: Record<string, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

/** The rule: what one action unlocked becomes exactly one moment (null = nothing). */
export function momentFor<T extends MomentTrophy>(
  batch: T[],
  id = 0,
  boost?: MomentBoost
): TrophyMoment<T> | null {
  if (batch.length === 0) return null;
  const sorted = [...batch].sort(
    (a, b) => (RANK[b.rarity] ?? 0) - (RANK[a.rarity] ?? 0)
  );
  const top = sorted[0]!;
  const extra = boost ? { boost } : null;
  return (RANK[top.rarity] ?? 0) >= RANK['epic']!
    ? { id, kind: 'big', headliner: top, also: sorted.slice(1), ...extra }
    : { id, kind: 'quiet', items: sorted, ...extra };
}

/** All XP one trophy moment stands for. */
export function momentXp(moment: TrophyMoment): number {
  const items =
    moment.kind === 'big' ? [moment.headliner, ...moment.also] : moment.items;
  return items.reduce((sum, item) => sum + item.xp, 0);
}

/**
 * A moment of another action joins the line. The head (index 0) is on screen and
 * never changes; a quiet moment waiting at the end folds a new quiet one into it.
 */
export function enqueueMoment<T extends MomentTrophy>(
  queue: TrophyMoment<T>[],
  next: TrophyMoment<T>
): TrophyMoment<T>[] {
  const last = queue[queue.length - 1];
  if (queue.length >= 2 && last?.kind === 'quiet' && next.kind === 'quiet') {
    const merged = momentFor(
      [...last.items, ...next.items],
      last.id,
      last.boost ?? next.boost
    );
    return merged ? [...queue.slice(0, -1), merged] : queue;
  }
  return [...queue, next];
}
