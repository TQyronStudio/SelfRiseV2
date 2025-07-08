import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habit';
import { HabitColor, HabitIcon, DayOfWeek } from '../../types/common';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';

interface HabitItemProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onToggleActive: (habitId: string, isActive: boolean) => void;
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
};

const DAY_LABELS = {
  [DayOfWeek.MONDAY]: 'M',
  [DayOfWeek.TUESDAY]: 'T',
  [DayOfWeek.WEDNESDAY]: 'W',
  [DayOfWeek.THURSDAY]: 'T',
  [DayOfWeek.FRIDAY]: 'F',
  [DayOfWeek.SATURDAY]: 'S',
  [DayOfWeek.SUNDAY]: 'S',
};

export function HabitItem({ habit, onEdit, onDelete, onToggleActive }: HabitItemProps) {
  const { t } = useI18n();

  const handleDelete = () => {
    Alert.alert(
      t('habits.confirmDelete'),
      t('habits.deleteMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => onDelete(habit.id),
        },
      ]
    );
  };

  const handleToggleActive = () => {
    onToggleActive(habit.id, !habit.isActive);
  };

  return (
    <View style={[styles.container, !habit.isActive && styles.inactiveContainer]}>
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
            {Object.values(DayOfWeek).map((day) => (
              <View
                key={day}
                style={[
                  styles.dayIndicator,
                  habit.scheduledDays.includes(day) && styles.activeDayIndicator,
                  !habit.isActive && styles.inactiveDayIndicator,
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    habit.scheduledDays.includes(day) && styles.activeDayLabel,
                    !habit.isActive && styles.inactiveDayLabel,
                  ]}
                >
                  {DAY_LABELS[day]}
                </Text>
              </View>
            ))}
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
      </View>
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
  },
  dayIndicator: {
    width: 24,
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
});