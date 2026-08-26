/**
 * XP popup — the animation timeline, as data.
 *
 * ONE timeline, ONE native animation. The bubble used to run three chained
 * steps (pop in -> settle -> float out). Every boundary in a chained animation
 * needs a round-trip back to the JS thread before the next step may start — and
 * on Android that thread is busy writing the completion to SQLite and
 * re-rendering the habit list at exactly that moment. The bubble froze
 * mid-flight, usually still in the small pop-in phase, with the correct size
 * only flashing through. iOS devices were simply fast enough to hide the same
 * stall.
 *
 * Driving every channel from a single 0->1 value hands the whole animation to
 * the native driver up front, so a busy JS thread can no longer freeze it.
 * The shaping lives in these keyframes, which is why the driver must run with
 * linear easing.
 */

export const XP_POPUP_TIMINGS = {
  /** 0.5 -> overshoot -> 1.15 */
  POP_IN: 300,
  /** 1.15 -> 1.0 */
  SETTLE: 100,
  /** rise 80px while shrinking to 0.8 */
  FLOAT_UP: 800,
  FADE_OUT: 600,
  /** measured from the end of the settle */
  FADE_OUT_DELAY: 200,
} as const;

/** Everything must land exactly here — `xpPopupTimeline.test.ts` enforces it. */
export const XP_POPUP_TOTAL_DURATION =
  XP_POPUP_TIMINGS.POP_IN + XP_POPUP_TIMINGS.SETTLE + XP_POPUP_TIMINGS.FLOAT_UP;

/** The moment the bubble stops growing and starts drifting upwards. */
const FLOAT_START = XP_POPUP_TIMINGS.POP_IN + XP_POPUP_TIMINGS.SETTLE;

/** Position of a moment (in ms) on the normalised 0->1 timeline. */
const at = (ms: number): number => ms / XP_POPUP_TOTAL_DURATION;

export interface InterpolationConfig {
  inputRange: number[];
  outputRange: number[];
}

/**
 * The bounce lives in these keyframes rather than in a spring, so the whole
 * curve can be handed to the native driver in a single shot.
 * At t=0 the bubble is already at its opening size — the first painted frame
 * needs no correction from an effect.
 */
export const XP_POPUP_SCALE: InterpolationConfig = {
  inputRange: [0, at(100), at(200), at(XP_POPUP_TIMINGS.POP_IN), at(FLOAT_START), 1],
  outputRange: [0.5, 1.05, 1.18, 1.15, 1.0, 0.8],
};

export const XP_POPUP_OPACITY: InterpolationConfig = {
  inputRange: [
    0,
    at(XP_POPUP_TIMINGS.POP_IN),
    at(FLOAT_START + XP_POPUP_TIMINGS.FADE_OUT_DELAY),
    at(FLOAT_START + XP_POPUP_TIMINGS.FADE_OUT_DELAY + XP_POPUP_TIMINGS.FADE_OUT),
  ],
  outputRange: [0, 1, 1, 0],
};

export const XP_POPUP_TRANSLATE_Y: InterpolationConfig = {
  inputRange: [0, at(FLOAT_START), 1],
  outputRange: [0, 0, -80],
};

/**
 * Linear lookup along a config — mirrors what Animated.interpolate does, so the
 * timeline can be asserted without mounting anything.
 */
export const sampleTimeline = (config: InterpolationConfig, t: number): number => {
  const { inputRange, outputRange } = config;
  const clamped = Math.max(inputRange[0]!, Math.min(t, inputRange[inputRange.length - 1]!));

  for (let i = 0; i < inputRange.length - 1; i++) {
    const from = inputRange[i]!;
    const to = inputRange[i + 1]!;
    if (clamped >= from && clamped <= to) {
      const span = to - from;
      const ratio = span === 0 ? 0 : (clamped - from) / span;
      return outputRange[i]! + ratio * (outputRange[i + 1]! - outputRange[i]!);
    }
  }
  return outputRange[outputRange.length - 1]!;
};
