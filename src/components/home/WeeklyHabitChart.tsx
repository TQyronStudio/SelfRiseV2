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
      let coveredMissedDays = 0; // Track covered missed days (shouldn't count as missed)
      
      habitsOnDate.forEach(h => {
        const completion = h.completion;
        const isScheduledForThisDay = scheduledHabits.some(sh => sh.id === h.id);
        
        if (h.isCompleted) {
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
        } else if (completion?.isCovered) {
          // Missed day that is covered by makeup - don't count as missed
          coveredMissedDays++;
        }
      });
      
      const scheduledCount = scheduledCompletions;
      const bonusCount = bonusCompletions;
      const totalScheduled = scheduledHabits.length;
      const totalCompleted = scheduledCount + bonusCount;
      // Calculate actual missed days (total scheduled - completed - covered)
      const actualMissedDays = Math.max(0, totalScheduled - scheduledCount - coveredMissedDays);
      
      const completionRate = totalScheduled > 0 ? (scheduledCount / totalScheduled) * 100 : 0;
      
      // Parse date string to Date object for day operations
      const dateObj = parseDate(dateStr);
      
      // Debug logging for today's data
      if (today() === dateStr) {
        console.log('🔍 WeeklyHabitChart Debug for Today:', {
          date: dateStr,
          scheduledHabits: scheduledHabits.length,
          scheduledCompletions: scheduledCount,
          bonusCompletions: bonusCount,
          coveredMissedDays,
          actualMissedDays,
          totalScheduled,
          habitsOnDate: habitsOnDate.length,
          isToday: today() === dateStr
        });
      }

      return {
        date: dateStr,
        dayName: formatDate(dateObj, 'dd').substring(0, 3), // Mon, Tue, etc.
        dayNumber: dateObj.getDate(),
        scheduledCount,
        bonusCount,
        totalScheduled,
        totalCompleted,
        actualMissedDays, // Add actualMissedDays to data
        // Calculate actual visible bar height (completed + bonus)
        visibleBarHeight: scheduledCount + bonusCount,
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

  // Dynamic Y-axis scaling
  const maxTotalHabitsInPeriod = useMemo(() => {
    return Math.max(...weekData.map(day => day.totalScheduled + day.bonusCount), 1);
  }, [weekData]);

  // Chart dimensions
  const CHART_HEIGHT = 120; // Increased height for better visualization
  const CHART_PADDING = 20; // Space for Y-axis labels

  // Calculate Y-axis grid steps
  const getYAxisSteps = (maxValue: number) => {
    if (maxValue <= 5) return [1, 2, 3, 4, 5];
    if (maxValue <= 10) return [2, 4, 6, 8, 10];
    if (maxValue <= 20) return [5, 10, 15, 20];
    if (maxValue <= 50) return [10, 20, 30, 40, 50];
    return [25, 50, 75, 100];
  };

  const yAxisSteps = useMemo(() => getYAxisSteps(maxTotalHabitsInPeriod), [maxTotalHabitsInPeriod]);

  // Get bar height for entire day column (proportional to max in period)
  const getDayColumnHeight = (dayTotal: number) => {
    if (maxTotalHabitsInPeriod === 0) return 4;
    return Math.max(4, (dayTotal / maxTotalHabitsInPeriod) * CHART_HEIGHT);
  };

  // Get section height within a day column (proportional to day total)
  const getSectionHeight = (sectionCount: number, dayTotal: number, dayColumnHeight: number) => {
    if (dayTotal === 0) return 0;
    return (sectionCount / dayTotal) * dayColumnHeight;
  };

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

      {/* Chart with Y-axis */}
      <View style={[styles.chartContainer, { height: CHART_HEIGHT + 60 }]}>
        <View style={styles.chartWrapper}>
          {/* Y-axis grid lines and labels */}
          <View style={styles.yAxisContainer}>
            {yAxisSteps.map((step) => (
              <View key={step} style={styles.yAxisStep}>
                <Text style={styles.yAxisLabel}>{step}</Text>
                <View 
                  style={[
                    styles.gridLine, 
                    { 
                      bottom: (step / maxTotalHabitsInPeriod) * CHART_HEIGHT,
                      width: '100%'
                    }
                  ]} 
                />
              </View>
            ))}
          </View>

          {/* Chart content */}
          <View style={styles.chartContent}>
            {weekData.map((day) => {
              const dayTotal = day.totalScheduled + day.bonusCount;
              const dayColumnHeight = getDayColumnHeight(dayTotal);
              
              return (
                <View key={day.date} style={styles.dayColumn}>
                  {/* Unified Stacked Bar */}
                  <View style={[styles.barContainer, { height: CHART_HEIGHT + CHART_PADDING }]}>
                    {dayTotal > 0 && (
                      <View style={[styles.unifiedBar, { height: dayColumnHeight }]}>
                        {/* Red/Gray section for missed tasks (bottom) */}
                        {day.actualMissedDays > 0 && (
                          <View 
                            style={[
                              styles.barSection,
                              {
                                height: getSectionHeight(day.actualMissedDays, dayTotal, dayColumnHeight),
                                backgroundColor: isToday(day.date) ? Colors.textSecondary : Colors.error,
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
                                height: getSectionHeight(day.scheduledCount, dayTotal, dayColumnHeight),
                                backgroundColor: Colors.success,
                                bottom: day.actualMissedDays > 0 ? getSectionHeight(day.actualMissedDays, dayTotal, dayColumnHeight) : 0,
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
                                height: getSectionHeight(day.bonusCount, dayTotal, dayColumnHeight),
                                backgroundColor: Colors.gold,
                                bottom: getSectionHeight(day.actualMissedDays + day.scheduledCount, dayTotal, dayColumnHeight),
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
              );
            })}
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.error }]} />
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
    marginBottom: Layout.spacing.md,
  },
  chartWrapper: {
    position: 'relative',
    flex: 1,
  },
  yAxisContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40, // Space for day labels
    height: 120, // CHART_HEIGHT
    zIndex: 1,
  },
  yAxisStep: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  yAxisLabel: {
    position: 'absolute',
    left: 4,
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 2,
    zIndex: 2,
  },
  gridLine: {
    position: 'absolute',
    left: 30, // Start after Y-axis labels
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: Layout.spacing.xs,
    paddingLeft: 35, // Space for Y-axis labels
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 50,
  },
  barContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
    position: 'relative',
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