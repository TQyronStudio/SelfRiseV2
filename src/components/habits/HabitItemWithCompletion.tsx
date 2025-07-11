import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitCompletion } from '@/src/types/habit';
import { HabitColor, HabitIcon, DayOfWeek } from '@/src/types/common';
import { Colors } from '@/src/constants/colors';
import { Fonts } from '@/src/constants/fonts';
import { useI18n } from '@/src/hooks/useI18n';
import { formatDateToString, getDayOfWeek } from '@/src/utils/date';
import { HabitCompletionButton } from './HabitCompletionButton';
import { BonusCompletionIndicator } from './BonusCompletionIndicator';

interface HabitItemWithCompletionProps {
  habit: Habit;
  completion?: HabitCompletion | undefined;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onToggleActive: (habitId: string, isActive: boolean) => void;
  onToggleCompletion: (habitId: string, date: string, isBonus: boolean) => Promise<void>;
  onReorder: (habitOrders: Array<{ id: string; order: number }>) => void;
  onViewStats: (habitId: string) => void;
  onDrag?: (() => void) | undefined;
  isDragging?: boolean;
  date?: string;
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
  [DayOfWeek.MONDAY]: 'Mo',
  [DayOfWeek.TUESDAY]: 'Tu',
  [DayOfWeek.WEDNESDAY]: 'We',
  [DayOfWeek.THURSDAY]: 'Th',
  [DayOfWeek.FRIDAY]: 'Fr',
  [DayOfWeek.SATURDAY]: 'Sa',
  [DayOfWeek.SUNDAY]: 'Su',
};

export function HabitItemWithCompletion({ 
  habit, 
  completion,
  onEdit, 
  onDelete, 
  onToggleActive, 
  onToggleCompletion,
  onReorder, 
  onViewStats,
  onDrag, 
  isDragging,
  date = formatDateToString(new Date())
}: HabitItemWithCompletionProps) {
  const { t } = useI18n();
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(habit.id),
        },
      ]
    );
  };

  const handleToggleActive = () => {
    onToggleActive(habit.id, !habit.isActive);
  };

  const handleToggleCompletion = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      const today = new Date(date);
      const dayOfWeek = getDayOfWeek(today);
      const isScheduled = habit.scheduledDays.includes(dayOfWeek);
      
      await onToggleCompletion(habit.id, date, !isScheduled);
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const isCompleted = completion?.completed || false;
  const isScheduledToday = () => {
    const today = new Date(date);
    const dayOfWeek = getDayOfWeek(today);
    return habit.scheduledDays.includes(dayOfWeek);
  };

  return (
    <View style={[
      styles.container,
      !habit.isActive && styles.inactiveContainer,
      isCompleted && styles.completedContainer,
      isDragging && styles.draggingContainer,
    ]}>
      {/* Top row with completion, icon, content, and actions */}
      <View style={styles.topRow}>
        {/* Completion section */}
        <View style={styles.completionSection}>
          <HabitCompletionButton
            isCompleted={isCompleted}
            isAnimating={isToggling}
            onPress={handleToggleCompletion}
            disabled={!habit.isActive}
            size="medium"
          />
          {completion?.isBonus && (
            <View style={styles.bonusIndicator}>
              <BonusCompletionIndicator
                isVisible={true}
                size="small"
                showText={false}
              />
            </View>
          )}
        </View>

        {/* Habit Icon */}
        <View style={[styles.iconContainer, { backgroundColor: COLOR_MAP[habit.color] }]}>
          <Ionicons
            name={ICON_MAP[habit.icon] as any}
            size={20}
            color={Colors.textInverse}
          />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.name,
              !habit.isActive && styles.inactiveName,
              isCompleted && styles.completedName,
            ]} numberOfLines={2}>
              {habit.name}
            </Text>
            {completion?.isBonus && (
              <View style={styles.bonusLabel}>
                <Text style={styles.bonusLabelText}>BONUS</Text>
              </View>
            )}
          </View>
          {habit.description && (
            <Text style={[
              styles.description,
              !habit.isActive && styles.inactiveDescription,
              isCompleted && styles.completedDescription,
            ]} numberOfLines={2}>
              {habit.description}
            </Text>
          )}
        </View>

        {/* Actions grid */}
        <View style={styles.actionsGrid}>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleToggleActive} style={styles.actionButton}>
              <Ionicons name={habit.isActive ? 'pause' : 'play'} size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onEdit(habit)} style={styles.actionButton}>
              <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <Ionicons name="trash" size={16} color={Colors.error} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onViewStats(habit.id)} style={styles.actionButton}>
              <Ionicons name="bar-chart-outline" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {/* Drag handle row - jen pro aktivní návyky */}
          {habit.isActive && onDrag && (
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                onLongPress={onDrag} 
                style={[styles.actionButton, isDragging && styles.actionButtonDragging]}
                delayLongPress={100}
              >
                <Ionicons name="reorder-three-outline" size={16} color={isDragging ? Colors.textInverse : Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Bottom row with days */}
      <View style={styles.bottomRow}>
        <View style={styles.daysContainer}>
          {Object.values(DayOfWeek).map((day) => {
            const isScheduled = habit.scheduledDays.includes(day);
            return (
              <View
                key={day}
                style={[
                  styles.dayIndicator,
                  isScheduled && styles.activeDayIndicator,
                  !habit.isActive && styles.inactiveDayIndicator,
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isScheduled && styles.activeDayLabel,
                    !habit.isActive && styles.inactiveDayLabel,
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
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  inactiveContainer: {
    opacity: 0.6,
    backgroundColor: Colors.backgroundSecondary,
  },
  completedContainer: {
    backgroundColor: Colors.success + '08',
    borderWidth: 1,
    borderColor: Colors.success + '20',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center', // Changed to center for icon alignment
    marginBottom: 4, // Reduced gap
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 60, // Align with content
    marginTop: -2, // Pull days closer up
  },
  completionSection: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 36, // Match icon container height for alignment
  },
  bonusIndicator: {
    marginTop: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    minWidth: 0, // Important: allows flex shrinking
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 1, // Further reduced gap
  },
  name: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  inactiveName: {
    color: Colors.textTertiary,
  },
  completedName: {
    color: Colors.success,
  },
  bonusLabel: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
    alignSelf: 'flex-start',
  },
  bonusLabelText: {
    fontSize: 9,
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  description: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: 0, // Remove top margin
  },
  inactiveDescription: {
    color: Colors.textTertiary,
  },
  completedDescription: {
    color: Colors.success + 'AA',
  },
  actionsGrid: {
    flexDirection: 'column',
    gap: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 3,
    flexWrap: 'wrap',
  },
  dayIndicator: {
    width: 20,
    height: 16,
    borderRadius: 8,
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
    fontSize: 8,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  activeDayLabel: {
    color: Colors.textInverse,
  },
  inactiveDayLabel: {
    color: Colors.textTertiary,
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
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDragging: {
    backgroundColor: Colors.primary,
  },
});