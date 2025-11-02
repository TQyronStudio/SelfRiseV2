import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface DailyProgressBarProps {
  completed: number;
  total: number;
  showPercentage?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export const DailyProgressBar: React.FC<DailyProgressBarProps> = ({
  completed,
  total,
  showPercentage = true,
  height = 8,
  color,
  backgroundColor,
  animated = true,
}) => {
  const { colors } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const percentage = total > 0 ? (completed / total) * 100 : 0;

  useEffect(() => {
    let animationRef: Animated.CompositeAnimation | null = null;

    if (animated) {
      animationRef = Animated.timing(progressAnim, {
        toValue: percentage,
        duration: 800,
        useNativeDriver: false,
      });
      animationRef.start();
    } else {
      progressAnim.setValue(percentage);
    }

    // Cleanup function to stop animation if component unmounts
    return () => {
      if (animationRef) {
        animationRef.stop();
      }
    };
  }, [percentage, animated, progressAnim]);

  const animatedWidth = animated
    ? progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
      })
    : `${percentage}%`;

  const getProgressColor = () => {
    if (percentage === 100) return colors.success;
    if (percentage >= 75) return colors.primary;
    if (percentage >= 50) return colors.warning;
    return colors.error;
  };

  const progressColor = color || getProgressColor();
  const bgColor = backgroundColor || colors.border;

  const styles = StyleSheet.create({
    container: {
      width: '100%',
    },
    progressBar: {
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      borderRadius: 4,
      minWidth: 2, // Ensure some visual feedback even for very small progress
    },
    textContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    progressText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    percentageText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={[styles.progressBar, { height, backgroundColor: bgColor }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: animatedWidth as any,
              backgroundColor: progressColor,
              height,
            },
          ]}
        />
      </View>

      {showPercentage && (
        <View style={styles.textContainer}>
          <Text style={[styles.progressText, { color: progressColor }]}>
            {completed} of {total} completed
          </Text>
          <Text style={[styles.percentageText, { color: progressColor }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      )}
    </View>
  );
};