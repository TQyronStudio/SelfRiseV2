/**
 * Dragging something shut (R-33, kolo 40; moved 1:1 from the Design Lab in
 * migration E4 — the lab keeps its copy, O-6): how far it is open under the finger,
 * and whether letting go closes it. The functions are worklets (they run in the
 * gesture, on the UI thread) and plain enough to be tested.
 *
 * One rule for every page, sheet and detail — the same as the level panel's:
 * the drag scrubs the one value that also opens and closes the thing, so it can
 * always be taken back halfway.
 */

/** Part of the drag range after which letting go closes. */
const CLOSE_SHARE = 0.3;
/** px per second — a flick closes even after a short drag… */
const FLICK_VELOCITY = 700;
/** …but not a twitch. */
const FLICK_MIN_TRAVEL = 24;
/** px per second back towards open — the user changed their mind. */
const BACK_VELOCITY = 120;

/**
 * How open (0..1) the thing is while the finger is `travel` px along the closing
 * direction. `from` = how open it was when the finger took it; moving the other
 * way never opens it further.
 */
export function dragOpenness(
  from: number,
  travel: number,
  range: number,
  floor: number
): number {
  'worklet';
  const moved = Math.max(0, travel);
  return Math.max(Math.min(floor, from), from - moved / range);
}

/** Let go after `travel` px at `velocity` px/s (positive = closing): close? */
export function dragCloses(
  travel: number,
  velocity: number,
  range: number
): boolean {
  'worklet';
  if (velocity < -BACK_VELOCITY) return false;
  return (
    travel > range * CLOSE_SHARE ||
    (velocity > FLICK_VELOCITY && travel > FLICK_MIN_TRAVEL)
  );
}
