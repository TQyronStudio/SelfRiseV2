/**
 * The rules of Home's hero (migration E11b) — pure, so they are tested
 * (__tests__/homeHeroLogic.test.ts).
 *
 * Greeting: its own hours 5 / 12 / 18 (decision E11/1): morning 5–12, afternoon
 * 12–18, evening 18–5. There is no "good night" — at 1 a.m. the person is still
 * up, and "Good evening" is what people say then. The sky's colour keeps
 * following getDaypart() (four parts, design tokens); only the words differ.
 *
 * Encouragement: one sentence under the hero, always about TODAY'S PLAN only
 * (the same habits the "x/y" counts).
 */

export type GreetingKey = 'morning' | 'afternoon' | 'evening';

export function greetingKey(hour: number): GreetingKey {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export type Encouragement =
  | { key: 'home.hero.nothingPlanned' }
  | { key: 'home.hero.encouragement.allDone' }
  | { key: 'home.hero.encouragement.freshStart' }
  | { key: 'home.hero.encouragement.remaining'; count: number };

/**
 * Nothing planned → the free-day sentence (no "all done" praise for nothing,
 * decision E11/2a); all done → praise; none yet → a fresh start; otherwise how
 * many are left.
 */
export function encouragementOf(planned: number, done: number): Encouragement {
  if (planned <= 0) return { key: 'home.hero.nothingPlanned' };
  const remaining = Math.max(0, planned - done);
  if (remaining === 0) return { key: 'home.hero.encouragement.allDone' };
  if (done <= 0) return { key: 'home.hero.encouragement.freshStart' };
  return { key: 'home.hero.encouragement.remaining', count: remaining };
}

/**
 * The habits on the arc's markers: finished ones first, so the lit markers
 * (the sun has passed them) are exactly the done ones. Order inside each group
 * stays the user's.
 */
export function arcOrder<T>(habits: T[], isDone: (habit: T) => boolean): T[] {
  return [...habits.filter(isDone), ...habits.filter(h => !isDone(h))];
}

/**
 * Did this change finish the day? Only a step from "not all" to "all" within
 * the SAME plan — never on the first render, never when the habits arrive
 * (the plan jumps from 0/0 to 3/3 a moment after launch: someone who finished
 * earlier must not get a celebration for opening the app), never on an
 * uncheck, never on a day with nothing planned.
 */
export function finishedTheDay(
  prev: { done: number; planned: number } | null,
  done: number,
  planned: number
): boolean {
  return (
    prev !== null &&
    prev.planned === planned &&
    planned > 0 &&
    done >= planned &&
    prev.done < planned
  );
}
