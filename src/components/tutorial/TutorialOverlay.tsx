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
  Keyboard,
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
  const [isScrollInProgress, setIsScrollInProgress] = useState(false);

  // Show/hide overlay animations
  useEffect(() => {
    if (state.isActive && state.currentStepData) {
      // Don't show overlay content immediately if scroll might be needed
      // The overlay will be shown after target positioning is determined
      if (!isScrollInProgress) {
        showOverlay();
      }
    } else {
      hideOverlay();
    }
  }, [state.isActive, state.currentStepData, isScrollInProgress]);

  const showOverlay = () => {
    // Fade in overlay faster for smoother transitions
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 150, // Reduced from TUTORIAL_ANIMATIONS.overlayFadeIn.duration
      useNativeDriver: true,
    }).start();

    // Fade in content with minimal delay for modal-to-modal transitions
    const contentDelay = state.currentStepData?.id === 'habit-name' ? 50 : 80; // Faster for modal steps
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 150, // Reduced from 200
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 150, // Reduced from 200
          useNativeDriver: true,
        }),
      ]).start();
    }, contentDelay);
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
          console.log(`🔄 [TUTORIAL] Auto-scroll needed for ${targetId}, delaying overlay...`);
          setIsScrollInProgress(true);
          // Hide any current overlay content during scroll
          hideOverlay();
        } else {
          // No scroll needed, set spotlight target immediately and show overlay
          console.log(`✅ [TUTORIAL] No scroll needed for ${targetId}, showing overlay immediately`);
          setSpotlightTarget(targetInfo);
          setIsScrollInProgress(false);
          // Trigger overlay animation if not already shown
          if (state.isActive && state.currentStepData) {
            showOverlay();
          }
        }
      } else {
        console.warn(`Failed to get target info for: ${targetId}`);
        setSpotlightTarget(null);
        setIsScrollInProgress(false);
      }
    } catch (error) {
      console.error(`Error updating spotlight target for ${targetId}:`, error);
      setSpotlightTarget(null);
      setIsScrollInProgress(false);
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

    // For type_text actions, reserve more space at top and bottom for tutorial content and keyboard
    const isTypeText = state.currentStepData?.action === 'type_text';
    const topReserve = isTypeText ? 150 : 100; // More space for tutorial text at top
    const bottomReserve = isTypeText ? 350 : 200; // More space for keyboard

    const visibleAreaTop = safeAreaTop + topReserve;
    const visibleAreaBottom = viewportHeight - safeAreaBottom - bottomReserve;

    const targetTop = targetInfo.y;
    const targetBottom = targetInfo.y + targetInfo.height;

    console.log(`🔍 [TUTORIAL] Checking visibility for ${targetId}:`);
    console.log(`   Target: ${targetTop}-${targetBottom}, Visible area: ${visibleAreaTop}-${visibleAreaBottom}`);

    // Check if target is outside visible area
    if (targetTop < visibleAreaTop || targetBottom > visibleAreaBottom) {
      console.log(`🔄 [TUTORIAL] Auto-scrolling to make ${targetId} visible...`);

      // Find the main scroll view by getting main-content target
      const mainContentInfo = await tutorialTargetManager.getTargetInfo('main-content');
      if (mainContentInfo) {
        // Calculate scroll position to center the target in viewport
        const targetCenter = targetTop + (targetInfo.height / 2);
        const viewportCenter = (visibleAreaTop + visibleAreaBottom) / 2;
        const scrollOffset = targetCenter - viewportCenter;
        const scrollY = Math.max(0, scrollOffset);

        console.log(`📜 [TUTORIAL] Scrolling to Y: ${scrollY} (target center: ${targetCenter}, viewport center: ${viewportCenter})`);

        // Scroll to position - position refresh handled by scroll completion event
        DeviceEventEmitter.emit('tutorial_scroll_to', { y: scrollY, animated: true });
        return true; // Scroll was triggered
      }
    }

    console.log(`✅ [TUTORIAL] Target ${targetId} is already visible, no scroll needed`);
    return false; // No scroll needed
  };

  // Update spotlight when step changes
  useEffect(() => {
    // Immediately clear previous spotlight to prevent visual glitch
    setSpotlightTarget(null);
    setIsLoadingTarget(false);
    setIsScrollInProgress(false);

    if (state.currentStepData?.target && state.currentStepData.type === 'spotlight') {
      // Minimize delay for smoother transitions - especially for modal-to-modal steps
      const delay = state.currentStepData.id === 'habit-name' ? 100 : 50; // Slightly longer for modal content
      setTimeout(() => {
        console.log(`🎯 [TUTORIAL] Updating spotlight for step: ${state.currentStepData.id} (target: ${state.currentStepData.target})`);
        updateSpotlightTarget(state.currentStepData.target);
      }, delay);
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

            // Scroll is complete, now show overlay with correct positioning
            setIsScrollInProgress(false);
            if (state.isActive && state.currentStepData) {
              console.log(`🎭 [TUTORIAL] Showing overlay after scroll completion`);
              showOverlay();
            }
          }
        }
      }
    );

    return () => {
      scrollCompletedListener.remove();
    };
  }, [state.currentStepData?.target, state.currentStepData?.type, state.isActive, state.currentStepData]);

  // Hide keyboard when transitioning from text input steps to other steps
  useEffect(() => {
    if (state.currentStepData) {
      // If previous step was type_text and current step is not, hide keyboard
      if (state.currentStepData.action !== 'type_text') {
        Keyboard.dismiss();
      }
    }
  }, [state.currentStepData?.action]);

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
          state.isActive &&
          state.currentStepData?.action !== 'type_text' &&
          state.currentStepData?.action !== 'select_option' &&
          state.currentStepData?.action !== 'select_days' &&
          !(state.currentStepData?.action === 'click_element' && state.currentStepData?.target === 'create-habit-submit')
            ? 'auto'
            : 'box-none'
        }
      >
        {/* No dark background needed - SpotlightEffect handles its own overlays */}

        {/* Spotlight Effect for spotlight type */}
        {isSpotlight && spotlightTarget && !isLoadingTarget && (
          <SpotlightEffect
            target={spotlightTarget}
            action={state.currentStepData?.action}
            targetId={state.currentStepData?.target}
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
              top: (insets.top * getSafeAreaMultiplier()) + (isTablet() ? 0 : (getScreenSize() === ScreenSize.SMALL ? 0 : 2)),
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
                : state.currentStepData?.action === 'select_option' ||
                  state.currentStepData?.action === 'select_days' ||
                  (state.currentStepData?.action === 'click_element' && state.currentStepData?.target === 'create-habit-submit')
                ? styles.contentContainerTopFixed
                : styles.contentContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
              // Dynamic positioning for type_text based on context
              state.currentStepData?.action === 'type_text' && spotlightTarget && (() => {
                // Check if we're in Goal modal context (these need special positioning for keyboard)
                const isGoalInput = state.currentStepData?.target?.includes('goal-') || false;

                if (isGoalInput) {
                  // Goal inputs: place BELOW the input field like habit inputs
                  // Keyboard won't overlap since it's in a modal with proper scroll handling
                  const belowFieldPosition = spotlightTarget.y + spotlightTarget.height + 8 +
                                           (spotlightTarget.height * 0.1) + // Account for 110% pulse scale
                                           (isTablet() ? 32 : (getScreenSize() === ScreenSize.SMALL ? 16 : 20));

                  console.log(`📍 [TUTORIAL] Goal input - positioning below field: ${belowFieldPosition}px (field at ${spotlightTarget.y}px)`);
                  return { top: belowFieldPosition };
                } else {
                  // Habit inputs: place below input field as before
                  const basePosition = spotlightTarget.y + spotlightTarget.height + 8 +
                                     (spotlightTarget.height * 0.1) + // Account for 110% pulse scale
                                     (isTablet() ? 32 : (getScreenSize() === ScreenSize.SMALL ? 16 : 20));

                  // Ensure content doesn't go below safe area
                  const maxTop = Dimensions.get('window').height - insets.bottom - 250;
                  const finalPosition = Math.min(basePosition, maxTop);

                  console.log(`📍 [TUTORIAL] Habit input - positioning below field: ${finalPosition}px`);
                  return { top: finalPosition };
                }
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
                  <Ionicons name="arrow-forward" size={getIconSize(16)} color={Colors.white} />
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
  contentContainerTopFixed: {
    position: 'absolute',
    top: (isTablet() ? 100 : (getScreenSize() === ScreenSize.SMALL ? 70 : 80)),
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
    marginBottom: isTablet() ? 16 : (getScreenSize() === ScreenSize.SMALL ? 12 : 14),
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: isTablet() ? 10 : (getScreenSize() === ScreenSize.SMALL ? 8 : 9),
    paddingHorizontal: isTablet() ? 20 : (getScreenSize() === ScreenSize.SMALL ? 16 : 18),
    borderRadius: isTablet() ? 8 : (getScreenSize() === ScreenSize.SMALL ? 6 : 7),
    minHeight: isTablet() ? 36 : (getScreenSize() === ScreenSize.SMALL ? 32 : 34),
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: isTablet() ? 4 : 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: isTablet() ? 8 : 6,
    elevation: isTablet() ? 4 : 3,
    marginTop: 0,
  },
  nextButtonText: {
    fontSize: scaleFont(Fonts.sizes.sm),
    fontWeight: '600',
    color: Colors.white,
    marginRight: 6,
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
    marginBottom: isTablet() ? 16 : (getScreenSize() === ScreenSize.SMALL ? 12 : 14),
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