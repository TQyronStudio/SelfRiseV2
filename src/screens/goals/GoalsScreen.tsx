import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Goal, CreateGoalInput, UpdateGoalInput, AddGoalProgressInput, GoalStatus } from '@/src/types/goal';
import { GoalModal, GoalListWithDragAndDrop, ProgressModal, GoalCompletionModal, GoalTemplatesModal } from '@/src/components/goals';
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
    gap: 8,
    backgroundColor: Colors.background,
    zIndex: 100, // Sníženo z 1000 na 100 - stále vyšší než seznam, ale nižší než modaly
    elevation: 100, // Pro Android
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
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  templateButtonText: {
    color: Colors.primary,
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
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [progressGoal, setProgressGoal] = useState<Goal | undefined>();
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [completedGoal, setCompletedGoal] = useState<Goal | undefined>();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templateData, setTemplateData] = useState<CreateGoalInput | undefined>();

  const handleAddGoal = () => {
    setEditingGoal(undefined);
    setTemplateData(undefined);
    setModalVisible(true);
  };

  const handleAddFromTemplate = () => {
    setShowTemplatesModal(true);
  };

  const handleSelectTemplate = (selectedTemplateData: CreateGoalInput) => {
    setShowTemplatesModal(false);
    setEditingGoal(undefined);
    setTemplateData(selectedTemplateData);
    setModalVisible(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setTemplateData(undefined);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingGoal(undefined);
    setTemplateData(undefined);
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

  const handleAddProgress = (goal: Goal) => {
    setProgressGoal(goal);
    setProgressModalVisible(true);
  };

  const handleCloseProgressModal = () => {
    setProgressModalVisible(false);
    setProgressGoal(undefined);
  };

  const handleSubmitProgress = async (data: AddGoalProgressInput) => {
    try {
      const previousGoal = progressGoal;
      await actions.addProgress(data);
      
      handleCloseProgressModal();
      
      // Check if goal was completed by this progress
      if (previousGoal) {
        // Get fresh goal data immediately after state update
        const updatedGoal = goals.find(g => g.id === previousGoal.id);
        
        if (updatedGoal && 
            updatedGoal.status === GoalStatus.COMPLETED && 
            previousGoal.status !== GoalStatus.COMPLETED) {
          // Goal was just completed, show celebration
          setCompletedGoal(updatedGoal);
          setCompletionModalVisible(true);
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add progress');
      setShowError(true);
    }
  };

  const handleCloseCompletionModal = () => {
    setCompletionModalVisible(false);
    setCompletedGoal(undefined);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tlačítka Add a Template jsou nyní oddělena od seznamu */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>{t('goals.addGoal')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.templateButton} onPress={handleAddFromTemplate}>
          <Ionicons name="library-outline" size={24} color={Colors.primary} />
          <Text style={styles.templateButtonText}>{t('goals.useTemplate')}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Seznam má vlastní kontejner s flex: 1 */}
      <View style={styles.listContainer}>
        <GoalListWithDragAndDrop
          goals={goals}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onEditGoal={handleEditGoal}
          onDeleteGoal={handleDeleteGoal}
          onViewGoalStats={handleViewGoalStats}
          onAddProgress={handleAddProgress}
          onReorderGoals={handleReorderGoals}
        />
      </View>

      <GoalModal
        visible={modalVisible}
        goal={editingGoal}
        {...(templateData && { templateData })}
        onClose={handleCloseModal}
        onSubmit={handleSubmitGoal}
        isLoading={isLoading}
      />

      {progressGoal && (
        <ProgressModal
          visible={progressModalVisible}
          goal={progressGoal}
          onClose={handleCloseProgressModal}
          onSubmit={handleSubmitProgress}
          isLoading={isLoading}
        />
      )}

      {completedGoal && (
        <GoalCompletionModal
          visible={completionModalVisible}
          goal={completedGoal}
          onClose={handleCloseCompletionModal}
        />
      )}

      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        title={t('common.error')}
        message={errorMessage}
      />

      <GoalTemplatesModal
        visible={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </SafeAreaView>
  );
}