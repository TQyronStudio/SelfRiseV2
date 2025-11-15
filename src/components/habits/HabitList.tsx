import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Habit } from '../../types/habit';
import { HabitItem } from './HabitItem';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../contexts/ThemeContext';

interface HabitListProps {
  habits: Habit[];
  isLoading: boolean;
  onRefresh: () => void;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleActive: (habitId: string, isActive: boolean) => void;
  onReorderHabits: (habitOrders: Array<{ id: string; order: number }>) => void;
}

export function HabitList({
  habits,
  isLoading,
  onRefresh,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onToggleActive,
  onReorderHabits,
}: HabitListProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const activeHabits = habits.filter(habit => habit.isActive);
  const inactiveHabits = habits.filter(habit => !habit.isActive);


  const renderHabitItem = ({ item, drag, isActive }: RenderItemParams<Habit>) => (
    <HabitItem
      habit={item}
      onEdit={onEditHabit}
      onDelete={onDeleteHabit}
      onToggleActive={onToggleActive}
      onReorder={onReorderHabits}
      onDrag={item.isActive ? drag : undefined}
      isDragging={isActive}
    />
  );

  const handleDragEnd = ({ data }: { data: Habit[] }) => {
    const habitOrders = data.map((habit, index) => ({
      id: habit.id,
      order: index,
    }));
    onReorderHabits(habitOrders);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flex: 1,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
    },
    headerActions: {
      flexDirection: 'row',
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardBackgroundElevated,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    activeHeaderButton: {
      backgroundColor: colors.primary,
    },
    content: {
      flex: 1,
    },
    section: {
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      backgroundColor: colors.backgroundSecondary,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    emptyButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    emptyButtonText: {
      fontSize: 16,
      fontFamily: Fonts.semibold,
      color: colors.textInverse,
    },
  });

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="add-circle-outline" size={64} color={colors.border} />
      <Text style={styles.emptyTitle}>{t('habits.emptyState.title')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('habits.emptyState.subtitle')}
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAddHabit}>
        <Text style={styles.emptyButtonText}>{t('habits.addHabit')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (habits.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.subtitle}>
            {activeHabits.length} active • {inactiveHabits.length} inactive
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={onAddHabit}>
            <Ionicons name="add" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={[{ key: 'content' }]}
        keyExtractor={(item) => item.key}
        renderItem={() => (
          <View style={styles.content}>
            {activeHabits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Habits</Text>
                <DraggableFlatList
                  data={activeHabits}
                  keyExtractor={(item) => item.id}
                  renderItem={renderHabitItem}
                  onDragEnd={handleDragEnd}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  activationDistance={5}
                  dragItemOverflow={true}
                />
              </View>
            )}

            {inactiveHabits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Inactive Habits</Text>
                <FlatList
                  data={inactiveHabits}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <HabitItem
                      habit={item}
                      onEdit={onEditHabit}
                      onDelete={onDeleteHabit}
                      onToggleActive={onToggleActive}
                      onReorder={onReorderHabits}
                    />
                  )}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}