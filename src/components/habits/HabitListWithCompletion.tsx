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

  // Create unified data for single DraggableFlatList
  const createFlatListData = () => {
    const data: Array<{type: 'header' | 'habit', id: string, title?: string, habit?: Habit}> = [];
    
    // Add active habits section
    if (activeHabits.length > 0) {
      data.push({ type: 'header', id: 'active-header', title: 'Active Habits' });
      activeHabits.forEach(habit => {
        data.push({ type: 'habit', id: habit.id, habit });
      });
    }
    
    // Add inactive habits section  
    if (inactiveHabits.length > 0) {
      data.push({ type: 'header', id: 'inactive-header', title: 'Inactive Habits' });
      inactiveHabits.forEach(habit => {
        data.push({ type: 'habit', id: habit.id, habit });
      });
    }
    
    return data;
  };

  const renderUnifiedItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }
    
    if (item.type === 'habit' && item.habit) {
      const completion = getHabitCompletion(item.habit.id);
      const isActiveHabit = activeHabits.some(h => h.id === item.habit.id);
      
      return (
        <View style={styles.habitContainer}>
          <HabitItemWithCompletion
            habit={item.habit}
            completion={completion}
            onEdit={onEditHabit}
            onDelete={onDeleteHabit}
            onToggleActive={onToggleActive}
            onToggleCompletion={onToggleCompletion}
            onReorder={onReorderHabits}
            onViewStats={onViewHabitStats}
            onDrag={isActiveHabit ? drag : undefined}
            isDragging={isActive}
            date={date}
          />
        </View>
      );
    }
    
    return null;
  };

  const handleUnifiedDragEnd = ({ data }: { data: any[] }) => {
    // Extract only active habits and update their order
    const activeHabitItems = data.filter(item => 
      item.type === 'habit' && 
      item.habit && 
      activeHabits.some(h => h.id === item.habit.id)
    );
    
    const habitOrders = activeHabitItems.map((item, index) => ({
      id: item.habit.id,
      order: index,
    }));
    
    if (habitOrders.length > 0) {
      onReorderHabits(habitOrders);
    }
  };

  return (
    <DraggableFlatList
      data={createFlatListData()}
      renderItem={renderUnifiedItem}
      keyExtractor={(item) => item.id}
      onDragEnd={handleUnifiedDragEnd}
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
      showsVerticalScrollIndicator={true}
      bounces={true}
      activationDistance={15}
      autoscrollSpeed={100}
      autoscrollThreshold={80}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Critical: Take up all available space
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1, // Allow content to grow and fill available space
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    minHeight: 300, // Ensure minimum height for empty state
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