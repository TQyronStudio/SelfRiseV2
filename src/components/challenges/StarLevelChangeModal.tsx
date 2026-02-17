// Star Level Change Modal - Celebration for star promotion / notification for demotion
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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const starAnims = useRef<Animated.Value[]>([]).current;
  const newStarScale = useRef(new Animated.Value(0)).current;
  const removedStarScale = useRef(new Animated.Value(1)).current;
  const removedStarOpacity = useRef(new Animated.Value(1)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  const isPromotion = data ? data.newStars > data.previousStars : false;
  const getConfig = (level: number) => STAR_CONFIG[level] ?? STAR_CONFIG[1]!;
  const newConfig = getConfig(data?.newStars ?? 1);
  const prevConfig = getConfig(data?.previousStars ?? 1);

  const resetAnimations = useCallback(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
    newStarScale.setValue(0);
    removedStarScale.setValue(1);
    removedStarOpacity.setValue(1);
    nameOpacity.setValue(0);
    glowAnim.setValue(0);
    colorAnim.setValue(0);
    starAnims.length = 0;
  }, [fadeAnim, scaleAnim, newStarScale, removedStarScale, removedStarOpacity, nameOpacity, glowAnim, colorAnim, starAnims]);

  useEffect(() => {
    if (visible && data) {
      resetAnimations();

      // Initialize star position animations for repositioning
      const maxStars = Math.max(data.previousStars, data.newStars);
      for (let i = 0; i < maxStars; i++) {
        starAnims.push(new Animated.Value(0));
      }

      if (isPromotion) {
        runPromotionAnimation();
      } else {
        runDemotionAnimation();
      }
    } else {
      resetAnimations();
    }
  }, [visible, data]);

  const runPromotionAnimation = () => {
    if (!data) return;

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      // Phase 1: Modal appears with old stars
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: New star BOOM! + reposition
      Animated.delay(400),
      Animated.parallel([
        // New star bounce in
        Animated.spring(newStarScale, {
          toValue: 1,
          tension: 120,
          friction: 6,
          useNativeDriver: true,
        }),
        // Glow effect
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Color transition
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
      // Phase 3: Name appears
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Extra haptic on star boom
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 700);
  };

  const runDemotionAnimation = () => {
    if (!data) return;

    // Softer haptic for demotion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Animated.sequence([
      // Phase 1: Modal appears with current stars
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Star fades out + shrinks
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(removedStarScale, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(removedStarOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        // Color transition
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
      // Phase 3: Name appears
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
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

  // Render stars for promotion: old stars + animated new star
  const renderPromotionStars = () => {
    const stars: React.ReactNode[] = [];

    // Existing stars (already there)
    for (let i = 0; i < data.previousStars; i++) {
      stars.push(
        <Text key={`old-${i}`} style={[styles.star, { color: newConfig.color }]}>
          ★
        </Text>
      );
    }

    // New star with bounce animation
    stars.push(
      <Animated.Text
        key="new"
        style={[
          styles.star,
          {
            color: newConfig.color,
            transform: [
              {
                scale: newStarScale.interpolate({
                  inputRange: [0, 0.5, 0.8, 1],
                  outputRange: [0, 1.4, 0.9, 1],
                }),
              },
            ],
            opacity: newStarScale,
          },
        ]}
      >
        ★
      </Animated.Text>
    );

    return stars;
  };

  // Render stars for demotion: stars with last one fading out
  const renderDemotionStars = () => {
    const stars: React.ReactNode[] = [];

    // Stars that stay
    for (let i = 0; i < data.newStars; i++) {
      stars.push(
        <Text key={`stay-${i}`} style={[styles.star, { color: newConfig.color }]}>
          ★
        </Text>
      );
    }

    // Star that's being removed (fade + shrink)
    stars.push(
      <Animated.Text
        key="removed"
        style={[
          styles.star,
          {
            color: prevConfig.color,
            transform: [{ scale: removedStarScale }],
            opacity: removedStarOpacity,
          },
        ]}
      >
        ★
      </Animated.Text>
    );

    return stars;
  };

  const accentColor = newConfig.color;

  const styles = createStyles(colors, accentColor, isPromotion);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] },
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
          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryEmoji}>{getCategoryEmoji(data.category)}</Text>
            <Text style={styles.categoryText}>{getCategoryName(data.category)}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isPromotion
              ? t('monthlyChallenge.starChange.promotionTitle')
              : t('monthlyChallenge.starChange.demotionTitle')}
          </Text>

          {/* Stars display with animation */}
          <View style={styles.starsRow}>
            {isPromotion ? renderPromotionStars() : renderDemotionStars()}
          </View>

          {/* Glow effect for promotion */}
          {isPromotion && (
            <Animated.View
              style={[
                styles.glowRing,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.6, 0.3],
                  }),
                  transform: [
                    {
                      scale: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}

          {/* Level name with fade-in */}
          <Animated.View style={[styles.levelNameContainer, { opacity: nameOpacity }]}>
            <Text style={styles.levelName}>
              {t(`monthlyChallenge.starLevels.${newConfig.nameKey}`)}
            </Text>
          </Animated.View>

          {/* Demotion reason */}
          {!isPromotion && (
            <Animated.View style={{ opacity: nameOpacity }}>
              <Text style={styles.reasonText}>{getDemotionReason()}</Text>
            </Animated.View>
          )}

          {/* Motivation message */}
          <Animated.View style={{ opacity: nameOpacity }}>
            <Text style={styles.motivationText}>
              {isPromotion
                ? t('monthlyChallenge.starChange.promotionMotivation')
                : t('monthlyChallenge.starChange.demotionMotivation')}
            </Text>
          </Animated.View>

          {/* Button */}
          <Animated.View style={[styles.buttonWrapper, { opacity: nameOpacity }]}>
            <Pressable
              style={styles.button}
              onPress={onClose}
              accessible
              accessibilityRole="button"
              accessibilityLabel={
                isPromotion
                  ? t('monthlyChallenge.starChange.buttonPromotion')
                  : t('monthlyChallenge.starChange.buttonDemotion')
              }
            >
              <Text style={styles.buttonText}>
                {isPromotion
                  ? t('monthlyChallenge.starChange.buttonPromotion')
                  : t('monthlyChallenge.starChange.buttonDemotion')}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (colors: any, accentColor: string, isPromotion: boolean) =>
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
      borderColor: accentColor,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: accentColor + '15',
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
      color: accentColor,
      letterSpacing: 0.5,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    starsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 8,
      minHeight: 60,
    },
    star: {
      fontSize: 40,
      textShadowColor: accentColor + '40',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    glowRing: {
      position: 'absolute',
      top: '40%',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: accentColor + '15',
      alignSelf: 'center',
    },
    levelNameContainer: {
      marginTop: 8,
      marginBottom: 12,
    },
    levelName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: accentColor,
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
      backgroundColor: isPromotion ? accentColor : colors.textSecondary,
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
