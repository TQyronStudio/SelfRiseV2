/**
 * Design Lab primitives — the building blocks a premium screen is assembled from
 * (premium-design-plan.md, kap. 5). They read only lab tokens. If Petr approves
 * the look they move to shared components in phase F2.
 *
 * Motion rules they follow (zadání, principy 5–6):
 * - only transform and opacity animate, on the UI thread (Reanimated / Skia);
 * - Reanimated's default ReduceMotion.System applies, so with "reduce motion"
 *   on, every animation jumps straight to its final state;
 * - haptics go through hapticsService, which honours the switch in Settings.
 *
 * GOING LIVE (1:1) — see PREVOD.md and premium-design-plan.md ch. 10:
 * - Becomes the shared component set; LabThemeProvider → extended useTheme().
 * - Never animate opacity on a card-sized view (lesson 2); only transform.
 * - Anything pinned over a page needs pointerEvents="box-none" and a wrapper sized
 *   to its content — Rise has the prop for this (lesson 9).
 * - Skia canvases with loops (DayArc) pause while scrolling / off screen; glow via
 *   RadialGradient, never BlurMask in a redrawn canvas (lesson 4).
 * - Haptics only answer a touch (lesson 7).
 */
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient as SkiaLinearGradient,
  RadialGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import {
  impact,
  ImpactFeedbackStyle,
  selection,
} from '@/src/services/hapticsService';
import {
  labFonts,
  labMotion,
  LabMode,
  LabPalette,
  labPalettes,
  labRadius,
  labSpace,
  labType,
  LabTypeVariant,
} from './labTokens';
import { LabLang } from './mockCopy';
import { IntroWindow, useIntroWindow } from './introTimeline';
import { seenDelay, useCardSeen } from './scrollChoreography';

// ---------------------------------------------------------------------------
// Lab theme (local to the lab — the app's own theme setting is never touched)
// ---------------------------------------------------------------------------

interface LabTheme {
  mode: LabMode;
  c: LabPalette;
  lang: LabLang;
  /**
   * "Crown" layer on/off (✨ in the lab toolbar): scroll choreography, the sun's
   * rays and the haptic ticks. Off = the calm round-2 version, for comparison.
   */
  crown: boolean;
}

const LabThemeContext = createContext<LabTheme>({
  mode: 'light',
  c: labPalettes.light,
  lang: 'en',
  crown: true,
});

export function LabThemeProvider({
  mode,
  lang,
  crown,
  children,
}: {
  mode: LabMode;
  lang: LabLang;
  crown: boolean;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ mode, lang, crown, c: labPalettes[mode] }),
    [mode, lang, crown]
  );
  return (
    <LabThemeContext.Provider value={value}>
      {children}
    </LabThemeContext.Provider>
  );
}

export const useLab = () => useContext(LabThemeContext);

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export type LabTone =
  | 'text'
  | 'muted'
  | 'faint'
  | 'primary'
  | 'onPrimary'
  | 'reward'
  | 'flame'
  | 'success';

export function toneColor(c: LabPalette, tone: LabTone): string {
  switch (tone) {
    case 'muted':
      return c.textMuted;
    case 'faint':
      return c.textFaint;
    case 'primary':
      return c.primary;
    case 'onPrimary':
      return c.onPrimary;
    case 'reward':
      return c.rewardText;
    case 'flame':
      return c.flame;
    case 'success':
      return c.successText;
    default:
      return c.text;
  }
}

export function typeStyle(
  variant: LabTypeVariant,
  color: string,
  italic = false
): TextStyle {
  const t = labType[variant];
  return {
    fontFamily: italic ? labFonts.displayItalic : t.fontFamily,
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    color,
    ...(t.uppercase ? { textTransform: 'uppercase' as const } : null),
    ...(t.tabular ? { fontVariant: ['tabular-nums' as const] } : null),
  };
}

interface LabTextProps {
  variant?: LabTypeVariant;
  tone?: LabTone;
  /** Fraunces italic — the guide's own voice (encouragement, the line under the greeting). */
  italic?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}

export function LabText({
  variant = 'body',
  tone = 'text',
  italic,
  numberOfLines,
  style,
  children,
}: LabTextProps) {
  const { c } = useLab();
  return (
    <Text
      maxFontSizeMultiplier={labType[variant].maxScale}
      numberOfLines={numberOfLines}
      style={[typeStyle(variant, toneColor(c, tone), italic), style]}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Surface — the card every section sits on
// ---------------------------------------------------------------------------

interface SurfaceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Optional soft vertical gradient (only the screen's hero gets one). */
  gradient?: readonly [string, string];
}

export function Surface({ children, style, gradient }: SurfaceProps) {
  const { c } = useLab();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: labRadius.lg,
          borderWidth: 1,
          borderColor: c.border,
          // Cross-platform shadow (New Architecture; Android 9+). Not clipped by the
          // card itself, so no overflow:hidden here — the gradient clips on its own.
          boxShadow: c.shadow,
          padding: labSpace.xl,
        },
        style,
      ]}
    >
      {gradient && (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: labRadius.lg - 1 }]}
        />
      )}
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// PressableScale — every tap gets a slight press-in and a light haptic
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps {
  children: ReactNode;
  onPress?: () => void;
  /** `null` when the caller plays its own haptic (e.g. the check button). */
  haptic?: 'selection' | 'light' | null;
  /** Big surfaces press in less than small buttons, or they look like they collapse. */
  pressScale?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'checkbox' | 'tab' | 'link';
  accessibilityState?: { checked?: boolean; selected?: boolean };
  onLayout?: React.ComponentProps<typeof Pressable>['onLayout'];
}

export function PressableScale({
  children,
  onPress,
  haptic = 'selection',
  pressScale = labMotion.pressScale,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  onLayout,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      onLayout={onLayout}
      onPressIn={() => {
        scale.value = withSpring(pressScale, labMotion.pressSpring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, labMotion.pressSpring);
      }}
      onPress={() => {
        if (haptic === 'selection') selection();
        else if (haptic === 'light') impact(ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={[style, pressStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// Rise — enters inside its window of the shared intro timeline
// ---------------------------------------------------------------------------

interface RiseProps {
  /** 'box-none' for overlays that must not swallow taps around their content. */
  pointerEvents?: 'auto' | 'box-none' | 'none';
  window: IntroWindow;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  distance?: number;
  /** Optional settle from a slightly smaller size (the hero, the chips). */
  scaleFrom?: number;
}

export function Rise({
  window,
  children,
  style,
  distance = labMotion.riseDistance,
  scaleFrom = 1,
  pointerEvents = 'auto',
}: RiseProps) {
  const p = useIntroWindow(window);
  const riseStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [
      { translateY: (1 - p.value) * distance },
      { scale: scaleFrom + (1 - scaleFrom) * p.value },
    ],
  }));
  return (
    <Animated.View style={[style, riseStyle]} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// AnimatedNumber — fills up instead of jumping; never shifts the layout
// ---------------------------------------------------------------------------

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  /** Must be a worklet: it runs on the UI thread every frame. */
  format: (value: number) => string;
  /** Drive the number from another animation (the day count follows the sun). */
  source?: SharedValue<number>;
  variant?: LabTypeVariant;
  tone?: LabTone;
  /** Planned start (ms after mount). Inside a ScrollCard it waits until the card is seen. */
  delay?: number;
  align?: 'left' | 'right' | 'center';
  style?: StyleProp<TextStyle>;
}

/**
 * The text updates on the UI thread through the TextInput `text` prop (the same
 * technique Reanimated's own PerformanceMonitor uses), so counting costs no React
 * renders. An invisible copy of the final value reserves the width, and tabular
 * figures keep every intermediate value inside it — nothing next to the number
 * shifts while it counts.
 */
export function AnimatedNumber({
  value,
  format,
  source,
  variant = 'numberSm',
  tone = 'text',
  delay = 0,
  align = 'left',
  style,
}: AnimatedNumberProps) {
  const { c } = useLab();
  const { seen, seenAfter } = useCardSeen();
  const own = useSharedValue(0);
  const startIn = seenDelay(seenAfter, delay);

  useEffect(() => {
    if (source || !seen) return;
    own.value = withDelay(
      startIn,
      withTiming(value, {
        duration: labMotion.fill,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [value, startIn, own, source, seen]);

  const animatedProps = useAnimatedProps(() => {
    const text = format(source ? source.value : own.value);
    return { text, defaultValue: text } as Partial<
      React.ComponentProps<typeof TextInput>
    >;
  });

  const base = typeStyle(variant, toneColor(c, tone));
  // A TextInput with lineHeight renders unevenly across platforms; it is centred in
  // the box the invisible Text measured instead.
  const { lineHeight: _lineHeight, ...inputBase } = base;
  const finalText = format(value);

  return (
    <View accessible accessibilityLabel={finalText}>
      <Text
        style={[base, style, { opacity: 0 }]}
        maxFontSizeMultiplier={labType[variant].maxScale}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {finalText}
      </Text>
      <AnimatedTextInput
        editable={false}
        pointerEvents="none"
        underlineColorAndroid="transparent"
        maxFontSizeMultiplier={labType[variant].maxScale}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[
          StyleSheet.absoluteFill,
          inputBase,
          style,
          {
            padding: 0,
            margin: 0,
            textAlign: align,
            textAlignVertical: 'center',
            includeFontPadding: false,
          },
        ]}
        animatedProps={animatedProps}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProgressBar — the fill slides in (translateX), so rounded ends never squash
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  progress: number;
  colors: readonly [string, string];
  height?: number;
  /** Planned start (ms after mount). Inside a ScrollCard it waits until the card is seen. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  colors,
  height = 10,
  delay = 0,
  style,
}: ProgressBarProps) {
  const { c } = useLab();
  const { seen, seenAfter } = useCardSeen();
  const width = useSharedValue(0);
  const fill = useSharedValue(0);
  const startIn = seenDelay(seenAfter, delay);

  useEffect(() => {
    if (!seen) return;
    fill.value = withDelay(
      startIn,
      withTiming(progress, {
        duration: labMotion.fill,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [progress, startIn, fill, seen]);

  const fillStyle = useAnimatedStyle(() => ({
    // Hidden until measured: with width 0 the bar would flash full for a frame.
    opacity: width.value > 0 ? 1 : 0,
    transform: [{ translateX: (fill.value - 1) * width.value }],
  }));

  return (
    <View
      onLayout={e => {
        width.value = e.nativeEvent.layout.width;
      }}
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: c.track,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, fillStyle]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: height / 2 }}
        />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DayArc — the signature: today's progress as the sun's path over a horizon.
// "SelfRise": each finished habit moves the sun further along its day.
// ---------------------------------------------------------------------------

const SIN_IN_OUT = Easing.inOut(Easing.sin);
const ARC_STROKE = 12;
const SUN_GLOW = 16;
/** Room around the arc so the sun's glow and rays are never clipped at the horizon ends. */
const ARC_PAD = 34;
const BURST_SIZE = 180;
const BURST_PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const reach = i % 2 === 0 ? 62 : 48;
  return {
    x: BURST_SIZE / 2 + Math.cos(angle) * reach,
    y: BURST_SIZE / 2 + Math.sin(angle) * reach,
    r: i % 2 === 0 ? 3.2 : 2.2,
  };
});

/** Eight soft rays around the sun's centre (origin 0,0); the group moves with the sun. */
function buildRays() {
  const path = Skia.Path.Make();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const inner = 13;
    const outer = k % 2 === 0 ? 34 : 25;
    const half = 0.11;
    path.moveTo(Math.cos(a - half) * inner, Math.sin(a - half) * inner);
    path.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    path.lineTo(Math.cos(a + half) * inner, Math.sin(a + half) * inner);
    path.close();
  }
  return path;
}

interface DayArcProps {
  /** Where the sun is: 0 = sunrise (nothing done) … 1 = the whole day done. */
  sun: SharedValue<number>;
  /** How much of the track is drawn (the intro draws it before the sun appears). */
  draw: SharedValue<number>;
  width: number;
  sunColor: string;
  /** One marker per habit; it lights up when the sun passes it. */
  markers: number;
  /** Slowly turning rays around the sun (crown layer; never for the moon). */
  rays: boolean;
  /**
   * 1 = the ambient loops (breathing, turning rays) run; 0 = they stop. They stop
   * while the user scrolls and when the hero is off screen — an endlessly redrawn
   * canvas nobody is looking at only steals frames from the scroll.
   */
  ambient: SharedValue<number>;
  /** Increment to play the "day complete" flare at the end of the arc. */
  celebrateKey: number;
  /**
   * What each marker stands for (finished habits first, so lit markers are the
   * done ones). Tap a marker, or slide a finger along the arc, to see its habit.
   */
  markerLabels?: { name: string; done: boolean; status: string }[];
  /** Rendered centred, sitting on the horizon inside the arc (the day's count). */
  children?: ReactNode;
}

export function DayArc({
  sun,
  draw,
  width,
  sunColor,
  markers,
  rays,
  ambient,
  celebrateKey,
  markerLabels,
  children,
}: DayArcProps) {
  const { c } = useLab();
  const radius = (width - ARC_PAD * 2) / 2;
  const cx = width / 2;
  const cy = radius + ARC_PAD;
  const height = cy + ARC_PAD;

  const arc = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(
      Skia.XYWHRect(cx - radius, cy - radius, radius * 2, radius * 2),
      180,
      180
    );
    return path;
  }, [cx, cy, radius]);
  const rayPath = useMemo(buildRays, []);
  const markerPoints = useMemo(
    () =>
      Array.from({ length: markers }, (_, i) => {
        const frac = (i + 1) / markers;
        const angle = Math.PI + Math.PI * frac;
        return {
          frac,
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        };
      }),
    [markers, cx, cy, radius]
  );

  // Ambient life: the sun breathes (4.4 s) and its rays make one turn every 30 s —
  // felt more than seen. Started and stopped on the UI thread by `ambient`.
  const breath = useSharedValue(0);
  const spin = useSharedValue(0);
  useAnimatedReaction(
    () => ambient.value > 0.5,
    (on, wasOn) => {
      if (on === wasOn) return;
      if (on) {
        breath.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 2200, easing: SIN_IN_OUT }),
            withTiming(0, { duration: 2200, easing: SIN_IN_OUT })
          ),
          -1
        );
        // +1 turn from wherever it stopped; the restart jump is a whole turn, invisible.
        if (rays) {
          spin.value = withRepeat(
            withTiming(spin.value + 1, {
              duration: 30000,
              easing: Easing.linear,
            }),
            -1
          );
        }
      } else {
        cancelAnimation(breath);
        cancelAnimation(spin);
      }
    },
    [rays]
  );

  const sunX = useDerivedValue(
    () => cx + radius * Math.cos(Math.PI + Math.PI * sun.value)
  );
  const sunY = useDerivedValue(
    () => cy + radius * Math.sin(Math.PI + Math.PI * sun.value)
  );
  const sunOpacity = useDerivedValue(() =>
    Math.min(1, Math.max(0, (draw.value - 0.55) / 0.45))
  );
  // A radial gradient (not a blur) — so the radius is larger than the old blurred disc.
  const glowR = useDerivedValue(() => SUN_GLOW + 8 + 6 * breath.value);
  const sunCenter = useDerivedValue(() => ({ x: sunX.value, y: sunY.value }));
  const glowOpacity = useDerivedValue(
    () => sunOpacity.value * (0.55 + 0.2 * breath.value)
  );
  const raysTransform = useDerivedValue(() => [
    { translateX: sunX.value },
    { translateY: sunY.value },
    { rotate: spin.value * Math.PI * 2 },
    { scale: 0.92 + 0.12 * breath.value },
  ]);
  const raysOpacity = useDerivedValue(() => sunOpacity.value * 0.45);

  // "Day complete": a flare and a ring of light at the end of the arc.
  const burst = useSharedValue(0);
  useEffect(() => {
    if (celebrateKey === 0) return;
    burst.value = 0;
    burst.value = withTiming(1, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [celebrateKey, burst]);
  const flareR = useDerivedValue(() => 12 + 58 * burst.value);
  const flareOpacity = useDerivedValue(() =>
    burst.value === 0 ? 0 : 0.6 * (1 - burst.value)
  );
  const ringTransform = useDerivedValue(() => [
    { scale: 0.25 + 1.05 * burst.value },
  ]);
  const ringOpacity = useDerivedValue(() =>
    burst.value === 0 ? 0 : 1 - burst.value
  );

  return (
    <View style={{ width, height, overflow: 'visible' }}>
      <Canvas style={{ width, height }} pointerEvents="none">
        <Path
          path={arc}
          style="stroke"
          strokeWidth={ARC_STROKE}
          strokeCap="round"
          color={c.track}
          start={0}
          end={draw}
        />
        <Path
          path={arc}
          style="stroke"
          strokeWidth={ARC_STROKE}
          strokeCap="round"
          start={0}
          end={sun}
        >
          <SkiaLinearGradient
            start={vec(cx - radius, 0)}
            end={vec(cx + radius, 0)}
            colors={[...c.arcGradient]}
          />
        </Path>
        {markerPoints.map(m => (
          <ArcMarker
            key={m.frac}
            x={m.x}
            y={m.y}
            frac={m.frac}
            count={markers}
            sun={sun}
            draw={draw}
            faint={c.textFaint}
          />
        ))}
        {rays && (
          <Group transform={raysTransform} opacity={raysOpacity}>
            {/* Soft ends from a radial gradient — no blur filter, which would cost every frame. */}
            <Path path={rayPath}>
              <RadialGradient
                c={vec(0, 0)}
                r={34}
                colors={[sunColor, `${sunColor}00`]}
              />
            </Path>
          </Group>
        )}
        <Circle cx={sunX} cy={sunY} r={glowR} opacity={glowOpacity}>
          <RadialGradient
            c={sunCenter}
            r={glowR}
            colors={[sunColor, `${sunColor}00`]}
          />
        </Circle>
        <Circle
          cx={sunX}
          cy={sunY}
          r={9}
          color={sunColor}
          opacity={sunOpacity}
        />
        <Circle
          cx={sunX}
          cy={sunY}
          r={3.5}
          color="#FFFFFF"
          opacity={sunOpacity}
        />
      </Canvas>

      {/* Sits over the end of the arc and may spill past the card edge; idle = transparent. */}
      <Canvas
        style={[
          styles.burst,
          { left: cx + radius - BURST_SIZE / 2, top: cy - BURST_SIZE / 2 },
        ]}
        pointerEvents="none"
      >
        <Circle
          cx={BURST_SIZE / 2}
          cy={BURST_SIZE / 2}
          r={flareR}
          opacity={flareOpacity}
        >
          <RadialGradient
            c={vec(BURST_SIZE / 2, BURST_SIZE / 2)}
            r={flareR}
            colors={[sunColor, `${sunColor}00`]}
          />
        </Circle>
        <Group
          transform={ringTransform}
          origin={vec(BURST_SIZE / 2, BURST_SIZE / 2)}
          opacity={ringOpacity}
        >
          {BURST_PARTICLES.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.r}
              color={i % 2 === 0 ? sunColor : c.arcGradient[1]}
            />
          ))}
        </Group>
      </Canvas>

      {children && (
        <View
          style={[styles.arcCenter, { bottom: ARC_PAD - 2 }]}
          pointerEvents="none"
        >
          {children}
        </View>
      )}

      {markerLabels && (
        <ArcTouchLayer
          points={markerPoints}
          labels={markerLabels}
          width={width}
          height={height}
        />
      )}
    </View>
  );
}

const CALLOUT_WIDTH = 168;
const CALLOUT_HIDE_MS = 2200;

/**
 * Makes the arc something to play with: tap a marker, or slide a finger along the
 * arc (a horizontal drag — a vertical one still scrolls the screen). Each habit the
 * finger reaches gives a selection tick, like a detent.
 */
function ArcTouchLayer({
  points,
  labels,
  width,
  height,
}: {
  points: { frac: number; x: number; y: number }[];
  labels: { name: string; done: boolean; status: string }[];
  width: number;
  height: number;
}) {
  const [focus, setFocus] = useState<number | null>(null);
  const focusRef = useRef<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (index: number, autoHide: boolean) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    // One tick per habit reached — the ref, not a state updater, so it never doubles.
    if (focusRef.current !== index) selection();
    focusRef.current = index;
    setFocus(index);
    if (autoHide) hideTimer.current = setTimeout(hide, CALLOUT_HIDE_MS);
  };
  function hide() {
    focusRef.current = null;
    setFocus(null);
  }
  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  const nearest = (x: number) => {
    let best = 0;
    points.forEach((p, i) => {
      const bestPoint = points[best];
      if (bestPoint && Math.abs(p.x - x) < Math.abs(bestPoint.x - x)) best = i;
    });
    return best;
  };

  const scrub = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onBegin(e => show(nearest(e.x), false))
    .onUpdate(e => show(nearest(e.x), false))
    .onFinalize(() => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(hide, CALLOUT_HIDE_MS);
    });

  const focused = focus !== null ? points[focus] : undefined;
  const label = focus !== null ? labels[focus] : undefined;

  return (
    <GestureDetector gesture={scrub}>
      <View style={[StyleSheet.absoluteFill, { width, height }]}>
        {points.map((p, i) => (
          <Pressable
            key={p.frac}
            onPress={() => show(i, true)}
            accessibilityRole="button"
            accessibilityLabel={
              labels[i] ? `${labels[i]?.name}, ${labels[i]?.status}` : undefined
            }
            hitSlop={6}
            style={[styles.markerHit, { left: p.x - 20, top: p.y - 20 }]}
          />
        ))}
        {focused && label && (
          <ArcCallout
            key={focus}
            x={focused.x}
            y={focused.y}
            width={width}
            label={label}
          />
        )}
      </View>
    </GestureDetector>
  );
}

function ArcCallout({
  x,
  y,
  width,
  label,
}: {
  x: number;
  y: number;
  width: number;
  label: { name: string; done: boolean; status: string };
}) {
  const { c } = useLab();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withSpring(1, { damping: 15, stiffness: 320, mass: 0.6 });
  }, [p]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value),
    transform: [
      { translateY: (1 - p.value) * 6 },
      { scale: 0.88 + 0.12 * p.value },
    ],
  }));
  // Kept inside the arc's width so it never runs off the card.
  const left = Math.min(
    Math.max(x - CALLOUT_WIDTH / 2, -8),
    width - CALLOUT_WIDTH + 8
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.callout,
        { left, top: y - 62, backgroundColor: c.text, boxShadow: c.shadow },
        style,
      ]}
    >
      <Ionicons
        name={label.done ? 'checkmark-circle' : 'ellipse-outline'}
        size={15}
        color={label.done ? c.success : c.canvas}
        style={{ marginRight: 6 }}
      />
      <View style={{ flexShrink: 1 }}>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
          style={[
            typeStyle('caption', c.canvas),
            { fontFamily: labFonts.semibold },
          ]}
        >
          {label.name}
        </Text>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
          style={[typeStyle('caption', c.canvas), { opacity: 0.75 }]}
        >
          {label.status}
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * One habit's place on the day. Pure derivation from the sun's position — no
 * state: it lights up once the sun reaches it and swells briefly while the sun
 * passes, in both directions (unchecking dims it again).
 */
function ArcMarker({
  x,
  y,
  frac,
  count,
  sun,
  draw,
  faint,
}: {
  x: number;
  y: number;
  frac: number;
  count: number;
  sun: SharedValue<number>;
  draw: SharedValue<number>;
  faint: string;
}) {
  const shown = useDerivedValue(() =>
    Math.min(1, Math.max(0, (draw.value - frac + 0.05) * 6))
  );
  const idleOpacity = useDerivedValue(() => 0.55 * shown.value);
  const lit = useDerivedValue(() =>
    Math.min(1, Math.max(0, (sun.value - frac) * count * 6 + 1))
  );
  const r = useDerivedValue(
    () => 2.6 + 2.6 * Math.max(0, 1 - Math.abs(sun.value - frac) * count * 3)
  );
  return (
    <Group>
      <Circle cx={x} cy={y} r={2.6} color={faint} opacity={idleOpacity} />
      <Circle cx={x} cy={y} r={r} color="#FFFFFF" opacity={lit} />
    </Group>
  );
}

/** The day arc in miniature, for the compact header — driven by the same sun value. */
export function MiniArc({
  sun,
  sunColor,
}: {
  sun: SharedValue<number>;
  sunColor: string;
}) {
  const { c } = useLab();
  const width = 46;
  const height = 27;
  const radius = 17;
  const cx = width / 2;
  const cy = radius + 6;

  const arc = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(
      Skia.XYWHRect(cx - radius, cy - radius, radius * 2, radius * 2),
      180,
      180
    );
    return path;
  }, [cx, cy]);
  const sunX = useDerivedValue(
    () => cx + radius * Math.cos(Math.PI + Math.PI * sun.value)
  );
  const sunY = useDerivedValue(
    () => cy + radius * Math.sin(Math.PI + Math.PI * sun.value)
  );

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Path
        path={arc}
        style="stroke"
        strokeWidth={4}
        strokeCap="round"
        color={c.track}
      />
      <Path
        path={arc}
        style="stroke"
        strokeWidth={4}
        strokeCap="round"
        start={0}
        end={sun}
      >
        <SkiaLinearGradient
          start={vec(cx - radius, 0)}
          end={vec(cx + radius, 0)}
          colors={[...c.arcGradient]}
        />
      </Path>
      <Circle cx={sunX} cy={sunY} r={4.5} color={sunColor} />
    </Canvas>
  );
}

// ---------------------------------------------------------------------------
// CheckButton — springs in, with a haptic; the fill and tick only scale/fade
// ---------------------------------------------------------------------------

export function CheckButton({
  done,
  onToggle,
  label,
  tone = 'success',
}: {
  done: boolean;
  onToggle: () => void;
  label: string;
  /** Gold for a bonus check (a day that is not on the plan). */
  tone?: 'success' | 'reward';
}) {
  const { c } = useLab();
  const p = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    p.value = withSpring(done ? 1 : 0, labMotion.checkSpring);
  }, [done, p]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, p.value)),
    transform: [{ scale: 0.4 + 0.6 * p.value }],
  }));
  const tickStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, p.value)),
    transform: [{ scale: p.value }],
  }));

  return (
    <PressableScale
      haptic={null}
      pressScale={0.9}
      onPress={() => {
        impact(done ? ImpactFeedbackStyle.Light : ImpactFeedbackStyle.Medium);
        onToggle();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      style={styles.checkHit}
    >
      <View style={[styles.checkRing, { borderColor: c.textFaint }]}>
        <Animated.View
          style={[
            styles.checkFill,
            { backgroundColor: tone === 'reward' ? c.reward : c.success },
            fillStyle,
          ]}
        />
        <Animated.View style={tickStyle}>
          <Ionicons name="checkmark" size={19} color="#FFFFFF" />
        </Animated.View>
      </View>
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

export type ChipTone = 'primary' | 'reward' | 'flame' | 'success';

export function chipColors(c: LabPalette, tone: ChipTone) {
  return {
    bg: {
      primary: c.primarySoft,
      reward: c.rewardSoft,
      flame: c.flameSoft,
      success: c.successSoft,
    }[tone],
    fg: {
      primary: c.primary,
      reward: c.rewardText,
      flame: c.flame,
      success: c.successText,
    }[tone],
  };
}

export function Chip({
  icon,
  label,
  tone,
  children,
}: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  label?: string;
  tone: ChipTone;
  /** Custom content instead of `label` (e.g. a counting number). */
  children?: ReactNode;
}) {
  const { c } = useLab();
  const { bg, fg } = chipColors(c, tone);
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {icon && (
        <Ionicons name={icon} size={14} color={fg} style={{ marginRight: 6 }} />
      )}
      {children ?? (
        <Text
          maxFontSizeMultiplier={1.4}
          style={[typeStyle('caption', fg), { fontFamily: labFonts.semibold }]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

export function IconBadge({
  icon,
  color,
  size = 40,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: labRadius.sm,
        // 8-digit hex: the habit colour at ~13 % behind its own icon.
        backgroundColor: `${color}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useLab();
  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: c.border,
          alignSelf: 'stretch',
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  markerHit: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  callout: {
    position: 'absolute',
    width: CALLOUT_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.md,
    paddingVertical: labSpace.sm,
    borderRadius: labRadius.sm,
  },
  arcCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  burst: {
    position: 'absolute',
    width: BURST_SIZE,
    height: BURST_SIZE,
  },
  checkHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkFill: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 15,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.md,
    paddingVertical: 6,
    borderRadius: labRadius.pill,
  },
});
