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
import { Colors } from '@/src/constants/colors';
import { Fonts } from '@/src/constants/fonts';
import { SpotlightEffect } from './SpotlightEffect';
import { TutorialModal } from './TutorialModal';
import { tutorialTargetManager, TargetElementInfo } from '@/src/utils/TutorialTargetHelper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TutorialOverlayProps {
  children: React.ReactNode;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ children }) => {
  const { state, actions } = useTutorial();
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
            <Text style={styles.loadingText}>Preparing tutorial...</Text>
          </View>
        )}

        {/* Skip Button - Always visible in top right */}
        <Animated.View
          style={[
            styles.skipButtonContainer,
            {
              top: insets.top + 10,
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
            <Ionicons name="close" size={24} color={Colors.white} />
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
                  <Ionicons name="arrow-forward" size={20} color={Colors.white} />
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
    right: 16,
    zIndex: 10001,
  },
  skipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 10000,
  },
  contentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  content: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: Fonts.sizes.md,
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
    fontSize: Fonts.sizes.md,
    color: Colors.white,
    textAlign: 'center',
  },
});