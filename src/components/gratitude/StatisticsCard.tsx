import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Layout, Fonts } from '@/src/constants';

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
  color = Colors.primary 
}: StatisticsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});