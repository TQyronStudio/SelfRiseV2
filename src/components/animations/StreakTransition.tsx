import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface StreakTransitionProps {
  isVisible: boolean;
  transitionType: 'freeze-to-fire' | 'fire-to-freeze';
  onComplete: () => void;
  containerSize?: { width: number; height: number };
}

export const StreakTransition: React.FC<StreakTransitionProps> = ({
  isVisible,
  transitionType,
  onComplete,
  containerSize = { width: 100, height: 80 },
}) => {
  const [phase, setPhase] = useState<'start' | 'crack' | 'melt' | 'steam' | 'ignite' | 'complete'>('start');
  
  // Main transition progress
  const transitionProgress = useSharedValue(0);
  
  // Ice cracking animation
  const crackProgress = useSharedValue(0);
  const crack1 = useSharedValue(0);
  const crack2 = useSharedValue(0);
  const crack3 = useSharedValue(0);
  
  // Melting animation
  const meltProgress = useSharedValue(0);
  
  // Steam animation
  const steamOpacity = useSharedValue(0);
  const steamRise = useSharedValue(0);
  
  // Fire ignition
  const flameHeight = useSharedValue(0);
  const sparkles = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      if (transitionType === 'freeze-to-fire') {
        startFreezeToFireTransition();
      } else {
        startFireToFreezeTransition();
      }
    } else {
      resetAnimation();
    }
  }, [isVisible, transitionType]);

  const startFreezeToFireTransition = () => {
    // Phase 1: Ice cracking (0.5s)
    runOnJS(setPhase)('crack');
    crackProgress.value = withTiming(1, { duration: 500 }, () => {
      // Phase 2: Melting (0.8s)
      runOnJS(setPhase)('melt');
      meltProgress.value = withTiming(1, { duration: 800 }, () => {
        // Phase 3: Steam rising (0.4s)
        runOnJS(setPhase)('steam');
        steamOpacity.value = withTiming(1, { duration: 200 });
        steamRise.value = withTiming(1, { duration: 400 }, () => {
          // Phase 4: Fire ignition (0.8s)
          runOnJS(setPhase)('ignite');
          flameHeight.value = withSequence(
            withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
            withTiming(0.8, { duration: 200 }),
            withTiming(1, { duration: 300 })
          );
          sparkles.value = withTiming(1, { duration: 600 }, () => {
            // Transition complete
            runOnJS(setPhase)('complete');
            runOnJS(onComplete)();
          });
        });
      });
    });

    // Start crack animations with delays
    crack1.value = withDelay(100, withTiming(1, { duration: 300 }));
    crack2.value = withDelay(200, withTiming(1, { duration: 250 }));
    crack3.value = withDelay(300, withTiming(1, { duration: 200 }));
  };

  const startFireToFreezeTransition = () => {
    // Reverse animation: Fire dies → Ice forms
    runOnJS(setPhase)('ignite');
    
    // Fire dies down
    flameHeight.value = withTiming(0, { duration: 600 }, () => {
      // Ice crystals form
      crackProgress.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(setPhase)('complete');
        runOnJS(onComplete)();
      });
    });
  };

  const resetAnimation = () => {
    transitionProgress.value = 0;
    crackProgress.value = 0;
    crack1.value = 0;
    crack2.value = 0;
    crack3.value = 0;
    meltProgress.value = 0;
    steamOpacity.value = 0;
    steamRise.value = 0;
    flameHeight.value = 0;
    sparkles.value = 0;
    setPhase('start');
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: isVisible ? 1 : 0,
  }));

  const crack1Style = useAnimatedStyle(() => ({
    opacity: crack1.value,
    transform: [
      { scaleY: crack1.value },
      { rotate: '15deg' }
    ],
  }));

  const crack2Style = useAnimatedStyle(() => ({
    opacity: crack2.value,
    transform: [
      { scaleY: crack2.value },
      { rotate: '-25deg' }
    ],
  }));

  const crack3Style = useAnimatedStyle(() => ({
    opacity: crack3.value,
    transform: [
      { scaleY: crack3.value },
      { rotate: '45deg' }
    ],
  }));

  const meltStyle = useAnimatedStyle(() => {
    const dropScale = interpolate(meltProgress.value, [0, 0.5, 1], [0, 1.2, 1]);
    const dropY = interpolate(meltProgress.value, [0, 1], [0, 20]);
    
    return {
      opacity: meltProgress.value,
      transform: [
        { scale: dropScale },
        { translateY: dropY }
      ],
    };
  });

  const steamStyle = useAnimatedStyle(() => {
    const steamY = interpolate(steamRise.value, [0, 1], [0, -40]);
    const steamScale = interpolate(steamRise.value, [0, 0.5, 1], [0.5, 1.2, 2]);
    
    return {
      opacity: steamOpacity.value * (1 - steamRise.value * 0.7),
      transform: [
        { translateY: steamY },
        { scale: steamScale }
      ],
    };
  });

  const flameStyle = useAnimatedStyle(() => {
    const flameScale = interpolate(flameHeight.value, [0, 1], [0.2, 1]);
    
    return {
      opacity: flameHeight.value,
      transform: [
        { scaleY: flameHeight.value },
        { scale: flameScale }
      ],
    };
  });

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkles.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle, { ...containerSize }]}>
      {/* Ice cracks */}
      {(phase === 'crack' || phase === 'melt') && (
        <View style={styles.cracksContainer}>
          <Animated.View style={[styles.crack, styles.crack1, crack1Style]} />
          <Animated.View style={[styles.crack, styles.crack2, crack2Style]} />
          <Animated.View style={[styles.crack, styles.crack3, crack3Style]} />
        </View>
      )}

      {/* Melting water drops */}
      {phase === 'melt' && (
        <Animated.View style={[styles.meltDrop, meltStyle]}>
          <LinearGradient
            colors={['rgba(74, 144, 226, 0.8)', 'rgba(130, 177, 235, 0.6)']}
            style={styles.dropGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}

      {/* Steam particles */}
      {phase === 'steam' && (
        <Animated.View style={[styles.steam, steamStyle]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
            style={styles.steamGradient}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      )}

      {/* Fire ignition */}
      {(phase === 'ignite' || phase === 'complete') && (
        <Animated.View style={[styles.flame, flameStyle]}>
          <LinearGradient
            colors={['rgba(255, 69, 0, 0.9)', 'rgba(255, 140, 0, 0.7)', 'rgba(255, 215, 0, 0.4)']}
            style={styles.flameGradient}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      )}

      {/* Sparkles */}
      {phase === 'ignite' && (
        <Animated.View style={[styles.sparkles, sparkleStyle]}>
          <SparkleParticles />
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Sparkle particles for fire ignition
const SparkleParticles: React.FC = () => {
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  const sparkle3 = useSharedValue(0);
  const sparkle4 = useSharedValue(0);

  useEffect(() => {
    sparkle1.value = withDelay(0, withTiming(1, { duration: 600 }));
    sparkle2.value = withDelay(100, withTiming(1, { duration: 500 }));
    sparkle3.value = withDelay(200, withTiming(1, { duration: 400 }));
    sparkle4.value = withDelay(150, withTiming(1, { duration: 550 }));
  }, []);

  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1.value * (1 - sparkle1.value * 0.5),
    transform: [
      { translateX: interpolate(sparkle1.value, [0, 1], [0, -25]) },
      { translateY: interpolate(sparkle1.value, [0, 1], [0, -15]) },
      { scale: interpolate(sparkle1.value, [0, 0.3, 1], [0, 1.2, 0.3]) },
    ],
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2.value * (1 - sparkle2.value * 0.6),
    transform: [
      { translateX: interpolate(sparkle2.value, [0, 1], [0, 30]) },
      { translateY: interpolate(sparkle2.value, [0, 1], [0, -20]) },
      { scale: interpolate(sparkle2.value, [0, 0.2, 1], [0, 1.5, 0.2]) },
    ],
  }));

  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkle3.value * (1 - sparkle3.value * 0.4),
    transform: [
      { translateX: interpolate(sparkle3.value, [0, 1], [0, -10]) },
      { translateY: interpolate(sparkle3.value, [0, 1], [0, -35]) },
      { scale: interpolate(sparkle3.value, [0, 0.4, 1], [0, 1, 0.1]) },
    ],
  }));

  const sparkle4Style = useAnimatedStyle(() => ({
    opacity: sparkle4.value * (1 - sparkle4.value * 0.7),
    transform: [
      { translateX: interpolate(sparkle4.value, [0, 1], [0, 20]) },
      { translateY: interpolate(sparkle4.value, [0, 1], [0, -25]) },
      { scale: interpolate(sparkle4.value, [0, 0.1, 1], [0, 1.3, 0.4]) },
    ],
  }));

  return (
    <View style={styles.sparkleContainer}>
      <Animated.View style={[styles.sparkle, sparkle1Style]} />
      <Animated.View style={[styles.sparkle, sparkle2Style]} />
      <Animated.View style={[styles.sparkle, sparkle3Style]} />
      <Animated.View style={[styles.sparkle, sparkle4Style]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cracksContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  crack: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 1,
    borderRadius: 0.5,
  },
  crack1: {
    height: 40,
    top: '20%',
    left: '30%',
  },
  crack2: {
    height: 35,
    top: '40%',
    right: '25%',
  },
  crack3: {
    height: 25,
    top: '60%',
    left: '60%',
  },
  meltDrop: {
    position: 'absolute',
    width: 8,
    height: 12,
    borderRadius: 4,
    bottom: '10%',
  },
  dropGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  steam: {
    position: 'absolute',
    width: 30,
    height: 40,
    borderRadius: 15,
    bottom: '20%',
  },
  steamGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  flame: {
    position: 'absolute',
    width: 60,
    height: 80,
    borderRadius: 30,
    bottom: '0%',
  },
  flameGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  sparkles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkleContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#FFD700',
    borderRadius: 3,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
});