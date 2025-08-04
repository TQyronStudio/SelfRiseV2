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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/src/constants';

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
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        false
      );
      
      // Pulse effect for frozen state
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        false
      );
      
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sine) })
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
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.9, { duration: 250, easing: Easing.inOut(Easing.sine) })
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
      {/* Background glow effect */}
      {isFrozen ? (
        <Animated.View style={[styles.iceGlow, iceOverlayStyle]}>
          <LinearGradient
            colors={['rgba(74, 144, 226, 0.3)', 'rgba(130, 177, 235, 0.2)', 'rgba(74, 144, 226, 0.1)']}
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.fireGlow, fireOverlayStyle]}>
          <LinearGradient
            colors={['rgba(255, 107, 53, 0.4)', 'rgba(255, 140, 0, 0.3)', 'rgba(255, 69, 0, 0.2)']}
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}

      {/* Ice crystal overlay */}
      <Animated.View style={[styles.iceOverlay, iceOverlayStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(74, 144, 226, 0.6)', 'rgba(130, 177, 235, 0.4)', 'rgba(173, 216, 230, 0.2)']}
          style={styles.iceGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Ice crystal pattern */}
        <View style={styles.iceCrystals}>
          <View style={[styles.crystal, styles.crystal1]} />
          <View style={[styles.crystal, styles.crystal2]} />
          <View style={[styles.crystal, styles.crystal3]} />
        </View>
      </Animated.View>

      {/* Fire overlay */}
      <Animated.View style={[styles.fireOverlay, fireOverlayStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255, 107, 53, 0.5)', 'rgba(255, 140, 0, 0.3)', 'rgba(255, 215, 0, 0.1)']}
          style={styles.fireGradient}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      {/* Main number text */}
      <Text style={textStyle}>{number}</Text>

      {/* Ice particles overlay */}
      {isFrozen && <IceParticles />}
      
      {/* Fire particles overlay */}
      {!isFrozen && <FireParticles />}
    </Animated.View>
  );
};

// Ice particles component
const IceParticles: React.FC = () => {
  const particle1 = useSharedValue(0);
  const particle2 = useSharedValue(0);
  const particle3 = useSharedValue(0);

  useEffect(() => {
    particle1.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
      -1,
      true
    );
    particle2.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sine) }),
      -1,
      true
    );
    particle3.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.sine) }),
      -1,
      true
    );
  }, []);

  const particle1Style = useAnimatedStyle(() => ({
    opacity: interpolate(particle1.value, [0, 0.5, 1], [0.3, 0.8, 0.3]),
    transform: [
      { translateY: interpolate(particle1.value, [0, 1], [-10, 10]) },
      { translateX: interpolate(particle1.value, [0, 0.5, 1], [-5, 2, -5]) },
    ],
  }));

  const particle2Style = useAnimatedStyle(() => ({
    opacity: interpolate(particle2.value, [0, 0.5, 1], [0.2, 0.6, 0.2]),
    transform: [
      { translateY: interpolate(particle2.value, [0, 1], [5, -8]) },
      { translateX: interpolate(particle2.value, [0, 0.5, 1], [3, -4, 3]) },
    ],
  }));

  const particle3Style = useAnimatedStyle(() => ({
    opacity: interpolate(particle3.value, [0, 0.5, 1], [0.4, 0.9, 0.4]),
    transform: [
      { translateY: interpolate(particle3.value, [0, 1], [-5, 12]) },
      { translateX: interpolate(particle3.value, [0, 0.5, 1], [-8, 6, -8]) },
    ],
  }));

  return (
    <View style={styles.particles}>
      <Animated.View style={[styles.iceParticle, particle1Style]} />
      <Animated.View style={[styles.iceParticle, particle2Style]} />
      <Animated.View style={[styles.iceParticle, particle3Style]} />
    </View>
  );
};

// Fire particles component
const FireParticles: React.FC = () => {
  const ember1 = useSharedValue(0);
  const ember2 = useSharedValue(0);
  const ember3 = useSharedValue(0);

  useEffect(() => {
    ember1.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }),
      -1,
      true
    );
    ember2.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }),
      -1,
      true
    );
    ember3.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1,
      true
    );
  }, []);

  const ember1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ember1.value, [0, 0.3, 1], [0.8, 1, 0]),
    transform: [
      { translateY: interpolate(ember1.value, [0, 1], [0, -30]) },
      { translateX: interpolate(ember1.value, [0, 0.5, 1], [0, 5, -2]) },
      { scale: interpolate(ember1.value, [0, 0.3, 1], [1, 1.2, 0.3]) },
    ],
  }));

  const ember2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ember2.value, [0, 0.4, 1], [0.9, 1, 0]),
    transform: [
      { translateY: interpolate(ember2.value, [0, 1], [0, -25]) },
      { translateX: interpolate(ember2.value, [0, 0.5, 1], [0, -3, 4]) },
      { scale: interpolate(ember2.value, [0, 0.2, 1], [0.8, 1.1, 0.2]) },
    ],
  }));

  const ember3Style = useAnimatedStyle(() => ({
    opacity: interpolate(ember3.value, [0, 0.2, 1], [0.7, 1, 0]),
    transform: [
      { translateY: interpolate(ember3.value, [0, 1], [0, -35]) },
      { translateX: interpolate(ember3.value, [0, 0.5, 1], [0, -6, 1]) },
      { scale: interpolate(ember3.value, [0, 0.1, 1], [1.2, 1.3, 0.1]) },
    ],
  }));

  return (
    <View style={styles.particles}>
      <Animated.View style={[styles.fireParticle, ember1Style]} />
      <Animated.View style={[styles.fireParticle, ember2Style]} />
      <Animated.View style={[styles.fireParticle, ember3Style]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iceGlow: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    borderRadius: 50,
  },
  fireGlow: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    borderRadius: 50,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  iceOverlay: {
    position: 'absolute',
    width: '130%',
    height: '130%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  fireOverlay: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 10,
  },
  iceGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  fireGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  iceCrystals: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  crystal: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1,
  },
  crystal1: {
    width: 2,
    height: 20,
    top: '20%',
    left: '30%',
    transform: [{ rotate: '15deg' }],
  },
  crystal2: {
    width: 2,
    height: 15,
    top: '60%',
    right: '25%',
    transform: [{ rotate: '-30deg' }],
  },
  crystal3: {
    width: 1,
    height: 12,
    top: '40%',
    left: '70%',
    transform: [{ rotate: '45deg' }],
  },
  particles: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    top: '-50%',
    left: '-50%',
  },
  iceParticle: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: 'rgba(173, 216, 230, 0.8)',
    borderRadius: 1.5,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
  fireParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 140, 0, 0.9)',
    borderRadius: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
});