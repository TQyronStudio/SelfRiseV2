/**
 * Creates the user's first habit/goal without letting the trophy celebration
 * and the next onboarding screen fight each other.
 *
 * The ordering is the whole point, and it is not obvious:
 *
 *   1. ARM  — before anything exists. The unlock event fires ~100ms after the
 *             entity is created, so a listener attached afterwards misses it.
 *   2. CREATE
 *   3. WAIT — until the user has dismissed the celebration (or immediately,
 *             when the achievement is already owned, e.g. a restarted flow).
 *
 * Getting this wrong has bitten the project twice before (see the history in
 * src/utils/tutorialAchievementGate.ts): once the flow looked frozen, once the
 * celebration never got its turn. Keeping the sequence in one tested function
 * means screens 1 and 2 cannot each rediscover those bugs.
 */
export interface TrophyGate {
  wait: () => Promise<void>;
}

export interface CreateWithTrophyGateOptions<T> {
  /** Must attach its listeners synchronously — called before `create`. */
  arm: () => TrophyGate;
  create: () => Promise<T>;
}

export async function createWithTrophyGate<T>({
  arm,
  create,
}: CreateWithTrophyGateOptions<T>): Promise<T> {
  const gate = arm();
  const result = await create();
  await gate.wait();
  return result;
}
