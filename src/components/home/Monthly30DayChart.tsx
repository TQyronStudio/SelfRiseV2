import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout, Fonts } from '@/src/constants';
import { formatDate, getPast30Days, formatDateToString, getDayOfWeekFromDateString, today, parseDate, isToday } from '@/src/utils/date';
import { wasScheduledOnDate } from '@/src/utils/habitImmutability';

export const Monthly30DayChart: React.FC = React.memo(() => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { habits, getHabitsByDate, getHabitStats, getEarliestDataDate, getDataDateRange, getRelevantDatesForHabit } = useHabitsData();

  const monthData = useMemo(() => {
    // Use either available data period or past 30 days, whichever is shorter
    const availableDataRange = getDataDateRange();
    const past30Days = getPast30Days();
    const monthDates = availableDataRange.length <= 30 ? availableDataRange : past30Days.slice(-30);
    const activeHabits = habits.filter(habit => habit.isActive);
    
    return monthDates.map(dateStr => {
      const dayOfWeek = getDayOfWeekFromDateString(dateStr);
      const habitsOnDate = getHabitsByDate(dateStr);
      
      // Filter habits that existed on this date and are scheduled for this day
      // IMMUTABILITY PRINCIPLE: Use historical schedule for this specific date
      const scheduledHabits = activeHabits.filter(habit => {
        const relevantDatesForHabit = getRelevantDatesForHabit(habit, [dateStr]);
        return wasScheduledOnDate(habit, dateStr, dayOfWeek) && relevantDatesForHabit.length > 0;
      });
      
      // Count completions using Smart Bonus Conversion logic
      let scheduledCompletions = 0;
      let bonusCompletions = 0;
      let coveredMissedDays = 0; // Track covered missed days (shouldn't count as missed)
      
      // Filter habits that existed on this date (for reference)
      const existingHabits = activeHabits.filter(habit => {
        const relevantDatesForHabit = getRelevantDatesForHabit(habit, [dateStr]);
        return relevantDatesForHabit.length > 0;
      });
      
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

  // Dynamic Y-axis scaling
  const maxTotalHabitsInPeriod = useMemo(() => {
    return Math.max(...monthData.map(day => day.totalScheduled + day.bonusCount), 1);
  }, [monthData]);

  // Chart dimensions (smaller for 30-day view)
  const CHART_HEIGHT = 80; // Smaller height for monthly view
  const CHART_PADDING = 15; // Space for Y-axis labels

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
    if (maxTotalHabitsInPeriod === 0) return 2;
    return Math.max(2, (dayTotal / maxTotalHabitsInPeriod) * CHART_HEIGHT);
  };

  // Get section height within a day column (proportional to day total)
  const getSectionHeight = (sectionCount: number, dayTotal: number, dayColumnHeight: number) => {
    if (dayTotal === 0) return 0;
    return (sectionCount / dayTotal) * dayColumnHeight;
  };

  const actualDataPeriod = useMemo(() => {
    return monthData.length;
  }, [monthData]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginHorizontal: Layout.spacing.md,
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
    scrollableChart: {
      flex: 1,
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
      justifyContent: 'flex-end',
      alignItems: 'center',
      width: 10,
      position: 'relative',
    },
    unifiedBar: {
      width: 8,
      position: 'relative',
    },
    barSection: {
      width: 8,
      position: 'absolute',
      left: 0,
    },
    barBase: {
      width: 10,
      height: 1,
      backgroundColor: colors.border,
      position: 'absolute',
      bottom: -1,
    },
    dayLabel: {
      fontSize: 8,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    todayLabel: {
      color: colors.primary,
      fontFamily: Fonts.semibold,
    },
    completionText: {
      fontSize: 7,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
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
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {actualDataPeriod >= 30 ? t('home.monthly30Day.title30') : t('home.monthly30Day.titleCustom', { days: actualDataPeriod })}
        </Text>
        <Text style={styles.subtitle}>
          {t('home.monthly30Day.completionRate', {
            completed: overallStats.totalCompletions,
            total: overallStats.totalPossible,
            percent: overallStats.avgCompletionRate
          })}
          {overallStats.totalBonusCompletions > 0 && ` + ${t('home.monthly30Day.bonus', { count: overallStats.totalBonusCompletions })}`}
        </Text>
      </View>

      {/* Chart with Y-axis - Scrollable for 30 days */}
      <View style={[styles.chartContainer, { height: CHART_HEIGHT + 50 }]}>
        <View style={styles.chartWrapper}>
          {/* No Y-axis labels or grid lines - clean chart */}

          {/* Chart content - Scrollable */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.scrollableChart}
            contentContainerStyle={styles.chartContent}
          >
            {monthData.map((day) => {
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
                                backgroundColor: day.isToday ? colors.textSecondary : colors.error,
                                bottom: 0,
                                // Always apply bottom border radius for missed section (it's always at bottom)
                                borderBottomLeftRadius: 2,
                                borderBottomRightRadius: 2,
                                // Apply top border radius if this is the only section
                                ...(day.scheduledCount === 0 && day.bonusCount === 0 ? {
                                  borderTopLeftRadius: 2,
                                  borderTopRightRadius: 2,
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
                                  borderTopLeftRadius: 2,
                                  borderTopRightRadius: 2,
                                } : {}),
                                // Apply bottom border radius if this is the bottommost section
                                ...(day.actualMissedDays === 0 ? {
                                  borderBottomLeftRadius: 2,
                                  borderBottomRightRadius: 2,
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
                                borderTopLeftRadius: 2,
                                borderTopRightRadius: 2,
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
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>{t('home.monthly30Day.completed')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>{t('home.monthly30Day.missed')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.gold }]} />
          <Text style={styles.legendText}>{t('home.monthly30Day.bonusLabel')}</Text>
        </View>
      </View>
    </View>
  );
});