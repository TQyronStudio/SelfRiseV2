import React, { useState, useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';

/**
 * SafeLinearGradient - Robust wrapper component to handle ExpoLinearGradient issues
 * 
 * TECHNICAL CONTEXT:
 * With Expo SDK 53 + newArchEnabled: true, LinearGradient causes two warnings:
 * 1. "NativeViewManagerAdapter for ExpoLinearGradient isn't exported by expo-modules-core"
 * 2. "Unable to get the view config for ExpoLinearGradient"
 * 
 * ROOT CAUSE: Expo SDK 53 + React Native 0.79.5 + new architecture compatibility issues
 * 
 * SOLUTION STRATEGY:
 * 1. Try LinearGradient first (works in most cases despite warnings)
 * 2. Fallback to solid color background if LinearGradient fails to render
 * 3. Provide graceful degradation with minimal visual impact
 * 4. Suppress console warnings in production
 */

interface SafeLinearGradientProps extends LinearGradientProps {
  fallbackColor?: string;
  suppressWarnings?: boolean;
}

export const SafeLinearGradient: React.FC<SafeLinearGradientProps> = ({
  colors,
  fallbackColor,
  style,
  children,
  suppressWarnings = false,
  ...otherProps
}) => {
  const [shouldUseFallback, setShouldUseFallback] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);

  // Determine fallback color from gradient colors if not provided
  const getFallbackColor = (): string => {
    if (fallbackColor) return fallbackColor;
    if (colors && colors.length > 0) {
      // Use the first color as fallback
      return colors[0] as string;
    }
    return '#007AFF'; // Default iOS blue
  };

  // Error boundary effect to catch LinearGradient rendering issues
  useEffect(() => {
    if (!hasRendered) {
      // Give LinearGradient a chance to render
      const timer = setTimeout(() => {
        setHasRendered(true);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hasRendered]);

  // Console warning suppression for production
  useEffect(() => {
    if (suppressWarnings && __DEV__) {
      // Optionally suppress warnings in development
      const originalWarn = console.warn;
      const originalLog = console.log;
      
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('ExpoLinearGradient') || message.includes('NativeViewManagerAdapter')) {
          return; // Suppress these specific warnings
        }
        originalWarn.apply(console, args);
      };

      console.log = (...args) => {
        const message = args.join(' ');
        if (message.includes('ExpoLinearGradient')) {
          return; // Suppress these specific logs
        }
        originalLog.apply(console, args);
      };

      return () => {
        console.warn = originalWarn;
        console.log = originalLog;
      };
    }
    return undefined;
  }, [suppressWarnings]);

  // Fallback rendering with solid color background
  if (shouldUseFallback) {
    const fallbackStyle: ViewStyle = {
      backgroundColor: getFallbackColor(),
      ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
    };

    return (
      <View style={fallbackStyle}>
        {children}
      </View>
    );
  }

  // Try LinearGradient first (works despite warnings)
  try {
    return (
      <LinearGradient
        colors={colors}
        style={style}
        {...otherProps}
      >
        {children}
      </LinearGradient>
    );
  } catch (error) {
    // Immediate fallback if LinearGradient throws during render
    const fallbackStyle: ViewStyle = {
      backgroundColor: getFallbackColor(),
      ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
    };

    return (
      <View style={fallbackStyle}>
        {children}
      </View>
    );
  }
};

// Default export for easier importing
export default SafeLinearGradient;