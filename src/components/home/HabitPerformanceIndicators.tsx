import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout, Fonts } from '@/src/constants';
import { getWeekDates, today, formatDateForDisplay } from '@/src/utils/date';

interface PerformanceIndicatorProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
  icon: string;
  color: string;
}

const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({ 
  title, 
  value, 
  trend, 
  subtitle, 
  icon, 
  color 
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  return (
    <View style={[styles.indicatorCard, { borderLeftColor: color }]}>
      <View style={styles.indicatorHeader}>
        <Text style={styles.indicatorIcon}>{icon}</Text>
        <View style={styles.indicatorTrend}>
          {trend && <Text style={styles.trendIcon}>{getTrendIcon()}</Text>}
        </View>
      </View>
      
      <Text style={styles.indicatorTitle}>{title}</Text>
      <Text style={[styles.indicatorValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.indicatorSubtitle}>{subtitle}</Text>}
    </View>
  );
};

export const HabitPerformanceIndicators: React.FC = () => {
  const { t } = useI18n();
  const { habits, getHabitsByDate, getHabitStats } = useHabitsData();

  const performanceData = useMemo(() => {
    const activeHabits = habits.filter(habit => habit.isActive);
    const currentWeekDates = getWeekDates();
    const previousWeekDates = getWeekDates().map(date => {
      const d = new Date(date + 'T00:00:00.000Z');
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0] as string;
    });

    if (activeHabits.length === 0) {
      return {
        totalActive: 0,
        completedToday: 0,
        weeklyProgress: 0,
        currentWeekRate: 0,
        previousWeekRate: 0,
        trend: 'stable' as const,
        topPerformer: null,
        strugglingHabit: null
      };
    }

    // Today's completions
    const todaysHabits = getHabitsByDate(today());
    const completedToday = todaysHabits.filter(h => h.isCompleted).length;

    // Current week progress
    let currentWeekCompletions = 0;
    let currentWeekPossible = 0;
    
    currentWeekDates.forEach(date => {
      const habitsOnDate = getHabitsByDate(date);
      const completed = habitsOnDate.filter(h => h.isCompleted).length;
      currentWeekCompletions += completed;
      currentWeekPossible += activeHabits.length;
    });

    // Previous week progress for comparison
    let previousWeekCompletions = 0;
    let previousWeekPossible = 0;

    previousWeekDates.forEach(date => {
      const habitsOnDate = getHabitsByDate(date);
      const completed = habitsOnDate.filter(h => h.isCompleted).length;
      previousWeekCompletions += completed;
      previousWeekPossible += activeHabits.length;
    });

    const currentWeekRate = currentWeekPossible > 0 ? (currentWeekCompletions / currentWeekPossible) * 100 : 0;
    const previousWeekRate = previousWeekPossible > 0 ? (previousWeekCompletions / previousWeekPossible) * 100 : 0;

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (currentWeekRate > previousWeekRate + 5) trend = 'up';
    else if (currentWeekRate < previousWeekRate - 5) trend = 'down';

    // Get top performer and struggling habit
    const habitPerformances = activeHabits.map(habit => {
      const stats = getHabitStats(habit.id);
      return {
        habit,
        completionRate: stats.completionRate,
        currentStreak: stats.currentStreak
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    const topPerformer = habitPerformances[0];
    const strugglingHabit = habitPerformances[habitPerformances.length - 1];

    return {
      totalActive: activeHabits.length,
      completedToday,
      weeklyProgress: Math.round(currentWeekRate),
      currentWeekRate,
      previousWeekRate,
      trend,
      topPerformer,
      strugglingHabit
    };
  }, [habits, getHabitsByDate, getHabitStats]);

  const getTrendText = () => {
    switch (performanceData.trend) {
      case 'up': return t('home.habitStats.improvingTrend');
      case 'down': return t('home.habitStats.decliningTrend');
      default: return t('home.habitStats.steadyProgress');
    }
  };

  const getTrendColor = () => {
    switch (performanceData.trend) {
      case 'up': return Colors.success;
      case 'down': return Colors.error;
      default: return Colors.warning;
    }
  };

  if (performanceData.totalActive === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.habitStats.performanceIndicators')}</Text>
        </View>
        
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>{t('home.habitStats.noData')}</Text>
          <Text style={styles.noDataSubtext}>Add habits to see performance indicators</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.habitStats.performanceIndicators')}</Text>
        <Text style={styles.subtitle}>
          {formatDateForDisplay(today(), 'short')} - {getTrendText()}
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.indicatorsContainer}
      >
        <PerformanceIndicator
          title={t('home.habitStats.activeHabits')}
          value={performanceData.totalActive}
          icon="🎯"
          color={Colors.primary}
        />

        <PerformanceIndicator
          title={t('home.habitStats.completedToday')}
          value={`${performanceData.completedToday}/${performanceData.totalActive}`}
          subtitle={`${Math.round((performanceData.completedToday / performanceData.totalActive) * 100)}%`}
          icon="✅"
          color={Colors.success}
        />

        <PerformanceIndicator
          title={t('home.habitStats.weeklyAverage')}
          value={`${performanceData.weeklyProgress}%`}
          trend={performanceData.trend}
          subtitle={`vs. ${Math.round(performanceData.previousWeekRate)}% last week`}
          icon="📊"
          color={getTrendColor()}
        />

        {performanceData.topPerformer && (
          <PerformanceIndicator
            title="Top Performer"
            value={`${Math.round(performanceData.topPerformer.completionRate)}%`}
            subtitle={performanceData.topPerformer.habit.name}
            icon="🏆"
            color={Colors.secondary}
          />
        )}

        {performanceData.strugglingHabit && performanceData.strugglingHabit.completionRate < 50 && (
          <PerformanceIndicator
            title="Needs Focus"
            value={`${Math.round(performanceData.strugglingHabit.completionRate)}%`}
            subtitle={performanceData.strugglingHabit.habit.name}
            icon="💪"
            color={Colors.warning}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginTop: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  indicatorsContainer: {
    paddingHorizontal: Layout.spacing.xs,
    gap: Layout.spacing.md,
  },
  indicatorCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    width: 140,
    borderLeftWidth: 4,
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  indicatorIcon: {
    fontSize: 20,
  },
  indicatorTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 14,
  },
  indicatorTitle: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  indicatorValue: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  indicatorSubtitle: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  noDataText: {
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  noDataSubtext: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});