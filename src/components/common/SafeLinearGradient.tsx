import React from 'react';
import { View, ViewStyle } from 'react-native';

// Define props interface for simplified LinearGradient replacement
interface LinearGradientProps {
  colors: (string | number)[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: ViewStyle;
  children?: React.ReactNode;
  suppressWarnings?: boolean;
  fallbackColor?: string;
}

/**
 * SafeLinearGradient - Simplified gradient component to avoid ExpoLinearGradient warnings
 * 
 * TECHNICAL CONTEXT:
 * ExpoLinearGradient causes persistent warnings in Expo SDK 53 + React Native 0.79.5:
 * "NativeViewManagerAdapter for ExpoLinearGradient isn't exported by expo-modules-core"
 * 
 * SOLUTION STRATEGY:
 * Use simple View with solid color (first gradient color) instead of actual gradient
 * This eliminates warning while maintaining visual consistency for badges and progress bars
 * 
 * TRADE-OFF: No gradient effect, but clean console and stable rendering
 * STATUS: Warning eliminated, basic color functionality preserved
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
  // Determine background color from gradient colors or fallback
  const getBackgroundColor = (): string => {
    if (fallbackColor) return fallbackColor;
    if (colors && colors.length > 0) {
      // Use the first color as background
      return colors[0] as string;
    }
    return '#007AFF'; // Default iOS blue
  };

  // Simple View with solid color instead of gradient
  // This eliminates ExpoLinearGradient warnings while maintaining basic visual functionality
  return (
    <View
      style={[
        style,
        { backgroundColor: getBackgroundColor() }
      ]}
      {...otherProps}
    >
      {children}
    </View>
  );
};