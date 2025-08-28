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
import { Colors, Fonts, Layout } from '@/src/constants';
import { useXpFeedback } from '@/src/hooks/useXpFeedback';
import { Achievement, AchievementRarity } from '@/src/types/gamification';
import { useAccessibility, getHighContrastRarityColors } from '@/src/hooks/useAccessibility';

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
    default: return isHighContrast ? '#000000' : Colors.primary;
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
  // Early return BEFORE any hooks to prevent React hooks rule violations
  if (!achievement) {
    return null;
  }

  const { t } = useI18n();
  const { isHighContrastEnabled, isReduceMotionEnabled } = useAccessibility();
  const { triggerHapticFeedback, playSoundEffect } = useXpFeedback();

  // Animation states
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  const rarityColor = getRarityColor(achievement.rarity, isHighContrastEnabled);
  const rarityHaptic = getRarityHapticIntensity(achievement.rarity);
  const raritySound = getRaritySoundEffect(achievement.rarity);

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

  const getRarityTitle = (rarity: AchievementRarity): string => {
    switch (rarity) {
      case AchievementRarity.COMMON: return 'Achievement Unlocked!';
      case AchievementRarity.RARE: return 'Rare Achievement!';
      case AchievementRarity.EPIC: return 'Epic Achievement!';
      case AchievementRarity.LEGENDARY: return 'Legendary Achievement!';
      default: return 'Achievement Unlocked!';
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
      // Accessibility announcement
      const announcement = t('achievements.celebration.announcement', { 
        name: achievement.name,
        rarity: achievement.rarity.toLowerCase(),
        xp: xpAwarded
      }) || `Achievement unlocked: ${achievement.name}! ${achievement.rarity} rarity achievement earned ${xpAwarded} XP.`;
      
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
            {getRarityTitle(achievement.rarity)}
          </Text>

          {/* Achievement name */}
          <Text style={styles.achievementName}>
            {achievement.name}
          </Text>

          {/* Achievement description */}
          <Text style={styles.description}>
            {achievement.description}
          </Text>

          {/* Rarity badge */}
          <View style={[
            styles.rarityBadge,
            { backgroundColor: rarityColor }
          ]}>
            <Text style={styles.rarityText}>
              {achievement.rarity.toUpperCase()}
            </Text>
          </View>

          {/* XP reward */}
          <View style={[
            styles.xpBadge,
            { borderColor: rarityColor }
          ]}>
            <Text style={styles.xpLabel}>XP Earned</Text>
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
            accessibilityLabel={t('achievements.celebration.continue_button') || 'Continue'}
            accessibilityHint={t('achievements.celebration.continue_hint') || 'Close achievement celebration and return to app'}
          >
            <Text style={styles.buttonText}>
              {t('common.continue') || 'Continue'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 3, // Border for rarity theming
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    maxWidth: screenWidth * 0.85,
    width: '100%',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  description: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
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
    color: Colors.white,
    letterSpacing: 1,
  },
  xpBadge: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    backgroundColor: Colors.backgroundSecondary || '#F8F9FA',
  },
  xpLabel: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
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
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});