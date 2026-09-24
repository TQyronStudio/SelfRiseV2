// Reorder mode — gesture settings and order maths.
// Rules: technical-guides:Habits.md → "Řazení (reorder mode)".

import {
  REORDER_GESTURE,
  REORDER_HANDLE_HIT_SIZE,
  toOrderUpdates,
} from '../reorderConfig';

type Item = { id: string };
const items = (...ids: string[]): Item[] => ids.map(id => ({ id }));
const getId = (item: Item) => item.id;

describe('reorder mode — gesture settings', () => {
  // Field report 2026-09-24 (iOS + Android): the old list wrapped the whole
  // list in a pan gesture, so every vertical swipe fought the page scroll.
  test('only the handle can pick an item up — the rest of the card scrolls the page', () => {
    expect(REORDER_GESTURE.customHandle).toBe(true);
  });

  // With a delay, grabbing the handle and moving at once cancels the drag
  // after 5 pt of movement — it feels like the handle "won't grab".
  test('the handle lifts the item immediately', () => {
    expect(REORDER_GESTURE.dragActivationDelay).toBe(0);
  });

  test('the handle touch area meets the 44 pt minimum', () => {
    expect(REORDER_HANDLE_HIT_SIZE).toBeGreaterThanOrEqual(44);
  });
});

describe('reorder mode — toOrderUpdates', () => {
  test('the new list position becomes the stored order', () => {
    // "c" dragged from the bottom to the top
    expect(toOrderUpdates(items('c', 'a', 'b'), getId, 2, 0)).toEqual([
      { id: 'c', order: 0 },
      { id: 'a', order: 1 },
      { id: 'b', order: 2 },
    ]);
  });

  test('a drop back on the same place writes nothing', () => {
    expect(toOrderUpdates(items('a', 'b', 'c'), getId, 1, 1)).toBeNull();
  });
});
