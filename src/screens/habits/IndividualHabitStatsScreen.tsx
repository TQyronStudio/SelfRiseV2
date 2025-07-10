import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { useHabitsData } from '../../hooks/useHabitsData';
import { HabitStatsAccordionItem } from '../../components/habits/HabitStatsAccordionItem';

export function IndividualHabitStatsScreen() {
  const { t } = useI18n();
  const { habits } = useHabitsData();
  
  // Filter to show only active habits first, then inactive
  const activeHabits = habits.filter(habit => habit.isActive).sort((a, b) => a.order - b.order);
  const inactiveHabits = habits.filter(habit => !habit.isActive).sort((a, b) => a.order - b.order);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Individual Habit Stats</Text>
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={() => router.push('/(tabs)/habits')}
        >
          <Ionicons name="home" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        {/* Active Habits Section */}
        {activeHabits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Habits</Text>
            {activeHabits.map((habit) => (
              <HabitStatsAccordionItem 
                key={habit.id} 
                habit={habit} 
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.textInverse,
    textAlign: 'center',
    marginHorizontal: 8,
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