import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout, Fonts } from '@/src/constants';
import { getWeekDates, subtractDays, today, formatDateForDisplay, getDayOfWeekFromDateString, formatDateToString } from '@/src/utils/date';

interface TrendItemProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  trend: 'improving' | 'declining' | 'stable';
}

const TrendItem: React.FC<TrendItemProps> = ({ title, description, icon, color, trend }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
    }
  };

  return (
    <View style={[styles.trendItem, { borderLeftColor: color }]}>
      <View style={styles.trendHeader}>
        <Text style={styles.trendIcon}>{icon}</Text>
        <Text style={styles.trendIndicator}>{getTrendIcon()}</Text>
      </View>
      <Text style={styles.trendTitle}>{title}</Text>
      <Text style={styles.trendDescription} numberOfLines={2} ellipsizeMode="tail">{description}</Text>
    </View>
  );
};

export const HabitTrendAnalysis: React.FC = () => {
  const { t } = useI18n();
  const { habits, getHabitsByDate, getHabitStats } = useHabitsData();

  const trendAnalysis = useMemo(() => {
    const activeHabits = habits.filter(habit => habit.isActive);
    
    if (activeHabits.length === 0) {
      return { trends: [], summary: null };
    }

    // Get data for last 4 weeks for trend analysis
    const trends = [];
    const weeks = [];
    
    // Calculate weekly completion rates for last 4 weeks
    for (let i = 0; i < 4; i++) {
      const weekStart = subtractDays(today(), i * 7 + 6);
      const weekDates = [];
      for (let j = 0; j < 7; j++) {
        const date = new Date(weekStart + 'T00:00:00.000Z');
        date.setDate(date.getDate() + j);
        weekDates.push(date.toISOString().split('T')[0] as string);
      }

      let weekCompletions = 0;
      let weekPossible = 0;

      weekDates.forEach(date => {
        const habitsOnDate = getHabitsByDate(date);
        const completed = habitsOnDate.filter(h => h.isCompleted).length;
        weekCompletions += completed;
        weekPossible += activeHabits.length;
      });

      const completionRate = weekPossible > 0 ? (weekCompletions / weekPossible) * 100 : 0;
      weeks.unshift({
        weekNumber: i + 1,
        completionRate: Math.round(completionRate),
        completions: weekCompletions,
        possible: weekPossible
      });
    }

    // Overall trend calculation
    const recentAvg = (weeks[2]?.completionRate + weeks[3]?.completionRate) / 2;
    const earlierAvg = (weeks[0]?.completionRate + weeks[1]?.completionRate) / 2;
    const overallTrendChange = recentAvg - earlierAvg;

    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (overallTrendChange > 10) overallTrend = 'improving';
    else if (overallTrendChange < -10) overallTrend = 'declining';

    // Individual habit analysis - using 4 weeks of data
    const habitAnalysis = activeHabits.map(habit => {
      const stats = getHabitStats(habit.id);
      
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
        const isScheduled = habit.scheduledDays.includes(dayOfWeek);
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
      
      // Calculate 4-week completion rate with bonus
      const scheduledRate = scheduledDays > 0 ? (completedScheduled / scheduledDays) * 100 : 0;
      const bonusRate = scheduledDays > 0 ? (bonusCompletions / scheduledDays) * 25 : 0;
      const recentRate = scheduledRate + bonusRate;
      
      // For trend, compare with overall completion rate
      const change = recentRate - stats.completionRate;

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (change > 15) trend = 'improving';
      else if (change < -15) trend = 'declining';

      return {
        habit,
        recentRate: Math.round(recentRate),
        change: Math.round(change),
        trend,
        currentStreak: stats.currentStreak,
        completionRate: stats.completionRate,
        scheduledDays,
        completedScheduled,
        bonusCompletions
      };
    });

    // Generate trend insights
    if (overallTrend === 'improving') {
      trends.push({
        title: '🚀 Overall Progress',
        description: `Improved by ${Math.round(overallTrendChange)}% over 4 weeks. Keep it up!`,
        icon: '📊',
        color: Colors.success,
        trend: 'improving' as const
      });
    } else if (overallTrend === 'declining') {
      trends.push({
        title: '⚠️ Needs Attention',
        description: `Dropped by ${Math.round(Math.abs(overallTrendChange))}% recently. Review your routine.`,
        icon: '📊',
        color: Colors.error,
        trend: 'declining' as const
      });
    } else {
      trends.push({
        title: '📈 Steady Progress',
        description: `Consistency stable at ${Math.round(recentAvg)}% average.`,
        icon: '📊',
        color: Colors.warning,
        trend: 'stable' as const
      });
    }

    // Best performing habit
    const bestPerformer = habitAnalysis
      .filter(h => h.trend === 'improving')
      .sort((a, b) => b.change - a.change)[0];

    if (bestPerformer) {
      trends.push({
        title: '🏆 Star Performer',
        description: `${bestPerformer.habit.name} improved by ${bestPerformer.change}%!`,
        icon: '⭐',
        color: Colors.success,
        trend: 'improving' as const
      });
    }

    // Habit needing attention
    const strugglingHabit = habitAnalysis
      .filter(h => h.trend === 'declining' || h.recentRate < 50)
      .sort((a, b) => a.recentRate - b.recentRate)[0];

    if (strugglingHabit) {
      trends.push({
        title: '💪 Focus Needed',
        description: `${strugglingHabit.habit.name} at ${strugglingHabit.recentRate}%. Try smaller steps.`,
        icon: '🎯',
        color: Colors.warning,
        trend: 'declining' as const
      });
    }

    // Consistency insights
    const consistentHabits = habitAnalysis.filter(h => h.currentStreak >= 7).length;
    if (consistentHabits > 0) {
      trends.push({
        title: '🔥 Streak Champions',
        description: `${consistentHabits} habit${consistentHabits > 1 ? 's' : ''} with 7+ day streaks!`,
        icon: '🔥',
        color: Colors.secondary,
        trend: 'stable' as const
      });
    }

    // Weekly pattern insight
    const currentWeek = weeks[3];
    if (currentWeek && currentWeek.completionRate >= 80) {
      trends.push({
        title: '🎯 Excellent Week',
        description: `${currentWeek.completionRate}% completion this week. Amazing!`,
        icon: '🌟',
        color: Colors.success,
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

  if (trendAnalysis.trends.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.habitStats.trendAnalysis')}</Text>
        </View>
        
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>{t('home.habitStats.noData')}</Text>
          <Text style={styles.noDataSubtext}>Complete habits for a few weeks to see trend analysis</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.habitStats.trendAnalysis')}</Text>
        <Text style={styles.subtitle}>
          Last 4 weeks - {formatDateForDisplay(today(), 'short')}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginTop: Layout.spacing.md,
    minHeight: 240, // Minimum height, can grow if needed
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
  trendItem: {
    backgroundColor: Colors.backgroundSecondary,
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
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  trendDescription: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
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