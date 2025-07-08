import { useMemo } from 'react';
import { useHabits } from '../contexts/HabitsContext';
import { Habit, HabitCompletion } from '../types/habit';
import { DateString } from '../types/common';

export function useHabitsData() {
  const { state, actions } = useHabits();

  const habitsData = useMemo(() => {
    const sortedHabits = [...state.habits].sort((a, b) => a.order - b.order);
    
    return {
      habits: sortedHabits,
      activeHabits: sortedHabits.filter(habit => habit.isActive),
      completions: state.completions,
      isLoading: state.isLoading,
      error: state.error,
    };
  }, [state.habits, state.completions, state.isLoading, state.error]);

  const getHabitsByDate = (date: DateString): Array<Habit & { isCompleted: boolean; completion?: HabitCompletion }> => {
    return habitsData.activeHabits.map(habit => {
      const completion = state.completions.find(
        c => c.habitId === habit.id && c.date === date
      );
      return {
        ...habit,
        isCompleted: completion?.completed || false,
        completion,
      };
    });
  };

  const getHabitCompletion = (habitId: string, date: DateString): HabitCompletion | null => {
    return state.completions.find(
      c => c.habitId === habitId && c.date === date
    ) || null;
  };

  const getHabitStats = (habitId: string) => {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return null;

    const habitCompletions = state.completions.filter(c => c.habitId === habitId);
    const completedDays = habitCompletions.filter(c => c.completed).length;
    const totalDays = habitCompletions.length;
    
    return {
      habit,
      completedDays,
      totalDays,
      completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
      currentStreak: calculateCurrentStreak(habitCompletions),
      longestStreak: calculateLongestStreak(habitCompletions),
    };
  };

  const calculateCurrentStreak = (completions: HabitCompletion[]): number => {
    const sortedCompletions = [...completions]
      .filter(c => c.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const completion of sortedCompletions) {
      const completionDate = new Date(completion.date);
      const daysDiff = Math.floor((currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = completionDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateLongestStreak = (completions: HabitCompletion[]): number => {
    const sortedCompletions = [...completions]
      .filter(c => c.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;
    
    for (const completion of sortedCompletions) {
      const completionDate = new Date(completion.date);
      
      if (lastDate) {
        const daysDiff = Math.floor((completionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      
      longestStreak = Math.max(longestStreak, currentStreak);
      lastDate = completionDate;
    }
    
    return longestStreak;
  };

  return {
    ...habitsData,
    actions,
    getHabitsByDate,
    getHabitCompletion,
    getHabitStats,
  };
}