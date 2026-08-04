import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTutorial } from '@/src/contexts/TutorialContext';
import { FirstHabitScreen } from './FirstHabitScreen';
import { FirstGoalScreen } from './FirstGoalScreen';
import { FirstCheckCard } from './FirstCheckCard';
import { WelcomeScreen } from './WelcomeScreen';
import { OnboardingPreferencesModal } from '@/src/components/tutorial/OnboardingPreferencesModal';

/**
 * The 3-screen onboarding that replaces the 25-step coach-mark tutorial.
 *
 * NOT A <Modal>, on purpose. The whole first-launch freeze protection rests on
 * RN modals never overlapping (a native prompt plus an RN modal locks up iOS),
 * so screens 1 and 2 are a plain full-screen view layered over the navigator.
 *
 * Screen 3 is deliberately different: it must NOT cover the app, because the
 * user is meant to see the habit and goal they just created and tap the real
 * checkbox. It renders as a bottom card that leaves the app usable, and the
 * pointing is done by that checkbox pulsing rather than by an overlay working
 * out where it sits — which is what made the old tutorial fragile.
 *
 * `elevation` accompanies `zIndex` because on Android elevation wins sibling
 * draw order; that is exactly why the old overlay failed to dim the tab bar.
 */
export function OnboardingFlow() {
  const { state, actions, showOnboardingWelcome, showOnboardingPrefs } = useTutorial();
  const screen = state.onboardingScreen;

  // The language/theme/notification gate. It used to be rendered by
  // TutorialOverlay; with that gone, every piece of onboarding UI mounts here.
  if (showOnboardingPrefs) {
    return (
      <OnboardingPreferencesModal
        visible
        onComplete={actions.completeOnboardingPrefs}
      />
    );
  }

  // Sits between the preferences gate and screen 1, so it is a flag rather
  // than a fourth numbered screen — the dots stay honest about three tasks.
  if (showOnboardingWelcome) {
    return <WelcomeScreen onContinue={actions.completeOnboardingWelcome} />;
  }

  if (screen === null) return null;

  // Screen 3 positions itself along the bottom and must leave the app usable.
  if (screen === 3) {
    return <FirstCheckCard onDone={actions.nextOnboardingScreen} />;
  }

  const styles = StyleSheet.create({
    takeover: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      ...Platform.select({ android: { elevation: 9999 }, default: {} }),
    },
  });

  return (
    <View style={styles.takeover} accessibilityViewIsModal>
      {screen === 1 && (
        <FirstHabitScreen
          onCreated={actions.nextOnboardingScreen}
          onSkip={actions.skipOnboarding}
        />
      )}
      {screen === 2 && (
        <FirstGoalScreen
          onCreated={actions.nextOnboardingScreen}
          onSkip={actions.skipOnboarding}
        />
      )}
    </View>
  );
}
