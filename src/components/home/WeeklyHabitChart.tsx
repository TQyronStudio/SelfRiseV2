import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { Layout, Fonts } from '@/src/constants';
import { formatDate, getPast7Days, formatDateToString, getDayOfWeekFromDateString, today, parseDate, isToday } from '@/src/utils/date';
import { wasScheduledOnDate } from '@/src/utils/habitImmutability';
import { useTheme } from '@/src/contexts/ThemeContext';

export const WeeklyHabitChart: React.FC = React.memo(() => {
  const { t } = useI18n();
  const { colors } = useTheme();
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
      // IMMUTABILITY PRINCIPLE: Use historical schedule for this specific date
      const scheduledHabits = activeHabits.filter(habit => {
        const relevantDatesForHabit = getRelevantDatesForHabit(habit, [dateStr]);
        return wasScheduledOnDate(habit, dateStr, dayOfWeek) && relevantDatesForHabit.length > 0;
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
        // IMMUTABILITY PRINCIPLE: Use historical schedule awareness
        const isScheduledForThisDay = wasScheduledOnDate(h, dateStr, dayOfWeek);
        
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

  // Calculate Y-axis grid steps - Fixed to not exceed maxValue
  const getYAxisSteps = (maxValue: number) => {
    // Generate base steps but filter out values above maxValue
    let steps: number[];
    if (maxValue <= 5) {
      steps = [1, 2, 3, 4, 5];
    } else if (maxValue <= 10) {
      steps = [2, 4, 6, 8, 10];
    } else if (maxValue <= 20) {
      steps = [5, 10, 15, 20];
    } else if (maxValue <= 50) {
      steps = [10, 20, 30, 40, 50];
    } else {
      steps = [25, 50, 75, 100];
    }
    
    // Filter out steps that exceed maxValue and ensure maxValue is included
    const filteredSteps = steps.filter(step => step <= maxValue);
    
    // Always include maxValue as the top step if it's not already there
    if (!filteredSteps.includes(maxValue) && maxValue > 0) {
      filteredSteps.push(maxValue);
    }
    
    return filteredSteps.sort((a, b) => a - b);
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
    if (completionRate >= 80) return colors.success;
    if (completionRate >= 60) return colors.warning;
    if (completionRate >= 40) return Colors.secondary;
    return Colors.textSecondary;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginHorizontal: Layout.spacing.md,
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
    chartContainer: {
      marginBottom: Layout.spacing.md,
    },
    chartWrapper: {
      position: 'relative',
      flex: 1,
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
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: Layout.spacing.xs,
      position: 'relative',
    },
    unifiedBar: {
      width: 24,
      position: 'relative',
    },
    barSection: {
      width: 24,
      position: 'absolute',
      left: 0,
    },
    barBase: {
      width: 28,
      height: 2,
      backgroundColor: colors.border,
      position: 'absolute',
      bottom: -1,
    },
    dayLabel: {
      fontSize: 10,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    todayLabel: {
      color: colors.primary,
      fontWeight: '600',
    },
    dayNumber: {
      fontSize: Fonts.sizes.xs,
      fontFamily: Fonts.medium,
      color: colors.text,
      marginBottom: 2,
    },
    todayNumber: {
      color: colors.primary,
      fontWeight: '700',
    },
    completionText: {
      fontSize: 9,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
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
      color: colors.textSecondary,
    },
  });

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
          {/* No Y-axis labels or grid lines - clean chart */}

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
                                backgroundColor: isToday(day.date) ? Colors.textSecondary : colors.error,
                                bottom: 0,
                                // Always apply bottom border radius for missed section (it's always at bottom)
                                borderBottomLeftRadius: Layout.borderRadius.sm,
                                borderBottomRightRadius: Layout.borderRadius.sm,
                                // Apply top border radius if this is the only section
                                ...(day.scheduledCount === 0 && day.bonusCount === 0 ? {
                                  borderTopLeftRadius: Layout.borderRadius.sm,
                                  borderTopRightRadius: Layout.borderRadius.sm,
                                } : {})
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
                                backgroundColor: colors.success,
                                bottom: day.actualMissedDays > 0 ? getSectionHeight(day.actualMissedDays, dayTotal, dayColumnHeight) : 0,
                                // Apply top border radius if this is the topmost section
                                ...(day.bonusCount === 0 ? {
                                  borderTopLeftRadius: Layout.borderRadius.sm,
                                  borderTopRightRadius: Layout.borderRadius.sm,
                                } : {}),
                                // Apply bottom border radius if this is the bottommost section
                                ...(day.actualMissedDays === 0 ? {
                                  borderBottomLeftRadius: Layout.borderRadius.sm,
                                  borderBottomRightRadius: Layout.borderRadius.sm,
                                } : {})
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
                                backgroundColor: colors.gold,
                                bottom: getSectionHeight(day.actualMissedDays + day.scheduledCount, dayTotal, dayColumnHeight),
                                // Always apply top border radius for bonus section (it's always on top)
                                borderTopLeftRadius: Layout.borderRadius.sm,
                                borderTopRightRadius: Layout.borderRadius.sm,
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
          <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.gold }]} />
          <Text style={styles.legendText}>Bonus</Text>
        </View>
      </View>
    </View>
  );
});