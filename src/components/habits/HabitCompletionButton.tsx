import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface HabitCompletionButtonProps {
  isCompleted: boolean;
  isAnimating?: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const HabitCompletionButton: React.FC<HabitCompletionButtonProps> = ({
  isCompleted,
  isAnimating = false,
  onPress,
  disabled = false,
  size = 'medium',
}) => {
  const { colors } = useTheme();

  const sizeConfig = {
    small: { button: 24, icon: 14, circle: 10 },
    medium: { button: 28, icon: 18, circle: 12 },
    large: { button: 36, icon: 22, circle: 16 },
  };

  const config = sizeConfig[size];

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

  const styles = StyleSheet.create({
    completionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.cardBackgroundElevated,
    },
    completionButtonCompleted: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    completionButtonAnimating: {
      opacity: 0.5,
      transform: [{ scale: 0.9 }],
    },
    completionCircle: {
      backgroundColor: colors.border,
    },
  });

  return (
    <TouchableOpacity
      style={[
        styles.completionButton,
        buttonStyle,
        isCompleted && styles.completionButtonCompleted,
        isAnimating && styles.completionButtonAnimating,
      ]}
      onPress={onPress}
      disabled={disabled || isAnimating}
      activeOpacity={0.7}
    >
      {isCompleted ? (
        <Ionicons
          name="checkmark"
          size={config.icon}
          color="white"
        />
      ) : (
        <View style={[styles.completionCircle, circleStyle]} />
      )}
    </TouchableOpacity>
  );
};