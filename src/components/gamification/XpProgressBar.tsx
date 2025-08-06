import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';
import { useLevel } from '../../contexts/GamificationContext';
import { useHomeCustomization } from '../../contexts/HomeCustomizationContext';
import { useI18n } from '../../hooks/useI18n';
// import { LEVEL_PROGRESSION } from '../../constants/gamification'; // Unused
import { SafeLinearGradient } from '../common';

interface XpProgressBarProps {
  animated?: boolean;
  showLevelBadge?: boolean;
  showXPText?: boolean;
  height?: number;
  compactMode?: boolean;
}

export const XpProgressBar: React.FC<XpProgressBarProps> = ({
  animated = true,
  showLevelBadge = true,
  showXPText = true,
  height = 12,
  compactMode = false,
}) => {
  const { t } = useI18n();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { currentLevel, xpProgress, xpToNextLevel, getLevelInfo, isLevelMilestone, isLoading } = useLevel();
  const { state: customizationState } = useHomeCustomization();
  
  // Get level info first
  const levelInfo = getLevelInfo(currentLevel);
  const isMilestone = isLevelMilestone(currentLevel);
  
  // Add subtle pulse animation for milestone levels
  useEffect(() => {
    if (isMilestone && !isLoading) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
      return undefined;
    }
  }, [isMilestone, isLoading, pulseAnim]);
  
  // Get screen dimensions for responsive design
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 375; // iPhone SE size
  const isLargeScreen = screenWidth > 414; // Plus-sized phones and tablets
  
  // Get theme-based styling
  const getThemeStyles = () => {
    const theme = customizationState.preferences.theme;
    const baseStyles = styles.container;
    
    switch (theme.cardStyle) {
      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          shadowOpacity: 0,
          elevation: 0,
          borderWidth: 1,
          borderColor: Colors.border,
        };
      case 'bold':
        return {
          ...baseStyles,
          backgroundColor: Colors.background,
          shadowOpacity: 0.15,
          elevation: 5,
          borderWidth: 2,
          borderColor: Colors.primary + '20',
        };
      default: // 'default'
        return baseStyles;
    }
  };
  
  // Get spacing based on theme
  const getSpacingStyles = () => {
    const spacing = customizationState.preferences.theme.spacing;
    switch (spacing) {
      case 'compact':
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
          marginVertical: 6,
        };
      case 'spacious':
        return {
          paddingVertical: 16,
          paddingHorizontal: 20,
          marginVertical: 12,
        };
      default: // 'default'
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginVertical: 8,
        };
    }
  };
  
  // Enhanced animation for progress bar
  useEffect(() => {
    let animationRef: Animated.CompositeAnimation | null = null;
    
    if (animated && !isLoading) {
      // Use spring animation for more satisfying feel
      animationRef = Animated.spring(progressAnim, {
        toValue: xpProgress,
        tension: 100,
        friction: 8,
        useNativeDriver: false,
      });
      animationRef.start();
    } else {
      progressAnim.setValue(xpProgress);
    }

    return () => {
      if (animationRef) {
        animationRef.stop();
      }
    };
  }, [xpProgress, animated, isLoading, progressAnim]);

  // Get progress bar colors based on level and milestone status
  const getProgressColors = (): [string, string] => {
    if (isMilestone) {
      return ['#FFD700', '#FFA500']; // Gold gradient for milestones
    }
    
    if (currentLevel >= 50) {
      return ['#9C27B0', '#E91E63']; // Purple-pink for advanced levels
    } else if (currentLevel >= 25) {
      return ['#2196F3', '#00BCD4']; // Blue-cyan for intermediate levels  
    } else if (currentLevel >= 10) {
      return ['#4CAF50', '#8BC34A']; // Green for beginner+ levels
    } else {
      return [Colors.primary, Colors.primary]; // Standard primary color
    }
  };

  // Get level badge colors
  const getLevelBadgeColors = (): {
    background: [string, string];
    text: string;
    border: string;
  } => {
    if (isMilestone) {
      return {
        background: ['#FFD700', '#FFA500'],
        text: '#8B4513',
        border: '#DAA520',
      };
    }
    
    if (currentLevel >= 50) {
      return {
        background: ['#9C27B0', '#E91E63'],
        text: '#FFFFFF',
        border: '#7B1FA2',
      };
    } else if (currentLevel >= 25) {
      return {
        background: ['#2196F3', '#00BCD4'],
        text: '#FFFFFF', 
        border: '#1976D2',
      };
    } else if (currentLevel >= 10) {
      return {
        background: ['#4CAF50', '#8BC34A'],
        text: '#FFFFFF',
        border: '#388E3C',
      };
    } else {
      return {
        background: [Colors.primary, Colors.primary],
        text: '#FFFFFF',
        border: Colors.primary,
      };
    }
  };

  // Format numbers with thousands separators
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Get next level for display
  const nextLevel = currentLevel + 1;
  // const nextLevelInfo = getLevelInfo(nextLevel); // Unused
  
  // Get responsive badge size (made smaller per user feedback)
  const getResponsiveBadgeSize = () => {
    if (compactMode || isSmallScreen) {
      return { width: 40, height: 40, borderRadius: 20 };
    } else if (isLargeScreen) {
      return { width: 55, height: 55, borderRadius: 27.5 };
    }
    return { width: 48, height: 48, borderRadius: 24 }; // default
  };
  
  // Get responsive font sizes (adjusted for smaller circle and larger title)
  const getResponsiveFontSizes = () => {
    if (compactMode || isSmallScreen) {
      return {
        levelNumber: 14,  // Smaller to fit in smaller circle
        levelTitle: 10,   // Slightly bigger title
        xpText: 12,
        xpNumbers: 10,
      };
    } else if (isLargeScreen) {
      return {
        levelNumber: 18,  // Smaller to fit in smaller circle
        levelTitle: 12,   // Bigger title
        xpText: 16,
        xpNumbers: 14,
      };
    }
    return {
      levelNumber: 16,   // Smaller to fit in smaller circle
      levelTitle: 11,    // Bigger title
      xpText: 14,
      xpNumbers: 12,
    }; // default
  };

  const progressColors = getProgressColors();
  const badgeColors = getLevelBadgeColors();
  const badgeSize = getResponsiveBadgeSize();
  const fontSizes = getResponsiveFontSizes();
  
  const animatedWidth = animated 
    ? progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
      })
    : `${xpProgress}%`;

  if (isLoading) {
    return (
      <View style={[getThemeStyles(), getSpacingStyles(), compactMode && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('gamification.progress.loading') || 'Loading XP...'}</Text>
        </View>
      </View>
    );
  }

  // Accessibility labels
  const accessibilityLabel = t('gamification.progress.accessibility.label', {
    currentLevel,
    levelTitle: levelInfo.title,
    progress: Math.round(xpProgress),
    nextLevel,
    xpRemaining: formatNumber(xpToNextLevel),
    isMilestone: isMilestone
  }) || `Experience level ${currentLevel}, ${levelInfo.title}. ${Math.round(xpProgress)} percent progress to level ${nextLevel}. ${formatNumber(xpToNextLevel)} experience points remaining.${isMilestone ? ' This is a milestone level.' : ''}`;
  
  const accessibilityHint = t('gamification.progress.accessibility.hint', {
    isMilestone: isMilestone
  }) || `Your current experience level and progress toward the next level. ${isMilestone ? 'You have reached a special milestone level with unique rewards.' : ''}`;

  return (
    <View 
      style={[getThemeStyles(), getSpacingStyles(), compactMode && styles.containerCompact]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityValue={{ min: 0, max: 100, now: xpProgress }}
    >
      {/* Trophy-Style Level Badge */}
      {showLevelBadge && (
        <View 
          style={styles.trophyContainer}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={t('gamification.progress.badge.accessibility', {
            currentLevel,
            levelTitle: levelInfo.title,
            isMilestone: isMilestone
          }) || `Level ${currentLevel} badge, ${levelInfo.title}${isMilestone ? ', milestone level' : ''}`}
        >
          {/* Circle Badge for Level Number */}
          <Animated.View 
            style={[
              styles.levelBadgeContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <SafeLinearGradient
              colors={badgeColors.background}
              style={StyleSheet.flatten([
                styles.levelBadge,
                badgeSize,
                { borderColor: badgeColors.border },
                ...(isMilestone ? [styles.milestoneBadge] : [])
              ])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              suppressWarnings={true}
              fallbackColor={badgeColors.background[0] as string}
            >
              <Text style={[styles.levelNumber, { color: badgeColors.text, fontSize: fontSizes.levelNumber }]}>
                {currentLevel}
              </Text>
            </SafeLinearGradient>
            {isMilestone && <View style={styles.milestoneGlow} />}
          </Animated.View>
          
          {/* Rectangle Badge for Level Title */}
          {!compactMode && (
            <SafeLinearGradient
              colors={badgeColors.background}
              style={StyleSheet.flatten([styles.titleBadgeGradient, { borderColor: badgeColors.border }])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              suppressWarnings={true}
              fallbackColor={badgeColors.background[0] as string}
            >
              <Text 
                style={[styles.levelTitle, { color: badgeColors.text, fontSize: fontSizes.levelTitle }]} 
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {levelInfo.title}
              </Text>
            </SafeLinearGradient>
          )}
        </View>
      )}

      {/* Progress Bar */}
      <View 
        style={styles.progressSection}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel={t('gamification.progress.bar.accessibility', {
          progress: Math.round(xpProgress)
        }) || `Experience progress bar, ${Math.round(xpProgress)} percent complete`}
        accessibilityValue={{ min: 0, max: 100, now: xpProgress }}
      >
        <View style={[styles.progressBar, { height }]}>
          {/* Background */}
          <View style={[styles.progressBackground, { height }]} />
          
          {/* Animated Fill */}
          <Animated.View style={[styles.progressFillContainer, { width: animatedWidth as any, height }]}>
            <SafeLinearGradient
              colors={progressColors}
              style={styles.progressFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              suppressWarnings={true}
              fallbackColor={progressColors[0] as string}
            />
          </Animated.View>
          
          {/* Milestone indicator line */}
          {isMilestone && (
            <View 
              style={[styles.milestoneIndicator, { height: height + 4 }]}
              accessible={true}
              accessibilityLabel={t('gamification.progress.milestone.accessibility') || "Milestone level indicator"}
            />
          )}
        </View>

        {/* XP Text */}
        {showXPText && !compactMode && (
          <View style={styles.xpTextContainer}>
            <Text 
              style={[styles.xpText, { fontSize: fontSizes.xpText }]}
              accessible={true}
              accessibilityRole="text"
            >
              Level {currentLevel} • {Math.round(xpProgress)}% to Level {nextLevel}
            </Text>
            <Text 
              style={[styles.xpNumbers, { fontSize: fontSizes.xpNumbers }]}
              accessible={true}
              accessibilityRole="text"
            >
              {formatNumber(xpToNextLevel)} XP to go
            </Text>
          </View>
        )}

        {/* Compact XP Text */}
        {showXPText && (compactMode || isSmallScreen) && (
          <Text 
            style={[styles.xpTextCompact, { fontSize: fontSizes.xpNumbers }]}
            accessible={true}
            accessibilityRole="text"
          >
            Level {currentLevel} • {Math.round(xpProgress)}%
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  
  // Trophy-Style Level Badge Styles
  trophyContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  levelBadgeContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  levelBadge: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titleBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,  // Slightly more padding
    paddingVertical: 5,     // Slightly more padding
    minWidth: 85,           // Much wider minimum
    maxWidth: 130,          // Much wider maximum
    overflow: 'hidden',
  },
  titleBadgeGradient: {
    paddingHorizontal: 10,  // Match titleBadge padding
    paddingVertical: 5,     // Match titleBadge padding
    borderRadius: 12,
    borderWidth: 1,         // Add border to gradient
    minWidth: 85,           // Much wider minimum
    maxWidth: 130,          // Much wider maximum
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneBadge: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  milestoneGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 34,
    backgroundColor: '#FFD700',
    opacity: 0.3,
    zIndex: -1,
  },
  levelNumber: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  levelTitle: {
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
    flexGrow: 0,
  },

  // Progress Bar Styles
  progressSection: {
    flex: 1,
  },
  progressBar: {
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBackground: {
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
  progressFillContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    flex: 1,
    borderRadius: 6,
  },
  milestoneIndicator: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 3,
    backgroundColor: '#FFD700',
    borderRadius: 1.5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },

  // Text Styles
  xpTextContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpText: {
    color: Colors.text,
    fontWeight: '500',
  },
  xpNumbers: {
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  xpTextCompact: {
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});