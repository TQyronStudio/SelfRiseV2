import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout, Typography } from '@/src/constants';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { today, getDayOfWeekFromDateString } from '@/src/utils/date';

interface QuickActionButtonsProps {
  onHabitToggle?: (habitId: string) => void;
}

export function QuickActionButtons({ onHabitToggle }: QuickActionButtonsProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { getHabitsByDate } = useHabitsData();

  const todayString = today();
  const todayHabits = getHabitsByDate(todayString);
  const todayDayOfWeek = getDayOfWeekFromDateString(todayString);
  
  // Filter habits scheduled for today that aren't completed yet
  const pendingTodayHabits = todayHabits.filter(habit => {
    const isScheduledToday = habit.scheduledDays.includes(todayDayOfWeek);
    return isScheduledToday && !habit.isCompleted;
  }).slice(0, 3); // Limit to 3 for space

  const handleAddHabit = () => {
    router.push('/(tabs)/habits?quickAction=addHabit');
  };

  const handleAddGratitude = () => {
    router.push('/(tabs)/journal?quickAction=addGratitude');
  };

  const handleAddSelfPraise = () => {
    router.push('/(tabs)/journal?quickAction=addSelfPraise');
  };

  const handleAddGoal = () => {
    router.push('/(tabs)/goals?quickAction=addGoal');
  };

  const handleHabitQuickToggle = (habitId: string) => {
    onHabitToggle?.(habitId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.quickActions')}</Text>
      
      <View style={styles.actionsRow}>
        {/* Main Action Buttons */}
        <TouchableOpacity style={styles.actionButton} onPress={handleAddHabit}>
          <Ionicons name="add-circle" size={20} color={Colors.primary} />
          <Text style={styles.actionText}>Add Habit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleAddGratitude}>
          <Ionicons name="heart" size={20} color={Colors.primary} />
          <Text style={styles.actionText}>Gratitude</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleAddSelfPraise}>
          <Ionicons name="star" size={20} color={Colors.success} />
          <Text style={styles.actionText}>Self-Praise</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleAddGoal}>
          <Ionicons name="flag" size={20} color={Colors.secondary} />
          <Text style={styles.actionText}>Add Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Habit Toggles */}
      {pendingTodayHabits.length > 0 && (
        <View style={styles.habitTogglesContainer}>
          <Text style={styles.subtitle}>{t('home.todayHabits')}</Text>
          <View style={styles.habitTogglesRow}>
            {pendingTodayHabits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[styles.habitToggle, { backgroundColor: habit.color + '20' }]}
                onPress={() => handleHabitQuickToggle(habit.id)}
              >
                <View style={[styles.symbolCircle, { backgroundColor: habit.color }]}>
                  <Text style={styles.symbolText}>{habit.symbol}</Text>
                </View>
                <Text style={styles.habitName} numberOfLines={1}>
                  {habit.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    ...Typography.subheading,
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.xs,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.background + '80',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
  },
  habitTogglesContainer: {
    marginTop: Layout.spacing.sm,
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  habitTogglesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  habitToggle: {
    alignItems: 'center',
    padding: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    minWidth: 70,
    maxWidth: 90,
  },
  symbolCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.xs,
  },
  symbolText: {
    fontSize: 16,
    color: Colors.white,
  },
  habitName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 10,
  },
});