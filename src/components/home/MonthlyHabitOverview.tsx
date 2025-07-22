import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout, Fonts } from '@/src/constants';
import { getMonthDates, formatDateForDisplay, today, getDayOfWeekFromDateString } from '@/src/utils/date';

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

export const MonthlyHabitOverview: React.FC = () => {
  const { t } = useI18n();
  const { habits, getHabitsByDate, getHabitStats } = useHabitsData();

  const monthlyStats = useMemo(() => {
    const monthDates = getMonthDates(today());
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
        totalDays: monthDates.length
      };
    }

    let totalCompletions = 0;
    let totalPossibleCompletions = 0;
    let activeDays = 0;
    let bestDayCount = 0;
    let bestDay = '';

    monthDates.forEach(date => {
      const dayOfWeek = getDayOfWeekFromDateString(date);
      const habitsOnDate = getHabitsByDate(date);
      
      // Filter habits scheduled for this day
      const scheduledHabits = activeHabits.filter(habit => 
        habit.scheduledDays.includes(dayOfWeek)
      );
      
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
      totalDays: monthDates.length
    };
  }, [habits, getHabitsByDate]);

  const habitPerformanceStats = useMemo(() => {
    const activeHabits = habits.filter(habit => habit.isActive);
    
    const performanceData = activeHabits.map(habit => {
      const stats = getHabitStats(habit.id);
      return {
        name: habit.name,
        color: habit.color,
        completionRate: Math.round(stats.completionRate),
        currentStreak: stats.currentStreak,
        totalCompletions: stats.totalCompletions
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    return performanceData;
  }, [habits, getHabitStats]);

  const topPerformer = habitPerformanceStats[0];
  const strugglingHabit = habitPerformanceStats[habitPerformanceStats.length - 1];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.habitStats.monthlyOverview')}</Text>
        <Text style={styles.subtitle}>
          {formatDateForDisplay(today(), 'short')} - {monthlyStats.activeDays}/{monthlyStats.totalDays} {t('home.completeDays').toLowerCase()}
        </Text>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title={t('home.habitStats.totalHabits')}
          value={habits.filter(h => h.isActive).length.toString()}
          color={Colors.primary}
        />
        
        <StatCard
          title={t('home.habitStats.monthlyAverage')}
          value={`${monthlyStats.completionRate}%`}
          subtitle={`${monthlyStats.totalCompletions}/${monthlyStats.totalPossible}`}
          color={monthlyStats.completionRate >= 70 ? Colors.success : monthlyStats.completionRate >= 50 ? Colors.warning : Colors.error}
        />

        <StatCard
          title={t('home.habitStats.bestDay')}
          value={monthlyStats.bestDayCount.toString()}
          subtitle={monthlyStats.bestDay ? formatDateForDisplay(monthlyStats.bestDay, 'short') : '-'}
          color={Colors.secondary}
        />
        
        <StatCard
          title={t('home.habitStats.weeklyAverage')}
          value={monthlyStats.avgDaily.toString()}
          subtitle="per active day"
          color={Colors.accent}
        />
      </View>

      {/* Performance Insights */}
      {habits.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>{t('home.habitStats.performanceIndicators')}</Text>
          
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

          {monthlyStats.completionRate >= 80 && (
            <View style={[styles.insightItem, { borderLeftColor: Colors.success }]}>
              <Text style={styles.insightLabel}>🔥 {t('home.habitStats.improvingTrend')}</Text>
              <Text style={styles.insightText}>
                Great month! Keep up the excellent work.
              </Text>
            </View>
          )}

          {monthlyStats.completionRate < 40 && (
            <View style={[styles.insightItem, { borderLeftColor: Colors.error }]}>
              <Text style={styles.insightLabel}>📈 {t('home.habitStats.decliningTrend')}</Text>
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
          <Text style={styles.noDataText}>{t('home.habitStats.noData')}</Text>
          <Text style={styles.noDataSubtext}>Add some habits to see your monthly overview</Text>
        </View>
      )}
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
});