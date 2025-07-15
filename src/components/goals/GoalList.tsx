import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text } from 'react-native';
import { Goal } from '../../types/goal';
import { GoalItem } from './GoalItem';
import { Colors } from '../../constants/colors';
import { useI18n } from '../../hooks/useI18n';

interface GoalListProps {
  goals: Goal[];
  isLoading: boolean;
  onRefresh: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onViewGoalStats: (goalId: string) => void;
  onReorderGoals: (goalOrders: Array<{ id: string; order: number }>) => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export function GoalList({
  goals,
  isLoading,
  onRefresh,
  onEditGoal,
  onDeleteGoal,
  onViewGoalStats,
  onReorderGoals,
  ListHeaderComponent,
}: GoalListProps) {
  const { t } = useI18n();

  const sortedGoals = [...goals].sort((a, b) => a.order - b.order);

  const renderGoalItem = ({ item: goal }: { item: Goal }) => (
    <GoalItem
      goal={goal}
      onEdit={() => onEditGoal(goal)}
      onDelete={() => onDeleteGoal(goal.id)}
      onViewStats={() => onViewGoalStats(goal.id)}
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
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});