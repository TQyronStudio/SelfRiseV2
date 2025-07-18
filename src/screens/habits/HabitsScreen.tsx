// src/screens/habits/HabitsScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
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
import { ErrorModal } from '@/src/components/common';

// Tento styl zajistí, že se hlavní kontejner obrazovky roztáhne na celou výšku
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  listContainer: {
    flex: 1, // Klíčová oprava - seznam zabere pouze zbývající místo
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


export function HabitsScreen() {
  const { t } = useI18n();
  const { habits, completions, isLoading, actions } = useHabitsData();
  
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save habit');
      setShowError(true);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    // This is now handled by HabitItemWithCompletion - no duplicate confirmation needed
    try {
      await actions.deleteHabit(habitId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete habit');
      setShowError(true);
    }
  };

  const handleToggleActive = async (habitId: string, isActive: boolean) => {
    try {
      await actions.updateHabit(habitId, { isActive });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update habit');
      setShowError(true);
    }
  };

  const handleReorderHabits = async (habitOrders: Array<{ id: string; order: number }>) => {
    try {
      await actions.updateHabitOrder(habitOrders);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to reorder habits');
      setShowError(true);
    }
  };

  const handleToggleCompletion = async (habitId: string, date: string, isBonus: boolean) => {
    try {
      await actions.toggleCompletion(habitId, date, isBonus);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to toggle completion');
      setShowError(true);
    }
  };

  const handleRefresh = async () => {
    try {
      await actions.loadHabits();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to refresh habits');
      setShowError(true);
    }
  };

  const handleViewHabitStats = (habitId: string) => {
    router.push(`/habit-stats?habitId=${habitId}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tlačítko Add je nyní odděleno od seznamu */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddHabit}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add New Habit</Text>
        </TouchableOpacity>
      </View>
      
      {/* Seznam má vlastní kontejner s flex: 1 */}
      <View style={styles.listContainer}>
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
          ListHeaderComponent={<DailyHabitProgress />}
        />
      </View>

      <HabitModal
        visible={modalVisible}
        habit={editingHabit}
        onClose={handleCloseModal}
        onSubmit={handleSubmitHabit}
        isLoading={isLoading}
      />
      
      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        title={t('common.error')}
        message={errorMessage}
      />
    </SafeAreaView>
  );
}