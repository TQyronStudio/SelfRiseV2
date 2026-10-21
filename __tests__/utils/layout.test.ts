/**
 * Large-screen layout (technical-guides:Large-Screens.md).
 *
 * Android 16 ignores the portrait lock on screens >= 600 dp, so tablets rotate at runtime.
 * These tests pin down two promises:
 * 1. Phones render exactly as before (every limit sits above phone widths).
 * 2. Nothing reads the window size at module level — that value froze at startup and broke the
 *    Home graph and the trophy grid after rotating a tablet.
 */
import * as fs from 'fs';
import * as path from 'path';

import {
  CONTENT_MAX_WIDTH,
  MODAL_MAX_WIDTH,
  contentColumn,
  getColumnCount,
  getContentWidth,
  getModalWidth,
} from '../../src/utils/layout';
import { getGraphMetrics } from '../../src/components/home/streakHistoryGraphLayout';

// Portrait phone widths in dp: iPhone SE … iPhone Pro Max, common Android phones
const PHONE_WIDTHS = [320, 360, 375, 390, 393, 402, 411, 412, 414, 428, 430, 440];
// Pixel Tablet portrait/landscape, iPad mini/Air/Pro landscape, unfolded foldable
const LARGE_WIDTHS = [600, 673, 744, 800, 820, 1024, 1180, 1280, 1366];

describe('phones keep their exact layout', () => {
  it.each(PHONE_WIDTHS)('%i dp: content is the full width', (width) => {
    expect(getContentWidth(width)).toBe(width);
    expect(CONTENT_MAX_WIDTH).toBeGreaterThan(width);
  });

  it.each(PHONE_WIDTHS)('%i dp: modal widths equal the old fraction of the screen', (width) => {
    for (const fraction of [0.75, 0.85, 0.9, 0.95]) {
      expect(getModalWidth(width, fraction)).toBe(width * fraction);
    }
  });

  it.each(PHONE_WIDTHS)('%i dp: trophy grid has the old column count', (width) => {
    expect(getColumnCount(width, 32, 158)).toBe(Math.floor((width - 32) / 158));
  });

  it.each(PHONE_WIDTHS)('%i dp: Home graph has the old bar width', (width) => {
    const oldAvailable = width - 16 * 2 - 16 * 2 - 30 - 8 * 2;
    expect(getGraphMetrics(width)).toEqual({
      availableWidth: oldAvailable,
      dayWidth: Math.max(6, Math.floor(oldAvailable / 30)),
    });
  });
});

describe('large screens get a centered column and capped modals', () => {
  it('the column style centers content at CONTENT_MAX_WIDTH', () => {
    expect(contentColumn).toEqual({ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' });
  });

  it.each(LARGE_WIDTHS)('%i dp: content and modals never exceed their caps', (width) => {
    expect(getContentWidth(width)).toBeLessThanOrEqual(CONTENT_MAX_WIDTH);
    expect(getModalWidth(width, 0.95)).toBeLessThanOrEqual(MODAL_MAX_WIDTH);
  });

  it.each(LARGE_WIDTHS)('%i dp: all 30 graph bars fit inside the column card', (width) => {
    const { availableWidth, dayWidth } = getGraphMetrics(width);
    expect(dayWidth * 30).toBeLessThanOrEqual(availableWidth);
    // card = column - 2×16 margin; bars + Y axis must fit inside its 2×16 padding
    expect(availableWidth + 30).toBeLessThanOrEqual(getContentWidth(width) - 32 - 32);
  });

  it.each(LARGE_WIDTHS)('%i dp: trophy grid rows fit in the column', (width) => {
    const columns = getColumnCount(width, 32, 158);
    expect(columns * 158).toBeLessThanOrEqual(getContentWidth(width) - 32);
  });

  it('a row loop always advances, even on a tiny window', () => {
    expect(getColumnCount(100, 32, 158)).toBe(1);
  });
});

describe('no module-level window size', () => {
  const ROOT = path.join(__dirname, '..', '..');
  // responsive.ts sizes fonts/paddings once at startup. Allowed because on tablets its values are
  // the same in both orientations (isTablet and the 1.3× font cap hold either way) — see the guide.
  const ALLOWED = new Set(['src/utils/responsive.ts']);

  function sourceFiles(dir: string): string[] {
    return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(rel);
      return /\.(ts|tsx)$/.test(entry.name) ? [rel] : [];
    });
  }

  it('reads the window size only through useWindowDimensions()', () => {
    const offenders = ['app', 'src', 'components', 'hooks']
      .flatMap(sourceFiles)
      .filter((file) => !ALLOWED.has(file))
      .filter((file) => /\bDimensions\.get\(/.test(fs.readFileSync(path.join(ROOT, file), 'utf8')));
    // Dimensions.get() is a snapshot: at module level it never updates, in render it does not
    // re-render on rotation. Use useWindowDimensions() inside the component (utils/layout.ts).
    expect(offenders).toEqual([]);
  });
});
