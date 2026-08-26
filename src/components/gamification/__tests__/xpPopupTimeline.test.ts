/**
 * Regression tests for the XP bubble's animation timeline.
 *
 * The field bug: on Android the bubble appeared at roughly half size and stayed
 * there, with the correct size only flashing through. The old animation was
 * three chained steps, and every chain boundary waits on the JS thread — which
 * is busy writing to SQLite right after a habit tap. These tests guard the
 * shape of the replacement timeline, which the native driver runs in one shot.
 */

import {
  XP_POPUP_OPACITY,
  XP_POPUP_SCALE,
  XP_POPUP_TIMINGS,
  XP_POPUP_TOTAL_DURATION,
  XP_POPUP_TRANSLATE_Y,
  sampleTimeline,
  type InterpolationConfig,
} from '../xpPopupTimeline';

const CHANNELS: [string, InterpolationConfig][] = [
  ['scale', XP_POPUP_SCALE],
  ['opacity', XP_POPUP_OPACITY],
  ['translateY', XP_POPUP_TRANSLATE_Y],
];

/** Walks the whole timeline at ~1ms resolution. */
const everyFrame = (visit: (t: number) => void) => {
  for (let ms = 0; ms <= XP_POPUP_TOTAL_DURATION; ms++) {
    visit(ms / XP_POPUP_TOTAL_DURATION);
  }
};

describe('XP popup timeline — structure', () => {
  it.each(CHANNELS)('%s keyframes strictly increase', (_name, config) => {
    // Animated.interpolate throws on a non-monotonic inputRange
    for (let i = 1; i < config.inputRange.length; i++) {
      expect(config.inputRange[i]!).toBeGreaterThan(config.inputRange[i - 1]!);
    }
  });

  it.each(CHANNELS)('%s starts at 0 and ends at exactly 1', (_name, config) => {
    expect(config.inputRange[0]).toBe(0);
    // Catches a duration being changed without moving the keyframes with it
    expect(config.inputRange[config.inputRange.length - 1]).toBeCloseTo(1, 10);
  });

  it.each(CHANNELS)('%s has one output per keyframe', (_name, config) => {
    expect(config.outputRange).toHaveLength(config.inputRange.length);
  });

  it('the durations add up to the total the driver is given', () => {
    expect(XP_POPUP_TOTAL_DURATION).toBe(
      XP_POPUP_TIMINGS.POP_IN + XP_POPUP_TIMINGS.SETTLE + XP_POPUP_TIMINGS.FLOAT_UP
    );
  });

  it('the fade-out finishes exactly when the bubble does', () => {
    const fadeEnds =
      XP_POPUP_TIMINGS.POP_IN +
      XP_POPUP_TIMINGS.SETTLE +
      XP_POPUP_TIMINGS.FADE_OUT_DELAY +
      XP_POPUP_TIMINGS.FADE_OUT;
    // Otherwise the bubble is either cut off while still visible, or lingers
    // fully transparent while the cleanup timer waits
    expect(fadeEnds).toBe(XP_POPUP_TOTAL_DURATION);
  });
});

describe('XP popup timeline — the first painted frame', () => {
  it('opens invisible, so nothing is ever seen at the opening size', () => {
    expect(sampleTimeline(XP_POPUP_OPACITY, 0)).toBe(0);
  });

  it('opens at the pop-in size with no correction needed', () => {
    // The old build seeded 0.8 and only corrected to 0.5 from an effect — one
    // frame late, in a size that appears nowhere in the intended animation
    expect(sampleTimeline(XP_POPUP_SCALE, 0)).toBe(0.5);
  });

  it('opens without any vertical offset', () => {
    expect(sampleTimeline(XP_POPUP_TRANSLATE_Y, 0)).toBe(0);
  });
});

describe('XP popup timeline — the reported symptom cannot recur', () => {
  it('is still essentially invisible while smaller than its resting size', () => {
    everyFrame(t => {
      const scale = sampleTimeline(XP_POPUP_SCALE, t);
      if (scale < 0.8) {
        // A visible half-size bubble IS the bug the tester photographed
        expect(sampleTimeline(XP_POPUP_OPACITY, t)).toBeLessThan(0.35);
      }
    });
  });

  it('never shrinks below the resting size while clearly visible', () => {
    everyFrame(t => {
      if (sampleTimeline(XP_POPUP_OPACITY, t) >= 0.5) {
        expect(sampleTimeline(XP_POPUP_SCALE, t)).toBeGreaterThanOrEqual(0.8);
      }
    });
  });

  it('reaches full size while fully opaque', () => {
    let sawFullSizeAndOpaque = false;
    everyFrame(t => {
      if (
        sampleTimeline(XP_POPUP_OPACITY, t) >= 0.99 &&
        sampleTimeline(XP_POPUP_SCALE, t) >= 1.0
      ) {
        sawFullSizeAndOpaque = true;
      }
    });
    expect(sawFullSizeAndOpaque).toBe(true);
  });
});

describe('XP popup timeline — motion', () => {
  it('overshoots before settling, so the bubble reads as a pop', () => {
    const peak = Math.max(...XP_POPUP_SCALE.outputRange);
    expect(peak).toBeGreaterThan(1.0);

    const peakAt = XP_POPUP_SCALE.inputRange[XP_POPUP_SCALE.outputRange.indexOf(peak)]!;
    const popInEnds = XP_POPUP_TIMINGS.POP_IN / XP_POPUP_TOTAL_DURATION;
    expect(peakAt).toBeLessThanOrEqual(popInEnds);
  });

  it('holds still until the settle is over, then drifts up', () => {
    const floatStart =
      (XP_POPUP_TIMINGS.POP_IN + XP_POPUP_TIMINGS.SETTLE) / XP_POPUP_TOTAL_DURATION;

    expect(sampleTimeline(XP_POPUP_TRANSLATE_Y, floatStart)).toBe(0);
    expect(sampleTimeline(XP_POPUP_TRANSLATE_Y, 1)).toBe(-80);
  });

  it('ends fully transparent', () => {
    expect(sampleTimeline(XP_POPUP_OPACITY, 1)).toBe(0);
  });
});

describe('sampleTimeline', () => {
  it('clamps outside the range instead of extrapolating', () => {
    expect(sampleTimeline(XP_POPUP_SCALE, -1)).toBe(0.5);
    expect(sampleTimeline(XP_POPUP_SCALE, 2)).toBe(0.8);
  });

  it('interpolates linearly between keyframes', () => {
    // halfway between the settle (1.0) and the end (0.8)
    const floatStart =
      (XP_POPUP_TIMINGS.POP_IN + XP_POPUP_TIMINGS.SETTLE) / XP_POPUP_TOTAL_DURATION;
    const midway = floatStart + (1 - floatStart) / 2;
    expect(sampleTimeline(XP_POPUP_SCALE, midway)).toBeCloseTo(0.9, 5);
  });
});
