import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { StatePersistence } from '../utils/statePersistence';
import { AppInitializationService, AppInitializationResult } from '../services/appInitializationService';

export interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  initializationResult: AppInitializationResult | null;
  lifecycleManagerReady: boolean;
}

export interface AppContextType {
  state: AppState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setLifecycleManagerReady: (ready: boolean) => void;
  getSystemHealth: () => Promise<any>;
  forceReinitialization: () => Promise<void>;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_INITIALIZATION_RESULT'; payload: AppInitializationResult | null }
  | { type: 'SET_LIFECYCLE_MANAGER_READY'; payload: boolean };

const initialState: AppState = {
  isLoading: false,
  isInitialized: false,
  error: null,
  initializationResult: null,
  lifecycleManagerReady: false,
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
    case 'SET_INITIALIZATION_RESULT':
      return { ...state, initializationResult: action.payload };
    case 'SET_LIFECYCLE_MANAGER_READY':
      return { ...state, lifecycleManagerReady: action.payload };
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

  const setLifecycleManagerReady = (ready: boolean) => {
    dispatch({ type: 'SET_LIFECYCLE_MANAGER_READY', payload: ready });
  };

  const setInitializationResult = (result: AppInitializationResult | null) => {
    dispatch({ type: 'SET_INITIALIZATION_RESULT', payload: result });
  };

  const getSystemHealth = async () => {
    return await AppInitializationService.getServiceHealthStatus();
  };

  const forceReinitialization = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AppInitializationService.forceReinitialization();
      setInitializationResult(result);
      setInitialized(result.success);
      setLifecycleManagerReady(result.success);
      
      if (!result.success) {
        setError(result.errors.join('; '));
      }
      
    } catch (error) {
      setError(`Re-initialization failed: ${error}`);
      console.error('App re-initialization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize app services on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[AppProvider] Starting app initialization...');
        setLoading(true);
        setError(null);

        // Initialize all services including lifecycle manager
        const result = await AppInitializationService.initializeApp({
          enableMonthlyChallenges: true,
          enableGamification: true,
          enableAnalytics: false, // Disable for now
          timeoutMs: 15000, // 15 seconds
          debugMode: __DEV__
        });

        console.log('[AppProvider] App initialization completed:', {
          success: result.success,
          totalTime: result.totalTime,
          errors: result.errors,
          warnings: result.warnings
        });

        setInitializationResult(result);
        setInitialized(result.success);
        setLifecycleManagerReady(result.success);

        if (!result.success) {
          const errorMessage = result.errors.length > 0 
            ? result.errors.join('; ')
            : 'App initialization failed with unknown error';
          setError(errorMessage);
        }

        // Log warnings if any
        if (result.warnings.length > 0) {
          console.warn('[AppProvider] Initialization warnings:', result.warnings);
        }

      } catch (error) {
        console.error('[AppProvider] App initialization crashed:', error);
        setError(`App initialization crashed: ${error}`);
        setInitialized(false);
        setLifecycleManagerReady(false);
      } finally {
        setLoading(false);
      }
    };

    // Load persisted state first, then initialize services
    const loadPersistedStateAndInitialize = async () => {
      try {
        const persistedState = await StatePersistence.loadState<AppState>('APP_STATE');
        if (persistedState) {
          dispatch({ type: 'SET_ERROR', payload: persistedState.error });
        }
      } catch (error) {
        console.warn('Failed to load persisted app state:', error);
      }
      
      // Always initialize services regardless of persisted state
      await initializeApp();
    };

    loadPersistedStateAndInitialize();
  }, []); // Empty dependency array - run only once on mount

  // Persist state changes
  useEffect(() => {
    const persistState = async () => {
      try {
        await StatePersistence.saveState('APP_STATE', {
          isLoading: state.isLoading,
          isInitialized: state.isInitialized,
          error: state.error,
          initializationResult: null, // Don't persist large objects
          lifecycleManagerReady: state.lifecycleManagerReady
        });
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
        setLifecycleManagerReady,
        getSystemHealth,
        forceReinitialization,
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