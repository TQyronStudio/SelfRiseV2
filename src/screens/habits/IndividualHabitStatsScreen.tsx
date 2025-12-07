import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { useHabitsData } from '../../hooks/useHabitsData';
import { useTheme } from '../../contexts/ThemeContext';
import { HabitStatsAccordionItem } from '../../components/habits/HabitStatsAccordionItem';

export function IndividualHabitStatsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { habits } = useHabitsData();
  const { habitId } = useLocalSearchParams<{ habitId?: string }>();

  // Filter to show only active habits first, then inactive
  const activeHabits = habits.filter(habit => habit.isActive).sort((a, b) => a.order - b.order);
  const inactiveHabits = habits.filter(habit => !habit.isActive).sort((a, b) => a.order - b.order);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    section: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: Fonts.semibold,
      color: colors.text,
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
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        {/* Active Habits Section */}
        {activeHabits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('screens.habitStats.activeHabits')}</Text>
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
            <Text style={styles.sectionTitle}>{t('screens.habitStats.inactiveHabits')}</Text>
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
            <Text style={styles.emptyStateText}>{t('screens.habitStats.noHabitsFound')}</Text>
            <Text style={styles.emptyStateSubtext}>
              {t('screens.habitStats.noHabitsSubtext')}
            </Text>
          </View>
        )}
      </ScrollView>
  );
}