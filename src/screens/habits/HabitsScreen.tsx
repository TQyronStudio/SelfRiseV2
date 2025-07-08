import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Habit, CreateHabitInput, UpdateHabitInput } from '../../types/habit';
import { HabitList, HabitModal } from '../../components/habits';
import { useHabitsData } from '../../hooks/useHabitsData';
import { Colors } from '../../constants/colors';
import { useI18n } from '../../hooks/useI18n';

export function HabitsScreen() {
  const { t } = useI18n();
  const { habits, isLoading, actions } = useHabitsData();
  
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
        console.log('Updating habit:', editingHabit.id, data);
        await actions.updateHabit(editingHabit.id, data as UpdateHabitInput);
      } else {
        console.log('Creating new habit:', data);
        const newHabit = await actions.createHabit(data as CreateHabitInput);
        console.log('New habit created:', newHabit);
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
    console.log('handleToggleActive called:', { habitId, isActive });
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

  return (
    <>
      <HabitList
        habits={habits}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onAddHabit={handleAddHabit}
        onEditHabit={handleEditHabit}
        onDeleteHabit={handleDeleteHabit}
        onToggleActive={handleToggleActive}
        onReorderHabits={handleReorderHabits}
      />

      <HabitModal
        visible={modalVisible}
        habit={editingHabit}
        onClose={handleCloseModal}
        onSubmit={handleSubmitHabit}
        isLoading={isLoading}
      />
    </>
  );
}