import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout, Fonts } from '@/src/constants';
import { getWeekDates, subtractDays, today, formatDateForDisplay, getDayOfWeekFromDateString, formatDateToString } from '@/src/utils/date';
import { calculateHabitCompletionRate, getHabitAgeInfo, getCompletionRateMessage } from '@/src/utils/habitCalculations';
import { wasScheduledOnDate } from '@/src/utils/habitImmutability';

interface TrendItemProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  trend: 'improving' | 'declining' | 'stable';
}

const TrendItem: React.FC<TrendItemProps> = ({ title, description, icon, color, trend }) => {
  const { colors } = useTheme();

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
    }
  };

  const trendStyles = StyleSheet.create({
    trendItem: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.md,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
      borderLeftWidth: 4,
      minHeight: 70,
    },
    trendHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    trendIcon: {
      fontSize: 18,
    },
    trendIndicator: {
      fontSize: 16,
    },
    trendTitle: {
      fontSize: Fonts.sizes.md,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginBottom: Layout.spacing.xs,
    },
    trendDescription: {
      fontSize: Fonts.sizes.xs,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      lineHeight: 16,
    },
  });

  return (
    <View style={[trendStyles.trendItem, { borderLeftColor: color }]}>
      <View style={trendStyles.trendHeader}>
        <Text style={trendStyles.trendIcon}>{icon}</Text>
        <Text style={trendStyles.trendIndicator}>{getTrendIcon()}</Text>
      </View>
      <Text style={trendStyles.trendTitle}>{title}</Text>
      <Text style={trendStyles.trendDescription} numberOfLines={2} ellipsizeMode="tail">{description}</Text>
    </View>
  );
};

export const HabitTrendAnalysis: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { habits, getHabitsByDate, getHabitStats } = useHabitsData();

  const trendAnalysis = useMemo(() => {
    const activeHabits = habits.filter(habit => habit.isActive);
    
    if (activeHabits.length === 0) {
      return { trends: [], summary: null };
    }

    // Get data for last 4 weeks for trend analysis
    const trends = [];
    const weeks = [];
    
    // Calculate weekly completion rates using improved logic for last 4 weeks
    for (let i = 0; i < 4; i++) {
      const weekStart = subtractDays(today(), i * 7 + 6);
      const weekDates: string[] = [];
      for (let j = 0; j < 7; j++) {
        const date = new Date(weekStart + 'T00:00:00.000Z');
        date.setDate(date.getDate() + j);
        weekDates.push(date.toISOString().split('T')[0] as string);
      }

      let totalWeekCompletionRate = 0;
      let validHabits = 0;

      // Calculate proper completion rate for each habit in this week
      activeHabits.forEach(habit => {
        const habitCreationDate = formatDateToString(new Date(habit.createdAt));
        const relevantWeekDates = weekDates.filter(date => date >= habitCreationDate);
        
        if (relevantWeekDates.length === 0) return; // Skip habits not yet created

        let scheduledDays = 0;
        let completedScheduled = 0;
        let bonusCompletions = 0;

        relevantWeekDates.forEach(date => {
          const dayOfWeek = getDayOfWeekFromDateString(date);
          // IMMUTABILITY PRINCIPLE: Use historical schedule for this specific date
          const isScheduled = wasScheduledOnDate(habit, date, dayOfWeek);
          const habitsOnDate = getHabitsByDate(date);
          const habitOnDate = habitsOnDate.find(h => h.id === habit.id);
          
          if (isScheduled) {
            scheduledDays++;
            if (habitOnDate?.isCompleted) {
              completedScheduled++;
            }
          } else if (habitOnDate?.isCompleted) {
            bonusCompletions++;
          }
        });

        // Use unified calculation for this habit's week performance
        const habitWeekResult = calculateHabitCompletionRate(habit, {
          scheduledDays,
          completedScheduled,
          bonusCompletions
        });

        totalWeekCompletionRate += habitWeekResult.totalCompletionRate;
        validHabits++;
      });

      const avgCompletionRate = validHabits > 0 ? totalWeekCompletionRate / validHabits : 0;
      weeks.unshift({
        weekNumber: i + 1,
        completionRate: Math.round(avgCompletionRate),
        completions: 0, // Not used in new logic
        possible: validHabits
      });
    }

    // Overall trend calculation
    const recentAvg = ((weeks[0]?.completionRate || 0) + (weeks[1]?.completionRate || 0)) / 2;
    const earlierAvg = ((weeks[2]?.completionRate || 0) + (weeks[3]?.completionRate || 0)) / 2;
    const overallTrendChange = recentAvg - earlierAvg;

    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (overallTrendChange > 10) overallTrend = 'improving';
    else if (overallTrendChange < -10) overallTrend = 'declining';

    // Individual habit analysis - using 4 weeks of data (preserving original time period)
    const habitAnalysis = activeHabits.map(habit => {
      const stats = getHabitStats(habit.id);
      const ageInfo = getHabitAgeInfo(habit);
      
      // Calculate completion rate over past 4 weeks (28 days) but only since habit creation
      const allPast28Days = [];
      for (let i = 27; i >= 0; i--) {
        const date = subtractDays(today(), i);
        allPast28Days.push(date);
      }
      
      // Filter to only include dates since habit creation
      const habitCreationDate = formatDateToString(new Date(habit.createdAt));
      const past28Days = allPast28Days.filter(date => date >= habitCreationDate);
      
      let scheduledDays = 0;
      let completedScheduled = 0;
      let bonusCompletions = 0;
      
      past28Days.forEach(date => {
        const dayOfWeek = getDayOfWeekFromDateString(date);
        // IMMUTABILITY PRINCIPLE: Use historical schedule for this specific date
        const isScheduled = wasScheduledOnDate(habit, date, dayOfWeek);
        const habitsOnDate = getHabitsByDate(date);
        const habitOnDate = habitsOnDate.find(h => h.id === habit.id);
        
        if (isScheduled) {
          scheduledDays++;
          if (habitOnDate?.isCompleted) {
            completedScheduled++;
          }
        } else if (habitOnDate?.isCompleted) {
          bonusCompletions++;
        }
      });
      
      // Use new unified calculation with frequency-proportional bonus
      const completionResult = calculateHabitCompletionRate(habit, {
        scheduledDays,
        completedScheduled,
        bonusCompletions
      });
      
      // For trend, compare with overall completion rate
      const change = completionResult.totalCompletionRate - (stats?.completionRate || 0);

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (change > 15) trend = 'improving';
      else if (change < -15) trend = 'declining';

      return {
        habit,
        recentRate: completionResult.totalCompletionRate,
        change: Math.round(change),
        trend,
        currentStreak: stats?.currentStreak || 0,
        completionRate: stats?.completionRate || 0,
        scheduledDays,
        completedScheduled,
        bonusCompletions,
        ageInfo,
        completionResult
      };
    });

    // Generate trend insights
    if (overallTrend === 'improving') {
      trends.push({
        title: t('home.habitTrends.overallProgress'),
        description: t('home.habitTrends.improvedByPercent', { percent: Math.round(overallTrendChange) }),
        icon: '📊',
        color: colors.success,
        trend: 'improving' as const
      });
    } else if (overallTrend === 'declining') {
      trends.push({
        title: t('home.habitTrends.needsAttention'),
        description: t('home.habitTrends.droppedByPercent', { percent: Math.round(Math.abs(overallTrendChange)) }),
        icon: '📊',
        color: colors.error,
        trend: 'declining' as const
      });
    } else {
      trends.push({
        title: t('home.habitTrends.steadyProgress'),
        description: t('home.habitTrends.consistencyStable', { percent: Math.round(recentAvg) }),
        icon: '📊',
        color: colors.warning,
        trend: 'stable' as const
      });
    }

    // Handle new habits with encouraging messages (Days 1-6)
    const newHabits = habitAnalysis.filter(h => h.ageInfo.isNewHabit);
    if (newHabits.length > 0) {
      const totalNewCompletions = newHabits.reduce((sum, h) => sum + h.completedScheduled + h.bonusCompletions, 0);
      if (totalNewCompletions > 0) {
        trends.push({
          title: t('home.habitTrends.buildingNewHabits'),
          description: t('home.habitTrends.newHabitsProgress', { completions: totalNewCompletions, habits: newHabits.length }),
          icon: '🌱',
          color: colors.success,
          trend: 'improving' as const
        });
      }
    }

    // Handle early habits with positive reinforcement (Days 7-13)
    const earlyHabits = habitAnalysis.filter(h => h.ageInfo.isEarlyHabit);
    if (earlyHabits.length > 0) {
      const highPerformingEarly = earlyHabits.filter(h => h.recentRate >= 50);
      if (highPerformingEarly.length > 0) {
        const avgRate = Math.round(highPerformingEarly.reduce((sum, h) => sum + h.recentRate, 0) / highPerformingEarly.length);
        trends.push({
          title: t('home.habitTrends.earlyMomentum'),
          description: t('home.habitTrends.earlyMomentumDescription', { percent: avgRate }),
          icon: '📈',
          color: colors.primary,
          trend: 'improving' as const
        });
      }
    }

    // Filter habits that are old enough for detailed trend analysis (14+ days)
    const establishedHabitsForTrends = habitAnalysis.filter(h => h.ageInfo.isEstablishedHabit);

    // Only show detailed habit-specific trends for established habits
    if (establishedHabitsForTrends.length > 0) {
      // Best performing habit (only for established habits 14+ days)
      const bestPerformer = establishedHabitsForTrends
        .filter(h => h.trend === 'improving')
        .sort((a, b) => b.change - a.change)[0];

      if (bestPerformer) {
        const message = getCompletionRateMessage(bestPerformer.completionResult, bestPerformer.ageInfo, bestPerformer.habit.name);
        trends.push({
          title: t('home.habitTrends.starPerformer'),
          description: `${bestPerformer.habit.name}: ${t(message.descriptionKey, message.descriptionParams)}`,
          icon: '⭐',
          color: colors.success,
          trend: 'improving' as const
        });
      }

      // Habit needing attention (only for established habits 14+ days to avoid discouraging new users)
      const strugglingHabit = establishedHabitsForTrends
        .filter(h => h.recentRate < 50) // Remove trend filter to focus on actual performance
        .sort((a, b) => a.recentRate - b.recentRate)[0];

      if (strugglingHabit) {
        const message = getCompletionRateMessage(strugglingHabit.completionResult, strugglingHabit.ageInfo, strugglingHabit.habit.name);
        trends.push({
          title: t(message.titleKey),
          description: t(message.descriptionKey, message.descriptionParams),
          icon: '🎯',
          color: message.tone === 'warning' ? colors.warning : colors.primary,
          trend: 'declining' as const
        });
      }
    }

    // Consistency insights
    const consistentHabits = habitAnalysis.filter(h => h.currentStreak >= 7).length;
    if (consistentHabits > 0) {
      trends.push({
        title: t('home.habitTrends.streakChampions'),
        description: t('home.habitTrends.streakChampionsDescription', { count: consistentHabits }),
        icon: '🔥',
        color: colors.primary,
        trend: 'stable' as const
      });
    }

    // Weekly pattern insight
    const currentWeek = weeks[3];
    if (currentWeek && currentWeek.completionRate >= 80) {
      trends.push({
        title: t('home.habitTrends.excellentWeek'),
        description: t('home.habitTrends.excellentWeekDescription', { percent: currentWeek.completionRate }),
        icon: '🌟',
        color: colors.success,
        trend: 'improving' as const
      });
    }

    return {
      trends,
      summary: {
        overallTrend,
        recentAvg: Math.round(recentAvg),
        change: Math.round(overallTrendChange),
        weeks
      }
    };
  }, [habits, getHabitsByDate, getHabitStats]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginHorizontal: Layout.spacing.md,
      marginTop: Layout.spacing.md,
      minHeight: 240,
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
  });

  if (trendAnalysis.trends.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.habitStats.trendAnalysis')}</Text>
        </View>

        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>{t('home.habitStats.noData')}</Text>
          <Text style={styles.noDataSubtext}>{t('home.habitTrends.noDataDescription')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.habitStats.trendAnalysis')}</Text>
        <Text style={styles.subtitle}>
          {t('home.habitTrends.last4Weeks')} - {formatDateForDisplay(today(), 'short')}
        </Text>
      </View>

      <View>
        {trendAnalysis.trends.slice(0, 2).map((trend, index) => (
          <TrendItem
            key={index}
            title={trend.title}
            description={trend.description}
            icon={trend.icon}
            color={trend.color}
            trend={trend.trend}
          />
        ))}
      </View>
    </View>
  );
};