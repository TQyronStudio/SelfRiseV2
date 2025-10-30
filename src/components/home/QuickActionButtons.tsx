import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout, Typography } from '@/src/constants';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { today, getDayOfWeekFromDateString } from '@/src/utils/date';
import { wasScheduledOnDate } from '@/src/utils/habitImmutability';
import { HabitColor, HabitIcon } from '@/src/types/common';
import { useTutorialTarget } from '@/src/utils/TutorialTargetHelper';

interface QuickActionButtonsProps {
  onHabitToggle?: (habitId: string) => void;
}

// Icon mapping for habits
const ICON_MAP = {
  [HabitIcon.FITNESS]: 'fitness-outline',
  [HabitIcon.BOOK]: 'book-outline',
  [HabitIcon.WATER]: 'water-outline',
  [HabitIcon.MEDITATION]: 'leaf-outline',
  [HabitIcon.MUSIC]: 'musical-notes-outline',
  [HabitIcon.FOOD]: 'restaurant-outline',
  [HabitIcon.SLEEP]: 'bed-outline',
  [HabitIcon.HEALTH]: 'heart-outline',
  [HabitIcon.WORK]: 'briefcase-outline',
  [HabitIcon.SOCIAL]: 'people-outline',
  [HabitIcon.CREATIVE]: 'color-palette-outline',
  [HabitIcon.LEARNING]: 'school-outline',
  [HabitIcon.FINANCE]: 'card-outline',
  [HabitIcon.HOME]: 'home-outline',
} as const;

export function QuickActionButtons({ onHabitToggle }: QuickActionButtonsProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { getHabitsByDate } = useHabitsData();

  // Color mapping for habits (moved inside component to access theme colors)
  const COLOR_MAP = {
    [HabitColor.RED]: colors.habitRed,
    [HabitColor.BLUE]: colors.habitBlue,
    [HabitColor.GREEN]: colors.habitGreen,
    [HabitColor.YELLOW]: colors.habitYellow,
    [HabitColor.PURPLE]: colors.habitPurple,
    [HabitColor.ORANGE]: colors.habitOrange,
    [HabitColor.PINK]: colors.habitPink,
    [HabitColor.TEAL]: colors.habitTeal,
  };

  // Tutorial targeting
  const quickActionsRef = useRef<View>(null);
  const addHabitRef = useRef<View>(null);

  const { registerTarget: registerQuickActions, unregisterTarget: unregisterQuickActions } = useTutorialTarget(
    'quick-actions-section',
    quickActionsRef
  );

  const { registerTarget: registerAddHabit, unregisterTarget: unregisterAddHabit } = useTutorialTarget(
    'add-habit-button',
    addHabitRef
  );

  useEffect(() => {
    registerQuickActions();
    registerAddHabit();

    return () => {
      unregisterQuickActions();
      unregisterAddHabit();
    };
  }, [registerQuickActions, unregisterQuickActions, registerAddHabit, unregisterAddHabit]);

  const todayString = today();
  const todayHabits = getHabitsByDate(todayString);
  const todayDayOfWeek = getDayOfWeekFromDateString(todayString);
  
  // Filter habits scheduled for today that aren't completed yet
  // IMMUTABILITY PRINCIPLE: Use historical schedule even for today
  const pendingTodayHabits = todayHabits.filter(habit => {
    const isScheduledToday = wasScheduledOnDate(habit, todayString, todayDayOfWeek);
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

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginHorizontal: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    title: {
      ...Typography.subheading,
      color: colors.text,
      marginBottom: Layout.spacing.sm,
    },
    subtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
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
      backgroundColor: colors.cardBackgroundElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionText: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Layout.spacing.xs,
      textAlign: 'center',
      fontSize: 10,
      fontWeight: '600',
    },
    habitTogglesContainer: {
      marginTop: Layout.spacing.sm,
      paddingTop: Layout.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
    habitName: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 10,
    },
  });

  return (
    <View ref={quickActionsRef} style={styles.container} nativeID="quick-actions-section">
      <Text style={styles.title}>{t('home.quickActions')}</Text>

      <View style={styles.actionsRow}>
        {/* Main Action Buttons */}
        <View ref={addHabitRef} nativeID="add-habit-button">
          <TouchableOpacity style={styles.actionButton} onPress={handleAddHabit}>
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Add Habit</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleAddGratitude}>
          <Ionicons name="heart" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Gratitude</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleAddSelfPraise}>
          <Ionicons name="star" size={20} color={colors.success} />
          <Text style={styles.actionText}>Self-Praise</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleAddGoal}>
          <Ionicons name="flag" size={20} color={colors.secondary} />
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
                style={[styles.habitToggle, { backgroundColor: COLOR_MAP[habit.color] + '20' }]}
                onPress={() => handleHabitQuickToggle(habit.id)}
              >
                <View style={[styles.symbolCircle, { backgroundColor: COLOR_MAP[habit.color] }]}>
                  <Ionicons
                    name={ICON_MAP[habit.icon] as any}
                    size={16}
                    color={colors.textInverse}
                  />
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