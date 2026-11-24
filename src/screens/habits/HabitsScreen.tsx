// src/screens/habits/HabitsScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoundButton, TopRow } from '@/src/components/ui/TopRow';
import { HabitsListView } from '@/src/components/habits/list/HabitsListView';
import { useFocusEffect } from '@react-navigation/native';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { router, useLocalSearchParams } from 'expo-router';
import { Habit, CreateHabitInput, UpdateHabitInput } from '@/src/types/habit';
import { HabitModal, HabitListWithCompletion } from '@/src/components/habits';
import { useHabitsData } from '@/src/hooks/useHabitsData';
// useEnhancedGamification removed - XP handled by habitStorage
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { ErrorModal } from '@/src/components/common';
// XPSourceType removed - XP handled by habitStorage

/** Room for the ad banner at the bottom (banner 50 + its padding). */
const BANNER_ROOM = 60;

export function HabitsScreen() {
  const { t } = useI18n();
  const { c } = useDesign();
  const { habits, completions, isLoading, actions } = useHabitsData();
  // addXP/subtractXP removed - XP handled by habitStorage
  const params = useLocalSearchParams();

  // Styles inside component to access theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.canvas,
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
      backgroundColor: c.canvas,
    },
  });

  const [isEditMode, setIsEditMode] = useState(false);
  // A habit just created: its card glows as it arrives (new look, E5).
  const [freshId, setFreshId] = useState<string | null>(null);

  // Reorder mode ends when the screen loses focus. A dragged item can get stuck
  // after the screen is detached and re-attached (react-native-sortables with
  // gesture-handler 2 on iOS) — leaving the mode prevents that state entirely.
  useFocusEffect(useCallback(() => () => setIsEditMode(false), []));
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

  const handleSubmitHabit = async (
    data: CreateHabitInput | UpdateHabitInput
  ) => {
    try {
      if (editingHabit) {
        await actions.updateHabit(editingHabit.id, data as UpdateHabitInput);
      } else {
        const created = await actions.createHabit(data as CreateHabitInput);
        setFreshId(created.id);
        // The glow plays once (about 2 s); a later remount must not replay it.
        setTimeout(
          () => setFreshId(prev => (prev === created.id ? null : prev)),
          3000
        );
      }
      handleCloseModal();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('habits.errors.failedToSave')
      );
      setShowError(true);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    // This is now handled by HabitItemWithCompletion - no duplicate confirmation needed
    try {
      await actions.deleteHabit(habitId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('habits.errors.failedToDelete')
      );
      setShowError(true);
    }
  };

  const handleToggleActive = async (habitId: string, isActive: boolean) => {
    try {
      await actions.updateHabit(habitId, { isActive });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('habits.errors.failedToUpdate')
      );
      setShowError(true);
    }
  };

  const handleReorderHabits = async (
    habitOrders: Array<{ id: string; order: number }>
  ) => {
    try {
      await actions.updateHabitOrder(habitOrders);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('habits.errors.failedToReorder')
      );
      setShowError(true);
    }
  };

  const handleToggleCompletion = async (
    habitId: string,
    date: string,
    isBonus: boolean
  ) => {
    try {
      // Get current completion state before toggling
      const currentCompletion = completions.find(
        c => c.habitId === habitId && c.date === date
      );
      const completion = await actions.toggleCompletion(habitId, date, isBonus);

      // XP is now handled entirely by HabitStorage - no dual system
      console.log(
        `✅ Habit completion toggled successfully - XP handled by storage layer`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('habits.errors.failedToToggle')
      );
      setShowError(true);
    }
  };

  const handleViewHabitStats = (habitId: string) => {
    router.push(`/habit-stats?habitId=${habitId}` as any);
  };

  // Přepnutí inline edit/reorder módu (stejné chování na iOS i Android)
  const handleEditPress = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Top row: the level badge comes in E7; the screen's buttons on the right. */}
      <TopRow>
        {isEditMode ? (
          <RoundButton
            icon="checkmark"
            tone="primary"
            label={t('habits.done')}
            onPress={handleEditPress}
          />
        ) : (
          <>
            <RoundButton
              icon="swap-vertical"
              label={t('habits.reorder')}
              onPress={handleEditPress}
            />
            <RoundButton
              icon="add"
              tone="primary"
              label={t('habits.addHabit')}
              onPress={handleAddHabit}
            />
          </>
        )}
      </TopRow>

      {isEditMode ? (
        // Reordering keeps the proven drag list until its own stage (E6).
        <View style={styles.listContainer}>
          <HabitListWithCompletion
            habits={habits}
            completions={completions}
            isLoading={isLoading}
            isEditMode
            onEditHabit={handleEditHabit}
            onDeleteHabit={handleDeleteHabit}
            onToggleActive={handleToggleActive}
            onToggleCompletion={handleToggleCompletion}
            onReorderHabits={handleReorderHabits}
            onViewHabitStats={handleViewHabitStats}
          />
        </View>
      ) : (
        <HabitsListView
          bottomInset={BANNER_ROOM}
          freshId={freshId}
          onToggleCompletion={handleToggleCompletion}
          onOpenStats={handleViewHabitStats}
          onEdit={handleEditHabit}
          onToggleActive={handleToggleActive}
          onDelete={handleDeleteHabit}
        />
      )}

      {/* AdMob Banner - Fixed at bottom */}
      <View style={styles.bannerContainer}>
        <AdBanner />
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
