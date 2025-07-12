// src/screens/habits/HabitsScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, SafeAreaView } from 'react-native';
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

// Tento styl zajistí, že se hlavní kontejner obrazovky roztáhne na celou výšku
const styles = StyleSheet.create({
  // Toto je klíčová oprava!
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Přidáme barvu pozadí pro konzistenci
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16, // Přidáme horní padding pro lepší vzhled
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


export function HabitsScreen() {
  const { t } = useI18n();
  const { habits, completions, isLoading, actions } = useHabitsData();
  
  // DEBUG: Logování dat
  console.log('HabitsScreen DEBUG:', { 
    habitsCount: habits.length, 
    completionsCount: completions.length, 
    isLoading,
    habits: habits.slice(0, 2) // Jen první dva pro debug
  });
  
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
    Alert.alert(
      "Delete Habit",
      "Are you sure you want to delete this habit? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await actions.deleteHabit(habitId);
          } catch (error) {
            Alert.alert(
              t('common.error'),
              error instanceof Error ? error.message : 'Failed to delete habit'
            );
          }
        }},
      ]
    );
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
    <SafeAreaView style={styles.container}>
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
        ListHeaderComponent={
          <>
            <DailyHabitProgress />
            <View style={styles.addButtonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={handleAddHabit}>
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.addButtonText}>Add New Habit</Text>
              </TouchableOpacity>
            </View>
          </>
        }
      />

      <HabitModal
        visible={modalVisible}
        habit={editingHabit}
        onClose={handleCloseModal}
        onSubmit={handleSubmitHabit}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}