import React from 'react';
import { View, StyleSheet, ScrollView, Text, FlatList } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { ReorderableList } from '../common/ReorderableList';
import { Goal, GoalStatus } from '../../types/goal';
import { GoalItem } from './GoalItem';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../contexts/ThemeContext';
import { HelpTooltip } from '../common/HelpTooltip';

interface GoalListWithDragAndDropProps {
  goals: Goal[];
  isLoading: boolean;
  isEditMode: boolean;
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
  isEditMode,
  onEditGoal,
  onDeleteGoal,
  onViewGoalStats,
  onAddProgress,
  onReorderGoals,
  ListHeaderComponent,
}: GoalListWithDragAndDropProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  // Reorder mode needs the page's scroll view for auto-scroll at the edges.
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    content: {
      flexGrow: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
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
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  // Separate active and completed goals
  const activeGoals = goals.filter(goal => goal.status === GoalStatus.ACTIVE).sort((a, b) => a.order - b.order);
  const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED).sort((a, b) => a.order - b.order);
  const otherGoals = goals.filter(goal => goal.status !== GoalStatus.ACTIVE && goal.status !== GoalStatus.COMPLETED).sort((a, b) => a.order - b.order);

  // Renderovací funkce pro FlatList
  const renderActiveGoalItem = ({ item: goal }: { item: Goal }) => (
    <View style={styles.goalItemContainer}>
      <GoalItem
        goal={goal}
        onEdit={() => onEditGoal(goal)}
        onDelete={() => onDeleteGoal(goal.id)}
        onViewStats={() => onViewGoalStats(goal.id)}
        onAddProgress={() => onAddProgress(goal)}
        isEditMode={isEditMode}
      />
    </View>
  );

  // Renderovací funkce pro režim řazení (úchyt místo celé karty)
  const renderReorderableGoalItem = (goal: Goal) => (
    <View style={styles.goalItemContainer}>
      <GoalItem
        goal={goal}
        onEdit={() => onEditGoal(goal)}
        onDelete={() => onDeleteGoal(goal.id)}
        onViewStats={() => onViewGoalStats(goal.id)}
        onAddProgress={() => onAddProgress(goal)}
        showReorderHandle={true}
        isEditMode={isEditMode}
      />
    </View>
  );

  const goalKeyExtractor = (goal: Goal) => goal.id;

  const renderStaticGoalItem = (goal: Goal) => (
    <View key={goal.id} style={styles.goalItemContainer}>
      <GoalItem
        goal={goal}
        onEdit={() => onEditGoal(goal)}
        onDelete={() => onDeleteGoal(goal.id)}
        onViewStats={() => onViewGoalStats(goal.id)}
        onAddProgress={() => onAddProgress(goal)}
        isEditMode={isEditMode}
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
      >
        {ListHeaderComponent}
        {renderEmpty()}
      </ScrollView>
    );
  }

  // Animated.ScrollView: v režimu řazení ji seznam sám posouvá u okraje
  return (
    <Animated.ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled={true}
    >
      {ListHeaderComponent}

      {/* Active Goals Section - Conditional Drag & Drop */}
      {activeGoals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{t('goals.sections.activeGoals')}</Text>
            <HelpTooltip
              helpKey="goals.overview"
              iconSize={14}
              maxWidth={300}
              variant="default"
            />
          </View>
          {isEditMode ? (
            <ReorderableList
              data={activeGoals}
              keyExtractor={goalKeyExtractor}
              renderItem={renderReorderableGoalItem}
              onReorder={onReorderGoals}
              scrollableRef={scrollViewRef}
            />
          ) : (
            <FlatList
              data={activeGoals}
              renderItem={renderActiveGoalItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              windowSize={5}
              maxToRenderPerBatch={5}
              initialNumToRender={5}
            />
          )}
        </View>
      )}

      {/* Completed Goals Section - No Drag & Drop */}
      {completedGoals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('goals.sections.completedGoals')}</Text>
          {completedGoals.map(renderStaticGoalItem)}
        </View>
      )}

      {/* Other Goals Section - No Drag & Drop */}
      {otherGoals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('goals.sections.otherGoals')}</Text>
          {otherGoals.map(renderStaticGoalItem)}
        </View>
      )}
    </Animated.ScrollView>
  );
}