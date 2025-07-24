import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habit';
import { HabitColor, HabitIcon } from '../../types/common';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useHabitsData } from '../../hooks/useHabitsData';
import { HabitCalendarView } from './HabitCalendarView';

interface HabitStatsAccordionItemProps {
  habit: Habit;
  initiallyExpanded?: boolean;
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

export function HabitStatsAccordionItem({ habit, initiallyExpanded = false }: HabitStatsAccordionItemProps) {
  const { getHabitStats } = useHabitsData();
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [animatedValue] = useState(new Animated.Value(initiallyExpanded ? 1 : 0));
  
  const stats = getHabitStats(habit.id) || {
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    totalCompletions: 0,
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
              color={Colors.textInverse}
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
              stats.completionRate > 100 && { color: Colors.warning }
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
              color={habit.isActive ? Colors.textSecondary : Colors.textTertiary} 
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
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
    opacity: 0.7,
    backgroundColor: Colors.backgroundSecondary,
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
    color: Colors.text,
    marginBottom: 2,
  },
  habitDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  inactiveText: {
    color: Colors.textTertiary,
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
    color: Colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
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
    borderTopColor: Colors.border,
  },
  calendarContainer: {
    padding: 16,
  },
});