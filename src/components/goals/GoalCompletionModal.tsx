import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Goal } from '../../types/goal';
import { useTheme } from '../../contexts/ThemeContext';
import { Fonts } from '../../constants/fonts';
import { Layout } from '../../constants/dimensions';
import { useI18n } from '../../hooks/useI18n';
import { useXpAnimation } from '../../contexts/XpAnimationContext';
import { XP_REWARDS } from '../../constants/gamification';

interface GoalCompletionModalProps {
  visible: boolean;
  goal: Goal;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function GoalCompletionModal({ visible, goal, onClose }: GoalCompletionModalProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { notifyPrimaryModalStarted, notifyPrimaryModalEnded } = useXpAnimation();

  // Modal priority coordination - goal completion is a PRIMARY modal
  useEffect(() => {
    if (visible) {
      notifyPrimaryModalStarted('goal');
    }
  }, [visible, notifyPrimaryModalStarted]);

  const handleClose = () => {
    notifyPrimaryModalEnded(); // Release coordination lock to allow level-up modals
    onClose();
  };

  const getCelebrationEmoji = () => {
    // Different emojis based on goal category
    switch (goal.category) {
      case 'health':
        return '💪';
      case 'learning':
        return '🎓';
      case 'career':
        return '🚀';
      case 'financial':
        return '💰';
      case 'personal':
        return '✨';
      default:
        return '🎉';
    }
  };

  const getCompletionMessage = () => {
    const messages = [
      t('goals.completion.message1'),
      t('goals.completion.message2'),
      t('goals.completion.message3'),
      t('goals.completion.message4'),
      t('goals.completion.message5'),
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    modal: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      maxWidth: screenWidth * 0.85,
      width: '100%',
    },
    emojiContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.success,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emoji: {
      fontSize: 32,
    },
    title: {
      fontSize: 24,
      fontFamily: Fonts.bold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontSize: 16,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    goalInfo: {
      alignItems: 'center',
      marginBottom: 24,
    },
    goalTitle: {
      fontSize: 18,
      fontFamily: Fonts.semibold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    goalProgress: {
      fontSize: 16,
      fontFamily: Fonts.medium,
      color: colors.success,
      textAlign: 'center',
    },
    xpRewardContainer: {
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    xpRewardText: {
      fontSize: 20,
      fontFamily: Fonts.bold,
      color: colors.primary,
      marginBottom: 4,
    },
    xpRewardLabel: {
      fontSize: 12,
      fontFamily: Fonts.medium,
      color: colors.primary,
      opacity: 0.8,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: 24,
    },
    statItem: {
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      minWidth: 100,
    },
    statValue: {
      fontSize: 18,
      fontFamily: Fonts.bold,
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
    },
    button: {
      backgroundColor: colors.success,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 8,
      minWidth: 120,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontFamily: Fonts.semibold,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{getCelebrationEmoji()}</Text>
          </View>
          
          <Text style={styles.title}>{t('goals.completion.title')}</Text>
          <Text style={styles.message}>{getCompletionMessage()}</Text>
          
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalProgress}>
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </Text>
          </View>

          {/* XP Reward Display */}
          <View style={styles.xpRewardContainer}>
            <Text style={styles.xpRewardText}>+{XP_REWARDS.GOALS.GOAL_COMPLETION} XP</Text>
            <Text style={styles.xpRewardLabel}>{t('goals.completion.bonus')}</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>{t('goals.completion.statusComplete')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{goal.completedDate}</Text>
              <Text style={styles.statLabel}>{t('goals.completion.statusCompleted')}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>{t('goals.completion.continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}