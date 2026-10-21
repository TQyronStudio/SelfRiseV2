/**
 * Layout limits for large screens (tablets, unfolded foldables, desktop windows).
 *
 * Android 16 ignores the portrait lock on screens >= 600 dp, so the app must work at any width
 * and after rotating at runtime. Rules (technical-guides:Large-Screens.md):
 * - Read the window size with useWindowDimensions() INSIDE the component, never with
 *   a Dimensions snapshot at module level — that value is frozen at startup and goes stale on rotation.
 * - Screen content lives in a centered column (contentColumn); modals are capped (getModalWidth).
 *
 * All limits sit above every phone width, so phones render exactly as before.
 */

/** Maximum width of a screen's content column. */
export const CONTENT_MAX_WIDTH = 640;

/** Maximum width of a centered modal card. */
export const MODAL_MAX_WIDTH = 560;

/**
 * Centers screen content in a column of at most CONTENT_MAX_WIDTH. Put it on a ScrollView's
 * contentContainerStyle (the margins stay scrollable) or on a screen's content wrapper.
 */
export const contentColumn = {
  width: '100%',
  maxWidth: CONTENT_MAX_WIDTH,
  alignSelf: 'center',
} as const;

/** Width of the content column for the given window width. */
export function getContentWidth(windowWidth: number): number {
  return Math.min(windowWidth, CONTENT_MAX_WIDTH);
}

/** Modal card width: the given fraction of the window, capped at MODAL_MAX_WIDTH. */
export function getModalWidth(windowWidth: number, fraction: number): number {
  return Math.min(windowWidth * fraction, MODAL_MAX_WIDTH);
}

/**
 * How many fixed-width items fit in a row of the content column (at least 1, so a row loop
 * always advances).
 */
export function getColumnCount(windowWidth: number, horizontalPadding: number, itemWidth: number): number {
  return Math.max(1, Math.floor((getContentWidth(windowWidth) - horizontalPadding) / itemWidth));
}
