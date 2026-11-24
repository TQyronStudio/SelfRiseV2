/**
 * XP you can see arrive (migration E7 part 2, R-10; from the Design Lab's
 * xpFlight.tsx). Replaces the XP summary bar and the old popups.
 *
 * The app credits XP AT ONCE in storage (GamificationService — untouched). This
 * layer only SHOWS it: the level badge top-left draws a DISPLAYED amount that
 * catches up as golden sparks land in its ring. The books are xpLedger.ts:
 *     shown + in flight + held = the real total.
 *
 * - A gain (`xpGained`) flies from where it was earned (xpOriginRegistry — the
 *   screen registered its control) or from the centre; a "+N XP" pops there first.
 * - The XP of a moment (trophy, finished goal / challenge, journal streak, the
 *   milestone part of a ⭐🔥👑 entry) is HELD and flies when its window closes
 *   (heldMoments.ts; the old windows until E10) — or after 2 s if no such window
 *   is queued (xpLedger.expireHeld).
 * - Taken-back XP flies nothing: the ring just drains.
 * - Reduced motion, a hidden badge (not a tab, onboarding, an open sheet or
 *   detail): nothing flies; flights wait for the badge, reduced motion lands at once.
 * - HONEST ALWAYS: when nothing is in the air or held, the shown amount is
 *   compared with the stored total and snapped to it (XP credited without an
 *   event, e.g. trophies of the batch check, never leaves the badge behind).
 * - At start and back from the background: shown = real, nothing in the air.
 * - One Skia canvas for all sparks, mounted only while something flies; the ring
 *   reacts on the UI thread in the frame of the hit (P14).
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
import {
  Animated as RNAnimated,
  AccessibilityInfo,
  AppState,
  DeviceEventEmitter,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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
  ZoomIn,
  ZoomOut,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useModalQueue } from '@/src/contexts/ModalQueueContext';
import { useTutorial } from '@/src/contexts/TutorialContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fixed, fonts, radius, rarity, space, withAlpha } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { GamificationService } from '@/src/services/gamificationService';
import { getXPProgress } from '@/src/services/levelCalculation';
import { addAppEventListener } from '@/src/utils/appEvents';
import { contentColumn } from '@/src/utils/layout';
import {
  displayedXP,
  expireHeld,
  Flight,
  HOLD_FALLBACK_MS,
  landFlight,
  LedgerState,
  ledgerTotal,
  receiveGain,
  releaseHeld,
  syncLedger,
} from '@/src/services/xpDisplay/xpLedger';
import { takeMomentOrigin, takeXpOrigin, XpOriginPoint } from '@/src/services/xpDisplay/xpOriginRegistry';
import { pendingHoldKinds, releasedKind } from '@/src/services/xpDisplay/heldMoments';
import { listenTrophyNotes } from '@/src/services/moments/noteBus';
import { PressableScale, typeStyle, useOverlayCovered, RollingNumber } from '@/src/components/ui';
import { TOP_ROW_HEIGHT } from '@/src/components/ui/TopRow';
import { useBadgeMark } from './useBadgeMark';

// ---------------------------------------------------------------------------
// Tunables (the lab's, kolo 9–27)
// ---------------------------------------------------------------------------

/** Long enough apart that every hit on the ring reads as its own beat (kolo 11). */
const SPARK_STAGGER = 70;
const SPARK_DURATION = 860;
const SCATTER_SHARE = 0.24;
/** Radius of the badge's ring — sparks land on it, not in the middle. */
const BADGE_RING_R = 21;
const [GOLD, GOLD_DEEP] = fixed.gold;
/** "+N XP" holds a beat at its place before it cracks into sparks. */
const POP_MS = 420;
/** Quiet time after the last gain before the shown amount is checked against storage. */
const RECONCILE_MS = 2500;

function sparkCount(amount: number) {
  if (amount >= 500) return 12;
  if (amount >= 200) return 10;
  if (amount >= 100) return 8;
  if (amount >= 50) return 6;
  return 5;
}

function ringOf(xp: number) {
  return getXPProgress(Math.max(0, xp)).xpProgress / 100;
}
function levelOf(xp: number) {
  return getXPProgress(Math.max(0, xp)).currentLevel;
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
  ringTo: number;
  levelUp: boolean;
}
interface Wave {
  id: number;
  flightId: number;
  from: Point;
  to: Point;
  hits: SparkHit[];
  seed: number;
}
interface Pop {
  id: number;
  at: Point;
  amount: number;
}

interface XpDisplay {
  level: number;
  ring: SharedValue<number>;
  pulse: SharedValue<number>;
  bodyX: RNAnimated.Value;
  bodyY: RNAnimated.Value;
  bodyScale: RNAnimated.Value;
  impactAngle: SharedValue<number>;
  impactFlash: SharedValue<number>;
  levelUpKey: number;
  /** The badge hands over a way to measure itself (null = it is gone). */
  registerBadge: (measure: ((done: (center: Point) => void) => void) | null) => void;
  /** The badge layer says whether the badge can be seen. */
  setBadgeVisible: (visible: boolean) => void;
}

const XpDisplayContext = createContext<XpDisplay | null>(null);

/** A quiet trophy note (E8): what one action unlocked, common / rare only. */
export interface TrophyNoteData {
  id: number;
  items: { id: string; rarity: string; icon: string; nameKey: string }[];
  /** XP the note stands for (what was credited). */
  xp: number;
  boost?: { factor: string; hours: number } | undefined;
}
interface MomentNotes {
  showTrophyNote: (note: Omit<TrophyNoteData, 'id'>) => void;
  noteDone: (point: XpOriginPoint | null) => void;
  current: TrophyNoteData | null;
  /** A window of the queue is up: notes wait. */
  windowUp: boolean;
}
const MomentNotesContext = createContext<MomentNotes | null>(null);

/** Queue a quiet trophy note (AchievementContext's batch collector). */
export function useMomentNotes(): MomentNotes {
  const ctx = useContext(MomentNotesContext);
  if (!ctx) throw new Error('useMomentNotes must be used inside XpDisplayProvider');
  return ctx;
}

export function useXpDisplay(): XpDisplay {
  const ctx = useContext(XpDisplayContext);
  if (!ctx) throw new Error('useXpDisplay must be used inside XpDisplayProvider');
  return ctx;
}

export function XpDisplayProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const { queuedTypes } = useModalQueue();

  const ledger = useRef<LedgerState>(syncLedger(0));
  const ready = useRef(false);
  /** Flights already sent into the air (by ledger flight id). */
  const launched = useRef(new Set<number>());
  /** Where each flight starts (window coordinates); absent = the centre. */
  const origins = useRef(new Map<number, XpOriginPoint>());
  /** Origins that need no "+N XP" pop (a moment already shows its number). */
  const quietOrigins = useRef(new Set<number>());
  /** XP the ring will show once every launched spark has landed. */
  const ringXp = useRef(0);
  const [level, setLevel] = useState(1);
  const [levelUpKey, setLevelUpKey] = useState(0);
  const [waves, setWaves] = useState<Wave[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const ring = useSharedValue(0);
  const pulse = useSharedValue(0);
  const impactAngle = useSharedValue(0);
  const impactFlash = useSharedValue(0);
  const badge = useRef<((done: (center: Point) => void) => void) | null>(null);
  const badgeVisible = useRef(false);
  const frameRef = useRef<View>(null);
  const nextId = useRef(1);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  /** Bumped by every sync: a timer from before it must not touch the fresh books. */
  const generation = useRef(0);
  const later = useCallback((fn: () => void, ms: number) => {
    const born = generation.current;
    const id = setTimeout(() => {
      timers.current.delete(id);
      if (born === generation.current) fn();
    }, ms);
    timers.current.add(id);
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const bodyX = useRef(new RNAnimated.Value(0)).current;
  const bodyY = useRef(new RNAnimated.Value(0)).current;
  const bodyScale = useRef(new RNAnimated.Value(1)).current;

  /** Shows the ledger's displayed amount at once (no flight). */
  const showDirect = useCallback(
    (bump: boolean) => {
      const shown = displayedXP(ledger.current);
      const before = levelOf(ringXp.current);
      ringXp.current = shown;
      ring.value = withTiming(ringOf(shown), { duration: 320 });
      const after = levelOf(shown);
      setLevel(after);
      if (after > before && ready.current) setLevelUpKey(k => k + 1);
      if (bump) pulse.value = withSequence(withTiming(1, { duration: 60 }), withSpring(0));
    },
    [ring, pulse]
  );

  // --- Sync with storage (start, foreground, idle) --------------------------------
  const sync = useCallback(async () => {
    const real = await GamificationService.getTotalXP();
    generation.current++;
    ledger.current = syncLedger(real);
    launched.current.clear();
    origins.current.clear();
    setWaves([]);
    setPops([]);
    ringXp.current = real;
    ring.value = ringOf(real);
    setLevel(levelOf(real));
    ready.current = true;
  }, [ring]);
  useEffect(() => {
    void sync();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') void sync();
    });
    return () => sub.remove();
  }, [sync]);

  // --- Landing -----------------------------------------------------------------------
  const credit = useCallback(
    (levelUp: boolean, angle: number) => {
      const knock = (node: RNAnimated.Value, to: number) =>
        RNAnimated.sequence([
          RNAnimated.timing(node, { toValue: to, duration: 30, useNativeDriver: true }),
          RNAnimated.timing(node, { toValue: 0, duration: 230, useNativeDriver: true }),
        ]).start();
      knock(bodyX, -Math.cos(angle) * 3);
      knock(bodyY, -Math.sin(angle) * 3);
      RNAnimated.sequence([
        RNAnimated.timing(bodyScale, { toValue: 1.18, duration: 50, useNativeDriver: true }),
        RNAnimated.spring(bodyScale, { toValue: 1, damping: 11, stiffness: 260, useNativeDriver: true }),
      ]).start();
      if (levelUp) {
        setLevel(l => l + 1);
        setLevelUpKey(k => k + 1);
        feel('levelUp');
      }
    },
    [bodyX, bodyY, bodyScale]
  );

  const onHit = useCallback(
    (angle: number, ringTo: number, levelUp: boolean) => {
      'worklet';
      impactAngle.value = angle;
      impactFlash.value = withSequence(
        withTiming(1, { duration: 30 }),
        withTiming(0, { duration: 230, easing: Easing.out(Easing.quad) })
      );
      pulse.value = withSequence(withTiming(1, { duration: 50 }), withSpring(0, { damping: 11, stiffness: 260 }));
      ring.value = levelUp
        ? withSequence(
            withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 0 }),
            withDelay(240, withTiming(ringTo, { duration: 380, easing: Easing.out(Easing.cubic) }))
          )
        : withTiming(ringTo, { duration: 180, easing: Easing.out(Easing.cubic) });
      scheduleOnRN(credit, levelUp, angle);
    },
    [impactAngle, impactFlash, pulse, ring, credit]
  );

  // --- Launching ----------------------------------------------------------------------
  const launchWave = useCallback(
    (flight: Flight, to: Point, from: Point) => {
      const count = sparkCount(flight.amount);
      const share = Math.floor(flight.amount / count);
      const hits: SparkHit[] = [];
      for (let i = 0; i < count; i++) {
        const value = i === count - 1 ? flight.amount - share * (count - 1) : share;
        const before = levelOf(ringXp.current);
        ringXp.current += value;
        hits.push({ value, ringTo: ringOf(ringXp.current), levelUp: levelOf(ringXp.current) > before });
      }
      const id = nextId.current++;
      setWaves(prev => [...prev, { id, flightId: flight.id, from, to, hits, seed: id * 7.31 }]);
      later(() => {
        setWaves(prev => prev.filter(w => w.id !== id));
        ledger.current = landFlight(ledger.current, flight.id);
        launched.current.delete(flight.id);
        // The last spark is home: ring and level follow the books exactly (a gain
        // taken back while sparks were flying is settled here, not mid-flight).
        if (launched.current.size === 0) showDirect(false);
      }, (count - 1) * SPARK_STAGGER + SPARK_DURATION + 120);
    },
    [later, showDirect]
  );

  /** Sends every flight that waits into the air — when the badge can be seen. */
  const pump = useCallback(() => {
    if (!ready.current) return;
    const waiting = ledger.current.flights.filter(f => !launched.current.has(f.id));
    if (waiting.length === 0) return;
    if (reducedMotion) {
      for (const f of waiting) ledger.current = landFlight(ledger.current, f.id);
      origins.current.clear();
      showDirect(true);
      return;
    }
    const measure = badge.current;
    if (!badgeVisible.current || !measure) return; // they wait for the badge
    for (const f of waiting) launched.current.add(f.id);
    measure(target => {
      const frame = frameRef.current;
      const go = (ox: number, oy: number) => {
        const toLayer = (p: Point) => ({ x: p.x - ox, y: p.y - oy });
        for (const f of waiting) {
          const origin = origins.current.get(f.id);
          origins.current.delete(f.id);
          const quiet = quietOrigins.current.delete(f.id);
          const from = origin ? toLayer(origin) : { x: width / 2, y: height / 2 };
          if (origin && !quiet) {
            const popId = nextId.current++;
            setPops(prev => [...prev, { id: popId, at: from, amount: f.amount }]);
            later(() => setPops(prev => prev.filter(p => p.id !== popId)), POP_MS + 400);
            later(() => launchWave(f, toLayer(target), from), POP_MS);
          } else {
            launchWave(f, toLayer(target), from);
          }
        }
      };
      if (frame) frame.measureInWindow((ox, oy) => go(ox, oy));
      else go(0, 0);
    });
  }, [reducedMotion, showDirect, width, height, later, launchWave]);

  // --- Honest: snap to storage when idle ---------------------------------------------
  const reconcileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconcile = useCallback(() => {
    if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
    reconcileTimer.current = setTimeout(async () => {
      const l = ledger.current;
      // Not while sparks fly, XP is held, or a moment is waiting / on screen (its XP
      // flies when it ends — sync XP without an event then flies from there too).
      if (!ready.current || l.flights.length > 0 || l.held.length > 0 || pendingRef.current.size > 0) {
        return reconcile();
      }
      const real = await GamificationService.getTotalXP();
      const diff = real - ledgerTotal(ledger.current);
      if (diff === 0) return;
      ledger.current = receiveGain(ledger.current, { amount: diff, source: 'reconcile' }, Date.now(), false);
      if (diff < 0) showDirect(false);
      else pump();
    }, RECONCILE_MS);
  }, [pump, showDirect]);
  useEffect(() => () => {
    if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
  }, []);
  const reconcileRef = useRef(reconcile);
  reconcileRef.current = reconcile;

  // --- Gains --------------------------------------------------------------------------
  useEffect(() => {
    const sub = addAppEventListener('xpGained', event => {
      if (!ready.current || !event || !event.amount) return;
      const gain = {
        amount: event.amount,
        source: event.source,
        sourceId: event.sourceId,
        metadata: event.metadata,
      };
      const origin = takeXpOrigin(gain);
      const before = ledger.current.nextId;
      ledger.current = receiveGain(ledger.current, gain, Date.now(), !!origin);
      if (event.amount < 0) {
        // Sparks in the air carry ring values baked at launch: moving the ring now
        // would be overwritten by them. Book the loss and settle when they land.
        if (launched.current.size > 0) ringXp.current += event.amount;
        else showDirect(false);
      } else if (origin) {
        // The part that flies now starts at the control (the held part, later, at the centre).
        for (const f of ledger.current.flights) {
          if (f.id >= before && f.from === 'action') origins.current.set(f.id, origin);
        }
      }
      pump();
      reconcile();
    });
    const levelSub = addAppEventListener('levelUp', () => reconcile());
    return () => {
      sub.remove();
      levelSub.remove();
    };
  }, [pump, reconcile, showDirect]);

  // --- Held XP: released when its window closes, or after 2 s without one ----------------
  const head = queuedTypes[0] ?? null;
  const lastHead = useRef(head);
  const lastLength = useRef(queuedTypes.length);
  useEffect(() => {
    const closedSameAgain = head === lastHead.current && queuedTypes.length < lastLength.current;
    const kind = releasedKind(lastHead.current, head, closedSameAgain);
    lastHead.current = head;
    lastLength.current = queuedTypes.length;
    if (kind) {
      const before = ledger.current.nextId;
      ledger.current = releaseHeld(ledger.current, kind);
      // The window said where its XP leaves from (its Continue button).
      const point = takeMomentOrigin(kind);
      if (point) {
        for (const f of ledger.current.flights) {
          if (f.id >= before) {
            origins.current.set(f.id, point);
            quietOrigins.current.add(f.id);
          }
        }
      }
      pump();
    }
  }, [head, queuedTypes.length, pump]);
  // --- Quiet notes (E8): one at a time next to the badge, only while no window is up ---
  const [notes, setNotes] = useState<TrophyNoteData[]>([]);
  const showTrophyNote = useCallback((note: Omit<TrophyNoteData, 'id'>) => {
    setNotes(prev => {
      const next = { ...note, id: nextId.current++ };
      // Waiting notes (not the one on screen) fold into one (enqueueMoment rule).
      const last = prev[prev.length - 1];
      if (prev.length >= 2 && last) {
        return [
          ...prev.slice(0, -1),
          { ...last, items: [...last.items, ...next.items], xp: last.xp + next.xp, boost: last.boost ?? next.boost },
        ];
      }
      return [...prev, next];
    });
  }, []);
  /** A note left: its XP flies from its number (no second pop), the trophy gate hears it. */
  const noteDone = useCallback(
    (point: XpOriginPoint | null) => {
      setNotes(prev => prev.slice(1));
      const before = ledger.current.nextId;
      ledger.current = releaseHeld(ledger.current, 'trophy');
      if (point) {
        for (const f of ledger.current.flights) {
          if (f.id >= before) {
            origins.current.set(f.id, point);
            quietOrigins.current.add(f.id);
          }
        }
      }
      DeviceEventEmitter.emit('achievementCelebrationClosed');
      pumpRef.current();
      reconcileRef.current();
    },
    []
  );
  useEffect(() => listenTrophyNotes(note => showTrophyNote(note)), [showTrophyNote]);
  const pendingRef = useRef(pendingHoldKinds(queuedTypes));
  pendingRef.current = pendingHoldKinds(queuedTypes);
  if (notes.length > 0) pendingRef.current.add('trophy');
  useEffect(() => {
    const tick = setInterval(() => {
      if (ledger.current.held.length === 0) return;
      const next = expireHeld(ledger.current, Date.now(), pendingRef.current);
      if (next !== ledger.current) {
        ledger.current = next;
        pump();
      }
    }, HOLD_FALLBACK_MS / 4);
    return () => clearInterval(tick);
  }, [pump]);

  // --- The badge ---------------------------------------------------------------------
  // Stable identities: the badge registers once (a changing callback re-ran its
  // cleanup, unregistered it and nothing registered again — e.g. after a window
  // resize on a tablet or in split screen). The latest pump goes through a ref.
  const pumpRef = useRef(pump);
  pumpRef.current = pump;
  const registerBadge = useCallback(
    (measure: ((done: (center: Point) => void) => void) | null) => {
      badge.current = measure;
      if (measure) pumpRef.current();
    },
    []
  );
  const setBadgeVisible = useCallback((visible: boolean) => {
    badgeVisible.current = visible;
    if (visible) pumpRef.current();
  }, []);

  const notesApi = useMemo(
    () => ({ showTrophyNote, noteDone, current: notes[0] ?? null, windowUp: queuedTypes.length > 0 }),
    [showTrophyNote, noteDone, notes, queuedTypes.length]
  );

  const value = useMemo(
    () => ({
      level,
      ring,
      pulse,
      bodyX,
      bodyY,
      bodyScale,
      impactAngle,
      impactFlash,
      levelUpKey,
      registerBadge,
      setBadgeVisible,
    }),
    [level, ring, pulse, bodyX, bodyY, bodyScale, impactAngle, impactFlash, levelUpKey, registerBadge, setBadgeVisible]
  );

  return (
    <XpDisplayContext.Provider value={value}>
      <MomentNotesContext.Provider value={notesApi}>
      {children}
      <View ref={frameRef} collapsable={false} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {pops.map(p => (
        <View key={p.id} pointerEvents="none" style={[styles.popPin, { left: p.at.x, top: p.at.y }]}>
          <XpPop amount={p.amount} />
        </View>
      ))}
      {waves.length > 0 && (
        // Skia's canvas does not see React context — everything goes in as props.
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {waves.map(w => (
            <SparkWave key={w.id} wave={w} onHit={onHit} />
          ))}
        </Canvas>
      )}
      </MomentNotesContext.Provider>
    </XpDisplayContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Sparks
// ---------------------------------------------------------------------------

function rand(seed: number) {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

type HitFn = (angle: number, ringTo: number, levelUp: boolean) => void;

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
        const scatter = { x: wave.from.x + Math.cos(angle) * reach, y: wave.from.y + Math.sin(angle) * reach };
        // A soft arc that heads for the badge from the first moment (kolo 11).
        const dx = wave.to.x - scatter.x;
        const dy = wave.to.y - scatter.y;
        const dist = Math.hypot(dx, dy) || 1;
        const bow = (0.12 + 0.22 * rand(wave.seed + i * 5.7)) * (rand(wave.seed + i * 2.3) < 0.8 ? 1 : -1);
        const control = {
          x: scatter.x + dx * 0.5 + (-dy / dist) * dist * bow,
          y: scatter.y + dy * 0.5 + (dx / dist) * dist * bow,
        };
        const incoming =
          Math.atan2(control.y - wave.to.y, control.x - wave.to.x) + (rand(wave.seed + i * 4.4) - 0.5) * 0.9;
        const impact = {
          x: wave.to.x + Math.cos(incoming) * BADGE_RING_R,
          y: wave.to.y + Math.sin(incoming) * BADGE_RING_R,
        };
        return { scatter, control, impact, incoming, hit, delay: i * SPARK_STAGGER, size: 0.8 + rand(wave.seed + i * 9.1) * 0.5 };
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
          arrival={[p.incoming, p.hit.ringTo, p.hit.levelUp]}
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
  arrival: [number, number, boolean];
}) {
  const at = (q: number) => {
    'worklet';
    if (q <= 0) return { x: from.x, y: from.y };
    if (q < SCATTER_SHARE) {
      const s = 1 - Math.pow(1 - q / SCATTER_SHARE, 3);
      return { x: from.x + (scatter.x - from.x) * s, y: from.y + (scatter.y - from.y) * s };
    }
    const u = Math.min(1, (q - SCATTER_SHARE) / (1 - SCATTER_SHARE));
    const e = Math.pow(u, 1.35);
    const a = 1 - e;
    return {
      x: a * a * scatter.x + 2 * a * e * control.x + e * e * to.x,
      y: a * a * scatter.y + 2 * a * e * control.y + e * e * to.y,
    };
  };
  const local = useDerivedValue(() => Math.min(1, Math.max(0, (clock.value * total - delay) / SPARK_DURATION)));
  const [angle, ringTo, levelUp] = arrival;
  useAnimatedReaction(
    () => local.value >= 1,
    (arrived, wasArrived) => {
      if (arrived && !wasArrived) onArrive(angle, ringTo, levelUp);
    }
  );
  const head = useDerivedValue(() => at(local.value));
  const trail1 = useDerivedValue(() => at(local.value - 0.05));
  const trail2 = useDerivedValue(() => at(local.value - 0.1));
  const visible = useDerivedValue(() => (local.value <= 0 || local.value >= 1 ? 0 : 1));
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
        <RadialGradient c={glowC} r={13 * size} colors={[withAlpha(GOLD, 0.8), withAlpha(GOLD, 0)]} />
      </Circle>
      <Circle cx={headX} cy={headY} r={4.2 * size} color={fixed.sparkCore} />
    </Group>
  );
}

// ---------------------------------------------------------------------------
// The level badge layer — pinned top-left over the tab screens (plan 6.0, layer 2)
// ---------------------------------------------------------------------------

const BADGE = TOP_ROW_HEIGHT;
const BADGE_CANVAS = 76;

/**
 * Sits exactly over the left slot of TopRow. Seen only on the five tabs, not
 * while onboarding runs and not while a sheet or detail covers the screen
 * (their tops would collide with it); flights wait until it is back.
 */
export function LevelBadgeLayer() {
  const mark = useBadgeMark();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { state: tutorial } = useTutorial();
  const covered = useOverlayCovered();
  const { setBadgeVisible } = useXpDisplay();
  const visible = segments[0] === '(tabs)' && !tutorial.isActive && !covered;
  useEffect(() => {
    setBadgeVisible(visible);
  }, [visible, setBadgeVisible]);
  const fade = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    fade.value = withTiming(visible ? 1 : 0, { duration: 180 });
  }, [visible, fade]);
  const style = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[styles.layer, { paddingTop: insets.top }, style]}
    >
      <View style={[contentColumn, styles.layerRow]} pointerEvents="box-none">
        <LevelBadge mark={mark} />
        {visible && <NoteHost />}
      </View>
    </Animated.View>
  );
}

export type BadgeMark =
  | { kind: 'tag'; factor: string; label: string }
  | { kind: 'dot'; label: string }
  | null;

export function LevelBadge({ onPress, mark = null }: { onPress?: () => void; mark?: BadgeMark }) {
  const { c } = useDesign();
  const { t } = useI18n();
  const {
    level,
    ring,
    pulse,
    bodyX,
    bodyY,
    bodyScale,
    impactAngle,
    impactFlash,
    levelUpKey,
    registerBadge,
  } = useXpDisplay();
  const ref = useRef<View>(null);
  useEffect(() => () => registerBadge(null), [registerBadge]);

  const center = BADGE_CANVAS / 2;
  const ringPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(Skia.XYWHRect(center - BADGE_RING_R, center - BADGE_RING_R, BADGE_RING_R * 2, BADGE_RING_R * 2), -90, 359.9);
    return p;
  }, [center]);
  const impactArc = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(Skia.XYWHRect(center - BADGE_RING_R, center - BADGE_RING_R, BADGE_RING_R * 2, BADGE_RING_R * 2), -26, 52);
    return p;
  }, [center]);
  const impactTransform = useDerivedValue(() => [{ rotate: impactAngle.value }]);

  const flash = useSharedValue(0);
  useEffect(() => {
    if (levelUpKey === 0) return;
    flash.value = 0;
    flash.value = withDelay(160, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [levelUpKey, flash]);
  const glowR = useDerivedValue(
    () => 26 + 10 * pulse.value + 14 * (flash.value > 0 && flash.value < 1 ? 1 - flash.value : 0)
  );
  const glowOpacity = useDerivedValue(
    () => 0.18 + 0.55 * pulse.value + (flash.value > 0 && flash.value < 1 ? 0.8 * (1 - flash.value) : 0)
  );
  const burstTransform = useDerivedValue(() => [{ scale: 0.6 + 0.9 * flash.value }]);
  const burstOpacity = useDerivedValue(() => (flash.value <= 0 || flash.value >= 1 ? 0 : 1 - flash.value));
  const burst = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return { x: center + Math.cos(a) * 30, y: center + Math.sin(a) * 30 };
      }),
    [center]
  );
  const rippleR = useDerivedValue(() => 4 + 11 * (1 - impactFlash.value));

  const label = mark
    ? t('gamification.badge.levelWithMark', { level, mark: mark.label })
    : t('onboarding.done.statLevel', { level });

  return (
    <View style={styles.badgeBox} pointerEvents="box-none">
      {/* Measure THIS (48×48), not the row (P12). */}
      <View
        ref={ref}
        collapsable={false}
        onLayout={() =>
          registerBadge(done => ref.current?.measureInWindow((x, y, w, h) => done({ x: x + w / 2, y: y + h / 2 })))
        }
      >
        <PressableScale
          {...(onPress ? { onPress } : null)}
          feel={null}
          accessibilityLabel={label}
          pressScale={0.92}
          style={styles.badgeHit}
        >
          <RNAnimated.View
            style={[
              styles.badgeBody,
              { transform: [{ translateX: bodyX }, { translateY: bodyY }, { scale: bodyScale }] },
            ]}
          >
            <Canvas style={styles.badgeCanvas} pointerEvents="none">
              <Circle cx={center} cy={center} r={glowR} opacity={glowOpacity}>
                <RadialGradient c={vec(center, center)} r={glowR} colors={[GOLD, withAlpha(GOLD, 0)]} />
              </Circle>
              <Circle cx={center} cy={center} r={BADGE / 2 - 2} color={c.surface} />
              <Circle cx={center} cy={center} r={BADGE_RING_R} style="stroke" strokeWidth={4} color={c.track} />
              <Path path={ringPath} style="stroke" strokeWidth={4} strokeCap="round" start={0} end={ring}>
                <SkiaLinearGradient
                  start={vec(center - BADGE_RING_R, 0)}
                  end={vec(center + BADGE_RING_R, 0)}
                  colors={[GOLD, GOLD_DEEP]}
                />
              </Path>
              <Group transform={impactTransform} origin={vec(center, center)} opacity={impactFlash}>
                <Circle cx={center + BADGE_RING_R} cy={center} r={14}>
                  <RadialGradient
                    c={vec(center + BADGE_RING_R, center)}
                    r={14}
                    colors={[c.rewardHit, withAlpha(GOLD, 0)]}
                  />
                </Circle>
                <Path path={impactArc} style="stroke" strokeWidth={6} strokeCap="round" color={c.rewardHit} />
                <Circle
                  cx={center + BADGE_RING_R}
                  cy={center}
                  r={rippleR}
                  style="stroke"
                  strokeWidth={1.6}
                  color={c.rewardHit}
                />
              </Group>
              <Group transform={burstTransform} origin={vec(center, center)} opacity={burstOpacity}>
                {burst.map((s, i) => (
                  <Circle key={i} cx={s.x} cy={s.y} r={2.4} color={i % 2 ? GOLD : fixed.sparkCore} />
                ))}
              </Group>
            </Canvas>
            <View style={styles.badgeNumber} pointerEvents="none">
              <RollingNumber text={`${level}`} variant="bodyStrong" style={{ fontFamily: fonts.bold, color: c.text }} />
            </View>
          </RNAnimated.View>
        </PressableScale>
        {mark && (
          <View pointerEvents="none" style={styles.markPin}>
            <Animated.View
              key={mark.kind}
              entering={ZoomIn.springify().damping(14)}
              exiting={ZoomOut.duration(160)}
              style={[mark.kind === 'tag' ? styles.markTag : styles.markDot, { borderColor: c.canvas }]}
            >
              {mark.kind === 'tag' && (
                <Text maxFontSizeMultiplier={1} style={styles.markTagText}>
                  {mark.factor}
                </Text>
              )}
            </Animated.View>
          </View>
        )}
      </View>
      <LevelUpTag levelUpKey={levelUpKey} level={level} onPress={onPress} />
    </View>
  );
}

const TAG_IN_MS = 300;
const TAG_OUT_MS = 300 + 700 + 1700;

/** "LEVEL UP · 17" slides out of the badge for a moment after a level up. */
function LevelUpTag({
  levelUpKey,
  level,
  onPress,
}: {
  levelUpKey: number;
  level: number;
  onPress?: (() => void) | undefined;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const p = useSharedValue(0);
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (levelUpKey === 0) return undefined;
    p.value = withSequence(
      withDelay(TAG_IN_MS, withSpring(1, { damping: 14, stiffness: 200 })),
      withDelay(1700, withTiming(0, { duration: 260 }))
    );
    const on = setTimeout(() => setLive(true), TAG_IN_MS);
    const off = setTimeout(() => setLive(false), TAG_OUT_MS);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [levelUpKey, p]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value),
    transform: [{ translateX: (1 - p.value) * -16 }, { scale: 0.9 + 0.1 * p.value }],
  }));
  const tappable = live && !!onPress;
  return (
    <Animated.View
      pointerEvents={tappable ? 'auto' : 'none'}
      style={[styles.tag, { backgroundColor: c.text }, style]}
    >
      <Pressable
        onPress={onPress}
        disabled={!tappable}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t('gamification.badge.levelUpLabel', { level })}
        style={styles.tagHit}
      >
        <Text maxFontSizeMultiplier={1.3} style={[typeStyle('overline', c.canvas), styles.tagText]}>
          {t('gamification.badge.levelUpTag', { level })}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// "+25 XP" at the place it was earned
// ---------------------------------------------------------------------------

/** Pops above a control, holds a beat, then cracks open (the sparks take over). Negative drifts away. */
function XpPop({ amount }: { amount: number }) {
  const { c } = useDesign();
  const { t } = useI18n();
  const p = useSharedValue(0);
  const positive = amount > 0;
  useEffect(() => {
    p.value = positive
      ? withSequence(
          withSpring(1, { damping: 11, stiffness: 320, mass: 0.6 }),
          withDelay(240, withTiming(2, { duration: 170, easing: Easing.out(Easing.quad) }))
        )
      : withSequence(withTiming(1, { duration: 180 }), withDelay(380, withTiming(2, { duration: 260 })));
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
      style={[
        styles.pop,
        {
          backgroundColor: positive ? c.rewardSoft : c.surfaceRaised,
          borderColor: positive ? withAlpha(GOLD, 0.4) : c.border,
        },
        style,
      ]}
    >
      <Text
        maxFontSizeMultiplier={1.3}
        style={[typeStyle('caption', positive ? c.rewardText : c.textMuted), { fontFamily: fonts.bold }]}
      >
        {positive
          ? t('achievements.card.xpReward', { xp: amount })
          : t('gamification.xp.amountLost', { xp: Math.abs(amount) })}
      </Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// The quiet trophy note (E8) — slides out of the badge, holds, slides back
// ---------------------------------------------------------------------------

const NOTE_HOLD_MS = { common: 2600, rare: 3400 } as const;

/** Shows the head note while no window is up. */
function NoteHost() {
  const { current, windowUp, noteDone } = useMomentNotes();
  if (!current || windowUp) return null;
  return <TrophyNoteView key={current.id} note={current} onDone={noteDone} />;
}

function TrophyNoteView({
  note,
  onDone,
}: {
  note: TrophyNoteData;
  onDone: (point: XpOriginPoint | null) => void;
}) {
  const { c, mode } = useDesign();
  const { t } = useI18n();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const top = note.items[0]!;
  const tier = rarity[(top.rarity as keyof typeof rarity) ?? 'common'] ?? rarity.common;
  const rare = top.rarity === 'rare';
  const names = note.items.map(i => t(i.nameKey)).join(' · ');
  const overline =
    note.items.length > 1
      ? t('achievements.celebration.trophiesUnlocked', { count: note.items.length })
      : t(`achievements.celebration.rarity_${top.rarity}`);
  const xpText = t('achievements.card.xpReward', { xp: note.xp });
  const boostLine = note.boost
    ? t('gamification.multiplier.boostLine', { factor: note.boost.factor, count: note.boost.hours })
    : null;
  const p = useSharedValue(0);
  const xpRef = useRef<View>(null);
  const left = useRef(false);
  const leave = useCallback(
    (open: boolean) => {
      if (left.current) return;
      left.current = true;
      const finish = (point: XpOriginPoint | null) => {
        p.value = withTiming(0, { duration: 240 }, finished => {
          if (finished) scheduleOnRN(onDone, point);
        });
      };
      if (xpRef.current) {
        xpRef.current.measureInWindow((x, y, w, h) => finish({ x: x + w / 2, y: y + h / 2 }));
      } else finish(null);
      if (open) router.push('/achievements');
    },
    [p, onDone, router]
  );
  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  useEffect(() => {
    feel(rare ? 'confirm' : 'note');
    AccessibilityInfo.announceForAccessibility(
      note.items
        .map(item =>
          t('achievements.celebration.announcement', {
            rarity: (rarity[item.rarity as keyof typeof rarity] ?? rarity.common).label,
            name: t(item.nameKey),
            xp: String(note.xp),
          })
        )
        .join(' ')
    );
    p.value = withSpring(1, { damping: 14, stiffness: 200 });
    const id = setTimeout(() => leaveRef.current(false), NOTE_HOLD_MS[rare ? 'rare' : 'common']);
    return () => clearTimeout(id);
    // One note = one entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() =>
    reducedMotion
      ? { opacity: p.value }
      : { opacity: p.value, transform: [{ translateX: (1 - p.value) * -16 }, { scale: 0.92 + 0.08 * p.value }] }
  );
  return (
    <Animated.View style={[styles.noteWrap, style]} pointerEvents="box-none">
      <PressableScale
        onPress={() => leave(true)}
        feel={null}
        pressScale={0.97}
        accessibilityLabel={`${overline}. ${names}. ${xpText}.${boostLine ? ` ${boostLine}.` : ''} ${t(
          'achievements.celebration.opensTrophyRoom'
        )}`}
        style={[styles.note, { backgroundColor: c.surface, borderColor: rare ? tier.glow : c.border }]}
      >
        <View style={styles.medals}>
          {note.items.slice(0, 3).map((item, i) => (
            <View
              key={item.id}
              style={[
                styles.medal,
                { borderColor: (rarity[item.rarity as keyof typeof rarity] ?? rarity.common).ring[1], backgroundColor: c.surface },
                i > 0 && styles.medalOverlap,
              ]}
            >
              <Text maxFontSizeMultiplier={1} style={styles.medalIcon}>
                {item.icon}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.noteText}>
          <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={typeStyle('overline', tier.chipText[mode])}>
            {overline}
          </Text>
          <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={typeStyle('label', c.text)}>
            {names}
          </Text>
        </View>
        <View ref={xpRef} collapsable={false} style={styles.noteXp}>
          {note.boost && (
            <View style={[styles.boostTag, { backgroundColor: GOLD }]}>
              <Text maxFontSizeMultiplier={1} style={styles.boostText}>
                {t('gamification.multiplier.factorTag', { factor: note.boost.factor })}
              </Text>
            </View>
          )}
          <Text maxFontSizeMultiplier={1.2} style={[typeStyle('caption', c.rewardText), { fontFamily: fonts.bold }]}>
            {xpText}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, right: 0 },
  layerRow: { height: TOP_ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg },
  badgeBox: { flexDirection: 'row', alignItems: 'center' },
  badgeHit: { width: BADGE, height: BADGE, alignItems: 'center', justifyContent: 'center' },
  badgeBody: { width: BADGE, height: BADGE, alignItems: 'center', justifyContent: 'center' },
  badgeCanvas: {
    position: 'absolute',
    width: BADGE_CANVAS,
    height: BADGE_CANVAS,
    left: (BADGE - BADGE_CANVAS) / 2,
    top: (BADGE - BADGE_CANVAS) / 2,
  },
  badgeNumber: { alignItems: 'center', justifyContent: 'center' },
  markPin: { position: 'absolute', top: 0, left: 0, width: BADGE, height: BADGE },
  markTag: {
    position: 'absolute',
    right: -9,
    bottom: -3,
    minWidth: 26,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    borderWidth: 2,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markTagText: { ...typeStyle('micro', fixed.goldInk), fontFamily: fonts.bold },
  markDot: {
    position: 'absolute',
    right: 1,
    top: 1,
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    borderWidth: 2,
    backgroundColor: GOLD_DEEP,
  },
  // Out of the layout: hidden, it must not push the quiet note away from the badge.
  tag: { position: 'absolute', left: BADGE + space.sm, borderRadius: radius.pill },
  noteWrap: { flex: 1, marginLeft: space.sm, marginRight: space.sm },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: space.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  medals: { flexDirection: 'row' },
  medal: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalOverlap: { marginLeft: -10 },
  medalIcon: { ...typeStyle('label', fixed.ink) },
  noteText: { flexShrink: 1, marginLeft: space.sm },
  noteXp: { marginLeft: space.sm, alignItems: 'flex-end' },
  boostTag: { borderRadius: radius.pill, paddingHorizontal: 6, marginBottom: 2 },
  boostText: { ...typeStyle('micro', fixed.goldInk), fontFamily: fonts.bold },
  tagHit: { paddingHorizontal: space.md, paddingVertical: 5 },
  tagText: { letterSpacing: 1.4 },
  popPin: { position: 'absolute', width: 0, height: 0, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  pop: {
    position: 'absolute',
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
