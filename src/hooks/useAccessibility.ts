import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

export interface AccessibilityState {
  isHighContrastEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isScreenReaderEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
}

export const useAccessibility = () => {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    isHighContrastEnabled: false,
    isReduceMotionEnabled: false,
    isScreenReaderEnabled: false,
    isReduceTransparencyEnabled: false,
  });

  useEffect(() => {
    const checkAccessibilitySettings = async () => {
      try {
        // Check if screen reader is enabled
        const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        
        // Check if reduce motion is enabled (iOS only)
        let isReduceMotionEnabled = false;
        try {
          isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled?.() || false;
        } catch (error) {
          // Reduce motion check not available on all platforms
          isReduceMotionEnabled = false;
        }

        // Check if reduce transparency is enabled (iOS only)
        let isReduceTransparencyEnabled = false;
        try {
          isReduceTransparencyEnabled = await AccessibilityInfo.isReduceTransparencyEnabled?.() || false;
        } catch (error) {
          // Reduce transparency check not available on all platforms
          isReduceTransparencyEnabled = false;
        }

        // For high contrast, we can infer from other settings or use a heuristic
        // Note: Android high contrast detection is not supported in React Native AccessibilityInfo
        // Only iOS reduce transparency can be detected. Android would need native implementation.
        const isHighContrastEnabled = isReduceTransparencyEnabled || false;

        setAccessibilityState({
          isHighContrastEnabled,
          isReduceMotionEnabled,
          isScreenReaderEnabled,
          isReduceTransparencyEnabled,
        });
      } catch (error) {
        console.warn('Error checking accessibility settings:', error);
      }
    };

    checkAccessibilitySettings();

    // Listen for screen reader changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isScreenReaderEnabled: boolean) => {
        setAccessibilityState(prev => ({
          ...prev,
          isScreenReaderEnabled,
        }));
      }
    );

    // Listen for reduce motion changes (iOS only)
    let reduceMotionSubscription: any;
    if (AccessibilityInfo.addEventListener) {
      try {
        reduceMotionSubscription = AccessibilityInfo.addEventListener(
          'reduceMotionChanged',
          (isReduceMotionEnabled: boolean) => {
            setAccessibilityState(prev => ({
              ...prev,
              isReduceMotionEnabled,
            }));
          }
        );
      } catch (error) {
        // Reduce motion listener not available on all platforms
      }
    }

    // Listen for reduce transparency changes (iOS only)
    let reduceTransparencySubscription: any;
    if (AccessibilityInfo.addEventListener) {
      try {
        reduceTransparencySubscription = AccessibilityInfo.addEventListener(
          'reduceTransparencyChanged',
          (isReduceTransparencyEnabled: boolean) => {
            setAccessibilityState(prev => ({
              ...prev,
              isReduceTransparencyEnabled,
              // Update high contrast based on reduce transparency
              isHighContrastEnabled: isReduceTransparencyEnabled,
            }));
          }
        );
      } catch (error) {
        // Reduce transparency listener not available on all platforms
      }
    }

    return () => {
      subscription.remove();
      if (reduceMotionSubscription?.remove) {
        reduceMotionSubscription.remove();
      }
      if (reduceTransparencySubscription?.remove) {
        reduceTransparencySubscription.remove();
      }
    };
  }, []);

  return accessibilityState;
};

// High contrast color utilities for gamification
export const getHighContrastRarityColors = (isHighContrast: boolean) => {
  if (!isHighContrast) {
    // Return normal colors
    return {
      common: '#9E9E9E',
      rare: '#2196F3', 
      epic: '#9C27B0',
      legendary: '#FFD700',
    };
  }

  // High contrast colors with better accessibility
  return {
    common: '#000000',      // Black for highest contrast
    rare: '#0066CC',        // Darker blue
    epic: '#6B1C8C',        // Darker purple  
    legendary: '#CC9900',   // Darker gold
  };
};

export const getHighContrastGlowColors = (isHighContrast: boolean) => {
  if (!isHighContrast) {
    // Return normal glow colors
    return {
      common: 'rgba(158, 158, 158, 0.2)',
      rare: 'rgba(33, 150, 243, 0.2)',
      epic: 'rgba(156, 39, 176, 0.2)',
      legendary: 'rgba(255, 215, 0, 0.3)',
    };
  }

  // High contrast glow colors (more pronounced)
  return {
    common: 'rgba(0, 0, 0, 0.4)',
    rare: 'rgba(0, 102, 204, 0.4)',
    epic: 'rgba(107, 28, 140, 0.4)', 
    legendary: 'rgba(204, 153, 0, 0.5)',
  };
};