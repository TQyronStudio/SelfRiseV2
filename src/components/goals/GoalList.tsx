import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text } from 'react-native';
import { Goal } from '../../types/goal';
import { GoalItem } from './GoalItem';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../contexts/ThemeContext';

interface GoalListProps {
  goals: Goal[];
  isLoading: boolean;
  onRefresh: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onViewGoalStats: (goalId: string) => void;
  onAddProgress: (goal: Goal) => void;
  onReorderGoals: (goalOrders: Array<{ id: string; order: number }>) => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  isEditMode?: boolean;
}

export function GoalList({
  goals,
  isLoading,
  onRefresh,
  onEditGoal,
  onDeleteGoal,
  onViewGoalStats,
  onAddProgress,
  onReorderGoals,
  ListHeaderComponent,
  isEditMode = false,
}: GoalListProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const sortedGoals = [...goals].sort((a, b) => a.order - b.order);

  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  const renderGoalItem = ({ item: goal }: { item: Goal }) => (
    <GoalItem
      goal={goal}
      onEdit={() => onEditGoal(goal)}
      onDelete={() => onDeleteGoal(goal.id)}
      onViewStats={() => onViewGoalStats(goal.id)}
      onAddProgress={() => onAddProgress(goal)}
      isEditMode={isEditMode}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('goals.noGoals')}</Text>
    </View>
  );

  return (
    <FlatList
      data={sortedGoals}
      renderItem={renderGoalItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}