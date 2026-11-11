/**
 * The decisions of the level panel (levelPanel.tsx), kept free of React Native so
 * they can be tested: what a tap on the level badge does, and how a drag on the
 * open panel maps to "how open it is" and to "let go = close?".
 *
 * GOING LIVE (1:1): these rules travel with the panel unchanged.
 */

export type BadgeTap = 'open' | 'close' | 'note' | 'none';

/**
 * One thing comes out of the badge at a time (R-31):
 * - the panel is out → the tap puts it back;
 * - a quiet trophy note is out → the tap is the note's tap (Trophy Room), wherever
 *   the user is;
 * - a big celebration, or anything open over the tab → the badge stays an indicator;
 * - otherwise the panel opens.
 */
export function badgeTapAction({
  shown,
  covered,
  moment,
}: {
  shown: boolean;
  covered: boolean;
  moment: 'quiet' | 'big' | null;
}): BadgeTap {
  if (shown) return 'close';
  if (moment === 'quiet') return 'note';
  if (moment === 'big' || covered) return 'none';
  return 'open';
}

/** Finger travel (px) that would take the panel all the way back into the badge. */
export const PANEL_DRAG_RANGE = 300;
/** The panel never shrinks to nothing under the finger — it must stay catchable. */
export const PANEL_DRAG_FLOOR = 0.45;
const DISMISS_DISTANCE = 72;
/** px per ms — a flick. */
const DISMISS_VELOCITY = 0.6;
const FLICK_MIN_DISTANCE = 12;
/** px per ms — slower than this is a resting finger's jitter, not a direction. */
const BACK_VELOCITY = 0.1;

/**
 * How open the panel is (1 = fully) while the finger is `dy` px from where it
 * started. `from` = how open it was when the finger took it (a panel caught on
 * its way out starts from there, not from fully open).
 */
export function dragProgress(dy: number, from = 1): number {
  const floor = Math.min(PANEL_DRAG_FLOOR, from);
  return Math.max(floor, from - Math.abs(dy) / PANEL_DRAG_RANGE);
}

/**
 * Let go: does the panel close? Dragged far enough, or flicked — but never while
 * the finger is on its way back (that is the user changing their mind, R-33).
 */
export function dragDismisses(dy: number, vy: number): boolean {
  const onTheWayBack = dy * vy < 0 && Math.abs(vy) > BACK_VELOCITY;
  if (onTheWayBack) return false;
  const distance = Math.abs(dy);
  return (
    distance > DISMISS_DISTANCE ||
    (Math.abs(vy) > DISMISS_VELOCITY && distance > FLICK_MIN_DISTANCE)
  );
}

/** "14 h" / "45 min" parts for the multiplier's time left. */
export function timeLeftParts(minutes: number): {
  value: number;
  unit: 'h' | 'min';
} {
  if (minutes >= 60) return { value: Math.round(minutes / 60), unit: 'h' };
  return { value: Math.max(1, Math.round(minutes)), unit: 'min' };
}
