/**
 * Multiplier Countdown Timer Component
 * 
 * Compact countdown timer for XP multipliers that can be embedded
 * in various parts of the app. Features smooth animations and
 * automatic updates.
 * 
 * Features:
 * - Real-time countdown with automatic updates
 * - Compact design suitable for headers/toolbars
 * - Smooth progress circle animation
 * - Accessibility support
 * - Automatic cleanup when multiplier expires
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { XPMultiplierService, ActiveMultiplierInfo } from '../../services/xpMultiplierService';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface MultiplierCountdownTimerProps {
  /**
   * Size variant of the timer
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Color scheme
   */
  variant?: 'light' | 'dark' | 'colored';
  
  /**
   * Whether to show the progress circle
   */
  showProgressCircle?: boolean;
  
  /**
   * Whether to show multiplier value
   */
  showMultiplier?: boolean;
  
  /**
   * Callback when timer expires
   */
  onExpired?: () => void;
  
  /**
   * Custom style for container
   */
  style?: any;
  
  /**
   * Whether to update automatically
   */
  autoUpdate?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

/**
 * Get size configuration based on variant
 */
const getSizeConfig = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        containerSize: 70,
        fontSize: 11,
        multiplierFontSize: 13,
        iconSize: 18,
      };
    case 'medium':
      return {
        containerSize: 80,
        fontSize: 12,
        multiplierFontSize: 14,
        iconSize: 20,
      };
    case 'large':
      return {
        containerSize: 100,
        fontSize: 14,
        multiplierFontSize: 16,
        iconSize: 24,
      };
    default:
      return {
        containerSize: 80,
        fontSize: 12,
        multiplierFontSize: 14,
        iconSize: 20,
      };
  }
};

/**
 * Get color configuration based on variant
 */
const getColorConfig = (variant: 'light' | 'dark' | 'colored') => {
  switch (variant) {
    case 'light':
      return {
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        progressColor: '#4CAF50',
        borderColor: '#E0E0E0',
      };
    case 'dark':
      return {
        backgroundColor: '#333333',
        textColor: '#FFFFFF',
        progressColor: '#FFD700',
        borderColor: '#555555',
      };
    case 'colored':
      return {
        backgroundColor: '#FFD700',
        textColor: '#333333',
        progressColor: '#FFA500',
        borderColor: '#FFA500',
      };
    default:
      return {
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        progressColor: '#4CAF50',
        borderColor: '#E0E0E0',
      };
  }
};

/**
 * Multiplier Countdown Timer Component
 */
export const MultiplierCountdownTimer: React.FC<MultiplierCountdownTimerProps> = ({
  size = 'medium',
  variant = 'light',
  showProgressCircle = true,
  showMultiplier = true,
  onExpired,
  style,
  autoUpdate = true,
}) => {
  const { t } = useTranslation();
  
  // ========================================
  // STATE & ANIMATIONS
  // ========================================
  
  const [activeMultiplier, setActiveMultiplier] = useState<ActiveMultiplierInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [progress, setProgress] = useState<number>(1);
  
  // Animations
  const [progressAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));
  
  const sizeConfig = getSizeConfig(size);
  const colorConfig = getColorConfig(variant);
  
  // ========================================
  // DATA LOADING & UPDATES
  // ========================================
  
  /**
   * Load multiplier data
   */
  const loadMultiplierData = useCallback(async () => {
    try {
      const multiplierInfo = await XPMultiplierService.getActiveMultiplier();
      setActiveMultiplier(multiplierInfo);
      
      if (!multiplierInfo.isActive && activeMultiplier?.isActive) {
        // Multiplier just expired
        onExpired?.();
      }
    } catch (error) {
      console.error('Error loading multiplier data:', error);
    }
  }, [activeMultiplier?.isActive, onExpired]);
  
  /**
   * Update countdown and progress
   */
  const updateCountdown = useCallback(() => {
    if (!activeMultiplier?.isActive || !activeMultiplier.timeRemaining) {
      return;
    }
    
    const now = Date.now();
    const activatedTime = activeMultiplier.activatedAt?.getTime() || now;
    const totalDuration = (activeMultiplier.expiresAt?.getTime() || now) - activatedTime;
    const elapsed = now - activatedTime;
    const remaining = Math.max(0, totalDuration - elapsed);
    
    if (remaining <= 0) {
      // Timer has expired
      setTimeRemaining('0s');
      setProgress(0);
      onExpired?.();
      return;
    }
    
    // Calculate progress (1 = full time, 0 = expired)
    const progressValue = remaining / totalDuration;
    setProgress(progressValue);
    
    // Animate progress circle
    Animated.timing(progressAnim, {
      toValue: progressValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    // Format time remaining
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    let timeString = '';
    if (hours > 0) {
      timeString = `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    } else if (minutes > 0) {
      timeString = `${minutes}m${seconds > 0 && minutes < 5 ? ` ${seconds}s` : ''}`;
    } else {
      timeString = `${seconds}s`;
    }
    
    setTimeRemaining(timeString);
    
    // Start pulsing when less than 5 minutes remain
    if (remaining < 5 * 60 * 1000 && remaining > 0) {
      startUrgentPulse();
    }
  }, [activeMultiplier, onExpired, progressAnim]);
  
  /**
   * Start urgent pulse animation for low time
   */
  const startUrgentPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);
  
  // ========================================
  // EFFECTS
  // ========================================
  
  useEffect(() => {
    loadMultiplierData();
  }, []);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (autoUpdate && activeMultiplier?.isActive) {
      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoUpdate, activeMultiplier, updateCountdown]);
  
  // ========================================
  // RENDER HELPERS
  // ========================================
  
  /**
   * Render progress circle
   */
  const renderProgressCircle = () => {
    if (!showProgressCircle) return null;
    
    const radius = (sizeConfig.containerSize - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - progress);
    
    return (
      <View style={[styles.progressCircleContainer, { width: sizeConfig.containerSize, height: sizeConfig.containerSize }]}>
        <Animated.View
          style={[
            styles.progressCircle,
            {
              width: sizeConfig.containerSize - 4,
              height: sizeConfig.containerSize - 4,
              borderRadius: (sizeConfig.containerSize - 4) / 2,
              borderWidth: 2,
              borderColor: colorConfig.progressColor,
              transform: [{ rotate: '-90deg' }],
            }
          ]}
        >
          {/* This would need react-native-svg for proper circle progress */}
          {/* For now, using a simple border animation */}
        </Animated.View>
      </View>
    );
  };
  
  /**
   * Render timer content
   */
  const renderTimerContent = () => {
    if (!activeMultiplier?.isActive) {
      return (
        <View style={styles.inactiveContainer}>
          <Text style={[styles.inactiveText, { fontSize: sizeConfig.fontSize }]}>
            No Multiplier
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.activeContainer}>
        {showMultiplier && (
          <Text 
            style={[
              styles.multiplierValue, 
              { 
                fontSize: sizeConfig.multiplierFontSize,
                color: colorConfig.textColor,
              }
            ]}
          >
            {activeMultiplier.multiplier}x
          </Text>
        )}
        <Text 
          style={[
            styles.timeText, 
            { 
              fontSize: sizeConfig.fontSize,
              color: colorConfig.textColor,
            }
          ]}
        >
          {timeRemaining}
        </Text>
      </View>
    );
  };
  
  // ========================================
  // MAIN RENDER
  // ========================================
  
  if (!activeMultiplier?.isActive && size === 'small') {
    // Don't show small timer when inactive to save space
    return null;
  }
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: sizeConfig.containerSize,
          height: sizeConfig.containerSize,
          backgroundColor: colorConfig.backgroundColor,
          borderColor: colorConfig.borderColor,
          transform: [{ scale: pulseAnim }],
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="timer"
      accessibilityLabel={
        activeMultiplier?.isActive 
          ? `XP Multiplier: ${activeMultiplier.multiplier}x, ${timeRemaining} remaining`
          : 'No active XP multiplier'
      }
      testID="multiplier-countdown-timer"
    >
      {renderProgressCircle()}
      
      <View style={styles.contentContainer}>
        <Text style={[styles.iconText, { fontSize: sizeConfig.iconSize }]}>
          ⚡
        </Text>
        {renderTimerContent()}
      </View>
    </Animated.View>
  );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  
  progressCircleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  progressCircle: {
    position: 'absolute',
  },
  
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iconText: {
    marginBottom: 2,
  },
  
  activeContainer: {
    alignItems: 'center',
  },
  
  inactiveContainer: {
    alignItems: 'center',
  },
  
  multiplierValue: {
    fontWeight: 'bold',
    lineHeight: 16,
  },
  
  timeText: {
    fontWeight: '600',
    lineHeight: 14,
  },
  
  inactiveText: {
    color: '#999999',
    textAlign: 'center',
    lineHeight: 12,
  },
});

export default MultiplierCountdownTimer;