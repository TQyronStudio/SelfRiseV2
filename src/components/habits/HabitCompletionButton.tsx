import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';

interface HabitCompletionButtonProps {
  isCompleted: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const HabitCompletionButton: React.FC<HabitCompletionButtonProps> = ({
  isCompleted,
  onPress,
  disabled = false,
  size = 'medium',
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();

  const sizeConfig = {
    small: { button: 24, icon: 14, circle: 10 },
    medium: { button: 28, icon: 18, circle: 12 },
    large: { button: 36, icon: 22, circle: 16 },
  };
  const config = sizeConfig[size];

  // Extract theme colors outside worklet scope (interpolateColor requires hex/rgb)
  const uncompletedBg = colors.cardBackgroundElevated;
  const completedBg = colors.success;
  const uncompletedBorder = colors.border;
  const completedBorder = colors.success;
  const circleColor = colors.border;

  // Shared values
  const scale = useSharedValue(1);
  const completionProgress = useSharedValue(isCompleted ? 1 : 0);

  // Sync completionProgress with isCompleted prop
  useEffect(() => {
    const target = isCompleted ? 1 : 0;
    if (reducedMotion) {
      completionProgress.value = target;
    } else {
      completionProgress.value = withSpring(target, {
        damping: 15,
        stiffness: 200,
      });
    }
  }, [isCompleted, reducedMotion, completionProgress]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      completionProgress.value,
      [0, 1],
      [uncompletedBg, completedBg]
    ),
    borderColor: interpolateColor(
      completionProgress.value,
      [0, 1],
      [uncompletedBorder, completedBorder]
    ),
  }));

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: completionProgress.value,
    transform: [{ scale: completionProgress.value }],
  }));

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - completionProgress.value,
  }));

  const handlePressIn = () => {
    if (!disabled) {
      Haptics.selectionAsync().catch(() => {}); // silently fail on unsupported devices
    }
    if (!reducedMotion) {
      scale.value = withTiming(0.92, { duration: 80 });
    }
  };

  const handlePressOut = () => {
    if (!reducedMotion) {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }
  };

  const buttonStyle = {
    width: config.button,
    height: config.button,
    borderRadius: config.button / 2,
  };

  const circleStyle = {
    width: config.circle,
    height: config.circle,
    borderRadius: config.circle / 2,
  };

  const accessibilityLabel = isCompleted
    ? t('habits.accessibility.markIncomplete') || 'Mark habit as incomplete'
    : t('habits.accessibility.markComplete') || 'Mark habit as complete';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isCompleted, disabled }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[
          styles.completionButton,
          buttonStyle,
          buttonAnimatedStyle,
        ]}
      >
        {/* Checkmark — fades in at completionProgress=1 */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, checkmarkAnimatedStyle]}>
          <Ionicons name="checkmark" size={config.icon} color="white" />
        </Animated.View>

        {/* Empty circle — fades out at completionProgress=1 */}
        <Animated.View
          style={[
            styles.center,
            StyleSheet.absoluteFill,
            circleAnimatedStyle,
          ]}
        >
          <Animated.View
            style={[
              circleStyle,
              { backgroundColor: circleColor },
            ]}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  completionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
