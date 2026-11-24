/** A note posted before the badge layer listens is not lost (E8). */
import { listenTrophyNotes, postTrophyNote } from '../noteBus';

it('delivers waiting notes on listen, then live ones', () => {
  const note = { items: [], xp: 10 };
  postTrophyNote(note);
  const got: unknown[] = [];
  const stop = listenTrophyNotes(n => got.push(n));
  expect(got).toEqual([note]);
  postTrophyNote({ items: [], xp: 20 });
  expect(got).toHaveLength(2);
  stop();
});
