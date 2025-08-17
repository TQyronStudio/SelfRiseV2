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
import { View, Text, StyleSheet, Animated, Dimensions, AccessibilityInfo } from 'react-native';
import { Colors } from '../../constants/colors';
import { useEnhancedLevel } from '../../hooks/useEnhancedGamification';
import { useHomeCustomization } from '../../contexts/HomeCustomizationContext';
import { useI18n } from '../../hooks/useI18n';
import { SafeLinearGradient } from '../common';

interface OptimizedXpProgressBarProps {
  animated?: boolean;
  showLevelBadge?: boolean;
  showXPText?: boolean;
  height?: number;
  compactMode?: boolean;
  performanceMode?: 'auto' | 'performance' | 'quality'; // Performance optimization control
}

const ANIMATION_THROTTLE_MS = 16; // 60fps = 16.67ms between frames
const PROGRESS_CACHE_THRESHOLD = 0.1; // Only animate if progress changed by >0.1%
const REDUCED_MOTION_DURATION = 100; // Faster animations for reduced motion
const NORMAL_ANIMATION_DURATION = 500; // Normal animation duration

export const OptimizedXpProgressBar: React.FC<OptimizedXpProgressBarProps> = React.memo(({
  animated = true,
  showLevelBadge = true,
  showXPText = true,
  height = 12,
  compactMode = false,
  performanceMode = 'auto',
}) => {
  console.log('🎯 OptimizedXpProgressBar render');
  
  // Accessibility - Reduced motion support
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);
  const lastProgressRef = useRef(0);
  const animationThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { t } = useI18n();
  
  // Check for reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotionEnabled);
  }, []);
  
  // CRITICAL: Use enhanced hooks for real-time updates (migrated from OptimizedGamificationContext)
  const { 
    currentLevel, 
    xpProgress, 
    xpToNextLevel, 
    getLevelInfo, 
    isLevelMilestone, 
    isLoading,
    progressCache,
    updateSequence 
  } = useEnhancedLevel();
  
  const { state: customizationState } = useHomeCustomization();
  
  // Animation refs - ONLY use native driver compatible animations
  const progressAnim = useRef(new Animated.Value(xpProgress)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lastUpdateSequence = useRef(updateSequence);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Performance tracking
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // ========================================
  // CACHED CALCULATIONS (Memoized for Performance)
  // ========================================

  // Level info with caching
  const levelInfo = useMemo(() => {
    return getLevelInfo(currentLevel);
  }, [currentLevel, getLevelInfo]);

  const isMilestone = useMemo(() => {
    return isLevelMilestone(currentLevel);
  }, [currentLevel, isLevelMilestone]);

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
      default:
        return baseStyles;
    }
  }, [customizationState.preferences.theme.cardStyle]);

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
    if (isMilestone) return ['#FFD700', '#FFA500'];
    if (currentLevel >= 50) return ['#9C27B0', '#E91E63'];
    if (currentLevel >= 25) return ['#2196F3', '#00BCD4'];
    if (currentLevel >= 10) return ['#4CAF50', '#8BC34A'];
    return [Colors.primary, Colors.primary];
  }, [isMilestone, currentLevel]);

  const badgeColors = useMemo(() => {
    if (isMilestone) {
      return {
        background: ['#FFD700', '#FFA500'] as [string, string],
        text: '#8B4513',
        border: '#DAA520',
      };
    }
    if (currentLevel >= 50) {
      return {
        background: ['#9C27B0', '#E91E63'] as [string, string],
        text: '#FFFFFF',
        border: '#7B1FA2',
      };
    }
    if (currentLevel >= 25) {
      return {
        background: ['#2196F3', '#00BCD4'] as [string, string],
        text: '#FFFFFF', 
        border: '#1976D2',
      };
    }
    if (currentLevel >= 10) {
      return {
        background: ['#4CAF50', '#8BC34A'] as [string, string],
        text: '#FFFFFF',
        border: '#388E3C',
      };
    }
    return {
      background: [Colors.primary, Colors.primary] as [string, string],
      text: '#FFFFFF',
      border: Colors.primary,
    };
  }, [isMilestone, currentLevel]);

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

  // Milestone pulse animation with performance optimization
  useEffect(() => {
    if (!isMilestone || isLoading) {
      pulseAnim.setValue(1);
      return;
    }

    // Performance mode check
    if (effectivePerformanceMode === 'performance') {
      pulseAnim.setValue(1.02); // Static slight scale for performance mode
      return;
    }

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true, // CRITICAL: Native thread
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
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
  }, [isMilestone, isLoading, pulseAnim, effectivePerformanceMode]);

  // CRITICAL: Optimized progress animation with native driver
  useEffect(() => {
    // Skip animation if update sequence hasn't changed
    if (updateSequence === lastUpdateSequence.current) {
      return;
    }
    lastUpdateSequence.current = updateSequence;

    // Throttle rapid updates for performance
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    const updateProgress = () => {
      // Check for reduced motion preference
      if (!animated || isLoading || reducedMotionEnabled) {
        progressAnim.setValue(xpProgress);
        return;
      }

      // Performance optimization: Skip small changes
      // Use listener to get current value instead of private _value
      let currentProgress = 0;
      progressAnim.addListener(({ value }) => { currentProgress = value; });
      progressAnim.removeAllListeners();
      
      const progressDiff = Math.abs(xpProgress - currentProgress);
      
      if (progressDiff < PROGRESS_CACHE_THRESHOLD && progressCache.cacheTime > 0) {
        console.log(`⚡ Skipping small progress change: ${progressDiff.toFixed(2)}%`);
        return;
      }

      console.log(`🎯 Animating progress: ${currentProgress.toFixed(1)}% → ${xpProgress.toFixed(1)}%`);

      // Choose animation type based on performance mode and accessibility
      const duration = reducedMotionEnabled ? REDUCED_MOTION_DURATION : 
                      effectivePerformanceMode === 'performance' ? 200 : NORMAL_ANIMATION_DURATION;
      
      const animationConfig = effectivePerformanceMode === 'performance' || reducedMotionEnabled
        ? {
            // Fast, simple timing animation for performance or reduced motion
            animation: Animated.timing(progressAnim, {
              toValue: xpProgress,
              duration,
              useNativeDriver: false, // Progress width requires layout thread
            })
          }
        : {
            // Smooth spring animation for quality (when motion is preferred)
            animation: Animated.spring(progressAnim, {
              toValue: xpProgress,
              tension: 100,
              friction: 8,
              useNativeDriver: false, // Progress width requires layout thread
            })
          };

      animationConfig.animation.start((finished) => {
        if (finished) {
          console.log(`✅ Progress animation completed: ${xpProgress.toFixed(1)}%`);
        }
      });
    };

    // CRITICAL: Throttle updates for frame drop prevention
    if (animationThrottleRef.current) {
      clearTimeout(animationThrottleRef.current);
    }
    
    // Advanced throttling based on progress change rate
    const progressChangeRate = Math.abs(xpProgress - lastProgressRef.current);
    const throttleDelay = progressChangeRate > 5 ? ANIMATION_THROTTLE_MS * 2 : ANIMATION_THROTTLE_MS;
    
    lastProgressRef.current = xpProgress;
    animationThrottleRef.current = setTimeout(updateProgress, throttleDelay);

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (animationThrottleRef.current) {
        clearTimeout(animationThrottleRef.current);
      }
    };
  }, [xpProgress, animated, isLoading, updateSequence, effectivePerformanceMode, progressCache.cacheTime]);

  // ========================================
  // OPTIMIZED RENDER HELPERS
  // ========================================

  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString();
  }, []);

  const animatedWidth = useMemo(() => {
    return animated 
      ? progressAnim.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%'],
          extrapolate: 'clamp',
        })
      : `${xpProgress}%`;
  }, [animated, progressAnim, xpProgress]);

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
  // PERFORMANCE LOGGING
  // ========================================

  useEffect(() => {
    console.log(`🎯 OptimizedXpProgressBar performance: render #${renderCountRef.current}, mode: ${effectivePerformanceMode}, sequence: ${updateSequence}`);
  }, [effectivePerformanceMode, updateSequence]);

  // ========================================
  // RENDER
  // ========================================

  if (isLoading) {
    return (
      <View style={[themeStyles, spacingStyles, compactMode && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('gamification.progress.loading') || 'Loading XP...'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View 
      style={[themeStyles, spacingStyles, compactMode && styles.containerCompact]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: xpProgress }}
    >
      {/* Optimized Level Badge */}
      {showLevelBadge && (
        <View style={styles.trophyContainer}>
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
              fallbackColor={badgeColors.background[0]}
            >
              <Text style={[styles.levelNumber, { color: badgeColors.text, fontSize: fontSizes.levelNumber }]}>
                {currentLevel}
              </Text>
            </SafeLinearGradient>
            {isMilestone && <View style={styles.milestoneGlow} />}
          </Animated.View>
          
          {!compactMode && (
            <SafeLinearGradient
              colors={badgeColors.background}
              style={StyleSheet.flatten([styles.titleBadgeGradient, { borderColor: badgeColors.border }])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              suppressWarnings={true}
              fallbackColor={badgeColors.background[0]}
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

      {/* Optimized Progress Bar */}
      <View style={styles.progressSection}>
        <View style={[styles.progressBar, { height }]}>
          <View style={[styles.progressBackground, { height }]} />
          
          {/* CRITICAL: Animated progress fill */}
          <Animated.View style={[styles.progressFillContainer, { width: animatedWidth as any, height }]}>
            <SafeLinearGradient
              colors={progressColors}
              style={styles.progressFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              suppressWarnings={true}
              fallbackColor={progressColors[0]}
            />
          </Animated.View>
          
          {isMilestone && (
            <View style={[styles.milestoneIndicator, { height: height + 4 }]} />
          )}
        </View>

        {/* Optimized XP Text */}
        {showXPText && !compactMode && (
          <View style={styles.xpTextContainer}>
            <Text style={[styles.xpText, { fontSize: fontSizes.xpText }]}>
              Level {currentLevel} • {Math.round(xpProgress)}% to Level {currentLevel + 1}
            </Text>
            <Text style={[styles.xpNumbers, { fontSize: fontSizes.xpNumbers }]}>
              {formatNumber(xpToNextLevel)} XP to go
            </Text>
          </View>
        )}

        {showXPText && compactMode && (
          <Text style={[styles.xpTextCompact, { fontSize: fontSizes.xpNumbers }]}>
            Level {currentLevel} • {Math.round(xpProgress)}%
          </Text>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // CRITICAL: Intelligent comparison for React.memo optimization
  const propsChanged = (
    prevProps.animated !== nextProps.animated ||
    prevProps.showLevelBadge !== nextProps.showLevelBadge ||
    prevProps.showXPText !== nextProps.showXPText ||
    prevProps.height !== nextProps.height ||
    prevProps.compactMode !== nextProps.compactMode ||
    prevProps.performanceMode !== nextProps.performanceMode
  );
  
  if (propsChanged) {
    console.log('🎯 OptimizedXpProgressBar props changed, re-rendering');
  }
  
  return !propsChanged; // Return true to skip re-render, false to re-render
});

// ========================================
// OPTIMIZED STYLES
// ========================================

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
    shadowOffset: { width: 0, height: 2 },
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

OptimizedXpProgressBar.displayName = 'OptimizedXpProgressBar';