import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout, Fonts } from '@/src/constants';
import { formatDate, getPast30Days, formatDateToString, getDayOfWeekFromDateString } from '@/src/utils/date';

export const Monthly30DayChart: React.FC = React.memo(() => {
  const { t } = useI18n();
  const { habits, getHabitsByDate, getHabitStats } = useHabitsData();

  const monthData = useMemo(() => {
    const monthDates = getPast30Days(); // Gets past 30 days ending with today
    const activeHabits = habits.filter(habit => habit.isActive);
    
    return monthDates.map(dateStr => {
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
    const totalScheduledCompletions = monthData.reduce((sum, day) => sum + day.scheduledCount, 0);
    const totalBonusCompletions = monthData.reduce((sum, day) => sum + day.bonusCount, 0);
    const totalPossible = monthData.reduce((sum, day) => sum + day.totalScheduled, 0);
    const avgCompletionRate = totalPossible > 0 ? (totalScheduledCompletions / totalPossible) * 100 : 0;
    
    return {
      totalScheduledCompletions,
      totalBonusCompletions,
      totalCompletions: totalScheduledCompletions + totalBonusCompletions,
      totalPossible,
      avgCompletionRate: Math.round(avgCompletionRate)
    };
  }, [monthData]);

  const getBarHeightForCount = (count: number, maxCount: number) => {
    const maxHeight = 40; // Smaller bars for 30-day view
    const baseHeight = 2;
    if (maxCount === 0) return baseHeight;
    return Math.max(baseHeight, (count / maxCount) * maxHeight);
  };

  const maxHabitsPerDay = useMemo(() => {
    return Math.max(...monthData.map(day => day.totalScheduled + day.bonusCount), 1);
  }, [monthData]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Past 30 Days Completion</Text>
        <Text style={styles.subtitle}>
          {overallStats.totalCompletions}/{overallStats.totalPossible} ({overallStats.avgCompletionRate}%)
          {overallStats.totalBonusCompletions > 0 && ` + ${overallStats.totalBonusCompletions} bonus`}
        </Text>
      </View>

      {/* Chart - Scrollable for 30 days */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chartContainer}
        contentContainerStyle={styles.chartContent}
      >
        {monthData.map((day) => (
          <View key={day.date} style={styles.dayColumn}>
            {/* Unified Stacked Bar */}
            <View style={styles.barContainer}>
              {(day.totalScheduled > 0 || day.bonusCount > 0) && (
                <View style={[styles.unifiedBar, { height: getBarHeightForCount(day.totalScheduled + day.bonusCount, maxHabitsPerDay) }]}>
                  {/* Gray section for missed tasks (bottom) */}
                  {(day.totalScheduled - day.scheduledCount) > 0 && (
                    <View 
                      style={[
                        styles.barSection,
                        {
                          height: getBarHeightForCount(day.totalScheduled - day.scheduledCount, maxHabitsPerDay),
                          backgroundColor: Colors.textSecondary,
                          bottom: 0,
                        }
                      ]} 
                    />
                  )}
                  
                  {/* Green section for completed scheduled tasks (middle) */}
                  {day.scheduledCount > 0 && (
                    <View 
                      style={[
                        styles.barSection,
                        {
                          height: getBarHeightForCount(day.scheduledCount, maxHabitsPerDay),
                          backgroundColor: Colors.success,
                          bottom: getBarHeightForCount(day.totalScheduled - day.scheduledCount, maxHabitsPerDay),
                        }
                      ]} 
                    />
                  )}
                  
                  {/* Gold section for bonus completions (top) */}
                  {day.bonusCount > 0 && (
                    <View 
                      style={[
                        styles.barSection,
                        {
                          height: getBarHeightForCount(day.bonusCount, maxHabitsPerDay),
                          backgroundColor: Colors.gold,
                          bottom: getBarHeightForCount(day.totalScheduled, maxHabitsPerDay),
                        }
                      ]} 
                    />
                  )}
                </View>
              )}
              
              <View style={styles.barBase} />
            </View>
            
            {/* Day number - show every 5 days or for today */}
            {(monthData.indexOf(day) % 5 === 0 || day.isToday) && (
              <Text style={[
                styles.dayLabel,
                day.isToday && styles.todayLabel
              ]}>
                {day.dayNumber}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.textSecondary }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.gold }]} />
          <Text style={styles.legendText}>Bonus</Text>
        </View>
      </View>
    </View>
  );
});

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
    height: 70,
    marginBottom: Layout.spacing.md,
  },
  chartContent: {
    paddingHorizontal: Layout.spacing.xs,
  },
  dayColumn: {
    alignItems: 'center',
    width: 12,
    marginHorizontal: 1,
  },
  barContainer: {
    height: 50,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: 10,
  },
  unifiedBar: {
    width: 8,
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  barSection: {
    width: 8,
    position: 'absolute',
    left: 0,
  },
  barBase: {
    width: 10,
    height: 1,
    backgroundColor: Colors.border,
    position: 'absolute',
    bottom: -1,
  },
  dayLabel: {
    fontSize: 8,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  todayLabel: {
    color: Colors.primary,
    fontFamily: Fonts.semibold,
  },
  completionText: {
    fontSize: 7,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
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