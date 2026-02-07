import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Goal, CreateGoalInput, UpdateGoalInput, AddGoalProgressInput, GoalStatus } from '@/src/types/goal';
import { GoalModal, GoalListWithDragAndDrop, ProgressModal, GoalCompletionModal, GoalTemplatesModal } from '@/src/components/goals';
import { useGoalsData } from '@/src/hooks/useGoalsData';
// useEnhancedGamification removed - XP handled by goalStorage
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { ErrorModal, HelpTooltip } from '@/src/components/common';
// XPSourceType removed - XP handled by goalStorage
import { XP_REWARDS } from '@/src/constants/gamification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { goalStorage } from '@/src/services/storage/goalStorage';
import { useTutorialTarget } from '@/src/utils/TutorialTargetHelper';
import { useXpAnimation } from '@/src/contexts/XpAnimationContext';
import { dropGoalsTables } from '@/src/utils/dropGoalsTables';
import { getDatabase } from '@/src/services/database/init';

export function GoalsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { goals, isLoading, actions } = useGoalsData();
  // addXP removed - XP handled by goalStorage
  const params = useLocalSearchParams();
  const { notifyActivityModalStarted, notifyActivityModalEnded } = useXpAnimation();

  // Styles inside component to access theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    addButtonContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 8,
      backgroundColor: colors.backgroundSecondary,
    },
    buttonsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    listContainer: {
      flex: 1, // Klíčová oprava - seznam zabere pouze zbývající místo
      paddingBottom: 60, // Extra padding for banner
    },
    bannerContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.backgroundSecondary,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
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
      backgroundColor: colors.cardBackgroundElevated,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    templateButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackgroundElevated,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    editButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  // Tutorial target registration for Add Goal button
  const addGoalButtonRef = useRef<View>(null);
  const { registerTarget: registerAddGoalButton, unregisterTarget: unregisterAddGoalButton } = useTutorialTarget(
    'add-goal-button',
    addGoalButtonRef
  );
  
  const [isEditMode, setIsEditMode] = useState(false);
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

  // This useEffect is now disabled - goal completion detection moved to handleSubmitProgress
  // for immediate priority over level-up modals
  // useEffect(() => { ... }, [goals, completionModalVisible]);

  // Tutorial target registration
  useEffect(() => {
    registerAddGoalButton();

    return () => {
      unregisterAddGoalButton();
    };
  }, [registerAddGoalButton, unregisterAddGoalButton]);

  // Handle quick action from home screen
  useEffect(() => {
    if (params.quickAction === 'addGoal') {
      setEditingGoal(undefined);
      setTemplateData(undefined);
      setModalVisible(true);
      // Clear the quick action parameter after a brief delay to prevent re-triggering
      setTimeout(() => {
        router.replace('/(tabs)/goals');
      }, 100);
    }
  }, [params.quickAction]);

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
      setErrorMessage(error instanceof Error ? error.message : t('common.errors.goals.failedToSave'));
      setShowError(true);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await actions.deleteGoal(goalId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.errors.goals.failedToDelete'));
      setShowError(true);
    }
  };

  const handleReorderGoals = async (goalOrders: Array<{ id: string; order: number }>) => {
    try {
      await actions.updateGoalOrder(goalOrders);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.errors.goals.failedToReorder'));
      setShowError(true);
    }
  };


  const handleViewGoalStats = (goalId: string) => {
    router.push(`/goal-stats?goalId=${goalId}` as any);
  };

  const handleAddProgress = (goal: Goal) => {
    notifyActivityModalStarted('goal');
    setProgressGoal(goal);
    setProgressModalVisible(true);
  };

  const handleCloseProgressModal = () => {
    setProgressModalVisible(false);
    setProgressGoal(undefined);
    // Delay notifyActivityModalEnded to let Modal close animation finish
    // This prevents level-up modal from showing while ProgressModal is still animating
    setTimeout(() => {
      notifyActivityModalEnded();
    }, 500);
  };

  const handleSubmitProgress = async (data: AddGoalProgressInput) => {
    try {
      const previousGoal = progressGoal;
      const newProgress = await actions.addProgress(data);

      // XP is now handled entirely by GoalStorage.awardGoalProgressXP - no dual system
      console.log(`✅ Goal progress added successfully - XP handled by storage layer`);

      // Close progress modal visually (DON'T call handleCloseProgressModal - it notifies activity ended)
      // We keep activity modal registered until the entire flow is done
      setProgressModalVisible(false);
      setProgressGoal(undefined);

      // Check if goal was completed by this progress - IMMEDIATE detection
      let goalCompleted = false;
      if (previousGoal) {
        // Get fresh goal data from storage immediately
        const freshGoal = await goalStorage.getById(previousGoal.id);

        if (freshGoal &&
            freshGoal.status === GoalStatus.COMPLETED &&
            previousGoal.status !== GoalStatus.COMPLETED) {
          goalCompleted = true;
          console.log(`🎉 IMMEDIATE goal completion detected: ${freshGoal.title}`);

          // Show completion modal - activity modal stays registered
          setCompletedGoal(freshGoal);
          setCompletionModalVisible(true);

          // Save to persistent storage to prevent re-showing
          const SHOWN_CELEBRATIONS_KEY = 'goal_completion_celebrations_shown';
          const storedCelebrations = await AsyncStorage.getItem(SHOWN_CELEBRATIONS_KEY);
          const shownCelebrations = new Set<string>(
            storedCelebrations ? JSON.parse(storedCelebrations) : []
          );
          const celebrationKey = `${freshGoal.id}_${freshGoal.completedDate}`;
          shownCelebrations.add(celebrationKey);
          await AsyncStorage.setItem(
            SHOWN_CELEBRATIONS_KEY,
            JSON.stringify(Array.from(shownCelebrations))
          );
        }
      }

      // Only notify activity ended if no completion modal was opened
      // If completion modal opened, it will notify when it closes
      if (!goalCompleted) {
        setTimeout(() => {
          notifyActivityModalEnded();
        }, 500);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.errors.goals.failedToAddProgress'));
      setShowError(true);
      // On error, still notify activity ended
      setTimeout(() => {
        notifyActivityModalEnded();
      }, 500);
    }
  };

  const handleCloseCompletionModal = () => {
    setCompletionModalVisible(false);
    setCompletedGoal(undefined);
    // GoalCompletionModal handles notifyActivityModalEnded internally via notifyPrimaryModalEnded
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Tlačítka Add, Template a Edit */}
      <View style={styles.addButtonContainer}>
        {!isEditMode && (
          <>
            <View ref={addGoalButtonRef} nativeID="add-goal-button">
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddGoal}
              >
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.addButtonText}>{t('goals.addGoal')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.templateButton} onPress={handleAddFromTemplate}>
              <Ionicons name="library-outline" size={24} color={colors.primary} />
              <Text style={styles.templateButtonText}>{t('goals.useTemplate')}</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditMode(!isEditMode)}
        >
          <Text style={styles.editButtonText}>
            {isEditMode ? t('goals.actions.done') : t('goals.actions.reorder')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Seznam má vlastní kontejner s flex: 1 */}
      <View style={styles.listContainer}>
        <GoalListWithDragAndDrop
          goals={goals}
          isLoading={isLoading}
          isEditMode={isEditMode}
          onEditGoal={handleEditGoal}
          onDeleteGoal={handleDeleteGoal}
          onViewGoalStats={handleViewGoalStats}
          onAddProgress={handleAddProgress}
          onReorderGoals={handleReorderGoals}
        />
      </View>

      {/* AdMob Banner - Fixed at bottom */}
      <View style={styles.bannerContainer}>
        <AdBanner />
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