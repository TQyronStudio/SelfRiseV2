import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layout, Fonts } from '@/src/constants';
import { useTheme } from '@/src/contexts/ThemeContext';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
}

export default function StatisticsCard({
  title,
  value,
  subtitle,
  icon,
  color
}: StatisticsCardProps) {
  const { colors } = useTheme();
  const displayColor = color || colors.primary;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    icon: {
      fontSize: 20,
      marginRight: Layout.spacing.sm,
    },
    title: {
      fontSize: Fonts.sizes.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    content: {
      alignItems: 'flex-start',
    },
    value: {
      fontSize: Fonts.sizes.xxl,
      fontWeight: 'bold',
      marginBottom: Layout.spacing.xs,
    },
    subtitle: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.value, { color: displayColor }]}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}