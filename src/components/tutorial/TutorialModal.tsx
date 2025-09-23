import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TutorialStep } from '@/src/contexts/TutorialContext';
import { Colors } from '@/src/constants/colors';
import { Fonts } from '@/src/constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialModalProps {
  visible: boolean;
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  visible,
  step,
  onNext,
  onSkip,
}) => {
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Show/hide animations
  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible]);

  const showModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Determine modal type and styling
  const isWelcomeModal = step.id === 'welcome';
  const isCompletionModal = step.id === 'completion';

  const getEmojiForStep = () => {
    if (isWelcomeModal) return '🌟';
    if (isCompletionModal) return '🎊';
    return '✨';
  };

  const getModalColor = () => {
    if (isWelcomeModal) return Colors.primary;
    if (isCompletionModal) return '#4CAF50';
    return Colors.primary;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        />

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalWrapper,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <View style={[styles.modalContent, { borderTopColor: getModalColor() }]}>
            {/* Skip button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Skip tutorial"
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* Emoji */}
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{getEmojiForStep()}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{step.content.title}</Text>

            {/* Content */}
            <Text style={styles.content}>{step.content.content}</Text>

            {/* Progress indicator for welcome modal */}
            {isWelcomeModal && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { backgroundColor: getModalColor() }]} />
                </View>
                <Text style={styles.progressText}>Step 1 of 16</Text>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: getModalColor() }]}
              onPress={onNext}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={step.content.button || 'Continue'}
            >
              <Text style={styles.actionButtonText}>
                {step.content.button || 'Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </TouchableOpacity>

            {/* Additional info for completion modal */}
            {isCompletionModal && (
              <View style={styles.completionInfo}>
                <View style={styles.completionStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={styles.statText}>Tutorial Complete</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="rocket" size={24} color="#FF9800" />
                    <Text style={styles.statText}>Ready to Rise</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    width: Math.min(SCREEN_WIDTH - 40, 400),
    maxWidth: '100%',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderTopWidth: 4,
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  content: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    width: '6.25%', // 1/16 = 6.25%
    borderRadius: 2,
  },
  progressText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.white,
    marginRight: 8,
  },
  completionInfo: {
    marginTop: 24,
    width: '100%',
  },
  completionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
});