import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useHabitsData } from '../../hooks/useHabitsData';
import { formatDateToString, getDayOfWeek, formatDateForDisplay } from '../../utils/date';
import { Habit } from '../../types/habit';
import { useTheme } from '../../contexts/ThemeContext';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';

interface DailyHabitProgressProps {
  date?: string;
}

export const DailyHabitProgress: React.FC<DailyHabitProgressProps> = ({
  date = formatDateToString(new Date())
}) => {
  const { t } = useI18n();
  const { colors } = useTheme();
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

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      color: colors.text,
    },
    progressText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    progressBarContainer: {
      marginTop: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>
          {formatDateForDisplay(date, 'long')}
        </Text>
        <Text style={styles.progressText}>
          {t('common.completed', { completed: dailyProgress.completed, total: dailyProgress.total })}
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