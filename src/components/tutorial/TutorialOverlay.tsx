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
import { Fonts } from '@/src/constants/fonts';
import { useTheme } from '@/src/contexts/ThemeContext';
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
  const { colors } = useTheme();
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

  // Calculate dynamic tutorial card height based on device and content
  const calculateTutorialCardHeight = (): number => {
    const screenSize = getScreenSize();
    const isTabletDevice = isTablet();

    // Base measurements from styles
    const cardPadding = getCardPadding(); // 18-32px
    const titleHeight = scaleFont(Fonts.sizes.xl) * 1.3; // Line height
    const titleMargin = isTabletDevice ? 16 : (screenSize === ScreenSize.SMALL ? 10 : 12);
    const contentHeight = scaleFont(Fonts.sizes.md) * 1.5 * 2; // Assume 2 lines max
    const contentMargin = isTabletDevice ? 16 : (screenSize === ScreenSize.SMALL ? 12 : 14);
    const progressContainerHeight = isTabletDevice ? 40 : (screenSize === ScreenSize.SMALL ? 30 : 35);
    const nextButtonHeight = state.showNext || state.currentStepData?.action === 'next'
      ? (isTabletDevice ? 36 : (screenSize === ScreenSize.SMALL ? 32 : 34))
      : 0;

    // Total calculated height
    const totalHeight =
      (cardPadding * 2) + // Top and bottom padding
      titleHeight +
      titleMargin +
      contentHeight +
      contentMargin +
      progressContainerHeight +
      nextButtonHeight;

    // Add safety margin for shadows and unexpected content
    const safetyMargin = 40;

    return Math.ceil(totalHeight + safetyMargin);
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
    // Skip auto-scroll for modal creation steps - they should work like Habit creation
    const isModalStep = state.currentStepData?.id && (
      state.currentStepData.id.startsWith('habit-') ||
      state.currentStepData.id.startsWith('goal-')
    );

    if (isModalStep) {
      console.log(`🚫 [TUTORIAL] Skipping auto-scroll for modal step: ${state.currentStepData?.id}`);
      return false; // No scroll for modal steps
    }

    // Get viewport height
    const viewportHeight = Dimensions.get('window').height;
    const safeAreaTop = insets.top;
    const safeAreaBottom = insets.bottom;

    // Reserve space for tutorial content based on step type
    const isTypeInput = (
      state.currentStepData?.action === 'type_text' ||
      state.currentStepData?.action === 'type_number'
    );
    const isQuickActionsStep = state.currentStepData?.id === 'quick-actions';

    // Quick Actions step needs more top space for tutorial text positioned at top
    const topReserve = isQuickActionsStep ? 200 : (isTypeInput ? 150 : 100);
    const bottomReserve = isTypeInput ? 350 : 200; // More space for keyboard

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

    if (state.currentStepData?.target && state.currentStepData?.type === 'spotlight') {
      // Minimize delay for smoother transitions - especially for modal-to-modal steps
      const delay = state.currentStepData.id === 'habit-name' ? 100 : 50; // Slightly longer for modal content
      const targetId = state.currentStepData.target; // Capture for closure
      setTimeout(() => {
        console.log(`🎯 [TUTORIAL] Updating spotlight for step: ${state.currentStepData?.id} (target: ${targetId})`);
        updateSpotlightTarget(targetId);
      }, delay);
    }
  }, [state.currentStepData]);

  // Listen for scroll completion and refresh target positions
  useEffect(() => {
    const scrollCompletedListener = DeviceEventEmitter.addListener(
      'tutorial_scroll_completed',
      async () => {
        if (state.currentStepData?.target && state.currentStepData?.type === 'spotlight') {
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

  // Hide keyboard when transitioning from text/number input steps to other steps
  useEffect(() => {
    if (state.currentStepData) {
      // If current step is not type_text or type_number, hide keyboard
      if (
        state.currentStepData.action !== 'type_text' &&
        state.currentStepData.action !== 'type_number'
      ) {
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
      bottom: getContentBottomPosition() - 50,
      left: getHorizontalMargin(),
      right: getHorizontalMargin(),
      zIndex: 10000,
    },
    contentContainerModalDynamic: {
      position: 'absolute',
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
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: isTablet() ? 20 : (getScreenSize() === ScreenSize.SMALL ? 12 : 16),
      padding: getCardPadding(),
    },
    title: {
      fontSize: scaleFont(Fonts.sizes.xl),
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: isTablet() ? 16 : (getScreenSize() === ScreenSize.SMALL ? 10 : 12),
      textAlign: 'center',
      lineHeight: scaleFont(Fonts.sizes.xl) * 1.3,
    },
    content: {
      fontSize: scaleFont(Fonts.sizes.md),
      color: colors.textSecondary,
      lineHeight: scaleFont(Fonts.sizes.md) * 1.5,
      textAlign: 'center',
      marginBottom: isTablet() ? 16 : (getScreenSize() === ScreenSize.SMALL ? 12 : 14),
    },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: isTablet() ? 10 : (getScreenSize() === ScreenSize.SMALL ? 8 : 9),
      paddingHorizontal: isTablet() ? 20 : (getScreenSize() === ScreenSize.SMALL ? 16 : 18),
      borderRadius: isTablet() ? 8 : (getScreenSize() === ScreenSize.SMALL ? 6 : 7),
      minHeight: isTablet() ? 36 : (getScreenSize() === ScreenSize.SMALL ? 32 : 34),
      marginTop: 0,
    },
    nextButtonText: {
      fontSize: scaleFont(Fonts.sizes.sm),
      fontWeight: '600',
      color: colors.white,
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
      color: colors.white,
      textAlign: 'center',
    },
    progressContainer: {
      width: '100%',
      marginBottom: isTablet() ? 16 : (getScreenSize() === ScreenSize.SMALL ? 12 : 14),
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
      fontSize: scaleFont(12),
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
  });

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
        pointerEvents={(() => {
          const pointerEventsValue = state.isActive &&
          state.currentStepData?.action !== 'type_text' &&
          state.currentStepData?.action !== 'type_number' &&
          state.currentStepData?.action !== 'select_option' &&
          state.currentStepData?.action !== 'select_days' &&
          state.currentStepData?.action !== 'select_date' &&
          !(state.currentStepData?.action === 'click_element' && state.currentStepData?.target === 'create-habit-submit') &&
          !(state.currentStepData?.action === 'click_element' && state.currentStepData?.target === 'create-goal-submit')
            ? 'auto'
            : 'box-none';

          if (state.currentStepData?.target === 'create-goal-submit') {
            console.log(`🔍 [OVERLAY] pointerEvents for create-goal-submit: "${pointerEventsValue}"`);
          }

          return pointerEventsValue;
        })()}
      >
        {/* No dark background needed - SpotlightEffect handles its own overlays */}

        {/* Spotlight Effect for spotlight type */}
        {isSpotlight && spotlightTarget && !isLoadingTarget && state.currentStepData && (
          <SpotlightEffect
            target={spotlightTarget}
            action={state.currentStepData.action}
            targetId={state.currentStepData.target ?? undefined}
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
            accessibilityLabel={t('accessibility.skipTutorial')}
          >
            <Ionicons name="close" size={getIconSize(24)} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>

        {/* Tutorial Content */}
        {isSpotlight && (
          <Animated.View
            pointerEvents="box-none"
            style={[
              // 🎯 INTELLIGENT ADAPTIVE POSITIONING STRATEGY:
              // 1. Modal creation steps: DYNAMIC positioning below text field
              // 2. Tab bar steps: TOP positioning (to avoid overlap with bottom tabs)
              // 3. Quick actions: TOP positioning
              // 4. Target in bottom half of screen: TOP positioning
              // 5. Other steps: BOTTOM positioning
              (() => {
                // Text input steps with DYNAMIC positioning (below field)
                // These are at TOP of modal, so there's space below them
                const isTextInputStep = (
                  state.currentStepData?.id === 'habit-name' ||
                  state.currentStepData?.id === 'goal-title'
                );

                // Goal middle/bottom fields need TOP positioning (keyboard would cover DYNAMIC)
                // These need auto-scroll to be visible
                const isGoalLowerTextInputStep = (
                  state.currentStepData?.id === 'goal-unit' ||
                  state.currentStepData?.id === 'goal-target'
                );

                // Picker/selector steps that need TOP positioning (to avoid overlap when expanded)
                const isPickerStep = (
                  state.currentStepData?.id === 'habit-color' ||
                  state.currentStepData?.id === 'habit-icon' ||
                  state.currentStepData?.id === 'habit-days' ||
                  state.currentStepData?.id === 'goal-date'
                );

                // Submit button steps that need TOP positioning (button is at bottom of modal)
                const isSubmitButtonStep = (
                  state.currentStepData?.id === 'habit-create' ||
                  state.currentStepData?.id === 'goal-create'
                );

                // Check if this is a tab navigation step (target is at bottom)
                const isTabNavigationStep = (
                  state.currentStepData?.id === 'navigate-journal' ||
                  state.currentStepData?.id === 'navigate-goals' ||
                  state.currentStepData?.id === 'navigate-home' ||
                  state.currentStepData?.target === 'journal-tab' ||
                  state.currentStepData?.target === 'goals-tab' ||
                  state.currentStepData?.target === 'home-tab'
                );

                // Smart positioning: if target is in bottom half of screen, put text at top
                const isTargetInBottomHalf = spotlightTarget && (
                  spotlightTarget.y > (Dimensions.get('window').height / 2)
                );

                if (isTextInputStep && spotlightTarget) {
                  // Text input (habit-name, goal-title): Dynamic position below text field
                  console.log(`📍 [TUTORIAL] Using dynamic positioning below field for: ${state.currentStepData?.id}`);
                  return styles.contentContainerModalDynamic;
                } else if (isGoalLowerTextInputStep) {
                  // Goal lower fields (unit, target): TOP positioning to avoid keyboard
                  console.log(`📍 [TUTORIAL] Using top positioning for goal lower text input: ${state.currentStepData?.id}`);
                  return styles.contentContainerTopFixed;
                } else if (isPickerStep) {
                  // Picker steps: TOP positioning to avoid overlap with expanded picker
                  console.log(`📍 [TUTORIAL] Using top positioning for picker step: ${state.currentStepData?.id}`);
                  return styles.contentContainerTopFixed;
                } else if (isSubmitButtonStep) {
                  // Submit button: TOP positioning (button is at bottom)
                  console.log(`📍 [TUTORIAL] Using top positioning for submit button: ${state.currentStepData?.id}`);
                  return styles.contentContainerTopFixed;
                } else if (state.currentStepData?.id === 'quick-actions') {
                  // Quick Actions step needs top positioning to avoid overlap
                  console.log(`📍 [TUTORIAL] Using top positioning for Quick Actions step`);
                  return styles.contentContainerTopFixed;
                } else if (isTabNavigationStep) {
                  // Tab navigation steps need top positioning to avoid overlap with bottom tab bar
                  console.log(`📍 [TUTORIAL] Using top positioning for tab navigation step: ${state.currentStepData?.id}`);
                  return styles.contentContainerTopFixed;
                } else if (isTargetInBottomHalf) {
                  // Target is in bottom half - put text at top to avoid overlap
                  console.log(`📍 [TUTORIAL] Target in bottom half (y=${spotlightTarget?.y}px), using top positioning for: ${state.currentStepData?.id}`);
                  return styles.contentContainerTopFixed;
                } else {
                  // Non-modal steps use bottom positioning
                  return styles.contentContainer;
                }
              })(),
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
              // 🔧 DYNAMIC POSITIONING for top text input steps - below the field
              (() => {
                const isTopTextInputStep = (
                  state.currentStepData?.id === 'habit-name' ||
                  state.currentStepData?.id === 'goal-title'
                );
                // NOTE: Goal lower fields (goal-unit, goal-target) use TOP positioning,
                // because they're lower in modal and need auto-scroll

                if (isTopTextInputStep && spotlightTarget) {
                  const basePosition = spotlightTarget.y + spotlightTarget.height + 16; // 16px pod fieldem

                  // Calculate dynamic tutorial card height instead of fixed 250px
                  const tutorialCardHeight = calculateTutorialCardHeight();
                  const bottomSafePadding = 20; // Extra breathing room from bottom edge

                  // Android-specific safe area handling: respect navigation bar height
                  const androidNavBarExtra = Platform.OS === 'android' ? 8 : 0; // Extra padding for Android nav

                  // Ensure content doesn't go below safe area with dynamic calculation
                  const maxTop = Dimensions.get('window').height - insets.bottom - tutorialCardHeight - bottomSafePadding - androidNavBarExtra;
                  const finalPosition = Math.min(basePosition, maxTop);

                  console.log(`📍 [TUTORIAL] Dynamic positioning: base=${basePosition}px, cardHeight=${tutorialCardHeight}px, maxTop=${maxTop}px, final=${finalPosition}px (${Platform.OS})`);
                  return { top: finalPosition };
                }
                return {};
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
                      backgroundColor: colors.primary,
                      width: `${(state.currentStep / state.totalSteps) * 100}%`
                    }
                  ]} />
                </View>
                <Text style={styles.progressText}>{t('ui.progressStep', { current: state.currentStep, total: state.totalSteps })}</Text>
              </View>

              {/* Next Button - Show when appropriate */}
              {(state.showNext || state.currentStepData.action === 'next') && (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('ui.nextStep')}
                >
                  <Text style={styles.nextButtonText}>
                    {state.currentStepData.content.button || t('ui.next')}
                  </Text>
                  <Ionicons name="arrow-forward" size={getIconSize(16)} color={colors.white} />
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