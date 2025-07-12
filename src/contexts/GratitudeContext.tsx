import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Gratitude, GratitudeStreak, GratitudeStats, CreateGratitudeInput, UpdateGratitudeInput } from '../types/gratitude';
import { gratitudeStorage } from '../services/storage/gratitudeStorage';
import { DateString } from '../types/common';

export interface GratitudeState {
  gratitudes: Gratitude[];
  streakInfo: GratitudeStreak | null;
  stats: GratitudeStats | null;
  isLoading: boolean;
  error: string | null;
}

export interface GratitudeContextType {
  state: GratitudeState;
  actions: {
    loadGratitudes: () => Promise<void>;
    createGratitude: (input: CreateGratitudeInput) => Promise<Gratitude>;
    updateGratitude: (id: string, updates: UpdateGratitudeInput) => Promise<Gratitude>;
    deleteGratitude: (id: string) => Promise<void>;
    getGratitudesByDate: (date: DateString) => Gratitude[];
    refreshStats: () => Promise<void>;
    incrementMilestoneCounter: (milestoneType: number) => Promise<void>;
    clearError: () => void;
  };
}

type GratitudeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GRATITUDES'; payload: Gratitude[] }
  | { type: 'SET_STREAK_INFO'; payload: GratitudeStreak }
  | { type: 'SET_STATS'; payload: GratitudeStats }
  | { type: 'ADD_GRATITUDE'; payload: Gratitude }
  | { type: 'UPDATE_GRATITUDE'; payload: Gratitude }
  | { type: 'DELETE_GRATITUDE'; payload: string };

const initialState: GratitudeState = {
  gratitudes: [],
  streakInfo: null,
  stats: null,
  isLoading: false,
  error: null,
};

const GratitudeContext = createContext<GratitudeContextType | undefined>(undefined);

function gratitudeReducer(state: GratitudeState, action: GratitudeAction): GratitudeState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_GRATITUDES':
      return { ...state, gratitudes: action.payload };
    case 'SET_STREAK_INFO':
      return { ...state, streakInfo: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'ADD_GRATITUDE':
      return { ...state, gratitudes: [...state.gratitudes, action.payload] };
    case 'UPDATE_GRATITUDE':
      return {
        ...state,
        gratitudes: state.gratitudes.map(gratitude =>
          gratitude.id === action.payload.id ? action.payload : gratitude
        ),
      };
    case 'DELETE_GRATITUDE':
      return {
        ...state,
        gratitudes: state.gratitudes.filter(gratitude => gratitude.id !== action.payload),
      };
    default:
      return state;
  }
}

export function GratitudeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gratitudeReducer, initialState);

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const loadGratitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Run migration to fix existing data numbering
      await gratitudeStorage.migrateGratitudeNumbering();
      
      const gratitudes = await gratitudeStorage.getAll();
      dispatch({ type: 'SET_GRATITUDES', payload: gratitudes });
      
      // Also load streak info and stats
      await refreshStats();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load gratitudes');
    } finally {
      setLoading(false);
    }
  };

  const createGratitude = async (input: CreateGratitudeInput): Promise<Gratitude> => {
    try {
      setLoading(true);
      setError(null);
      
      const newGratitude = await gratitudeStorage.create(input);
      dispatch({ type: 'ADD_GRATITUDE', payload: newGratitude });
      
      // Refresh stats after creating gratitude
      await refreshStats();
      
      return newGratitude;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create gratitude';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateGratitude = async (id: string, updates: UpdateGratitudeInput): Promise<Gratitude> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedGratitude = await gratitudeStorage.update(id, updates);
      dispatch({ type: 'UPDATE_GRATITUDE', payload: updatedGratitude });
      
      return updatedGratitude;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update gratitude';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteGratitude = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await gratitudeStorage.delete(id);
      dispatch({ type: 'DELETE_GRATITUDE', payload: id });
      
      // Refresh stats after deleting gratitude
      await refreshStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete gratitude';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getGratitudesByDate = (date: DateString): Gratitude[] => {
    return state.gratitudes
      .filter(gratitude => gratitude.date === date)
      .sort((a, b) => {
        // Sort by creation time to maintain order
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeA - timeB;
      });
  };

  const refreshStats = async (): Promise<void> => {
    try {
      const [streakInfo, stats] = await Promise.all([
        gratitudeStorage.getStreakInfo(),
        gratitudeStorage.getStats(),
      ]);
      
      dispatch({ type: 'SET_STREAK_INFO', payload: streakInfo });
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refresh stats');
    }
  };

  const incrementMilestoneCounter = async (milestoneType: number): Promise<void> => {
    try {
      await gratitudeStorage.incrementMilestoneCounter(milestoneType);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to increment milestone counter');
    }
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    loadGratitudes();
  }, []);

  return (
    <GratitudeContext.Provider
      value={{
        state,
        actions: {
          loadGratitudes,
          createGratitude,
          updateGratitude,
          deleteGratitude,
          getGratitudesByDate,
          refreshStats,
          incrementMilestoneCounter,
          clearError,
        },
      }}
    >
      {children}
    </GratitudeContext.Provider>
  );
}

export function useGratitude() {
  const context = useContext(GratitudeContext);
  if (context === undefined) {
    throw new Error('useGratitude must be used within a GratitudeProvider');
  }
  return context;
}