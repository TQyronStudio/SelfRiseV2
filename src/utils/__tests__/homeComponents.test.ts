// Home sections: app list × stored visibility × stored order.
import { mergeHomeComponents } from '../homeComponents';
import { defaultHomeComponents, type HomeScreenComponent } from '../../types/homeCustomization';

const comp = (id: string, order: number, visible = true): HomeScreenComponent => ({
  id,
  name: id,
  visible,
  order,
  configurable: true,
});

const DEFAULTS = [comp('xp', 0), comp('quick', 1), comp('streak', 2), comp('stats', 3)];
const ids = (list: HomeScreenComponent[]) => list.map(c => c.id);

describe('mergeHomeComponents', () => {
  test('nothing stored → the app defaults', () => {
    expect(mergeHomeComponents(DEFAULTS, undefined, false)).toEqual(DEFAULTS);
  });

  test('visibility is always the user\'s', () => {
    const stored = [comp('xp', 0), comp('quick', 1, false), comp('streak', 2), comp('stats', 3)];
    const merged = mergeHomeComponents(DEFAULTS, stored, false);
    expect(merged.find(c => c.id === 'quick')!.visible).toBe(false);
  });

  // The bug: a saved custom order was replaced by the default one on every load.
  test('a custom order survives the next load', () => {
    const stored = [comp('stats', 1), comp('xp', 2), comp('streak', 3), comp('quick', 4)];
    const merged = mergeHomeComponents(DEFAULTS, stored, true);
    expect(ids([...merged].sort((a, b) => a.order - b.order))).toEqual(['stats', 'xp', 'streak', 'quick']);
  });

  test('without a custom order the user follows the current default order', () => {
    const stored = [comp('stats', 0), comp('xp', 1), comp('streak', 2), comp('quick', 3)];
    const merged = mergeHomeComponents(DEFAULTS, stored, false);
    expect(ids([...merged].sort((a, b) => a.order - b.order))).toEqual(['xp', 'quick', 'streak', 'stats']);
  });

  test('a section removed from the app disappears even if still stored', () => {
    const stored = [comp('xp', 1), comp('dailyQuote', 2), comp('quick', 3), comp('streak', 4), comp('stats', 5)];
    expect(ids(mergeHomeComponents(DEFAULTS, stored, true))).not.toContain('dailyQuote');
    expect(ids(mergeHomeComponents(DEFAULTS, stored, false))).not.toContain('dailyQuote');
  });

  test('a section new since the reorder is added at the end', () => {
    const stored = [comp('streak', 1), comp('xp', 2), comp('quick', 3)];
    const merged = mergeHomeComponents(DEFAULTS, stored, true);
    expect(ids([...merged].sort((a, b) => a.order - b.order))).toEqual(['streak', 'xp', 'quick', 'stats']);
  });
});

// ---------------------------------------------------------------------------
// E11e: the old ten sections → the new seven, through the same rule
// ---------------------------------------------------------------------------

describe('mergeHomeComponents: stored layouts of the old Home (E11e)', () => {
  const OLD = [
    'xpProgressBar',
    'xpMultiplier',
    'quickActions',
    'journalStreak',
    'streakHistory',
    'monthlyChallenges',
    'habitStats',
    'recommendations',
    'habitPerformance',
    'habitTrends',
  ];
  const old = (hidden: string[] = [], order = OLD) =>
    order.map((id, i) => comp(id, i, !hidden.includes(id)));
  const shown = (list: HomeScreenComponent[]) =>
    [...list].sort((a, b) => a.order - b.order).filter(c => c.visible).map(c => c.id);

  test('no custom order (everyone today): the new default order, gone sections dropped', () => {
    expect(shown(mergeHomeComponents(defaultHomeComponents, old(), false))).toEqual([
      'quickActions',
      'todayHabits',
      'journalStreak',
      'monthlyChallenges',
      'habitStats',
      'insights',
      'recommendations',
    ]);
  });

  test('hidden stays hidden; insights shows if either old part was shown', () => {
    const one = mergeHomeComponents(defaultHomeComponents, old(['journalStreak', 'habitTrends']), false);
    expect(one.find(c => c.id === 'journalStreak')!.visible).toBe(false);
    expect(one.find(c => c.id === 'insights')!.visible).toBe(true);
    const both = mergeHomeComponents(defaultHomeComponents, old(['habitPerformance', 'habitTrends']), false);
    expect(both.find(c => c.id === 'insights')!.visible).toBe(false);
  });

  test('custom order: kept, merged card at its first part, today’s habits after quick actions', () => {
    const order = ['habitTrends', 'monthlyChallenges', 'xpProgressBar', 'quickActions', 'habitPerformance', 'journalStreak', 'habitStats', 'recommendations'];
    expect(shown(mergeHomeComponents(defaultHomeComponents, old([], order), true))).toEqual([
      'insights',
      'monthlyChallenges',
      'quickActions',
      'todayHabits',
      'journalStreak',
      'habitStats',
      'recommendations',
    ]);
  });

  // The trap: a layout saved in the NEW shape has todayHabits / insights — they
  // must keep the user's choice, not come back as new sections.
  test('a layout already in the new shape keeps its hidden sections and order', () => {
    const saved = mergeHomeComponents(defaultHomeComponents, old(), false).map(c =>
      c.id === 'todayHabits' || c.id === 'insights' ? { ...c, visible: false } : c
    );
    for (const custom of [false, true]) {
      const again = mergeHomeComponents(defaultHomeComponents, saved, custom);
      expect(again.find(c => c.id === 'todayHabits')!.visible).toBe(false);
      expect(again.find(c => c.id === 'insights')!.visible).toBe(false);
      expect(ids([...again].sort((a, b) => a.order - b.order))).toEqual(ids(defaultHomeComponents));
    }
  });

  test('every section of the app is there exactly once', () => {
    for (const custom of [false, true]) {
      const result = mergeHomeComponents(defaultHomeComponents, old(), custom);
      expect(ids(result).sort()).toEqual(ids(defaultHomeComponents).sort());
    }
  });
});
