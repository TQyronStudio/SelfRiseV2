import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Goal, GoalProgress, GoalStats, CreateGoalInput, UpdateGoalInput, AddGoalProgressInput } from '../types/goal';
import { goalStorage } from '../services/storage/goalStorage';

export interface GoalsState {
  goals: Goal[];
  progress: GoalProgress[];
  stats: GoalStats[];
  isLoading: boolean;
  error: string | null;
}

export interface GoalsContextType {
  state: GoalsState;
  actions: {
    loadGoals: () => Promise<void>;
    createGoal: (input: CreateGoalInput) => Promise<Goal>;
    updateGoal: (id: string, updates: UpdateGoalInput) => Promise<Goal>;
    deleteGoal: (id: string) => Promise<void>;
    addProgress: (input: AddGoalProgressInput) => Promise<GoalProgress>;
    deleteProgress: (id: string) => Promise<void>;
    getGoalStats: (goalId: string) => GoalStats | null;
    updateGoalOrder: (goalOrders: Array<{ id: string; order: number }>) => Promise<void>;
    refreshStats: () => Promise<void>;
    clearError: () => void;
  };
}

type GoalsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_PROGRESS'; payload: GoalProgress[] }
  | { type: 'SET_STATS'; payload: GoalStats[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_PROGRESS'; payload: GoalProgress }
  | { type: 'DELETE_PROGRESS'; payload: string }
  | { type: 'UPDATE_GOAL_STATS'; payload: GoalStats };

const initialState: GoalsState = {
  goals: [],
  progress: [],
  stats: [],
  isLoading: false,
  error: null,
};

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

function goalsReducer(state: GoalsState, action: GoalsAction): GoalsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id ? action.payload : goal
        ),
      };
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(goal => goal.id !== action.payload),
        progress: state.progress.filter(progress => progress.goalId !== action.payload),
        stats: state.stats.filter(stat => stat.goalId !== action.payload),
      };
    case 'ADD_PROGRESS':
      return { ...state, progress: [...state.progress, action.payload] };
    case 'DELETE_PROGRESS':
      return {
        ...state,
        progress: state.progress.filter(progress => progress.id !== action.payload),
      };
    case 'UPDATE_GOAL_STATS':
      return {
        ...state,
        stats: state.stats.map(stat =>
          stat.goalId === action.payload.goalId ? action.payload : stat
        ),
      };
    default:
      return state;
  }
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(goalsReducer, initialState);

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [goals, progress] = await Promise.all([
        goalStorage.getAll(),
        goalStorage.getAllProgress(),
      ]);
      
      dispatch({ type: 'SET_GOALS', payload: goals });
      dispatch({ type: 'SET_PROGRESS', payload: progress });
      
      // Load stats for all goals
      await refreshStats();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (input: CreateGoalInput): Promise<Goal> => {
    try {
      setLoading(true);
      setError(null);
      
      const newGoal = await goalStorage.create(input);
      dispatch({ type: 'ADD_GOAL', payload: newGoal });
      
      return newGoal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create goal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async (id: string, updates: UpdateGoalInput): Promise<Goal> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedGoal = await goalStorage.update(id, updates);
      dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
      
      return updatedGoal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update goal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await goalStorage.delete(id);
      dispatch({ type: 'DELETE_GOAL', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete goal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addProgress = async (input: AddGoalProgressInput): Promise<GoalProgress> => {
    try {
      setLoading(true);
      setError(null);
      
      const newProgress = await goalStorage.addProgress(input);
      dispatch({ type: 'ADD_PROGRESS', payload: newProgress });
      
      // Refresh stats for this goal
      const updatedStats = await goalStorage.getGoalStats(input.goalId);
      dispatch({ type: 'UPDATE_GOAL_STATS', payload: updatedStats });
      
      return newProgress;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add progress';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteProgress = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Find the progress item to get goalId before deleting
      const progressItem = state.progress.find(p => p.id === id);
      
      await goalStorage.deleteProgress(id);
      dispatch({ type: 'DELETE_PROGRESS', payload: id });
      
      // Refresh stats for the affected goal
      if (progressItem) {
        const updatedStats = await goalStorage.getGoalStats(progressItem.goalId);
        dispatch({ type: 'UPDATE_GOAL_STATS', payload: updatedStats });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete progress';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getGoalStats = (goalId: string): GoalStats | null => {
    return state.stats.find(stat => stat.goalId === goalId) || null;
  };

  const updateGoalOrder = async (goalOrders: Array<{ id: string; order: number }>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await goalStorage.updateGoalOrder(goalOrders);
      
      // Update local state
      const updatedGoals = state.goals.map(goal => {
        const newOrder = goalOrders.find(item => item.id === goal.id)?.order;
        return newOrder !== undefined ? { ...goal, order: newOrder } : goal;
      });
      
      dispatch({ type: 'SET_GOALS', payload: updatedGoals });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update goal order';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async (): Promise<void> => {
    try {
      const statsPromises = state.goals.map(goal => goalStorage.getGoalStats(goal.id));
      const stats = await Promise.all(statsPromises);
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refresh stats');
    }
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    loadGoals();
  }, []);

  return (
    <GoalsContext.Provider
      value={{
        state,
        actions: {
          loadGoals,
          createGoal,
          updateGoal,
          deleteGoal,
          addProgress,
          deleteProgress,
          getGoalStats,
          updateGoalOrder,
          refreshStats,
          clearError,
        },
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}