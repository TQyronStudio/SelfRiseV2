import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout, Fonts } from '@/src/constants';
import { getWeekDates, today, formatDateForDisplay, getPast7Days, getPast30Days, getDayOfWeekFromDateString, getMonthDates } from '@/src/utils/date';
import { calculateHabitCompletionRate, getHabitAgeInfo } from '@/src/utils/habitCalculations';

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

// Helper function to calculate completion rate for a specific time period using unified logic
const calculatePeriodCompletionRate = (
  habit: any, 
  dates: string[], 
  getHabitsByDate: (date: string) => any[],
  getRelevantDatesForHabit?: (habit: any, dates: string[]) => string[]
) => {
  // Filter dates to only include days since habit creation
  const relevantDates = getRelevantDatesForHabit ? getRelevantDatesForHabit(habit, dates) : dates;
  
  let scheduledDays = 0;
  let completedScheduled = 0;
  let bonusCompletions = 0;

  relevantDates.forEach(date => {
    const dayOfWeek = getDayOfWeekFromDateString(date);
    const isScheduled = habit.scheduledDays.includes(dayOfWeek);
    const habitsOnDate = getHabitsByDate(date);
    const habitOnDate = habitsOnDate.find((h: any) => h.id === habit.id);
    
    if (isScheduled) {
      scheduledDays++;
      if (habitOnDate?.isCompleted) {
        completedScheduled++;
      }
    } else if (habitOnDate?.isCompleted) {
      bonusCompletions++;
    }
  });

  // Use unified calculation with frequency-proportional bonus
  const completionResult = calculateHabitCompletionRate(habit, {
    scheduledDays,
    completedScheduled,
    bonusCompletions
  });
  
  return {
    rate: completionResult.totalCompletionRate,
    scheduledDays,
    completedScheduled,
    bonusCompletions,
    completionResult
  };
};

export const HabitPerformanceIndicators: React.FC = () => {
  const { t } = useI18n();
  const { habits, getHabitsByDate, getHabitStats, getRelevantDatesForHabit } = useHabitsData();

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
        weeklyTopPerformer: null,
        monthlyTopPerformer: null,
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

    // Calculate weekly top performer (current calendar week - Monday to Sunday)
    const weekDatesForTopPerformer = getWeekDates(today());
    const weeklyPerformances = activeHabits.map(habit => {
      const performance = calculatePeriodCompletionRate(habit, weekDatesForTopPerformer, getHabitsByDate, getRelevantDatesForHabit);
      return {
        habit,
        completionRate: performance.rate,
        scheduledDays: performance.scheduledDays,
        completedScheduled: performance.completedScheduled,
        bonusCompletions: performance.bonusCompletions
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    // Calculate monthly top performer (current calendar month)
    const currentMonthDates = getMonthDates(today());
    const monthlyPerformances = activeHabits.map(habit => {
      const performance = calculatePeriodCompletionRate(habit, currentMonthDates, getHabitsByDate, getRelevantDatesForHabit);
      return {
        habit,
        completionRate: performance.rate,
        scheduledDays: performance.scheduledDays,
        completedScheduled: performance.completedScheduled,
        bonusCompletions: performance.bonusCompletions
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    const weeklyTopPerformer = weeklyPerformances[0];
    const monthlyTopPerformer = monthlyPerformances[0];
    const strugglingHabit = monthlyPerformances[monthlyPerformances.length - 1]; // Now uses monthly data

    return {
      totalActive: activeHabits.length,
      completedToday,
      weeklyProgress: Math.round(currentWeekRate),
      currentWeekRate,
      previousWeekRate,
      trend,
      weeklyTopPerformer,
      monthlyTopPerformer,
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

        {performanceData.weeklyTopPerformer && (() => {
          // Only show percentage for habits 7+ days old
          const ageInfo = getHabitAgeInfo(performanceData.weeklyTopPerformer.habit);
          if (ageInfo.canShowPerformance) {
            return (
              <PerformanceIndicator
                title="This Week"
                value={`${Math.round(performanceData.weeklyTopPerformer.completionRate)}%`}
                subtitle={performanceData.weeklyTopPerformer.habit.name}
                icon="🏆"
                color={Colors.secondary}
              />
            );
          } else {
            // For new habits (Days 1-6), show raw completion count
            const completions = (performanceData.weeklyTopPerformer.completedScheduled || 0) + 
                              (performanceData.weeklyTopPerformer.bonusCompletions || 0);
            return (
              <PerformanceIndicator
                title="This Week"
                value={`${completions}`}
                subtitle={`${performanceData.weeklyTopPerformer.habit.name} (building)`}
                icon="🌱"
                color={Colors.success}
              />
            );
          }
        })()}

        {performanceData.monthlyTopPerformer && (() => {
          // Only show percentage for habits 7+ days old
          const ageInfo = getHabitAgeInfo(performanceData.monthlyTopPerformer.habit);
          if (ageInfo.canShowPerformance) {
            return (
              <PerformanceIndicator
                title={new Date().toLocaleDateString('en-US', { month: 'long' })}
                value={`${Math.round(performanceData.monthlyTopPerformer.completionRate)}%`}
                subtitle={performanceData.monthlyTopPerformer.habit.name}
                icon="👑"
                color={Colors.primary}
              />
            );
          }
          return null; // Don't show monthly stats for very new habits
        })()}

        {performanceData.strugglingHabit && (() => {
          // Only show struggling habits for established habits (14+ days) to avoid discouraging new users
          const ageInfo = getHabitAgeInfo(performanceData.strugglingHabit.habit);
          if (ageInfo.isEstablishedHabit && performanceData.strugglingHabit.completionRate < 50) {
            return (
              <PerformanceIndicator
                title={`${new Date().toLocaleDateString('en-US', { month: 'long' })} Focus`}
                value={`${Math.round(performanceData.strugglingHabit.completionRate)}%`}
                subtitle={performanceData.strugglingHabit.habit.name}
                icon="💪"
                color={Colors.warning}
              />
            );
          }
          return null;
        })()}
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