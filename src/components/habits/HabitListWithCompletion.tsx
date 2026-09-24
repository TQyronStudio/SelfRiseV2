import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { ReorderableList } from '@/src/components/common/ReorderableList';
import { Habit, HabitCompletion } from '@/src/types/habit';
import { HabitItemWithCompletion } from './HabitItemWithCompletion';
import { formatDateToString } from '@/src/utils/date';
import { Fonts } from '@/src/constants/fonts';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';

interface HabitListWithCompletionProps {
  habits: Habit[];
  completions: HabitCompletion[];
  isLoading: boolean;
  isEditMode: boolean;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleActive: (habitId: string, isActive: boolean) => void;
  onToggleCompletion: (habitId: string, date: string, isBonus: boolean) => Promise<void>;
  onReorderHabits: (habitOrders: Array<{ id: string; order: number }>) => void;
  onViewHabitStats: (habitId: string) => void;
  date?: string;
  ListHeaderComponent?: React.ReactElement;
}

// Interface pro unified data strukturu
interface ListItem {
  type: 'HEADER' | 'ACTIVE_HABIT' | 'INACTIVE_TITLE' | 'INACTIVE_HABIT' | 'EMPTY_STATE';
  habit?: Habit;
  id: string;
}

export function HabitListWithCompletion({
  habits,
  completions,
  isLoading,
  isEditMode,
  onEditHabit,
  onDeleteHabit,
  onToggleActive,
  onToggleCompletion,
  onReorderHabits,
  onViewHabitStats,
  date = formatDateToString(new Date()),
  ListHeaderComponent,
}: HabitListWithCompletionProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  // Reorder mode needs the page's scroll view for auto-scroll at the edges.
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  // 1. Filtrování a řazení návyků
  const activeHabits = habits
    .filter(habit => habit.isActive)
    .sort((a, b) => a.order - b.order);

  const inactiveHabits = habits
    .filter(habit => !habit.isActive)
    .sort((a, b) => a.order - b.order);



  // 3. Získání dnešních splnění (memoizováno — zabrání invalidaci renderItem callbacků per render)
  const todayCompletions = useMemo(
    () => completions.filter(completion => completion.date === date),
    [completions, date]
  );
  const getHabitCompletion = useCallback(
    (habitId: string): HabitCompletion | undefined => {
      return todayCompletions.find(completion => completion.habitId === habitId);
    },
    [todayCompletions]
  );

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    content: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: Fonts.semibold,
      color: colors.text,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    habitContainer: {
      paddingHorizontal: 16,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 24,
      minHeight: 300,
    },
    emptyStateText: {
      fontSize: 18,
      fontFamily: Fonts.semibold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }), [colors]);

  // Renderovací funkce pro aktivní návyky (pro FlatList) - MEMOIZED
  const renderActiveHabitItem = useCallback(({ item }: { item: Habit }) => {
    return (
      <View style={styles.habitContainer}>
        <HabitItemWithCompletion
          habit={item}
          completion={getHabitCompletion(item.id)}
          onEdit={onEditHabit}
          onDelete={onDeleteHabit}
          onToggleActive={onToggleActive}
          onToggleCompletion={onToggleCompletion}
          onReorder={onReorderHabits}
          onViewStats={onViewHabitStats}
          isEditMode={false}
          date={date}
        />
      </View>
    );
  }, [
    styles, getHabitCompletion, onEditHabit, onDeleteHabit, onToggleActive,
    onToggleCompletion, onReorderHabits, onViewHabitStats, isEditMode, date
  ]);

  // Renderovací funkce pro režim řazení (úchyt místo celé karty) - MEMOIZED
  const renderReorderableHabitItem = useCallback((item: Habit) => {
    return (
      <View style={styles.habitContainer}>
        <HabitItemWithCompletion
          habit={item}
          completion={getHabitCompletion(item.id)}
          onEdit={onEditHabit}
          onDelete={onDeleteHabit}
          onToggleActive={onToggleActive}
          onToggleCompletion={onToggleCompletion}
          onReorder={onReorderHabits}
          onViewStats={onViewHabitStats}
          showReorderHandle={true}
          isEditMode={isEditMode}
          date={date}
        />
      </View>
    );
  }, [
    styles, getHabitCompletion, onEditHabit, onDeleteHabit, onToggleActive,
    onToggleCompletion, onReorderHabits, onViewHabitStats, isEditMode, date
  ]);

  // Memoized keyExtractor pro režim řazení
  const reorderableKeyExtractor = useCallback((item: Habit) => {
    if (!item.id || typeof item.id !== 'string') {
      console.error('[ReorderableList] CHYBNÝ KLÍČ!', item);
    }
    return item.id;
  }, []);

  // Memoized keyExtractor pro FlatList
  const flatListKeyExtractor = useCallback((item: Habit, index: number) => {
    if (!item.id || typeof item.id !== 'string') {
      console.error('[FlatList] CHYBNÝ KLÍČ!', item);
    }
    return item.id;
  }, []);

  // Animated.ScrollView: v režimu řazení ji seznam sám posouvá u okraje
  return (
    <Animated.ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled={true} // Řeší VirtualizedList warning
    >
      {/* Header */}
      {ListHeaderComponent}

      {/* Active Habits Section - Platform Specific Drag & Drop */}
      {activeHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('habits.activeHabits')}</Text>
          {isEditMode ? (
            <ReorderableList
              data={activeHabits}
              keyExtractor={reorderableKeyExtractor}
              renderItem={renderReorderableHabitItem}
              onReorder={onReorderHabits}
              scrollableRef={scrollViewRef}
            />
          ) : (
            /* Android + iOS normal mode: Vždy FlatList */
            <FlatList
              data={activeHabits}
              renderItem={renderActiveHabitItem}
              keyExtractor={flatListKeyExtractor}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              windowSize={5}
              maxToRenderPerBatch={5}
              initialNumToRender={7}
            />
          )}
        </View>
      )}

      {/* Inactive Habits Section - No Drag & Drop */}
      {inactiveHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('habits.inactiveHabits')}</Text>
          {inactiveHabits.map((habit) => (
            <View key={habit.id} style={styles.habitContainer}>
              <HabitItemWithCompletion
                habit={habit}
                completion={getHabitCompletion(habit.id)}
                onEdit={onEditHabit}
                onDelete={onDeleteHabit}
                onToggleActive={onToggleActive}
                onToggleCompletion={onToggleCompletion}
                onReorder={onReorderHabits}
                onViewStats={onViewHabitStats}
                isEditMode={false}
                date={date}
              />
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('habits.emptyStateWithCompletion.title')}</Text>
          <Text style={styles.emptyStateSubtext}>{t('habits.emptyStateWithCompletion.subtitle')}</Text>
        </View>
      )}
    </Animated.ScrollView>
  );
}