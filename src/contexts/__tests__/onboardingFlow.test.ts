/**
 * Stage B — the 3-screen onboarding's wiring, not its looks.
 *
 * What actually breaks silently here is state, not pixels:
 *   - `isActive` is what makes AdBanner hide ads, AchievementContext let only
 *     first-habit/first-goal celebrations through, and GoalForm relax its date
 *     validation. If onboarding forgets to set it, all three regress at once
 *     and nothing visibly fails.
 *   - `currentStepData` must stay null, otherwise the OLD tutorial overlay
 *     starts drawing on top of the new screens (its guard is
 *     `!state.isActive || !state.currentStepData`, TutorialOverlay.tsx:335).
 *   - `CURRENT_STEP` is shared with the retired 25-step tutorial, so a saved
 *     value can be far out of range for the new flow.
 */
// The reducer is pure, but importing the context module pulls in the router and
// the i18n/achievement stack. Mock only what module-load needs — nothing here is
// used by the transitions under test.
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

import {
  tutorialReducer,
  initialState,
  resolveOnboardingStartScreen,
  ONBOARDING_TOTAL_SCREENS,
  TutorialState,
} from '../TutorialContext';

const onboardingAt = (screen: 1 | 2 | 3): TutorialState =>
  tutorialReducer(initialState, { type: 'START_ONBOARDING', payload: { screen } });

describe('resolveOnboardingStartScreen', () => {
  it('keeps a saved screen that is in range', () => {
    expect(resolveOnboardingStartScreen(1)).toBe(1);
    expect(resolveOnboardingStartScreen(2)).toBe(2);
    expect(resolveOnboardingStartScreen(3)).toBe(3);
  });

  it('restarts from screen 1 for a step left over from the 25-step tutorial', () => {
    // Upgrading mid-tutorial must not drop the user on the finish line having
    // created neither a habit nor a goal.
    expect(resolveOnboardingStartScreen(17)).toBe(1);
    expect(resolveOnboardingStartScreen(25)).toBe(1);
  });

  it('falls back to screen 1 for junk values', () => {
    expect(resolveOnboardingStartScreen(0)).toBe(1);
    expect(resolveOnboardingStartScreen(-3)).toBe(1);
    expect(resolveOnboardingStartScreen(NaN)).toBe(1);
    expect(resolveOnboardingStartScreen(2.7)).toBe(2);
  });
});

describe('START_ONBOARDING', () => {
  it('sets isActive so ads, achievement filtering and form relaxation keep working', () => {
    expect(onboardingAt(1).isActive).toBe(true);
  });

  it('leaves currentStepData null so the old overlay stays hidden', () => {
    expect(onboardingAt(1).currentStepData).toBeNull();
  });

  it('does not block interaction — these are real screens, not a coach-mark overlay', () => {
    expect(onboardingAt(1).userInteractionBlocked).toBe(false);
  });

  it('reports progress against the 3 screens, not the old 25 steps', () => {
    const state = onboardingAt(2);
    expect(state.onboardingScreen).toBe(2);
    expect(state.currentStep).toBe(2);
    expect(state.totalSteps).toBe(ONBOARDING_TOTAL_SCREENS);
  });

  it('clears a previous completed/skipped verdict when restarted from Settings', () => {
    const finished = tutorialReducer(onboardingAt(3), { type: 'COMPLETE_TUTORIAL' });
    const restarted = tutorialReducer(finished, {
      type: 'START_ONBOARDING',
      payload: { screen: 1 },
    });
    expect(restarted.isCompleted).toBe(false);
    expect(restarted.isSkipped).toBe(false);
    expect(restarted.isActive).toBe(true);
  });
});

describe('advancing and leaving', () => {
  it('moves between screens', () => {
    const state = tutorialReducer(onboardingAt(1), {
      type: 'SET_ONBOARDING_SCREEN',
      payload: { screen: 2 },
    });
    expect(state.onboardingScreen).toBe(2);
    expect(state.currentStep).toBe(2);
  });

  it('completing tears down onboarding state', () => {
    const state = tutorialReducer(onboardingAt(3), { type: 'COMPLETE_TUTORIAL' });
    expect(state.isActive).toBe(false);
    expect(state.onboardingScreen).toBeNull();
    expect(state.isCompleted).toBe(true);
  });

  it('skipping tears down onboarding state', () => {
    const state = tutorialReducer(onboardingAt(2), { type: 'SKIP_TUTORIAL' });
    expect(state.isActive).toBe(false);
    expect(state.onboardingScreen).toBeNull();
    expect(state.isSkipped).toBe(true);
  });

  it('resetting clears the screen so no stale onboarding reappears', () => {
    const state = tutorialReducer(onboardingAt(2), { type: 'RESET_TUTORIAL' });
    expect(state.onboardingScreen).toBeNull();
    expect(state.isActive).toBe(false);
  });
});
