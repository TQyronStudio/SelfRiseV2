import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabitsData } from '../../hooks/useHabitsData';
// useEnhancedGamification removed - XP handled by habitStorage
import { formatDateToString, getDayOfWeek, formatDateForDisplay } from '../../utils/date';
import { Habit, HabitCompletion } from '../../types/habit';
// XPSourceType removed - XP handled by habitStorage
import { XP_REWARDS } from '../../constants/gamification';
import { useTheme } from '../../contexts/ThemeContext';
import { Fonts } from '../../constants/fonts';

interface DailyHabitTrackerProps {
  date?: string; // Optional date, defaults to today
}

export const DailyHabitTracker: React.FC<DailyHabitTrackerProps> = ({
  date = formatDateToString(new Date())
}) => {
  const { colors } = useTheme();
  const { habits, completions, actions, isLoading } = useHabitsData();
  // addXP/subtractXP removed - XP handled by habitStorage
  const [completingHabit, setCompletingHabit] = useState<string | null>(null);
  
  // Filter active habits for the current date
  const activeHabits = habits.filter(habit => habit.isActive);
  
  // Get today's completions
  const todayCompletions = completions.filter(completion => 
    completion.date === date
  );
  
  // Get completion status for each habit
  const getHabitCompletion = (habitId: string): HabitCompletion | undefined => {
    return todayCompletions.find(completion => completion.habitId === habitId);
  };
  
  // Check if habit is scheduled for today
  const isScheduledToday = (habit: Habit): boolean => {
    const today = new Date(date);
    const dayOfWeek = getDayOfWeek(today);
    return habit.scheduledDays.includes(dayOfWeek);
  };
  
  // Handle habit completion toggle
  const handleToggleCompletion = async (habit: Habit) => {
    setCompletingHabit(habit.id);
    
    try {
      const currentCompletion = getHabitCompletion(habit.id);
      const isScheduled = isScheduledToday(habit);
      const isBonus = !isScheduled;
      
      const completion = await actions.toggleCompletion(habit.id, date, isBonus);
      
      // XP is now handled entirely by HabitStorage - no dual system
      console.log(`✅ Habit completion toggled successfully - XP handled by storage layer`);
      
      // Brief animation delay
      setTimeout(() => {
        setCompletingHabit(null);
      }, 200);
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
      setCompletingHabit(null);
    }
  };
  
  // Calculate daily progress
  const calculateDailyProgress = () => {
    const scheduledHabits = activeHabits.filter(habit => isScheduledToday(habit));
    const completedScheduledHabits = scheduledHabits.filter(habit => {
      const completion = getHabitCompletion(habit.id);
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
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    progressHeader: {
      padding: 20,
      backgroundColor: colors.cardBackgroundElevated,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    progressContainer: {
      marginBottom: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    habitsContainer: {
      padding: 20,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    habitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackgroundElevated,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    habitItemCompleted: {
      backgroundColor: colors.success + '10',
      borderColor: colors.success + '30',
    },
    habitItemAnimating: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    habitLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    habitIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    habitInfo: {
      flex: 1,
    },
    habitName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    habitNameCompleted: {
      color: colors.success,
    },
    habitDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bonusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    bonusText: {
      fontSize: 12,
      color: colors.primary,
      marginLeft: 4,
      fontWeight: '500',
    },
    scheduledText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    habitRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    starIndicator: {
      marginRight: 8,
    },
    completionButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.cardBackgroundElevated,
    },
    completionButtonCompleted: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    completionButtonAnimating: {
      opacity: 0.5,
    },
    completionCircle: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.border,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading habits...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Daily Progress Header */}
      <View style={styles.progressHeader}>
        <Text style={styles.dateText}>
          {formatDateForDisplay(date, 'long')}
        </Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${dailyProgress.percentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {dailyProgress.completed} of {dailyProgress.total} completed
          </Text>
        </View>
      </View>
      
      {/* Habits List */}
      <View style={styles.habitsContainer}>
        {activeHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyStateText}>No active habits</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first habit to start tracking!
            </Text>
          </View>
        ) : (
          activeHabits.map((habit) => {
            const completion = getHabitCompletion(habit.id);
            const isCompleted = completion?.completed || false;
            const isScheduled = isScheduledToday(habit);
            const isBonus = completion?.isBonus || false;
            const isAnimating = completingHabit === habit.id;

            return (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitItem,
                  isCompleted && styles.habitItemCompleted,
                  isAnimating && styles.habitItemAnimating,
                ]}
                onPress={() => handleToggleCompletion(habit)}
                disabled={isAnimating}
              >
                <View style={styles.habitLeft}>
                  {/* Habit Icon */}
                  <View style={[styles.habitIcon, { backgroundColor: habit.color }]}>
                    <Ionicons
                      name={habit.icon as any}
                      size={24}
                      color={colors.white}
                    />
                  </View>

                  {/* Habit Info */}
                  <View style={styles.habitInfo}>
                    <Text style={[
                      styles.habitName,
                      isCompleted && styles.habitNameCompleted
                    ]}>
                      {habit.name}
                    </Text>
                    <View style={styles.habitDetails}>
                      {!isScheduled && (
                        <View style={styles.bonusIndicator}>
                          <Ionicons name="star" size={12} color={colors.primary} />
                          <Text style={styles.bonusText}>Bonus</Text>
                        </View>
                      )}
                      {isScheduled && (
                        <Text style={styles.scheduledText}>Scheduled</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Completion Button */}
                <View style={styles.habitRight}>
                  {isBonus && (
                    <View style={styles.starIndicator}>
                      <Ionicons name="star" size={16} color={colors.primary} />
                    </View>
                  )}
                  <View style={[
                    styles.completionButton,
                    isCompleted && styles.completionButtonCompleted,
                    isAnimating && styles.completionButtonAnimating,
                  ]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={18} color={colors.white} />
                    ) : (
                      <View style={styles.completionCircle} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};