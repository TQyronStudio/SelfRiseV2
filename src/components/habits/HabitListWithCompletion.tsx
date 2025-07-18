import React from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, FlatList } from 'react-native';
// import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist'; // DOČASNĚ VYPNUTO PRO TEST
import { Habit, HabitCompletion } from '@/src/types/habit';
import { HabitItemWithCompletion } from './HabitItemWithCompletion';
import { formatDateToString } from '@/src/utils/date';
import { Colors } from '@/src/constants/colors';
import { Fonts } from '@/src/constants/fonts';

interface HabitListWithCompletionProps {
  habits: Habit[];
  completions: HabitCompletion[];
  isLoading: boolean;
  onRefresh: () => void;
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
  onRefresh,
  onEditHabit,
  onDeleteHabit,
  onToggleActive,
  onToggleCompletion,
  onReorderHabits,
  onViewHabitStats,
  date = formatDateToString(new Date()),
  ListHeaderComponent,
}: HabitListWithCompletionProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  // 1. Filtrování a řazení návyků
  const activeHabits = habits
    .filter(habit => habit.isActive)
    .sort((a, b) => a.order - b.order);
    
  const inactiveHabits = habits
    .filter(habit => !habit.isActive)
    .sort((a, b) => a.order - b.order);



  // 3. Získání dnešních splnění
  const todayCompletions = completions.filter(completion => completion.date === date);
  const getHabitCompletion = (habitId: string): HabitCompletion | undefined => {
    return todayCompletions.find(completion => completion.habitId === habitId);
  };

  // Renderovací funkce pro aktivní návyky (dočasně bez drag & drop)
  const renderActiveHabitItem = ({ item }: { item: Habit }) => {
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
          onDrag={undefined}
          isDragging={false}
          date={date}
        />
      </View>
    );
  };
  
  // Funkce pro uložení nového pořadí aktivních návyků
  const handleActiveDragEnd = ({ data }: { data: Habit[] }) => {
    setIsDragging(false);
    // Re-enable ScrollView scrolling after drag
    scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    const habitOrders = data.map((habit, index) => ({
      id: habit.id,
      order: index,
    }));
    onReorderHabits(habitOrders);
  };

  const handleDragBegin = () => {
    setIsDragging(true);
    // Disable ScrollView scrolling during drag
    scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
  };

  // Vrácení k ScrollView struktuře, ale s nestedScrollEnabled
  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled={true} // Řeší VirtualizedList warning
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Header */}
      {ListHeaderComponent}

      {/* Active Habits Section with Drag & Drop */}
      {activeHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Habits</Text>
          <FlatList
            data={activeHabits}
            renderItem={renderActiveHabitItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />
        </View>
      )}

      {/* Inactive Habits Section - No Drag & Drop */}
      {inactiveHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inactive Habits</Text>
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
                date={date}
              />
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No habits created yet</Text>
          <Text style={styles.emptyStateSubtext}>Tap "Add New Habit" to get started!</Text>
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
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});