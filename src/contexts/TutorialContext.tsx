import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AchievementStorage } from '@/src/services/achievementStorage';
import { router } from 'expo-router';
import { TUTORIAL_STORAGE_KEYS } from '../constants/tutorialStorageKeys';
import { awaitStartupComplete } from '@/src/services/startup';
import { FirstDayAnalytics } from '@/src/services/analytics';

/**
 * Onboarding state: a preferences gate, one welcome screen, then three screens
 * that leave the user with a habit, a goal and their first check-off.
 *
 * This file used to be 1988 lines because it also drove a 25-step coach-mark
 * tour — step definitions, spotlight targets, per-field validation prompts, and
 * crash recovery for a state machine that could strand the user mid-tour. All of
 * that went with the tour (see technical-guides:Tutorial.md).
 *
 * The name "tutorial" survives in the storage keys and the exported helpers
 * because renaming them would be a silent, cross-module breakage: several files
 * read those exact key strings and nothing would fail loudly.
 */

// ---------------------------------------------------------------------------
// Onboarding screens
// ---------------------------------------------------------------------------

/** 1 = first habit, 2 = first goal, 3 = first check-off. */
export type OnboardingScreen = 1 | 2 | 3;
export const ONBOARDING_TOTAL_SCREENS = 3;

/**
 * Which screen to open when onboarding (re)starts.
 *
 * `CURRENT_STEP` is shared with the retired 25-step tutorial, where it counted
 * up to 25. A user who upgrades mid-tour therefore has a saved number that means
 * nothing here — treat anything out of range as "start from the beginning"
 * rather than clamping to screen 3, which would drop them on the finish line
 * having created neither a habit nor a goal.
 */
export function resolveOnboardingStartScreen(savedStep: number): OnboardingScreen {
  if (!Number.isFinite(savedStep)) return 1;
  const step = Math.trunc(savedStep);
  if (step < 1 || step > ONBOARDING_TOTAL_SCREENS) return 1;
  return step as OnboardingScreen;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface TutorialState {
  /**
   * True while onboarding is on screen. This is the single signal the rest of
   * the app reads: AdBanner hides ads, AchievementContext lets only
   * first-habit/first-goal celebrations through, HabitItemWithCompletion pulses
   * the checkbox on the last screen.
   */
  isActive: boolean;
  onboardingScreen: OnboardingScreen | null;
  isCompleted: boolean;
  isSkipped: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TutorialContextType {
  state: TutorialState;
  /** Language + theme + notification opt-in, first launch only. */
  showOnboardingPrefs: boolean;
  /**
   * The single welcome screen between the preferences gate and screen 1. Its own
   * flag rather than a fourth numbered screen, so the progress dots keep telling
   * the truth about the three tasks.
   */
  showOnboardingWelcome: boolean;
  /**
   * The habit created on screen 1 of THIS run (first launch or a Settings
   * restart). Screen 3 names it, pulses only its checkbox and waits for its
   * check. `null` when unknown — screen 3 then falls back to generic wording.
   */
  onboardingHabitId: string | null;
  actions: {
    completeOnboardingPrefs: (wantsNotifications: boolean) => Promise<void>;
    /** Leaves the welcome screen and opens screen 1. */
    completeOnboardingWelcome: () => Promise<void>;
    /** Advance the onboarding, finishing it after the last screen. */
    nextOnboardingScreen: () => Promise<void>;
    /** Screen 1 → remember which habit this run created (persisted for resume). */
    setOnboardingHabit: (habitId: string) => Promise<void>;
    /** Leave onboarding early; writes the same SKIPPED flag as finishing does. */
    skipOnboarding: () => Promise<void>;
    /** Settings → run onboarding again from the top. */
    restartTutorial: () => Promise<void>;
    /** Settings → clear leftover diagnostics from the retired tour. */
    clearCrashData: () => Promise<void>;
  };
}

type TutorialAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'START_ONBOARDING'; payload: { screen: OnboardingScreen } }
  | { type: 'SET_ONBOARDING_SCREEN'; payload: { screen: OnboardingScreen } }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'RESET_TUTORIAL' };

export const initialState: TutorialState = {
  isActive: false,
  onboardingScreen: null,
  isCompleted: false,
  isSkipped: false,
  isLoading: false,
  error: null,
};

// Exported so the transitions can be tested without mounting the provider, which
// needs AsyncStorage, the router and the startup gate.
export function tutorialReducer(state: TutorialState, action: TutorialAction): TutorialState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'START_ONBOARDING':
      return {
        ...state,
        isActive: true,
        onboardingScreen: action.payload.screen,
        isCompleted: false,
        isSkipped: false,
        isLoading: false,
        error: null,
      };

    case 'SET_ONBOARDING_SCREEN':
      return { ...state, onboardingScreen: action.payload.screen };

    case 'COMPLETE_TUTORIAL':
      return { ...state, isActive: false, onboardingScreen: null, isCompleted: true };

    case 'SKIP_TUTORIAL':
      return { ...state, isActive: false, onboardingScreen: null, isSkipped: true };

    case 'RESET_TUTORIAL':
      return { ...initialState };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const COMPLETED_KEY = TUTORIAL_STORAGE_KEYS.COMPLETED;
const CURRENT_STEP_KEY = TUTORIAL_STORAGE_KEYS.CURRENT_STEP;
const SKIPPED_KEY = TUTORIAL_STORAGE_KEYS.SKIPPED;
const RESTARTED_KEY = TUTORIAL_STORAGE_KEYS.RESTARTED;
const PREFS_KEY = TUTORIAL_STORAGE_KEYS.PREFS_COMPLETED;
const HABIT_ID_KEY = TUTORIAL_STORAGE_KEYS.HABIT_ID;

/** Diagnostics written by the retired tour: cleared on request, never written. */
const LEGACY_DIAGNOSTIC_KEYS = [
  TUTORIAL_STORAGE_KEYS.SESSION,
  TUTORIAL_STORAGE_KEYS.SESSION_TIMESTAMP,
  TUTORIAL_STORAGE_KEYS.CRASH_LOG,
  TUTORIAL_STORAGE_KEYS.ERROR_COUNT,
  TUTORIAL_STORAGE_KEYS.RECOVERY_STATE,
];

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);
  const [showOnboardingPrefs, setShowOnboardingPrefs] = useState(false);
  const [showOnboardingWelcome, setShowOnboardingWelcome] = useState(false);
  const [onboardingHabitId, setOnboardingHabitId] = useState<string | null>(null);

  const saveProgress = async (screen: number) => {
    try {
      await AsyncStorage.setItem(CURRENT_STEP_KEY, screen.toString());
    } catch (error) {
      console.warn('Failed to save onboarding progress:', error);
    }
  };

  const markCompleted = async () => {
    try {
      await AsyncStorage.setItem(COMPLETED_KEY, 'true');
      await AsyncStorage.removeItem(CURRENT_STEP_KEY);
      await AsyncStorage.removeItem(HABIT_ID_KEY);
    } catch (error) {
      console.warn('Failed to mark onboarding as completed:', error);
    }
  };

  const markSkipped = async () => {
    try {
      await AsyncStorage.setItem(SKIPPED_KEY, 'true');
      await AsyncStorage.removeItem(CURRENT_STEP_KEY);
      await AsyncStorage.removeItem(HABIT_ID_KEY);
    } catch (error) {
      console.warn('Failed to mark onboarding as skipped:', error);
    }
  };

  const shouldShowOnboarding = async (): Promise<boolean> => {
    try {
      const completed = await AsyncStorage.getItem(COMPLETED_KEY);
      const skipped = await AsyncStorage.getItem(SKIPPED_KEY);
      return completed !== 'true' && skipped !== 'true';
    } catch (error) {
      console.warn('Failed to check onboarding status:', error);
      return true; // show it rather than silently skipping a first run
    }
  };

  const getResumeStep = async (): Promise<number> => {
    try {
      const step = await AsyncStorage.getItem(CURRENT_STEP_KEY);
      return step ? parseInt(step, 10) : 1;
    } catch (error) {
      console.warn('Failed to read onboarding progress:', error);
      return 1;
    }
  };

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const startOnboardingAt = async (screen: OnboardingScreen): Promise<void> => {
    dispatch({ type: 'START_ONBOARDING', payload: { screen } });
    await saveProgress(screen);
  };

  const completeTutorial = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(RESTARTED_KEY);
      dispatch({ type: 'COMPLETE_TUTORIAL' });
      setOnboardingHabitId(null);
      await markCompleted();
    } catch (error) {
      console.warn('Failed to complete onboarding:', error);
    }
  };

  const skipOnboarding = async (): Promise<void> => {
    // Fire-and-forget: analytics must never delay or break the flow.
    void FirstDayAnalytics.onboardingSkipped(state.onboardingScreen ?? 1);
    try {
      await AsyncStorage.removeItem(RESTARTED_KEY);
      dispatch({ type: 'SKIP_TUTORIAL' });
      setOnboardingHabitId(null);
      await markSkipped();
    } catch (error) {
      console.warn('Failed to skip onboarding:', error);
    }
  };

  const setOnboardingHabit = async (habitId: string): Promise<void> => {
    setOnboardingHabitId(habitId);
    try {
      await AsyncStorage.setItem(HABIT_ID_KEY, habitId);
    } catch (error) {
      console.warn('Failed to remember the onboarding habit:', error);
    }
  };

  const nextOnboardingScreen = async (): Promise<void> => {
    const current = state.onboardingScreen ?? 1;
    if (current >= ONBOARDING_TOTAL_SCREENS) {
      await completeTutorial();
      return;
    }
    const next = (current + 1) as OnboardingScreen;
    dispatch({ type: 'SET_ONBOARDING_SCREEN', payload: { screen: next } });
    await saveProgress(next);
  };

  const completeOnboardingPrefs = async (wantsNotifications: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(PREFS_KEY, 'true');

      // Close the gate FIRST. The OS permission prompt is a native modal, so our
      // RN modal must be gone before it appears — never two at once (iOS freeze).
      setShowOnboardingPrefs(false);

      let remindersOn = false;
      if (wantsNotifications) {
        // Awaited, so the welcome screen cannot appear while the OS prompt is up.
        const { enableAllRemindersAfterOptIn } =
          require('@/src/services/notifications') as typeof import('@/src/services/notifications');
        remindersOn = await enableAllRemindersAfterOptIn();
      }
      void FirstDayAnalytics.notificationsChosen(wantsNotifications, remindersOn);

      dispatch({ type: 'RESET_TUTORIAL' });
      setShowOnboardingWelcome(true);
    } catch (error) {
      console.warn('Failed to complete onboarding preferences:', error);
      // Keep going regardless — never strand the user on the gate.
      setShowOnboardingPrefs(false);
      setShowOnboardingWelcome(true);
    }
  };

  const completeOnboardingWelcome = async (): Promise<void> => {
    void FirstDayAnalytics.welcomeDone();
    setShowOnboardingWelcome(false);
    await startOnboardingAt(1);
  };

  const restartTutorial = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      await AsyncStorage.removeItem(COMPLETED_KEY);
      await AsyncStorage.removeItem(CURRENT_STEP_KEY);
      await AsyncStorage.removeItem(SKIPPED_KEY);
      // A restart creates a new habit on screen 1; forget the previous run's one.
      await AsyncStorage.removeItem(HABIT_ID_KEY);
      setOnboardingHabitId(null);

      // Lets the Habit/Goal contexts know the first-habit/first-goal
      // achievements are already owned, so they do not re-celebrate.
      await AsyncStorage.setItem(RESTARTED_KEY, 'true');

      dispatch({ type: 'RESET_TUTORIAL' });

      router.push('/(tabs)' as any);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Welcome screen included — a restart should feel like the real thing.
      setShowOnboardingWelcome(true);
    } catch (error) {
      console.warn('Failed to restart onboarding:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to restart onboarding' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCrashData = async (): Promise<void> => {
    try {
      await Promise.all(LEGACY_DIAGNOSTIC_KEYS.map(key => AsyncStorage.removeItem(key)));
    } catch (error) {
      console.warn('Failed to clear onboarding diagnostics:', error);
    }
  };

  // Resuming on screen 3 after the app was killed: the habit was remembered in
  // storage on screen 1, React state starts empty.
  useEffect(() => {
    if (state.onboardingScreen !== 3 || onboardingHabitId !== null) return;
    let cancelled = false;
    AsyncStorage.getItem(HABIT_ID_KEY)
      .then(id => {
        if (!cancelled && id) setOnboardingHabitId(id);
      })
      .catch(error => console.warn('Failed to read the onboarding habit:', error));
    return () => {
      cancelled = true;
    };
  }, [state.onboardingScreen, onboardingHabitId]);

  // -------------------------------------------------------------------------
  // Auto-start on first launch
  // -------------------------------------------------------------------------

  useEffect(() => {
    const autoStart = async () => {
      try {
        if (!(await shouldShowOnboarding())) return;

        // Make sure we are on the home screen before anything appears.
        router.push('/(tabs)' as any);
        await new Promise(resolve => setTimeout(resolve, 300));

        const resumeStep = await getResumeStep();
        if (resumeStep > 1) {
          // Interrupted onboarding — resume where the user left off, and do NOT
          // show the welcome again; they have already read it.
          const screen = resolveOnboardingStartScreen(resumeStep);
          console.log(`🎓 [ONBOARDING] Resuming from screen ${screen} (saved step ${resumeStep})`);
          dispatch({ type: 'RESET_TUTORIAL' });
          await startOnboardingAt(screen);
          return;
        }

        const prefsCompleted = await AsyncStorage.getItem(PREFS_KEY);
        if (prefsCompleted !== 'true') {
          console.log('🎓 [ONBOARDING] First launch — showing preferences gate');
          // The single entry point into the first-day funnel: only a first
          // launch reaches the gate, so updating users never enter it.
          void FirstDayAnalytics.onboardingStarted();
          setShowOnboardingPrefs(true);
          return;
        }

        console.log('🎓 [ONBOARDING] Showing welcome');
        dispatch({ type: 'RESET_TUTORIAL' });
        setShowOnboardingWelcome(true);
      } catch (error) {
        console.warn('Failed to auto-start onboarding:', error);
      }
    };

    // Gate behind the first-launch native modals (ATT + ad consent). Presenting
    // an RN modal while a native one is still up freezes iOS — that was the
    // fresh-install freeze. awaitStartupComplete resolves once the whole startup
    // sequence is done (near-instant on later launches, where nothing shows).
    let cancelled = false;
    const run = async () => {
      await awaitStartupComplete();
      if (cancelled) return;
      await autoStart();
    };
    // Small delay so contexts and navigation finish initializing first.
    const timer = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        state,
        showOnboardingPrefs,
        showOnboardingWelcome,
        onboardingHabitId,
        actions: {
          completeOnboardingPrefs,
          completeOnboardingWelcome,
          nextOnboardingScreen,
          setOnboardingHabit,
          skipOnboarding,
          restartTutorial,
          clearCrashData,
        },
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextType {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

// ---------------------------------------------------------------------------
// Helpers read from OUTSIDE React (other contexts, the trophy gate)
// ---------------------------------------------------------------------------

/**
 * Reads the STORAGE FLAGS, not React state — AchievementContext calls this from
 * outside the tree to decide whether to suppress a celebration. It therefore
 * survives on the same flags onboarding writes; change how those are written and
 * the trophy filter breaks without anyone having touched it.
 */
export async function isTutorialActive(): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem(COMPLETED_KEY);
    const skipped = await AsyncStorage.getItem(SKIPPED_KEY);
    return completed !== 'true' && skipped !== 'true';
  } catch (error) {
    console.error('Error checking onboarding active status:', error);
    return false;
  }
}

/** True when onboarding was restarted from Settings (achievements already owned). */
export async function isTutorialRestarted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(RESTARTED_KEY)) === 'true';
  } catch (error) {
    console.error('Error checking onboarding restart status:', error);
    return false;
  }
}

/** Used by the trophy gate to tell "will a celebration appear?" before creating. */
export async function hasAchievement(achievementId: string): Promise<boolean> {
  try {
    const userAchievements = await AchievementStorage.getUserAchievements();
    return userAchievements.unlockedAchievements.includes(achievementId);
  } catch (error) {
    console.error(`Error checking achievement ${achievementId}:`, error);
    return false;
  }
}
