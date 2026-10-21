/**
 * Grid maths for the onboarding tile screens.
 *
 * Deliberately free of imports: keeping it out of the tile components means it
 * can be tested directly, instead of dragging in vector-icons, the theme and
 * the i18n stack just to assert how many rows six presets make.
 */

/**
 * Two columns on phones, three on large screens (>= 600 dp, Android's tablet line).
 *
 * Takes the live window width. It used `getScreenSize()` before, whose `isTablet()` multiplies by
 * pixel density and so reports TABLET on most phones (Pixel 7, every iPhone) — phones got three
 * columns of ~80 dp text, and long words broke mid-word ("Somet / hing else", "Bewerbunge / n").
 */
export function getOnbTileColumns(windowWidth: number): number {
  return windowWidth >= 600 ? 3 : 2;
}

/** Splits items into rows of `columns`, leaving the final row short. */
export function chunkIntoRows<T>(items: T[], columns: number): T[][] {
  if (columns < 1) return items.length ? [items] : [];
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}
