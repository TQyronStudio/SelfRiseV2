import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habit';
import { HabitColor, HabitIcon, DayOfWeek } from '../../types/common';
import { useTheme } from '../../contexts/ThemeContext';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { ConfirmationModal } from '@/src/components/common';
import { getDayOfWeek } from '../../utils/date';

interface HabitItemProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onToggleActive: (habitId: string, isActive: boolean) => void;
  onReorder: (habitOrders: Array<{ id: string; order: number }>) => void;
  onDrag?: (() => void) | undefined;
  isDragging?: boolean;
}

const ICON_MAP = {
  [HabitIcon.FITNESS]: 'fitness-outline',
  [HabitIcon.BOOK]: 'book-outline',
  [HabitIcon.WATER]: 'water-outline',
  [HabitIcon.MEDITATION]: 'leaf-outline',
  [HabitIcon.MUSIC]: 'musical-notes-outline',
  [HabitIcon.FOOD]: 'restaurant-outline',
  [HabitIcon.SLEEP]: 'moon-outline',
  [HabitIcon.WORK]: 'briefcase-outline',
  [HabitIcon.HEALTH]: 'heart-outline',
  [HabitIcon.SOCIAL]: 'people-outline',
  [HabitIcon.CREATIVE]: 'color-palette-outline',
  [HabitIcon.LEARNING]: 'school-outline',
  [HabitIcon.FINANCE]: 'card-outline',
  [HabitIcon.HOME]: 'home-outline',
} as const;

// Day labels are now handled dynamically via i18n
const getDayLabel = (day: DayOfWeek, t: (key: string) => string): string => {
  const dayMap = {
    [DayOfWeek.MONDAY]: 'days.shortest.monday',
    [DayOfWeek.TUESDAY]: 'days.shortest.tuesday',
    [DayOfWeek.WEDNESDAY]: 'days.shortest.wednesday',
    [DayOfWeek.THURSDAY]: 'days.shortest.thursday',
    [DayOfWeek.FRIDAY]: 'days.shortest.friday',
    [DayOfWeek.SATURDAY]: 'days.shortest.saturday',
    [DayOfWeek.SUNDAY]: 'days.shortest.sunday',
  };
  return t(dayMap[day]);
};

export function HabitItem({ habit, onEdit, onDelete, onToggleActive, onReorder, onDrag, isDragging }: HabitItemProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Detekce dnešního dne pro vizuální zvýraznění
  const todayDayOfWeek = getDayOfWeek(new Date());
  const isScheduledToday = habit.scheduledDays.includes(todayDayOfWeek);
  const isActiveHabit = habit.isActive;

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

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(habit.id);
  };

  const handleToggleActive = () => {
    onToggleActive(habit.id, !habit.isActive);
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    inactiveContainer: {
      opacity: 0.6,
      backgroundColor: colors.cardBackground,
    },
    mainContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    contentContainer: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginBottom: 4,
    },
    inactiveName: {
      color: colors.textTertiary,
    },
    description: {
      fontSize: 14,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    inactiveDescription: {
      color: colors.textTertiary,
    },
    daysContainer: {
      flexDirection: 'row',
      gap: 4,
      flexWrap: 'wrap',
      marginRight: 8,
    },
    dayIndicator: {
      width: 28,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.cardBackgroundElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeDayIndicator: {
      backgroundColor: colors.primary,
    },
    inactiveDayIndicator: {
      backgroundColor: colors.border,
    },
    dayLabel: {
      fontSize: 10,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
    },
    activeDayLabel: {
      color: colors.textInverse,
    },
    inactiveDayLabel: {
      color: colors.textTertiary,
    },
    actions: {
      flexDirection: 'row',
      marginLeft: 12,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardBackgroundElevated,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    draggingContainer: {
      opacity: 0.8,
      transform: [{ scale: 1.02 }],
    },
    draggingActionButton: {
      backgroundColor: colors.primary,
    },
    todayScheduledContainer: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    todayScheduledDayIndicator: {
      borderWidth: 2,
      borderColor: colors.success,
      backgroundColor: colors.success,
    },
    todayUnscheduledDayIndicator: {
      borderWidth: 2,
      borderColor: colors.gold,
      backgroundColor: colors.gold,
    },
    todayScheduledDayLabel: {
      color: colors.textInverse,
      fontFamily: Fonts.bold,
    },
    todayUnscheduledDayLabel: {
      color: colors.text,
      fontFamily: Fonts.bold,
    },
  });

  const containerStyle = [
    styles.container,
    !habit.isActive && styles.inactiveContainer,
    isDragging && styles.draggingContainer,
    // Modrý rámeček pro návyky naplánované na dnešek (pouze aktivní návyky)
    isActiveHabit && isScheduledToday && styles.todayScheduledContainer,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.mainContent}>
        <View style={[styles.iconContainer, { backgroundColor: COLOR_MAP[habit.color] }]}>
          <Ionicons
            name={ICON_MAP[habit.icon] as any}
            size={24}
            color={colors.white}
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.name, !habit.isActive && styles.inactiveName]}>
            {habit.name}
          </Text>
          
          {habit.description && (
            <Text style={[styles.description, !habit.isActive && styles.inactiveDescription]}>
              {habit.description}
            </Text>
          )}

          <View style={styles.daysContainer}>
            {Object.values(DayOfWeek).map((day) => {
              const isToday = day === todayDayOfWeek;
              const isScheduledDay = habit.scheduledDays.includes(day);
              const isTodayScheduled = isToday && isScheduledDay;
              const isTodayUnscheduled = isToday && !isScheduledDay && isActiveHabit;
              
              return (
                <View
                  key={day}
                  style={[
                    styles.dayIndicator,
                    isScheduledDay && styles.activeDayIndicator,
                    !habit.isActive && styles.inactiveDayIndicator,
                    // Zelený kroužek pro dnešek naplánovaný
                    isTodayScheduled && styles.todayScheduledDayIndicator,
                    // Zlatý kroužek pro dnešek nenaplánovaný (bonusová příležitost)
                    isTodayUnscheduled && styles.todayUnscheduledDayIndicator,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      isScheduledDay && styles.activeDayLabel,
                      !habit.isActive && styles.inactiveDayLabel,
                      // Text styling pro dnešní den
                      isTodayScheduled && styles.todayScheduledDayLabel,
                      isTodayUnscheduled && styles.todayUnscheduledDayLabel,
                    ]}
                  >
                    {getDayLabel(day, t)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleActive}
          activeOpacity={0.7}
        >
          <Ionicons
            name={habit.isActive ? 'pause' : 'play'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(habit)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash" size={20} color={colors.error} />
        </TouchableOpacity>

        {habit.isActive && (
          <TouchableOpacity
            style={[styles.actionButton, isDragging && styles.draggingActionButton]}
            onLongPress={onDrag}
            activeOpacity={0.7}
            delayLongPress={100}
          >
            <Ionicons name="reorder-three-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      <ConfirmationModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title={t('habits.confirmDelete')}
        message={t('habits.deleteMessage')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        emoji="🗑️"
      />
    </View>
  );
}