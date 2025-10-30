import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout, Fonts } from '@/src/constants';
import { WeeklyHabitChart } from './WeeklyHabitChart';
import { Monthly30DayChart } from './Monthly30DayChart';
import { YearlyHabitOverview } from './YearlyHabitOverview';

type ViewMode = 'week' | 'month' | 'year';

export const HabitStatsDashboard: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const toggleMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const styles = StyleSheet.create({
    container: {
      marginTop: Layout.spacing.md,
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
    },
    mainTitle: {
      fontSize: Fonts.sizes.lg,
      fontFamily: Fonts.semibold,
      color: colors.text,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Layout.borderRadius.lg,
      padding: 2,
    },
    toggleButton: {
      paddingHorizontal: Layout.spacing.sm,
      paddingVertical: Layout.spacing.xs,
      borderRadius: Layout.borderRadius.md,
      minWidth: 60,
      alignItems: 'center',
    },
    toggleButtonActive: {
      backgroundColor: colors.primary,
    },
    toggleText: {
      fontSize: Fonts.sizes.xs,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
    },
    toggleTextActive: {
      color: colors.cardBackground,
      fontFamily: Fonts.semibold,
    },
    content: {
      // Content styling is handled by child components
    },
  });

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navigationContainer}>
        <Text style={styles.mainTitle}>{t('home.habitStatistics')}</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'week' && styles.toggleButtonActive
            ]}
            onPress={() => toggleMode('week')}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'week' && styles.toggleTextActive
            ]}>
              Week
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'month' && styles.toggleButtonActive
            ]}
            onPress={() => toggleMode('month')}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'month' && styles.toggleTextActive
            ]}>
              Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'year' && styles.toggleButtonActive
            ]}
            onPress={() => toggleMode('year')}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'year' && styles.toggleTextActive
            ]}>
              Year
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {viewMode === 'week' && <WeeklyHabitChart />}
        {viewMode === 'month' && <Monthly30DayChart />}
        {viewMode === 'year' && <YearlyHabitOverview />}
      </View>
    </View>
  );
};