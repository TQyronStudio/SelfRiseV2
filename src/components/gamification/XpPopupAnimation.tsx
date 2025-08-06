import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  AccessibilityInfo 
} from 'react-native';
import { Colors } from '../../constants/colors';
import { XPSourceType } from '../../types/gamification';
import { useI18n } from '../../hooks/useI18n';

// const { height: screenHeight } = Dimensions.get('window'); // Unused

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
  const { t } = useI18n();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Get source-specific colors and icons
  const getSourceStyle = () => {
    // For negative amounts, use red colors regardless of source
    if (amount < 0) {
      return {
        color: '#F44336',
        icon: '💸',
        shadowColor: '#F44336',
      };
    }

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

  // Generate accessibility announcement
  const getAccessibilityAnnouncement = (): string => {
    const sourceName = (() => {
      switch (source) {
        case XPSourceType.HABIT_COMPLETION:
          return t('gamification.sources.habit_completion') || 'habit completion';
        case XPSourceType.HABIT_BONUS:
          return t('gamification.sources.habit_bonus') || 'habit bonus';
        case XPSourceType.JOURNAL_ENTRY:
          return t('gamification.sources.journal_entry') || 'journal entry';
        case XPSourceType.JOURNAL_BONUS:
          return t('gamification.sources.journal_bonus') || 'journal bonus';
        case XPSourceType.GOAL_PROGRESS:
          return t('gamification.sources.goal_progress') || 'goal progress';
        case XPSourceType.GOAL_COMPLETION:
          return t('gamification.sources.goal_completion') || 'goal completion';
        case XPSourceType.HABIT_STREAK_MILESTONE:
          return t('gamification.sources.habit_streak_milestone') || 'habit streak milestone';
        case XPSourceType.JOURNAL_STREAK_MILESTONE:
          return t('gamification.sources.journal_streak_milestone') || 'journal streak milestone';
        case XPSourceType.ACHIEVEMENT_UNLOCK:
          return t('gamification.sources.achievement_unlock') || 'achievement unlock';
        default:
          return t('gamification.sources.general_activity') || 'activity';
      }
    })();

    if (amount >= 0) {
      return t('gamification.xp.popup.gained', { amount, source: sourceName }) || 
             `Gained ${amount} experience points from ${sourceName}`;
    } else {
      return t('gamification.xp.popup.lost', { amount: Math.abs(amount), source: sourceName }) || 
             `Lost ${Math.abs(amount)} experience points from ${sourceName}`;
    }
  };

  // Announce to screen readers when popup becomes visible
  useEffect(() => {
    if (visible) {
      const announcement = getAccessibilityAnnouncement();
      // Only announce for meaningful amounts (to avoid spam for small changes)
      if (Math.abs(amount) >= 5) {
        AccessibilityInfo.announceForAccessibility(announcement);
      }
    }
  }, [visible, amount, source]);

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      translateYAnim.setValue(0);
      scaleAnim.setValue(0.5);

      // Start improved animation sequence with better easing
      Animated.sequence([
        // Bounce in effect with spring animation
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.15,
            damping: 8,
            mass: 1,
            stiffness: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        
        // Brief pause at full scale
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 100,
          useNativeDriver: true,
        }),
        
        // Smooth float up with gentle fade out
        Animated.parallel([
          Animated.timing(translateYAnim, {
            toValue: -80,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 900,
            delay: 300,
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

  const accessibilityLabel = getAccessibilityAnnouncement();

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
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      importantForAccessibility={Math.abs(amount) >= 5 ? "yes" : "no-hide-descendants"}
    >
      <View 
        style={[styles.popup, { shadowColor: sourceStyle.shadowColor }]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
      >
        <Text 
          style={styles.icon}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel={t(`gamification.sources.${source}.icon_description`) || `${sourceStyle.icon} icon representing the activity type`}
        >
          {sourceStyle.icon}
        </Text>
        <Text 
          style={[styles.xpText, { color: sourceStyle.color }]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={t('gamification.xp.popup.amount_label', { 
            amount: Math.abs(amount),
            sign: amount >= 0 ? 'plus' : 'minus'
          }) || `${amount >= 0 ? 'Plus' : 'Minus'} ${Math.abs(amount)} experience points`}
        >
          {amount >= 0 ? '+' : ''}{amount} XP
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
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
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