import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Goal } from '../../types/goal';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { Layout } from '../../constants/dimensions';
import { useI18n } from '../../hooks/useI18n';

interface GoalCompletionModalProps {
  visible: boolean;
  goal: Goal;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function GoalCompletionModal({ visible, goal, onClose }: GoalCompletionModalProps) {
  const { t } = useI18n();

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
      'Congratulations! You\'ve achieved your goal!',
      'Amazing work! Goal completed successfully!',
      'Fantastic! You\'ve reached your target!',
      'Well done! Your dedication paid off!',
      'Excellent! Another goal conquered!',
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

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
          
          <Text style={styles.title}>Goal Completed!</Text>
          <Text style={styles.message}>{getCompletionMessage()}</Text>
          
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalProgress}>
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{goal.completedDate}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: screenWidth * 0.85,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  goalProgress: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.success,
    textAlign: 'center',
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
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    minWidth: 100,
  },
  statValue: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  button: {
    backgroundColor: Colors.success,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.semibold,
  },
});