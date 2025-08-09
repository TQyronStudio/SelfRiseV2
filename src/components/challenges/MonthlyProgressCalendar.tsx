// Monthly Progress Calendar Component
// Visual calendar showing daily contributions and milestones for monthly challenges
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { 
  MonthlyChallenge, 
  MonthlyChallengeProgress, 
  AchievementCategory 
} from '../../types/gamification';
import { addDays, parseDate, formatDateToString } from '../../utils/date';

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
  isTripleFeatureDay: boolean;
  isPerfectDay: boolean;
  isMilestone: boolean;
  milestonePercentage?: number;
  hasActivity: boolean;
  isToday: boolean;
  isFuture: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const MonthlyProgressCalendar: React.FC<MonthlyProgressCalendarProps> = ({
  challenge,
  progress,
  compact = false
}) => {
  const getCategoryColor = (category: AchievementCategory) => {
    switch (category) {
      case 'habits': return '#22C55E';
      case 'journal': return '#3B82F6';
      case 'goals': return '#F59E0B';
      case 'consistency': return '#8B5CF6';
      case 'mastery': return '#EF4444';
      case 'social': return '#06B6D4';
      case 'special': return '#EC4899';
      default: return '#6B7280';
    }
  };

  const categoryColor = getCategoryColor(challenge.category);

  // Generate calendar data for the month
  const calendarData = useMemo(() => {
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

      // Get daily contributions from progress
      const weekKey = `week${weekNumber}` as keyof typeof progress.weeklyProgress;
      const weeklyData = progress.weeklyProgress[weekKey] || {};
      const dailyContributions = Object.keys(weeklyData).reduce((acc, key) => {
        // Calculate contribution for this specific day
        const dailyValue = Math.floor((weeklyData[key] || 0) / 7); // Rough daily estimate
        acc[key] = dailyValue;
        return acc;
      }, {} as Record<string, number>);

      // Determine activity levels
      const totalContributions = Object.values(dailyContributions).reduce((sum, val) => sum + val, 0);
      const hasActivity = totalContributions > 0;
      const isTripleFeatureDay = Object.keys(dailyContributions).length >= 3;
      const isPerfectDay = hasActivity && Object.values(dailyContributions).every(val => val > 0);

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
        isTripleFeatureDay,
        isPerfectDay,
        isMilestone,
        ...(milestonePercentage !== undefined && { milestonePercentage }),
        hasActivity,
        isToday: dateString === formatDateToString(today),
        isFuture: currentDate > today
      });

      currentDate = new Date(addDays(currentDate, 1));
    }

    return days;
  }, [challenge, progress]);

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

  const getActivityIntensity = (day: DayData): 'none' | 'low' | 'medium' | 'high' => {
    if (!day.hasActivity) return 'none';
    
    const totalContributions = Object.values(day.contributions).reduce((sum, val) => sum + val, 0);
    
    if (day.isPerfectDay) return 'high';
    if (day.isTripleFeatureDay) return 'medium';
    if (totalContributions > 0) return 'low';
    
    return 'none';
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
      case 'high':
        baseStyles.push(styles.highActivityDay);
        baseStyles.push({ backgroundColor: categoryColor });
        break;
      case 'medium':
        baseStyles.push(styles.mediumActivityDay);
        baseStyles.push({ backgroundColor: categoryColor + '80' });
        break;
      case 'low':
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
    if (intensity === 'high' || intensity === 'medium') {
      return styles.activeDayText;
    }
    
    return styles.defaultDayText;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactTitle}>Daily Progress</Text>
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
        <Text style={styles.title}>Monthly Progress Calendar</Text>
        <Text style={styles.subtitle}>
          {new Date(challenge.startDate).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.noActivityDay]} />
          <Text style={styles.legendText}>No Activity</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.lowActivityDay, { backgroundColor: categoryColor + '40' }]} />
          <Text style={styles.legendText}>Some Activity</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.mediumActivityDay, { backgroundColor: categoryColor + '80' }]} />
          <Text style={styles.legendText}>Good Progress</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.highActivityDay, { backgroundColor: categoryColor }]} />
          <Text style={styles.legendText}>Perfect Day</Text>
        </View>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {/* Week headers */}
        <View style={styles.weekHeader}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <Text key={day} style={styles.weekHeaderText}>{day}</Text>
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

      {/* Weekly summary */}
      <View style={styles.weeklySummary}>
        <Text style={styles.weeklySummaryTitle}>Weekly Breakdown</Text>
        {weekGroups.map((week, weekIndex) => {
          const weekDaysWithActivity = week.filter(day => day.hasActivity).length;
          const perfectDays = week.filter(day => day.isPerfectDay).length;
          const weekProgress = (weekDaysWithActivity / week.length) * 100;

          return (
            <View key={weekIndex} style={styles.weekSummaryRow}>
              <Text style={styles.weekSummaryLabel}>Week {weekIndex + 1}</Text>
              <View style={styles.weekSummaryStats}>
                <Text style={styles.weekSummaryText}>
                  {weekDaysWithActivity}/{week.length} active
                </Text>
                <Text style={[styles.weekSummaryText, { color: categoryColor }]}>
                  {perfectDays} perfect
                </Text>
                <Text style={styles.weekSummaryPercent}>
                  {Math.round(weekProgress)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#6B7280',
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
    color: '#9CA3AF',
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
    color: '#9CA3AF',
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
    backgroundColor: '#F3F4F6',
  },
  lowActivityDay: {
    backgroundColor: '#E5E7EB', // Will be overridden with category color + alpha
  },
  mediumActivityDay: {
    backgroundColor: '#D1D5DB', // Will be overridden with category color + alpha
  },
  highActivityDay: {
    backgroundColor: '#6B7280', // Will be overridden with category color
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  futureDay: {
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  milestoneDay: {
    borderWidth: 2,
    // borderColor will be set dynamically
  },
  defaultDayText: {
    fontSize: 11,
    color: '#4B5563',
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
    color: '#D1D5DB',
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
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  weeklySummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
    color: '#6B7280',
    fontWeight: '500',
  },
  weekSummaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekSummaryText: {
    fontSize: 11,
    color: '#6B7280',
  },
  weekSummaryPercent: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },

  // Compact styles
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  compactCalendar: {
    gap: 3,
    paddingHorizontal: 2,
  },
});

export default MonthlyProgressCalendar;