/**
 * Grid maths for the onboarding tile screens.
 *
 * Deliberately free of imports: keeping it out of the tile components means it
 * can be tested directly, instead of dragging in vector-icons, the theme and
 * the i18n stack just to assert how many rows six presets make.
 */

/** Splits items into rows of `columns`, leaving the final row short. */
export function chunkIntoRows<T>(items: T[], columns: number): T[][] {
  if (columns < 1) return items.length ? [items] : [];
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}
