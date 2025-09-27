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
import {
  getModalWidth,
  getModalPadding,
  getHorizontalMargin,
  scaleFont,
  getSkipButtonSize,
  getButtonHeight,
  getIconSize,
  isTablet,
  isLandscape,
  getScreenSize,
  ScreenSize
} from '@/src/utils/responsive';

interface TutorialModalProps {
  visible: boolean;
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  visible,
  step,
  currentStep,
  totalSteps,
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
              <Ionicons name="close" size={getIconSize(20)} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* Emoji */}
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{getEmojiForStep()}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{step.content.title}</Text>

            {/* Content */}
            <Text style={styles.content}>{step.content.content}</Text>

            {/* Progress indicator for all modal steps */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  {
                    backgroundColor: getModalColor(),
                    width: `${(currentStep / totalSteps) * 100}%`
                  }
                ]} />
              </View>
              <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
            </View>

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
              <Ionicons name="arrow-forward" size={getIconSize(20)} color={Colors.white} />
            </TouchableOpacity>

            {/* Additional info for completion modal */}
            {isCompletionModal && (
              <View style={styles.completionInfo}>
                <View style={styles.completionStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={getIconSize(24)} color="#4CAF50" />
                    <Text style={styles.statText}>Tutorial Complete</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="rocket" size={getIconSize(24)} color="#FF9800" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getHorizontalMargin(),
    width: '100%',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: isTablet() ? 24 : 20,
    padding: getModalPadding(),
    width: getModalWidth(),
    maxWidth: '100%',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: isTablet() ? 12 : 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: isTablet() ? 24 : 20,
    elevation: isTablet() ? 12 : 10,
    borderTopWidth: isTablet() ? 5 : 4,
  },
  skipButton: {
    position: 'absolute',
    top: getScreenSize() === ScreenSize.SMALL ? 12 : 16,
    right: getScreenSize() === ScreenSize.SMALL ? 12 : 16,
    width: getSkipButtonSize() * 0.8, // Slightly smaller for modal
    height: getSkipButtonSize() * 0.8,
    borderRadius: (getSkipButtonSize() * 0.8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  emojiContainer: {
    width: isTablet() ? 100 : (getScreenSize() === ScreenSize.SMALL ? 70 : 80),
    height: isTablet() ? 100 : (getScreenSize() === ScreenSize.SMALL ? 70 : 80),
    borderRadius: isTablet() ? 50 : (getScreenSize() === ScreenSize.SMALL ? 35 : 40),
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isTablet() ? 24 : (getScreenSize() === ScreenSize.SMALL ? 16 : 20),
  },
  emoji: {
    fontSize: scaleFont(40),
  },
  title: {
    fontSize: scaleFont(Fonts.sizes.xxl),
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: isTablet() ? 20 : (getScreenSize() === ScreenSize.SMALL ? 12 : 16),
    lineHeight: scaleFont(Fonts.sizes.xxl) * 1.2,
  },
  content: {
    fontSize: scaleFont(Fonts.sizes.md),
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: scaleFont(Fonts.sizes.md) * 1.5,
    marginBottom: isTablet() ? 30 : (getScreenSize() === ScreenSize.SMALL ? 20 : 24),
  },
  progressContainer: {
    width: '100%',
    marginBottom: isTablet() ? 30 : (getScreenSize() === ScreenSize.SMALL ? 20 : 24),
  },
  progressBar: {
    height: isTablet() ? 6 : (getScreenSize() === ScreenSize.SMALL ? 3 : 4),
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: isTablet() ? 3 : 2,
    marginBottom: isTablet() ? 12 : (getScreenSize() === ScreenSize.SMALL ? 6 : 8),
  },
  progressFill: {
    height: '100%',
    borderRadius: isTablet() ? 3 : 2,
  },
  progressText: {
    fontSize: scaleFont(Fonts.sizes.sm),
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet() ? 18 : (getScreenSize() === ScreenSize.SMALL ? 14 : 16),
    paddingHorizontal: isTablet() ? 40 : (getScreenSize() === ScreenSize.SMALL ? 24 : 32),
    borderRadius: isTablet() ? 16 : (getScreenSize() === ScreenSize.SMALL ? 10 : 12),
    minWidth: isTablet() ? 240 : (getScreenSize() === ScreenSize.SMALL ? 160 : 200),
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: isTablet() ? 6 : 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: isTablet() ? 12 : 8,
    elevation: isTablet() ? 6 : 4,
  },
  actionButtonText: {
    fontSize: scaleFont(Fonts.sizes.md),
    fontWeight: '600',
    color: Colors.white,
    marginRight: 8,
  },
  completionInfo: {
    marginTop: isTablet() ? 32 : (getScreenSize() === ScreenSize.SMALL ? 20 : 24),
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
    fontSize: scaleFont(Fonts.sizes.sm),
    color: Colors.textSecondary,
    marginTop: isTablet() ? 6 : 4,
    fontWeight: '500',
  },
});