import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { useHabitsData } from '../../hooks/useHabitsData';
import { HabitStatsAccordionItem } from '../../components/habits/HabitStatsAccordionItem';

export function IndividualHabitStatsScreen() {
  const { t } = useI18n();
  const { habits } = useHabitsData();
  const { habitId } = useLocalSearchParams<{ habitId?: string }>();
  
  // Filter to show only active habits first, then inactive
  const activeHabits = habits.filter(habit => habit.isActive).sort((a, b) => a.order - b.order);
  const inactiveHabits = habits.filter(habit => !habit.isActive).sort((a, b) => a.order - b.order);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        {/* Active Habits Section */}
        {activeHabits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Habits</Text>
            {activeHabits.map((habit) => (
              <HabitStatsAccordionItem 
                key={habit.id} 
                habit={habit}
                initiallyExpanded={habit.id === habitId}
              />
            ))}
          </View>
        )}

        {/* Inactive Habits Section */}
        {inactiveHabits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inactive Habits</Text>
            {inactiveHabits.map((habit) => (
              <HabitStatsAccordionItem 
                key={habit.id} 
                habit={habit}
                initiallyExpanded={habit.id === habitId}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {habits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No habits found</Text>
            <Text style={styles.emptyStateSubtext}>
              Create some habits first to view their statistics
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});