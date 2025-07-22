import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout, Fonts } from '@/src/constants';
import { formatDate, getWeekDates, formatDateToString, getDayOfWeekFromDateString } from '@/src/utils/date';

export const WeeklyHabitChart: React.FC = () => {
  const { t } = useI18n();
  const { habits, getHabitsByDate, getHabitStats } = useHabitsData();

  const weekData = useMemo(() => {
    const weekDates = getWeekDates(); // Gets current week dates (DateString[])
    const activeHabits = habits.filter(habit => habit.isActive);
    
    return weekDates.map(dateStr => {
      const dayOfWeek = getDayOfWeekFromDateString(dateStr);
      const habitsOnDate = getHabitsByDate(dateStr);
      
      // Filter habits scheduled for this day
      const scheduledHabits = activeHabits.filter(habit => 
        habit.scheduledDays.includes(dayOfWeek)
      );
      
      // Count completions
      const scheduledCompletions = habitsOnDate.filter(h => 
        h.isCompleted && scheduledHabits.some(sh => sh.id === h.id)
      );
      
      // Count bonus completions (completed but not scheduled for this day)
      const bonusCompletions = habitsOnDate.filter(h => 
        h.isCompleted && !scheduledHabits.some(sh => sh.id === h.id)
      );
      
      const scheduledCount = scheduledCompletions.length;
      const bonusCount = bonusCompletions.length;
      const totalScheduled = scheduledHabits.length;
      const totalCompleted = scheduledCount + bonusCount;
      
      const completionRate = totalScheduled > 0 ? (scheduledCount / totalScheduled) * 100 : 0;
      
      // Parse date string to Date object for day operations
      const dateObj = new Date(dateStr + 'T00:00:00.000Z');
      
      return {
        date: dateStr,
        dayName: formatDate(dateObj, 'dd').substring(0, 3), // Mon, Tue, etc.
        dayNumber: dateObj.getDate(),
        scheduledCount,
        bonusCount,
        totalScheduled,
        totalCompleted,
        completionRate,
        isToday: formatDateToString(new Date()) === dateStr
      };
    });
  }, [habits, getHabitsByDate]);

  const overallStats = useMemo(() => {
    const totalScheduledCompletions = weekData.reduce((sum, day) => sum + day.scheduledCount, 0);
    const totalBonusCompletions = weekData.reduce((sum, day) => sum + day.bonusCount, 0);
    const totalPossible = weekData.reduce((sum, day) => sum + day.totalScheduled, 0);
    const avgCompletionRate = totalPossible > 0 ? (totalScheduledCompletions / totalPossible) * 100 : 0;
    
    return {
      totalScheduledCompletions,
      totalBonusCompletions,
      totalCompletions: totalScheduledCompletions + totalBonusCompletions,
      totalPossible,
      avgCompletionRate: Math.round(avgCompletionRate)
    };
  }, [weekData]);

  const getBarHeight = (completionRate: number) => {
    const maxHeight = 80;
    return Math.max(4, (completionRate / 100) * maxHeight);
  };

  const getBarColor = (completionRate: number) => {
    if (completionRate >= 80) return Colors.success;
    if (completionRate >= 60) return Colors.warning;
    if (completionRate >= 40) return Colors.secondary;
    return Colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.habitStats.weeklyChart')}</Text>
        <Text style={styles.subtitle}>
          {overallStats.totalCompletions}/{overallStats.totalPossible} ({overallStats.avgCompletionRate}%)
          {overallStats.totalBonusCompletions > 0 && ` + ${overallStats.totalBonusCompletions} bonus`}
        </Text>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chartContent}>
          {weekData.map((day) => (
            <View key={day.date} style={styles.dayColumn}>
              {/* Stacked Bar */}
              <View style={styles.barContainer}>
                {/* Scheduled completions bar (bottom) */}
                {day.totalScheduled > 0 && (
                  <View 
                    style={[
                      styles.scheduledBar,
                      {
                        height: getBarHeight(day.completionRate),
                        backgroundColor: getBarColor(day.completionRate)
                      }
                    ]} 
                  />
                )}
                
                {/* Bonus completions bar (top, stacked) */}
                {day.bonusCount > 0 && (
                  <View 
                    style={[
                      styles.bonusBar,
                      {
                        height: Math.min(20, day.bonusCount * 8), // Max 20px height for bonus
                        backgroundColor: Colors.gold
                      }
                    ]} 
                  />
                )}
                
                <View style={styles.barBase} />
              </View>
              
              {/* Day label */}
              <Text style={[
                styles.dayLabel,
                day.isToday && styles.todayLabel
              ]}>
                {day.dayName}
              </Text>
              
              {/* Day number */}
              <Text style={[
                styles.dayNumber,
                day.isToday && styles.todayNumber
              ]}>
                {day.dayNumber}
              </Text>

              {/* Completion count */}
              <Text style={styles.completionText}>
                {day.scheduledCount}/{day.totalScheduled}
                {day.bonusCount > 0 && ` +${day.bonusCount}`}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>80%+</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.warning }]} />
          <Text style={styles.legendText}>60%+</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.secondary }]} />
          <Text style={styles.legendText}>40%+</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.textSecondary }]} />
          <Text style={styles.legendText}>&lt;40%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.gold }]} />
          <Text style={styles.legendText}>Bonus</Text>
        </View>
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
  chartContainer: {
    height: 140,
    marginBottom: Layout.spacing.md,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: Layout.spacing.xs,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 50,
  },
  barContainer: {
    height: 90,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  scheduledBar: {
    width: 24,
    borderRadius: Layout.borderRadius.sm,
    minHeight: 4,
  },
  bonusBar: {
    width: 24,
    borderTopLeftRadius: Layout.borderRadius.sm,
    borderTopRightRadius: Layout.borderRadius.sm,
    marginTop: -2, // Slight overlap for stacked effect
  },
  barBase: {
    width: 28,
    height: 2,
    backgroundColor: Colors.border,
    position: 'absolute',
    bottom: -1,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  todayLabel: {
    color: Colors.primary,
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  todayNumber: {
    color: Colors.primary,
    fontWeight: '700',
  },
  completionText: {
    fontSize: 9,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Layout.spacing.xs,
    marginVertical: 2,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
});