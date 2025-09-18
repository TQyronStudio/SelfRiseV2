import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout, Fonts } from '@/src/constants';
import { getPast365Days, formatDateForDisplay, today, getDayOfWeekFromDateString } from '@/src/utils/date';
import { calculateHabitCompletionRate } from '@/src/utils/habitCalculations';
import { wasScheduledOnDate } from '@/src/utils/habitImmutability';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color = Colors.primary }) => (
  <View style={styles.statCard}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

export const YearlyHabitOverview: React.FC = React.memo(() => {
  const { t } = useI18n();
  const { habits, getHabitsByDate, getHabitStats, getEarliestDataDate, getDataDateRange, getRelevantDatesForHabit } = useHabitsData();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for heavy calculations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [habits]);

  const yearDates = useMemo(() => {
    return isLoading ? [] : getDataDateRange(); // Use only available data period
  }, [isLoading, getDataDateRange]);

  const yearlyStats = useMemo(() => {
    if (isLoading) {
      return {
        totalCompletions: 0,
        totalPossible: 0,
        completionRate: 0,
        avgDaily: 0,
        bestDay: '',
        bestDayCount: 0,
        activeDays: 0,
        totalDays: 0
      };
    }
    const activeHabits = habits.filter(habit => habit.isActive);
    const totalActiveHabits = activeHabits.length;

    if (totalActiveHabits === 0) {
      return {
        totalCompletions: 0,
        totalPossible: 0,
        completionRate: 0,
        avgDaily: 0,
        bestDay: '',
        bestDayCount: 0,
        activeDays: 0,
        totalDays: yearDates.length
      };
    }

    let totalCompletions = 0;
    let totalPossibleCompletions = 0;
    let activeDays = 0;
    let bestDayCount = 0;
    let bestDay = '';

    yearDates.forEach(date => {
      const dayOfWeek = getDayOfWeekFromDateString(date);
      const habitsOnDate = getHabitsByDate(date);
      
      // Filter habits scheduled for this day AND that existed on this date
      // IMMUTABILITY PRINCIPLE: Use historical schedule for this specific date
      const scheduledHabits = activeHabits.filter(habit => {
        const relevantDates = getRelevantDatesForHabit(habit, [date]);
        return wasScheduledOnDate(habit, date, dayOfWeek) && relevantDates.length > 0;
      });
      
      const scheduledCompletions = habitsOnDate.filter(h => 
        h.isCompleted && scheduledHabits.some(sh => sh.id === h.id)
      ).length;
      
      const bonusCompletions = habitsOnDate.filter(h => 
        h.isCompleted && !scheduledHabits.some(sh => sh.id === h.id)
      ).length;
      
      const totalDayCompletions = scheduledCompletions + bonusCompletions;
      totalCompletions += totalDayCompletions;
      totalPossibleCompletions += scheduledHabits.length; // Only count scheduled habits
      
      if (totalDayCompletions > 0) {
        activeDays++;
      }
      
      if (totalDayCompletions > bestDayCount) {
        bestDayCount = totalDayCompletions;
        bestDay = date;
      }
    });

    const completionRate = totalPossibleCompletions > 0 ? (totalCompletions / totalPossibleCompletions) * 100 : 0;
    const avgDaily = activeDays > 0 ? totalCompletions / activeDays : 0;

    return {
      totalCompletions,
      totalPossible: totalPossibleCompletions,
      completionRate: Math.round(completionRate),
      avgDaily: Math.round(avgDaily * 10) / 10, // 1 decimal place
      bestDay,
      bestDayCount,
      activeDays,
      totalDays: yearDates.length
    };
  }, [habits, getHabitsByDate, isLoading, yearDates]);

  const habitPerformanceStats = useMemo(() => {
    if (isLoading) {
      return [];
    }

    const activeHabits = habits.filter(habit => habit.isActive);
    
    // Calculate yearly completion rates using actual yearly data (not lifetime stats)
    const performanceData = activeHabits.map(habit => {
      const relevantYearDates = getRelevantDatesForHabit(habit, yearDates);
      
      let scheduledDays = 0;
      let completedScheduled = 0;
      let bonusCompletions = 0;
      
      relevantYearDates.forEach(date => {
        const dayOfWeek = getDayOfWeekFromDateString(date);
        // IMMUTABILITY PRINCIPLE: Use historical schedule for this specific date
        const isScheduled = wasScheduledOnDate(habit, date, dayOfWeek);
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
      
      // Calculate yearly completion rate with frequency-proportional bonus
      const completionResult = calculateHabitCompletionRate(habit, {
        scheduledDays,
        completedScheduled,
        bonusCompletions
      });
      const yearlyCompletionRate = completionResult.totalCompletionRate;
      
      return {
        name: habit.name,
        color: habit.color,
        completionRate: Math.round(yearlyCompletionRate),
        scheduledDays,
        completedScheduled,
        bonusCompletions
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    return performanceData;
  }, [habits, getHabitsByDate, getRelevantDatesForHabit, isLoading, yearDates]);

  const topPerformer = habitPerformanceStats[0];
  const strugglingHabit = habitPerformanceStats[habitPerformanceStats.length - 1];

  const actualDataPeriod = useMemo(() => {
    const earliestDate = getEarliestDataDate();
    if (!earliestDate) return 0;
    const dateRange = getDataDateRange();
    return dateRange.length;
  }, [getEarliestDataDate, getDataDateRange]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading yearly statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {actualDataPeriod >= 365 ? 'Past 365 Days Overview' : `Past ${actualDataPeriod} Days Overview`}
        </Text>
        <Text style={styles.subtitle}>
          {yearlyStats.activeDays}/{yearlyStats.totalDays} active days
        </Text>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Habits"
          value={habits.filter(h => h.isActive).length.toString()}
          color={Colors.primary}
        />
        
        <StatCard
          title="Yearly Average"
          value={`${yearlyStats.completionRate}%`}
          subtitle={`${yearlyStats.totalCompletions}/${yearlyStats.totalPossible}`}
          color={yearlyStats.completionRate >= 70 ? Colors.success : yearlyStats.completionRate >= 50 ? Colors.warning : Colors.error}
        />

        <StatCard
          title="Best Day"
          value={yearlyStats.bestDayCount.toString()}
          subtitle={yearlyStats.bestDay ? formatDateForDisplay(yearlyStats.bestDay, 'short') : '-'}
          color={Colors.secondary}
        />
        
        <StatCard
          title="Daily Average"
          value={yearlyStats.avgDaily.toString()}
          subtitle="per active day"
          color={Colors.accent}
        />
      </View>

      {/* Performance Insights */}
      {habits.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Performance Insights</Text>
          
          {topPerformer && (
            <View style={[styles.insightItem, { borderLeftColor: Colors.success }]}>
              <Text style={styles.insightLabel}>🏆 Top Performer</Text>
              <Text style={styles.insightText}>
                {topPerformer.name} ({topPerformer.completionRate}%)
              </Text>
            </View>
          )}

          {strugglingHabit && strugglingHabit.completionRate < 50 && (
            <View style={[styles.insightItem, { borderLeftColor: Colors.warning }]}>
              <Text style={styles.insightLabel}>💪 Needs Focus</Text>
              <Text style={styles.insightText}>
                {strugglingHabit.name} ({strugglingHabit.completionRate}%)
              </Text>
            </View>
          )}

          {yearlyStats.completionRate >= 80 && (
            <View style={[styles.insightItem, { borderLeftColor: Colors.success }]}>
              <Text style={styles.insightLabel}>🔥 Excellent Year</Text>
              <Text style={styles.insightText}>
                Outstanding yearly performance! Keep it up.
              </Text>
            </View>
          )}

          {yearlyStats.completionRate < 40 && (
            <View style={[styles.insightItem, { borderLeftColor: Colors.error }]}>
              <Text style={styles.insightLabel}>📈 Room for Improvement</Text>
              <Text style={styles.insightText}>
                Consider reviewing your habits and goals.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* No Data State */}
      {habits.length === 0 && (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No habit data available</Text>
          <Text style={styles.noDataSubtext}>Add some habits to see your yearly overview</Text>
        </View>
      )}
    </View>
  );
});

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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.sm,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  statValue: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.spacing.md,
  },
  insightsTitle: {
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  insightItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
    borderLeftWidth: 4,
  },
  insightLabel: {
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  insightText: {
    fontSize: Fonts.sizes.xs,
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  loadingText: {
    marginTop: Layout.spacing.sm,
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});