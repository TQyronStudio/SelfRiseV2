import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useHabitsData } from '../../hooks/useHabitsData';
import { Colors } from '../../constants/colors';
import { formatDateToString, getDayOfWeek, formatDateForDisplay } from '../../utils/date';
import { Habit } from '../../types/habit';

interface DailyHabitProgressProps {
  date?: string;
}

export const DailyHabitProgress: React.FC<DailyHabitProgressProps> = ({ 
  date = formatDateToString(new Date()) 
}) => {
  const { habits, completions } = useHabitsData();
  
  // Filter active habits
  const activeHabits = habits.filter(habit => habit.isActive);
  
  // Get today's completions
  const todayCompletions = completions.filter(completion => 
    completion.date === date
  );
  
  // Check if habit is scheduled for today
  const isScheduledToday = (habit: Habit): boolean => {
    const today = new Date(date);
    const dayOfWeek = getDayOfWeek(today);
    return habit.scheduledDays.includes(dayOfWeek);
  };
  
  // Calculate daily progress
  const calculateDailyProgress = () => {
    const scheduledHabits = activeHabits.filter(habit => isScheduledToday(habit));
    const completedScheduledHabits = scheduledHabits.filter(habit => {
      const completion = todayCompletions.find(c => c.habitId === habit.id);
      return completion?.completed;
    });
    
    return {
      completed: completedScheduledHabits.length,
      total: scheduledHabits.length,
      percentage: scheduledHabits.length > 0 
        ? (completedScheduledHabits.length / scheduledHabits.length) * 100 
        : 0
    };
  };
  
  const dailyProgress = calculateDailyProgress();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>
          {formatDateForDisplay(date, 'long')}
        </Text>
        <Text style={styles.progressText}>
          {dailyProgress.completed} of {dailyProgress.total} completed
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${dailyProgress.percentage}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
});