// Star Level Change Modal - Celebration for star promotion / notification for demotion
// Animation flow: Show OLD state first, then animate the transition to NEW state
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Canvas, Circle } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { AchievementCategory } from '@/src/types/gamification';

const { width: screenWidth } = Dimensions.get('window');

// Star level display info - colors and names match starRatingService.ts
const STAR_CONFIG: Record<number, { color: string; nameKey: string }> = {
  1: { color: '#9E9E9E', nameKey: 'novice' },
  2: { color: '#2196F3', nameKey: 'explorer' },
  3: { color: '#9C27B0', nameKey: 'challenger' },
  4: { color: '#FF9800', nameKey: 'expert' },
  5: { color: '#FFD700', nameKey: 'master' },
};

export interface StarLevelChangeData {
  category: AchievementCategory;
  previousStars: number;
  newStars: number;
  reason: 'success' | 'double_failure' | 'warmup_penalty' | 'reset';
}

interface StarLevelChangeModalProps {
  visible: boolean;
  data: StarLevelChangeData | null;
  onClose: () => void;
}

const StarLevelChangeModal: React.FC<StarLevelChangeModalProps> = ({
  visible,
  data,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Phase 1: Modal entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Phase 2: New star landing (promotion) or star removal (demotion)
  const newStarScale = useRef(new Animated.Value(0)).current;
  const removedStarScale = useRef(new Animated.Value(1)).current;
  const removedStarOpacity = useRef(new Animated.Value(1)).current;
  const removedStarWidth = useRef(new Animated.Value(48)).current; // star fontSize 40 + gap 8

  // Reanimated SharedValues for promotion impact effects
  const modalImpactScale = useSharedValue(1);
  const modalImpactRotation = useSharedValue(0);
  const starDropTranslateY = useSharedValue(-30);
  const starDropScale = useSharedValue(0);
  const glowRadius = useSharedValue(15);
  const glowOpacity = useSharedValue(0);

  // Phase 3: Color transition (0 = old color, 1 = new color)
  const colorAnim = useRef(new Animated.Value(0)).current;

  // Phase 3: Name crossfade
  const oldNameOpacity = useRef(new Animated.Value(1)).current;
  const newNameOpacity = useRef(new Animated.Value(0)).current;

  // Phase 4: Final elements (button, motivation, reason)
  const finalOpacity = useRef(new Animated.Value(0)).current;

  const isPromotion = data ? data.newStars > data.previousStars : false;
  const getConfig = (level: number) => STAR_CONFIG[level] ?? STAR_CONFIG[1]!;
  const newConfig = getConfig(data?.newStars ?? 1);
  const prevConfig = getConfig(data?.previousStars ?? 1);

  // Reanimated animated styles for modal impact
  const modalImpactStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: modalImpactScale.value },
      { rotate: `${modalImpactRotation.value}deg` },
    ],
  }));

  // Reanimated animated style for new star drop
  const starDropStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: starDropTranslateY.value },
      { scale: starDropScale.value },
    ],
    opacity: starDropScale.value,
  }));

  const resetAnimations = useCallback(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
    newStarScale.setValue(0);
    removedStarScale.setValue(1);
    removedStarOpacity.setValue(1);
    removedStarWidth.setValue(48);
    colorAnim.setValue(0);
    oldNameOpacity.setValue(1);
    newNameOpacity.setValue(0);
    finalOpacity.setValue(0);
    // Reset Reanimated SharedValues
    modalImpactScale.value = 1;
    modalImpactRotation.value = 0;
    starDropTranslateY.value = -30;
    starDropScale.value = 0;
    glowRadius.value = 15;
    glowOpacity.value = 0;
  }, [fadeAnim, scaleAnim, newStarScale, removedStarScale, removedStarOpacity, removedStarWidth, colorAnim, oldNameOpacity, newNameOpacity, finalOpacity]);

  useEffect(() => {
    if (visible && data) {
      resetAnimations();
      if (isPromotion) {
        runPromotionAnimation();
      } else {
        runDemotionAnimation();
      }
    } else {
      resetAnimations();
    }
  }, [visible, data]);

  // Trigger Reanimated impact effects (called via setTimeout after Phase 1 completes)
  const triggerImpactEffects = useCallback(() => {
    // Star bounce: drop from above with dramatic spring
    starDropTranslateY.value = withSpring(0, { damping: 8, stiffness: 300 });
    starDropScale.value = withSequence(
      withSpring(1.5, { damping: 4, stiffness: 400 }),
      withSpring(0.9, { damping: 10, stiffness: 300 }),
      withSpring(1.05, { damping: 12, stiffness: 250 }),
      withSpring(1.0, { damping: 14, stiffness: 200 }),
    );

    // Modal pressure wave: scale pulse + rotation wobble
    modalImpactScale.value = withSequence(
      withSpring(1.06, { damping: 4, stiffness: 500 }),
      withSpring(0.97, { damping: 6, stiffness: 400 }),
      withSpring(1.02, { damping: 10, stiffness: 300 }),
      withSpring(1.0, { damping: 14, stiffness: 200 }),
    );
    modalImpactRotation.value = withSequence(
      withTiming(-1.2, { duration: 80 }),
      withTiming(1.2, { duration: 80 }),
      withTiming(-0.3, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );

    // Skia radial glow burst
    glowOpacity.value = withSequence(
      withTiming(0.6, { duration: 50 }),
      withTiming(0, { duration: 450 }),
    );
    glowRadius.value = withTiming(120, { duration: 500 });
  }, []);

  const runPromotionAnimation = () => {
    if (!data) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      // Phase 1: Modal fades in showing OLD state (old stars, old color, old name)
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]),
      // Hold old state for 800ms so user sees where they were
      Animated.delay(800),

      // Phase 2: New star visibility via RN Animated (for color interpolation)
      Animated.spring(newStarScale, {
        toValue: 1,
        tension: 180,
        friction: 5,
        useNativeDriver: false,
      }),

      // Phase 3: Color transition triggered after star lands
      Animated.parallel([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(oldNameOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(newNameOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
        ]),
      ]),

      // Phase 4: Button and motivation text fade in
      Animated.timing(finalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    // Trigger Reanimated impact effects at the same time Phase 2 starts
    // Phase 1 entrance ~300ms + 800ms hold = ~1100ms
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      triggerImpactEffects();
    }, 1100);
  };

  const runDemotionAnimation = () => {
    if (!data) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Animated.sequence([
      // Phase 1: Modal fades in showing OLD state
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]),
      // Hold old state for 800ms
      Animated.delay(800),

      // Phase 2: Last star shrinks, fades out, and collapses its space
      Animated.parallel([
        Animated.timing(removedStarScale, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(removedStarOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(removedStarWidth, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),

      // Phase 3: Color transition + name crossfade
      Animated.parallel([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(oldNameOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(newNameOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
        ]),
      ]),

      // Phase 4: Reason, motivation, button fade in
      Animated.timing(finalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  if (!visible || !data) return null;

  const getCategoryName = (category: AchievementCategory): string => {
    return t(`monthlyChallenge.categories.${category}`);
  };

  const getCategoryEmoji = (category: AchievementCategory): string => {
    switch (category) {
      case 'habits': return '🎯';
      case 'journal': return '📝';
      case 'goals': return '🏆';
      case 'consistency': return '⚡';
      default: return '📋';
    }
  };

  const getDemotionReason = (): string => {
    switch (data.reason) {
      case 'double_failure':
        return t('monthlyChallenge.starChange.reason.doubleFail');
      case 'warmup_penalty':
        return t('monthlyChallenge.starChange.reason.warmupPenalty');
      default:
        return t('monthlyChallenge.starChange.reason.default');
    }
  };

  // Animated color interpolation: old color -> new color
  const accentColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [prevConfig.color, newConfig.color],
  });

  // Badge background: interpolate between old and new color with low alpha
  const badgeBgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [prevConfig.color + '15', newConfig.color + '15'],
  });

  // Render stars for promotion: old stars (color-transitioning) + animated new star
  const renderPromotionStars = () => {
    const stars: React.ReactNode[] = [];

    // Existing stars - start with old color, transition to new
    for (let i = 0; i < data.previousStars; i++) {
      stars.push(
        <Animated.Text key={`old-${i}`} style={[staticStyles.star, { color: accentColor }]}>
          ★
        </Animated.Text>
      );
    }

    // New star with dramatic drop + bounce animation (Reanimated for physics, RN Animated for color)
    stars.push(
      <ReAnimated.View key="new" style={starDropStyle}>
        <Animated.Text
          style={[
            staticStyles.star,
            {
              color: accentColor,
            },
          ]}
        >
          ★
        </Animated.Text>
      </ReAnimated.View>
    );

    return stars;
  };

  // Render stars for demotion: remaining stars (color-transitioning) + fading star
  const renderDemotionStars = () => {
    const stars: React.ReactNode[] = [];

    // Stars that stay - start with old color, transition to new
    for (let i = 0; i < data.newStars; i++) {
      stars.push(
        <Animated.Text key={`stay-${i}`} style={[staticStyles.star, { color: accentColor }]}>
          ★
        </Animated.Text>
      );
    }

    // Star being removed - stays old color, shrinks, fades, and collapses width
    stars.push(
      <Animated.View
        key="removed"
        style={{
          width: removedStarWidth,
          overflow: 'hidden',
          alignItems: 'center',
        }}
      >
        <Animated.Text
          style={[
            staticStyles.star,
            {
              color: prevConfig.color,
              transform: [{ scale: removedStarScale }],
              opacity: removedStarOpacity,
            },
          ]}
        >
          ★
        </Animated.Text>
      </Animated.View>
    );

    return stars;
  };

  const staticStyles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[staticStyles.overlay, { opacity: fadeAnim }]}>
        <ReAnimated.View style={modalImpactStyle}>
        <Animated.View
          style={[
            staticStyles.container,
            {
              transform: [{ scale: scaleAnim }],
              borderColor: accentColor,
            },
          ]}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={
            isPromotion
              ? t('monthlyChallenge.starChange.accessibility.promotion', {
                  stars: data.newStars,
                  level: t(`monthlyChallenge.starLevels.${newConfig.nameKey}`),
                  category: getCategoryName(data.category),
                })
              : t('monthlyChallenge.starChange.accessibility.demotion', {
                  stars: data.newStars,
                  level: t(`monthlyChallenge.starLevels.${newConfig.nameKey}`),
                  category: getCategoryName(data.category),
                })
          }
        >
          {/* Category badge - accent color transitions */}
          <Animated.View style={[staticStyles.categoryBadge, { backgroundColor: badgeBgColor }]}>
            <Text style={staticStyles.categoryEmoji}>{getCategoryEmoji(data.category)}</Text>
            <Animated.Text style={[staticStyles.categoryText, { color: accentColor }]}>
              {getCategoryName(data.category)}
            </Animated.Text>
          </Animated.View>

          {/* Title */}
          <Text style={staticStyles.title}>
            {isPromotion
              ? t('monthlyChallenge.starChange.promotionTitle')
              : t('monthlyChallenge.starChange.demotionTitle')}
          </Text>

          {/* Stars display with animation + Skia glow */}
          <View style={staticStyles.starsContainer}>
            {/* Skia radial glow burst behind stars - promotion only */}
            {isPromotion && (
              <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <Circle
                  cx={Math.min(screenWidth - 48, 360) / 2}
                  cy={30}
                  r={glowRadius}
                  opacity={glowOpacity}
                  color={newConfig.color + '40'}
                />
              </Canvas>
            )}
            <View style={staticStyles.starsRow}>
              {isPromotion ? renderPromotionStars() : renderDemotionStars()}
            </View>
          </View>

          {/* Level name crossfade: old name fades out, new name fades in */}
          <View style={staticStyles.levelNameContainer}>
            <Animated.Text
              style={[
                staticStyles.levelName,
                { color: prevConfig.color, opacity: oldNameOpacity, position: 'absolute' },
              ]}
            >
              {t(`monthlyChallenge.starLevels.${prevConfig.nameKey}`)}
            </Animated.Text>
            <Animated.Text
              style={[
                staticStyles.levelName,
                { color: newConfig.color, opacity: newNameOpacity },
              ]}
            >
              {t(`monthlyChallenge.starLevels.${newConfig.nameKey}`)}
            </Animated.Text>
          </View>

          {/* Demotion reason */}
          {!isPromotion && (
            <Animated.View style={{ opacity: finalOpacity }}>
              <Text style={staticStyles.reasonText}>{getDemotionReason()}</Text>
            </Animated.View>
          )}

          {/* Motivation message */}
          <Animated.View style={{ opacity: finalOpacity }}>
            <Text style={staticStyles.motivationText}>
              {isPromotion
                ? t('monthlyChallenge.starChange.promotionMotivation')
                : t('monthlyChallenge.starChange.demotionMotivation')}
            </Text>
          </Animated.View>

          {/* Button */}
          <Animated.View style={[staticStyles.buttonWrapper, { opacity: finalOpacity }]}>
            <Pressable
              style={({ pressed }) => [
                staticStyles.button,
                { backgroundColor: isPromotion ? newConfig.color : colors.textSecondary },
                pressed && { opacity: 0.8 },
              ]}
              onPress={onClose}
              accessible
              accessibilityRole="button"
              accessibilityLabel={
                isPromotion
                  ? t('monthlyChallenge.starChange.buttonPromotion')
                  : t('monthlyChallenge.starChange.buttonDemotion')
              }
            >
              <Text style={staticStyles.buttonText}>
                {isPromotion
                  ? t('monthlyChallenge.starChange.buttonPromotion')
                  : t('monthlyChallenge.starChange.buttonDemotion')}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
        </ReAnimated.View>
      </Animated.View>
    </Modal>
  );
};


const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    container: {
      backgroundColor: colors.cardBackground || colors.cardBackgroundElevated,
      borderRadius: 20,
      padding: 28,
      width: Math.min(screenWidth - 48, 360),
      alignItems: 'center',
      borderWidth: 2,
      overflow: 'hidden',
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 16,
    },
    categoryEmoji: {
      fontSize: 16,
      marginRight: 6,
    },
    categoryText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    starsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      minHeight: 60,
    },
    starsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    star: {
      fontSize: 40,
    },
levelNameContainer: {
      marginTop: 8,
      marginBottom: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
    },
    levelName: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    reasonText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
      fontStyle: 'italic',
    },
    motivationText: {
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
      paddingHorizontal: 8,
    },
    buttonWrapper: {
      width: '100%',
    },
    button: {
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
  });

export default StarLevelChangeModal;
