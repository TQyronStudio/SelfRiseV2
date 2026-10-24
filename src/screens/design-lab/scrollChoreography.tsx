/**
 * Scroll choreography for the Design Lab (premium-design-plan.md, F1, kolo 3–5).
 *
 * Each section is a ScrollCard:
 * - entering from the bottom it rises into place (it "surfaces" over the banner);
 * - leaving at the top it recedes into depth (slightly smaller, slower), and the
 *   next card glides over it like a stack;
 * - the first time it is really on screen, the fills and counters inside start
 *   (`useCardSeen`), so they play when someone can see them, not below the fold.
 *
 * WHY React Native's own Animated (native driver) and not Reanimated here (kolo 5):
 * with Reanimated 4.2 and its default static flags, every animated style update on
 * the New Architecture goes through a ShadowTree commit. A scroll-linked style
 * changes on every frame, so the whole screen paid a commit 60× a second and the
 * scroll stuttered — even with the crown off (the parallax greeting alone did it).
 * `Animated.event` with `useNativeDriver` hands the scroll offset to native
 * interpolation nodes that move the views directly: no JS, no commits per frame.
 * (Reanimated's fix is static flags that need a native rebuild — plan, F2.)
 * Reanimated stays for everything that is not scroll-driven: intro, check-offs,
 * the day arc.
 *
 * Other smooth-scrolling rules (kolo 4): transform only — no opacity on cards
 * (fading a card with a shadow and a canvas forces off-screen compositing every
 * frame); "seen" is state of the card itself, so it re-renders only that card.
 *
 * Off when the OS asks for reduced motion, and with the crown switch off —
 * "seen" still works in both cases, it is about correctness, not decoration.
 *
 * GOING LIVE (1:1) — the most expensive lesson of the lab (kolo 4–5):
 * - Scroll-linked motion ONLY through RN Animated.event + useNativeDriver. With
 *   Reanimated 4.2 default flags it stuttered even with every effect off.
 * - Cards: transform only, no opacity. "Seen" state lives in the card.
 * - If Reanimated's static flags get enabled later (plan F2), re-test before
 *   moving this back — and mind the Pressable caveat noted in the plan.
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
import { Animated as RNAnimated } from 'react-native';
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

interface ScrollCardProps {
  children: ReactNode;
  /** The hero recedes more — it hands the day over to the compact header. */
  variant?: 'card' | 'hero';
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
    const translateY = RNAnimated.add(
      surface.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
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
