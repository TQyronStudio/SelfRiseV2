import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '@/src/types/habit';
import { HabitItemWithCompletion } from '@/src/components/habits/HabitItemWithCompletion';
import { Fonts } from '@/src/constants/fonts';
import { useI18n } from '@/src/hooks/useI18n';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useTheme } from '@/src/contexts/ThemeContext';

export function ReorderScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
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

  const renderDraggableItem = ({ item, drag, isActive }: RenderItemParams<Habit>) => {
    return (
      <View style={styles.itemContainer}>
        <HabitItemWithCompletion
          habit={item}
          onEdit={() => {}} // Disabled in reorder mode
          onDelete={() => {}} // Disabled in reorder mode
          onToggleActive={() => {}} // Disabled in reorder mode
          onToggleCompletion={async () => {}} // Disabled in reorder mode
          onReorder={() => {}} // Not needed here
          onViewStats={() => {}} // Disabled in reorder mode
          onDrag={drag}
          isDragging={isActive}
          isEditMode={true} // Always in edit mode for wiggle effect
        />
      </View>
    );
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
    },
    itemContainer: {
      marginBottom: 8,
    },
  });

  const content = (
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
          activationDistance={20}
          dragHitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          showsVerticalScrollIndicator={true}
        />
      </View>
    </SafeAreaView>
  );

  if (Platform.OS === 'ios') {
    return <GestureHandlerRootView style={styles.container}>{content}</GestureHandlerRootView>;
  }

  return content; // Na Androidu vrátíme obsah přímo, bez GestureHandleru
}