/**
 * Optimized XP Progress Bar - Real-time 60fps Performance
 * 
 * CRITICAL: Production-grade XP counter with bulletproof 60fps rendering
 * Think Hard methodology - smooth real-time updates bez frame drops
 * 
 * Key Optimizations:
 * - React.memo with intelligent comparison for reduced re-renders
 * - Native driver animations for 60fps thread performance
 * - Throttled updates for rapid XP changes
 * - Cached progress calculations
 * - Simplified animation logic for budget devices
 * - Smart memoization for complex calculations
 */

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated, Dimensions, AccessibilityInfo, DeviceEventEmitter, Platform, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { GamificationService } from '../../services/gamificationService';
import { getCurrentLevel, getXPProgress, getLevelInfo, isLevelMilestone, clearLevelCalculationCache } from '../../services/levelCalculation';
import { useHomeCustomization } from '../../contexts/HomeCustomizationContext';
import { useI18n } from '../../hooks/useI18n';
import { SafeLinearGradient, HelpTooltip } from '../common';
import { useTutorialTarget } from '../../utils/TutorialTargetHelper';

interface OptimizedXpProgressBarProps {
  animated?: boolean;
  showLevelBadge?: boolean;
  showXPText?: boolean;
  height?: number;
  compactMode?: boolean;
  performanceMode?: 'auto' | 'performance' | 'quality'; // Performance optimization control
}

const OptimizedXpProgressBarComponent = React.forwardRef<View, OptimizedXpProgressBarProps>(({
  animated = true,
  showLevelBadge = true,
  showXPText = true,
  height = 12,
  compactMode = false,
  performanceMode = 'auto',
}, ref) => {
  // Theme and i18n
  const { colors } = useTheme();
  const { t } = useI18n();

  // Accessibility - Reduced motion support
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  // Tutorial target registration
  const containerRef = useRef<View>(null);
  const { registerTarget, unregisterTarget } = useTutorialTarget('xp-progress-bar', containerRef);

  // Check for reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotionEnabled);
  }, []);

  // Register tutorial target on mount
  useEffect(() => {
    registerTarget();
    return () => unregisterTarget();
  }, [registerTarget, unregisterTarget]);
  
  // CRITICAL: Direct GamificationService integration for real-time updates (unified system)
  const [gamificationState, setGamificationState] = useState({
    totalXP: 0,
    currentLevel: 1,
    xpProgress: 0,
    xpToNextLevel: 0,
    isLoading: true,
    updateSequence: 0,
  });

  // Real-time XP data fetching and event listening
  const fetchGamificationData = useCallback(async () => {
    try {
      const stats = await GamificationService.getGamificationStats();
      
      setGamificationState(prev => ({
        totalXP: stats.totalXP,
        currentLevel: stats.currentLevel,
        xpProgress: stats.xpProgress,
        xpToNextLevel: stats.xpToNextLevel,
        isLoading: false,
        updateSequence: prev.updateSequence + 1,
      }));
    } catch (error) {
      console.error('OptimizedXpProgressBar: Failed to fetch gamification data:', error);
      setGamificationState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // CRITICAL: Level-up specific data fetching with cache invalidation
  const fetchGamificationDataWithCacheInvalidation = useCallback(async () => {
    try {
      // Clear level calculation cache to prevent desynchronization, then fetch fresh stats
      clearLevelCalculationCache();
      const stats = await GamificationService.getGamificationStats();

      setGamificationState(prev => ({
        totalXP: stats.totalXP,
        currentLevel: stats.currentLevel,
        xpProgress: stats.xpProgress,
        xpToNextLevel: stats.xpToNextLevel,
        isLoading: false,
        updateSequence: prev.updateSequence + 1,
      }));
    } catch (error) {
      console.error('OptimizedXpProgressBar: Failed to fetch gamification data with cache invalidation:', error);
      setGamificationState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Listen for XP updates from GamificationService
  useEffect(() => {
    // Initial data fetch
    fetchGamificationData();

    // Listen for real-time XP changes (normal cache behavior)
    const xpGainedSubscription = DeviceEventEmitter.addListener('xpGained', fetchGamificationData);
    
    // CRITICAL: Listen for level up events with cache invalidation
    const levelUpSubscription = DeviceEventEmitter.addListener('levelUp', fetchGamificationDataWithCacheInvalidation);
    
    return () => {
      xpGainedSubscription.remove();
      levelUpSubscription.remove();
    };
  }, [fetchGamificationData, fetchGamificationDataWithCacheInvalidation]);

  // Memoized utility functions
  const levelInfo = useMemo(() => getLevelInfo(gamificationState.currentLevel), [gamificationState.currentLevel]);
  const isMilestone = useMemo(() => isLevelMilestone(gamificationState.currentLevel), [gamificationState.currentLevel]);

  // Destructure for component usage
  const { 
    totalXP,
    currentLevel, 
    xpProgress, 
    xpToNextLevel, 
    isLoading,
    updateSequence 
  } = gamificationState;
  
  const { state: customizationState } = useHomeCustomization();
  
  // Animation refs
  // pulseAnim: RN Animated.Value (native driver loop, no change needed)
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  // progressShared: Reanimated shared value (UI-thread animation with width percentage)
  const progressShared = useSharedValue(xpProgress);
  const reducedMotion = useReducedMotion();
  const lastUpdateSequence = useRef(updateSequence);

  // ========================================
  // CACHED CALCULATIONS (Memoized for Performance)
  // ========================================

  // levelInfo and isMilestone already defined above with GamificationService data

  // Screen dimensions with caching
  const screenMetrics = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return {
      screenWidth,
      isSmallScreen: screenWidth < 375,
      isLargeScreen: screenWidth > 414
    };
  }, []);

  // Performance mode detection
  const effectivePerformanceMode = useMemo(() => {
    if (performanceMode !== 'auto') return performanceMode;
    
    // Auto-detect based on device and update frequency
    const isHighFrequencyUpdates = updateSequence - lastUpdateSequence.current > 5;
    const isBudgetDevice = screenMetrics.isSmallScreen;
    
    if (isHighFrequencyUpdates || isBudgetDevice) {
      return 'performance';
    }
    return 'quality';
  }, [performanceMode, updateSequence, screenMetrics.isSmallScreen]);

  // ========================================
  // THEME CALCULATIONS (Memoized)
  // ========================================

  const themeStyles = useMemo(() => {
    const theme = customizationState.preferences.theme;
    const baseStyles = styles(colors).container;

    switch (theme.cardStyle) {
      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          shadowOpacity: 0,
          elevation: 0,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'bold':
        return {
          ...baseStyles,
          backgroundColor: colors.cardBackgroundElevated,
          shadowOpacity: 0.15,
          elevation: 5,
          borderWidth: 2,
          borderColor: colors.primary + '20',
        };
      default:
        return baseStyles;
    }
  }, [customizationState.preferences.theme.cardStyle, colors]);

  const spacingStyles = useMemo(() => {
    const spacing = customizationState.preferences.theme.spacing;
    switch (spacing) {
      case 'compact':
        return { paddingVertical: 8, paddingHorizontal: 12, marginVertical: 6 };
      case 'spacious':
        return { paddingVertical: 16, paddingHorizontal: 20, marginVertical: 12 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 16, marginVertical: 8 };
    }
  }, [customizationState.preferences.theme.spacing]);

  // ========================================
  // COLOR CALCULATIONS (Memoized)
  // ========================================

  const progressColors = useMemo((): [string, string] => {
    // Colors based on rarity tier - motivační progrese
    if (currentLevel >= 81) return ['#F44336', '#E91E63']; // Red (Mythic/Exotic) 81-100
    if (currentLevel >= 61) return ['#FFD700', '#FFC107']; // Gold (Legendary) 61-80
    if (currentLevel >= 41) return ['#9C27B0', '#673AB7']; // Purple (Epic) 41-60
    if (currentLevel >= 21) return ['#2196F3', '#00BCD4']; // Blue (Rare) 21-40
    if (currentLevel >= 11) return ['#4CAF50', '#66BB6A']; // Green (Growing) 11-20
    return ['#9E9E9E', '#757575']; // Grey (Beginner) 1-10
  }, [currentLevel]);

  const badgeColors = useMemo(() => {
    // Badge colors based on rarity tier - motivační progrese
    if (currentLevel >= 81) {
      return {
        background: ['#F44336', '#E91E63'] as [string, string], // Red (Mythic/Exotic)
        text: '#FFFFFF',
        border: '#D32F2F',
      };
    }
    if (currentLevel >= 61) {
      return {
        background: ['#FFD700', '#FFC107'] as [string, string], // Gold (Legendary)
        text: '#8B4513',
        border: '#F57F17',
      };
    }
    if (currentLevel >= 41) {
      return {
        background: ['#9C27B0', '#673AB7'] as [string, string], // Purple (Epic)
        text: '#FFFFFF',
        border: '#7B1FA2',
      };
    }
    if (currentLevel >= 21) {
      return {
        background: ['#2196F3', '#00BCD4'] as [string, string], // Blue (Rare)
        text: '#FFFFFF', 
        border: '#1976D2',
      };
    }
    if (currentLevel >= 11) {
      return {
        background: ['#4CAF50', '#66BB6A'] as [string, string], // Green (Growing)
        text: '#FFFFFF',
        border: '#388E3C',
      };
    }
    return {
      background: ['#9E9E9E', '#757575'] as [string, string], // Grey (Beginner)
      text: '#FFFFFF',
      border: '#616161',
    };
  }, [currentLevel]);

  // ========================================
  // RARITY BORDER COLORS (Memoized)
  // ========================================

  const rarityBorderColor = useMemo(() => {
    // Decentní barevné ohraničení podle rarity úrovně - motivační progrese
    if (currentLevel >= 81) return '#F44336'; // Red (Mythic/Exotic) 81-100
    if (currentLevel >= 61) return '#FFD700'; // Gold (Legendary) 61-80
    if (currentLevel >= 41) return '#9C27B0'; // Purple (Epic) 41-60
    if (currentLevel >= 21) return '#2196F3'; // Blue (Rare) 21-40
    if (currentLevel >= 11) return '#4CAF50'; // Green (Growing) 11-20
    return '#9E9E9E'; // Grey (Beginner) 1-10
  }, [currentLevel]);

  const levelRomanAndTitle = useMemo(() => {
    // Extrahuj římskou číslici a základní název z levelInfo.title
    const titleParts = levelInfo.title.match(/^(.+?)\s+([IVX]+)$/);
    
    if (titleParts) {
      return {
        baseName: titleParts[1], // např. "Beginner"
        romanNumeral: titleParts[2] // např. "V"
      };
    }
    
    // Fallback pokud regex neodpovídá
    return {
      baseName: levelInfo.title,
      romanNumeral: ''
    };
  }, [levelInfo.title]);

  // ========================================
  // SIZE CALCULATIONS (Memoized)
  // ========================================

  const badgeSize = useMemo(() => {
    if (compactMode || screenMetrics.isSmallScreen) {
      return { width: 40, height: 40, borderRadius: 20 };
    } else if (screenMetrics.isLargeScreen) {
      return { width: 55, height: 55, borderRadius: 27.5 };
    }
    return { width: 48, height: 48, borderRadius: 24 };
  }, [compactMode, screenMetrics.isSmallScreen, screenMetrics.isLargeScreen]);

  const fontSizes = useMemo(() => {
    if (compactMode || screenMetrics.isSmallScreen) {
      return { levelNumber: 14, levelTitle: 10, xpText: 12, xpNumbers: 10 };
    } else if (screenMetrics.isLargeScreen) {
      return { levelNumber: 18, levelTitle: 12, xpText: 16, xpNumbers: 14 };
    }
    return { levelNumber: 16, levelTitle: 11, xpText: 14, xpNumbers: 12 };
  }, [compactMode, screenMetrics.isSmallScreen, screenMetrics.isLargeScreen]);

  // ========================================
  // OPTIMIZED ANIMATIONS (60fps Native Driver)
  // ========================================

  // Breathing pulse animation for all levels with performance optimization
  useEffect(() => {
    if (isLoading) {
      pulseAnim.setValue(1);
      return;
    }

    // Performance mode check
    if (effectivePerformanceMode === 'performance') {
      pulseAnim.setValue(1.02); // Static slight scale for performance mode
      return;
    }

    // Breathing animation for all levels - slower and subtler for organic feel
    const pulseAnimation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1.04, // Subtler scale for breathing effect
          duration: 2000, // Slower breathing rhythm
          useNativeDriver: true, // CRITICAL: Native thread
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000, // Slower breathing rhythm
          useNativeDriver: true, // CRITICAL: Native thread
        }),
      ])
    );
    
    const timeout = setTimeout(() => {
      pulseAnimation.start();
    }, 100);
    
    return () => {
      clearTimeout(timeout);
      pulseAnimation.stop();
    };
  }, [isLoading, pulseAnim, effectivePerformanceMode]);

  // Progress animation — Reanimated 3 shared value, runs on UI thread.
  // Reanimated handles rapid target updates gracefully (new spring interrupts smoothly),
  // so the old throttle/cache/ref logic is no longer needed.
  useEffect(() => {
    if (updateSequence === lastUpdateSequence.current) {
      return;
    }
    lastUpdateSequence.current = updateSequence;

    if (!animated || isLoading || reducedMotion || reducedMotionEnabled) {
      progressShared.value = xpProgress;
      return;
    }

    if (effectivePerformanceMode === 'performance') {
      progressShared.value = withTiming(xpProgress, { duration: 200 });
    } else {
      progressShared.value = withSpring(xpProgress, {
        damping: 15,
        stiffness: 100,
      });
    }
  }, [xpProgress, animated, isLoading, updateSequence, effectivePerformanceMode, reducedMotion, reducedMotionEnabled, progressShared]);

  // ========================================
  // OPTIMIZED RENDER HELPERS
  // ========================================

  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString();
  }, []);

  // Reanimated animated style for progress fill width — runs on UI thread
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, progressShared.value))}%`,
  }));

  // ========================================
  // ACCESSIBILITY (Memoized)
  // ========================================

  const accessibilityLabel = useMemo(() => {
    return t('gamification.progress.accessibility.label', {
      currentLevel,
      levelTitle: levelInfo.title,
      progress: Math.round(xpProgress),
      nextLevel: currentLevel + 1,
      xpRemaining: formatNumber(xpToNextLevel),
      isMilestone: isMilestone
    }) || `Experience level ${currentLevel}, ${levelInfo.title}. ${Math.round(xpProgress)} percent progress to level ${currentLevel + 1}. ${formatNumber(xpToNextLevel)} experience points remaining.${isMilestone ? ' This is a milestone level.' : ''}`;
  }, [currentLevel, levelInfo.title, xpProgress, xpToNextLevel, isMilestone, formatNumber, t]);

  // ========================================
  // RENDER
  // ========================================

  const dynamicStyles = useMemo(() => styles(colors), [colors]);

  if (isLoading) {
    return (
      <View style={[themeStyles, spacingStyles, compactMode && dynamicStyles.containerCompact]}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>{t('gamification.progress.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      ref={(node) => {
        // Support both forwarded ref and tutorial target ref
        containerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      style={[
        themeStyles,
        spacingStyles,
        compactMode && dynamicStyles.containerCompact,
        { borderColor: rarityBorderColor, borderWidth: 2 }
      ]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(xpProgress) }}
      nativeID="xp-progress-bar"
    >
      {/* Level Title and Roman Numerals - Top Center */}
      <View style={dynamicStyles.rarityRomanContainer}>
        <View style={dynamicStyles.titleHeaderRow}>
          <Text
            style={[
              dynamicStyles.levelTitleRomanStyle,
              { color: rarityBorderColor }
            ]}
          >
            {levelRomanAndTitle.baseName}
          </Text>
          <HelpTooltip
            helpKey="home.xpSystem"
            iconSize={16}
            maxWidth={300}
            variant="prominent"
          />
        </View>
        {levelRomanAndTitle.romanNumeral && (
          <Text
            style={[
              dynamicStyles.rarityRomanText,
              { color: rarityBorderColor }
            ]}
          >
            {levelRomanAndTitle.romanNumeral}
          </Text>
        )}
      </View>

      {/* Level Badge - Top Left Corner */}
      {showLevelBadge && (
        <View style={dynamicStyles.topLeftBadgeContainer}>
          <RNAnimated.View
            style={[
              dynamicStyles.levelBadgeContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <SafeLinearGradient
              colors={badgeColors.background}
              style={StyleSheet.flatten([
                dynamicStyles.levelBadge,
                badgeSize,
                { borderColor: badgeColors.border },
                ...(isMilestone ? [dynamicStyles.milestoneBadge] : [])
              ])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              suppressWarnings={true}
              fallbackColor={badgeColors.background[0]}
            >
              <Text style={[dynamicStyles.levelNumber, { color: badgeColors.text, fontSize: fontSizes.levelNumber }]}>
                {currentLevel}
              </Text>
            </SafeLinearGradient>
            {isMilestone && <View style={dynamicStyles.milestoneGlow} />}
          </RNAnimated.View>
        </View>
      )}

      {/* Main Content Row */}
      <View style={dynamicStyles.mainContentRow}>

      {/* Optimized Progress Bar */}
      <View style={dynamicStyles.progressSection}>
        <View style={[dynamicStyles.progressBar, { height }]}>
          <View style={[dynamicStyles.progressBackground, { height }]} />

          {/* CRITICAL: Animated progress fill — Reanimated 3, width animated on UI thread */}
          <Animated.View style={[dynamicStyles.progressFillContainer, { height }, animatedProgressStyle]}>
            <SafeLinearGradient
              colors={progressColors}
              style={dynamicStyles.progressFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              suppressWarnings={true}
              fallbackColor={progressColors[0]}
            />
          </Animated.View>

          {isMilestone && (
            <View style={[dynamicStyles.milestoneIndicator, { height: height + 4 }]} />
          )}
        </View>

        {/* Optimized XP Text */}
        {showXPText && !compactMode && (
          <View style={dynamicStyles.xpTextContainer}>
            <Text style={[dynamicStyles.xpText, { fontSize: fontSizes.xpText }]}>
              {t('gamification.progress.levelProgressFull', { currentLevel, progress: xpProgress.toFixed(1), nextLevel: currentLevel + 1 })}
            </Text>
            <Text style={[dynamicStyles.xpNumbers, { fontSize: fontSizes.xpNumbers }]}>
              {t('gamification.progress.xpProgressText', { current: formatNumber(totalXP), total: formatNumber(totalXP + xpToNextLevel) })}
            </Text>
          </View>
        )}

        {showXPText && compactMode && (
          <Text style={[dynamicStyles.xpTextCompact, { fontSize: fontSizes.xpNumbers }]}>
            {t('gamification.progress.levelProgressCompact', { level: currentLevel, progress: xpProgress.toFixed(1) })}
          </Text>
        )}
      </View>
      </View>

      {/* Info Button - Top Right Corner */}
      <TouchableOpacity
        style={dynamicStyles.infoButtonAbsolute}
        onPress={() => router.push('/levels-overview')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={t('accessibility.viewAllLevels')}
        accessibilityHint={t('accessibility.hints.openLevelOverview')}
      >
        <Ionicons
          name="information-circle"
          size={20}
          color={rarityBorderColor}
        />
      </TouchableOpacity>
    </View>
  );
});

export const OptimizedXpProgressBar = React.memo(OptimizedXpProgressBarComponent, (prevProps, nextProps) => {
  // CRITICAL: Intelligent comparison for React.memo optimization
  const propsChanged = (
    prevProps.animated !== nextProps.animated ||
    prevProps.showLevelBadge !== nextProps.showLevelBadge ||
    prevProps.showXPText !== nextProps.showXPText ||
    prevProps.height !== nextProps.height ||
    prevProps.compactMode !== nextProps.compactMode ||
    prevProps.performanceMode !== nextProps.performanceMode
  );

  return !propsChanged; // Return true to skip re-render, false to re-render
});

// ========================================
// OPTIMIZED STYLES
// ========================================

const styles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative', // Pro absolutní pozicování badge
  },
  containerCompact: {
    paddingVertical: 2,
    paddingHorizontal: 12,
  },

  topLeftBadgeContainer: {
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 10,
  },

  mainContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
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
  titleBadgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 85,
    maxWidth: 130,
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
  progressSection: {
    flex: 1,
  },
  progressBar: {
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBackground: {
    backgroundColor: colors.border,
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
  xpTextContainer: {
    marginTop: 8,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  xpText: {
    color: colors.text,
    fontWeight: '500',
  },
  xpNumbers: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  xpTextCompact: {
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // ========================================
  // RARITY ROMAN NUMERALS STYLES
  // ========================================

  rarityRomanContainer: {
    alignItems: 'center',
    paddingVertical: 0,
    marginBottom: 2,
    marginTop: 2,
  },

  titleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },


  infoButtonAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  levelTitleRomanStyle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  rarityRomanText: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    textTransform: 'uppercase',
  },
});

OptimizedXpProgressBar.displayName = 'OptimizedXpProgressBar';
