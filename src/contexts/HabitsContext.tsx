import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Habit, HabitCompletion, CreateHabitInput, UpdateHabitInput } from '../types/habit';
import { habitStorage } from '../services/storage/habitStorage';
import { DateString } from '../types/common';

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

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const loadHabits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [habits, completions] = await Promise.all([
        habitStorage.getAll(),
        habitStorage.getAllCompletions(),
      ]);
      
      dispatch({ type: 'SET_HABITS', payload: habits });
      dispatch({ type: 'SET_COMPLETIONS', payload: completions });
    } catch (error) {
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
      dispatch({ type: 'ADD_HABIT', payload: newHabit });
      
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
      setLoading(true);
      setError(null);
      
      const updatedHabit = await habitStorage.update(id, updates);
      dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit });
      
      return updatedHabit;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update habit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteHabit = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await habitStorage.delete(id);
      dispatch({ type: 'DELETE_HABIT', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete habit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletion = async (
    habitId: string,
    date: DateString,
    isBonus: boolean = false
  ): Promise<HabitCompletion | null> => {
    try {
      setError(null);
      
      const result = await habitStorage.toggleCompletion(habitId, date, isBonus);
      
      if (result) {
        dispatch({ type: 'ADD_COMPLETION', payload: result });
      } else {
        const existingCompletion = state.completions.find(
          c => c.habitId === habitId && c.date === date
        );
        if (existingCompletion) {
          dispatch({ type: 'DELETE_COMPLETION', payload: existingCompletion.id });
        }
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle completion';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateHabitOrder = async (habitOrders: Array<{ id: string; order: number }>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await habitStorage.updateHabitOrder(habitOrders);
      
      // Update local state
      const updatedHabits = state.habits.map(habit => {
        const newOrder = habitOrders.find(item => item.id === habit.id)?.order;
        return newOrder !== undefined ? { ...habit, order: newOrder } : habit;
      });
      
      dispatch({ type: 'SET_HABITS', payload: updatedHabits });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update habit order';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    loadHabits();
  }, []);

  return (
    <HabitsContext.Provider
      value={{
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
      }}
    >
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