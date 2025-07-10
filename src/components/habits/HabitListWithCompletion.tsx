import React from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, FlatList } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Habit, HabitCompletion } from '@/src/types/habit';
import { HabitItemWithCompletion } from './HabitItemWithCompletion';
import { formatDateToString } from '@/src/utils/date';
import { Colors } from '@/src/constants/colors';
import { Fonts } from '@/src/constants/fonts';

interface HabitListWithCompletionProps {
  habits: Habit[];
  completions: HabitCompletion[];
  isLoading: boolean;
  onRefresh: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleActive: (habitId: string, isActive: boolean) => void;
  onToggleCompletion: (habitId: string, date: string, isBonus: boolean) => Promise<void>;
  onReorderHabits: (habitOrders: Array<{ id: string; order: number }>) => void;
  onViewHabitStats: (habitId: string) => void;
  date?: string;
}

export function HabitListWithCompletion({
  habits,
  completions,
  isLoading,
  onRefresh,
  onEditHabit,
  onDeleteHabit,
  onToggleActive,
  onToggleCompletion,
  onReorderHabits,
  onViewHabitStats,
  date = formatDateToString(new Date()),
}: HabitListWithCompletionProps) {
  // Filter and sort habits
  const activeHabits = habits
    .filter(habit => habit.isActive)
    .sort((a, b) => a.order - b.order);
    
  const inactiveHabits = habits
    .filter(habit => !habit.isActive)
    .sort((a, b) => a.order - b.order);

  // Get completions for the current date
  const todayCompletions = completions.filter(completion => 
    completion.date === date
  );

  const getHabitCompletion = (habitId: string): HabitCompletion | undefined => {
    return todayCompletions.find(completion => completion.habitId === habitId);
  };


  // Show empty state if no habits
  if (habits.length === 0) {
    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No habits created yet</Text>
          <Text style={styles.emptyStateSubtext}>Tap "Add New Habit" to get started!</Text>
        </View>
      </ScrollView>
    );
  }

  // Render functions for different list types
  const renderActiveHabitItem = ({ item: habit, drag, isActive }: RenderItemParams<Habit>) => {
    const completion = getHabitCompletion(habit.id);
    
    return (
      <View style={styles.habitContainer}>
        <HabitItemWithCompletion
          habit={habit}
          completion={completion}
          onEdit={onEditHabit}
          onDelete={onDeleteHabit}
          onToggleActive={onToggleActive}
          onToggleCompletion={onToggleCompletion}
          onReorder={onReorderHabits}
          onViewStats={onViewHabitStats}
          onDrag={drag}
          isDragging={isActive}
          date={date}
        />
      </View>
    );
  };

  const renderInactiveHabitItem = ({ item: habit }: { item: Habit }) => {
    const completion = getHabitCompletion(habit.id);
    
    return (
      <View style={styles.habitContainer}>
        <HabitItemWithCompletion
          habit={habit}
          completion={completion}
          onEdit={onEditHabit}
          onDelete={onDeleteHabit}
          onToggleActive={onToggleActive}
          onToggleCompletion={onToggleCompletion}
          onReorder={onReorderHabits}
          onViewStats={onViewHabitStats}
          date={date}
        />
      </View>
    );
  };

  const handleActiveDragEnd = ({ data }: { data: Habit[] }) => {
    const habitOrders = data.map((habit, index) => ({
      id: habit.id,
      order: index,
    }));
    onReorderHabits(habitOrders);
  };

  return (
    <View style={styles.container}>
      {/* Active Habits Section with Drag & Drop */}
      {activeHabits.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Active Habits</Text>
          </View>
          <DraggableFlatList
            data={activeHabits}
            renderItem={renderActiveHabitItem}
            keyExtractor={(item) => item.id}
            onDragEnd={handleActiveDragEnd}
            style={styles.activeHabitsList}
            contentContainerStyle={styles.activeHabitsContent}
            scrollEnabled={false}
            activationDistance={10}
            autoscrollSpeed={100}
            autoscrollThreshold={80}
          />
        </View>
      )}

      {/* Inactive Habits Section - No Drag & Drop */}
      {inactiveHabits.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Inactive Habits</Text>
          </View>
          <FlatList
            data={inactiveHabits}
            renderItem={renderInactiveHabitItem}
            keyExtractor={(item) => item.id}
            style={styles.inactiveHabitsList}
            contentContainerStyle={styles.inactiveHabitsContent}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  habitContainer: {
    paddingHorizontal: 16,
  },
  activeHabitsList: {
    maxHeight: 400, // Limit height to prevent conflicts
  },
  activeHabitsContent: {
    paddingBottom: 10,
  },
  inactiveHabitsList: {
    maxHeight: 300, // Limit height for inactive habits
  },
  inactiveHabitsContent: {
    paddingBottom: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    minHeight: 300,
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