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
  ListHeaderComponent?: React.ReactElement;
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
  ListHeaderComponent,
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Render header if provided */}
      {ListHeaderComponent}

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
            style={styles.flatList}
            scrollEnabled={false}
            activationDistance={10}
          />
        </View>
      )}

      {/* Inactive Habits Section - No Drag & Drop */}
      {inactiveHabits.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Inactive Habits</Text>
          </View>
          {inactiveHabits.map((habit) => (
            <View key={habit.id} style={styles.habitContainer}>
              <HabitItemWithCompletion
                habit={habit}
                completion={getHabitCompletion(habit.id)}
                onEdit={onEditHabit}
                onDelete={onDeleteHabit}
                onToggleActive={onToggleActive}
                onToggleCompletion={onToggleCompletion}
                onReorder={onReorderHabits}
                onViewStats={onViewHabitStats}
                date={date}
              />
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No habits created yet</Text>
          <Text style={styles.emptyStateSubtext}>Tap "Add New Habit" to get started!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
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
  flatList: {
    // Remove maxHeight constraints
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