// Home sections: app list × stored visibility × stored order.
import { mergeHomeComponents } from '../homeComponents';
import type { HomeScreenComponent } from '../../types/homeCustomization';

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
