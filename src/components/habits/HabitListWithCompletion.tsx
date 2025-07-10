import React from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Habit, HabitCompletion } from '../../types/habit';
import { HabitItemWithCompletion } from './HabitItemWithCompletion';
import { formatDateToString } from '../../utils/date';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';

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

  const handleDragEnd = ({ data }: { data: Habit[] }) => {
    const habitOrders = data.map((habit, index) => ({
      id: habit.id,
      order: index,
    }));
    onReorderHabits(habitOrders);
  };

  const renderActiveHabitItem = ({ item: habit, drag, isActive }: RenderItemParams<Habit>) => {
    const completion = getHabitCompletion(habit.id);
    
    return (
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
    );
  };

  const renderInactiveHabitItem = (habit: Habit) => {
    const completion = getHabitCompletion(habit.id);
    
    return (
      <HabitItemWithCompletion
        key={habit.id}
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
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
      showsVerticalScrollIndicator={true}
      bounces={true}
      alwaysBounceVertical={true}
    >
      {/* Active Habits Section */}
      {activeHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Habits</Text>
          <DraggableFlatList
            data={activeHabits}
            renderItem={renderActiveHabitItem}
            keyExtractor={(item) => item.id}
            onDragEnd={handleDragEnd}
            scrollEnabled={false}
            style={styles.flatList}
          />
        </View>
      )}

      {/* Inactive Habits Section */}
      {inactiveHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inactive Habits</Text>
          <View style={styles.inactiveList}>
            {inactiveHabits.map(renderInactiveHabitItem)}
          </View>
        </View>
      )}

      {/* Empty State */}
      {activeHabits.length === 0 && inactiveHabits.length === 0 && (
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
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  flatList: {
    paddingHorizontal: 16,
  },
  inactiveList: {
    paddingHorizontal: 16,
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