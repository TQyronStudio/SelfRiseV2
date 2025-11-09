import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { Layout, Fonts } from '@/src/constants';
import { getPast30Days, formatDateForDisplay, today, getDayOfWeekFromDateString, formatDateToString } from '@/src/utils/date';
import { wasScheduledOnDate } from '@/src/utils/habitImmutability';
import { useTheme } from '@/src/contexts/ThemeContext';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color }) => {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.md,
      padding: Layout.spacing.sm,
      alignItems: 'center',
    },
    statTitle: {
      fontSize: Fonts.sizes.xs,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
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
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
};

export const MonthlyHabitOverview: React.FC = React.memo(() => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { habits, getHabitsByDate, getHabitStats, getRelevantDatesForHabit } = useHabitsData();

  const monthlyStats = useMemo(() => {
    const past30Days = getPast30Days(); // Past 30 days ending with today
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
        totalDays: past30Days.length
      };
    }

    let totalCompletions = 0;
    let totalPossibleCompletions = 0;
    let activeDays = 0;
    let bestDayCount = 0;
    let bestDay = '';

    past30Days.forEach(date => {
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
      totalDays: past30Days.length
    };
  }, [habits, getHabitsByDate]);

  const habitPerformanceStats = useMemo(() => {
    const activeHabits = habits.filter(habit => habit.isActive);
    
    const performanceData = activeHabits.map(habit => {
      const stats = getHabitStats(habit.id);
      return {
        name: habit.name,
        color: habit.color,
        completionRate: Math.round(stats?.completionRate || 0),
        currentStreak: stats?.currentStreak || 0,
        totalCompletions: stats?.totalCompletions || 0
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    return performanceData;
  }, [habits, getHabitStats]);

  const topPerformer = habitPerformanceStats[0];
  const strugglingHabit = habitPerformanceStats[habitPerformanceStats.length - 1];

  const dailyChartData = useMemo(() => {
    const past30Days = getPast30Days();
    const activeHabits = habits.filter(habit => habit.isActive);
    
    return past30Days.map(dateStr => {
      const dayOfWeek = getDayOfWeekFromDateString(dateStr);
      const habitsOnDate = getHabitsByDate(dateStr);
      
      // Filter habits scheduled for this day
      // IMMUTABILITY PRINCIPLE: Use historical schedule for this specific date
      const scheduledHabits = activeHabits.filter(habit =>
        wasScheduledOnDate(habit, dateStr, dayOfWeek)
      );
      
      const scheduledCompletions = habitsOnDate.filter(h => 
        h.isCompleted && scheduledHabits.some(sh => sh.id === h.id)
      ).length;
      
      const bonusCompletions = habitsOnDate.filter(h => 
        h.isCompleted && !scheduledHabits.some(sh => sh.id === h.id)
      ).length;
      
      const totalScheduled = scheduledHabits.length;
      const completionRate = totalScheduled > 0 ? (scheduledCompletions / totalScheduled) * 100 : 0;
      
      const dateObj = new Date(dateStr + 'T00:00:00.000Z');
      
      return {
        date: dateStr,
        dayNumber: dateObj.getDate(),
        scheduledCompletions,
        bonusCompletions,
        totalScheduled,
        completionRate,
        isToday: formatDateToString(new Date()) === dateStr
      };
    });
  }, [habits, getHabitsByDate]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginHorizontal: Layout.spacing.md,
      marginTop: Layout.spacing.md,
      shadowColor: colors.shadow,
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
      color: colors.text,
      marginBottom: Layout.spacing.xs,
    },
    subtitle: {
      fontSize: Fonts.sizes.md,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: Layout.spacing.md,
      gap: Layout.spacing.sm,
    },
    insightsContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: Layout.spacing.md,
    },
    insightsTitle: {
      fontSize: Fonts.sizes.md,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginBottom: Layout.spacing.sm,
    },
    insightItem: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.md,
      padding: Layout.spacing.sm,
      marginBottom: Layout.spacing.xs,
      borderLeftWidth: 4,
    },
    insightLabel: {
      fontSize: Fonts.sizes.md,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginBottom: 2,
    },
    insightText: {
      fontSize: Fonts.sizes.xs,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
    },
    noDataContainer: {
      alignItems: 'center',
      paddingVertical: Layout.spacing.xl,
    },
    noDataText: {
      fontSize: Fonts.sizes.md,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Layout.spacing.xs,
    },
    noDataSubtext: {
      fontSize: Fonts.sizes.xs,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    chartContainer: {
      marginBottom: Layout.spacing.md,
      paddingTop: Layout.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    chartTitle: {
      fontSize: Fonts.sizes.md,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginBottom: Layout.spacing.sm,
      textAlign: 'center',
    },
    miniChart: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 35,
      paddingHorizontal: Layout.spacing.xs,
    },
    miniBar: {
      flex: 1,
      alignItems: 'center',
      maxWidth: 8,
    },
    miniBarContainer: {
      height: 24,
      width: 3,
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: 2,
    },
    miniBarFill: {
      width: 3,
      borderRadius: 1.5,
      minHeight: 2,
    },
    bonusIndicator: {
      width: 3,
      height: 2,
      borderTopLeftRadius: 1.5,
      borderTopRightRadius: 1.5,
      marginTop: -1,
    },
    miniDayLabel: {
      fontSize: 8,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    todayMiniLabel: {
      color: colors.primary,
      fontFamily: Fonts.semibold,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Past 30 Days</Text>
        <Text style={styles.subtitle}>
          {monthlyStats.activeDays}/{monthlyStats.totalDays} active days
        </Text>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title={t('home.habitStats.totalHabits')}
          value={habits.filter(h => h.isActive).length.toString()}
          color={colors.primary}
        />
        
        <StatCard
          title={t('home.habitStats.monthlyAverage')}
          value={`${monthlyStats.completionRate}%`}
          subtitle={`${monthlyStats.totalCompletions}/${monthlyStats.totalPossible}`}
          color={monthlyStats.completionRate >= 70 ? colors.success : monthlyStats.completionRate >= 50 ? colors.warning : colors.error}
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

      {/* Daily Mini Chart */}
      {habits.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Progress (Past 30 Days)</Text>
          <View style={styles.miniChart}>
            {dailyChartData.map((day, index) => {
              const barHeight = Math.max(2, (day.completionRate / 100) * 20);
              const hasBonus = day.bonusCompletions > 0;
              
              return (
                <View key={day.date} style={styles.miniBar}>
                  <View style={styles.miniBarContainer}>
                    {/* Base bar for scheduled completions */}
                    {day.totalScheduled > 0 && (
                      <View 
                        style={[
                          styles.miniBarFill,
                          { 
                            height: barHeight,
                            backgroundColor: day.completionRate >= 80 ? colors.success : 
                                           day.completionRate >= 60 ? colors.warning : 
                                           day.completionRate >= 40 ? Colors.secondary : colors.error
                          }
                        ]} 
                      />
                    )}
                    
                    {/* Bonus indicator */}
                    {hasBonus && (
                      <View style={[styles.bonusIndicator, { backgroundColor: colors.gold }]} />
                    )}
                  </View>
                  
                  {/* Show day number every 5 days or for today */}
                  {(index % 5 === 0 || day.isToday) && (
                    <Text style={[styles.miniDayLabel, day.isToday && styles.todayMiniLabel]}>
                      {day.dayNumber}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Performance Insights */}
      {habits.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>{t('home.habitStats.performanceIndicators')}</Text>
          
          {topPerformer && (
            <View style={[styles.insightItem, { borderLeftColor: colors.success }]}>
              <Text style={styles.insightLabel}>🏆 Top Performer</Text>
              <Text style={styles.insightText}>
                {topPerformer.name} ({topPerformer.completionRate}%)
              </Text>
            </View>
          )}

          {strugglingHabit && strugglingHabit.completionRate < 50 && (
            <View style={[styles.insightItem, { borderLeftColor: colors.warning }]}>
              <Text style={styles.insightLabel}>💪 Needs Focus</Text>
              <Text style={styles.insightText}>
                {strugglingHabit.name} ({strugglingHabit.completionRate}%)
              </Text>
            </View>
          )}

          {monthlyStats.completionRate >= 80 && (
            <View style={[styles.insightItem, { borderLeftColor: colors.success }]}>
              <Text style={styles.insightLabel}>🔥 {t('home.habitStats.improvingTrend')}</Text>
              <Text style={styles.insightText}>
                Great month! Keep up the excellent work.
              </Text>
            </View>
          )}

          {monthlyStats.completionRate < 40 && (
            <View style={[styles.insightItem, { borderLeftColor: colors.error }]}>
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
});