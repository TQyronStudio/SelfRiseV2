/**
 * XP Multiplier Indicator Component
 * 
 * Displays active XP multipliers with countdown timer, visual effects,
 * and harmony streak progress. Features professional design with
 * subtle animations and comprehensive user feedback.
 * 
 * Features:
 * - Active multiplier display with countdown timer
 * - Harmony streak progress visualization
 * - Activation button with eligibility checking
 * - Pulse animations and visual effects
 * - Accessibility support and screen reader compatibility
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { XPMultiplierService, ActiveMultiplierInfo, HarmonyStreakResult } from '../../services/xpMultiplierService';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface XpMultiplierIndicatorProps {
  /**
   * Whether to show the multiplier indicator
   */
  visible?: boolean;
  
  /**
   * Callback when multiplier is activated
   */
  onMultiplierActivated?: (multiplier: ActiveMultiplierInfo) => void;
  
  /**
   * Callback when activation fails
   */
  onActivationError?: (error: string) => void;
  
  /**
   * Custom style for the container
   */
  style?: any;
  
  /**
   * Whether to show harmony streak progress when no multiplier is active
   */
  showHarmonyProgress?: boolean;
  
  /**
   * Position of the indicator ('top' | 'bottom' | 'inline')
   */
  position?: 'top' | 'bottom' | 'inline';
}

const { width: screenWidth } = Dimensions.get('window');

/**
 * XP Multiplier Indicator Component
 */
export const XpMultiplierIndicator: React.FC<XpMultiplierIndicatorProps> = ({
  visible = true,
  onMultiplierActivated,
  onActivationError,
  style,
  showHarmonyProgress = true,
  position = 'inline',
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  // ========================================
  // STATE & ANIMATIONS
  // ========================================
  
  const [activeMultiplier, setActiveMultiplier] = useState<ActiveMultiplierInfo | null>(null);
  const [harmonyStreak, setHarmonyStreak] = useState<HarmonyStreakResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Animations
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));
  
  // Animation refs for cleanup
  const activeAnimationsRef = useRef<{ pulse?: any; glow?: any; progress?: any }>({});
  
  // ========================================
  // DATA LOADING & UPDATES
  // ========================================
  
  /**
   * Load multiplier and harmony streak data
   */
  const loadMultiplierData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [multiplierInfo, streakInfo] = await Promise.all([
        XPMultiplierService.getActiveMultiplier(),
        XPMultiplierService.getCachedHarmonyStreak() || XPMultiplierService.calculateHarmonyStreak(),
      ]);
      
      setActiveMultiplier(multiplierInfo);
      setHarmonyStreak(streakInfo);
      
      // Start animations based on state
      if (multiplierInfo.isActive) {
        startMultiplierAnimations();
      } else if (streakInfo?.canActivateMultiplier) {
        startReadyAnimations();
      } else if (streakInfo) {
        startProgressAnimations(streakInfo.currentStreak);
      }
      
    } catch (error) {
      console.error('Error loading multiplier data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Update countdown timer
   */
  const updateCountdown = useCallback(() => {
    if (activeMultiplier?.isActive && activeMultiplier.timeRemaining) {
      const remaining = Math.max(0, activeMultiplier.timeRemaining - (Date.now() - (activeMultiplier.activatedAt?.getTime() || 0)));
      
      if (remaining <= 0) {
        // Multiplier has expired, reload data
        loadMultiplierData();
        return;
      }
      
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    }
  }, [activeMultiplier, loadMultiplierData]);
  
  // ========================================
  // EFFECTS
  // ========================================
  
  useEffect(() => {
    if (visible) {
      loadMultiplierData();
    }
  }, [visible, loadMultiplierData]);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (activeMultiplier?.isActive) {
      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeMultiplier, updateCountdown]);
  
  // ========================================
  // ANIMATIONS
  // ========================================
  
  /**
   * Stop all running animations
   */
  const stopAllAnimations = useCallback(() => {
    if (activeAnimationsRef.current.pulse) {
      activeAnimationsRef.current.pulse.stop();
      activeAnimationsRef.current.pulse = undefined;
    }
    if (activeAnimationsRef.current.glow) {
      activeAnimationsRef.current.glow.stop();
      activeAnimationsRef.current.glow = undefined;
    }
    if (activeAnimationsRef.current.progress) {
      activeAnimationsRef.current.progress.stop();
      activeAnimationsRef.current.progress = undefined;
    }
  }, []);
  
  /**
   * Start animations for active multiplier
   */
  const startMultiplierAnimations = useCallback(() => {
    // Stop any existing animations first
    stopAllAnimations();
    
    // Pulse animation for active multiplier
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    activeAnimationsRef.current.pulse = pulseAnimation;
    
    // Glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowAnimation.start();
    activeAnimationsRef.current.glow = glowAnimation;
  }, [pulseAnim, glowAnim]);
  
  /**
   * Start animations for ready-to-activate state
   */
  const startReadyAnimations = useCallback(() => {
    // Stop any existing animations first
    stopAllAnimations();
    
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
    activeAnimationsRef.current.pulse = pulseAnimation;
  }, [pulseAnim, stopAllAnimations]);
  
  /**
   * Start progress animations
   */
  const startProgressAnimations = useCallback((currentStreak: number) => {
    const progress = Math.min(currentStreak / 7, 1); // 7 days required for harmony streak
    
    // Stop existing progress animation if running
    if (activeAnimationsRef.current.progress) {
      activeAnimationsRef.current.progress.stop();
    }
    
    const progressAnimation = Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    });
    progressAnimation.start();
    activeAnimationsRef.current.progress = progressAnimation;
  }, [progressAnim]);
  
  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      stopAllAnimations();
    };
  }, [stopAllAnimations]);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  /**
   * Handle multiplier activation attempt
   */
  const handleActivateMultiplier = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Announce action for accessibility
      AccessibilityInfo.announceForAccessibility(t('gamification.multiplier.activatingMultiplier'));

      const result = await XPMultiplierService.activateHarmonyMultiplier();

      if (result.success && result.multiplier) {
        setActiveMultiplier(result.multiplier);
        onMultiplierActivated?.(result.multiplier);

        // Reload data to get updated state
        await loadMultiplierData();

        // Announce success
        const hours = Math.ceil((result.multiplier.timeRemaining || 0) / (1000 * 60 * 60));
        AccessibilityInfo.announceForAccessibility(
          t('gamification.multiplier.multiplierActivatedMessage', {
            multiplier: result.multiplier.multiplier,
            hours
          })
        );
      } else {
        const errorMessage = result.reason || result.error || t('gamification.multiplier.unknownError');
        onActivationError?.(errorMessage);

        // Announce error
        AccessibilityInfo.announceForAccessibility(
          t('gamification.multiplier.activationFailed', { error: errorMessage })
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('gamification.multiplier.unknownError');
      onActivationError?.(errorMessage);

      AccessibilityInfo.announceForAccessibility(
        t('gamification.multiplier.activationFailed', { error: errorMessage })
      );
    } finally {
      setIsLoading(false);
    }
  }, [onMultiplierActivated, onActivationError, loadMultiplierData]);
  
  // ========================================
  // RENDER HELPERS
  // ========================================
  
  /**
   * Render active multiplier display
   */
  const renderActiveMultiplier = () => {
    if (!activeMultiplier?.isActive) return null;
    
    const glowColor = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.7)'],
    });
    
    return (
      <Animated.View
        style={[
          styles.multiplierContainer,
          styles.activeMultiplier,
          {
            transform: [{ scale: pulseAnim }],
            shadowColor: glowColor,
          }
        ]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={t('gamification.multiplier.activeMultiplier', {
          multiplier: activeMultiplier.multiplier,
          time: timeRemaining
        })}
      >
        <View style={styles.multiplierHeader}>
          <Text style={styles.multiplierIcon}>⚡</Text>
          <Text style={styles.multiplierText}>
            {t('gamification.multiplier.multiplierValue', { multiplier: activeMultiplier.multiplier })}
          </Text>
        </View>

        <Text style={styles.timeRemaining}>{timeRemaining}</Text>

        <Text style={styles.multiplierSource}>
          {activeMultiplier.source === 'harmony_streak'
            ? t('gamification.multiplier.harmonyStreak')
            : t('home.xpMultiplier.multiplierActive')}
        </Text>
      </Animated.View>
    );
  };
  
  /**
   * Render harmony streak progress
   */
  const renderHarmonyProgress = () => {
    if (!harmonyStreak || activeMultiplier?.isActive) return null;
    
    const canActivate = harmonyStreak.canActivateMultiplier;
    const progress = Math.min(harmonyStreak.currentStreak / 7, 1);
    
    return (
      <Animated.View 
        style={[
          styles.multiplierContainer,
          canActivate ? styles.readyMultiplier : styles.progressMultiplier,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        {canActivate ? (
          <TouchableOpacity
            style={styles.activateButton}
            onPress={handleActivateMultiplier}
            disabled={isLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('gamification.multiplier.activateMultiplierAccessibility', {
              streak: harmonyStreak.currentStreak
            })}
            accessibilityHint={t('gamification.multiplier.activateMultiplierHint')}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.activateIcon}>🚀</Text>
                <Text style={styles.activateText}>{t('gamification.multiplier.activateButton')}</Text>
                <Text style={styles.activateSubtext}>{t('gamification.multiplier.duration24h')}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={t('gamification.multiplier.harmonyProgressAccessibility', {
              current: harmonyStreak.currentStreak
            })}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressIcon}>🎯</Text>
              <Text style={styles.progressText}>
                {t('gamification.multiplier.harmonyStreakProgress', { current: harmonyStreak.currentStreak })}
              </Text>
            </View>

            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            <Text style={styles.progressSubtext}>
              {t('gamification.multiplier.progressSubtext')}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };
  
  // ========================================
  // MAIN RENDER
  // ========================================
  
  if (!visible) return null;

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, style]} testID="xp-multiplier-indicator">
      {renderActiveMultiplier()}
      {showHarmonyProgress && renderHarmonyProgress()}
    </View>
  );
};

// ========================================
// STYLES
// ========================================

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },

  multiplierContainer: {
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: 16,
    padding: 16,
    marginVertical: 4,
    width: Math.min(screenWidth - 32, 320),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  activeMultiplier: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  
  readyMultiplier: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  
  progressMultiplier: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  multiplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  multiplierIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  
  multiplierText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },

  timeRemaining: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },

  multiplierSource: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  activateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  
  activateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  
  activateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  
  activateSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  progressIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },

  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },

  progressSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default XpMultiplierIndicator;