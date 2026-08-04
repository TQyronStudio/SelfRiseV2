import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTutorial, ONBOARDING_TOTAL_SCREENS } from '@/src/contexts/TutorialContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { Fonts } from '@/src/constants/fonts';
import { scaleFont } from '@/src/utils/responsive';
import { OnbScreenContainer } from './OnbScreenContainer';

/**
 * The 3-screen onboarding that replaces the 25-step coach-mark tutorial.
 *
 * NOT A <Modal>, on purpose. The whole first-launch freeze protection rests on
 * RN modals never overlapping (a native prompt plus an RN modal locks up iOS),
 * so this is a plain full-screen view layered over the navigator instead.
 *
 * `elevation` is set alongside `zIndex` because on Android elevation wins for
 * sibling draw order — that is exactly why the old tutorial overlay failed to
 * dim the bottom tab bar (React Navigation gives it its own elevation).
 *
 * Screen bodies are still stage-B placeholders; stages D/E/F fill them with the
 * habit presets, the goal templates and the first check-off.
 */
export function OnboardingFlow() {
  const { state, actions } = useTutorial();
  const { colors } = useTheme();
  const { t } = useI18n();

  const screen = state.onboardingScreen;
  if (screen === null) return null;

  const styles = StyleSheet.create({
    root: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      ...Platform.select({ android: { elevation: 9999 }, default: {} }),
    },
    placeholder: {
      fontSize: scaleFont(Fonts.sizes.xl),
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginTop: 48,
    },
  });

  const copy = {
    1: { title: t('onboarding.habit.title'), subtitle: t('onboarding.habit.subtitle'), cta: t('onboarding.habit.cta') },
    2: { title: t('onboarding.goal.title'), subtitle: t('onboarding.goal.subtitle'), cta: t('onboarding.goal.cta') },
    3: { title: t('onboarding.done.title'), subtitle: t('onboarding.done.subtitle'), cta: t('onboarding.done.cta') },
  }[screen];

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <OnbScreenContainer
        screen={screen}
        title={copy.title}
        subtitle={copy.subtitle}
        ctaLabel={copy.cta}
        onPressCta={actions.nextOnboardingScreen}
        onSkip={actions.skipOnboarding}
      >
        <Text style={styles.placeholder}>
          {screen} / {ONBOARDING_TOTAL_SCREENS}
        </Text>
      </OnbScreenContainer>
    </View>
  );
}
