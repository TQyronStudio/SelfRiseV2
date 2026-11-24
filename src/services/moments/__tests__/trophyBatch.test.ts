/** One action → one moment, onboarding kept safe (E8 point 1). */
import { routeTrophyBatch } from '../trophyBatch';

const t = (id: string, rarity: string, xp = 50) => ({ id, rarity: rarity as any, xp });

describe('routeTrophyBatch()', () => {
  it('common and rare → one quiet note with all of them', () => {
    const m = routeTrophyBatch([t('a', 'common'), t('b', 'rare')], false);
    expect(m?.kind).toBe('quiet');
    expect(m?.kind === 'quiet' && m.items.map(i => i.id)).toEqual(['b', 'a']);
  });

  it('an epic in the batch → one window for the rarest, the rest inside', () => {
    const m = routeTrophyBatch([t('a', 'common'), t('e', 'epic'), t('r', 'rare')], false);
    expect(m?.kind).toBe('big');
    if (m?.kind !== 'big') return;
    expect(m.headliner.id).toBe('e');
    expect(m.also.map(i => i.id)).toEqual(['r', 'a']);
  });

  it('a trophy reported twice counts once', () => {
    const m = routeTrophyBatch([t('a', 'common'), t('a', 'common')], false);
    expect(m?.kind === 'quiet' && m.items).toHaveLength(1);
  });

  it('onboarding: only first-habit / first-goal, always as the window', () => {
    const m = routeTrophyBatch([t('first-habit', 'common'), t('streak', 'rare')], true);
    expect(m?.kind).toBe('big');
    if (m?.kind !== 'big') return;
    expect(m.headliner.id).toBe('first-habit');
    expect(m.also).toEqual([]);
    expect(routeTrophyBatch([t('streak', 'rare')], true)).toBeNull();
  });

  it('nothing → nothing', () => {
    expect(routeTrophyBatch([], false)).toBeNull();
  });
});
