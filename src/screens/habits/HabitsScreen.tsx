// src/screens/habits/HabitsScreen.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoundButton, TopRow } from '@/src/components/ui/TopRow';
import { HabitsListView } from '@/src/components/habits/list/HabitsListView';
import { HabitsReorderView } from '@/src/components/habits/list/HabitsReorderView';
import { HabitDetail } from '@/src/components/habits/detail/HabitDetail';
import { HabitComposer } from '@/src/components/habits/composer/HabitComposer';
import { DetailRect } from '@/src/components/ui';
import { useFocusEffect } from '@react-navigation/native';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { router, useLocalSearchParams } from 'expo-router';
import { Habit, CreateHabitInput, UpdateHabitInput } from '@/src/types/habit';
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
  const { habits, completions, actions } = useHabitsData();
  // addXP/subtractXP removed - XP handled by habitStorage
  const params = useLocalSearchParams();

  // Styles inside component to access theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.canvas,
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

  // The composer (E6) keeps itself open until this resolves; a throw keeps the
  // user's input in the sheet with its own error line.
  const handleSubmitHabit = async (
    data: CreateHabitInput | UpdateHabitInput
  ) => {
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

  // The habit detail grows out of its card (E6; replaces the habit-stats route,
  // whose files go in E26). Origin in the window → relative to this screen.
  const rootRef = useRef<View>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [detail, setDetail] = useState<{
    habitId: string;
    origin: DetailRect;
  } | null>(null);
  const handleViewHabitStats = (
    habitId: string,
    origin: DetailRect | null = null
  ) => {
    const fallback = {
      x: pageSize.width / 2 - 40,
      y: pageSize.height / 3,
      width: 80,
      height: 80,
    };
    if (!origin || !rootRef.current) {
      setDetail({ habitId, origin: fallback });
      return;
    }
    rootRef.current.measureInWindow((px, py) =>
      setDetail({
        habitId,
        origin: { ...origin, x: origin.x - px, y: origin.y - py },
      })
    );
  };
  const detailHabit = detail
    ? habits.find(h => h.id === detail.habitId)
    : undefined;

  // Přepnutí inline edit/reorder módu (stejné chování na iOS i Android)
  const handleEditPress = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <SafeAreaView
      ref={rootRef}
      style={styles.container}
      edges={[]}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setPageSize(prev =>
          prev.width === width && prev.height === height
            ? prev
            : { width, height }
        );
      }}
    >
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
        // New look (E6 point 3); the drag rules are ReorderableList's, unchanged.
        <HabitsReorderView
          habits={habits}
          bottomInset={BANNER_ROOM}
          onReorder={handleReorderHabits}
        />
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

      {detail && detailHabit && pageSize.width > 0 && (
        <HabitDetail
          habit={detailHabit}
          origin={detail.origin}
          size={pageSize}
          bottomInset={BANNER_ROOM}
          onClosed={() => setDetail(null)}
        />
      )}

      {modalVisible && (
        <HabitComposer
          habit={editingHabit}
          bottomInset={BANNER_ROOM}
          onSubmit={handleSubmitHabit}
          onClosed={handleCloseModal}
        />
      )}

      {/* AdMob Banner - Fixed at bottom — stays above the detail and the composer */}
      <View style={styles.bannerContainer}>
        <AdBanner />
      </View>



      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        title={t('common.error')}
        message={errorMessage}
      />
    </SafeAreaView>
  );
}
