import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { StatePersistence } from '../utils/statePersistence';

export interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface AppContextType {
  state: AppState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean };

const initialState: AppState = {
  isLoading: false,
  isInitialized: false,
  error: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setInitialized = (initialized: boolean) => {
    dispatch({ type: 'SET_INITIALIZED', payload: initialized });
  };

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const persistedState = await StatePersistence.loadState<AppState>('APP_STATE');
        if (persistedState) {
          dispatch({ type: 'SET_ERROR', payload: persistedState.error });
        }
      } catch (error) {
        console.warn('Failed to load persisted app state:', error);
      }
    };

    loadPersistedState();
  }, []);

  // Persist state changes
  useEffect(() => {
    const persistState = async () => {
      try {
        await StatePersistence.saveState('APP_STATE', state);
      } catch (error) {
        console.warn('Failed to persist app state:', error);
      }
    };

    if (state.isInitialized) {
      persistState();
    }
  }, [state]);

  return (
    <AppContext.Provider
      value={{
        state,
        setLoading,
        setError,
        setInitialized,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}