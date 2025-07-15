import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Goal, CreateGoalInput, UpdateGoalInput } from '@/src/types/goal';
import { GoalModal, GoalListWithDragAndDrop } from '@/src/components/goals';
import { useGoalsData } from '@/src/hooks/useGoalsData';
import { Colors } from '@/src/constants/colors';
import { useI18n } from '@/src/hooks/useI18n';
import { ErrorModal } from '@/src/components/common';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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

export function GoalsScreen() {
  const { t } = useI18n();
  const { goals, isLoading, actions } = useGoalsData();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddGoal = () => {
    setEditingGoal(undefined);
    setModalVisible(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingGoal(undefined);
  };

  const handleSubmitGoal = async (data: CreateGoalInput | UpdateGoalInput) => {
    try {
      if (editingGoal) {
        await actions.updateGoal(editingGoal.id, data as UpdateGoalInput);
      } else {
        await actions.createGoal(data as CreateGoalInput);
      }
      handleCloseModal();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save goal');
      setShowError(true);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await actions.deleteGoal(goalId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete goal');
      setShowError(true);
    }
  };

  const handleReorderGoals = async (goalOrders: Array<{ id: string; order: number }>) => {
    try {
      await actions.updateGoalOrder(goalOrders);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to reorder goals');
      setShowError(true);
    }
  };

  const handleRefresh = async () => {
    try {
      await actions.loadGoals();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to refresh goals');
      setShowError(true);
    }
  };

  const handleViewGoalStats = (goalId: string) => {
    router.push(`/goal-stats?goalId=${goalId}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GoalListWithDragAndDrop
        goals={goals}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onEditGoal={handleEditGoal}
        onDeleteGoal={handleDeleteGoal}
        onViewGoalStats={handleViewGoalStats}
        onReorderGoals={handleReorderGoals}
        ListHeaderComponent={
          <View style={styles.addButtonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>{t('goals.addGoal')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <GoalModal
        visible={modalVisible}
        goal={editingGoal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitGoal}
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