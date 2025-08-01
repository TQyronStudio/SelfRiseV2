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
import { Colors } from '../../constants/colors';
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

const COLOR_MAP = {
  [HabitColor.RED]: Colors.habitRed,
  [HabitColor.BLUE]: Colors.habitBlue,
  [HabitColor.GREEN]: Colors.habitGreen,
  [HabitColor.YELLOW]: Colors.habitYellow,
  [HabitColor.PURPLE]: Colors.habitPurple,
  [HabitColor.ORANGE]: Colors.habitOrange,
  [HabitColor.PINK]: Colors.habitPink,
  [HabitColor.TEAL]: Colors.habitTeal,
};

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

const DAY_LABELS = {
  [DayOfWeek.MONDAY]: 'Mo',
  [DayOfWeek.TUESDAY]: 'Tu',
  [DayOfWeek.WEDNESDAY]: 'We',
  [DayOfWeek.THURSDAY]: 'Th',
  [DayOfWeek.FRIDAY]: 'Fr',
  [DayOfWeek.SATURDAY]: 'Sa',
  [DayOfWeek.SUNDAY]: 'Su',
};

export function HabitItem({ habit, onEdit, onDelete, onToggleActive, onReorder, onDrag, isDragging }: HabitItemProps) {
  const { t } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Detekce dnešního dne pro vizuální zvýraznění
  const todayDayOfWeek = getDayOfWeek(new Date());
  const isScheduledToday = habit.scheduledDays.includes(todayDayOfWeek);
  const isActiveHabit = habit.isActive;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(habit.id);
  };

  const handleToggleActive = () => {
    onToggleActive(habit.id, !habit.isActive);
  };

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
            color={Colors.textInverse}
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
                    {DAY_LABELS[day]}
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
            color={Colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(habit)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash" size={20} color={Colors.error} />
        </TouchableOpacity>

        {habit.isActive && (
          <TouchableOpacity
            style={[styles.actionButton, isDragging && styles.draggingActionButton]}
            onLongPress={onDrag}
            activeOpacity={0.7}
            delayLongPress={100}
          >
            <Ionicons name="reorder-three-outline" size={20} color={Colors.textSecondary} />
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inactiveContainer: {
    opacity: 0.6,
    backgroundColor: Colors.backgroundSecondary,
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
    color: Colors.text,
    marginBottom: 4,
  },
  inactiveName: {
    color: Colors.textTertiary,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inactiveDescription: {
    color: Colors.textTertiary,
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
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDayIndicator: {
    backgroundColor: Colors.primary,
  },
  inactiveDayIndicator: {
    backgroundColor: Colors.border,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  activeDayLabel: {
    color: Colors.textInverse,
  },
  inactiveDayLabel: {
    color: Colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  draggingContainer: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  draggingActionButton: {
    backgroundColor: Colors.primary,
  },
  // Styly pro dnešní zvýraznění
  todayScheduledContainer: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  todayScheduledDayIndicator: {
    borderWidth: 2,
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  todayUnscheduledDayIndicator: {
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: Colors.gold,
  },
  todayScheduledDayLabel: {
    color: Colors.textInverse,
    fontFamily: Fonts.bold,
  },
  todayUnscheduledDayLabel: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
});