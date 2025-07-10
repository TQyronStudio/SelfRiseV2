import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitCompletion } from '../../types/habit';
import { HabitColor, HabitIcon, DayOfWeek } from '../../types/common';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { formatDateToString, getDayOfWeek } from '../../utils/date';
import { HabitCompletionButton, BonusCompletionIndicator } from './';

interface HabitItemWithCompletionProps {
  habit: Habit;
  completion?: HabitCompletion;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onToggleActive: (habitId: string, isActive: boolean) => void;
  onToggleCompletion: (habitId: string, date: string, isBonus: boolean) => Promise<void>;
  onReorder: (habitOrders: Array<{ id: string; order: number }>) => void;
  onDrag?: () => void;
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
  onDrag, 
  isDragging,
  date = formatDateToString(new Date())
}: HabitItemWithCompletionProps) {
  const { t } = useI18n();
  const [isToggling, setIsToggling] = useState(false);

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

  const containerStyle = [
    styles.container,
    !habit.isActive && styles.inactiveContainer,
    isDragging && styles.draggingContainer,
    isCompleted && styles.completedContainer,
  ];
  
  return (
    <View style={containerStyle}>
      {/* Top Row: Completion Button + Icon + Content + Actions Grid */}
      <View style={styles.topRow}>
        {/* Completion Button */}
        <View style={styles.completionSection}>
          <HabitCompletionButton
            isCompleted={isCompleted}
            isAnimating={isToggling}
            onPress={handleToggleCompletion}
            disabled={!habit.isActive}
            size="small"
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

        {/* Content Container - takes all available space */}
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.name, 
              !habit.isActive && styles.inactiveName,
              isCompleted && styles.completedName
            ]} numberOfLines={2}>
              {habit.name}
            </Text>
            {!isScheduledToday() && habit.isActive && (
              <View style={styles.bonusLabel}>
                <Text style={styles.bonusLabelText}>Bonus</Text>
              </View>
            )}
          </View>
          
          {habit.description && (
            <Text style={[
              styles.description, 
              !habit.isActive && styles.inactiveDescription,
              isCompleted && styles.completedDescription
            ]} numberOfLines={2}>
              {habit.description}
            </Text>
          )}
        </View>

        {/* Actions Grid 2x2 */}
        <View style={styles.actionsGrid}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleToggleActive}
              activeOpacity={0.7}
            >
              <Ionicons
                name={habit.isActive ? 'pause' : 'play'}
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(habit)}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={16} color={Colors.error} />
            </TouchableOpacity>

            {habit.isActive && (
              <TouchableOpacity
                style={[styles.actionButton, isDragging && styles.draggingActionButton]}
                onLongPress={onDrag}
                activeOpacity={0.7}
                delayLongPress={100}
              >
                <Ionicons name="reorder-three-outline" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Bottom Row: Compact Days Indicator */}
      <View style={styles.bottomRow}>
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
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
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
});