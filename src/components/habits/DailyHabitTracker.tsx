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
import { useGamification } from '../../contexts/GamificationContext';
import { Colors } from '../../constants/colors';
import { formatDateToString, getDayOfWeek, formatDateForDisplay } from '../../utils/date';
import { Habit, HabitCompletion } from '../../types/habit';
import { XPSourceType } from '../../types/gamification';
import { XP_REWARDS } from '../../constants/gamification';

interface DailyHabitTrackerProps {
  date?: string; // Optional date, defaults to today
}

export const DailyHabitTracker: React.FC<DailyHabitTrackerProps> = ({ 
  date = formatDateToString(new Date()) 
}) => {
  const { habits, completions, actions, isLoading } = useHabitsData();
  const { addXP, subtractXP } = useGamification();
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
      
      // Handle XP changes based on completion state
      const xpAmount = isBonus ? XP_REWARDS.HABIT.BONUS_COMPLETION : XP_REWARDS.HABIT.SCHEDULED_COMPLETION;
      const xpSource = isBonus ? XPSourceType.HABIT_BONUS : XPSourceType.HABIT_COMPLETION;
      
      if (completion && !currentCompletion) {
        // Habit was completed - award XP
        const description = isBonus ? 
          `Completed bonus habit: ${habit.name}` : 
          `Completed scheduled habit: ${habit.name}`;

        console.log(`🚀 Real-time XP: Awarding ${xpAmount} XP for ${xpSource}`);
        await addXP(xpAmount, { source: xpSource, description });
      } else if (!completion && currentCompletion) {
        // Habit was uncompleted - deduct XP
        const description = isBonus ? 
          `Uncompleted bonus habit: ${habit.name}` : 
          `Uncompleted scheduled habit: ${habit.name}`;

        console.log(`🚀 Real-time XP: Deducting ${xpAmount} XP for ${xpSource}`);
        await subtractXP(xpAmount, { source: xpSource, description });
      }
      
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
            <Ionicons name="leaf-outline" size={48} color={Colors.textTertiary} />
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
                      color="white" 
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
                          <Ionicons name="star" size={12} color={Colors.primary} />
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
                      <Ionicons name="star" size={16} color={Colors.primary} />
                    </View>
                  )}
                  <View style={[
                    styles.completionButton,
                    isCompleted && styles.completionButtonCompleted,
                    isAnimating && styles.completionButtonAnimating,
                  ]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={18} color="white" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  progressHeader: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    color: Colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  habitItemCompleted: {
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success + '30',
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
    color: Colors.text,
    marginBottom: 4,
  },
  habitNameCompleted: {
    color: Colors.success,
  },
  habitDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bonusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  bonusText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  scheduledText: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    borderColor: Colors.border,
    backgroundColor: 'white',
  },
  completionButtonCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  completionButtonAnimating: {
    opacity: 0.5,
  },
  completionCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
});