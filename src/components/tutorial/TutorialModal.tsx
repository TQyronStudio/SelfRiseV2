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
import { Fonts } from '@/src/constants/fonts';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
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
  const { colors } = useTheme();
  const { t, currentLanguage } = useI18n();

  // Locale-specific font sizing - German needs smaller fonts due to longer words
  const isGerman = currentLanguage === 'de';
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
    if (isWelcomeModal) return colors.primary;
    if (isCompletionModal) return '#4CAF50';
    return colors.primary;
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
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: isTablet() ? 24 : 20,
      padding: getModalPadding(),
      width: getModalWidth(),
      maxWidth: '100%',
      alignItems: 'center',
      borderTopWidth: isTablet() ? 5 : 4,
    },
    skipButton: {
      position: 'absolute',
      top: getScreenSize() === ScreenSize.SMALL ? 12 : 16,
      right: getScreenSize() === ScreenSize.SMALL ? 12 : 16,
      width: getSkipButtonSize() * 0.8,
      height: getSkipButtonSize() * 0.8,
      borderRadius: (getSkipButtonSize() * 0.8) / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    emojiContainer: {
      width: isTablet() ? 100 : (getScreenSize() === ScreenSize.SMALL ? 70 : 80),
      height: isTablet() ? 100 : (getScreenSize() === ScreenSize.SMALL ? 70 : 80),
      borderRadius: isTablet() ? 50 : (getScreenSize() === ScreenSize.SMALL ? 35 : 40),
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: isTablet() ? 24 : (getScreenSize() === ScreenSize.SMALL ? 16 : 20),
    },
    emoji: {
      fontSize: scaleFont(40),
    },
    title: {
      fontSize: scaleFont(isGerman ? Fonts.sizes.lg : Fonts.sizes.xl),
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: isTablet() ? 20 : (getScreenSize() === ScreenSize.SMALL ? 12 : 16),
      lineHeight: scaleFont(isGerman ? Fonts.sizes.lg : Fonts.sizes.xl) * 1.2,
    },
    content: {
      fontSize: scaleFont(isGerman ? Fonts.sizes.xs : Fonts.sizes.sm),
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: scaleFont(isGerman ? Fonts.sizes.xs : Fonts.sizes.sm) * 1.5,
      marginBottom: isTablet() ? 30 : (getScreenSize() === ScreenSize.SMALL ? 20 : 24),
    },
    progressContainer: {
      width: '100%',
      marginBottom: isTablet() ? 30 : (getScreenSize() === ScreenSize.SMALL ? 20 : 24),
    },
    progressBar: {
      height: isTablet() ? 6 : (getScreenSize() === ScreenSize.SMALL ? 3 : 4),
      backgroundColor: colors.backgroundSecondary,
      borderRadius: isTablet() ? 3 : 2,
      marginBottom: isTablet() ? 12 : (getScreenSize() === ScreenSize.SMALL ? 6 : 8),
    },
    progressFill: {
      height: '100%',
      borderRadius: isTablet() ? 3 : 2,
    },
    progressText: {
      fontSize: scaleFont(Fonts.sizes.xs),
      color: colors.textSecondary,
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
    },
    actionButtonText: {
      fontSize: scaleFont(Fonts.sizes.sm),
      fontWeight: '600',
      color: colors.white,
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
      fontSize: scaleFont(Fonts.sizes.xs),
      color: colors.textSecondary,
      marginTop: isTablet() ? 6 : 4,
      fontWeight: '500',
    },
  });

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
              accessibilityLabel={t('accessibility.skipTutorial')}
            >
              <Ionicons name="close" size={getIconSize(20)} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Emoji */}
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{getEmojiForStep()}</Text>
            </View>

            {/* Title */}
            <Text
              style={styles.title}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {step.content.title}
            </Text>

            {/* Content */}
            <Text
              style={styles.content}
              numberOfLines={6}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {step.content.content}
            </Text>

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
              <Text style={styles.progressText}>{t('tutorial.stepProgress', { current: currentStep, total: totalSteps })}</Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: getModalColor() }]}
              onPress={onNext}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={step.content.button || t('common.continue')}
            >
              <Text style={styles.actionButtonText}>
                {step.content.button || t('common.continue')}
              </Text>
              <Ionicons name="arrow-forward" size={getIconSize(20)} color={colors.white} />
            </TouchableOpacity>

            {/* Additional info for completion modal */}
            {isCompletionModal && (
              <View style={styles.completionInfo}>
                <View style={styles.completionStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={getIconSize(24)} color="#4CAF50" />
                    <Text style={styles.statText}>{t('ui.tutorialComplete')}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="rocket" size={getIconSize(24)} color="#FF9800" />
                    <Text style={styles.statText}>{t('ui.readyToRise')}</Text>
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