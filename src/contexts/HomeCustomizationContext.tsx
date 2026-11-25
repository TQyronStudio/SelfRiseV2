import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { HomeScreenPreferences, defaultHomePreferences } from '../types/homeCustomization';
import { homePreferencesStorage } from '../services/storage/homePreferencesStorage';

interface HomeCustomizationState {
  preferences: HomeScreenPreferences;
  isLoading: boolean;
  error: string | null;
}

type HomeCustomizationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PREFERENCES'; payload: HomeScreenPreferences }
  | { type: 'CLEAR_ERROR' };

const initialState: HomeCustomizationState = {
  preferences: defaultHomePreferences,
  isLoading: true,
  error: null,
};

function homeCustomizationReducer(
  state: HomeCustomizationState,
  action: HomeCustomizationAction
): HomeCustomizationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload, isLoading: false, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface HomeCustomizationContextType {
  state: HomeCustomizationState;
  actions: {
    loadPreferences: () => Promise<void>;
    /** True = saved. False = not saved (state.error says why; the screen shows a note). */
    toggleComponentVisibility: (componentId: string) => Promise<boolean>;
    reorderComponents: (componentIds: string[]) => Promise<boolean>;
    updateQuickActions: (settings: HomeScreenPreferences['quickActions']) => Promise<void>;
    updateTheme: (theme: HomeScreenPreferences['theme']) => Promise<void>;
    resetToDefaults: () => Promise<boolean>;
    clearError: () => void;
  };
}

const HomeCustomizationContext = createContext<HomeCustomizationContextType | undefined>(undefined);

interface HomeCustomizationProviderProps {
  children: ReactNode;
}

export function HomeCustomizationProvider({ children }: HomeCustomizationProviderProps) {
  const [state, dispatch] = useReducer(homeCustomizationReducer, initialState);

  const loadPreferences = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const preferences = await homePreferencesStorage.getPreferences();
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load preferences' 
      });
    }
  };

  const toggleComponentVisibility = async (componentId: string) => {
    try {
      const updatedPreferences = await homePreferencesStorage.toggleComponentVisibility(componentId);
      dispatch({ type: 'SET_PREFERENCES', payload: updatedPreferences });
      return true;
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update component visibility' 
      });
      return false;
    }
  };

  const reorderComponents = async (componentIds: string[]) => {
    try {
      const updatedPreferences = await homePreferencesStorage.reorderComponents(componentIds);
      dispatch({ type: 'SET_PREFERENCES', payload: updatedPreferences });
      return true;
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to reorder components' 
      });
      return false;
    }
  };

  const updateQuickActions = async (quickActions: HomeScreenPreferences['quickActions']) => {
    try {
      const updatedPreferences = await homePreferencesStorage.updateQuickActionsPreferences(quickActions);
      dispatch({ type: 'SET_PREFERENCES', payload: updatedPreferences });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update quick actions' 
      });
    }
  };

  const updateTheme = async (theme: HomeScreenPreferences['theme']) => {
    try {
      const updatedPreferences = await homePreferencesStorage.updateThemePreferences(theme);
      dispatch({ type: 'SET_PREFERENCES', payload: updatedPreferences });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update theme' 
      });
    }
  };

  const resetToDefaults = async () => {
    try {
      const defaultPreferences = await homePreferencesStorage.resetToDefaults();
      dispatch({ type: 'SET_PREFERENCES', payload: defaultPreferences });
      return true;
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to reset preferences' 
      });
      return false;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const value: HomeCustomizationContextType = {
    state,
    actions: {
      loadPreferences,
      toggleComponentVisibility,
      reorderComponents,
      updateQuickActions,
      updateTheme,
      resetToDefaults,
      clearError,
    },
  };

  return (
    <HomeCustomizationContext.Provider value={value}>
      {children}
    </HomeCustomizationContext.Provider>
  );
}

export function useHomeCustomization(): HomeCustomizationContextType {
  const context = useContext(HomeCustomizationContext);
  if (context === undefined) {
    throw new Error('useHomeCustomization must be used within a HomeCustomizationProvider');
  }
  return context;
}