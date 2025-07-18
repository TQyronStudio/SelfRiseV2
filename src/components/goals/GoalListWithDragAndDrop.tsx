import React, { useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, FlatList } from 'react-native';
// import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist'; // DOČASNĚ VYPNUTO - ZPŮSOBUJE KONFLIKTY
import { Goal, GoalStatus } from '../../types/goal';
import { GoalItem } from './GoalItem';
import { Colors } from '../../constants/colors';
import { useI18n } from '../../hooks/useI18n';

interface GoalListWithDragAndDropProps {
  goals: Goal[];
  isLoading: boolean;
  onRefresh: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onViewGoalStats: (goalId: string) => void;
  onAddProgress: (goal: Goal) => void;
  onReorderGoals: (goalOrders: Array<{ id: string; order: number }>) => void;
  ListHeaderComponent?: React.ReactNode;
}

export function GoalListWithDragAndDrop({
  goals,
  isLoading,
  onRefresh,
  onEditGoal,
  onDeleteGoal,
  onViewGoalStats,
  onAddProgress,
  onReorderGoals,
  ListHeaderComponent,
}: GoalListWithDragAndDropProps) {
  const { t } = useI18n();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Separate active and completed goals
  const activeGoals = goals.filter(goal => goal.status === GoalStatus.ACTIVE).sort((a, b) => a.order - b.order);
  const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED).sort((a, b) => a.order - b.order);
  const otherGoals = goals.filter(goal => goal.status !== GoalStatus.ACTIVE && goal.status !== GoalStatus.COMPLETED).sort((a, b) => a.order - b.order);

  const handleDragBegin = () => {
    setIsDragging(true);
    scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
  };

  const handleActiveDragEnd = ({ data }: { data: Goal[] }) => {
    setIsDragging(false);
    scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    
    // Update order for active goals
    const goalOrders = data.map((goal, index) => ({
      id: goal.id,
      order: index,
    }));
    
    onReorderGoals(goalOrders);
  };

  const renderActiveGoalItem = ({ item: goal }: { item: Goal }) => (
    <View style={styles.goalItemContainer}>
      <GoalItem
        goal={goal}
        onEdit={() => onEditGoal(goal)}
        onDelete={() => onDeleteGoal(goal.id)}
        onViewStats={() => onViewGoalStats(goal.id)}
        onAddProgress={() => onAddProgress(goal)}
        onDrag={undefined}
        isDragging={false}
      />
    </View>
  );

  const renderStaticGoalItem = (goal: Goal) => (
    <View key={goal.id} style={styles.goalItemContainer}>
      <GoalItem
        goal={goal}
        onEdit={() => onEditGoal(goal)}
        onDelete={() => onDeleteGoal(goal.id)}
        onViewStats={() => onViewGoalStats(goal.id)}
        onAddProgress={() => onAddProgress(goal)}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('goals.noGoals')}</Text>
    </View>
  );

  if (goals.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {ListHeaderComponent}
        {renderEmpty()}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled={true}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      {ListHeaderComponent}

      {/* Active Goals Section with Drag & Drop */}
      {activeGoals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          <FlatList
            data={activeGoals}
            renderItem={renderActiveGoalItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />
        </View>
      )}

      {/* Completed Goals Section - No Drag & Drop */}
      {completedGoals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed Goals</Text>
          {completedGoals.map(renderStaticGoalItem)}
        </View>
      )}

      {/* Other Goals Section - No Drag & Drop */}
      {otherGoals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Goals</Text>
          {otherGoals.map(renderStaticGoalItem)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  goalItemContainer: {
    marginBottom: 12,
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