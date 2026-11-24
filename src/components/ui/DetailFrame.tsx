/**
 * DetailFrame — a detail that grows out of the card the user tapped and shrinks
 * back into it (card → detail continuity, kolo 6). Migration E4: the Design Lab
 * has this code three times (journal, habit, challenge detail); here it is one
 * part, the same in all three.
 *
 * - The frame animates its rectangle (one view, only while opening/closing); the
 *   content is laid out ONCE at full size and uncovered as the frame grows, so
 *   nothing reflows mid-animation.
 * - Closing: the close button, Android back (only on the focused screen), or a
 *   pull down from the top of the content (DetailScroll) — never left half open.
 * - It counts as an open overlay (overlayRegistry) while mounted.
 *
 *   <DetailFrame origin={cardRect} size={pageSize} onClosed={…}>
 *     {(close, p) => (
 *       <DetailScroll p={p} close={close} …>
 *         <PageTopBar onClose={close} label={closeLabel} raised /> …
 *       </DetailScroll>
 *     )}
 *   </DetailFrame>
 */
import React, { ReactNode, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useDesign } from '@/src/contexts/ThemeContext';
import { fixed, radius } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { useOverlayBack, useOverlayCover } from './overlayRegistry';

export interface DetailRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const OPEN_SPRING = {
  damping: 24,
  stiffness: 210,
  mass: 1,
  overshootClamping: true,
};
const CLOSE_MS = 320;
const SCRIM_OPACITY = 0.28;

interface DetailFrameProps {
  /** The card's rectangle inside the page — where the detail grows from and returns to. */
  origin: DetailRect;
  /** The page size — the detail's final rectangle. */
  size: { width: number; height: number };
  /** The corner radius of the card it grows from (a habit row is 20, cards 24). */
  originRadius?: number;
  onClosed: () => void;
  /** The content, laid out at full size; `close` shrinks it back into the card. */
  children: (close: () => void, p: SharedValue<number>) => ReactNode;
}

export function DetailFrame({
  origin,
  size,
  originRadius = radius.lg,
  onClosed,
  children,
}: DetailFrameProps) {
  const { c } = useDesign();
  useOverlayCover();
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withSpring(1, OPEN_SPRING);
  }, [p]);

  const close = useCallback(() => {
    feel('tap');
    p.value = withTiming(
      0,
      { duration: CLOSE_MS, easing: Easing.inOut(Easing.cubic) },
      finished => {
        if (finished) scheduleOnRN(onClosed);
      }
    );
  }, [p, onClosed]);

  useOverlayBack(close);

  const frameStyle = useAnimatedStyle(() => ({
    left: interpolate(p.value, [0, 1], [origin.x, 0]),
    top: interpolate(p.value, [0, 1], [origin.y, 0]),
    width: interpolate(p.value, [0, 1], [origin.width, size.width]),
    height: interpolate(p.value, [0, 1], [origin.height, size.height]),
    borderRadius: interpolate(p.value, [0, 1], [originRadius, 0]),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.3, 0.85], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(p.value, [0.3, 1], [10, 0], 'clamp') },
    ],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: SCRIM_OPACITY * p.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: fixed.black },
          scrimStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.frame,
          { backgroundColor: c.surface, borderColor: c.border },
          frameStyle,
        ]}
      >
        <Animated.View
          style={[{ width: size.width, height: size.height }, contentStyle]}
        >
          {children(close, p)}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
  },
});
