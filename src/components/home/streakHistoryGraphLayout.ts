// Sizes of the Home streak history graph (StreakHistoryGraph). A separate module so the width
// math is testable without rendering the component.
import { getContentWidth } from '../../utils/layout';

export const GRAPH_HEIGHT = 120;
export const DAYS_TO_SHOW = 30;
export const Y_AXIS_WIDTH = 30; // Width of Y-axis labels
export const CONTAINER_PADDING = 16; // Container inner padding
export const CONTAINER_MARGIN = 16; // Container horizontal margin
export const SIDE_PADDING = 8; // Small padding on sides for better look

/**
 * Bar area width and per-day width for the current window. Computed on every render from the live
 * window width: a module-level value froze at startup, so after rotating a tablet the last ~2 weeks
 * of bars were drawn off-screen. The graph sits in Home's content column (utils/layout).
 */
export function getGraphMetrics(windowWidth: number) {
  // Available width = content column - margins - container padding - Y-axis width - side padding
  const availableWidth = getContentWidth(windowWidth) - (CONTAINER_MARGIN * 2) - (CONTAINER_PADDING * 2) - Y_AXIS_WIDTH - (SIDE_PADDING * 2);
  const dayWidth = Math.max(6, Math.floor(availableWidth / DAYS_TO_SHOW)); // Min 6px per day for visibility
  return { availableWidth, dayWidth };
}
