/**
 * Stress of the moment queue (plan E8, "ochrana proti zamrzání"): one action plus
 * a burst of other events — three trophies with a combo, a level up, a challenge
 * milestone, a journal streak — must give ONE thing on screen at a time, lose
 * nothing, keep the priorities and never change the window on screen.
 */
import { insertModal, Orderable } from '../modalQueueOrdering';
import { routeTrophyBatch } from '../../services/moments/trophyBatch';

type Q = Orderable & { type: string };

const P = { ACTIVITY: 1, GOAL: 2, CHALLENGE: 3, STAR: 4, MULTIPLIER: 5, ACHIEVEMENT: 6, LEVEL_UP: 7 };

describe('moment queue under a burst', () => {
  it('three trophies of one action are ONE window, with the combo inside', () => {
    const moment = routeTrophyBatch(
      [
        { id: 'a', rarity: 'common', xp: 50 },
        { id: 'b', rarity: 'epic', xp: 200 },
        { id: 'c', rarity: 'rare', xp: 100 },
      ],
      false
    );
    expect(moment?.kind).toBe('big');
    expect(moment?.kind === 'big' && moment.also).toHaveLength(2);
  });

  it('one on screen, nothing lost, priorities kept, the head never changes', () => {
    let queue: Q[] = [];
    let presented: string | null = null;
    let ts = 0;
    const add = (type: string, priority: number) => {
      queue = insertModal(queue, { id: `${type}-${ts}`, type, priority, timestamp: ts++ }, presented);
      presented = queue[0]!.id; // the head is shown as soon as it exists
    };
    // The action: a level up comes first (its event is synchronous)…
    add('level_up', P.LEVEL_UP);
    const firstOnScreen = presented;
    // …then the burst.
    add('achievement', P.ACHIEVEMENT); // the one trophy window of the batch
    add('monthly_challenge_milestone', P.CHALLENGE);
    add('celebration_streak_milestone', P.ACTIVITY);
    add('goal_completion', P.GOAL);

    // The window on screen did not change under the user's finger.
    expect(queue[0]!.id).toBe(firstOnScreen);
    // Nothing lost.
    expect(queue).toHaveLength(5);
    // Behind the head: by priority.
    expect(queue.slice(1).map(m => m.type)).toEqual([
      'celebration_streak_milestone',
      'goal_completion',
      'monthly_challenge_milestone',
      'achievement',
    ]);
    // Closing one by one shows each exactly once.
    const shown: string[] = [];
    while (queue.length) {
      shown.push(queue[0]!.type);
      queue = queue.slice(1);
    }
    expect(new Set(shown).size).toBe(5);
  });
});
