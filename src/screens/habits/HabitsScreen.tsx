// src/screens/habits/HabitsScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Habit, CreateHabitInput, UpdateHabitInput } from '@/src/types/habit';
import { 
  HabitModal, 
  DailyHabitProgress, 
  HabitListWithCompletion 
} from '@/src/components/habits';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useOptimizedGamification } from '@/src/contexts/OptimizedGamificationContext';
import { Colors } from '@/src/constants/colors';
import { useI18n } from '@/src/hooks/useI18n';
import { ErrorModal } from '@/src/components/common';
import { XPSourceType } from '@/src/types/gamification';
import { XP_REWARDS } from '@/src/constants/gamification';

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
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});


export function HabitsScreen() {
  const { t } = useI18n();
  const { habits, completions, isLoading, actions } = useHabitsData();
  const { addXP, subtractXP } = useOptimizedGamification();
  const params = useLocalSearchParams();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle quick action from home screen
  useEffect(() => {
    if (params.quickAction === 'addHabit') {
      setEditingHabit(undefined);
      setModalVisible(true);
      // Clear the quick action parameter after a brief delay to prevent re-triggering
      setTimeout(() => {
        router.replace('/(tabs)/habits');
      }, 100);
    }
  }, [params.quickAction]);

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
      // Get current completion state before toggling
      const currentCompletion = completions.find(c => c.habitId === habitId && c.date === date);
      const completion = await actions.toggleCompletion(habitId, date, isBonus);
      
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        const xpAmount = isBonus ? XP_REWARDS.HABIT.BONUS_COMPLETION : XP_REWARDS.HABIT.SCHEDULED_COMPLETION;
        const xpSource = isBonus ? XPSourceType.HABIT_BONUS : XPSourceType.HABIT_COMPLETION;
        
        if (completion && !currentCompletion) {
          // Habit was completed - award XP
          const description = isBonus ? 
            `Completed bonus habit: ${habit.name}` : 
            `Completed scheduled habit: ${habit.name}`;

          console.log(`🚀 Real-time XP: Awarding ${xpAmount} XP for ${xpSource}`);
          await addXP(xpAmount, { source: xpSource, description });
        } else if (!completion && currentCompletion) {
          // Habit was uncompleted - deduct XP
          const description = isBonus ? 
            `Uncompleted bonus habit: ${habit.name}` : 
            `Uncompleted scheduled habit: ${habit.name}`;

          console.log(`🚀 Real-time XP: Deducting ${xpAmount} XP for ${xpSource}`);
          await subtractXP(xpAmount, { source: xpSource, description });
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to toggle completion');
      setShowError(true);
    }
  };


  const handleViewHabitStats = (habitId: string) => {
    router.push(`/habit-stats?habitId=${habitId}` as any);
  };

  // Univerzální funkce pro Edit/Reorder tlačítko
  const handleEditPress = () => {
    if (Platform.OS === 'ios') {
      // Na iOS pouze přepneme lokální stav
      setIsEditMode(!isEditMode);
    } else {
      // Na Androidu navigujeme na ReorderScreen
      const activeHabits = habits.filter(habit => habit.isActive);
      router.push({
        pathname: '/reorder-habits',
        params: {
          initialItems: JSON.stringify(activeHabits),
        }
      } as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tlačítka Add a Edit/Reorder */}
      <View style={styles.addButtonContainer}>
        <View style={styles.buttonsRow}>
          {/* Na Androidu se Add tlačítko zobrazí vždy, na iOS se skryje v edit mode */}
          {(Platform.OS === 'android' || !isEditMode) && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddHabit}>
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>Add New Habit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={handleEditPress}
          >
            <Text style={styles.editButtonText}>
              {isEditMode ? 'Done' : 'Reorder'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Seznam má vlastní kontejner s flex: 1 */}
      <View style={styles.listContainer}>
        <HabitListWithCompletion
          habits={habits}
          completions={completions}
          isLoading={isLoading}
          isEditMode={Platform.OS === 'ios' ? isEditMode : false}
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