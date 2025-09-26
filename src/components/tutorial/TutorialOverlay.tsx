import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTutorial, TUTORIAL_ANIMATIONS } from '@/src/contexts/TutorialContext';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors } from '@/src/constants/colors';
import { Fonts } from '@/src/constants/fonts';
import { SpotlightEffect } from './SpotlightEffect';
import { TutorialModal } from './TutorialModal';
import { tutorialTargetManager, TargetElementInfo } from '@/src/utils/TutorialTargetHelper';
import {
  getContentBottomPosition,
  getCardPadding,
  getHorizontalMargin,
  scaleFont,
  getSkipButtonSize,
  getButtonHeight,
  getIconSize,
  isTablet,
  isLandscape,
  getScreenSize,
  ScreenSize,
  getSafeAreaMultiplier
} from '@/src/utils/responsive';

interface TutorialOverlayProps {
  children: React.ReactNode;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ children }) => {
  const { state, actions } = useTutorial();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  // State
  const [spotlightTarget, setSpotlightTarget] = useState<TargetElementInfo | null>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);

  // Show/hide overlay animations
  useEffect(() => {
    if (state.isActive && state.currentStepData) {
      showOverlay();
    } else {
      hideOverlay();
    }
  }, [state.isActive, state.currentStepData]);

  const showOverlay = () => {
    // Fade in overlay
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: TUTORIAL_ANIMATIONS.overlayFadeIn.duration,
      useNativeDriver: true,
    }).start();

    // Fade in content with slight delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);
  };

  const hideOverlay = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle skip tutorial
  const handleSkip = () => {
    actions.skipTutorial();
  };

  // Handle next step
  const handleNext = () => {
    actions.handleStepAction('next');
  };

  // Get spotlight position for target element
  const updateSpotlightTarget = async (targetId: string) => {
    setIsLoadingTarget(true);

    try {
      // Wait for target to be available and get its position
      const targetInfo = await tutorialTargetManager.waitForTarget(targetId, 10, 100);

      if (targetInfo) {
        setSpotlightTarget(targetInfo);
      } else {
        console.warn(`Failed to get target info for: ${targetId}`);
        setSpotlightTarget(null);
      }
    } catch (error) {
      console.error(`Error updating spotlight target for ${targetId}:`, error);
      setSpotlightTarget(null);
    } finally {
      setIsLoadingTarget(false);
    }
  };

  // Update spotlight when step changes
  useEffect(() => {
    if (state.currentStepData?.target && state.currentStepData.type === 'spotlight') {
      updateSpotlightTarget(state.currentStepData.target);
    } else {
      setSpotlightTarget(null);
      setIsLoadingTarget(false);
    }
  }, [state.currentStepData]);

  // Don't render if tutorial is not active
  if (!state.isActive || !state.currentStepData) {
    return <>{children}</>;
  }

  const isModal = state.currentStepData.type === 'modal';
  const isSpotlight = state.currentStepData.type === 'spotlight';

  return (
    <View style={styles.container}>
      {/* Main App Content */}
      {children}

      {/* Tutorial Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
            zIndex: 9999,
          },
        ]}
        pointerEvents={state.isActive ? 'auto' : 'none'}
      >
        {/* Dark Background */}
        <View style={styles.darkBackground} />

        {/* Spotlight Effect for spotlight type */}
        {isSpotlight && spotlightTarget && !isLoadingTarget && (
          <SpotlightEffect
            target={spotlightTarget}
            onTargetPress={() => {
              if (state.currentStepData?.action === 'click_element') {
                actions.handleStepAction('click_element');
              }
            }}
          />
        )}

        {/* Loading indicator for target detection */}
        {isSpotlight && isLoadingTarget && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('tutorial.loading')}</Text>
          </View>
        )}

        {/* Skip Button - Always visible in top right */}
        <Animated.View
          style={[
            styles.skipButtonContainer,
            {
              top: (insets.top * getSafeAreaMultiplier()) + (isTablet() ? 16 : (getScreenSize() === ScreenSize.SMALL ? 8 : 10)),
              opacity: contentOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Skip tutorial"
          >
            <Ionicons name="close" size={getIconSize(24)} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>

        {/* Tutorial Content */}
        {isSpotlight && (
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <View style={styles.contentCard}>
              {/* Title */}
              <Text style={styles.title}>
                {state.currentStepData.content.title}
              </Text>

              {/* Content */}
              <Text style={styles.content}>
                {state.currentStepData.content.content}
              </Text>

              {/* Next Button - Show when appropriate */}
              {(state.showNext || state.currentStepData.action === 'next') && (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Next step"
                >
                  <Text style={styles.nextButtonText}>
                    {state.currentStepData.content.button || 'Next'}
                  </Text>
                  <Ionicons name="arrow-forward" size={getIconSize(20)} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* Modal Content */}
        {isModal && (
          <TutorialModal
            visible={true}
            step={state.currentStepData}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  darkBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  skipButtonContainer: {
    position: 'absolute',
    right: getHorizontalMargin(),
    zIndex: 10001,
  },
  skipButton: {
    width: getSkipButtonSize(),
    height: getSkipButtonSize(),
    borderRadius: getSkipButtonSize() / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: isTablet() ? 2 : 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contentContainer: {
    position: 'absolute',
    bottom: getContentBottomPosition(),
    left: getHorizontalMargin(),
    right: getHorizontalMargin(),
    zIndex: 10000,
  },
  contentCard: {
    backgroundColor: Colors.white,
    borderRadius: isTablet() ? 20 : (getScreenSize() === ScreenSize.SMALL ? 12 : 16),
    padding: getCardPadding(),
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: isTablet() ? 12 : (getScreenSize() === ScreenSize.SMALL ? 6 : 8),
    },
    shadowOpacity: isTablet() ? 0.35 : 0.3,
    shadowRadius: isTablet() ? 20 : (getScreenSize() === ScreenSize.SMALL ? 12 : 16),
    elevation: isTablet() ? 12 : (getScreenSize() === ScreenSize.SMALL ? 6 : 8),
  },
  title: {
    fontSize: scaleFont(Fonts.sizes.xl),
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: isTablet() ? 16 : (getScreenSize() === ScreenSize.SMALL ? 10 : 12),
    textAlign: 'center',
    lineHeight: scaleFont(Fonts.sizes.xl) * 1.3,
  },
  content: {
    fontSize: scaleFont(Fonts.sizes.md),
    color: Colors.textSecondary,
    lineHeight: scaleFont(Fonts.sizes.md) * 1.5,
    textAlign: 'center',
    marginBottom: isTablet() ? 24 : (getScreenSize() === ScreenSize.SMALL ? 16 : 20),
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: isTablet() ? 16 : (getScreenSize() === ScreenSize.SMALL ? 12 : 14),
    paddingHorizontal: isTablet() ? 32 : (getScreenSize() === ScreenSize.SMALL ? 20 : 24),
    borderRadius: isTablet() ? 12 : (getScreenSize() === ScreenSize.SMALL ? 6 : 8),
    minHeight: getButtonHeight(),
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: isTablet() ? 6 : 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: isTablet() ? 12 : 8,
    elevation: isTablet() ? 6 : 4,
  },
  nextButtonText: {
    fontSize: scaleFont(Fonts.sizes.md),
    fontWeight: '600',
    color: Colors.white,
    marginRight: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10002,
  },
  loadingText: {
    fontSize: scaleFont(Fonts.sizes.md),
    color: Colors.white,
    textAlign: 'center',
  },
});