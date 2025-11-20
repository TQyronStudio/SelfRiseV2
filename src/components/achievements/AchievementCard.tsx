import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
  Achievement,
  AchievementRarity,
} from '@/src/types/gamification';
import { useAccessibility, getHighContrastRarityColors, getHighContrastGlowColors } from '@/src/hooks/useAccessibility';
import { useI18n } from '@/src/hooks/useI18n';
import {
  generateProgressHint,
  generateCompletionInfo,
  generateSmartTooltip,
  UserStats
} from '@/src/utils/achievementPreviewUtils';
import { AchievementService } from '@/src/services/achievementService';
import { AchievementTooltip } from './AchievementTooltip';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  onPress?: () => void;
  showPreview?: boolean; // Enable preview functionality
  realTimeProgress?: number | undefined; // Pre-calculated real-time progress
  userStats?: UserStats; // Pre-loaded user stats for preview
}

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
  isUnlocked,
  onPress,
  showPreview = true,
  realTimeProgress,
  userStats,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const { isHighContrastEnabled, isReduceMotionEnabled } = useAccessibility();
  
  const rarityColor = getRarityColor(achievement.rarity, isHighContrastEnabled);
  const rarityGlow = getRarityGlow(achievement.rarity, isHighContrastEnabled);
  
  // Use passed realTimeProgress or fallback to basic calculation
  const progress = realTimeProgress !== undefined 
    ? realTimeProgress 
    : achievement.isProgressive 
      ? 0 
      : (isUnlocked ? 100 : 0);
  
  // Animation states for micro-interactions
  const [scaleAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  
  // Preview system states
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Generate preview data if enabled and userStats provided
  const progressHint = showPreview && userStats && !isUnlocked
    ? generateProgressHint(achievement, userStats, t)
    : undefined;

  const completionInfo = showPreview && userStats && isUnlocked
    ? generateCompletionInfo(achievement, userStats)
    : undefined;

  const smartTooltip = showPreview && userStats
    ? generateSmartTooltip(achievement, progress)
    : undefined;
  
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
  
  // Enhanced tap handler for preview system
  const handleCardPress = () => {
    // In Browse All mode, always open detail modal instead of tooltip
    if (onPress) {
      onPress();
    }
    // Note: Tooltip preview disabled in Browse All mode to avoid confusion
  };
  
  // Accessibility label for the achievement card
  const status = isUnlocked 
    ? 'unlocked' 
    : achievement.isProgressive 
      ? `${Math.round(progress)}% progress`
      : 'locked';
      
  const accessibilityLabel = t('achievements.card.accessibility_label', {
    name: t(achievement.nameKey),
    rarity: t(`achievements.rarity.${achievement.rarity.toLowerCase()}`),
    status: status,
    description: t(achievement.descriptionKey)
  }) || `${t(achievement.nameKey)}, ${achievement.rarity.toLowerCase()} rarity achievement, ${status}. ${t(achievement.descriptionKey)}`;

  const accessibilityHint = t('achievements.card.accessibility_hint') ||
    `${isUnlocked ? 'Completed achievement' : 'In progress achievement'}. Tap for more details.`;

  // Styles - moved inside component to access colors
  const styles = StyleSheet.create({
    card: {
      width: 150,
      height: 130, // Increased from 120 to 130 to prevent overlap
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      padding: 8,
      marginBottom: 12,
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
      color: colors.text,
      textAlign: 'center',
      lineHeight: 14,
    },
    textLocked: {
      color: colors.textSecondary,
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
      color: colors.white,
      textTransform: 'uppercase',
    },
    progressContainer: {
      marginTop: 8,
      paddingHorizontal: 8,
      paddingBottom: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressTrack: {
      flex: 1,
      height: 3,
      backgroundColor: colors.border,
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
      color: colors.textSecondary,
      minWidth: 20,
    },
    lockedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    lockedIcon: {
      fontSize: 20,
      opacity: 0.6,
    },
    progressHintText: {
      fontSize: 9,
      fontWeight: '500',
      textAlign: 'center',
      marginTop: 2,
      lineHeight: 12,
    },
    completionText: {
      fontSize: 9,
      fontWeight: '500',
      color: colors.success,
      textAlign: 'center',
      marginTop: 2,
      lineHeight: 12,
    },
  });

  return (
    <>
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
            borderColor: isUnlocked ? rarityColor : colors.border,
            backgroundColor: isUnlocked ? rarityGlow : colors.cardBackgroundElevated,
          },
        ]}
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={false} // Always allow tap for preview
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
          {t(achievement.nameKey)}
        </Text>
        
        {/* Progress hint for locked achievements */}
        {!isUnlocked && progressHint && (
          <Text 
            style={[
              styles.progressHintText,
              { color: rarityColor + '80' }
            ]}
            numberOfLines={1}
          >
            {progressHint.progressText}
          </Text>
        )}
        
        {/* Completion info for unlocked achievements */}
        {isUnlocked && completionInfo && (
          <Text 
            style={styles.completionText}
            numberOfLines={1}
          >
            ✅ {completionInfo.accomplishment}
          </Text>
        )}
        
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.xpReward,
              !isUnlocked && styles.textLocked,
              { color: isUnlocked ? rarityColor : colors.textSecondary }
            ]}
          >
            {achievement.xpReward} XP
          </Text>
          
          {/* Rarity badge */}
          <View style={[styles.rarityBadge, { backgroundColor: isUnlocked ? rarityColor : colors.gray }]}>
            <Text style={styles.rarityText}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Progress bar for all achievements */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: isUnlocked ? rarityColor : colors.gray
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, !isUnlocked && styles.textLocked]}>
          {Math.round(progress)}%
        </Text>
      </View>
      
      {/* Locked overlay */}
      {!isUnlocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedIcon}>🔒</Text>
        </View>
      )}
      </TouchableOpacity>
      </Animated.View>
    </Animated.View>
    
    {/* Achievement Preview Tooltip */}
    {showPreview && userStats && (
      <AchievementTooltip
        visible={showTooltip}
        onClose={() => setShowTooltip(false)}
        achievement={achievement}
        isUnlocked={isUnlocked}
        progressHint={progressHint}
        completionInfo={completionInfo}
        smartTooltip={smartTooltip}
      />
    )}
  </>
  );
};