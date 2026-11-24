/**
 * The frame every celebration window shares (moved from the Design Lab's
 * challengeMoments.tsx in migration E4; the windows of E8, E10 and E18 use it —
 * the lab keeps its copy, O-6):
 *
 * - useWindowMotion: the window springs in, announces itself to the screen
 *   reader once, and leaves in 240 ms. It ALWAYS reports "closed" (a fallback
 *   timer covers an animation cut short): a window that never closes would block
 *   the line of moments behind it.
 * - PrimaryButton: the window's one button (primary gradient). `buttonRef` lets
 *   the XP sparks start from it.
 * - windowStyles: scrim, card, medal, stars, rows and the button.
 *
 * Windows are views in the window layer (kap. 6.0) — never an RN <Modal>.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';
import { useDesign } from '@/src/contexts/ThemeContext';
import { fixed, radius, space } from '@/src/design/tokens';
import { AppText, PressableScale } from './primitives';

const LEAVE_MS = 240;

export function useWindowMotion(onClosed: () => void, announcement: string) {
  const p = useSharedValue(0);
  const leaving = useRef(false);
  const closed = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    p.value = withSpring(1, { damping: 16, stiffness: 170, mass: 0.9 });
    AccessibilityInfo.announceForAccessibility(announcement);
    return () => {
      if (fallback.current) clearTimeout(fallback.current);
    };
    // Once, when the window opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const leave = useCallback(
    (before?: () => void) => {
      if (leaving.current) return;
      leaving.current = true;
      before?.();
      const finish = () => {
        if (closed.current) return;
        closed.current = true;
        onClosed();
      };
      p.value = withTiming(0, { duration: LEAVE_MS }, finished => {
        if (finished) scheduleOnRN(finish);
      });
      // The line of moments must move on even if the animation is cut short —
      // a window that never reports "closed" would block everything behind it.
      fallback.current = setTimeout(finish, LEAVE_MS + 200);
    },
    [p, onClosed]
  );
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * Math.min(1, p.value),
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.4),
    transform: [
      { translateY: (1 - p.value) * 60 },
      { scale: 0.9 + 0.1 * p.value },
    ],
  }));
  return { leave, scrimStyle, cardStyle };
}

export function PrimaryButton({
  label,
  onPress,
  buttonRef,
}: {
  label: string;
  onPress: () => void;
  buttonRef?: React.RefObject<View | null>;
}) {
  const { c } = useDesign();
  return (
    <View ref={buttonRef} collapsable={false}>
      <PressableScale
        onPress={onPress}
        feel={null}
        accessibilityLabel={label}
        style={windowStyles.button}
      >
        <LinearGradient
          colors={c.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
        />
        <AppText variant="bodyStrong" tone="onPrimary">
          {label}
        </AppText>
      </PressableScale>
    </View>
  );
}

/** The frame and the parts every celebration window shares. */
export const windowStyles = StyleSheet.create({
  scrim: {
    backgroundColor: fixed.black,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: space.xxl,
    paddingTop: space.xxxl,
  },
  centered: {
    textAlign: 'center',
  },
  medalBox: {
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  medal: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    borderWidth: 3,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.xs,
    marginTop: space.lg,
  },
  star: {
    width: 30,
    height: 30,
  },
  starOver: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  earned: {
    marginTop: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  row: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexText: {
    flex: 1,
    marginRight: space.md,
  },
  multiplier: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
  stepDown: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: space.md,
  },
  recapRing: {
    alignItems: 'center',
    marginTop: space.lg,
    marginBottom: space.lg,
  },
  next: {
    marginTop: space.xl,
    padding: space.lg,
    borderRadius: radius.md,
  },
  button: {
    height: 52,
    marginTop: space.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
