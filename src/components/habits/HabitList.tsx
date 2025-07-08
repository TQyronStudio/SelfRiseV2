import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';
import { Habit } from '../../types/habit';
import { HabitItem } from './HabitItem';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';

interface HabitListProps {
  habits: Habit[];
  isLoading: boolean;
  onRefresh: () => void;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleActive: (habitId: string, isActive: boolean) => void;
  onReorderHabits: (habitOrders: Array<{ id: string; order: number }>) => void;
}

export function HabitList({
  habits,
  isLoading,
  onRefresh,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onToggleActive,
  onReorderHabits,
}: HabitListProps) {
  const { t } = useI18n();
  const [isReordering, setIsReordering] = useState(false);

  const activeHabits = habits.filter(habit => habit.isActive);
  const inactiveHabits = habits.filter(habit => !habit.isActive);
  
  // Debug: log habits state
  console.log('All habits:', habits.map(h => ({ name: h.name, isActive: h.isActive })));
  console.log('Active habits count:', activeHabits.length);
  console.log('Inactive habits count:', inactiveHabits.length);

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const reorderedHabits = [...activeHabits];
    const [movedItem] = reorderedHabits.splice(fromIndex, 1);
    reorderedHabits.splice(toIndex, 0, movedItem);

    const habitOrders = reorderedHabits.map((habit, index) => ({
      id: habit.id,
      order: index,
    }));

    onReorderHabits(habitOrders);
  };

  const renderHabitItem = ({ item, index, onDragStart, onDragEnd }: DragListRenderItemInfo<Habit>) => {
    console.log('renderHabitItem called with:', { name: item.name, isActive: item.isActive, index });
    return (
      <View style={styles.habitItemContainer}>
        <View style={styles.habitItemContent}>
          <HabitItem
            habit={item}
            onEdit={onEditHabit}
            onDelete={onDeleteHabit}
            onToggleActive={onToggleActive}
          />
        </View>
        <TouchableOpacity
          style={styles.dragHandle}
          onPressIn={onDragStart}
          onPressOut={onDragEnd}
          activeOpacity={0.7}
          delayPressIn={0}
        >
          <Ionicons name="reorder-three" size={24} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderRegularHabitItem = ({ item }: { item: Habit }) => (
    <HabitItem
      habit={item}
      onEdit={onEditHabit}
      onDelete={onDeleteHabit}
      onToggleActive={onToggleActive}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="add-circle-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>No habits yet</Text>
      <Text style={styles.emptySubtitle}>
        Start building better habits by creating your first one
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAddHabit}>
        <Text style={styles.emptyButtonText}>{t('habits.addHabit')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (habits.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.subtitle}>
            {activeHabits.length} active • {inactiveHabits.length} inactive
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, isReordering && styles.activeHeaderButton]}
            onPress={() => setIsReordering(!isReordering)}
          >
            <Ionicons
              name="reorder-three"
              size={20}
              color={isReordering ? Colors.textInverse : Colors.textSecondary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={onAddHabit}>
            <Ionicons name="add" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {activeHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Habits</Text>
          {isReordering ? (
            <>
              {console.log('DragList rendering with data:', activeHabits.map(h => ({ name: h.name, isActive: h.isActive })))}
              <DragList
                data={activeHabits}
                keyExtractor={(item) => item.id}
                onReordered={handleReorder}
                renderItem={renderHabitItem}
                containerStyle={styles.dragListContainer}
                refreshControl={
                  <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
                }
              />
            </>
          ) : (
            <FlatList
              data={activeHabits}
              keyExtractor={(item) => item.id}
              renderItem={renderRegularHabitItem}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
              }
            />
          )}
        </View>
      )}

      {inactiveHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inactive Habits</Text>
          <FlatList
            data={inactiveHabits}
            keyExtractor={(item) => item.id}
            renderItem={renderRegularHabitItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  activeHeaderButton: {
    backgroundColor: Colors.primary,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  habitItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  habitItemContent: {
    flex: 1,
  },
  dragHandle: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  dragListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.textInverse,
  },
});