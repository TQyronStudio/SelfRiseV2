import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTutorial, ONBOARDING_TOTAL_SCREENS } from '@/src/contexts/TutorialContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { Fonts } from '@/src/constants/fonts';
import { scaleFont, getCardPadding } from '@/src/utils/responsive';

/**
 * The 3-screen onboarding that replaces the 25-step coach-mark tutorial.
 *
 * STAGE B — wiring only. The screens are deliberately bare: this stage proves
 * the integration (start behind the startup gate, storage flags, skip, restart,
 * ads hidden, nothing freezes) in isolation, before any content exists to
 * confuse a failure. Screens are filled in stages D/E/F.
 *
 * NOT A <Modal>, on purpose. The whole first-launch freeze protection rests on
 * RN modals never overlapping (a native prompt plus an RN modal locks up iOS),
 * so this is a plain full-screen view layered over the navigator instead.
 *
 * `elevation` is set alongside `zIndex` because on Android elevation wins for
 * sibling draw order — that is exactly why the old tutorial overlay failed to
 * dim the bottom tab bar (React Navigation gives it its own elevation).
 */
export function OnboardingFlow() {
  const { state, actions } = useTutorial();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const screen = state.onboardingScreen;
  if (screen === null) return null;

  const styles = StyleSheet.create({
    root: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.backgroundSecondary,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingHorizontal: getCardPadding(),
      zIndex: 9999,
      ...Platform.select({ android: { elevation: 9999 }, default: {} }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    dots: {
      flexDirection: 'row',
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    skip: {
      fontSize: scaleFont(Fonts.sizes.md),
      color: colors.textSecondary,
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholder: {
      fontSize: scaleFont(Fonts.sizes.xl),
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    cta: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
      minHeight: 44,
      justifyContent: 'center',
    },
    ctaText: {
      fontSize: scaleFont(Fonts.sizes.md),
      fontWeight: 'bold',
      color: colors.white,
    },
  });

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <View style={styles.header}>
        <View
          style={styles.dots}
          accessibilityRole="progressbar"
          accessibilityLabel={t('onboarding.progressA11y', {
            current: screen,
            total: ONBOARDING_TOTAL_SCREENS,
          })}
        >
          {Array.from({ length: ONBOARDING_TOTAL_SCREENS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i + 1 === screen ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={actions.skipOnboarding}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.skip')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skip}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Stage B placeholder — real content lands in stages D/E/F. */}
        <Text style={styles.placeholder}>{screen} / {ONBOARDING_TOTAL_SCREENS}</Text>
      </View>

      <TouchableOpacity
        style={styles.cta}
        onPress={actions.nextOnboardingScreen}
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.continue')}
      >
        <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}
