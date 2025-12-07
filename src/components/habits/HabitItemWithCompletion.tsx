import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitCompletion } from '@/src/types/habit';
import { HabitColor, HabitIcon, DayOfWeek } from '@/src/types/common';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Fonts } from '@/src/constants/fonts';
import { useI18n } from '@/src/hooks/useI18n';
import { formatDateToString, getDayOfWeek } from '@/src/utils/date';
import { HabitCompletionButton } from './HabitCompletionButton';
import { BonusCompletionIndicator } from './BonusCompletionIndicator';
import { ConfirmationModal, HelpTooltip } from '@/src/components/common';

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
  isEditMode: boolean;
  date?: string;
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

export const HabitItemWithCompletion = React.memo(({ 
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
  isEditMode,
  date = formatDateToString(new Date())
}: HabitItemWithCompletionProps) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Wiggle animace pro edit mode
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isEditMode) {
      // Náhodný delay pro každou položku (0-500ms)
      const randomDelay = Math.random() * 500;
      setTimeout(() => {
        rotation.value = withRepeat(
          withSequence(
            withTiming(-1, { duration: 150 }), // Mírně doleva
            withTiming(1, { duration: 150 }),  // Mírně doprava
            withTiming(0, { duration: 150 })   // Zpět na střed
          ),
          -1, // Nekonečné opakování
          true // Povolí obrácení sekvence pro plynulejší smyčku
        );
      }, randomDelay);
    } else {
      // Když režim úprav skončí, vrátíme rotaci na nulu
      rotation.value = withTiming(0, { duration: 150 });
    }
  }, [isEditMode, rotation]);

  // Animovaný styl pro wiggle efekt
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(habit.id);
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
  
  // Detekce dnešního dne pro vizuální zvýraznění
  const todayDayOfWeek = getDayOfWeek(new Date(date));
  const isHabitScheduledToday = habit.scheduledDays.includes(todayDayOfWeek);
  const isActiveHabit = habit.isActive;

  // Styles with theme support
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    inactiveContainer: {
      opacity: 0.6,
      backgroundColor: colors.cardBackgroundElevated,
    },
    completedContainer: {
      backgroundColor: colors.success + '08',
      borderWidth: 1,
      borderColor: colors.success + '20',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginLeft: 60,
      marginTop: -2,
    },
    completionSection: {
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 36,
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
      minWidth: 0,
      paddingRight: 8,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 1,
    },
    name: {
      fontSize: 15,
      fontFamily: Fonts.semibold,
      color: colors.text,
      flex: 1,
      lineHeight: 20,
    },
    inactiveName: {
      color: colors.textSecondary,
    },
    completedName: {
      color: colors.success,
    },
    bonusLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 6,
      gap: 4,
    },
    bonusLabel: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    bonusLabelText: {
      fontSize: 9,
      fontFamily: Fonts.medium,
      color: colors.primary,
    },
    description: {
      fontSize: 13,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      lineHeight: 17,
      marginTop: 0,
    },
    inactiveDescription: {
      color: colors.textSecondary,
    },
    completedDescription: {
      color: colors.success + 'AA',
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
      fontSize: 8,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
    },
    activeDayLabel: {
      color: colors.white,
    },
    inactiveDayLabel: {
      color: colors.textSecondary,
    },
    draggingContainer: {
      opacity: 0.8,
      transform: [{ scale: 1.02 }],
    },
    draggingActionButton: {
      backgroundColor: colors.primary,
    },
    actionButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.cardBackgroundElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtonDragging: {
      backgroundColor: colors.primary,
    },
    todayScheduledContainer: {
      borderWidth: 1,
      borderColor: colors.primary + '30',
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
      color: colors.white,
      fontFamily: Fonts.bold,
    },
    todayUnscheduledDayLabel: {
      color: colors.text,
      fontFamily: Fonts.bold,
    },
  });

  // Podmíněný wrapper - Animated.View pouze na iOS, obyčejný View na Androidu
  const WrapperComponent = Platform.OS === 'ios' ? Animated.View : View;
  const wrapperStyle = Platform.OS === 'ios' 
    ? [
        styles.container,
        !habit.isActive && styles.inactiveContainer,
        isCompleted && styles.completedContainer,
        isDragging && styles.draggingContainer,
        // Jemný modrý rámeček pro návyky naplánované na dnešek (pouze aktivní a nesplněné návyky)
        isActiveHabit && isHabitScheduledToday && !isCompleted && styles.todayScheduledContainer,
        animatedStyle, // Wiggle animace pouze na iOS
      ] 
    : [
        styles.container,
        !habit.isActive && styles.inactiveContainer,
        isCompleted && styles.completedContainer,
        isDragging && styles.draggingContainer,
        // Jemný modrý rámeček pro návyky naplánované na dnešek (pouze aktivní a nesplněné návyky)
        isActiveHabit && isHabitScheduledToday && !isCompleted && styles.todayScheduledContainer,
        // Žádná animace na Androidu
      ];

  return (
    <WrapperComponent style={wrapperStyle}>
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
            color={colors.white}
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
              <View style={styles.bonusLabelContainer}>
                <View style={styles.bonusLabel}>
                  <Text style={styles.bonusLabelText}>{t('habits.bonus').toUpperCase()}</Text>
                </View>
                <HelpTooltip
                  helpKey="habits.bonusConversion"
                  iconSize={12}
                  maxWidth={260}
                />
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
              <Ionicons name={habit.isActive ? 'pause' : 'play'} size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onEdit(habit)} style={styles.actionButton}>
              <Ionicons name="pencil" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <Ionicons name="trash" size={16} color={colors.error} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onViewStats(habit.id)} style={styles.actionButton}>
              <Ionicons name="bar-chart-outline" size={16} color={colors.textSecondary} />
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
                <Ionicons name="reorder-three-outline" size={16} color={isDragging ? colors.white : colors.textSecondary} />
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
            const isToday = day === todayDayOfWeek;
            const isTodayScheduled = isToday && isScheduled;
            const isTodayUnscheduled = isToday && !isScheduled && isActiveHabit;
            
            return (
              <View
                key={day}
                style={[
                  styles.dayIndicator,
                  isScheduled && styles.activeDayIndicator,
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
                    isScheduled && styles.activeDayLabel,
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
    </WrapperComponent>
  );
});