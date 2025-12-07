import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
  Animated,
} from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { Fonts, Layout } from '@/src/constants';
import { useXpFeedback } from '@/src/hooks/useXpFeedback';
import { Achievement, AchievementRarity } from '@/src/types/gamification';
import { useAccessibility, getHighContrastRarityColors } from '@/src/hooks/useAccessibility';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface AchievementCelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: Achievement | null;
  xpAwarded: number;
}

// Get rarity color for theming
const getRarityColor = (rarity: AchievementRarity, isHighContrast: boolean): string => {
  const colors = getHighContrastRarityColors(isHighContrast);

  switch (rarity) {
    case AchievementRarity.COMMON: return colors.common;
    case AchievementRarity.RARE: return colors.rare;
    case AchievementRarity.EPIC: return colors.epic;
    case AchievementRarity.LEGENDARY: return colors.legendary;
    default: return isHighContrast ? '#000000' : '#007AFF';
  }
};

// Get rarity-specific haptic intensity
const getRarityHapticIntensity = (rarity: AchievementRarity): 'light' | 'medium' | 'heavy' => {
  switch (rarity) {
    case AchievementRarity.COMMON: return 'light';
    case AchievementRarity.RARE: return 'medium';
    case AchievementRarity.EPIC: return 'heavy';
    case AchievementRarity.LEGENDARY: return 'heavy';
    default: return 'medium';
  }
};

// Get rarity-specific sound effect
const getRaritySoundEffect = (rarity: AchievementRarity): 'xp_gain' | 'level_up' | 'milestone' => {
  switch (rarity) {
    case AchievementRarity.COMMON: return 'xp_gain';
    case AchievementRarity.RARE: return 'xp_gain';
    case AchievementRarity.EPIC: return 'level_up';
    case AchievementRarity.LEGENDARY: return 'milestone';
    default: return 'xp_gain';
  }
};

export const AchievementCelebrationModal: React.FC<AchievementCelebrationModalProps> = ({
  visible,
  onClose,
  achievement,
  xpAwarded,
}) => {
  // Early return BEFORE any hooks - safe now because parent only renders with valid achievement
  if (!achievement) {
    return null;
  }

  const { t } = useI18n();
  const { colors } = useTheme();
  const { isHighContrastEnabled, isReduceMotionEnabled } = useAccessibility();
  const { triggerHapticFeedback, playSoundEffect } = useXpFeedback();

  // Animation states
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  const rarityColor = getRarityColor(achievement.rarity, isHighContrastEnabled);
  const rarityHaptic = getRarityHapticIntensity(achievement.rarity);
  const raritySound = getRaritySoundEffect(achievement.rarity);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    modal: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 20,
      borderWidth: 3,
      paddingVertical: Layout.spacing.xl,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      maxWidth: screenWidth * 0.85,
      width: '100%',
    },
    emoji: {
      fontSize: 72,
      marginBottom: Layout.spacing.md,
    },
    title: {
      fontSize: Fonts.sizes.xxl || 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    achievementName: {
      fontSize: Fonts.sizes.lg,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    description: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Layout.spacing.lg,
      paddingHorizontal: Layout.spacing.sm,
    },
    rarityBadge: {
      borderRadius: 20,
      paddingVertical: Layout.spacing.sm,
      paddingHorizontal: Layout.spacing.lg,
      marginBottom: Layout.spacing.md,
    },
    rarityText: {
      fontSize: Fonts.sizes.sm,
      fontWeight: 'bold',
      color: colors.white,
      letterSpacing: 1,
    },
    xpBadge: {
      borderWidth: 2,
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      marginBottom: Layout.spacing.lg,
      backgroundColor: colors.backgroundSecondary,
    },
    xpLabel: {
      fontSize: Fonts.sizes.sm,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    xpAmount: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
    },
    button: {
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.xl,
      minWidth: 140,
    },
    buttonText: {
      color: colors.white,
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

  // Get rarity-specific emoji and title
  const getRarityEmoji = (rarity: AchievementRarity): string => {
    switch (rarity) {
      case AchievementRarity.COMMON: return '🏆';
      case AchievementRarity.RARE: return '💎';
      case AchievementRarity.EPIC: return '🌟';
      case AchievementRarity.LEGENDARY: return '👑';
      default: return '🏆';
    }
  };

  const getRarityTitle = (rarity: AchievementRarity, t: any): string => {
    switch (rarity) {
      case AchievementRarity.COMMON: return t('achievements.celebration.rarity_common');
      case AchievementRarity.RARE: return t('achievements.celebration.rarity_rare');
      case AchievementRarity.EPIC: return t('achievements.celebration.rarity_epic');
      case AchievementRarity.LEGENDARY: return t('achievements.celebration.rarity_legendary');
      default: return t('achievements.celebration.rarity_common');
    }
  };

  // Entrance animation
  useEffect(() => {
    if (visible && !isReduceMotionEnabled) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);

      // Start entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (visible) {
      // No animation for reduce motion
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [visible, isReduceMotionEnabled]);

  // Celebration effects
  useEffect(() => {
    if (visible) {
      // Get rarity capitalized for translation key
      const rarityCapitalized = achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1).toLowerCase();

      // Accessibility announcement
      const announcement = t('achievements.celebration.announcement', {
        rarity: t(`achievements.detail.rarity${rarityCapitalized}`),
        name: t(achievement.nameKey),
        xp: xpAwarded.toString()
      });

      AccessibilityInfo.announceForAccessibility(announcement);

      // Trigger effects
      const triggerEffects = async () => {
        await triggerHapticFeedback(rarityHaptic);
        
        // Special legendary double haptic
        if (achievement.rarity === AchievementRarity.LEGENDARY) {
          setTimeout(async () => {
            await triggerHapticFeedback('medium');
          }, 300);
        }
        
        await playSoundEffect(raritySound);
      };

      triggerEffects();
    }
  }, [visible, achievement, xpAwarded, rarityHaptic, raritySound, t, triggerHapticFeedback, playSoundEffect]);

  // Close animation
  const handleClose = () => {
    if (!isReduceMotionEnabled) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onClose());
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      accessible={true}
      accessibilityViewIsModal={true}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: opacityAnim }
        ]}
      >
        <Animated.View
          style={[
            styles.modal,
            { 
              transform: isReduceMotionEnabled ? [] : [{ scale: scaleAnim }],
              borderColor: rarityColor,
              shadowColor: rarityColor,
            }
          ]}
        >
          {/* Rarity emoji */}
          <Text style={styles.emoji}>
            {getRarityEmoji(achievement.rarity)}
          </Text>

          {/* Title with rarity theming */}
          <Text
            style={[
              styles.title,
              { color: rarityColor }
            ]}
          >
            {getRarityTitle(achievement.rarity, t)}
          </Text>

          {/* Achievement name */}
          <Text style={styles.achievementName}>
            {t(achievement.nameKey)}
          </Text>

          {/* Achievement description */}
          <Text style={styles.description}>
            {t(achievement.descriptionKey)}
          </Text>

          {/* Rarity badge */}
          <View style={[
            styles.rarityBadge,
            { backgroundColor: rarityColor }
          ]}>
            <Text style={styles.rarityText}>
              {t(`achievements.detail.rarity${achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1).toLowerCase()}`)}
            </Text>
          </View>

          {/* XP reward */}
          <View style={[
            styles.xpBadge,
            { borderColor: rarityColor }
          ]}>
            <Text style={styles.xpLabel}>{t('achievements.celebration.xp_earned')}</Text>
            <Text style={[
              styles.xpAmount,
              { color: rarityColor }
            ]}>
              +{xpAwarded}
            </Text>
          </View>

          {/* Continue button with rarity theming */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: rarityColor }
            ]}
            onPress={handleClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('achievements.celebration.continue_button')}
            accessibilityHint={t('achievements.celebration.continue_hint')}
          >
            <Text style={styles.buttonText}>
              {t('common.continue')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};