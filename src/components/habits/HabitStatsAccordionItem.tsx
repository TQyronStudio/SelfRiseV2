import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habit';
import { HabitColor, HabitIcon } from '../../types/common';
import { Fonts } from '../../constants/fonts';
import { useHabitsData } from '../../hooks/useHabitsData';
import { HabitCalendarView } from './HabitCalendarView';
import { useTheme } from '../../contexts/ThemeContext';

interface HabitStatsAccordionItemProps {
  habit: Habit;
  initiallyExpanded?: boolean;
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

export function HabitStatsAccordionItem({ habit, initiallyExpanded = false }: HabitStatsAccordionItemProps) {
  const { colors } = useTheme();

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
  const { getHabitStats } = useHabitsData();
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [animatedValue] = useState(new Animated.Value(initiallyExpanded ? 1 : 0));
  
  const stats = getHabitStats(habit.id) || {
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    totalCompletions: 0,
    bonusCompletions: 0,
  };
  
  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    // Reset calendar to current month when expanding
    if (!isExpanded) {
      setCurrentDate(new Date());
    }
    
    Animated.timing(animatedValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setIsExpanded(!isExpanded);
  };
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const chevronRotation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      marginBottom: 8,
    },
    inactiveContainer: {
      opacity: 0.7,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    leftSection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    nameContainer: {
      flex: 1,
      paddingRight: 12,
    },
    habitName: {
      fontSize: 16,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginBottom: 2,
    },
    habitDescription: {
      fontSize: 13,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
    },
    inactiveText: {
      color: colors.textTertiary,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statsSection: {
      alignItems: 'center',
      marginHorizontal: 8,
      minWidth: 50,
    },
    statValue: {
      fontSize: 16,
      fontFamily: Fonts.bold,
      color: colors.primary,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
    },
    chevronContainer: {
      marginLeft: 8,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    expandedContent: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    calendarContainer: {
      padding: 16,
    },
  });

  return (
    <View style={[
      styles.container,
      !habit.isActive && styles.inactiveContainer
    ]}>
      {/* Collapsed Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        {/* Left: Icon + Name */}
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: COLOR_MAP[habit.color] }]}>
            <Ionicons
              name={ICON_MAP[habit.icon] as any}
              size={20}
              color={colors.textInverse}
            />
          </View>
          <View style={styles.nameContainer}>
            <Text style={[
              styles.habitName,
              !habit.isActive && styles.inactiveText
            ]} numberOfLines={1}>
              {habit.name}
            </Text>
            {habit.description && (
              <Text style={[
                styles.habitDescription,
                !habit.isActive && styles.inactiveText
              ]} numberOfLines={1}>
                {habit.description}
              </Text>
            )}
          </View>
        </View>

        {/* Right: Statistics + Arrow */}
        <View style={styles.rightSection}>
          <View style={styles.statsSection}>
            <Text style={[
              styles.statValue,
              !habit.isActive && styles.inactiveText,
              stats.completionRate > 100 && { color: colors.warning }
            ]}>
              {stats.completionRate.toFixed(0)}%
            </Text>
            <Text style={[
              styles.statLabel,
              !habit.isActive && styles.inactiveText
            ]}>
              Success{stats.bonusCompletions > 0 ? ' + Bonus' : ''}
            </Text>
          </View>

          <View style={styles.statsSection}>
            <Text style={[
              styles.statValue,
              !habit.isActive && styles.inactiveText
            ]}>
              {stats.totalCompletions}
            </Text>
            <Text style={[
              styles.statLabel,
              !habit.isActive && styles.inactiveText
            ]}>
              Days
            </Text>
          </View>

          <Animated.View style={[
            styles.chevronContainer,
            { transform: [{ rotate: chevronRotation }] }
          ]}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={habit.isActive ? colors.textSecondary : colors.textTertiary}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.calendarContainer}>
            <HabitCalendarView
              habit={habit}
              currentDate={currentDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          </View>
        </View>
      )}
    </View>
  );
}