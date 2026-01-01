// Monthly Progress Calendar Component
// Visual calendar showing daily contributions and milestones for monthly challenges
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import {
  MonthlyChallenge,
  MonthlyChallengeProgress,
  AchievementCategory
} from '../../types/gamification';
import { addDays, parseDate, formatDateToString } from '../../utils/date';
import { MonthlyProgressTracker } from '../../services/monthlyProgressTracker';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';

interface MonthlyProgressCalendarProps {
  challenge: MonthlyChallenge;
  progress: MonthlyChallengeProgress;
  compact?: boolean;
}

interface DayData {
  date: string;
  dayNumber: number;
  weekNumber: number;
  contributions: Record<string, number>;
  isGoodProgress: boolean;  // Replaced isTripleFeatureDay with isGoodProgress
  isPerfectDay: boolean;
  isMilestone: boolean;
  milestonePercentage?: number;
  hasActivity: boolean;
  isToday: boolean;
  isFuture: boolean;
  adaptiveIntensity: 'none' | 'some' | 'good' | 'perfect'; // Added for easier debugging
}

const { width: screenWidth } = Dimensions.get('window');

const MonthlyProgressCalendar: React.FC<MonthlyProgressCalendarProps> = ({
  challenge,
  progress,
  compact = false
}) => {
  const { colors } = useTheme();
  const { t, currentLanguage } = useI18n();

  // Load real daily snapshots instead of using fake weekly estimates
  const [dailySnapshots, setDailySnapshots] = useState<Record<string, any>>({});
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(true);

  useEffect(() => {
    const loadDailySnapshots = async () => {
      try {
        setIsLoadingSnapshots(true);

        // Get all snapshots and filter for this challenge
        const allSnapshots = await (MonthlyProgressTracker as any).getAllSnapshots();

        // CRITICAL: Filter by challenge ID AND date range to exclude cross-month contamination
        // (e.g., prevent October 31 from appearing in November challenge)
        const challengeSnapshots = allSnapshots.filter((s: any) => {
          return s.challengeId === challenge.id &&
                 s.date >= challenge.startDate &&
                 s.date <= challenge.endDate;
        });

        // Convert to date-indexed object for quick lookup
        const snapshotsByDate: Record<string, any> = {};
        challengeSnapshots.forEach((snapshot: any) => {
          snapshotsByDate[snapshot.date] = snapshot;
        });

        setDailySnapshots(snapshotsByDate);
      } catch (error) {
        console.error('MonthlyProgressCalendar: Failed to load daily snapshots:', error);
        setDailySnapshots({});
      } finally {
        setIsLoadingSnapshots(false);
      }
    };

    loadDailySnapshots();
  }, [challenge.id, challenge.startDate, challenge.endDate]);
  const getCategoryColor = (category: AchievementCategory) => {
    switch (category) {
      case 'habits': return '#22C55E';
      case 'journal': return '#3B82F6';
      case 'goals': return '#F59E0B';
      case 'consistency': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const categoryColor = getCategoryColor(challenge.category);

  // Calculate daily targets based on challenge requirements for adaptive coloring
  const calculateDailyTarget = useMemo(() => {
    const startDate = parseDate(challenge.startDate);
    const endDate = parseDate(challenge.endDate);
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate combined daily target from all requirements
    const combinedDailyTarget = challenge.requirements.reduce((total, req) => {
      return total + (req.target / totalDays);
    }, 0);
    
    return combinedDailyTarget;
  }, [challenge]);

  // Adaptive activity intensity based on completion percentage of daily target
  const getAdaptiveActivityIntensity = (actualContributions: Record<string, number>): 'none' | 'some' | 'good' | 'perfect' => {
    const totalActualProgress = Object.values(actualContributions).reduce((sum, val) => sum + val, 0);
    
    if (totalActualProgress === 0) return 'none';
    
    const completionPercentage = totalActualProgress / calculateDailyTarget;
    
    if (completionPercentage >= 0.91) return 'perfect'; // 91%+ = Perfect Day
    if (completionPercentage >= 0.51) return 'good';   // 51%+ = Good Progress  
    if (completionPercentage >= 0.10) return 'some';   // 10%+ = Some Activity
    return 'none'; // <10% = No meaningful activity
  };

  // Generate calendar data for the month using real daily snapshots
  const calendarData = useMemo(() => {
    if (isLoadingSnapshots) return []; // Return empty while loading
    
    const startDate = parseDate(challenge.startDate);
    const endDate = parseDate(challenge.endDate);
    const today = new Date();
    
    const days: DayData[] = [];
    let currentDate = new Date(startDate);
    let weekNumber = 1;

    while (currentDate <= endDate) {
      const dateString = formatDateToString(currentDate);
      const dayNumber = currentDate.getDate();
      
      // Check if this is the start of a new week (Monday)
      if (currentDate.getDay() === 1 && days.length > 0) {
        weekNumber++;
      }

      // Get REAL daily contributions from snapshots (not fake estimates!)
      const dailySnapshot = dailySnapshots[dateString];
      const dailyContributions = dailySnapshot?.dailyContributions || {};

      // Use adaptive activity intensity calculation
      const adaptiveIntensity = getAdaptiveActivityIntensity(dailyContributions);
      const hasActivity = adaptiveIntensity !== 'none';
      
      // Perfect Day is now based on meeting 100% of daily target
      const isPerfectDay = adaptiveIntensity === 'perfect';
      
      // Replace "Triple Feature Day" with "Good Progress" (75%+ of target)
      const isGoodProgress = adaptiveIntensity === 'good';

      // Check for milestone days
      const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const totalDaysInChallenge = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const progressPercentage = (daysSinceStart / totalDaysInChallenge) * 100;
      
      let isMilestone = false;
      let milestonePercentage: number | undefined;
      
      // Check if this day represents a milestone (25%, 50%, 75%)
      [25, 50, 75].forEach(milestone => {
        const milestoneDay = Math.ceil((milestone / 100) * totalDaysInChallenge);
        if (daysSinceStart === milestoneDay) {
          isMilestone = true;
          milestonePercentage = milestone;
        }
      });

      days.push({
        date: dateString,
        dayNumber,
        weekNumber,
        contributions: dailyContributions,
        isGoodProgress,  // Using isGoodProgress instead of isTripleFeatureDay
        isPerfectDay,
        isMilestone,
        ...(milestonePercentage !== undefined && { milestonePercentage }),
        hasActivity,
        isToday: dateString === formatDateToString(today),
        isFuture: currentDate > today,
        adaptiveIntensity // Include intensity for debugging
      });

      currentDate = new Date(addDays(currentDate, 1));
    }

    return days;
  }, [challenge, progress, dailySnapshots, isLoadingSnapshots, calculateDailyTarget]);

  // Group days by weeks for better display
  const weekGroups = useMemo(() => {
    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];

    calendarData.forEach(day => {
      if (currentWeek.length > 0 && day.weekNumber !== currentWeek[0]?.weekNumber) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [calendarData]);

  // Use adaptive intensity directly from day data (replaced old fixed logic)
  const getActivityIntensity = (day: DayData): 'none' | 'some' | 'good' | 'perfect' => {
    return day.adaptiveIntensity;
  };

  const getDayStyle = (day: DayData) => {
    const intensity = getActivityIntensity(day);
    const baseStyles: any[] = [styles.day];

    if (day.isToday) {
      baseStyles.push(styles.todayDay);
    }

    if (day.isFuture) {
      baseStyles.push(styles.futureDay);
      return baseStyles;
    }

    if (day.isMilestone) {
      baseStyles.push(styles.milestoneDay);
      baseStyles.push({ borderColor: categoryColor });
    }

    switch (intensity) {
      case 'perfect':
        baseStyles.push(styles.highActivityDay);
        baseStyles.push({ backgroundColor: categoryColor });
        break;
      case 'good':
        baseStyles.push(styles.mediumActivityDay);
        baseStyles.push({ backgroundColor: categoryColor + '80' });
        break;
      case 'some':
        baseStyles.push(styles.lowActivityDay);
        baseStyles.push({ backgroundColor: categoryColor + '40' });
        break;
      default:
        baseStyles.push(styles.noActivityDay);
    }

    return baseStyles;
  };

  const getDayTextStyle = (day: DayData) => {
    if (day.isFuture) return styles.futureDayText;
    if (day.isToday) return styles.todayDayText;
    
    const intensity = getActivityIntensity(day);
    if (intensity === 'perfect' || intensity === 'good') {
      return styles.activeDayText;
    }
    
    return styles.defaultDayText;
  };

  // Create dynamic styles inside component with theme colors
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 2,
    },
    legendText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    calendar: {
      marginBottom: 16,
    },
    weekHeader: {
      flexDirection: 'row',
      paddingLeft: 24,
      marginBottom: 8,
    },
    weekHeaderText: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    week: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    weekNumber: {
      width: 20,
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    weekDays: {
      flex: 1,
      flexDirection: 'row',
      gap: 2,
    },
    day: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      position: 'relative',
      minHeight: 32,
    },
    emptyDay: {
      backgroundColor: 'transparent',
    },
    noActivityDay: {
      backgroundColor: colors.border,
    },
    lowActivityDay: {
      backgroundColor: colors.border, // Will be overridden with category color + alpha
    },
    mediumActivityDay: {
      backgroundColor: colors.border, // Will be overridden with category color + alpha
    },
    highActivityDay: {
      backgroundColor: colors.border, // Will be overridden with category color
    },
    todayDay: {
      borderWidth: 2,
      borderColor: '#3B82F6',
    },
    futureDay: {
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    milestoneDay: {
      borderWidth: 2,
      // borderColor will be set dynamically
    },
    defaultDayText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    activeDayText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    todayDayText: {
      fontSize: 11,
      color: '#3B82F6',
      fontWeight: 'bold',
    },
    futureDayText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    milestoneIndicator: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 16,
      height: 14,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    milestoneText: {
      fontSize: 8,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    perfectDayBadge: {
      position: 'absolute',
      bottom: -4,
      right: -2,
    },
    perfectDayText: {
      fontSize: 10,
      color: '#F59E0B',
    },
    weeklySummary: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    weeklySummaryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    weekSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    weekSummaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    weekSummaryStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    weekSummaryText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    weekSummaryPercent: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '600',
      minWidth: 32,
      textAlign: 'right',
    },

    // Compact styles
    compactContainer: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 8,
      padding: 12,
      marginVertical: 4,
    },
    compactTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    compactCalendar: {
      gap: 3,
      paddingHorizontal: 2,
    },
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactTitle}>{t('monthlyChallenge.calendar.dailyProgress')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactCalendar}
        >
          {calendarData.slice(-14).map((day, index) => (
            <View key={day.date} style={getDayStyle(day)}>
              <Text style={getDayTextStyle(day)}>{day.dayNumber}</Text>
              {day.isMilestone && (
                <View style={[styles.milestoneIndicator, { backgroundColor: categoryColor }]}>
                  <Text style={styles.milestoneText}>{day.milestonePercentage}%</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('monthlyChallenge.calendar.title')}</Text>
        <Text style={styles.subtitle}>
          {new Date(challenge.startDate + 'T00:00:00').toLocaleDateString(currentLanguage, {
            month: 'long',
            year: 'numeric'
          })}
        </Text>
      </View>

      {/* Legend - Updated to reflect adaptive color system */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.noActivityDay]} />
          <Text style={styles.legendText}>{t('monthlyChallenge.calendar.noActivity')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.lowActivityDay, { backgroundColor: categoryColor + '40' }]} />
          <Text style={styles.legendText}>{t('monthlyChallenge.calendar.someActivity')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.mediumActivityDay, { backgroundColor: categoryColor + '80' }]} />
          <Text style={styles.legendText}>{t('monthlyChallenge.calendar.goodProgress')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.highActivityDay, { backgroundColor: categoryColor }]} />
          <Text style={styles.legendText}>{t('monthlyChallenge.calendar.perfectDay')}</Text>
        </View>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {/* Week headers */}
        <View style={styles.weekHeader}>
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
            <Text key={day} style={styles.weekHeaderText}>{t(`monthlyChallenge.calendar.weekDays.${day}`)}</Text>
          ))}
        </View>

        {/* Calendar weeks */}
        {weekGroups.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            <Text style={styles.weekNumber}>W{weekIndex + 1}</Text>
            <View style={styles.weekDays}>
              {/* Fill in empty days at the start of the week if needed */}
              {week.length < 7 && weekIndex === 0 && (
                Array.from({ length: 7 - week.length }, (_, i) => (
                  <View key={`empty-${i}`} style={[styles.day, styles.emptyDay]} />
                ))
              )}

              {week.map((day, dayIndex) => (
                <View key={day.date} style={getDayStyle(day)}>
                  <Text style={getDayTextStyle(day)}>{day.dayNumber}</Text>
                  {day.isMilestone && (
                    <View style={[styles.milestoneIndicator, { backgroundColor: categoryColor }]}>
                      <Text style={styles.milestoneText}>{day.milestonePercentage}%</Text>
                    </View>
                  )}
                  {day.isPerfectDay && (
                    <View style={styles.perfectDayBadge}>
                      <Text style={styles.perfectDayText}>★</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Weekly summary - Enhanced with real progress calculation */}
      <View style={styles.weeklySummary}>
        <Text style={styles.weeklySummaryTitle}>{t('monthlyChallenge.calendar.weeklyBreakdown')}</Text>
        {weekGroups.map((week, weekIndex) => {
          const weekDaysWithActivity = week.filter(day => day.hasActivity).length;
          const perfectDays = week.filter(day => day.isPerfectDay).length;
          const goodDays = week.filter(day => day.isGoodProgress).length;
          const someDays = week.filter(day => day.adaptiveIntensity === 'some').length;

          // Calculate intelligent weekly target based on month structure
          const startDate = parseDate(challenge.startDate);
          const endDate = parseDate(challenge.endDate);
          const monthTotalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const weekDays = week.length;

          // Calculate combined monthly target from all requirements
          const monthlyTarget = challenge.requirements.reduce((total, req) => total + req.target, 0);
          const weeklyTarget = (monthlyTarget * weekDays) / monthTotalDays;

          // Sum actual contributions for the week
          const weekActualProgress = week.reduce((sum, day) => {
            const dailyContributions = day.contributions || {};
            return sum + Object.values(dailyContributions).reduce((a, b) => a + b, 0);
          }, 0);

          // Calculate true completion percentage (can exceed 100%)
          const weekProgress = Math.round((weekActualProgress / weeklyTarget) * 100);

          return (
            <View key={weekIndex} style={styles.weekSummaryRow}>
              <Text style={styles.weekSummaryLabel}>{t('monthlyChallenge.calendar.week', { number: weekIndex + 1 })}</Text>
              <View style={styles.weekSummaryStats}>
                <Text style={styles.weekSummaryText}>
                  {weekDaysWithActivity}/{week.length} {t('monthlyChallenge.calendar.active')}
                </Text>
                <Text style={[styles.weekSummaryText, { color: categoryColor + '40' }]}>
                  {someDays} {t('monthlyChallenge.calendar.some')}
                </Text>
                <Text style={[styles.weekSummaryText, { color: categoryColor + '80' }]}>
                  {goodDays} {t('monthlyChallenge.calendar.good')}
                </Text>
                <Text style={[styles.weekSummaryText, { color: categoryColor }]}>
                  {perfectDays} {t('monthlyChallenge.calendar.perfect')}
                </Text>
                <Text style={styles.weekSummaryPercent}>
                  {weekProgress}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default MonthlyProgressCalendar;