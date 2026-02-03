import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity, View } from 'react-native';
import {
  Canvas,
  RoundedRect,
  Group,
  Rect,
  BlurMask,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  useDerivedValue,
  interpolate,
  Extrapolation,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { useI18n } from '@/src/hooks/useI18n';

// Animation configuration for smooth, professional feel
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 150,
  mass: 0.8,
};

interface SpotlightTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpotlightEffectProps {
  target: SpotlightTarget;
  action?: string | undefined;
  targetId?: string | undefined;
  onTargetPress?: (() => void) | undefined;
}

export const SpotlightEffect: React.FC<SpotlightEffectProps> = ({
  target,
  action,
  targetId,
  onTargetPress,
}) => {
  const { t } = useI18n();

  // Padding around target for "breathing room"
  const PADDING = 10;
  const CORNER_RADIUS = 14;
  const BLUR_AMOUNT = 8;
  const OVERLAY_OPACITY = 0.75;

  // Screen dimensions with listener for rotation
  const screenWidth = useSharedValue(Dimensions.get('window').width);
  const screenHeight = useSharedValue(Dimensions.get('window').height);

  // Entrance fade-in animation
  const entranceOpacity = useSharedValue(0);

  // Reanimated SharedValues for smooth position/size transitions
  const animatedX = useSharedValue(target.x - PADDING);
  const animatedY = useSharedValue(target.y - PADDING);
  const animatedWidth = useSharedValue(target.width + PADDING * 2);
  const animatedHeight = useSharedValue(target.height + PADDING * 2);

  // Pulse animation value (0-1 cycle)
  const pulseProgress = useSharedValue(0);

  // Listen for dimension changes (rotation)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      screenWidth.value = window.width;
      screenHeight.value = window.height;
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Entrance fade-in on mount
  useEffect(() => {
    entranceOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
  }, []);

  // Glow opacity for pulse effect
  const glowOpacity = useDerivedValue(() => {
    return interpolate(
      pulseProgress.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3],
      Extrapolation.CLAMP
    );
  });

  // Glow scale for pulse effect
  const glowScale = useDerivedValue(() => {
    return interpolate(
      pulseProgress.value,
      [0, 0.5, 1],
      [1, 1.08, 1],
      Extrapolation.CLAMP
    );
  });

  // Update position when target changes - smooth transition
  useEffect(() => {
    animatedX.value = withSpring(target.x - PADDING, SPRING_CONFIG);
    animatedY.value = withSpring(target.y - PADDING, SPRING_CONFIG);
    animatedWidth.value = withSpring(target.width + PADDING * 2, SPRING_CONFIG);
    animatedHeight.value = withSpring(target.height + PADDING * 2, SPRING_CONFIG);
  }, [target.x, target.y, target.width, target.height]);

  // Start pulse animation loop with proper cleanup
  useEffect(() => {
    pulseProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      false
    );

    // Cleanup: cancel animation on unmount
    return () => {
      cancelAnimation(pulseProgress);
    };
  }, []);

  // Derived values for Skia - defined OUTSIDE of JSX (fix anti-pattern)
  const cutoutX = useDerivedValue(() => animatedX.value);
  const cutoutY = useDerivedValue(() => animatedY.value);
  const cutoutWidth = useDerivedValue(() => animatedWidth.value);
  const cutoutHeight = useDerivedValue(() => animatedHeight.value);

  // Glow ring dimensions (slightly larger than cutout) - defined OUTSIDE of JSX
  const glowPadding = useDerivedValue(() => {
    const baseGlow = 6;
    return baseGlow * glowScale.value;
  });

  // Pre-computed glow ring values (fix: no useDerivedValue in JSX)
  const glowX = useDerivedValue(() => cutoutX.value - glowPadding.value);
  const glowY = useDerivedValue(() => cutoutY.value - glowPadding.value);
  const glowWidth = useDerivedValue(() => cutoutWidth.value + glowPadding.value * 2);
  const glowHeight = useDerivedValue(() => cutoutHeight.value + glowPadding.value * 2);
  const glowColor = useDerivedValue(() => {
    const opacity = glowOpacity.value;
    return `rgba(255, 107, 53, ${opacity})`;
  });

  // Canvas opacity for entrance animation
  const canvasOpacity = useDerivedValue(() => entranceOpacity.value);

  // Determine if touch should pass through
  const shouldPassThrough =
    action === 'select_option' ||
    action === 'select_days' ||
    action === 'select_date' ||
    action === 'type_text' ||
    action === 'type_number' ||
    (action === 'click_element' && targetId === 'create-habit-submit') ||
    (action === 'click_element' && targetId === 'create-goal-submit');

  // Animated style for clickable overlay (to match Skia cutout position)
  const clickableAreaStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute' as const,
      left: animatedX.value + PADDING,
      top: animatedY.value + PADDING,
      width: animatedWidth.value - PADDING * 2,
      height: animatedHeight.value - PADDING * 2,
      zIndex: 10001,
    };
  });

  // Animated container style for entrance fade
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: entranceOpacity.value,
    };
  });

  return (
    <Animated.View
      style={[styles.container, containerStyle]}
      pointerEvents={shouldPassThrough ? 'none' : 'box-none'}
    >
      {/* Skia Canvas for high-performance rendering */}
      <Canvas style={styles.canvas}>
        {/* Dark overlay with cutout */}
        <Group>
          {/* Full screen dark overlay */}
          <Rect
            x={0}
            y={0}
            width={screenWidth}
            height={screenHeight}
            color={`rgba(0, 0, 0, ${OVERLAY_OPACITY})`}
          />

          {/* Cutout (clear the spotlight area) */}
          <Group blendMode="dstOut">
            <RoundedRect
              x={cutoutX}
              y={cutoutY}
              width={cutoutWidth}
              height={cutoutHeight}
              r={CORNER_RADIUS}
              color="white"
            >
              <BlurMask blur={BLUR_AMOUNT} style="normal" />
            </RoundedRect>
          </Group>
        </Group>

        {/* Glow ring around spotlight (pulsing) - values defined outside JSX */}
        <RoundedRect
          x={glowX}
          y={glowY}
          width={glowWidth}
          height={glowHeight}
          r={CORNER_RADIUS + 4}
          color={glowColor}
          style="stroke"
          strokeWidth={3}
        >
          <BlurMask blur={4} style="normal" />
        </RoundedRect>

        {/* Inner highlight border */}
        <RoundedRect
          x={cutoutX}
          y={cutoutY}
          width={cutoutWidth}
          height={cutoutHeight}
          r={CORNER_RADIUS}
          color="rgba(255, 255, 255, 0.4)"
          style="stroke"
          strokeWidth={2}
        />
      </Canvas>

      {/* Clickable area for interactions (not for pass-through actions) */}
      {!shouldPassThrough && onTargetPress && (
        <Animated.View style={clickableAreaStyle}>
          <TouchableOpacity
            style={styles.touchable}
            onPress={onTargetPress}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.tapToContinueTutorial')}
            accessibilityHint={t('accessibility.tapToContinueTutorial')}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
  touchable: {
    flex: 1,
  },
});
