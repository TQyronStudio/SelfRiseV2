import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Text, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Habit, CreateHabitInput, UpdateHabitInput } from '@/src/types/habit';
import { 
  HabitModal, 
  DailyHabitProgress, 
  HabitListWithCompletion 
} from '@/src/components/habits';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { Colors } from '@/src/constants/colors';
import { useI18n } from '@/src/hooks/useI18n';
import { formatDateToString } from '@/src/utils/date';
import { Fonts } from '@/src/constants/fonts';


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
    router.push(`/habit-stats?habitId=${habitId}` as any);
  };

  return (
    <View style={styles.container}>
      {/* Daily Progress Header */}
      <DailyHabitProgress />

      {/* Add Habit Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddHabit}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add New Habit</Text>
        </TouchableOpacity>
      </View>

      {/* Habit List Content - This component now handles all scrolling and drag & drop */}
      <HabitListWithCompletion
        habits={habits}
        completions={completions}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onEditHabit={handleEditHabit}
        onDeleteHabit={handleDeleteHabit}
        onToggleActive={handleToggleActive}
        onToggleCompletion={handleToggleCompletion}
        onReorderHabits={handleReorderHabits}
        onViewHabitStats={handleViewHabitStats}
      />

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
});