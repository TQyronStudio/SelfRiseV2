import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitCompletion } from '../../types/habit';
import { Fonts } from '../../constants/fonts';
import { useHabitsData } from '../../hooks/useHabitsData';
import { formatDateToString, getDayOfWeek, parseDate } from '../../utils/date';
import { DayOfWeek } from '../../types/common';
import { wasScheduledOnDate } from '../../utils/habitImmutability';
import { HelpTooltip } from '../common/HelpTooltip';
import { useTheme } from '../../contexts/ThemeContext';

interface HabitCalendarViewProps {
  habit: Habit;
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function HabitCalendarView({
  habit,
  currentDate,
  onPrevMonth,
  onNextMonth
}: HabitCalendarViewProps) {
  const { colors } = useTheme();
  const { getHabitCompletionsWithConversion } = useHabitsData();

  // Get month info
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Adjust for Monday start (convert JS Sunday=0 to Monday=0 system)
  // JS: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  // Our headers: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  const mondayStartOffset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  // Get completions for this month (with smart conversion applied)
  const allCompletions = getHabitCompletionsWithConversion(habit.id);
  const monthCompletions = allCompletions.filter(completion => {
    const completionDate = parseDate(completion.date);
    return completionDate.getFullYear() === year && completionDate.getMonth() === month;
  });

  const getCompletionForDay = (day: number): HabitCompletion | undefined => {
    const dateString = formatDateToString(new Date(year, month, day));
    return monthCompletions.find(c => c.date === dateString);
  };

  const isScheduledDay = (day: number): boolean => {
    const date = new Date(year, month, day);
    const dateString = formatDateToString(date);
    const dayOfWeek = getDayOfWeek(date);
    // IMMUTABILITY PRINCIPLE: Use historical scheduled days for calendar display
    return wasScheduledOnDate(habit, dateString, dayOfWeek);
  };

  const isHabitExisting = (day: number): boolean => {
    const date = new Date(year, month, day);
    const dateString = formatDateToString(date);
    const createdAt = habit.createdAt instanceof Date ? habit.createdAt : new Date(habit.createdAt);
    const creationDateString = formatDateToString(createdAt);
    return dateString >= creationDateString;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 8,
    },
    navButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardBackgroundElevated,
    },
    monthTitle: {
      fontSize: 18,
      fontFamily: Fonts.bold,
      color: colors.text,
    },
    dayHeaders: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    dayHeader: {
      flex: 1,
      textAlign: 'center',
      fontSize: 12,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
      paddingVertical: 8,
    },
    calendar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 8,
    },
    emptyDay: {
      width: '14.28%',
      aspectRatio: 1,
      padding: 1,
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      padding: 1,
    },
    dayCellInner: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      borderRadius: 8,
      backgroundColor: colors.cardBackgroundElevated,
    },
    todayCell: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    completedDay: {
      backgroundColor: colors.success,
    },
    bonusDay: {
      backgroundColor: colors.warning,
    },
    missedDay: {
      backgroundColor: colors.error,
    },
    makeupDay: {
      backgroundColor: colors.success,
    },
    dayText: {
      fontSize: 14,
      fontFamily: Fonts.medium,
      color: colors.text,
    },
    todayText: {
      color: colors.primary,
      fontFamily: Fonts.bold,
    },
    completedText: {
      color: colors.textInverse,
      fontFamily: Fonts.bold,
    },
    bonusIndicator: {
      position: 'absolute',
      top: 2,
      right: 2,
    },
    makeupIndicator: {
      position: 'absolute',
      bottom: 1,
      left: '50%',
      marginLeft: -7,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: 8,
      width: 14,
      height: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scheduledIndicator: {
      position: 'absolute',
      bottom: 2,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    legend: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      marginTop: 16,
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      marginHorizontal: 8,
    },
    legendTitle: {
      fontSize: 14,
      fontFamily: Fonts.bold,
      color: colors.text,
      marginBottom: 8,
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 8,
    },
    legendItems: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      gap: 4,
    },
    legendBox: {
      width: 16,
      height: 16,
      borderRadius: 4,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 4,
    },
    legendGoldCheck: {
      width: 12,
      height: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
    },
    legendCheckmark: {
      fontSize: 10,
      color: colors.warning,
      fontWeight: '900',
      lineHeight: 12,
    },
    legendText: {
      fontSize: 11,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
      marginLeft: 4,
    },
  });

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first day of month
  for (let i = 0; i < mondayStartOffset; i++) {
    calendarDays.push(
      <View key={`empty-${i}`} style={styles.emptyDay} />
    );
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const completion = getCompletionForDay(day);
    const isCompleted = completion?.completed || false;
    const isBonus = completion?.isBonus || false;
    const isConverted = completion?.isConverted || false;
    const isScheduled = isScheduledDay(day);
    const habitExisted = isHabitExisting(day);
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
    const dayDate = new Date(year, month, day);
    const isPastDay = dayDate < new Date() && !isToday; // Only past days, not today or future

    // Determine display type for smart conversion
    const isMakeupCompletion = isCompleted && isConverted && !isBonus && completion?.convertedFromDate; // Bonus converted to makeup
    const isRegularBonus = isCompleted && isBonus && !isConverted; // Real bonus (not converted)
    const isScheduledCompletion = isCompleted && isScheduled && !isBonus && !isConverted; // Normal scheduled completion
    const isCoveredMissed = !isCompleted && isScheduled && completion?.isCovered; // Missed day covered by makeup
    
    calendarDays.push(
      <View key={day} style={styles.dayCell}>
        <View style={[
          styles.dayCellInner,
          isToday && styles.todayCell,
          isScheduledCompletion && styles.completedDay, // Green for normal scheduled
          isMakeupCompletion && styles.makeupDay, // Green for makeup (converted bonus)
          isRegularBonus && styles.bonusDay, // Gold for real bonus
          isScheduled && !isCompleted && !isCoveredMissed && habitExisted && isPastDay && styles.missedDay,
        ]}>
          <Text style={[
            styles.dayText,
            isToday && styles.todayText,
            (isScheduledCompletion || isMakeupCompletion) && styles.completedText,
          ]}>
            {day}
          </Text>
          {isRegularBonus && (
            <View style={styles.bonusIndicator}>
              <Ionicons name="star" size={8} color={colors.warning} />
            </View>
          )}
          {isMakeupCompletion && (
            <View style={styles.makeupIndicator}>
              <Ionicons name="checkmark" size={14} color={colors.warning} />
            </View>
          )}
          {/* Show scheduled indicator for scheduled days (but not for makeup completions) */}
          {isScheduled && habitExisted && (!isMakeupCompletion || isCoveredMissed) && (
            <View style={styles.scheduledIndicator} />
          )}
        </View>
      </View>
    );
  }

  const dayHeaders = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={onPrevMonth}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.monthTitle}>{monthName}</Text>

        <TouchableOpacity style={styles.navButton} onPress={onNextMonth}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {dayHeaders.map((day) => (
          <Text key={day} style={styles.dayHeader}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {calendarDays}
      </View>

      {/* Legend - 2 rows */}
      <View style={styles.legend}>
        {/* First row */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Scheduled</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>

        {/* Second row */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={styles.legendGoldCheck}>
              <Text style={styles.legendCheckmark}>✓</Text>
            </View>
            <Text style={styles.legendText}>Makeup</Text>
            <HelpTooltip
              helpKey="habits.makeupFunction"
              iconSize={12}
              maxWidth={300}
              variant="default"
            />
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Bonus</Text>
          </View>
        </View>
      </View>
    </View>
  );
}