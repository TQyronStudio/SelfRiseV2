import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Colors } from '@/src/constants/colors';
import { Fonts } from '@/src/constants/fonts';

interface AnimatedStreakNumberProps {
  number: number;
  isFrozen: boolean;
  isTransitioning?: boolean;
  onTransitionComplete?: () => void;
  fontSize?: number;
  style?: any;
}

export const AnimatedStreakNumber: React.FC<AnimatedStreakNumberProps> = ({
  number,
  isFrozen,
  isTransitioning = false,
  onTransitionComplete,
  fontSize = 48,
  style,
}) => {
  // Animation values
  const iceOpacity = useSharedValue(0);
  const fireOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);
  const transitionProgress = useSharedValue(0);

  // Ice breathing effect
  const iceBreathing = useSharedValue(0);
  
  // Fire flickering effect
  const fireFlicker = useSharedValue(0);

  useEffect(() => {
    if (isTransitioning) {
      // Transition animation: Ice → Fire or Fire → Ice
      transitionProgress.value = withTiming(1, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished && onTransitionComplete) {
          runOnJS(onTransitionComplete)();
        }
      });
    } else {
      transitionProgress.value = 0;
    }

    if (isFrozen && !isTransitioning) {
      // Ice state animations
      iceOpacity.value = withTiming(1, { duration: 800 });
      fireOpacity.value = withTiming(0, { duration: 400 });
      
      // Ice breathing effect
      iceBreathing.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      
      // Pulse effect for frozen state
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      
    } else if (!isFrozen && !isTransitioning) {
      // Fire state animations
      fireOpacity.value = withTiming(1, { duration: 800 });
      iceOpacity.value = withTiming(0, { duration: 400 });
      
      // Fire flickering effect
      fireFlicker.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 150, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.7, { duration: 100, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.8, { duration: 120, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
      
      // Fire glow effect
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.9, { duration: 250, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      
      pulseScale.value = 1; // No pulse for fire, just glow
    }
  }, [isFrozen, isTransitioning]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const iceOverlayStyle = useAnimatedStyle(() => {
    const opacity = isTransitioning 
      ? interpolate(transitionProgress.value, [0, 0.3, 0.7, 1], [iceOpacity.value, iceOpacity.value, 0.3, 0])
      : iceOpacity.value;
    
    const breathingScale = 1 + (iceBreathing.value * 0.02);
    
    return {
      opacity,
      transform: [{ scale: breathingScale }],
    };
  });

  const fireOverlayStyle = useAnimatedStyle(() => {
    const opacity = isTransitioning
      ? interpolate(transitionProgress.value, [0, 0.3, 0.7, 1], [fireOpacity.value, 0.2, 0.8, fireOpacity.value])
      : fireOpacity.value * fireFlicker.value;
    
    return {
      opacity,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const glowOpacity = glowIntensity.value;
    const shadowRadius = 20 + (glowOpacity * 30);
    
    return {
      shadowOpacity: glowOpacity * 0.7,
      shadowRadius,
      shadowColor: isFrozen ? '#4A90E2' : '#FF6B35',
    };
  });

  const textStyle = useMemo(() => ({
    fontSize,
    fontFamily: Fonts.bold,
    color: isFrozen ? '#E8F4FD' : '#FFFFFF',
    textAlign: 'center' as const,
    textShadowColor: isFrozen ? 'rgba(74, 144, 226, 0.8)' : 'rgba(255, 107, 53, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: isFrozen ? 8 : 12,
  }), [fontSize, isFrozen]);

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle, glowStyle, style]}>
      {/* Lottie Animation Background */}
      {isFrozen ? (
        <Animated.View style={[styles.lottieContainer, iceOverlayStyle]}>
          <LottieView
            source={require('../../../assets/animations/ice-effect.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
            speed={0.8}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.lottieContainer, fireOverlayStyle]}>
          <LottieView
            source={require('../../../assets/animations/fire-effect.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
            speed={1.2}
          />
        </Animated.View>
      )}

      {/* Main number text */}
      <Text style={textStyle}>{number}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 80,
    position: 'relative',
  },
  lottieContainer: {
    position: 'absolute',
    width: 100,
    height: 80,
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: 100,
    height: 80,
  },
});