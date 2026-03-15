import React, { createContext, useContext, useReducer, useEffect, useRef, useMemo, ReactNode } from 'react';
import { Habit, HabitCompletion, CreateHabitInput, UpdateHabitInput } from '../types/habit';
import { getHabitStorageImpl } from '../config/featureFlags';
import { DateString } from '../types/common';
import { HabitResetUtils } from '../utils/HabitResetUtils';
import { AchievementService } from '../services/achievementService';
import { isTutorialRestarted, isTutorialActive } from './TutorialContext';

// Get storage implementation based on feature flag
const habitStorage = getHabitStorageImpl();

// 🚀 PERFORMANCE: Query cache to reduce redundant SQLite reads
// Cache TTL: 5 seconds (safe for make-up conversion accuracy)
const QUERY_CACHE_TTL = 5000;

export interface HabitsState {
  habits: Habit[];
  completions: HabitCompletion[];
  isLoading: boolean;
  error: string | null;
}

export interface HabitsContextType {
  state: HabitsState;
  actions: {
    loadHabits: () => Promise<void>;
    createHabit: (input: CreateHabitInput) => Promise<Habit>;
    updateHabit: (id: string, updates: UpdateHabitInput) => Promise<Habit>;
    deleteHabit: (id: string) => Promise<void>;
    toggleCompletion: (habitId: string, date: DateString, isBonus?: boolean) => Promise<HabitCompletion | null>;
    updateHabitOrder: (habitOrders: Array<{ id: string; order: number }>) => Promise<void>;
    clearError: () => void;
  };
}

type HabitsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'SET_COMPLETIONS'; payload: HabitCompletion[] }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'UPDATE_HABIT_ORDER'; payload: Array<{ id: string; order: number }> }
  | { type: 'ADD_COMPLETION'; payload: HabitCompletion }
  | { type: 'UPDATE_COMPLETION'; payload: HabitCompletion }
  | { type: 'DELETE_COMPLETION'; payload: string };

const initialState: HabitsState = {
  habits: [],
  completions: [],
  isLoading: false,
  error: null,
};

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

function habitsReducer(state: HabitsState, action: HabitsAction): HabitsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_HABITS':
      return { ...state, habits: action.payload };
    case 'SET_COMPLETIONS':
      return { ...state, completions: action.payload };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(habit =>
          habit.id === action.payload.id ? action.payload : habit
        ),
      };
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter(habit => habit.id !== action.payload),
        completions: state.completions.filter(completion => completion.habitId !== action.payload),
      };
    case 'UPDATE_HABIT_ORDER':
      return {
        ...state,
        habits: state.habits.map(habit => {
          const newOrder = action.payload.find(item => item.id === habit.id)?.order;
          return newOrder !== undefined ? { ...habit, order: newOrder } : habit;
        }),
      };
    case 'ADD_COMPLETION':
      return { ...state, completions: [...state.completions, action.payload] };
    case 'UPDATE_COMPLETION':
      return {
        ...state,
        completions: state.completions.map(completion =>
          completion.id === action.payload.id ? action.payload : completion
        ),
      };
    case 'DELETE_COMPLETION':
      return {
        ...state,
        completions: state.completions.filter(completion => completion.id !== action.payload),
      };
    default:
      return state;
  }
}

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(habitsReducer, initialState);

  // 🚀 PERFORMANCE: Query cache for SQLite reads
  const habitsQueryCacheRef = useRef<{
    habits: Habit[];
    completions: HabitCompletion[];
    timestamp: number;
  } | null>(null);

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  // 🚀 PERFORMANCE: Invalidate query cache on data mutations
  // This ensures make-up conversion always has fresh data
  const invalidateQueryCache = () => {
    if (habitsQueryCacheRef.current) {
      console.log('🗑️ HabitsContext: Invalidating query cache');
      habitsQueryCacheRef.current = null;
    }
  };

  const loadHabits = async () => {
    try {
      console.log('🔄 HabitsContext: Starting loadHabits...');
      setLoading(true);
      setError(null);

      // 🚀 PERFORMANCE: Check query cache first
      if (habitsQueryCacheRef.current) {
        const cacheAge = Date.now() - habitsQueryCacheRef.current.timestamp;
        if (cacheAge < QUERY_CACHE_TTL) {
          console.log(`⚡ HabitsContext: Using cached data (age: ${cacheAge}ms, TTL: ${QUERY_CACHE_TTL}ms)`);
          dispatch({ type: 'SET_HABITS', payload: habitsQueryCacheRef.current.habits });
          dispatch({ type: 'SET_COMPLETIONS', payload: habitsQueryCacheRef.current.completions });
          setLoading(false);
          console.log('✅ HabitsContext: Habits loaded from cache');
          return;
        } else {
          console.log(`⏰ HabitsContext: Cache expired (age: ${cacheAge}ms > TTL: ${QUERY_CACHE_TTL}ms)`);
        }
      }

      // Initialize daily reset system
      await HabitResetUtils.initializeResetSystem();

      // 🚀 PERFORMANCE: Cache miss - fetch from SQLite
      console.log('💾 HabitsContext: Fetching from SQLite...');
      const [habits, completions] = await Promise.all([
        habitStorage.getAll(),
        habitStorage.getAllCompletions(),
      ]);

      console.log(`🔄 HabitsContext: Loaded ${habits.length} habits, ${completions.length} completions`);

      // 🚀 PERFORMANCE: Update cache
      habitsQueryCacheRef.current = {
        habits,
        completions,
        timestamp: Date.now()
      };

      dispatch({ type: 'SET_HABITS', payload: habits });
      dispatch({ type: 'SET_COMPLETIONS', payload: completions });

      console.log('✅ HabitsContext: Habits loaded successfully from SQLite');
    } catch (error) {
      console.error('❌ HabitsContext: Failed to load habits:', error);
      setError(error instanceof Error ? error.message : 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async (input: CreateHabitInput): Promise<Habit> => {
    try {
      setLoading(true);
      setError(null);

      const newHabit = await habitStorage.create(input);

      // 🚀 PERFORMANCE: Invalidate cache before dispatch
      invalidateQueryCache();

      dispatch({ type: 'ADD_HABIT', payload: newHabit });

      // 🚀 Achievement check runs in background (same pattern as GoalsContext)
      setTimeout(async () => {
        try {
          const isRestarted = await isTutorialRestarted();
          const isActive = await isTutorialActive();

          if (isActive && isRestarted) {
            console.log('✨ Tutorial restarted: Habit created successfully (achievement already earned)');
          } else {
            console.log('🎯 Checking achievements after habit creation:', newHabit.name, 'color:', newHabit.color);
          }

          await AchievementService.runBatchAchievementCheck({ forceUpdate: true });
        } catch (achievementError) {
          console.error('Failed to check achievements after habit creation:', achievementError);
        }
      }, 100);

      return newHabit;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create habit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateHabit = async (id: string, updates: UpdateHabitInput): Promise<Habit> => {
    try {
      setError(null);

      const updatedHabit = await habitStorage.update(id, updates);

      // 🚀 PERFORMANCE: Invalidate cache before dispatch (critical for scheduledDays changes)
      invalidateQueryCache();

      dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit });
      
      return updatedHabit;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update habit';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteHabit = async (id: string): Promise<void> => {
    try {
      setError(null);

      await habitStorage.delete(id);

      // 🚀 PERFORMANCE: Invalidate cache before dispatch
      invalidateQueryCache();

      dispatch({ type: 'DELETE_HABIT', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete habit';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const toggleCompletion = async (
    habitId: string,
    date: DateString,
    isBonus: boolean = false
  ): Promise<HabitCompletion | null> => {
    try {
      setError(null);

      // Check current state to determine optimistic action
      const existingCompletion = state.completions.find(
        c => c.habitId === habitId && c.date === date
      );

      // 🚀 OPTIMISTIC UI: Dispatch BEFORE storage for instant checkbox response
      invalidateQueryCache();

      if (existingCompletion) {
        // Toggling OFF: remove from state immediately
        dispatch({ type: 'DELETE_COMPLETION', payload: existingCompletion.id });
      } else {
        // Toggling ON: add temp completion to state immediately
        const tempCompletion: HabitCompletion = {
          id: `temp_${habitId}_${date}`,
          habitId,
          date,
          completed: true,
          isBonus,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dispatch({ type: 'ADD_COMPLETION', payload: tempCompletion });
      }

      // Storage operation (heavy - includes XP, achievements)
      const result = await habitStorage.toggleCompletion(habitId, date, isBonus);

      // After storage completes, replace temp completion with real DB data
      invalidateQueryCache();
      if (result && !existingCompletion) {
        dispatch({ type: 'DELETE_COMPLETION', payload: `temp_${habitId}_${date}` });
        dispatch({ type: 'ADD_COMPLETION', payload: result });
      }

      return result;
    } catch (error) {
      // Rollback: reload all data from storage to restore correct state
      await loadHabits();
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle completion';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateHabitOrder = async (habitOrders: Array<{ id: string; order: number }>): Promise<void> => {
    try {
      setError(null);

      // Optimistically update local state first
      dispatch({ type: 'UPDATE_HABIT_ORDER', payload: habitOrders });

      // Then update storage
      await habitStorage.updateHabitOrder(habitOrders);

      // 🚀 PERFORMANCE: Invalidate cache after storage update
      invalidateQueryCache();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update habit order';
      setError(errorMessage);
      // On error, reload habits to restore correct state
      await loadHabits();
      throw new Error(errorMessage);
    }
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    loadHabits();
  }, []);

  // 🚀 PERFORMANCE: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    actions: {
      loadHabits,
      createHabit,
      updateHabit,
      deleteHabit,
      toggleCompletion,
      updateHabitOrder,
      clearError,
    },
  }), [state]);

  return (
    <HabitsContext.Provider value={contextValue}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
}