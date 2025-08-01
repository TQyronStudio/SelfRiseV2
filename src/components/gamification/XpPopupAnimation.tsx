import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions 
} from 'react-native';
import { Colors } from '../../constants/colors';
import { XPSourceType } from '../../types/gamification';

const { height: screenHeight } = Dimensions.get('window');

interface XpPopupAnimationProps {
  visible: boolean;
  amount: number;
  source: XPSourceType;
  position?: { x: number; y: number };
  onAnimationComplete?: () => void;
}

export const XpPopupAnimation: React.FC<XpPopupAnimationProps> = ({
  visible,
  amount,
  source,
  position = { x: 0, y: 0 },
  onAnimationComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Get source-specific colors and icons
  const getSourceStyle = () => {
    switch (source) {
      case XPSourceType.HABIT_COMPLETION:
      case XPSourceType.HABIT_BONUS:
        return {
          color: '#4CAF50',
          icon: '🏃‍♂️',
          shadowColor: '#4CAF50',
        };
      case XPSourceType.JOURNAL_ENTRY:
      case XPSourceType.JOURNAL_BONUS:
        return {
          color: '#2196F3',
          icon: '📝',
          shadowColor: '#2196F3',
        };
      case XPSourceType.GOAL_PROGRESS:
      case XPSourceType.GOAL_COMPLETION:
        return {
          color: '#FF9800',
          icon: '🎯',
          shadowColor: '#FF9800',
        };
      case XPSourceType.HABIT_STREAK_MILESTONE:
      case XPSourceType.JOURNAL_STREAK_MILESTONE:
        return {
          color: '#9C27B0',
          icon: '🔥',
          shadowColor: '#9C27B0',
        };
      case XPSourceType.ACHIEVEMENT_UNLOCK:
        return {
          color: '#FFD700',
          icon: '🏆',
          shadowColor: '#FFD700',
        };
      default:
        return {
          color: Colors.primary,
          icon: '✨',
          shadowColor: Colors.primary,
        };
    }
  };

  const sourceStyle = getSourceStyle();

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      translateYAnim.setValue(0);
      scaleAnim.setValue(0.8);

      // Start animation sequence
      Animated.sequence([
        // Fade in and scale up quickly
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Float up while fading out
        Animated.parallel([
          Animated.timing(translateYAnim, {
            toValue: -60,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            delay: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (finished && onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
  }, [visible, fadeAnim, translateYAnim, scaleAnim, onAnimationComplete]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
            { translateX: position.x },
          ],
          top: position.y,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.popup, { shadowColor: sourceStyle.shadowColor }]}>
        <Text style={styles.icon}>{sourceStyle.icon}</Text>
        <Text style={[styles.xpText, { color: sourceStyle.color }]}>
          +{amount} XP
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  popup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});