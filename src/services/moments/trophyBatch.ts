/**
 * What one action unlocked → ONE moment (migration E8 point 1) — pure, tested in
 * __tests__/trophyBatch.test.ts. AchievementContext collects the service's
 * `achievementUnlocked` events of one instant into a batch and asks this rule.
 *
 * - Epic or legendary in the batch → one big window for the rarest, the others
 *   inside it ("Also unlocked") — momentFor().
 * - Only common / rare → one quiet note next to the level badge.
 * - Onboarding: only `first-habit` and `first-goal` are celebrated (Tutorial.md
 *   rules 1 and 3), and ALWAYS as the window: the onboarding waits for its close
 *   (`achievementCelebrationClosed`), and the badge — where a note would appear —
 *   is hidden while the onboarding runs.
 */
import { momentFor, MomentTrophy, TrophyMoment } from './moments';

export const ONBOARDING_TROPHIES: readonly string[] = ['first-habit', 'first-goal'];

export function routeTrophyBatch<T extends MomentTrophy>(
  batch: T[],
  onboardingActive: boolean
): TrophyMoment<T> | null {
  // One trophy per id (the service may report one twice in a burst).
  const seen = new Set<string>();
  const unique = batch.filter(t => (seen.has(t.id) ? false : (seen.add(t.id), true)));
  if (!onboardingActive) return momentFor(unique);
  const allowed = unique.filter(t => ONBOARDING_TROPHIES.includes(t.id));
  const moment = momentFor(allowed);
  if (!moment || moment.kind === 'big') return moment;
  const [headliner, ...also] = moment.items;
  return headliner ? { id: moment.id, kind: 'big', headliner, also } : null;
}
