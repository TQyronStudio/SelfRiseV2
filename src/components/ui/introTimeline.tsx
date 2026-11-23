/**
 * One timeline for the whole entrance (moved from the Design Lab in migration E2;
 * the lab keeps its copy — O-6).
 *
 * A single shared value `t` runs 0 → 1 on the UI thread; every element reads its
 * own window of it (start/end in ms). One clock means the sequence can never drift
 * apart, and a tap skips everything at once by finishing `t`.
 *
 * Two variants:
 * - `launch`: the app opening behind the launch curtain (R-9). The curtain itself
 *   (the night lifting off the splash) comes with stage E23 — only the clock is here.
 * - `settle`: every other entrance — content settles in under a second.
 *
 * Reduce motion: `withTiming` follows the system setting (ReduceMotion.System), so
 * `t` jumps straight to 1 and the screen is simply there.
 */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  Easing,
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export type IntroKind = 'launch' | 'settle';
export type IntroWindow = readonly [number, number];

export interface IntroTimeline {
  total: number;
  curtain: boolean;
  header: IntroWindow;
  hero: IntroWindow;
  arc: IntroWindow;
  sun: IntroWindow;
  chips: IntroWindow;
  /** Sections below the hero, in order. Capped: later ones enter together. */
  sections: readonly IntroWindow[];
}

export const INTRO_TIMELINES: Record<IntroKind, IntroTimeline> = {
  launch: {
    total: 2200,
    curtain: true,
    header: [720, 1120],
    hero: [820, 1260],
    arc: [960, 1460],
    sun: [1260, 2080],
    chips: [1620, 1920],
    sections: [
      [1000, 1400],
      [1090, 1490],
      [1180, 1580],
      [1270, 1670],
      [1360, 1760],
      [1450, 1850],
    ],
  },
  settle: {
    total: 950,
    curtain: false,
    header: [0, 360],
    hero: [60, 420],
    arc: [80, 520],
    sun: [260, 950],
    chips: [520, 820],
    sections: [
      [120, 470],
      [170, 520],
      [220, 570],
      [270, 620],
      [320, 670],
      [370, 720],
    ],
  },
};

const SKIP_DURATION = 220;

interface IntroContextValue {
  t: SharedValue<number>;
  timeline: IntroTimeline;
  /** False while the entrance runs (the status bar follows the dark curtain). */
  done: boolean;
  skip: () => void;
}

const IntroContext = createContext<IntroContextValue | null>(null);

export function IntroProvider({
  kind,
  playKey,
  children,
}: {
  kind: IntroKind;
  playKey: number;
  children: ReactNode;
}) {
  const timeline = INTRO_TIMELINES[kind];
  const t = useSharedValue(0);
  const [done, setDone] = useState(false);

  // Layout effect: the clock restarts before the new page paints, so it never
  // flashes in its finished state for a frame.
  useLayoutEffect(() => {
    setDone(false);
    t.value = 0;
    t.value = withTiming(
      1,
      { duration: timeline.total, easing: Easing.linear },
      finished => {
        if (finished) scheduleOnRN(setDone, true);
      }
    );
  }, [kind, playKey, t, timeline.total]);

  const skip = useCallback(() => {
    t.value = withTiming(
      1,
      { duration: SKIP_DURATION, easing: Easing.out(Easing.quad) },
      finished => {
        if (finished) scheduleOnRN(setDone, true);
      }
    );
  }, [t]);

  const value = useMemo(
    () => ({ t, timeline, done, skip }),
    [t, timeline, done, skip]
  );
  return (
    <IntroContext.Provider value={value}>{children}</IntroContext.Provider>
  );
}

export function useIntro(): IntroContextValue {
  const ctx = useContext(IntroContext);
  if (!ctx) throw new Error('useIntro must be used inside IntroProvider');
  return ctx;
}

/** 0 → 1 inside one window of the timeline, eased. Runs on the UI thread. */
export function useIntroWindow(
  window: IntroWindow,
  ease: 'out' | 'inOut' = 'out'
): SharedValue<number> {
  const { t, timeline } = useIntro();
  const total = timeline.total;
  const start = window[0];
  const end = window[1];
  return useDerivedValue(() => {
    const x = Math.min(
      1,
      Math.max(0, (t.value * total - start) / (end - start))
    );
    if (ease === 'inOut') {
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    return 1 - Math.pow(1 - x, 3);
  });
}
