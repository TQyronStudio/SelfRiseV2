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
  DeviceEventEmitter,
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
        // Auto-scroll logic: if target is below viewport, scroll to make it visible
        const scrollNeeded = await ensureTargetVisible(targetId, targetInfo);

        if (scrollNeeded) {
          // If scroll was triggered, don't set spotlight target yet -
          // it will be set by the scroll completion listener
          console.log(`🔄 [TUTORIAL] Waiting for scroll completion before setting spotlight...`);
        } else {
          // No scroll needed, set spotlight target immediately
          setSpotlightTarget(targetInfo);
        }
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

  // Auto-scroll to ensure target is visible in viewport
  const ensureTargetVisible = async (targetId: string, targetInfo: TargetElementInfo): Promise<boolean> => {
    // Get viewport height
    const viewportHeight = Dimensions.get('window').height;
    const safeAreaTop = insets.top;
    const safeAreaBottom = insets.bottom;
    const availableHeight = viewportHeight - safeAreaTop - safeAreaBottom - 200; // Reserve space for tutorial content

    // Check if target is below the visible area (considering safe areas and tutorial content)
    const targetBottom = targetInfo.y + targetInfo.height;
    const visibleAreaTop = safeAreaTop + 100; // Header space

    if (targetInfo.y < visibleAreaTop || targetBottom > availableHeight) {
      console.log(`🔄 Auto-scrolling to make ${targetId} visible...`);

      // Find the main scroll view by getting main-content target
      const mainContentInfo = await tutorialTargetManager.getTargetInfo('main-content');
      if (mainContentInfo) {
        // Calculate scroll position to center the target in viewport
        const scrollY = Math.max(0, targetInfo.y - (availableHeight / 3)); // Position target in upper third

        // Scroll to position - position refresh handled by scroll completion event
        DeviceEventEmitter.emit('tutorial_scroll_to', { y: scrollY, animated: true });
        return true; // Scroll was triggered
      }
    }

    return false; // No scroll needed
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

  // Listen for scroll completion and refresh target positions
  useEffect(() => {
    const scrollCompletedListener = DeviceEventEmitter.addListener(
      'tutorial_scroll_completed',
      async () => {
        if (state.currentStepData?.target && state.currentStepData.type === 'spotlight') {
          console.log(`🔄 [TUTORIAL] Refreshing target position after scroll: ${state.currentStepData.target}`);

          // Get fresh target position
          const refreshedTargetInfo = await tutorialTargetManager.getTargetInfo(state.currentStepData.target);
          if (refreshedTargetInfo) {
            console.log(`✅ [TUTORIAL] Refreshed position:`, refreshedTargetInfo);
            setSpotlightTarget(refreshedTargetInfo);
          }
        }
      }
    );

    return () => {
      scrollCompletedListener.remove();
    };
  }, [state.currentStepData?.target, state.currentStepData?.type]);

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
            zIndex: 99999, // Higher than all modals
          },
        ]}
        pointerEvents={
          state.isActive && state.currentStepData?.action !== 'type_text' ? 'auto' : 'box-none'
        }
      >
        {/* No dark background needed - SpotlightEffect handles its own overlays */}

        {/* Spotlight Effect for spotlight type */}
        {isSpotlight && spotlightTarget && !isLoadingTarget && (
          <SpotlightEffect
            target={spotlightTarget}
            action={state.currentStepData?.action}
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
              state.currentStepData?.action === 'type_text'
                ? styles.contentContainerTop
                : styles.contentContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
              // Dynamic positioning for type_text based on spotlight target
              state.currentStepData?.action === 'type_text' && spotlightTarget && (() => {
                const basePosition = spotlightTarget.y + spotlightTarget.height + 8 +
                                   (spotlightTarget.height * 0.1) + // Account for 110% pulse scale
                                   (isTablet() ? 32 : (getScreenSize() === ScreenSize.SMALL ? 16 : 20));

                // Ensure content doesn't go below safe area
                const maxTop = Dimensions.get('window').height - insets.bottom - 250; // Reserve space for content

                return {
                  top: Math.min(basePosition, maxTop)
                };
              })()
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

              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    {
                      backgroundColor: Colors.primary,
                      width: `${(state.currentStep / state.totalSteps) * 100}%`
                    }
                  ]} />
                </View>
                <Text style={styles.progressText}>Step {state.currentStep} of {state.totalSteps}</Text>
              </View>

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
            currentStep={state.currentStep}
            totalSteps={state.totalSteps}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    bottom: getContentBottomPosition() - 50, // Move down 50px more to be lower
    left: getHorizontalMargin(),
    right: getHorizontalMargin(),
    zIndex: 10000,
  },
  contentContainerTop: {
    position: 'absolute',
    // top is set dynamically based on spotlight target position
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
  progressContainer: {
    width: '100%',
    marginBottom: isTablet() ? 24 : (getScreenSize() === ScreenSize.SMALL ? 16 : 20),
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
    fontSize: scaleFont(12),
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});