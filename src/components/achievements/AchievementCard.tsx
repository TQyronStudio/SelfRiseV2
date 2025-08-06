import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors } from '@/src/constants/colors';
import { 
  Achievement, 
  AchievementRarity,
} from '@/src/types/gamification';
import { useAccessibility, getHighContrastRarityColors, getHighContrastGlowColors } from '@/src/hooks/useAccessibility';
import { useI18n } from '@/src/hooks/useI18n';

interface AchievementCardProps {
  achievement: Achievement;
  userProgress?: number;
  isUnlocked: boolean;
  onPress?: () => void;
}

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

const getRarityGlow = (rarity: AchievementRarity, isHighContrast: boolean): string => {
  const glowColors = getHighContrastGlowColors(isHighContrast);
  
  switch (rarity) {
    case AchievementRarity.COMMON: return glowColors.common;
    case AchievementRarity.RARE: return glowColors.rare;
    case AchievementRarity.EPIC: return glowColors.epic;
    case AchievementRarity.LEGENDARY: return glowColors.legendary;
    default: return isHighContrast ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 122, 255, 0.2)';
  }
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  userProgress = 0,
  isUnlocked,
  onPress,
}) => {
  const { t } = useI18n();
  const { isHighContrastEnabled, isReduceMotionEnabled } = useAccessibility();
  
  const rarityColor = getRarityColor(achievement.rarity, isHighContrastEnabled);
  const rarityGlow = getRarityGlow(achievement.rarity, isHighContrastEnabled);
  const progress = achievement.isProgressive ? userProgress : (isUnlocked ? 100 : 0);
  
  // Animation states for micro-interactions
  const [scaleAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  
  const handlePressIn = () => {
    if (isReduceMotionEnabled) {
      // Skip animations for reduce motion
      return;
    }
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };
  
  const handlePressOut = () => {
    if (isReduceMotionEnabled) {
      // Skip animations for reduce motion
      return;
    }
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const dynamicGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', rarityGlow],
  });
  
  // Accessibility label for the achievement card
  const accessibilityLabel = t('achievements.card.accessibility_label', {
    name: achievement.name,
    rarity: t(`achievements.rarity.${achievement.rarity.toLowerCase()}`),
    isUnlocked: isUnlocked,
    progress: Math.round(progress),
    description: achievement.description
  }) || `${achievement.name}, ${achievement.rarity.toLowerCase()} rarity achievement, ${isUnlocked ? 'unlocked' : `${Math.round(progress)}% progress`}. ${achievement.description}`;

  const accessibilityHint = t('achievements.card.accessibility_hint', {
    isUnlocked: isUnlocked,
    hasProgress: achievement.isProgressive
  }) || `${isUnlocked ? 'Completed achievement' : 'In progress achievement'}. Tap for more details.`;

  return (
    <Animated.View
      style={[
        { 
          shadowColor: rarityColor,
          shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [isUnlocked ? 0.1 : 0, isUnlocked ? 0.3 : 0.1],
          }),
          shadowRadius: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 8],
          }),
        }
      ]}
    >
      <Animated.View
        style={[
          { transform: isReduceMotionEnabled ? [] : [{ scale: scaleAnim }] }
        ]}
      >
      <TouchableOpacity
        style={[
          styles.card,
          !isUnlocked && styles.cardLocked,
          { 
            borderColor: isUnlocked ? rarityColor : Colors.border,
            backgroundColor: isUnlocked ? rarityGlow : Colors.white,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isUnlocked && !achievement.isProgressive}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
      {/* Rarity indicator */}
      <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />
      
      {/* Achievement icon */}
      <View style={styles.iconContainer}>
        <Text 
          style={[
            styles.icon,
            !isUnlocked && styles.iconLocked
          ]}
        >
          {achievement.icon}
        </Text>
      </View>
      
      {/* Achievement info */}
      <View style={styles.infoContainer}>
        <Text 
          style={[
            styles.name,
            !isUnlocked && styles.textLocked
          ]} 
          numberOfLines={2}
        >
          {achievement.name}
        </Text>
        
        <View style={styles.bottomRow}>
          <Text 
            style={[
              styles.xpReward,
              !isUnlocked && styles.textLocked,
              { color: isUnlocked ? rarityColor : Colors.textSecondary }
            ]}
          >
            {achievement.xpReward} XP
          </Text>
          
          {/* Rarity badge */}
          <View style={[styles.rarityBadge, { backgroundColor: isUnlocked ? rarityColor : Colors.gray }]}>
            <Text style={styles.rarityText}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Progress bar for progressive achievements */}
      {achievement.isProgressive && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progress}%`,
                  backgroundColor: isUnlocked ? rarityColor : Colors.gray
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, !isUnlocked && styles.textLocked]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
      
      {/* Locked overlay */}
      {!isUnlocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedIcon}>🔒</Text>
        </View>
      )}
      </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 120,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 8,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  cardLocked: {
    opacity: 0.7,
  },
  rarityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  icon: {
    fontSize: 24,
  },
  iconLocked: {
    opacity: 0.5,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  textLocked: {
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  xpReward: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  rarityBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 1.5,
    marginRight: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 8,
    fontWeight: '500',
    color: Colors.textSecondary,
    minWidth: 20,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
});