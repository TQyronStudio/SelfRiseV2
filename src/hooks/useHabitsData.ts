import { useMemo } from 'react';
import { useHabits } from '../contexts/HabitsContext';
import { Habit, HabitCompletion } from '../types/habit';
import { DateString } from '../types/common';
import { findEarliestDate, formatDateToString, getDateRangeFromToday, daysBetween, today, parseDate, getWeekDates, getDayOfWeekFromDateString } from '../utils/date';

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
      // Use converted completions for accurate data
      const convertedCompletions = getHabitCompletionsWithConversion(habit.id);
      const completion = convertedCompletions.find(c => c.date === date);
      
      const result: Habit & { isCompleted: boolean; completion?: HabitCompletion } = {
        ...habit,
        isCompleted: completion?.completed || false,
      };
      
      if (completion) {
        result.completion = completion;
      }
      
      return result;
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

    // Calculate days since habit creation (respecting creation date)
    const createdAt = habit.createdAt instanceof Date ? habit.createdAt : new Date(habit.createdAt);
    const creationDateString = formatDateToString(createdAt);
    const daysSinceCreation = daysBetween(creationDateString, today()) + 1; // +1 to include creation day
    
    // Get all dates since habit was created
    const allDatesSinceCreation = getDateRangeFromToday(creationDateString);
    const relevantDates = getRelevantDatesForHabit(habit, allDatesSinceCreation);

    // Use the same sophisticated calculation logic as Home screen components
    let scheduledDays = 0;
    let completedScheduled = 0;
    let bonusCompletions = 0;
    let totalCompletedDays = 0;

    // Get habit completions with smart conversion applied
    const convertedCompletions = getHabitCompletionsWithConversion(habitId);
    
    relevantDates.forEach(date => {
      const dayOfWeek = getDayOfWeekFromDateString(date);
      const isScheduled = habit.scheduledDays.includes(dayOfWeek);
      const completion = convertedCompletions.find(c => c.date === date);
      const isCompleted = completion?.completed || false;
      
      if (isScheduled) {
        scheduledDays++;
        if (isCompleted) {
          completedScheduled++;
          totalCompletedDays++;
        }
      } else if (isCompleted) {
        bonusCompletions++;
        totalCompletedDays++;
      }
    });

    // Calculate completion rate using the same logic as Home screen:
    // scheduled completions + bonus points (25% each bonus completion)
    const scheduledRate = scheduledDays > 0 ? (completedScheduled / scheduledDays) * 100 : 0;
    const bonusRate = scheduledDays > 0 ? (bonusCompletions / scheduledDays) * 25 : 0;
    const completionRate = scheduledRate + bonusRate;
    
    return {
      habit,
      completedDays: totalCompletedDays,
      totalDays: daysSinceCreation,
      scheduledDays,
      completedScheduled,
      bonusCompletions,
      daysSinceCreation,
      completionRate,
      currentStreak: calculateCurrentStreak(convertedCompletions),
      longestStreak: calculateLongestStreak(convertedCompletions),
      totalCompletions: totalCompletedDays,
    };
  };

  const calculateCurrentStreak = (completions: HabitCompletion[]): number => {
    const sortedCompletions = [...completions]
      .filter(c => c.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const completion of sortedCompletions) {
      const completionDate = parseDate(completion.date);
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
      const completionDate = parseDate(completion.date);
      
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

  const getEarliestDataDate = (): DateString | null => {
    const completionDates = state.completions.map(c => c.date);
    const habitCreationDates = state.habits.map(h => {
      // Handle both Date object and string formats from storage
      const createdAt = h.createdAt instanceof Date ? h.createdAt : new Date(h.createdAt);
      return formatDateToString(createdAt);
    });
    
    const allDates = [...completionDates, ...habitCreationDates];
    return findEarliestDate(allDates);
  };

  const getEarliestCompletionDate = (): DateString | null => {
    const completionDates = state.completions.map(c => c.date);
    return findEarliestDate(completionDates);
  };

  const getDataDateRange = (): DateString[] => {
    const earliestDate = getEarliestDataDate();
    if (!earliestDate) return [];
    return getDateRangeFromToday(earliestDate);
  };

  const getHabitDataDateRange = (habitId: string): DateString[] => {
    const habitCompletions = state.completions.filter(c => c.habitId === habitId);
    const completionDates = habitCompletions.map(c => c.date);
    const earliestDate = findEarliestDate(completionDates);
    
    if (!earliestDate) return [];
    return getDateRangeFromToday(earliestDate);
  };

  // Helper function to filter period dates based on habit creation date
  const getRelevantDatesForHabit = (habit: Habit, periodDates: DateString[]): DateString[] => {
    const createdAt = habit.createdAt instanceof Date ? habit.createdAt : new Date(habit.createdAt);
    const creationDate = formatDateToString(createdAt);
    return periodDates.filter(date => date >= creationDate);
  };

  // Smart Bonus Conversion Logic
  const applySmartBonusConversion = (habit: Habit, completions: HabitCompletion[]): HabitCompletion[] => {
    // Group completions by week
    const weeklyCompletions = new Map<string, HabitCompletion[]>();
    
    completions.forEach(completion => {
      const weekDates = getWeekDates(completion.date);
      const weekKey = weekDates[0]; // Use Monday as week key
      
      if (weekKey && !weeklyCompletions.has(weekKey)) {
        weeklyCompletions.set(weekKey, []);
      }
      if (weekKey) {
        weeklyCompletions.get(weekKey)!.push(completion);
      }
    });

    // Apply conversion logic for each week
    const convertedCompletions: HabitCompletion[] = [];
    
    weeklyCompletions.forEach((weekCompletions, weekKey) => {
      const weekDates = getWeekDates(weekKey);
      
      // Find missed scheduled days (days that were scheduled but not completed)
      const missedScheduledDays: DateString[] = [];
      const bonusCompletions: HabitCompletion[] = [];
      const scheduledCompletions: HabitCompletion[] = [];
      
      weekDates.forEach(date => {
        const dayOfWeek = getDayOfWeekFromDateString(date);
        const isScheduled = habit.scheduledDays.includes(dayOfWeek);
        const completion = weekCompletions.find(c => c.date === date);
        
        if (isScheduled) {
          if (completion?.completed) {
            scheduledCompletions.push(completion);
          } else {
            // Only count missed days in the past (not future scheduled days)
            const dateObj = parseDate(date);
            const today = new Date();
            if (dateObj < today && date !== formatDateToString(today)) {
              missedScheduledDays.push(date);
            }
          }
        } else if (completion?.completed) {
          bonusCompletions.push(completion);
        }
      });

      // Pair missed scheduled days with bonus completions chronologically
      const sortedMissed = [...missedScheduledDays].sort();
      const sortedBonuses = [...bonusCompletions].sort((a, b) => a.date.localeCompare(b.date));
      
      const conversions: Array<{ missedDate: DateString; bonusCompletion: HabitCompletion }> = [];
      
      // Create pairings (1:1)
      const pairCount = Math.min(sortedMissed.length, sortedBonuses.length);
      for (let i = 0; i < pairCount; i++) {
        const missedDate = sortedMissed[i];
        const bonusCompletion = sortedBonuses[i];
        
        if (missedDate && bonusCompletion) {
          conversions.push({
            missedDate,
            bonusCompletion
          });
        }
      }

      // Apply conversions
      weekCompletions.forEach(completion => {
        const conversion = conversions.find(c => c.bonusCompletion.id === completion.id);
        
        if (conversion) {
          // Convert bonus to makeup completion (bonus day becomes makeup)
          convertedCompletions.push({
            ...completion,
            isBonus: false, // No longer a bonus
            isConverted: true,
            convertedFromDate: conversion.missedDate // Reference to the missed day this covers
          });
          
          // NOTE: Missed scheduled day is intentionally NOT added to convertedCompletions
          // This effectively "hides" the missed day - it won't show as red anymore
        } else {
          // Keep original completion unchanged
          convertedCompletions.push(completion);
        }
      });
      
      // Add covered missed days as "covered" entries (for UI to show blue dot only)
      const convertedMissed = sortedMissed.slice(0, pairCount);
      convertedMissed.forEach(missedDate => {
        const existingCompletion = weekCompletions.find(c => c.date === missedDate);
        if (!existingCompletion) {
          convertedCompletions.push({
            id: `covered-${missedDate}-${habit.id}`,
            habitId: habit.id,
            date: missedDate,
            completed: false, // Not actually completed, but covered
            isBonus: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            isCovered: true // New flag to indicate this missed day is covered by makeup
          });
        }
      });

      // Add any remaining missed days as failed completions (for display purposes)
      const unconvertedMissed = sortedMissed.slice(pairCount);
      unconvertedMissed.forEach(missedDate => {
        // Only add if not already present
        const existingCompletion = weekCompletions.find(c => c.date === missedDate);
        if (!existingCompletion) {
          convertedCompletions.push({
            id: `missed-${missedDate}-${habit.id}`,
            habitId: habit.id,
            date: missedDate,
            completed: false,
            isBonus: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });
    });

    return convertedCompletions;
  };

  // Get completions with smart bonus conversion applied
  const getHabitCompletionsWithConversion = (habitId: string): HabitCompletion[] => {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return [];
    
    const rawCompletions = state.completions.filter(c => c.habitId === habitId);
    return applySmartBonusConversion(habit, rawCompletions);
  };

  return {
    ...habitsData,
    actions,
    getHabitsByDate,
    getHabitCompletion,
    getHabitStats,
    getEarliestDataDate,
    getEarliestCompletionDate,
    getDataDateRange,
    getHabitDataDateRange,
    getRelevantDatesForHabit,
    getHabitCompletionsWithConversion, // Export new smart conversion function
  };
}