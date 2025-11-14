/**
 * XP Multiplier Section Component for Home Screen
 * 
 * Displays XP multiplier status and harmony streak progress on the home screen.
 * Features compact design with quick activation and progress visualization.
 * 
 * Features:
 * - Active multiplier display with countdown
 * - Harmony streak progress indicator
 * - Quick activation button when eligible
 * - Smooth animations and state transitions
 * - Integration with home screen customization
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/contexts/ThemeContext';
import { XPMultiplierService, ActiveMultiplierInfo, HarmonyStreakResult, MultiplierActivationResult } from '../../services/xpMultiplierService';
import { MultiplierActivationModal } from '../gamification/MultiplierActivationModal';
import { MultiplierCountdownTimer } from '../gamification/MultiplierCountdownTimer';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface XpMultiplierSectionProps {
  /**
   * Whether the section is visible (from home customization)
   */
  visible?: boolean;
  
  /**
   * Callback when section state changes
   */
  onStateChange?: (hasActiveContent: boolean) => void;
  
  /**
   * Custom style for the section
   */
  style?: any;
  
  /**
   * Whether to show in compact mode
   */
  compact?: boolean;
}

/**
 * XP Multiplier Section Component
 */
export const XpMultiplierSection: React.FC<XpMultiplierSectionProps> = ({
  visible = true,
  onStateChange,
  style,
  compact = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  // ========================================
  // STATE & ANIMATIONS
  // ========================================
  
  const [activeMultiplier, setActiveMultiplier] = useState<ActiveMultiplierInfo | null>(null);
  const [harmonyStreak, setHarmonyStreak] = useState<HarmonyStreakResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationResult, setActivationResult] = useState<MultiplierActivationResult | null>(null);
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));
  
  // ========================================
  // DATA LOADING & UPDATES
  // ========================================
  
  /**
   * Load multiplier and harmony streak data
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [multiplierInfo, streakInfo] = await Promise.all([
        XPMultiplierService.getActiveMultiplier(),
        XPMultiplierService.getCachedHarmonyStreak() || XPMultiplierService.calculateHarmonyStreak(),
      ]);
      
      setActiveMultiplier(multiplierInfo);
      setHarmonyStreak(streakInfo);
      
      // Notify parent about content state
      const hasActiveContent = Boolean(
        multiplierInfo.isActive || 
        (streakInfo?.canActivateMultiplier) || 
        (streakInfo && streakInfo.currentStreak >= 3) // Show progress when close
      );
      onStateChange?.(hasActiveContent);
      
      // Start entrance animation if content is visible
      if (hasActiveContent && visible) {
        startEntranceAnimation();
      }
      
    } catch (error) {
      console.error('Error loading multiplier data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [visible, onStateChange]);
  
  /**
   * Start entrance animation
   */
  const startEntranceAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);
  
  // ========================================
  // EFFECTS
  // ========================================
  
  useEffect(() => {
    if (visible) {
      loadData();
      
      // Refresh data periodically
      const interval = setInterval(loadData, 60000); // Every minute
      return () => clearInterval(interval);
    }
    return undefined; // Explicit return for non-visible case
  }, [visible, loadData]);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  /**
   * Handle multiplier activation
   */
  const handleActivateMultiplier = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const result = await XPMultiplierService.activateHarmonyMultiplier();
      setActivationResult(result);
      
      if (result.success) {
        setShowActivationModal(true);
        await loadData(); // Refresh data
      } else {
        // Show error (could use a toast or alert)
        console.error('Multiplier activation failed:', result.reason || result.error);
      }
    } catch (error) {
      console.error('Error activating multiplier:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);
  
  /**
   * Handle modal close
   */
  const handleModalClose = useCallback(() => {
    setShowActivationModal(false);
    setActivationResult(null);
    loadData(); // Refresh data after modal closes
  }, [loadData]);
  
  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Format time remaining for display
   */
  const formatTimeRemaining = () => {
    if (!activeMultiplier?.isActive || !activeMultiplier.timeRemaining) {
      return '';
    }

    const remaining = activeMultiplier.timeRemaining;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `(${hours}h${minutes > 0 ? ` ${minutes}m` : ''} remaining)`;
    } else if (minutes > 0) {
      return `(${minutes}m remaining)`;
    } else {
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      return `(${seconds}s remaining)`;
    }
  };

  /**
   * Render active multiplier display
   */
  const renderActiveMultiplier = () => {
    if (!activeMultiplier?.isActive) return null;

    return (
      <View style={styles.activeMultiplierContainer}>
        <View style={styles.multiplierInfo}>
          <Text style={styles.multiplierTitle}>
            {t('home.xpMultiplier.activeTitle', { time: formatTimeRemaining() })}
          </Text>
          <Text style={styles.multiplierSubtext}>
            {activeMultiplier.source === 'harmony_streak' ? t('home.xpMultiplier.harmonyReward') : t('home.xpMultiplier.multiplierActive')}
          </Text>
        </View>

        {!compact && (
          <Text style={styles.multiplierDescription}>
            {t('home.xpMultiplier.activeDescription')}
          </Text>
        )}
      </View>
    );
  };
  
  /**
   * Render harmony streak progress
   */
  const renderHarmonyProgress = () => {
    if (!harmonyStreak || activeMultiplier?.isActive) return null;
    
    const canActivate = harmonyStreak.canActivateMultiplier;
    const progress = Math.min(harmonyStreak.currentStreak / 7, 1);
    
    if (!canActivate && harmonyStreak.currentStreak < 3) {
      // Don't show if streak is too low
      return null;
    }
    
    return (
      <View style={styles.harmonyProgressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressIcon}>🎯</Text>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>
              {t('home.xpMultiplier.harmonyStreak', { current: harmonyStreak.currentStreak })}
            </Text>
            <Text style={styles.progressSubtext}>
              {canActivate
                ? t('home.xpMultiplier.readyToActivate')
                : t('home.xpMultiplier.moreDays', { days: 7 - harmonyStreak.currentStreak })
              }
            </Text>
          </View>
        </View>
        
        {!compact && (
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
        )}
        
        {canActivate && (
          <TouchableOpacity
            style={styles.activateButton}
            onPress={handleActivateMultiplier}
            disabled={isLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Activate 2x XP multiplier"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.activateButtonText}>{t('home.xpMultiplier.activateButton')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  /**
   * Check if section should be visible
   */
  const shouldShowSection = () => {
    if (!visible) return false;

    // Show section when:
    // 1. Multiplier is NOT active AND harmony streak progress exists (show progress)
    // 2. Multiplier IS active (show active multiplier info since header timer might not be visible to everyone)
    return activeMultiplier?.isActive ||
           (!activeMultiplier?.isActive && (
             (harmonyStreak?.canActivateMultiplier) ||
             (harmonyStreak && harmonyStreak.currentStreak >= 3)
           ));
  };
  
  // ========================================
  // STYLES
  // ========================================

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
    },

    compactContainer: {
      padding: 12,
      marginVertical: 4,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },

    activeMultiplierContainer: {
      backgroundColor: '#FFD700',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },

    multiplierHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },

    multiplierInfo: {
      marginLeft: 12,
      flex: 1,
    },

    multiplierTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333333',
    },

    multiplierSubtext: {
      fontSize: 12,
      color: '#666666',
      marginTop: 2,
    },

    multiplierDescription: {
      fontSize: 12,
      color: '#555555',
      fontStyle: 'italic',
    },

    harmonyProgressContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
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

    progressInfo: {
      flex: 1,
    },

    progressTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },

    progressSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

    progressBarContainer: {
      width: '100%',
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginBottom: 12,
      overflow: 'hidden',
    },

    progressBar: {
      height: '100%',
      backgroundColor: '#4CAF50',
      borderRadius: 3,
    },

    activateButton: {
      backgroundColor: '#4CAF50',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },

    activateButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 14,
    },
  });

  // ========================================
  // MAIN RENDER
  // ========================================

  if (!shouldShowSection()) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          compact && styles.compactContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
          style,
        ]}
        testID="xp-multiplier-section"
      >
        {/* Section Header */}
        <Text style={styles.sectionTitle}>{t('home.xpMultiplier.sectionTitle')}</Text>
        
        {/* Content */}
        {renderActiveMultiplier()}
        {renderHarmonyProgress()}
      </Animated.View>
      
      {/* Activation Modal */}
      <MultiplierActivationModal
        visible={showActivationModal}
        multiplier={activationResult?.multiplier || null}
        harmonyStreakLength={harmonyStreak?.currentStreak || 0}
        bonusXP={activationResult?.xpBonusAwarded || 0}
        onClose={handleModalClose}
        showShare={false} // Can be enabled for social features
      />
    </>
  );
};

export default XpMultiplierSection;