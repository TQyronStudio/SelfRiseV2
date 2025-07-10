import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface CompletionAnimationProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
  size?: number;
  color?: string;
}

export const CompletionAnimation: React.FC<CompletionAnimationProps> = ({
  isVisible,
  onAnimationComplete,
  size = 60,
  color = Colors.success,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);

      // Start animation sequence
      Animated.sequence([
        // Fade in and scale up
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 360,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Hold for a moment
        Animated.delay(200),
        // Fade out
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onAnimationComplete?.();
      });
    }
  }, [isVisible, scaleAnim, opacityAnim, rotateAnim, onAnimationComplete]);

  if (!isVisible) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.animationContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: spin },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name="checkmark" size={size * 0.4} color="white" />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  animationContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});