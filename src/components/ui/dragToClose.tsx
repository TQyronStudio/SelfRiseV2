/**
 * Drag to close (R-33, kolo 40) for sheets and details of the new look (moved 1:1
 * from the Design Lab in migration E4; the lab keeps its copy — O-6). The finger
 * scrubs the very value that opens and closes the thing, so every drag can be
 * undone halfway (dragToCloseLogic.ts).
 *
 * - A bottom sheet follows the finger down.
 * - A detail that grew out of a card shrinks back into it when pulled down from
 *   the top of its content (while the content is scrolled, the pull scrolls).
 *
 * The gesture runs on the UI thread (gesture-handler + Reanimated). Every callback
 * says 'worklet' itself. Letting go either closes the thing or springs it back
 * fully open — it is never left in between (kolo 40). Under reduce motion there is
 * no drag — the close button and Android back stay. A sheet with a text field
 * never closes by a drag. Pages are real routes in the app: their native back
 * swipe stays, this is not used for them.
 */
import React, { ReactNode, useCallback, useMemo, useRef } from 'react';
import { ScrollViewProps } from 'react-native';
import Animated, {
  cancelAnimation,
  SharedValue,
  useAnimatedScrollHandler,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { dragCloses, dragOpenness } from './dragToCloseLogic';

const BACK_SPRING = { damping: 24, stiffness: 240, overshootClamping: true };

interface DragToClose {
  /** 0 = closed … 1 = open — the value the thing already animates with. */
  p: SharedValue<number>;
  /** 'y' = pulled down, 'x' = swiped to the right. */
  axis: 'x' | 'y';
  /** Finger travel (px) that equals fully closed. */
  range: number;
  /** How far it may shrink under the finger. */
  floor?: number;
  /** The thing's own close (it animates `p` to 0 and reports when done). */
  close: () => void;
  /** Only a strip this wide at the left edge starts the drag (pages). */
  edge?: number;
  /** The content's scroll position: the drag takes over only at the top. */
  scrollY?: SharedValue<number>;
  enabled?: boolean;
}

export function useDragToClose({
  p,
  axis,
  range,
  floor = 0,
  close,
  edge,
  scrollY,
  enabled = true,
}: DragToClose) {
  const reducedMotion = useReducedMotion();
  const from = useSharedValue(1);
  /** Finger travel at the moment the drag took over (0 unless it began as a scroll). */
  const start = useSharedValue(0);
  const holding = useSharedValue(false);
  // The components' `close` is a new function every render — keep one identity.
  const latest = useRef(close);
  latest.current = close;
  const closeNow = useCallback(() => latest.current(), []);

  return useMemo(() => {
    let pan = Gesture.Pan().enabled(enabled && !reducedMotion);
    pan =
      axis === 'y'
        ? pan.activeOffsetY(12).failOffsetX([-24, 24])
        : pan.activeOffsetX(12).failOffsetY([-24, 24]);
    if (edge) pan = pan.hitSlop({ left: 0, width: edge });
    // Each callback says 'worklet' itself: the plugin only adds it for a chain
    // that starts at `Gesture.Pan()`, and without it the whole drag would run
    // through the JS thread.
    return pan
      .onStart(() => {
        'worklet';
        holding.value = false;
      })
      .onUpdate(e => {
        'worklet';
        const travel = axis === 'y' ? e.translationY : e.translationX;
        // Content scrolled away from its top: this pull belongs to the list —
        // and whatever the pull had already taken goes back.
        if (scrollY && scrollY.value > 0) {
          if (holding.value) {
            holding.value = false;
            p.value = withSpring(1, BACK_SPRING);
          }
          return;
        }
        if (!holding.value) {
          holding.value = true;
          cancelAnimation(p);
          from.value = p.value;
          start.value = travel;
        }
        p.value = dragOpenness(from.value, travel - start.value, range, floor);
      })
      .onEnd((e, success) => {
        'worklet';
        if (!holding.value) return;
        holding.value = false;
        const travel =
          (axis === 'y' ? e.translationY : e.translationX) - start.value;
        const velocity = axis === 'y' ? e.velocityY : e.velocityX;
        // An interrupted gesture is never a decision to close.
        if (success && dragCloses(travel, velocity, range)) {
          scheduleOnRN(closeNow);
        } else {
          p.value = withSpring(1, BACK_SPRING);
        }
      })
      .onFinalize(() => {
        'worklet';
        // The gesture went away while it still held the thing (no end event):
        // never leave it half shut.
        if (!holding.value) return;
        holding.value = false;
        p.value = withSpring(1, BACK_SPRING);
      });
  }, [
    axis,
    closeNow,
    edge,
    enabled,
    floor,
    from,
    holding,
    p,
    range,
    reducedMotion,
    scrollY,
    start,
  ]);
}

/**
 * The scroll view of a detail that grew out of a card: pulled down from the top
 * of its content, the detail shrinks back towards the card.
 */
export function DetailScroll({
  p,
  close,
  children,
  ...scrollProps
}: {
  p: SharedValue<number>;
  close: () => void;
  children: ReactNode;
} & ScrollViewProps) {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });
  const drag = useDragToClose({
    p,
    axis: 'y',
    range: 460,
    floor: 0.35,
    close,
    scrollY,
  });
  // The list's own scrolling and the pull work side by side; `scrollY` decides
  // whose turn it is.
  const gestures = useMemo(() => {
    const scroll = Gesture.Native();
    return { scroll, pull: drag.simultaneousWithExternalGesture(scroll) };
  }, [drag]);

  return (
    <GestureDetector gesture={gestures.pull}>
      <Animated.View style={{ flex: 1 }}>
        <GestureDetector gesture={gestures.scroll}>
          <Animated.ScrollView
            {...scrollProps}
            onScroll={onScroll}
            scrollEventThrottle={16}
            // No rubber band at the top: there, a pull is the detail's.
            bounces={false}
            overScrollMode="never"
          >
            {children}
          </Animated.ScrollView>
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
  );
}
