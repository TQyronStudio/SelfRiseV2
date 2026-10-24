/**
 * XP you can see arrive (premium-design-plan.md, F1, kolo 9 — Petr's idea).
 *
 * Instead of the summary bar at the top ("2 habits completed +50 XP"), XP is born
 * where it was earned and travels home:
 *   - a "+25 XP" pops at the checkbox (or XP leaves the Continue button of a
 *     celebration), cracks into small golden sparks, and they fly into
 *   - the LEVEL BADGE pinned top-left on every screen: the level number with a ring
 *     that fills. Each spark that lands makes the badge "swallow" — a pulse, a
 *     glow, and the ring grows by that spark's share. Crossing the top of the
 *     ring = LEVEL UP: the ring closes, flashes, the number rolls to the next level.
 *
 * Rules (so this stays honest — technical-guides:Gamification-UI.md):
 * - XP is credited when the user confirms (the celebration's Continue), and the
 *   ring moves only as sparks land — what you see is what you got.
 * - Taking XP back (unchecking) sends no sparks; the ring just drains.
 * - XP from something that is not on screen starts from the middle of the screen.
 * - Several gains at once fly as several waves; every spark is counted once.
 * - Reduce motion: no flight — the ring simply moves and the badge pulses once.
 * - Performance: one Skia canvas for all sparks, mounted only while something
 *   flies; positions are pure functions of one clock per wave (UI thread). The
 *   level and the Home card re-render once per wave, not per spark.
 * - Mock state for the lab: starts 237 XP below the next level (real level curve
 *   from levelCalculation.ts), so a legendary achievement shows a level up.
 *
 * GOING LIVE (1:1) — only after decision R-10 (replaces the XP summary bar):
 * - Every XP source must report WHERE it was earned (window point); unknown →
 *   screen centre. Keep the batching/count rules of technical-guides:Gamification-UI.md.
 * - Measure exactly the 48×48 badge, convert to the spark layer's frame (lessons
 *   12–13); the ring reacts on the UI thread in the frame of the hit (lesson 14).
 * - Arc towards the target from the start, ~70 ms between hits, contrasting flash
 *   (lessons 15–16). XP credited on confirmation; taken-back XP flies nothing.
 */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  RadialGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { scheduleOnRN } from 'react-native-worklets';
import {
  notification,
  NotificationFeedbackType,
} from '@/src/services/hapticsService';
import {
  getXPProgress,
  getXPRequiredForLevel,
} from '@/src/services/levelCalculation';
import { PressableScale, typeStyle, useLab } from './labPrimitives';
import { labFonts, labRadius, labSpace } from './labTokens';
import { RollingNumber } from './RollingNumber';

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

/** Long enough apart that every hit on the ring reads as its own beat (kolo 11). */
const SPARK_STAGGER = 70;
/** Burst out (scatter) then get pulled in (accelerating) — "sucked into" the badge. */
const SPARK_DURATION = 860;
const SCATTER_SHARE = 0.24;
/** Radius of the badge's ring — sparks land on it, not in the middle. */
const BADGE_RING_R = 21;
const GOLD = '#FFD36B';
const GOLD_DEEP = '#F4A93F';
const SPARK_CORE = '#FFF6D6';

export const LAB_START_XP = getXPRequiredForLevel(17) - 237;

function sparkCount(amount: number) {
  // More XP = more sparks, but every spark must still be a distinct hit on the ring.
  if (amount >= 500) return 12;
  if (amount >= 200) return 10;
  if (amount >= 100) return 8;
  if (amount >= 50) return 6;
  return 5;
}

function ringProgressOf(xp: number) {
  return getXPProgress(xp).xpProgress / 100;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

interface SparkHit {
  value: number;
  /** Ring fill (0..1) right after this spark lands. */
  ringTo: number;
  levelUp: boolean;
}

interface Wave {
  id: number;
  from: Point;
  /** Badge centre. */
  to: Point;
  hits: SparkHit[];
  seed: number;
}

interface LabXp {
  /** XP the user can see (moves only when sparks land). Re-renders once per wave. */
  settledXp: number;
  level: number;
  ring: SharedValue<number>;
  pulse: SharedValue<number>;
  /** Where on the ring the last spark hit (radians) and its flash 0..1. */
  impactAngle: SharedValue<number>;
  impactFlash: SharedValue<number>;
  levelUpKey: number;
  /** Credit XP. `from` = where it was earned (window coordinates); omitted = screen centre. */
  award: (amount: number, from?: Point) => void;
  /** The badge hands over a way to measure itself — read when XP leaves, not at layout. */
  registerBadge: (measure: (done: (center: Point) => void) => void) => void;
}

const LabXpContext = createContext<LabXp | null>(null);

export function useLabXp(): LabXp {
  const ctx = useContext(LabXpContext);
  if (!ctx) throw new Error('useLabXp must be used inside LabXpProvider');
  return ctx;
}

export function LabXpProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const xpRef = useRef(LAB_START_XP);
  /** XP already promised to sparks still in the air (to precompute the ring per hit). */
  const inFlightXp = useRef(LAB_START_XP);
  const [settledXp, setSettledXp] = useState(LAB_START_XP);
  const [level, setLevel] = useState(getXPProgress(LAB_START_XP).currentLevel);
  const [levelUpKey, setLevelUpKey] = useState(0);
  const [waves, setWaves] = useState<Wave[]>([]);
  const ring = useSharedValue(ringProgressOf(LAB_START_XP));
  const pulse = useSharedValue(0);
  const impactAngle = useSharedValue(0);
  const impactFlash = useSharedValue(0);
  const badge = useRef<((done: (center: Point) => void) => void) | null>(null);
  /** An always-present, invisible copy of the spark layer's frame — to measure it. */
  const frameRef = useRef<View>(null);
  const nextId = useRef(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /** JS side of a landed spark: the numbers and the level (the visuals already happened). */
  const credit = useCallback((value: number, levelUp: boolean) => {
    xpRef.current += value;
    if (levelUp) {
      setLevel(getXPProgress(xpRef.current).currentLevel);
      setLevelUpKey(k => k + 1);
      notification(NotificationFeedbackType.Success);
    }
  }, []);

  /**
   * A spark hits the ring — runs on the UI thread in the very frame the spark
   * arrives, so the ring answers every single hit, exactly in time.
   */
  const onHit = useCallback(
    (angle: number, ringTo: number, levelUp: boolean, value: number) => {
      'worklet';
      impactAngle.value = angle;
      impactFlash.value = withSequence(
        withTiming(1, { duration: 30 }),
        withTiming(0, { duration: 230, easing: Easing.out(Easing.quad) })
      );
      pulse.value = withSequence(
        withTiming(1, { duration: 50 }),
        withSpring(0, { damping: 11, stiffness: 260 })
      );
      if (levelUp) {
        ring.value = withSequence(
          withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
          withDelay(
            240,
            withTiming(ringTo, {
              duration: 380,
              easing: Easing.out(Easing.cubic),
            })
          )
        );
      } else {
        ring.value = withTiming(ringTo, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
        });
      }
      scheduleOnRN(credit, value, levelUp);
    },
    [impactAngle, impactFlash, pulse, ring, credit]
  );

  /** No flight (taking XP back, reduce motion): the ring just moves. */
  const landDirectly = useCallback(
    (delta: number) => {
      const before = getXPProgress(xpRef.current).currentLevel;
      xpRef.current += delta;
      inFlightXp.current += delta;
      const after = getXPProgress(xpRef.current).currentLevel;
      ring.value = withTiming(ringProgressOf(xpRef.current), { duration: 320 });
      if (after !== before) {
        setLevel(after);
        if (after > before) setLevelUpKey(k => k + 1);
      }
      if (delta > 0) {
        pulse.value = withSequence(
          withTiming(1, { duration: 60 }),
          withSpring(0)
        );
      }
      setSettledXp(xpRef.current);
    },
    [ring, pulse]
  );

  const launch = useCallback(
    (amount: number, target: Point, from?: Point) => {
      const count = sparkCount(amount);
      const id = nextId.current++;
      const origin = from ?? { x: width / 2, y: height / 2 };
      // Each spark carries its share; the ring value after each hit is known now.
      const share = Math.floor(amount / count);
      const hits: SparkHit[] = [];
      for (let i = 0; i < count; i++) {
        const value = i === count - 1 ? amount - share * (count - 1) : share;
        const before = getXPProgress(inFlightXp.current).currentLevel;
        inFlightXp.current += value;
        const after = getXPProgress(inFlightXp.current).currentLevel;
        hits.push({
          value,
          ringTo: ringProgressOf(inFlightXp.current),
          levelUp: after > before,
        });
      }
      setWaves(prev => [
        ...prev,
        { id, from: origin, to: target, hits, seed: id * 7.31 },
      ]);
      const end = (count - 1) * SPARK_STAGGER + SPARK_DURATION + 120;
      timers.current.push(
        setTimeout(() => {
          setWaves(prev => prev.filter(w => w.id !== id));
          setSettledXp(xpRef.current);
        }, end)
      );
    },
    [width, height]
  );

  const award = useCallback(
    (amount: number, from?: Point) => {
      if (amount === 0) return;
      const measureBadge = badge.current;
      if (amount < 0 || reducedMotion || !measureBadge) {
        landDirectly(amount);
        return;
      }
      // Badge, source and the spark layer are all measured in window coordinates;
      // subtracting the layer's own origin puts them in the canvas' frame, whatever
      // sits above it (status bar, navigation chrome).
      measureBadge(target => {
        const frame = frameRef.current;
        if (!frame) {
          launch(amount, target, from);
          return;
        }
        frame.measureInWindow((ox, oy) => {
          const toLayer = (p: Point) => ({ x: p.x - ox, y: p.y - oy });
          launch(amount, toLayer(target), from ? toLayer(from) : undefined);
        });
      });
    },
    [landDirectly, reducedMotion, launch]
  );

  const registerBadge = useCallback(
    (measure: (done: (center: Point) => void) => void) => {
      badge.current = measure;
    },
    []
  );

  const value = useMemo(
    () => ({
      settledXp,
      level,
      ring,
      pulse,
      impactAngle,
      impactFlash,
      levelUpKey,
      award,
      registerBadge,
    }),
    [
      settledXp,
      level,
      ring,
      pulse,
      impactAngle,
      impactFlash,
      levelUpKey,
      award,
      registerBadge,
    ]
  );

  return (
    <LabXpContext.Provider value={value}>
      {children}
      <View
        ref={frameRef}
        collapsable={false}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {waves.length > 0 && (
        // Skia's canvas does not see React context — everything goes in as props.
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {waves.map(w => (
            <SparkWave key={w.id} wave={w} onHit={onHit} />
          ))}
        </Canvas>
      )}
    </LabXpContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Sparks
// ---------------------------------------------------------------------------

/** Deterministic pseudo-random in [0, 1) — every spark of a wave gets its own path. */
function rand(seed: number) {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

type HitFn = (
  angle: number,
  ringTo: number,
  levelUp: boolean,
  value: number
) => void;

function SparkWave({ wave, onHit }: { wave: Wave; onHit: HitFn }) {
  const total = (wave.hits.length - 1) * SPARK_STAGGER + SPARK_DURATION;
  const clock = useSharedValue(0);
  useEffect(() => {
    clock.value = withTiming(1, { duration: total, easing: Easing.linear });
  }, [clock, total]);

  const paths = useMemo(
    () =>
      wave.hits.map((hit, i) => {
        const angle = rand(wave.seed + i) * Math.PI * 2;
        const reach = 22 + rand(wave.seed + i * 3.1) * 30;
        const scatter = {
          x: wave.from.x + Math.cos(angle) * reach,
          y: wave.from.y + Math.sin(angle) * reach,
        };
        // A soft arc that heads for the badge from the first moment: the bend sits
        // beside the straight line from the burst to the badge (a sheaf of arcs,
        // mostly bowing to one side). Kolo 11: before, the bend sat near the badge's
        // height, so long flights read as "straight up" and turned only at the end.
        const dx = wave.to.x - scatter.x;
        const dy = wave.to.y - scatter.y;
        const dist = Math.hypot(dx, dy) || 1;
        const bow =
          (0.12 + 0.22 * rand(wave.seed + i * 5.7)) *
          (rand(wave.seed + i * 2.3) < 0.8 ? 1 : -1);
        const control = {
          x: scatter.x + dx * 0.5 + (-dy / dist) * dist * bow,
          y: scatter.y + dy * 0.5 + (dx / dist) * dist * bow,
        };
        // It lands ON the ring, on the side it arrives from (with a little spread).
        const incoming =
          Math.atan2(control.y - wave.to.y, control.x - wave.to.x) +
          (rand(wave.seed + i * 4.4) - 0.5) * 0.9;
        const impact = {
          x: wave.to.x + Math.cos(incoming) * BADGE_RING_R,
          y: wave.to.y + Math.sin(incoming) * BADGE_RING_R,
        };
        return {
          scatter,
          control,
          impact,
          incoming,
          hit,
          delay: i * SPARK_STAGGER,
          size: 0.8 + rand(wave.seed + i * 9.1) * 0.5,
        };
      }),
    [wave]
  );

  return (
    <Group>
      {paths.map((p, i) => (
        <Spark
          key={i}
          clock={clock}
          total={total}
          delay={p.delay}
          from={wave.from}
          scatter={p.scatter}
          control={p.control}
          to={p.impact}
          size={p.size}
          onArrive={onHit}
          arrival={[p.incoming, p.hit.ringTo, p.hit.levelUp, p.hit.value]}
        />
      ))}
    </Group>
  );
}

function Spark({
  clock,
  total,
  delay,
  from,
  scatter,
  control,
  to,
  size,
  onArrive,
  arrival,
}: {
  clock: SharedValue<number>;
  total: number;
  delay: number;
  from: Point;
  scatter: Point;
  control: Point;
  to: Point;
  size: number;
  onArrive: HitFn;
  arrival: [number, number, boolean, number];
}) {
  // Position at local progress q (0..1): burst out, then a bezier dive, accelerating.
  const at = (q: number) => {
    'worklet';
    if (q <= 0) return { x: from.x, y: from.y };
    if (q < SCATTER_SHARE) {
      const s = 1 - Math.pow(1 - q / SCATTER_SHARE, 3);
      return {
        x: from.x + (scatter.x - from.x) * s,
        y: from.y + (scatter.y - from.y) * s,
      };
    }
    const u = Math.min(1, (q - SCATTER_SHARE) / (1 - SCATTER_SHARE));
    // Mild acceleration: the whole arc is visible, and it still arrives with a hit.
    const e = Math.pow(u, 1.35);
    const a = 1 - e;
    return {
      x: a * a * scatter.x + 2 * a * e * control.x + e * e * to.x,
      y: a * a * scatter.y + 2 * a * e * control.y + e * e * to.y,
    };
  };
  const local = useDerivedValue(() =>
    Math.min(1, Math.max(0, (clock.value * total - delay) / SPARK_DURATION))
  );

  // The hit: fired once, on the UI thread, in the frame the spark reaches the ring.
  const [angle, ringTo, levelUp, value] = arrival;
  useAnimatedReaction(
    () => local.value >= 1,
    (arrived, wasArrived) => {
      if (arrived && !wasArrived) onArrive(angle, ringTo, levelUp, value);
    }
  );

  const head = useDerivedValue(() => at(local.value));
  const trail1 = useDerivedValue(() => at(local.value - 0.05));
  const trail2 = useDerivedValue(() => at(local.value - 0.1));
  const visible = useDerivedValue(() =>
    local.value <= 0 || local.value >= 1 ? 0 : 1
  );
  const headX = useDerivedValue(() => head.value.x);
  const headY = useDerivedValue(() => head.value.y);
  const t1x = useDerivedValue(() => trail1.value.x);
  const t1y = useDerivedValue(() => trail1.value.y);
  const t2x = useDerivedValue(() => trail2.value.x);
  const t2y = useDerivedValue(() => trail2.value.y);
  const glowC = useDerivedValue(() => ({ x: head.value.x, y: head.value.y }));

  return (
    <Group opacity={visible}>
      <Circle cx={t2x} cy={t2y} r={1.6 * size} color={GOLD} opacity={0.35} />
      <Circle cx={t1x} cy={t1y} r={2.3 * size} color={GOLD} opacity={0.6} />
      <Circle cx={headX} cy={headY} r={13 * size}>
        <RadialGradient
          c={glowC}
          r={13 * size}
          colors={[`${GOLD}CC`, `${GOLD}00`]}
        />
      </Circle>
      <Circle cx={headX} cy={headY} r={4.2 * size} color={SPARK_CORE} />
    </Group>
  );
}

// ---------------------------------------------------------------------------
// The level badge — pinned top-left on every screen
// ---------------------------------------------------------------------------

const BADGE = 48;
const BADGE_CANVAS = 76;

export function LevelBadge() {
  const { c, mode } = useLab();
  // The hit must read on a white badge too: deep gold in light mode, bright gold in dark.
  const hitColor = mode === 'light' ? '#EE8A12' : '#FFE08A';
  const {
    level,
    ring,
    pulse,
    impactAngle,
    impactFlash,
    levelUpKey,
    registerBadge,
  } = useLabXp();
  const ref = useRef<View>(null);

  const center = BADGE_CANVAS / 2;
  const ringPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(
      Skia.XYWHRect(
        center - BADGE_RING_R,
        center - BADGE_RING_R,
        BADGE_RING_R * 2,
        BADGE_RING_R * 2
      ),
      -90,
      359.9
    );
    return p;
  }, [center]);

  // A spark's hit: that piece of the ring lights up for a moment (rotated to the hit).
  const impactArc = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(
      Skia.XYWHRect(
        center - BADGE_RING_R,
        center - BADGE_RING_R,
        BADGE_RING_R * 2,
        BADGE_RING_R * 2
      ),
      -26,
      52
    );
    return p;
  }, [center]);
  const impactTransform = useDerivedValue(() => [
    { rotate: impactAngle.value },
  ]);

  // Level up: a flash on the ring and a ring of sparks.
  const flash = useSharedValue(0);
  useEffect(() => {
    if (levelUpKey === 0) return;
    flash.value = 0;
    flash.value = withDelay(
      160,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, [levelUpKey, flash]);

  const glowR = useDerivedValue(
    () =>
      26 +
      10 * pulse.value +
      14 * (flash.value > 0 && flash.value < 1 ? 1 - flash.value : 0)
  );
  const glowOpacity = useDerivedValue(
    () =>
      0.18 +
      0.55 * pulse.value +
      (flash.value > 0 && flash.value < 1 ? 0.8 * (1 - flash.value) : 0)
  );
  const burstTransform = useDerivedValue(() => [
    { scale: 0.6 + 0.9 * flash.value },
  ]);
  const burstOpacity = useDerivedValue(() =>
    flash.value <= 0 || flash.value >= 1 ? 0 : 1 - flash.value
  );
  const sparks = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return { x: center + Math.cos(a) * 30, y: center + Math.sin(a) * 30 };
      }),
    [center]
  );

  // Each hit swells the badge and knocks it a little away from where the spark came in.
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -Math.cos(impactAngle.value) * 3 * impactFlash.value },
      { translateY: -Math.sin(impactAngle.value) * 3 * impactFlash.value },
      { scale: 1 + 0.18 * pulse.value },
    ],
  }));
  // A ripple spreads from the point of impact while the flash fades — it soaks in.
  const rippleR = useDerivedValue(() => 4 + 11 * (1 - impactFlash.value));

  return (
    <View style={styles.badgeBox} pointerEvents="box-none">
      {/* Measure THIS (48×48), not the row: the row also holds the hidden "LEVEL UP"
          tag, which pushed the measured centre ~70 px to the right — sparks missed
          the ring by exactly that (kolo 12). */}
      <View
        ref={ref}
        collapsable={false}
        onLayout={() => {
          registerBadge(done =>
            ref.current?.measureInWindow((x, y, w, h) =>
              done({ x: x + w / 2, y: y + h / 2 })
            )
          );
        }}
      >
        <PressableScale
          accessibilityLabel={`Level ${level}`}
          pressScale={0.92}
          style={styles.badgeHit}
        >
          <Animated.View style={[styles.badgeBody, bodyStyle]}>
            <Canvas style={styles.badgeCanvas} pointerEvents="none">
              <Circle cx={center} cy={center} r={glowR} opacity={glowOpacity}>
                <RadialGradient
                  c={vec(center, center)}
                  r={glowR}
                  colors={[GOLD, `${GOLD}00`]}
                />
              </Circle>
              <Circle
                cx={center}
                cy={center}
                r={BADGE / 2 - 2}
                color={c.surface}
              />
              <Circle
                cx={center}
                cy={center}
                r={BADGE_RING_R}
                style="stroke"
                strokeWidth={4}
                color={c.track}
              />
              <Path
                path={ringPath}
                style="stroke"
                strokeWidth={4}
                strokeCap="round"
                start={0}
                end={ring}
              >
                <SkiaLinearGradient
                  start={vec(center - BADGE_RING_R, 0)}
                  end={vec(center + BADGE_RING_R, 0)}
                  colors={[GOLD, GOLD_DEEP]}
                />
              </Path>
              <Group
                transform={impactTransform}
                origin={vec(center, center)}
                opacity={impactFlash}
              >
                <Circle cx={center + BADGE_RING_R} cy={center} r={14}>
                  <RadialGradient
                    c={vec(center + BADGE_RING_R, center)}
                    r={14}
                    colors={[hitColor, `${GOLD}00`]}
                  />
                </Circle>
                <Path
                  path={impactArc}
                  style="stroke"
                  strokeWidth={6}
                  strokeCap="round"
                  color={hitColor}
                />
                <Circle
                  cx={center + BADGE_RING_R}
                  cy={center}
                  r={rippleR}
                  style="stroke"
                  strokeWidth={1.6}
                  color={hitColor}
                />
              </Group>
              <Group
                transform={burstTransform}
                origin={vec(center, center)}
                opacity={burstOpacity}
              >
                {sparks.map((s, i) => (
                  <Circle
                    key={i}
                    cx={s.x}
                    cy={s.y}
                    r={2.4}
                    color={i % 2 ? GOLD : SPARK_CORE}
                  />
                ))}
              </Group>
            </Canvas>
            <View style={styles.badgeNumber} pointerEvents="none">
              <RollingNumber
                text={`${level}`}
                variant="bodyStrong"
                style={{ fontFamily: labFonts.bold, color: c.text }}
              />
            </View>
          </Animated.View>
        </PressableScale>
      </View>
      <LevelUpTag levelUpKey={levelUpKey} level={level} />
    </View>
  );
}

/** "LEVEL UP · 17" slides out of the badge for a moment after a level up. */
function LevelUpTag({
  levelUpKey,
  level,
}: {
  levelUpKey: number;
  level: number;
}) {
  const { c } = useLab();
  const p = useSharedValue(0);
  useEffect(() => {
    if (levelUpKey === 0) return;
    p.value = withSequence(
      withDelay(300, withSpring(1, { damping: 14, stiffness: 200 })),
      withDelay(1700, withTiming(0, { duration: 260 }))
    );
  }, [levelUpKey, p]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value),
    transform: [
      { translateX: (1 - p.value) * -16 },
      { scale: 0.9 + 0.1 * p.value },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.tag, { backgroundColor: c.text }, style]}
    >
      <Text
        maxFontSizeMultiplier={1.3}
        style={[typeStyle('overline', c.canvas), { letterSpacing: 1.4 }]}
      >
        {`LEVEL UP · ${level}`}
      </Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// "+25 XP" pop at the place it was earned
// ---------------------------------------------------------------------------

/**
 * Pops above a control, holds a beat, then cracks open (the sparks take over).
 * A negative amount drifts up and fades — nothing flies for XP taken back.
 */
export function XpPop({
  amount,
  onCrack,
}: {
  amount: number;
  onCrack?: () => void;
}) {
  const { c } = useLab();
  const p = useSharedValue(0);
  const positive = amount > 0;
  useEffect(() => {
    if (positive) {
      p.value = withSequence(
        withSpring(1, { damping: 11, stiffness: 320, mass: 0.6 }),
        withDelay(
          240,
          withTiming(2, { duration: 170, easing: Easing.out(Easing.quad) })
        )
      );
      const id = setTimeout(() => onCrack?.(), 420);
      return () => clearTimeout(id);
    }
    p.value = withSequence(
      withTiming(1, { duration: 180 }),
      withDelay(380, withTiming(2, { duration: 260 }))
    );
    return undefined;
    // One pop per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => {
    const inP = Math.min(1, p.value);
    const outP = Math.max(0, p.value - 1);
    return {
      opacity: inP * (1 - outP),
      transform: [
        { translateY: (1 - inP) * 8 - (positive ? 0 : 10 * outP) },
        { scale: (0.6 + 0.4 * inP) * (positive ? 1 + 0.35 * outP : 1) },
      ],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pop,
        {
          backgroundColor: positive ? c.rewardSoft : c.surfaceRaised,
          borderColor: positive ? `${GOLD}66` : c.border,
        },
        style,
      ]}
    >
      <Text
        maxFontSizeMultiplier={1.3}
        style={[
          typeStyle('caption', positive ? c.rewardText : c.textMuted),
          { fontFamily: labFonts.bold },
        ]}
      >
        {`${positive ? '+' : '−'}${Math.abs(amount)} XP`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeHit: {
    width: BADGE,
    height: BADGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBody: {
    width: BADGE,
    height: BADGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCanvas: {
    position: 'absolute',
    width: BADGE_CANVAS,
    height: BADGE_CANVAS,
    left: (BADGE - BADGE_CANVAS) / 2,
    top: (BADGE - BADGE_CANVAS) / 2,
  },
  badgeNumber: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    marginLeft: labSpace.sm,
    paddingHorizontal: labSpace.md,
    paddingVertical: 5,
    borderRadius: labRadius.pill,
  },
  pop: {
    paddingHorizontal: labSpace.sm,
    paddingVertical: 3,
    borderRadius: labRadius.pill,
    borderWidth: 1,
  },
});
