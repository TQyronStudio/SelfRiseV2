import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitCompletion } from '../../types/habit';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useHabitsData } from '../../hooks/useHabitsData';
import { formatDateToString, getDayOfWeek } from '../../utils/date';
import { DayOfWeek } from '../../types/common';

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
  const { completions } = useHabitsData();
  
  // Get month info
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const mondayStartOffset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  
  // Get completions for this month
  const monthCompletions = completions.filter(completion => {
    if (completion.habitId !== habit.id) return false;
    const completionDate = new Date(completion.date);
    return completionDate.getFullYear() === year && completionDate.getMonth() === month;
  });
  
  const getCompletionForDay = (day: number): HabitCompletion | undefined => {
    const dateString = formatDateToString(new Date(year, month, day));
    return monthCompletions.find(c => c.date === dateString);
  };
  
  const isScheduledDay = (day: number): boolean => {
    const date = new Date(year, month, day);
    const dayOfWeek = getDayOfWeek(date);
    return habit.scheduledDays.includes(dayOfWeek);
  };

  const isHabitExisting = (day: number): boolean => {
    const date = new Date(year, month, day);
    const dateString = formatDateToString(date);
    const createdAt = habit.createdAt instanceof Date ? habit.createdAt : new Date(habit.createdAt);
    const creationDateString = formatDateToString(createdAt);
    return dateString >= creationDateString;
  };
  
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
    const isScheduled = isScheduledDay(day);
    const habitExisted = isHabitExisting(day);
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
    
    calendarDays.push(
      <View key={day} style={[
        styles.dayCell,
        isToday && styles.todayCell,
        isCompleted && isScheduled && styles.completedDay,
        isCompleted && isBonus && styles.bonusDay,
      ]}>
        <Text style={[
          styles.dayText,
          isToday && styles.todayText,
          isCompleted && styles.completedText,
        ]}>
          {day}
        </Text>
        {isCompleted && isBonus && (
          <View style={styles.bonusIndicator}>
            <Ionicons name="star" size={8} color={Colors.warning} />
          </View>
        )}
        {isScheduled && !isCompleted && habitExisted && (
          <View style={styles.scheduledIndicator} />
        )}
      </View>
    );
  }
  
  const dayHeaders = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  
  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={onPrevMonth}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>{monthName}</Text>
        
        <TouchableOpacity style={styles.navButton} onPress={onNextMonth}>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
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
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Scheduled</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
          <Text style={styles.legendText}>Bonus</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.backgroundSecondary,
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
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
    color: Colors.textSecondary,
    paddingVertical: 8,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  emptyDay: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: 1,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  completedDay: {
    backgroundColor: Colors.success,
  },
  bonusDay: {
    backgroundColor: Colors.warning,
  },
  dayText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  todayText: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
  completedText: {
    color: Colors.textInverse,
    fontFamily: Fonts.bold,
  },
  bonusIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  scheduledIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
});