/**
 * One action, one moment (R-29, E8): the batch rule and the line of moments.
 */
import {
  enqueueMoment,
  momentFor,
  momentXp,
  MomentTrophy,
  TrophyMoment,
} from '../moments';

const trophy = (
  id: string,
  rarity: MomentTrophy['rarity'],
  xp = 50
): MomentTrophy => ({ id, rarity, xp });
const all = (q: TrophyMoment[]) =>
  q
    .flatMap(m => (m.kind === 'big' ? [m.headliner, ...m.also] : m.items))
    .map(t => t.id)
    .sort();

describe('momentFor()', () => {
  it('makes nothing of nothing', () => {
    expect(momentFor([])).toBeNull();
  });

  it('turns ordinary trophies into ONE quiet note', () => {
    const m = momentFor([trophy('a', 'common'), trophy('b', 'rare')]);
    expect(m?.kind).toBe('quiet');
    expect(m?.kind === 'quiet' && m.items.map(t => t.id)).toEqual(['b', 'a']);
  });

  it('gives an epic or legendary batch ONE big window for the rarest, the rest inside', () => {
    const m = momentFor([
      trophy('c', 'common'),
      trophy('l', 'legendary'),
      trophy('e', 'epic'),
    ]);
    expect(m?.kind).toBe('big');
    if (m?.kind !== 'big') return;
    expect(m.headliner.id).toBe('l');
    expect(m.also.map(t => t.id)).toEqual(['e', 'c']);
  });

  it('carries a combo multiplier inside the same moment', () => {
    const boost = { factor: '2,5', hours: 24 };
    expect(momentFor([trophy('a', 'rare')], 1, boost)?.boost).toEqual(boost);
  });

  it('counts the XP of the whole moment', () => {
    expect(
      momentXp(
        momentFor([trophy('a', 'epic', 200), trophy('b', 'common', 50)])!
      )
    ).toBe(250);
  });
});

describe('enqueueMoment()', () => {
  const big = momentFor([trophy('big', 'legendary')], 1)!;
  const quiet = (id: number, t: string) =>
    momentFor([trophy(t, 'common')], id)!;

  it('never changes the moment on screen (the head)', () => {
    const q = enqueueMoment([quiet(1, 'on-screen')], quiet(2, 'next'));
    expect(q[0]).toEqual(quiet(1, 'on-screen'));
    expect(q).toHaveLength(2);
  });

  it('folds quiet notes waiting behind the head into one', () => {
    let q: TrophyMoment[] = [big];
    q = enqueueMoment(q, quiet(2, 'a'));
    q = enqueueMoment(q, quiet(3, 'b'));
    expect(q).toHaveLength(2);
    expect(q[1]?.kind === 'quiet' && q[1].items.map(t => t.id).sort()).toEqual([
      'a',
      'b',
    ]);
  });

  it('never folds a window, and never folds into one', () => {
    let q: TrophyMoment[] = [quiet(1, 'head')];
    q = enqueueMoment(q, quiet(2, 'a'));
    q = enqueueMoment(q, momentFor([trophy('w', 'epic')], 3)!);
    q = enqueueMoment(q, quiet(4, 'b'));
    expect(q.map(m => m.kind)).toEqual(['quiet', 'quiet', 'big', 'quiet']);
  });

  it('never loses a trophy, whatever arrives', () => {
    let q: TrophyMoment[] = [];
    const arrivals = [
      momentFor([trophy('t1', 'common'), trophy('t2', 'rare')], 1)!,
      momentFor([trophy('t3', 'common')], 2)!,
      momentFor([trophy('t4', 'legendary'), trophy('t5', 'common')], 3)!,
      momentFor([trophy('t6', 'common')], 4)!,
      momentFor([trophy('t7', 'rare')], 5)!,
    ];
    for (const m of arrivals) q = enqueueMoment(q, m);
    expect(all(q)).toEqual(['t1', 't2', 't3', 't4', 't5', 't6', 't7']);
    expect(q[0]?.id).toBe(1);
  });
});
