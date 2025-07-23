import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout, Fonts } from '@/src/constants';
import { formatDate, getPast7Days, formatDateToString, getDayOfWeekFromDateString, today, parseDate, isToday } from '@/src/utils/date';

export const WeeklyHabitChart: React.FC = React.memo(() => {
  const { t } = useI18n();
  const { habits, getHabitsByDate, getHabitStats, getDataDateRange, getRelevantDatesForHabit } = useHabitsData();

  const weekData = useMemo(() => {
    // Use either available data period or past 7 days, whichever is shorter
    const availableDataRange = getDataDateRange();
    const past7Days = getPast7Days();
    const weekDates = availableDataRange.length <= 7 ? availableDataRange : past7Days;
    const activeHabits = habits.filter(habit => habit.isActive);
    
    return weekDates.map(dateStr => {
      const dayOfWeek = getDayOfWeekFromDateString(dateStr);
      const habitsOnDate = getHabitsByDate(dateStr);
      
      // Filter habits that existed on this date and are scheduled for this day
      const scheduledHabits = activeHabits.filter(habit => {
        const relevantDatesForHabit = getRelevantDatesForHabit(habit, [dateStr]);
        return habit.scheduledDays.includes(dayOfWeek) && relevantDatesForHabit.length > 0;
      });
      
      // Filter habits that existed on this date (for bonus calculation)
      const existingHabits = activeHabits.filter(habit => {
        const relevantDatesForHabit = getRelevantDatesForHabit(habit, [dateStr]);
        return relevantDatesForHabit.length > 0;
      });
      
      // Count completions using Smart Bonus Conversion logic
      let scheduledCompletions = 0;
      let bonusCompletions = 0;
      
      habitsOnDate.forEach(h => {
        if (!h.isCompleted) return;
        
        const completion = h.completion;
        const isScheduledForThisDay = scheduledHabits.some(sh => sh.id === h.id);
        
        if (completion?.isBonus && !completion?.isConverted) {
          // Regular bonus (not converted)
          bonusCompletions++;
        } else if (completion?.isConverted && completion?.convertedFromDate) {
          // Makeup completion (bonus converted to cover missed day)
          scheduledCompletions++;
        } else if (isScheduledForThisDay && !completion?.isBonus) {
          // Normal scheduled completion
          scheduledCompletions++;
        } else if (!isScheduledForThisDay && !completion?.isBonus) {
          // This shouldn't happen with proper conversion logic
          bonusCompletions++;
        }
      });
      
      const scheduledCount = scheduledCompletions;
      const bonusCount = bonusCompletions;
      const totalScheduled = scheduledHabits.length;
      const totalCompleted = scheduledCount + bonusCount;
      
      const completionRate = totalScheduled > 0 ? (scheduledCount / totalScheduled) * 100 : 0;
      
      // Parse date string to Date object for day operations
      const dateObj = parseDate(dateStr);
      
      return {
        date: dateStr,
        dayName: formatDate(dateObj, 'dd').substring(0, 3), // Mon, Tue, etc.
        dayNumber: dateObj.getDate(),
        scheduledCount,
        bonusCount,
        totalScheduled,
        totalCompleted,
        completionRate,
        isToday: today() === dateStr
      };
    });
  }, [habits, getHabitsByDate, getDataDateRange]);

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

  const getBarHeightForCount = (count: number, maxCount: number) => {
    const maxHeight = 80;
    const baseHeight = 4;
    if (maxCount === 0) return baseHeight;
    return Math.max(baseHeight, (count / maxCount) * maxHeight);
  };

  const maxHabitsPerDay = useMemo(() => {
    return Math.max(...weekData.map(day => day.totalScheduled + day.bonusCount), 1);
  }, [weekData]);

  const actualDataPeriod = useMemo(() => {
    return weekData.length;
  }, [weekData]);

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
        <Text style={styles.title}>
          {actualDataPeriod >= 7 ? 'Past 7 Days Completion' : `Past ${actualDataPeriod} Days Completion`}
        </Text>
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
              {/* Unified Stacked Bar */}
              <View style={styles.barContainer}>
                {(day.totalScheduled > 0 || day.bonusCount > 0) && (
                  <View style={[styles.unifiedBar, { height: getBarHeightForCount(day.totalScheduled + day.bonusCount, maxHabitsPerDay) }]}>
                    {/* Red/Gray section for missed tasks (bottom) */}
                    {(day.totalScheduled - day.scheduledCount) > 0 && (
                      <View 
                        style={[
                          styles.barSection,
                          {
                            height: getBarHeightForCount(day.totalScheduled - day.scheduledCount, maxHabitsPerDay),
                            backgroundColor: isToday(day.date) ? Colors.textSecondary : Colors.error, // Gray for today, red for past
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
                            bottom: (day.totalScheduled - day.scheduledCount) > 0 ? getBarHeightForCount(day.totalScheduled - day.scheduledCount, maxHabitsPerDay) : 0,
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
  unifiedBar: {
    width: 24,
    borderRadius: Layout.borderRadius.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  barSection: {
    width: 24,
    position: 'absolute',
    left: 0,
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