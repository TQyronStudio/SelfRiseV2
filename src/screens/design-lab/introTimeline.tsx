/**
 * One timeline for the whole entrance (premium-design-plan.md, F1).
 *
 * A single shared value `t` runs 0 → 1 on the UI thread; every element reads its
 * own window of it (start/end in ms). One clock means the sequence can never drift
 * apart, and a tap skips everything at once by finishing `t` — the same "one
 * timeline" rule the XP bubble follows (technical-guides:Gamification-UI.md).
 *
 * Two variants:
 * - `launch`: the app opening — the night (the native splash, same colour, same
 *   crystal S, same size) lifts like a curtain and the day assembles underneath.
 *   Proposal for the real app: only the first open of a day, cold start only.
 * - `settle`: every other entrance — content settles in under a second.
 *
 * Reduce motion: `withTiming` follows the system setting (ReduceMotion.System), so
 * `t` jumps straight to 1 and the screen is simply there.
 *
 * GOING LIVE (1:1) — only after decision R-9:
 * - Full launch only on the first cold start of the day; otherwise `settle`.
 * - Hand-off from the native splash: SplashScreen.preventAutoHideAsync → first
 *   curtain frame identical → hideAsync. Never over ATT/UMP or the onboarding
 *   (technical-guides:Startup-Orchestrator.md, "never two modals").
 * - Tap skips; reduce motion = screen just appears.
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
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';
import { SPLASH_BACKGROUND, SPLASH_ICON_SIZE } from './labTokens';

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

// ---------------------------------------------------------------------------
// The night lifts: the splash becomes a curtain that rises off the screen
// ---------------------------------------------------------------------------

const splashIcon = require('../../../assets/images/splash-icon.png');
const NIGHT_TAIL = 220;

export function LaunchCurtain() {
  const { timeline, skip } = useIntro();
  const { height } = useWindowDimensions();
  const bloom = useIntroWindow([0, 560]);
  const lift = useIntroWindow([460, 1200], 'inOut');
  const iconOut = useIntroWindow([460, 980]);

  const curtainStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -lift.value * (height + NIGHT_TAIL + 40) }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: bloom.value * (1 - iconOut.value),
    transform: [{ scale: 0.7 + 0.45 * bloom.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: 1 - iconOut.value,
    transform: [
      { translateY: -90 * iconOut.value },
      { scale: 1 + 0.05 * bloom.value - 0.45 * iconOut.value },
    ],
  }));

  if (!timeline.curtain) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.curtain, curtainStyle]}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={skip}
        accessibilityLabel="Skip intro"
        accessibilityRole="button"
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: SPLASH_BACKGROUND },
          ]}
        />
        {/* The night's soft edge: the day is uncovered gradually, like at dawn. */}
        <LinearGradient
          colors={[SPLASH_BACKGROUND, 'rgba(7, 5, 26, 0)']}
          style={styles.nightTail}
          pointerEvents="none"
        />
        {/* First light on the horizon — gold into our blue. */}
        <LinearGradient
          colors={[
            'rgba(244, 182, 63, 0)',
            'rgba(244, 182, 63, 0.95)',
            'rgba(125, 180, 255, 0.95)',
            'rgba(125, 180, 255, 0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.horizon}
          pointerEvents="none"
        />
        <View style={styles.center} pointerEvents="none">
          <Animated.View style={[styles.glow, glowStyle]} />
          <Animated.View style={iconStyle}>
            <Image
              source={splashIcon}
              style={styles.icon}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  curtain: {
    zIndex: 100,
    elevation: 100,
  },
  nightTail: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -NIGHT_TAIL,
    height: NIGHT_TAIL,
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    boxShadow: '0px 0px 18px rgba(244, 182, 63, 0.75)',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: SPLASH_ICON_SIZE * 1.2,
    height: SPLASH_ICON_SIZE * 1.2,
    borderRadius: SPLASH_ICON_SIZE * 0.6,
    backgroundColor: 'rgba(125, 227, 244, 0.10)',
    boxShadow: '0px 0px 80px rgba(125, 227, 244, 0.55)',
  },
  icon: {
    width: SPLASH_ICON_SIZE,
    height: SPLASH_ICON_SIZE,
  },
});
