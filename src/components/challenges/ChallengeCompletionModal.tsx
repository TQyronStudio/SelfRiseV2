// Challenge Completion Celebration Modal - Beautiful celebration when challenges are completed
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  Pressable,
  Animated,
} from 'react-native';
import { Colors } from '@/src/constants/colors';
import { 
  WeeklyChallenge, 
  AchievementCategory, 
  ChallengeCompletionResult 
} from '@/src/types/gamification';

interface ChallengeCompletionModalProps {
  visible: boolean;
  challenge: WeeklyChallenge | null;
  completionResult: ChallengeCompletionResult | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ChallengeCompletionModal: React.FC<ChallengeCompletionModalProps> = ({
  visible,
  challenge,
  completionResult,
  onClose
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const xpCountAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && challenge && completionResult) {
      // Start celebration animations
      startCelebrationAnimation();
    } else {
      // Reset animations when modal closes
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      xpCountAnim.setValue(0);
      confettiAnim.setValue(0);
    }
  }, [visible, challenge, completionResult]);

  const startCelebrationAnimation = () => {
    // Main modal scale-in animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Trophy rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // XP counter animation (delayed)
    setTimeout(() => {
      Animated.timing(xpCountAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    }, 500);

    // Confetti animation
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getCategoryColor = (category: AchievementCategory) => {
    switch (category) {
      case 'habits': return '#22C55E';
      case 'journal': return '#3B82F6';
      case 'goals': return '#F59E0B';
      case 'consistency': return '#8B5CF6';
      case 'mastery': return '#EF4444';
      case 'social': return '#06B6D4';
      case 'special': return '#EC4899';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: AchievementCategory) => {
    switch (category) {
      case 'habits': return '🎯';
      case 'journal': return '📝';
      case 'goals': return '🏆';
      case 'consistency': return '⚡';
      case 'mastery': return '👑';
      case 'social': return '👥';
      case 'special': return '✨';
      default: return '📋';
    }
  };

  const getCelebrationLevel = () => {
    if (!completionResult) return 'normal';
    return completionResult.celebrationLevel;
  };

  const getCelebrationEmoji = () => {
    const level = getCelebrationLevel();
    switch (level) {
      case 'epic': return '🎆🏆✨';
      case 'milestone': return '🎉🌟🎊';
      default: return '🎉🎊';
    }
  };

  const getCelebrationTitle = () => {
    const level = getCelebrationLevel();
    switch (level) {
      case 'epic': return 'EPIC COMPLETION!';
      case 'milestone': return 'MILESTONE ACHIEVED!';
      default: return 'CHALLENGE COMPLETED!';
    }
  };

  const getCelebrationMessage = () => {
    if (!challenge) return '';
    const level = getCelebrationLevel();
    
    switch (level) {
      case 'epic':
        return `You've conquered the ultimate challenge! Your dedication to ${challenge.category} is truly inspiring!`;
      case 'milestone':
        return `Outstanding achievement! You've shown real mastery in ${challenge.category}!`;
      default:
        return `Great job! You've successfully completed "${challenge.title}" and earned valuable experience!`;
    }
  };

  if (!visible || !challenge || !completionResult) {
    return null;
  }

  const categoryColor = getCategoryColor(challenge.category);
  const categoryIcon = getCategoryIcon(challenge.category);
  
  // Animated XP counter
  const animatedXPValue = xpCountAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, completionResult.xpEarned],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: categoryColor + '10',
            },
          ]}
        >
          {/* Confetti Animation */}
          <Animated.View
            style={[
              styles.confettiContainer,
              {
                opacity: confettiAnim,
                transform: [
                  {
                    translateY: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 20],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.confettiText}>{getCelebrationEmoji()}</Text>
          </Animated.View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Trophy Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                { backgroundColor: categoryColor + '20' },
                { transform: [{ rotate: rotation }] },
              ]}
            >
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            </Animated.View>

            {/* Celebration Title */}
            <Text style={[styles.celebrationTitle, { color: categoryColor }]}>
              {getCelebrationTitle()}
            </Text>

            {/* Challenge Title */}
            <Text style={styles.challengeTitle}>"{challenge.title}"</Text>

            {/* Celebration Message */}
            <Text style={styles.celebrationMessage}>
              {getCelebrationMessage()}
            </Text>

            {/* XP Reward */}
            <View style={[styles.xpContainer, { borderColor: categoryColor }]}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>Experience Earned</Text>
                <Text style={[styles.xpDifficulty, { color: categoryColor }]}>
                  {'★'.repeat(challenge.difficultyLevel)} Difficulty
                </Text>
              </View>
              
              <Animated.Text style={[styles.xpAmount, { color: categoryColor }]}>
                +{completionResult.xpEarned} XP
              </Animated.Text>
              
              <Text style={styles.xpDescription}>
                Added to your total experience points!
              </Text>
            </View>

            {/* Achievement Badge (if any) */}
            {completionResult.achievementUnlocked && (
              <View style={styles.achievementBadge}>
                <Text style={styles.achievementIcon}>🏅</Text>
                <Text style={styles.achievementText}>
                  New Achievement Unlocked: {completionResult.achievementUnlocked}
                </Text>
              </View>
            )}

            {/* Close Button */}
            <Pressable
              style={[styles.closeButton, { backgroundColor: categoryColor }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Continue</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: Math.min(screenWidth - 40, 400),
    borderRadius: 24,
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  confettiText: {
    fontSize: 48,
    textAlign: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    alignItems: 'center',
    borderRadius: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  categoryIcon: {
    fontSize: 48,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  celebrationMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  xpContainer: {
    width: '100%',
    padding: 20,
    borderWidth: 2,
    borderRadius: 16,
    marginBottom: 24,
    backgroundColor: '#FAFAFA',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  xpDifficulty: {
    fontSize: 14,
    fontWeight: '600',
  },
  xpAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  xpDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  achievementIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChallengeCompletionModal;