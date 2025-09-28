import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { TUTORIAL_ANIMATIONS } from '@/src/contexts/TutorialContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SpotlightTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpotlightEffectProps {
  target: SpotlightTarget;
  action?: string;
  targetId?: string;
  onTargetPress?: () => void;
}

export const SpotlightEffect: React.FC<SpotlightEffectProps> = ({
  target,
  action,
  targetId,
  onTargetPress,
}) => {
  // Animation values
  const pulseScale = useRef(new Animated.Value(1)).current;
  const spotlightOpacity = useRef(new Animated.Value(0)).current;
  const targetHighlight = useRef(new Animated.Value(0)).current;

  // Start animations when component mounts
  useEffect(() => {
    startAnimations();
    return () => {
      // Clean up animations
      pulseScale.removeAllListeners();
      spotlightOpacity.removeAllListeners();
      targetHighlight.removeAllListeners();
    };
  }, []);

  const startAnimations = () => {
    // Fade in spotlight
    Animated.timing(spotlightOpacity, {
      toValue: 1,
      duration: TUTORIAL_ANIMATIONS.spotlightTransition.duration,
      useNativeDriver: true,
    }).start();

    // Target highlight animation
    Animated.timing(targetHighlight, {
      toValue: 1,
      duration: TUTORIAL_ANIMATIONS.elementHighlight.duration,
      useNativeDriver: true,
    }).start();

    // Pulse animation (infinite)
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.1,
          duration: TUTORIAL_ANIMATIONS.pulseAnimation.duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: TUTORIAL_ANIMATIONS.pulseAnimation.duration / 2,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
  };

  // Calculate spotlight dimensions
  const spotlightRadius = Math.max(target.width, target.height) / 2 + 20;
  const spotlightCenterX = target.x + target.width / 2;
  const spotlightCenterY = target.y + target.height / 2;

  // Spotlight with cut-out overlay - creates light area inside target
  const createSpotlightMask = () => {
    // Add padding to the target area for the cut-out
    const cutoutPadding = 8;
    const cutoutX = target.x - cutoutPadding;
    const cutoutY = target.y - cutoutPadding;
    const cutoutWidth = target.width + (cutoutPadding * 2);
    const cutoutHeight = target.height + (cutoutPadding * 2);

    return (
      <View
        style={styles.spotlightContainer}
        pointerEvents={
          action === 'select_option' ||
          action === 'select_days' ||
          (action === 'click_element' && targetId === 'create-habit-submit')
            ? 'none'
            : 'auto'
        }
      >
        {/* Top overlay - above the target */}
        <View
          style={[
            styles.overlayPart,
            {
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: Math.max(0, cutoutY),
            },
          ]}
        />

        {/* Bottom overlay - below the target */}
        <View
          style={[
            styles.overlayPart,
            {
              top: cutoutY + cutoutHeight,
              left: 0,
              width: SCREEN_WIDTH,
              height: Math.max(0, SCREEN_HEIGHT - (cutoutY + cutoutHeight)),
            },
          ]}
        />

        {/* Left overlay - to the left of target */}
        <View
          style={[
            styles.overlayPart,
            {
              top: cutoutY,
              left: 0,
              width: Math.max(0, cutoutX),
              height: cutoutHeight,
            },
          ]}
        />

        {/* Right overlay - to the right of target */}
        <View
          style={[
            styles.overlayPart,
            {
              top: cutoutY,
              left: cutoutX + cutoutWidth,
              width: Math.max(0, SCREEN_WIDTH - (cutoutX + cutoutWidth)),
              height: cutoutHeight,
            },
          ]}
        />

        {/* Target highlight - pulzující rámeček kolem světlé oblasti */}
        <Animated.View
          style={[
            styles.targetHighlight,
            {
              left: target.x - 4,
              top: target.y - 4,
              width: target.width + 8,
              height: target.height + 8,
              borderRadius: Math.min(target.width, target.height) / 4,
              opacity: targetHighlight,
              transform: [{ scale: pulseScale }],
            },
          ]}
          pointerEvents={
            action === 'select_option' ||
            action === 'select_days' ||
            (action === 'click_element' && targetId === 'create-habit-submit')
              ? 'none'
              : 'auto'
          }
        />

        {/* Clickable area - only for click actions, not for text input, select options, or form submissions */}
        {action !== 'type_text' && action !== 'select_option' && action !== 'select_days' &&
         !(action === 'click_element' && targetId === 'create-habit-submit') && (
          <TouchableOpacity
            style={[
              styles.clickableArea,
              {
                left: target.x,
                top: target.y,
                width: target.width,
                height: target.height,
              },
            ]}
            onPress={onTargetPress}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Tap to continue tutorial"
          />
        )}
      </View>
    );
  };

  return createSpotlightMask();
};

const styles = StyleSheet.create({
  spotlightContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 10000,
  },
  overlayPart: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  targetHighlight: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  clickableArea: {
    position: 'absolute',
    zIndex: 10001,
  },
});