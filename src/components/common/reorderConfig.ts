// Reorder mode — shared gesture settings and order maths (pure, no React Native).
//
// Rules: technical-guides:Habits.md → "Řazení (reorder mode)". Kept free of
// react-native imports so it can be unit-tested (the Jest setup stubs RN).

/**
 * How the drag gesture is wired. These values are what keeps the page
 * scrollable in reorder mode — change them only with the guide open.
 */
export const REORDER_GESTURE = {
  /**
   * Only the handle picks an item up. Everywhere else the finger belongs to the
   * page scroll. The old list wrapped the WHOLE list in a pan gesture that
   * fought the ScrollView for every vertical swipe (field report 2026-09-24:
   * "scroll only moves sometimes", iOS and Android).
   */
  customHandle: true,
  /**
   * The handle is an explicit grab target, so it lifts immediately (like the
   * iOS reorder control). With the library default of 200 ms, grabbing and
   * moving at once cancels the drag after 5 pt — it feels like it "won't grab".
   */
  dragActivationDelay: 0,
} as const;

/** Minimum touch target for the handle (Apple HIG 44 pt). */
export const REORDER_HANDLE_HIT_SIZE = 44;

/**
 * New `order` values for a list that was just reordered: position in the list
 * becomes the stored order. Returns null when the drop left the order as it
 * was, so a tap on the handle does not write to the database.
 */
export function toOrderUpdates<T>(
  data: readonly T[],
  getId: (item: T) => string,
  fromIndex: number,
  toIndex: number
): Array<{ id: string; order: number }> | null {
  if (fromIndex === toIndex) {
    return null;
  }
  return data.map((item, index) => ({ id: getId(item), order: index }));
}
