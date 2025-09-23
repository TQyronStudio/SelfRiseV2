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
  onTargetPress?: () => void;
}

export const SpotlightEffect: React.FC<SpotlightEffectProps> = ({
  target,
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

  // Create spotlight mask using multiple View components
  const createSpotlightMask = () => {
    const spotlightSize = spotlightRadius * 2;

    return (
      <View style={styles.spotlightContainer}>
        {/* Top overlay */}
        <View
          style={[
            styles.overlayPart,
            {
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: Math.max(0, spotlightCenterY - spotlightRadius),
            },
          ]}
        />

        {/* Bottom overlay */}
        <View
          style={[
            styles.overlayPart,
            {
              top: spotlightCenterY + spotlightRadius,
              left: 0,
              width: SCREEN_WIDTH,
              height: Math.max(0, SCREEN_HEIGHT - (spotlightCenterY + spotlightRadius)),
            },
          ]}
        />

        {/* Left overlay */}
        <View
          style={[
            styles.overlayPart,
            {
              top: Math.max(0, spotlightCenterY - spotlightRadius),
              left: 0,
              width: Math.max(0, spotlightCenterX - spotlightRadius),
              height: spotlightSize,
            },
          ]}
        />

        {/* Right overlay */}
        <View
          style={[
            styles.overlayPart,
            {
              top: Math.max(0, spotlightCenterY - spotlightRadius),
              left: spotlightCenterX + spotlightRadius,
              width: Math.max(0, SCREEN_WIDTH - (spotlightCenterX + spotlightRadius)),
              height: spotlightSize,
            },
          ]}
        />

        {/* Spotlight circle with pulsing effect */}
        <Animated.View
          style={[
            styles.spotlightCircle,
            {
              left: spotlightCenterX - spotlightRadius,
              top: spotlightCenterY - spotlightRadius,
              width: spotlightSize,
              height: spotlightSize,
              borderRadius: spotlightRadius,
              opacity: spotlightOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />

        {/* Target highlight */}
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
        />

        {/* Clickable area */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  spotlightCircle: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  targetHighlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  clickableArea: {
    position: 'absolute',
    zIndex: 10001,
  },
});