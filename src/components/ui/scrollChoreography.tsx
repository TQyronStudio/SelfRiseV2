/**
 * Scroll choreography of the new look (moved 1:1 from the Design Lab in migration
 * E2; the lab keeps its copy, a fix goes to both — O-6).
 *
 * Each section is a ScrollCard:
 * - entering from the bottom it rises into place (it "surfaces" over the banner);
 * - leaving at the top it recedes into depth (slightly smaller, slower), and the
 *   next card glides over it like a stack;
 * - the first time it is really on screen, the fills and counters inside start
 *   (`useCardSeen`), so they play when someone can see them, not below the fold.
 *
 * RULES — the most expensive lesson of the lab (kolo 4–5, P1–P3):
 * - Scroll-linked motion ONLY through RN Animated.event + useNativeDriver: a
 *   scroll-linked Reanimated style costs a ShadowTree commit per frame. Reanimated
 *   stays for everything that is not scroll-driven (intro, check-offs, the day arc).
 * - Cards: transform only, never opacity (fading a card with a shadow and a canvas
 *   forces off-screen compositing every frame). "Seen" is state of the card itself.
 * - Recede is for ONE card. A section taller than ~60 % of the viewport (a list)
 *   only surfaces — shifting it by 22 % of its height slid a long list over the
 *   next section (kolo 23).
 * - Loops (the sun, the flame) pause while the page moves: useScrollRest (P79).
 * - Off when the OS asks for reduced motion; "seen" still works then.
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
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export interface ScrollFrame {
  /** Native-driven scroll offset (Animated.event → useNativeDriver). */
  scrollY: RNAnimated.Value;
  /** Last offset seen on the JS side (for one-off checks, never for animation). */
  getScrollY: () => number;
  /** JS-side scroll notifications; returns an unsubscribe function. */
  subscribe: (listener: (y: number) => void) => () => void;
  viewportHeight: number;
  /** Fixed chrome at the bottom (banner + tab bar) — cards surface above it. */
  bottomInset: number;
  enabled: boolean;
}

const ScrollFrameContext = createContext<ScrollFrame | null>(null);
export const ScrollFrameProvider = ScrollFrameContext.Provider;

export function useScrollFrame(): ScrollFrame {
  const frame = useContext(ScrollFrameContext);
  if (!frame)
    throw new Error('useScrollFrame must be used inside ScrollFrameProvider');
  return frame;
}

interface CardSeen {
  seen: boolean;
  /** Ms between the screen mounting and the card first being on screen. */
  seenAfter: number;
}

const CardSeenContext = createContext<CardSeen>({ seen: true, seenAfter: 0 });

/** Inside a ScrollCard: whether it has been on screen yet (start fills then). */
export const useCardSeen = () => useContext(CardSeenContext);

/** Delay for an entrance that was planned at `introDelay` ms after mount. */
export function seenDelay(seenAfter: number, introDelay: number): number {
  return Math.max(0, introDelay - seenAfter);
}

/**
 * Surfacing happens mostly in the band behind the banner: it starts SURFACE_LEAD px
 * below the visible bottom and ends SURFACE_LEAD px above it. A card resting just
 * above the edge is therefore fully in place.
 */
const SURFACE_LEAD = 60;
/** A card counts as seen once its top is this far into the visible area. */
const SEEN_MARGIN = 48;
/** Taller than this share of the viewport = a list, not a card: no recede. */
const TALL_SHARE = 0.6;

interface ScrollCardProps {
  children: ReactNode;
  /** The hero recedes more — it hands the day over to the compact header. */
  variant?: 'card' | 'hero';
}

/**
 * Everything a screen needs for the native-driven scroll: the frame for
 * ScrollFrameProvider, plus onScroll and onLayout for its Animated.ScrollView.
 * `enabled` false = no card motion (the "seen" signal still works).
 */
export function usePageScrollFrame(bottomInset: number, enabled: boolean) {
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const lastScrollY = useRef(0);
  const listeners = useRef(new Set<(y: number) => void>());
  const [viewportHeight, setViewportHeight] = useState(0);
  const onScroll = useMemo(
    () =>
      RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          lastScrollY.current = e.nativeEvent.contentOffset.y;
          listeners.current.forEach(fn => fn(lastScrollY.current));
        },
      }),
    [scrollY]
  );
  const frame = useMemo<ScrollFrame>(
    () => ({
      scrollY,
      getScrollY: () => lastScrollY.current,
      subscribe: (fn: (y: number) => void) => {
        listeners.current.add(fn);
        return () => {
          listeners.current.delete(fn);
        };
      },
      viewportHeight,
      bottomInset,
      enabled,
    }),
    [scrollY, viewportHeight, bottomInset, enabled]
  );
  const onLayout = (e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    setViewportHeight(prev => (prev === height ? prev : height));
  };
  return { frame, onScroll, onLayout };
}

export function ScrollCard({ children, variant = 'card' }: ScrollCardProps) {
  const frame = useScrollFrame();
  const reducedMotion = useReducedMotion();
  const enabled = frame.enabled && !reducedMotion;
  const hero = variant === 'hero';

  const [layout, setLayout] = useState<{ y: number; h: number } | null>(null);
  const mountedAt = useRef(Date.now());
  const [seenAfter, setSeenAfter] = useState<number | null>(null);

  // "Seen": a cheap JS comparison on scroll events, until it has happened once.
  useEffect(() => {
    if (!layout || seenAfter !== null || frame.viewportHeight === 0)
      return undefined;
    const limit = frame.viewportHeight - frame.bottomInset - SEEN_MARGIN;
    const isVisible = (y: number) => layout.y - y < limit;
    const markSeen = () =>
      setSeenAfter(prev => prev ?? Date.now() - mountedAt.current);
    if (isVisible(frame.getScrollY())) {
      markSeen();
      return undefined;
    }
    return frame.subscribe(y => {
      if (isVisible(y)) markSeen();
    });
  }, [layout, seenAfter, frame]);

  // Native interpolation nodes, rebuilt only when the card's position changes.
  const style = useMemo(() => {
    if (!enabled || !layout || frame.viewportHeight === 0) return undefined;
    const visibleBottom = frame.viewportHeight - frame.bottomInset;
    const { y, h } = layout;
    // A tall section (a list) must not move with its own height — see above.
    // The hero is always one card, however tall.
    const tall = !hero && h > frame.viewportHeight * TALL_SHARE;
    // No scroll-linked style at all: even a constant transform is re-sent to a
    // huge view on every scroll frame (kolo 25).
    if (tall) return undefined;
    const surface = frame.scrollY.interpolate({
      inputRange: [
        y - visibleBottom - SURFACE_LEAD,
        y - visibleBottom + SURFACE_LEAD,
      ],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    const recede = frame.scrollY.interpolate({
      inputRange: [y, y + Math.max(h, 1)],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    const rise = surface.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });
    const translateY = RNAnimated.add(
      rise,
      recede.interpolate({
        inputRange: [0, 1],
        outputRange: [0, h * (hero ? 0.35 : 0.22)],
      })
    );
    const scale = RNAnimated.multiply(
      surface.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }),
      recede.interpolate({
        inputRange: [0, 1],
        outputRange: [1, hero ? 0.9 : 0.94],
      })
    );
    return { transform: [{ translateY }, { scale }] };
  }, [enabled, layout, frame, hero]);

  const seenValue = useMemo(
    () => ({ seen: seenAfter !== null, seenAfter: seenAfter ?? 0 }),
    [seenAfter]
  );

  return (
    <RNAnimated.View
      onLayout={e => {
        const { y, height } = e.nativeEvent.layout;
        setLayout(prev =>
          prev && prev.y === y && prev.h === height ? prev : { y, h: height }
        );
      }}
      style={style}
    >
      <CardSeenContext.Provider value={seenValue}>
        {children}
      </CardSeenContext.Provider>
    </RNAnimated.View>
  );
}

// ---------------------------------------------------------------------------
// Rest — loops play only while the page is still (kolo 52)
// ---------------------------------------------------------------------------

/** Tells a looping animation when the page is at rest. */
export interface RestSignal {
  /** Called now with the current state, then on every change. */
  subscribe: (fn: (atRest: boolean) => void) => () => void;
}

const RESUME_AFTER_MS = 150;

/**
 * Scroll at rest = not dragged and not gliding. Like the sun's ambient loops on
 * Home, the streak flame (a Lottie loop, drawn frame by frame by the CPU on
 * Android) stops while the page moves and goes on once it settles. Resuming waits
 * a beat, so a drag that turns into a glide does not wake it for one frame.
 * All by refs: no React render on scroll.
 */
export function useScrollRest() {
  const listeners = useRef(new Set<(atRest: boolean) => void>());
  const state = useRef({ dragging: false, gliding: false, atRest: true });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const update = useCallback(
    (patch: Partial<{ dragging: boolean; gliding: boolean }>) => {
      const s = state.current;
      Object.assign(s, patch);
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const set = (atRest: boolean) => {
        if (s.atRest === atRest) return;
        s.atRest = atRest;
        listeners.current.forEach(fn => fn(atRest));
      };
      if (s.dragging || s.gliding) set(false);
      else timer.current = setTimeout(() => set(true), RESUME_AFTER_MS);
    },
    []
  );

  const signal = useMemo<RestSignal>(
    () => ({
      subscribe: fn => {
        listeners.current.add(fn);
        fn(state.current.atRest);
        return () => {
          listeners.current.delete(fn);
        };
      },
    }),
    []
  );

  const handlers = useMemo(
    () => ({
      onScrollBeginDrag: () => update({ dragging: true }),
      onScrollEndDrag: () => update({ dragging: false }),
      onMomentumScrollBegin: () => update({ gliding: true }),
      onMomentumScrollEnd: () => update({ gliding: false }),
    }),
    [update]
  );

  return { signal, handlers, update };
}
