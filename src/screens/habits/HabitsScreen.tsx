import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Text, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Habit, CreateHabitInput, UpdateHabitInput } from '../../types/habit';
import { 
  HabitModal, 
  DailyHabitProgress, 
  HabitItemWithCompletion 
} from '../../components/habits';
import { useHabitsData } from '../../hooks/useHabitsData';
import { Colors } from '../../constants/colors';
import { useI18n } from '../../hooks/useI18n';
import { formatDateToString } from '../../utils/date';
import { Fonts } from '../../constants/fonts';

// Internal component for habit list content
function HabitListContent({ 
  habits, 
  completions, 
  onEditHabit, 
  onDeleteHabit, 
  onToggleActive, 
  onToggleCompletion,
  onReorderHabits,
  onViewHabitStats
}: {
  habits: Habit[];
  completions: any[];
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleActive: (habitId: string, isActive: boolean) => void;
  onToggleCompletion: (habitId: string, date: string, isBonus: boolean) => Promise<void>;
  onReorderHabits: (habitOrders: Array<{ id: string; order: number }>) => void;
  onViewHabitStats: (habitId: string) => void;
}) {
  const date = formatDateToString(new Date());
  
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

  const getHabitCompletion = (habitId: string) => {
    return todayCompletions.find(completion => completion.habitId === habitId);
  };

  return (
    <View style={styles.habitListContent}>
      {/* Active Habits Section */}
      {activeHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Habits</Text>
          {activeHabits.map((habit) => {
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
          })}
        </View>
      )}

      {/* Inactive Habits Section */}
      {inactiveHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inactive Habits</Text>
          {inactiveHabits.map((habit) => {
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
          })}
        </View>
      )}

      {/* Empty State */}
      {activeHabits.length === 0 && inactiveHabits.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No habits created yet</Text>
          <Text style={styles.emptyStateSubtext}>Tap "Add New Habit" to get started!</Text>
        </View>
      )}
    </View>
  );
}

export function HabitsScreen() {
  const { t } = useI18n();
  const { habits, completions, isLoading, actions } = useHabitsData();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();

  const handleAddHabit = () => {
    setEditingHabit(undefined);
    setModalVisible(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingHabit(undefined);
  };

  const handleSubmitHabit = async (data: CreateHabitInput | UpdateHabitInput) => {
    try {
      if (editingHabit) {
        await actions.updateHabit(editingHabit.id, data as UpdateHabitInput);
      } else {
        await actions.createHabit(data as CreateHabitInput);
      }
      handleCloseModal();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : 'Failed to save habit'
      );
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await actions.deleteHabit(habitId);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : 'Failed to delete habit'
      );
    }
  };

  const handleToggleActive = async (habitId: string, isActive: boolean) => {
    try {
      await actions.updateHabit(habitId, { isActive });
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : 'Failed to update habit'
      );
    }
  };

  const handleReorderHabits = async (habitOrders: Array<{ id: string; order: number }>) => {
    try {
      await actions.updateHabitOrder(habitOrders);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : 'Failed to reorder habits'
      );
    }
  };

  const handleToggleCompletion = async (habitId: string, date: string, isBonus: boolean) => {
    try {
      await actions.toggleCompletion(habitId, date, isBonus);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : 'Failed to toggle completion'
      );
    }
  };

  const handleRefresh = async () => {
    try {
      await actions.loadHabits();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : 'Failed to refresh habits'
      );
    }
  };

  const handleViewHabitStats = (habitId: string) => {
    router.push(`/habit-detail/${habitId}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Daily Progress Header */}
        <DailyHabitProgress />

        {/* Add Habit Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddHabit}>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Add New Habit</Text>
          </TouchableOpacity>
        </View>

        {/* Habit List Content */}
        <HabitListContent
          habits={habits}
          completions={completions}
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
          onToggleActive={handleToggleActive}
          onToggleCompletion={handleToggleCompletion}
          onReorderHabits={handleReorderHabits}
          onViewHabitStats={handleViewHabitStats}
        />
      </ScrollView>

      <HabitModal
        visible={modalVisible}
        habit={editingHabit}
        onClose={handleCloseModal}
        onSubmit={handleSubmitHabit}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  addButtonContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  habitListContent: {
    paddingHorizontal: 16,
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
  },
  emptyState: {
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