import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useXpAnimation } from './XpAnimationContext';
import { AchievementStorage } from '@/src/services/achievementStorage';
import { router } from 'expo-router';
import { tutorialTargetManager } from '@/src/utils/TutorialTargetHelper';

// Crash Recovery Interface
export interface TutorialCrashLog {
  timestamp: number;
  error: string;
  stack?: string;
  step: number;
  stepId: string;
  userAgent: string;
  appState: 'active' | 'background' | 'inactive';
  memoryUsage?: number;
  attempts: number;
}

export interface TutorialRecoveryState {
  errorCount: number;
  lastCrash?: TutorialCrashLog;
  recoveryAttempts: number;
  isInRecoveryMode: boolean;
  fallbackEnabled: boolean;
  recoveryTimestamp: number;
}

// Tutorial Step Interface
export interface TutorialStep {
  id: string;
  type: 'modal' | 'spotlight';
  target?: string; // CSS selector nebo ref identifier
  content: {
    title: string;
    content: string;
    button?: string;
    examples?: string[]; // Example text for user guidance
    placeholder?: string; // Placeholder text for inputs
  };
  action: 'next' | 'click_element' | 'type_text' | 'select_option' | 'select_date' | 'type_number' | 'select_days';
  nextTrigger?: 'first_character' | 'selection' | 'click';
  validation?: (value: any) => boolean;
}

// Tutorial State Interface
export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  isSkipped: boolean;
  userInteractionBlocked: boolean;
  showNext: boolean;
  currentStepData: TutorialStep | null;
  isLoading: boolean;
  error: string | null;
  // Visual Feedback & Highlighting
  highlightedField: string | null;
  fieldValidationStatus: Record<string, 'valid' | 'invalid' | 'pending'>;
  userFeedback: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  } | null;
}

// Tutorial Context Interface
export interface TutorialContextType {
  state: TutorialState;
  actions: {
    startTutorial: () => Promise<void>;
    nextStep: () => Promise<void>;
    skipTutorial: () => Promise<void>;
    completeTutorial: () => Promise<void>;
    resumeTutorial: () => Promise<void>;
    setUserInteractionBlocked: (blocked: boolean) => void;
    showNextButton: (show: boolean) => void;
    handleStepAction: (action: string, value?: any) => Promise<void>;
    resetTutorial: () => Promise<void>;
    restartTutorial: () => Promise<void>;
    clearCrashData: () => Promise<void>;
    // Visual Feedback & Highlighting
    highlightField: (fieldId: string) => void;
    clearFieldHighlight: () => void;
    setFieldValidation: (fieldId: string, status: 'valid' | 'invalid' | 'pending') => void;
    showUserFeedback: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    hideUserFeedback: () => void;
  };
}

// Tutorial Actions
type TutorialAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'START_TUTORIAL'; payload: { steps: TutorialStep[] } }
  | { type: 'SET_CURRENT_STEP'; payload: { stepNumber: number; steps: TutorialStep[] } }
  | { type: 'SET_STEP_DATA'; payload: TutorialStep | null }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'SET_INTERACTION_BLOCKED'; payload: boolean }
  | { type: 'SHOW_NEXT_BUTTON'; payload: boolean }
  | { type: 'RESET_TUTORIAL' }
  | { type: 'HIGHLIGHT_FIELD'; payload: string | null }
  | { type: 'SET_FIELD_VALIDATION'; payload: { fieldId: string; status: 'valid' | 'invalid' | 'pending' } }
  | { type: 'SHOW_USER_FEEDBACK'; payload: { message: string; type: 'success' | 'error' | 'info' | 'warning' } }
  | { type: 'HIDE_USER_FEEDBACK' };

// Storage Keys
const TUTORIAL_STORAGE_KEY = 'onboarding_tutorial_completed';
const TUTORIAL_STEP_KEY = 'onboarding_current_step';
const TUTORIAL_SKIPPED_KEY = 'onboarding_tutorial_skipped';
const TUTORIAL_SESSION_KEY = 'onboarding_tutorial_session';
const TUTORIAL_SESSION_TIMESTAMP_KEY = 'onboarding_tutorial_timestamp';
const TUTORIAL_CRASH_LOG_KEY = 'onboarding_tutorial_crash_log';
const TUTORIAL_ERROR_COUNT_KEY = 'onboarding_tutorial_error_count';
const TUTORIAL_RECOVERY_STATE_KEY = 'onboarding_tutorial_recovery_state';

// Animation Specifications
export const TUTORIAL_ANIMATIONS = {
  overlayFadeIn: { duration: 300, easing: 'ease-out' },
  spotlightTransition: { duration: 500, easing: 'ease-in-out' },
  pulseAnimation: {
    duration: 1500,
    easing: 'ease-in-out',
    iterationCount: 'infinite',
    direction: 'alternate'
  },
  elementHighlight: { duration: 200, easing: 'ease-out' }
} as const;

// Initial State
const initialState: TutorialState = {
  isActive: false,
  currentStep: 1,
  totalSteps: 22,
  isCompleted: false,
  isSkipped: false,
  userInteractionBlocked: false,
  showNext: false,
  currentStepData: null,
  isLoading: false,
  error: null,
  // Visual Feedback & Highlighting
  highlightedField: null,
  fieldValidationStatus: {},
  userFeedback: null,
};

// Function to generate tutorial steps with i18n support
const createTutorialSteps = (t: any): TutorialStep[] => [
  // Step 1: Welcome Modal
  {
    id: 'welcome',
    type: 'modal',
    content: {
      title: t('tutorial.steps.welcome.title'),
      content: t('tutorial.steps.welcome.content'),
      button: t('tutorial.steps.welcome.button')
    },
    action: 'next'
  },

  // Step 2: App Overview
  {
    id: 'app-overview',
    type: 'modal',
    content: {
      title: t('tutorial.steps.appOverview.title'),
      content: t('tutorial.steps.appOverview.content'),
      button: t('tutorial.steps.appOverview.button')
    },
    action: 'next'
  },

  // Step 3: Quick Actions Explanation
  {
    id: 'quick-actions',
    type: 'spotlight',
    target: 'quick-actions-section',
    content: {
      title: t('tutorial.steps.quickActions.title'),
      content: t('tutorial.steps.quickActions.content'),
      button: t('tutorial.steps.quickActions.button')
    },
    action: 'next'
  },

  // Step 4: Create First Habit - Button
  {
    id: 'create-habit-button',
    type: 'spotlight',
    target: 'add-habit-button',
    content: {
      title: t('tutorial.steps.createHabitButton.title'),
      content: t('tutorial.steps.createHabitButton.content'),
      button: t('tutorial.steps.createHabitButton.button')
    },
    action: 'click_element'
  },

  // Step 5a: Habit Name Input
  {
    id: 'habit-name',
    type: 'spotlight',
    target: 'habit-name-input',
    content: {
      title: t('tutorial.steps.habitName.title'),
      content: t('tutorial.steps.habitName.content'),
      examples: t('tutorial.steps.habitName.examples'),
      placeholder: t('tutorial.steps.habitName.placeholder'),
      button: t('tutorial.steps.habitName.button')
    },
    action: 'type_text',
    nextTrigger: 'first_character'
  },

  // Step 5b: Habit Color Selection
  {
    id: 'habit-color',
    type: 'spotlight',
    target: 'habit-color-picker',
    content: {
      title: t('tutorial.steps.habitColor.title'),
      content: t('tutorial.steps.habitColor.content'),
      button: t('tutorial.steps.habitColor.button')
    },
    action: 'select_option'
  },

  // Step 5c: Habit Icon Selection
  {
    id: 'habit-icon',
    type: 'spotlight',
    target: 'habit-icon-picker',
    content: {
      title: t('tutorial.steps.habitIcon.title'),
      content: t('tutorial.steps.habitIcon.content'),
      button: t('tutorial.steps.habitIcon.button')
    },
    action: 'select_option'
  },

  // Step 5d: Habit Schedule Days
  {
    id: 'habit-days',
    type: 'spotlight',
    target: 'habit-scheduled-days',
    content: {
      title: t('tutorial.steps.habitDays.title'),
      content: t('tutorial.steps.habitDays.content'),
      button: t('tutorial.steps.habitDays.button')
    },
    action: 'select_days'
  },

  // Step 5e: Create Habit
  {
    id: 'habit-create',
    type: 'spotlight',
    target: 'create-habit-submit',
    content: {
      title: t('tutorial.steps.habitCreate.title'),
      content: t('tutorial.steps.habitCreate.content'),
      button: t('tutorial.steps.habitCreate.button')
    },
    action: 'click_element'
  },

  // Step 6: Habit Creation Complete
  {
    id: 'habit-complete',
    type: 'modal',
    content: {
      title: t('tutorial.steps.habitComplete.title'),
      content: t('tutorial.steps.habitComplete.content'),
      button: t('tutorial.steps.habitComplete.button')
    },
    action: 'next'
  },

  // Step 7: Navigate to Journal
  {
    id: 'navigate-journal',
    type: 'spotlight',
    target: 'journal-tab',
    content: {
      title: t('tutorial.steps.journalIntro.title'),
      content: t('tutorial.steps.journalIntro.content'),
      button: t('tutorial.steps.journalIntro.button')
    },
    action: 'click_element'
  },

  // Step 8: Journal Actions Explanation
  {
    id: 'journal-actions',
    type: 'spotlight',
    target: 'gratitude-input',
    content: {
      title: t('tutorial.steps.gratitudeEntry.title'),
      content: t('tutorial.steps.gratitudeEntry.content'),
      button: t('tutorial.steps.gratitudeEntry.button')
    },
    action: 'next'
  },

  // Step 9: Navigate to Goals
  {
    id: 'navigate-goals',
    type: 'spotlight',
    target: 'goals-tab',
    content: {
      title: t('tutorial.steps.goalsIntro.title'),
      content: t('tutorial.steps.goalsIntro.content'),
      button: t('tutorial.steps.goalsIntro.button')
    },
    action: 'click_element'
  },

  // Step 10: Create First Goal - Button
  {
    id: 'create-goal-button',
    type: 'spotlight',
    target: 'add-goal-button',
    content: {
      title: 'Create Your First Goal',
      content: 'Click + Add Goal to set your first meaningful target!',
      button: 'Click Here'
    },
    action: 'click_element'
  },

  // Step 11: Goal Title
  {
    id: 'goal-title',
    type: 'spotlight',
    target: 'goal-title-input',
    content: {
      title: t('tutorial.steps.goalTitle.title'),
      content: t('tutorial.steps.goalTitle.content'),
      placeholder: t('tutorial.steps.goalTitle.placeholder'),
      examples: t('tutorial.steps.goalTitle.examples'),
      button: t('tutorial.steps.goalTitle.button')
    },
    action: 'type_text',
    nextTrigger: 'first_character'
  },

  // Step 12: Goal Unit
  {
    id: 'goal-unit',
    type: 'spotlight',
    target: 'goal-unit-input',
    content: {
      title: t('tutorial.steps.goalUnit.title'),
      content: t('tutorial.steps.goalUnit.content'),
      placeholder: t('tutorial.steps.goalUnit.placeholder'),
      examples: t('tutorial.steps.goalUnit.examples'),
      button: t('tutorial.steps.goalUnit.button')
    },
    action: 'type_text',
    nextTrigger: 'first_character'
  },

  // Step 13: Goal Target
  {
    id: 'goal-target',
    type: 'spotlight',
    target: 'goal-target-input',
    content: {
      title: t('tutorial.steps.goalTarget.title'),
      content: t('tutorial.steps.goalTarget.content'),
      placeholder: t('tutorial.steps.goalTarget.placeholder'),
      button: t('tutorial.steps.goalTarget.button')
    },
    action: 'type_number',
    nextTrigger: 'first_character'
  },

  // Step 14: Goal Date (Optional)
  {
    id: 'goal-date',
    type: 'spotlight',
    target: 'goal-date-picker',
    content: {
      title: t('tutorial.steps.goalDate.title'),
      content: t('tutorial.steps.goalDate.content'),
      placeholder: t('tutorial.steps.goalDate.placeholder'),
      button: t('tutorial.steps.goalDate.button')
    },
    action: 'select_date'
  },

  // Step 15: Create Goal
  {
    id: 'goal-create',
    type: 'spotlight',
    target: 'create-goal-submit',
    content: {
      title: 'Create Your Goal!',
      content: 'Click Create to add your first goal!',
      button: 'Create'
    },
    action: 'click_element'
  },

  // Step 16: Navigate to Home
  {
    id: 'navigate-home',
    type: 'spotlight',
    target: 'home-tab',
    content: {
      title: 'Back to Your Dashboard 🏠',
      content: 'Click Home to see your progress overview!',
      button: 'Go Home'
    },
    action: 'click_element'
  },

  // Step 17: XP System Introduction
  {
    id: 'xp-intro',
    type: 'spotlight',
    target: 'xp-progress-section',
    content: {
      title: t('tutorial.steps.xpIntro.title'),
      content: t('tutorial.steps.xpIntro.content'),
      button: t('tutorial.steps.xpIntro.button')
    },
    action: 'next'
  },

  // Step 16: Tutorial Complete
  {
    id: 'completion',
    type: 'modal',
    content: {
      title: t('tutorial.steps.completion.title'),
      content: t('tutorial.steps.completion.content'),
      button: t('tutorial.steps.completion.button')
    },
    action: 'next'
  }
];

// Reducer
function tutorialReducer(state: TutorialState, action: TutorialAction): TutorialState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'START_TUTORIAL':
      return {
        ...state,
        isActive: true,
        currentStep: 1,
        isCompleted: false,
        isSkipped: false,
        userInteractionBlocked: true,
        totalSteps: action.payload.steps.length,
        currentStepData: action.payload.steps[0] || null,
        isLoading: false,
        error: null
      };

    case 'SET_CURRENT_STEP':
      const stepIndex = Math.max(0, Math.min(action.payload.stepNumber - 1, action.payload.steps.length - 1));
      return {
        ...state,
        currentStep: action.payload.stepNumber,
        currentStepData: action.payload.steps[stepIndex] || null,
        showNext: false
      };

    case 'SET_STEP_DATA':
      return { ...state, currentStepData: action.payload };

    case 'COMPLETE_TUTORIAL':
      return {
        ...state,
        isActive: false,
        isCompleted: true,
        userInteractionBlocked: false,
        currentStepData: null
      };

    case 'SKIP_TUTORIAL':
      return {
        ...state,
        isActive: false,
        isSkipped: true,
        userInteractionBlocked: false,
        currentStepData: null
      };

    case 'SET_INTERACTION_BLOCKED':
      return { ...state, userInteractionBlocked: action.payload };

    case 'SHOW_NEXT_BUTTON':
      return { ...state, showNext: action.payload };

    case 'RESET_TUTORIAL':
      return {
        ...initialState,
        isLoading: false
      };

    case 'HIGHLIGHT_FIELD':
      return {
        ...state,
        highlightedField: action.payload,
        userFeedback: action.payload ? state.userFeedback : null // Clear feedback when removing highlight
      };

    case 'SET_FIELD_VALIDATION':
      return {
        ...state,
        fieldValidationStatus: {
          ...state.fieldValidationStatus,
          [action.payload.fieldId]: action.payload.status
        }
      };

    case 'SHOW_USER_FEEDBACK':
      return {
        ...state,
        userFeedback: {
          message: action.payload.message,
          type: action.payload.type,
          visible: true
        }
      };

    case 'HIDE_USER_FEEDBACK':
      return {
        ...state,
        userFeedback: state.userFeedback ? { ...state.userFeedback, visible: false } : null
      };

    default:
      return state;
  }
}

// Context
const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Provider Component
export function TutorialProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);
  const { t } = useTranslation();

  // Create tutorial steps with translations
  const TUTORIAL_STEPS = createTutorialSteps(t);

  // Modal Coordination with XpAnimationContext - only for achievement modal detection
  const { state: xpState } = useXpAnimation();


  // Helper Functions
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  // Storage Functions
  const saveTutorialProgress = async (step: number) => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STEP_KEY, step.toString());
    } catch (error) {
      console.warn('Failed to save tutorial progress:', error);
    }
  };

  const markTutorialCompleted = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      await AsyncStorage.removeItem(TUTORIAL_STEP_KEY);
    } catch (error) {
      console.warn('Failed to mark tutorial as completed:', error);
    }
  };

  const markTutorialSkipped = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_SKIPPED_KEY, 'true');
      await AsyncStorage.removeItem(TUTORIAL_STEP_KEY);
    } catch (error) {
      console.warn('Failed to mark tutorial as skipped:', error);
    }
  };

  const shouldShowTutorial = async (): Promise<boolean> => {
    try {
      const isCompleted = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      const isSkipped = await AsyncStorage.getItem(TUTORIAL_SKIPPED_KEY);
      return isCompleted !== 'true' && isSkipped !== 'true';
    } catch (error) {
      console.warn('Failed to check tutorial status:', error);
      return true; // Show tutorial by default if we can't check
    }
  };

  const getTutorialResumeStep = async (): Promise<number> => {
    try {
      const step = await AsyncStorage.getItem(TUTORIAL_STEP_KEY);
      return step ? parseInt(step, 10) : 1;
    } catch (error) {
      console.warn('Failed to get tutorial resume step:', error);
      return 1;
    }
  };

  // Session Management Functions
  const saveTutorialSession = async (tutorialState: TutorialState) => {
    try {
      const sessionData = {
        state: {
          isActive: tutorialState.isActive,
          currentStep: tutorialState.currentStep,
          totalSteps: tutorialState.totalSteps,
          userInteractionBlocked: tutorialState.userInteractionBlocked,
          showNext: tutorialState.showNext,
          highlightedField: tutorialState.highlightedField,
          fieldValidationStatus: tutorialState.fieldValidationStatus,
          userFeedback: tutorialState.userFeedback,
        },
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(TUTORIAL_SESSION_KEY, JSON.stringify(sessionData));
      await AsyncStorage.setItem(TUTORIAL_SESSION_TIMESTAMP_KEY, sessionData.timestamp.toString());

      console.log('💾 Tutorial session saved for backgrounding recovery');
    } catch (error) {
      console.warn('Failed to save tutorial session:', error);
    }
  };

  const restoreTutorialSession = async (): Promise<boolean> => {
    try {
      const sessionDataStr = await AsyncStorage.getItem(TUTORIAL_SESSION_KEY);
      const timestampStr = await AsyncStorage.getItem(TUTORIAL_SESSION_TIMESTAMP_KEY);

      if (!sessionDataStr || !timestampStr) {
        return false;
      }

      const sessionData = JSON.parse(sessionDataStr);
      const sessionAge = Date.now() - parseInt(timestampStr, 10);

      // Session expires after 1 hour (3600000 ms) to avoid stale sessions
      if (sessionAge > 3600000) {
        console.log('🕐 Tutorial session expired, starting fresh');
        await clearTutorialSession();
        return false;
      }

      console.log('🔄 Restoring tutorial session from background');

      // Restore tutorial state
      dispatch({
        type: 'START_TUTORIAL',
        payload: { steps: TUTORIAL_STEPS }
      });

      dispatch({
        type: 'SET_CURRENT_STEP',
        payload: { stepNumber: sessionData.state.currentStep, steps: TUTORIAL_STEPS }
      });

      // Restore UI state
      if (sessionData.state.highlightedField) {
        dispatch({
          type: 'HIGHLIGHT_FIELD',
          payload: sessionData.state.highlightedField
        });
      }

      if (sessionData.state.userFeedback) {
        dispatch({
          type: 'SHOW_USER_FEEDBACK',
          payload: sessionData.state.userFeedback
        });
      }

      return true;
    } catch (error) {
      console.warn('Failed to restore tutorial session:', error);
      await clearTutorialSession();
      return false;
    }
  };

  const clearTutorialSession = async () => {
    try {
      await AsyncStorage.removeItem(TUTORIAL_SESSION_KEY);
      await AsyncStorage.removeItem(TUTORIAL_SESSION_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Failed to clear tutorial session:', error);
    }
  };

  // Crash Recovery System Functions
  const logCrash = async (error: Error, context: { step: number; stepId: string; userAgent?: string }) => {
    try {
      const crashLog: TutorialCrashLog = {
        timestamp: Date.now(),
        error: error.message || 'Unknown error',
        ...(error.stack && { stack: error.stack }),
        step: context.step,
        stepId: context.stepId,
        userAgent: context.userAgent || 'Unknown',
        appState: AppState.currentState === 'unknown' ? 'inactive' : AppState.currentState as 'active' | 'background' | 'inactive',
        attempts: 1,
      };

      // Get existing crash logs
      const existingLogs = await getCrashLogs();
      const updatedLogs = [...existingLogs.slice(-9), crashLog]; // Keep last 10 crashes

      await AsyncStorage.setItem(TUTORIAL_CRASH_LOG_KEY, JSON.stringify(updatedLogs));

      // Update error count
      const recoveryState = await getRecoveryState();
      recoveryState.errorCount += 1;
      recoveryState.lastCrash = crashLog;
      recoveryState.recoveryTimestamp = Date.now();

      await AsyncStorage.setItem(TUTORIAL_RECOVERY_STATE_KEY, JSON.stringify(recoveryState));

      console.error('💥 Tutorial crash logged:', {
        error: error.message,
        step: context.step,
        stepId: context.stepId
      });
    } catch (logError) {
      console.error('Failed to log crash:', logError);
    }
  };

  const getCrashLogs = async (): Promise<TutorialCrashLog[]> => {
    try {
      const logsStr = await AsyncStorage.getItem(TUTORIAL_CRASH_LOG_KEY);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch (error) {
      console.warn('Failed to get crash logs:', error);
      return [];
    }
  };

  const getRecoveryState = async (): Promise<TutorialRecoveryState> => {
    try {
      const stateStr = await AsyncStorage.getItem(TUTORIAL_RECOVERY_STATE_KEY);
      if (stateStr) {
        return JSON.parse(stateStr);
      }
    } catch (error) {
      console.warn('Failed to get recovery state:', error);
    }

    // Default recovery state
    return {
      errorCount: 0,
      recoveryAttempts: 0,
      isInRecoveryMode: false,
      fallbackEnabled: false,
      recoveryTimestamp: Date.now(),
    };
  };

  const attemptRecovery = async (error: Error): Promise<boolean> => {
    try {
      const recoveryState = await getRecoveryState();

      // Increment recovery attempts
      recoveryState.recoveryAttempts += 1;
      recoveryState.isInRecoveryMode = true;
      recoveryState.recoveryTimestamp = Date.now();

      console.log(`🔧 Attempting tutorial recovery (attempt #${recoveryState.recoveryAttempts})`);

      // Recovery strategy based on error count and type
      if (recoveryState.errorCount < 3) {
        // Low error count - try simple state reset
        console.log('🔄 Simple state reset recovery');
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INTERACTION_BLOCKED', payload: false });

        await AsyncStorage.setItem(TUTORIAL_RECOVERY_STATE_KEY, JSON.stringify(recoveryState));
        return true;

      } else if (recoveryState.errorCount < 6) {
        // Medium error count - try session restoration from backup
        console.log('🔄 Session restoration recovery');
        const restored = await restoreTutorialSession();
        if (restored) {
          await AsyncStorage.setItem(TUTORIAL_RECOVERY_STATE_KEY, JSON.stringify(recoveryState));
          return true;
        }

        // If session restoration fails, reset to safe step
        console.log('🔄 Safe step reset recovery');
        const safeStep = Math.max(1, state.currentStep - 2); // Go back 2 steps
        dispatch({
          type: 'SET_CURRENT_STEP',
          payload: { stepNumber: safeStep, steps: TUTORIAL_STEPS }
        });
        await saveTutorialProgress(safeStep);
        await AsyncStorage.setItem(TUTORIAL_RECOVERY_STATE_KEY, JSON.stringify(recoveryState));
        return true;

      } else {
        // High error count - enable fallback mode
        console.log('⚠️ Enabling fallback mode due to repeated crashes');
        recoveryState.fallbackEnabled = true;

        // Reset tutorial to beginning with fallback mode
        dispatch({ type: 'RESET_TUTORIAL' });
        dispatch({
          type: 'SHOW_USER_FEEDBACK',
          payload: {
            message: 'Tutorial experienced issues. Running in simplified mode.',
            type: 'warning'
          }
        });

        await AsyncStorage.setItem(TUTORIAL_RECOVERY_STATE_KEY, JSON.stringify(recoveryState));
        return true;
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    }
  };

  const clearCrashData = async () => {
    try {
      await AsyncStorage.removeItem(TUTORIAL_CRASH_LOG_KEY);
      await AsyncStorage.removeItem(TUTORIAL_ERROR_COUNT_KEY);
      await AsyncStorage.removeItem(TUTORIAL_RECOVERY_STATE_KEY);
      console.log('🧹 Crash recovery data cleared');
    } catch (error) {
      console.warn('Failed to clear crash data:', error);
    }
  };

  const validateTutorialState = (): boolean => {
    try {
      // Check for invalid state combinations
      if (state.currentStep < 1 || state.currentStep > state.totalSteps) {
        console.warn('⚠️ Invalid current step detected');
        return false;
      }

      if (state.isCompleted && state.isSkipped) {
        console.warn('⚠️ Invalid completion state detected');
        return false;
      }

      if (state.isActive && (state.isCompleted || state.isSkipped)) {
        console.warn('⚠️ Invalid active state detected');
        return false;
      }

      if (state.currentStepData && state.currentStepData.id !== TUTORIAL_STEPS[state.currentStep - 1]?.id) {
        console.warn('⚠️ Step data mismatch detected');
        return false;
      }

      return true;
    } catch (error) {
      console.error('State validation failed:', error);
      return false;
    }
  };

  const handleTutorialError = async (error: Error, context?: { action?: string; step?: number }) => {
    console.error('🚨 Tutorial Error:', error);

    // Log the crash
    await logCrash(error, {
      step: context?.step || state.currentStep,
      stepId: state.currentStepData?.id || 'unknown',
      userAgent: navigator.userAgent
    });

    // Validate current state
    if (!validateTutorialState()) {
      console.warn('⚠️ Invalid state detected, attempting recovery');
      const recovered = await attemptRecovery(error);

      if (!recovered) {
        console.error('💥 Recovery failed, resetting tutorial');
        dispatch({ type: 'RESET_TUTORIAL' });
        dispatch({
          type: 'SHOW_USER_FEEDBACK',
          payload: {
            message: 'Tutorial encountered an error and was reset.',
            type: 'error'
          }
        });
      }
    } else {
      // State is valid, try simple recovery
      const recovered = await attemptRecovery(error);
      if (!recovered) {
        setError('Tutorial encountered an error. Please try again.');
      }
    }
  };

  // Action Functions
  const startTutorial = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const shouldShow = await shouldShowTutorial();
      if (!shouldShow) {
        setError('Tutorial already completed or skipped');
        return;
      }

      dispatch({ type: 'START_TUTORIAL', payload: { steps: TUTORIAL_STEPS } });
      await saveTutorialProgress(1);
    } catch (error) {
      await handleTutorialError(error instanceof Error ? error : new Error('Failed to start tutorial'), {
        action: 'startTutorial',
        step: state.currentStep
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async (): Promise<void> => {
    try {
      const currentStepData = state.currentStepData;
      const currentStepNumber = state.currentStep;

      // Track step completion before moving to next

      const newStep = state.currentStep + 1;

      console.log(`🎓 [NEXT STEP] Current: ${state.currentStep}, New: ${newStep}, Total: ${state.totalSteps}`);

      if (newStep > state.totalSteps) {
        console.log(`🏁 [TUTORIAL] Completing tutorial - step ${newStep} exceeds total ${state.totalSteps}`);
        await completeTutorial();
        return;
      }

      dispatch({ type: 'SET_CURRENT_STEP', payload: { stepNumber: newStep, steps: TUTORIAL_STEPS } });
      await saveTutorialProgress(newStep);

      const newStepData = TUTORIAL_STEPS[newStep - 1];
    } catch (error) {
      await handleTutorialError(error instanceof Error ? error : new Error('Failed to proceed to next step'), {
        action: 'nextStep',
        step: state.currentStep
      });
    }
  };

  const skipTutorial = async (): Promise<void> => {
    try {
      setLoading(true);

      // Clear any saved session data
      await clearTutorialSession();

      dispatch({ type: 'SKIP_TUTORIAL' });
      await markTutorialSkipped();
    } catch (error) {
      await handleTutorialError(error instanceof Error ? error : new Error('Failed to skip tutorial'), {
        action: 'skipTutorial',
        step: state.currentStep
      });
    } finally {
      setLoading(false);
    }
  };

  const completeTutorial = async (): Promise<void> => {
    try {
      setLoading(true);

      // Clear any saved session data
      await clearTutorialSession();

      dispatch({ type: 'COMPLETE_TUTORIAL' });
      await markTutorialCompleted();
    } catch (error) {
      await handleTutorialError(error instanceof Error ? error : new Error('Failed to complete tutorial'), {
        action: 'completeTutorial',
        step: state.currentStep
      });
    } finally {
      setLoading(false);
    }
  };

  const resumeTutorial = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const shouldShow = await shouldShowTutorial();
      if (!shouldShow) {
        setError('Tutorial already completed or skipped');
        return;
      }

      const resumeStep = await getTutorialResumeStep();
      dispatch({ type: 'START_TUTORIAL', payload: { steps: TUTORIAL_STEPS } });
      dispatch({ type: 'SET_CURRENT_STEP', payload: { stepNumber: resumeStep, steps: TUTORIAL_STEPS } });
    } catch (error) {
      await handleTutorialError(error instanceof Error ? error : new Error('Failed to resume tutorial'), {
        action: 'resumeTutorial',
        step: state.currentStep
      });
    } finally {
      setLoading(false);
    }
  };

  const resetTutorial = async (): Promise<void> => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
      await AsyncStorage.removeItem(TUTORIAL_STEP_KEY);
      await AsyncStorage.removeItem(TUTORIAL_SKIPPED_KEY);
      dispatch({ type: 'RESET_TUTORIAL' });
    } catch (error) {
      await handleTutorialError(error instanceof Error ? error : new Error('Failed to reset tutorial'), {
        action: 'resetTutorial',
        step: state.currentStep
      });
    } finally {
      setLoading(false);
    }
  };

  const restartTutorial = async (): Promise<void> => {
    try {
      setLoading(true);

      // First reset all tutorial data
      await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
      await AsyncStorage.removeItem(TUTORIAL_STEP_KEY);
      await AsyncStorage.removeItem(TUTORIAL_SKIPPED_KEY);
      dispatch({ type: 'RESET_TUTORIAL' });

      // Navigate to Home screen
      router.push('/(tabs)' as any);

      // Small delay to ensure navigation completes
      await new Promise(resolve => setTimeout(resolve, 300));

      // Then immediately start tutorial
      dispatch({ type: 'START_TUTORIAL', payload: { steps: TUTORIAL_STEPS } });
      await saveTutorialProgress(1);

    } catch (error) {
      await handleTutorialError(error instanceof Error ? error : new Error('Failed to restart tutorial'), {
        action: 'restartTutorial',
        step: state.currentStep
      });
    } finally {
      setLoading(false);
    }
  };

  const setUserInteractionBlocked = (blocked: boolean) => {
    dispatch({ type: 'SET_INTERACTION_BLOCKED', payload: blocked });
  };

  const showNextButton = (show: boolean) => {
    dispatch({ type: 'SHOW_NEXT_BUTTON', payload: show });
  };

  const handleStepAction = async (action: string, value?: any): Promise<void> => {
    try {
      const currentStepData = state.currentStepData;
      if (!currentStepData) return;

      console.log(`🎓 Tutorial Step Action: ${currentStepData.id} - ${action} - Value:`, value);

      // Handle different action types with enhanced validation and user guidance
      switch (action) {
        case 'type_text':
          await handleTextInput(currentStepData, value);
          break;

        case 'select_option':
          // For select_option, when called from Next button (no value), advance to next step
          if (value === undefined) {
            await nextStep();
          } else {
            await handleOptionSelection(currentStepData, value);
          }
          break;

        case 'select_date':
          await handleDateSelection(currentStepData, value);
          break;

        case 'select_days':
          // For select_days, when called from Next button (no value), advance to next step
          if (value === undefined) {
            await nextStep();
          } else {
            await handleDaySelection(currentStepData, value);
          }
          break;

        case 'type_number':
          await handleNumberInput(currentStepData, value);
          break;

        case 'click_element':
          console.log(`🎯 Element clicked: ${currentStepData.target}`);

          // Handle specific navigation actions for certain steps
          if (currentStepData.id === 'create-habit-button' && currentStepData.target === 'add-habit-button') {
            console.log(`🎯 Navigating to habit creation screen...`);
            // Navigate to habits tab with quickAction to open add habit modal
            router.push('/(tabs)/habits?quickAction=addHabit');

            // Wait for navigation and modal to complete before continuing tutorial
            // Extended wait time to ensure modal is fully loaded and targets are registered
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Additionally wait for tutorial targets to be registered in the modal
            let retryCount = 0;
            const maxRetries = 10;
            while (retryCount < maxRetries) {
              const targetExists = await tutorialTargetManager.getTargetInfo('habit-name-input');
              if (targetExists) {
                console.log(`✅ Tutorial target 'habit-name-input' is ready after ${retryCount} retries`);
                break;
              }
              console.log(`⏳ Waiting for tutorial target 'habit-name-input' to be registered... (${retryCount + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 200));
              retryCount++;
            }

            if (retryCount >= maxRetries) {
              console.warn(`⚠️ Tutorial target 'habit-name-input' still not found after ${maxRetries} retries`);
            }
          }

          await nextStep();
          break;

        case 'next':
          await nextStep();
          break;

        default:
          console.warn(`⚠️ Unknown tutorial action: ${currentStepData.action}`);
      }
    } catch (error) {
      await handleTutorialError(error instanceof Error ? error : new Error('Failed to handle step action'), {
        action: 'handleStepAction',
        step: state.currentStep
      });
    }
  };

  // Enhanced Form Interaction Handlers
  const handleTextInput = async (stepData: TutorialStep, value: string) => {

    // Highlight current field
    if (stepData.target) {
      highlightField(stepData.target);
    }

    // Progressive Form Filling Logic
    if (stepData.nextTrigger === 'first_character' && value && value.length > 0) {
      console.log(`✅ First character typed in ${stepData.id}, enabling Next button`);
      showNextButton(true);
      setFieldValidation(stepData.id, 'valid');
      showUserFeedback('Great start! Continue typing...', 'success');
    }

    // Validate text input based on step type with visual feedback
    if (stepData.id === 'habit-name') {
      const isValid = validateHabitName(value);
      setFieldValidation(stepData.id, isValid ? 'valid' : 'pending');
    } else if (stepData.id === 'goal-title') {
      const isValid = validateGoalTitle(value);
      setFieldValidation(stepData.id, isValid ? 'valid' : 'pending');
    } else if (stepData.id === 'goal-unit') {
      const isValid = validateGoalUnit(value);
      setFieldValidation(stepData.id, isValid ? 'valid' : 'pending');

      // Clear highlight after successful validation
      if (isValid) {
        setTimeout(() => clearFieldHighlight(), 800);
      }
    }
  };

  const handleOptionSelection = async (stepData: TutorialStep, value: any) => {
    if (value !== undefined && value !== null) {
      console.log(`✅ Option selected in ${stepData.id}:`, value);

      // Visual feedback
      if (stepData.target) {
        highlightField(stepData.target);
      }

      // Goal-specific category validation
      if (stepData.id === 'goal-category') {
        const isValid = validateGoalCategory(value);
        setFieldValidation(stepData.id, isValid ? 'valid' : 'invalid');
        if (isValid) {
          showNextButton(true);
        }
      } else {
        setFieldValidation(stepData.id, 'valid');
        showUserFeedback('Perfect choice! 👌', 'success');
        showNextButton(true);
      }

      // Add small delay for better UX before enabling Next
      setTimeout(() => {
        console.log(`🎯 ${stepData.id} selection confirmed, user can proceed`);
        clearFieldHighlight();
      }, 300);
    }
  };

  const handleDateSelection = async (stepData: TutorialStep, value: Date) => {
    if (value && value instanceof Date) {
      // Visual feedback
      if (stepData.target) {
        highlightField(stepData.target);
      }

      // Validate date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (value >= today) {
        console.log(`✅ Valid future date selected: ${value.toDateString()}`);

        // Goal-specific date validation
        if (stepData.id === 'goal-date') {
          const isValid = validateGoalDate(value);
          setFieldValidation(stepData.id, isValid ? 'valid' : 'invalid');
          if (isValid) {
            showNextButton(true);
          }
        } else {
          setFieldValidation(stepData.id, 'valid');
          showUserFeedback(`Great! Target date: ${value.toDateString()} 📅`, 'success');
          showNextButton(true);
        }

        setTimeout(() => clearFieldHighlight(), 500);
      } else {
        console.log(`⚠️ Past date selected, showing helpful guidance`);
        setFieldValidation(stepData.id, 'invalid');

        // Use goal-specific validation for better feedback
        if (stepData.id === 'goal-date') {
          validateGoalDate(value);
        } else {
          showUserFeedback('Please choose a future date for your goal! 🔮', 'warning');
        }
      }
    }
  };

  const handleDaySelection = async (stepData: TutorialStep, value: string[]) => {
    if (value && Array.isArray(value) && value.length > 0) {
      console.log(`✅ Days selected: ${value.join(', ')}`);

      // Visual feedback
      if (stepData.target) {
        highlightField(stepData.target);
      }
      setFieldValidation(stepData.id, 'valid');
      showNextButton(true);

      // Provide encouraging feedback based on selection
      if (value.length <= 3) {
        showUserFeedback(`Perfect! Starting with ${value.length} day(s) builds consistency! 💪`, 'success');
      } else {
        showUserFeedback(`Ambitious! ${value.length} days is great for building momentum! 🚀`, 'success');
      }

      setTimeout(() => clearFieldHighlight(), 500);
    }
  };

  const handleNumberInput = async (stepData: TutorialStep, value: string) => {
    const numValue = parseFloat(value);

    // Visual feedback
    if (stepData.target) {
      highlightField(stepData.target);
    }

    if (!isNaN(numValue) && numValue > 0) {
      console.log(`✅ Valid number entered: ${numValue}`);
      setFieldValidation(stepData.id, 'valid');
      showNextButton(true);

      // Goal-specific value validation
      if (stepData.id === 'goal-value') {
        const isValid = validateGoalValue(numValue);
        setFieldValidation(stepData.id, isValid ? 'valid' : 'invalid');
        // Note: validateGoalValue already shows appropriate feedback
      } else {
        setFieldValidation(stepData.id, 'valid');
        showUserFeedback(`Great! ${numValue} is a perfect target! ✨`, 'success');
      }

      setTimeout(() => clearFieldHighlight(), 500);
    } else {
      setFieldValidation(stepData.id, 'invalid');
      showUserFeedback('Please enter a positive number! 🔢', 'warning');
    }
  };

  // Validation Helpers with User-Friendly Feedback
  const validateHabitName = (name: string) => {
    if (!name || name.trim().length === 0) return false;

    if (name.length < 2) {
      console.log(`💡 Habit name guidance: Try something a bit longer like "Drink water" or "Read 10 pages"`);

      return false;
    }

    if (name.length > 50) {
      console.log(`💡 Habit name guidance: Keep it short and simple - under 50 characters works best!`);

      return false;
    }

    return true;
  };

  const validateGoalTitle = (title: string) => {
    if (!title || title.trim().length === 0) return false;

    if (title.length < 3) {
      console.log(`💡 Goal title guidance: Try something descriptive like "Read 12 books" or "Run a marathon"`);
      return false;
    }

    return true;
  };


  const validateGoalValue = (value: number) => {
    if (value <= 0) {
      console.log(`💡 Goal value guidance: Your target should be a positive number!`);
      showUserFeedback('Please enter a positive number for your goal! 🎯', 'warning');
      return false;
    }

    if (value > 10000) {
      console.log(`💡 Goal value guidance: That's ambitious! Consider breaking it down into smaller milestones.`);
      showUserFeedback('That\'s very ambitious! Consider smaller milestones for better success! 🚀', 'info');
    } else if (value < 1) {
      showUserFeedback('Your goal should be at least 1! Aim higher! ⭐', 'warning');
      return false;
    } else {
      showUserFeedback(`Perfect target: ${value}! This looks achievable and motivating! 🎯`, 'success');
    }

    return true;
  };

  // Enhanced Goal-Specific Validation Helpers
  const validateGoalDate = (selectedDate: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (selectedDate < today) {
      showUserFeedback('Please choose a future date for your goal! 🔮', 'warning');
      return false;
    }

    if (selectedDate > oneYearFromNow) {
      showUserFeedback('That\'s quite far ahead! Consider shorter-term goals for better momentum! 📅', 'info');
    }

    // Calculate days until goal
    const timeDiff = selectedDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff <= 7) {
      showUserFeedback(`${daysDiff} days - a quick sprint goal! Perfect for building momentum! ⚡`, 'success');
    } else if (daysDiff <= 30) {
      showUserFeedback(`${daysDiff} days - great monthly challenge! Achievable and motivating! 📅`, 'success');
    } else if (daysDiff <= 90) {
      showUserFeedback(`${daysDiff} days - excellent quarterly goal! Perfect timeframe! 🎯`, 'success');
    } else {
      showUserFeedback(`${daysDiff} days - ambitious long-term goal! Consider milestone checkpoints! 🏔️`, 'success');
    }

    return true;
  };

  const validateGoalCategory = (category: string): boolean => {
    const validCategories = ['personal', 'health', 'career', 'finance', 'learning', 'creative'];

    if (!category || category.trim().length === 0) {
      showUserFeedback('Please select a category to organize your goal! 📂', 'warning');
      return false;
    }

    if (validCategories.includes(category.toLowerCase())) {
      showUserFeedback(`Great choice! ${category} goals are very important for balanced growth! 🌟`, 'success');
    } else {
      showUserFeedback('Perfect! This category will help you track progress! 📊', 'success');
    }

    return true;
  };

  const validateGoalUnit = (unit: string): boolean => {
    if (!unit || unit.trim().length === 0) {
      showUserFeedback('Please specify what unit you\'ll measure! 📏', 'warning');
      return false;
    };

    if (unit.length < 2) {
      showUserFeedback('Try a more descriptive unit like "books" or "hours"! 📚', 'warning');
      return false;
    }

    const commonUnits = ['books', 'pages', 'chapters', 'miles', 'kilometers', 'steps', 'dollars', 'euros', 'hours', 'minutes', 'sessions', 'workouts', 'classes', 'practices'];
    const isCommonUnit = commonUnits.some(u => unit.toLowerCase().includes(u.toLowerCase()));

    if (isCommonUnit) {
      showUserFeedback(`Excellent unit choice: "${unit}" - very clear and measurable! 📊`, 'success');
    } else {
      showUserFeedback(`Good unit: "${unit}" - make sure it\'s easy to track! ✅`, 'success');
    }

    return true;
  };

  // Check tutorial status on mount
  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const shouldShow = await shouldShowTutorial();
        if (shouldShow) {
          const resumeStep = await getTutorialResumeStep();
          if (resumeStep > 1) {
            // User has an interrupted tutorial, they can choose to resume
            console.log(`Tutorial can be resumed from step ${resumeStep}`);
          }
        }
      } catch (error) {
        console.warn('Failed to check tutorial status on mount:', error);
      }
    };

    checkTutorialStatus();
  }, []);

  // Achievement Modal Coordination - Auto proceed when achievement modals complete
  useEffect(() => {
    if (!state.isActive || !state.currentStepData) return;

    // Check if current step is an achievement waiting step
    const isAchievementWaitingStep =
      state.currentStepData.id === 'first-habit-achievement' ||
      state.currentStepData.id === 'first-goal-achievement';

    if (isAchievementWaitingStep) {
      // If achievement modal was active and now finished, proceed to next step
      if (!xpState.modalCoordination.isAchievementModalActive) {
        console.log('🏆 Achievement modal completed, auto-proceeding to next tutorial step');
        // Add small delay to ensure modal is fully closed
        setTimeout(() => {
          nextStep();
        }, 500);
      }
    }
  }, [xpState.modalCoordination.isAchievementModalActive, state.currentStepData, state.isActive]);

  // Tutorial has its own overlay system and should not interfere with modal coordination
  // Removing modal coordination notification to prevent conflicts with Monthly Challenge modals
  useEffect(() => {
    if (state.isActive) {
      console.log('🎓 Tutorial started - independent of modal coordination system');
    } else {
      console.log('🎓 Tutorial ended - independent of modal coordination system');
    }
  }, [state.isActive]);

  // Visual Feedback & Highlighting Helper Methods
  const highlightField = (fieldId: string) => {
    console.log(`🎯 Highlighting field: ${fieldId}`);
    dispatch({ type: 'HIGHLIGHT_FIELD', payload: fieldId });
  };

  const clearFieldHighlight = () => {
    console.log(`✨ Clearing field highlight`);
    dispatch({ type: 'HIGHLIGHT_FIELD', payload: null });
  };

  const setFieldValidation = (fieldId: string, status: 'valid' | 'invalid' | 'pending') => {
    console.log(`📋 Setting field validation: ${fieldId} = ${status}`);
    dispatch({ type: 'SET_FIELD_VALIDATION', payload: { fieldId, status } });
  };

  const showUserFeedback = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    console.log(`💬 Showing user feedback: [${type}] ${message}`);
    dispatch({ type: 'SHOW_USER_FEEDBACK', payload: { message, type } });

    // Auto-hide feedback after 4 seconds for success/info, 6 seconds for warning/error
    const hideDelay = type === 'success' || type === 'info' ? 4000 : 6000;
    setTimeout(() => {
      hideUserFeedback();
    }, hideDelay);
  };

  const hideUserFeedback = () => {
    dispatch({ type: 'HIDE_USER_FEEDBACK' });
  };

  // App State Management for Backgrounding
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // App going to background - save session if tutorial is active
      if (appState.current.match(/active/) && nextAppState === 'background') {
        if (state.isActive && !state.isCompleted && !state.isSkipped) {
          console.log('📱 App backgrounding - saving tutorial session');
          saveTutorialSession(state);
        }
      }

      // App coming from background - attempt session restoration
      if (appState.current.match(/background/) && nextAppState === 'active') {
        if (!state.isActive && !state.isCompleted && !state.isSkipped) {
          console.log('📱 App foregrounding - checking for tutorial session');
          restoreTutorialSession().then((restored) => {
            if (restored) {
              console.log('✅ Tutorial session restored successfully');
            }
          }).catch((error) => {
            console.warn('Failed to restore tutorial session:', error);
          });
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [state.isActive, state.isCompleted, state.isSkipped, state.currentStep]);

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      if (!state.isActive && !state.isCompleted && !state.isSkipped) {
        const restored = await restoreTutorialSession();
        if (restored) {
          console.log('🔄 Existing tutorial session restored on app start');
        }
      }
    };

    checkExistingSession();
  }, []); // Run only on mount

  return (
    <TutorialContext.Provider
      value={{
        state,
        actions: {
          startTutorial,
          nextStep,
          skipTutorial,
          completeTutorial,
          resumeTutorial,
          setUserInteractionBlocked,
          showNextButton,
          handleStepAction,
          resetTutorial,
          restartTutorial,
          clearCrashData,
          // Visual Feedback & Highlighting
          highlightField,
          clearFieldHighlight,
          setFieldValidation,
          showUserFeedback,
          hideUserFeedback,
        },
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

// Hook
export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

// Note: Tutorial steps are now managed within the TutorialProvider context
// and are dynamically generated using i18n translations.