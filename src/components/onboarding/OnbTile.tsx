import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAccessibility } from '@/src/hooks/useAccessibility';
import { Fonts } from '@/src/constants/fonts';
import { Layout } from '@/src/constants/dimensions';
import { scaleFont, getScreenSize, ScreenSize } from '@/src/utils/responsive';

/**
 * A pickable tile: icon, label, optional secondary line.
 *
 * Used for habit presets (screen 1) and goal templates (screen 2), so both
 * screens read as one flow rather than two different products.
 *
 * The visible label doubles as the accessibility label — that is the correct
 * practice, and inventing a second string would only let the two drift apart.
 * Selection is announced through `accessibilityState`, which the OS localises
 * itself.
 */
export interface OnbTileProps {
  label: string;
  /** Ionicons name. */
  icon: string;
  /** Accent used for the icon chip, and for the border once selected. */
  accentColor: string;
  selected?: boolean;
  /** Optional second line, e.g. "12 books". */
  detail?: string | undefined;
  onPress: () => void;
}

/**
 * Two columns on phones, three once there is room. Kept here so every grid in
 * onboarding lines up without each screen inventing its own breakpoint.
 */
export function getOnbTileColumns(): number {
  const size = getScreenSize();
  return size === ScreenSize.SMALL || size === ScreenSize.MEDIUM ? 2 : 3;
}

export function OnbTile({
  label,
  icon,
  accentColor,
  selected = false,
  detail,
  onPress,
}: OnbTileProps) {
  const { colors } = useTheme();
  const { isReduceMotionEnabled } = useAccessibility();
  const scale = useRef(new Animated.Value(1)).current;

  // Press feedback is a nicety, never a requirement — users who asked the OS
  // for less motion get the same tile without the squeeze.
  const animateTo = (value: number) => {
    if (isReduceMotionEnabled) return;
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const styles = StyleSheet.create({
    tile: {
      flex: 1,
      minHeight: 96, // well past the 44pt minimum touch target
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: selected ? colors.primary : 'transparent',
      padding: Layout.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconChip: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: accentColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Layout.spacing.sm,
    },
    label: {
      fontSize: scaleFont(Fonts.sizes.sm),
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    detail: {
      fontSize: scaleFont(Fonts.sizes.xs),
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
  });

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Pressable
        style={styles.tile}
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
      >
        <View style={styles.iconChip}>
          <Ionicons name={icon as any} size={22} color={colors.white} />
        </View>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
        {detail ? (
          <Text style={styles.detail} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
