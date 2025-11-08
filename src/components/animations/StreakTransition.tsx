import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

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
  containerSize = { width: 120, height: 100 },
}) => {
  const lottieRef = useRef<LottieView>(null);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 200 });
      // Start Lottie animation
      if (lottieRef.current) {
        lottieRef.current.play();
      }
      // Complete after animation duration (4 seconds)
      timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
        onComplete();
      }, 4000);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      if (lottieRef.current) {
        lottieRef.current.reset();
      }
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isVisible, transitionType, onComplete]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    lottieAnimation: {
      width: '100%',
      height: '100%',
    },
  });

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle, containerSize]}>
      <LottieView
        ref={lottieRef}
        source={require('../../../assets/animations/ice-to-fire-transition.json')}
        loop={false}
        style={styles.lottieAnimation}
        speed={1.0}
      />
    </Animated.View>
  );
};