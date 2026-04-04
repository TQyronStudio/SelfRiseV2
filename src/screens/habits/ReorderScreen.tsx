import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Habit } from '@/src/types/habit';
import { HabitItemWithCompletion } from '@/src/components/habits/HabitItemWithCompletion';
import { Fonts } from '@/src/constants/fonts';
import { useI18n } from '@/src/hooks/useI18n';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useTheme } from '@/src/contexts/ThemeContext';

export function ReorderScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { actions } = useHabitsData();
  const { initialItems } = useLocalSearchParams<{ initialItems: string }>();

  // Parse initial items from params
  const parsedInitialItems: Habit[] = initialItems ? JSON.parse(initialItems) : [];
  const [reorderedItems, setReorderedItems] = useState<Habit[]>(parsedInitialItems);

  const handleSave = async () => {
    try {
      // Create order array for saving
      const habitOrders = reorderedItems.map((habit, index) => ({
        id: habit.id,
        order: index,
      }));
      
      // Save the new order
      await actions.updateHabitOrder(habitOrders);
      
      router.back();
    } catch (error) {
      console.error('Failed to save habit order:', error);
      // TODO: Show error message to user
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const renderDraggableItem = useCallback(({ item, drag, isActive }: RenderItemParams<Habit>) => {
    return (
      <View style={styles.itemContainer}>
        <HabitItemWithCompletion
          habit={item}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleActive={() => {}}
          onToggleCompletion={async () => {}}
          onReorder={() => {}}
          onViewStats={() => {}}
          onDrag={drag}
          isDragging={isActive}
          isEditMode={true}
        />
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    headerButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: Fonts.semibold,
      color: colors.text,
    },
    cancelButtonText: {
      fontSize: 16,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
    },
    saveButtonText: {
      fontSize: 16,
      fontFamily: Fonts.medium,
      color: colors.primary,
    },
    instructionsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.cardBackgroundElevated,
    },
    instructionsText: {
      fontSize: 14,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: insets.bottom,
    },
    itemContainer: {
      marginBottom: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>{t('ui.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('screens.reorderHabits.title')}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('ui.save')}</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {t('screens.reorderHabits.instructions')}
        </Text>
      </View>

      {/* Draggable List */}
      <View style={styles.listContainer}>
        <DraggableFlatList
          data={reorderedItems}
          onDragEnd={({ data }) => setReorderedItems(data)}
          keyExtractor={(item) => item.id}
          renderItem={renderDraggableItem}
          activationDistance={10}
          showsVerticalScrollIndicator={true}
        />
      </View>
    </SafeAreaView>
  );
}