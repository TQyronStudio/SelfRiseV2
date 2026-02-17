// Monthly Challenge Milestone Modal - Celebration for 25%, 50%, 75% milestones
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { useXpAnimation } from '@/src/contexts/XpAnimationContext';

const { width: screenWidth } = Dimensions.get('window');

interface MonthlyChallengeMilestoneModalProps {
  visible: boolean;
  milestone: 25 | 50 | 75;
  challengeTitle: string;
  xpAwarded: number;
  onClose: () => void;
}

const MonthlyChallengeMilestoneModal: React.FC<MonthlyChallengeMilestoneModalProps> = ({
  visible,
  milestone,
  challengeTitle,
  xpAwarded,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { notifyMonthlyChallengeModalStarted, notifyMonthlyChallengeModalEnded } = useXpAnimation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 4-Tier Modal Priority System Integration (Tier 2)
  useEffect(() => {
    if (visible) {
      notifyMonthlyChallengeModalStarted();
    }
    return () => {
      if (!visible) {
        notifyMonthlyChallengeModalEnded();
      }
    };
  }, [visible, notifyMonthlyChallengeModalStarted, notifyMonthlyChallengeModalEnded]);

  const getMilestoneConfig = () => {
    switch (milestone) {
      case 25:
        return { emoji: '🌱', color: '#4CAF50' };
      case 50:
        return { emoji: '🔥', color: '#FF9800' };
      case 75:
        return { emoji: '🚀', color: '#9C27B0' };
      default:
        return { emoji: '🎯', color: '#2196F3' };
    }
  };

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: milestone / 100,
          duration: 800,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      progressAnim.setValue(0);
    }
  }, [visible, milestone]);

  if (!visible) return null;

  const config = getMilestoneConfig();

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const styles = createStyles(colors, config.color);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] },
          ]}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={t('monthlyChallenge.milestone.accessibility', {
            milestone,
            title: challengeTitle,
          })}
        >
          {/* Emoji */}
          <Text style={styles.emoji}>{config.emoji}</Text>

          {/* Title */}
          <Text style={styles.title}>
            {t('monthlyChallenge.milestone.title', { milestone })}
          </Text>

          {/* Challenge name */}
          <Text style={styles.challengeTitle}>{challengeTitle}</Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[styles.progressBar, { width: progressWidth }]}
            />
            <Text style={styles.progressLabel}>{milestone}%</Text>
          </View>

          {/* XP reward */}
          {xpAwarded > 0 && (
            <View style={styles.xpContainer}>
              <Text style={styles.xpText}>+{xpAwarded} XP</Text>
              <Text style={styles.xpLabel}>
                {t('monthlyChallenge.milestone.xpBonus')}
              </Text>
            </View>
          )}

          {/* Motivation */}
          <Text style={styles.motivation}>
            {t(`monthlyChallenge.milestone.motivation_${milestone}`)}
          </Text>

          {/* Close button */}
          <Pressable
            style={styles.button}
            onPress={onClose}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('common.continue')}
          >
            <Text style={styles.buttonText}>
              {t('common.continue')}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (colors: any, accentColor: string) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 28,
      width: Math.min(screenWidth - 48, 360),
      alignItems: 'center',
      borderWidth: 2,
      borderColor: accentColor,
    },
    emoji: {
      fontSize: 48,
      marginBottom: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: accentColor,
      textAlign: 'center',
      marginBottom: 4,
    },
    challengeTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    progressContainer: {
      width: '100%',
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      marginBottom: 20,
      overflow: 'hidden',
      position: 'relative',
    },
    progressBar: {
      height: '100%',
      backgroundColor: accentColor,
      borderRadius: 6,
    },
    progressLabel: {
      position: 'absolute',
      right: 8,
      top: -18,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    xpContainer: {
      backgroundColor: accentColor + '20',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginBottom: 16,
    },
    xpText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: accentColor,
    },
    xpLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    motivation: {
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
    },
    button: {
      backgroundColor: accentColor,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
  });

export default MonthlyChallengeMilestoneModal;
