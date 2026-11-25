/**
 * The Goals tab (migration E14: the page is GoalsPage — overview, deadline line,
 * pace cards with one-tap logging and Undo; reorder mode GoalsReorderView).
 *
 * This screen keeps the DATA rules (technical-guides:Goals.md):
 * - a log goes through GoalsContext.addProgress → SQLiteGoalStorage (XP, the
 *   daily cap, milestones, completion); a log that completes the goal enqueues
 *   the goal_completion window, read against the goal's status BEFORE the log;
 * - Undo deletes the entry through the existing path (its XP reversal included);
 * - errors are one calm sentence in the ProblemNote bar, never error.message.
 * Creating and editing still use GoalModal and the templates modal until E15
 * moves both into one composer.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoundButton, TopRow } from '@/src/components/ui/TopRow';
import { useProblemNote } from '@/src/components/ui';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { GoalModal, GoalTemplatesModal } from '@/src/components/goals';
import { GoalsPage } from '@/src/components/goals/page/GoalsPage';
import { GoalsReorderView } from '@/src/components/goals/page/GoalsReorderView';
import {
  AddGoalProgressInput,
  CreateGoalInput,
  Goal,
  GoalStatus,
  UpdateGoalInput,
} from '@/src/types/goal';
import { useGoalsData } from '@/src/hooks/useGoalsData';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { useModalQueue, ModalPriority } from '@/src/contexts/ModalQueueContext';
// The feature-flag-aware storage (SQLite): the legacy AsyncStorage goalStorage
// returned null for goals living in SQLite, so the completion never fired.
import { getGoalStorageImpl } from '@/src/config/featureFlags';
import { today as todayString } from '@/src/utils/date';

const goalStorage = getGoalStorageImpl();

/** Room for the ad banner at the bottom (banner 50 + its padding). */
const BANNER_ROOM = 60;

export function GoalsScreen() {
  const { t } = useI18n();
  const { c } = useDesign();
  const { goals, actions } = useGoalsData();
  const params = useLocalSearchParams();
  const { enqueue: enqueueModal } = useModalQueue();
  const { showProblem } = useProblemNote();
  // Actions of the newest render: Undo comes seconds after the log, and the
  // context's deleteProgress looks the entry up in its own (render's) state.
  const latestActions = useRef(actions);
  latestActions.current = actions;

  const [isEditMode, setIsEditMode] = useState(false);
  // Reorder mode ends when the screen loses focus. A dragged item can get stuck
  // after the screen is detached and re-attached (react-native-sortables with
  // gesture-handler 2 on iOS) — leaving the mode prevents that state entirely.
  useFocusEffect(useCallback(() => () => setIsEditMode(false), []));

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [templateData, setTemplateData] = useState<CreateGoalInput | undefined>();
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [freshId, setFreshId] = useState<string | null>(null);

  // A quick action from Home opens the new-goal window.
  useEffect(() => {
    if (params.quickAction === 'addGoal') {
      setEditingGoal(undefined);
      setTemplateData(undefined);
      setModalVisible(true);
      // Clear the parameter after a moment so it does not fire again.
      setTimeout(() => router.replace('/(tabs)/goals'), 100);
    }
  }, [params.quickAction]);

  const glow = (id: string) => {
    setFreshId(null);
    setTimeout(() => setFreshId(id), 0);
    // The glow plays once (about 2 s); a later remount must not replay it.
    setTimeout(() => setFreshId(prev => (prev === id ? null : prev)), 3000);
  };

  const handleAddGoal = () => {
    setEditingGoal(undefined);
    setTemplateData(undefined);
    setModalVisible(true);
  };

  const handleSelectTemplate = (selected: CreateGoalInput) => {
    setShowTemplatesModal(false);
    setEditingGoal(undefined);
    setTemplateData(selected);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingGoal(undefined);
    setTemplateData(undefined);
  };

  /** The completion window (through the queue), remembered so it never shows twice. */
  const celebrateCompletion = async (goal: Goal) => {
    enqueueModal({
      type: 'goal_completion',
      priority: ModalPriority.GOAL_COMPLETION,
      props: { goal },
    });
    const SHOWN_CELEBRATIONS_KEY = 'goal_completion_celebrations_shown';
    const stored = await AsyncStorage.getItem(SHOWN_CELEBRATIONS_KEY);
    const shown = new Set<string>(stored ? JSON.parse(stored) : []);
    shown.add(`${goal.id}_${goal.completedDate}`);
    await AsyncStorage.setItem(SHOWN_CELEBRATIONS_KEY, JSON.stringify(Array.from(shown)));
  };

  const handleSubmitGoal = async (data: CreateGoalInput | UpdateGoalInput) => {
    try {
      if (editingGoal) {
        const updated = await actions.updateGoal(editingGoal.id, data as UpdateGoalInput);
        // Lowering the target under the progress completes the goal (storage
        // pays the XP) — it gets its window like a completion by progress.
        if (updated.status === GoalStatus.COMPLETED && editingGoal.status !== GoalStatus.COMPLETED) {
          await celebrateCompletion(updated);
        }
        glow(updated.id);
      } else {
        const created = await actions.createGoal(data as CreateGoalInput);
        glow(created.id);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Goal not saved:', error);
      showProblem({ message: t('goals.errors.saveFailed') });
    }
  };

  const handleDeleteGoal = async (goal: Goal) => {
    try {
      // The XP the goal earned stays (technical-guides:Goals.md).
      await actions.deleteGoal(goal.id);
    } catch (error) {
      console.error('Goal not deleted:', error);
      showProblem({ message: t('goals.errors.deleteFailed') });
    }
  };

  const handleReorderGoals = async (orders: Array<{ id: string; order: number }>) => {
    try {
      await actions.updateGoalOrder(orders);
    } catch (error) {
      console.error('Goals not reordered:', error);
      showProblem({ message: t('goals.errors.reorderFailed') });
    }
  };

  /**
   * One log, everything the old progress form did: the storage pays XP,
   * milestones and the completion; a log that completed the goal gets its window
   * (E14 point 5 — a goal finished with one tap is celebrated too).
   */
  const handleLog = async (goal: Goal, input: AddGoalProgressInput): Promise<string | null> => {
    try {
      // The status BEFORE this log, from storage: two fast taps must not
      // celebrate one completion twice.
      const before = await goalStorage.getById(goal.id);
      const progress = await latestActions.current.addProgress(input);
      const after = await goalStorage.getById(goal.id);
      if (
        after &&
        after.status === GoalStatus.COMPLETED &&
        before?.status !== GoalStatus.COMPLETED
      ) {
        await celebrateCompletion(after);
      }
      return progress.id;
    } catch (error) {
      console.error('Goal progress not saved:', error);
      showProblem({ message: t('goals.errors.logFailed') });
      return null;
    }
  };

  const handleUndo = async (progressId: string) => {
    try {
      // The existing delete path: it reverses the entry's XP and recalculates
      // the goal (a completion it caused is undone; milestones stay paid).
      await latestActions.current.deleteProgress(progressId);
    } catch (error) {
      console.error('Goal progress not undone:', error);
      showProblem({ message: t('goals.errors.undoFailed') });
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.canvas },
    banner: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: c.canvas },
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <TopRow>
        {isEditMode ? (
          <RoundButton icon="checkmark" tone="primary" label={t('goals.actions.done')} onPress={() => setIsEditMode(false)} />
        ) : (
          <>
            {goals.length > 1 && (
              <RoundButton icon="swap-vertical" label={t('goals.actions.reorder')} onPress={() => setIsEditMode(true)} />
            )}
            {/* Until E15 puts the ideas inside the new-goal window. */}
            <RoundButton icon="library-outline" label={t('goals.useTemplate')} onPress={() => setShowTemplatesModal(true)} />
            <RoundButton icon="add" tone="primary" label={t('goals.addGoal')} onPress={handleAddGoal} />
          </>
        )}
      </TopRow>

      {isEditMode ? (
        <GoalsReorderView goals={goals} bottomInset={BANNER_ROOM} onReorder={handleReorderGoals} />
      ) : (
        <GoalsPage
          goals={goals}
          today={todayString()}
          bottomInset={BANNER_ROOM}
          freshId={freshId}
          onLog={handleLog}
          onUndo={handleUndo}
          onOpenDetail={goal => router.push(`/goal-stats?goalId=${goal.id}` as never)}
          onEdit={goal => {
            setEditingGoal(goal);
            setTemplateData(undefined);
            setModalVisible(true);
          }}
          onDelete={handleDeleteGoal}
        />
      )}

      {/* AdMob banner, fixed at the bottom */}
      <View style={styles.banner}>
        <AdBanner />
      </View>

      <GoalModal
        visible={modalVisible}
        goal={editingGoal}
        {...(templateData && { templateData })}
        onClose={handleCloseModal}
        onSubmit={handleSubmitGoal}
        isLoading={false}
      />

      <GoalTemplatesModal
        visible={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </SafeAreaView>
  );
}
