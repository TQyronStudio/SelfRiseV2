import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { useHabits } from '@/src/contexts/HabitsContext';
import { Fonts } from '@/src/constants/fonts';
import { Layout } from '@/src/constants/dimensions';
import { scaleFont, getCardPadding, isTablet } from '@/src/utils/responsive';
import { ONB_MAX_CONTENT_WIDTH } from './OnbScreenContainer';
import { formatDateToString } from '@/src/utils/date';
import { countChecksOn, hasNewCheckSince } from './checkDetection';

/**
 * Onboarding screen 3 — the payoff.
 *
 * Unlike screens 1 and 2 this does NOT cover the app: the whole point is that
 * the user sees the home screen with the habit and goal they just made, and
 * taps the real checkbox. So it is a card along the bottom, and the pointing is
 * done by the habit's own checkbox pulsing (HabitCompletionButton `highlight`)
 * rather than an overlay measuring coordinates — which is what made the old
 * tutorial fragile.
 *
 * Checking the habit finishes onboarding on its own. The button is the way out
 * for anyone who would rather not, or who checked it before reading this.
 */
export interface FirstCheckCardProps {
  onDone: () => void;
}

/** Long enough for the XP gain to register as a reward, short enough to feel immediate. */
const CELEBRATION_LINGER_MS = 1200;

export function FirstCheckCard({ onDone }: FirstCheckCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { state: habitsState } = useHabits();
  const finished = useRef(false);

  const today = formatDateToString(new Date());

  // Snapshot on mount. Restarting onboarding from Settings in the evening means
  // today's habits may already be ticked — without this the card would declare
  // victory the moment it appeared.
  const baseline = useRef<number | null>(null);
  if (baseline.current === null) {
    baseline.current = countChecksOn(habitsState.completions, today);
  }

  const checkedSomethingToday = hasNewCheckSince(
    habitsState.completions,
    today,
    baseline.current
  );

  useEffect(() => {
    if (!checkedSomethingToday || finished.current) return;
    finished.current = true;
    // Let the XP bar animation play before the card disappears — the reward is
    // the reason this screen exists. (Only the level-up MODAL is suppressed
    // during onboarding; the bar itself animates.)
    const timer = setTimeout(onDone, CELEBRATION_LINGER_MS);
    return () => clearTimeout(timer);
  }, [checkedSomethingToday, onDone]);

  const styles = StyleSheet.create({
    root: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingBottom: insets.bottom + Layout.spacing.md,
      paddingHorizontal: getCardPadding(),
      zIndex: 9999,
      // Android draws by elevation, not zIndex — without this the tab bar
      // would sit on top of the card.
      ...Platform.select({ android: { elevation: 9999 }, default: {} }),
    },
    card: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 16,
      borderTopWidth: 3,
      borderTopColor: colors.primary,
      padding: Layout.spacing.lg,
      width: '100%',
      maxWidth: isTablet() ? ONB_MAX_CONTENT_WIDTH : undefined,
      alignSelf: 'center',
    },
    title: {
      fontSize: scaleFont(Fonts.sizes.lg),
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    body: {
      fontSize: scaleFont(Fonts.sizes.md),
      color: colors.textSecondary,
      marginTop: Layout.spacing.xs,
    },
    cta: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Layout.spacing.md,
    },
    ctaText: {
      fontSize: scaleFont(Fonts.sizes.md),
      fontWeight: 'bold',
      color: colors.white,
    },
  });

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          {t('onboarding.done.title')}
        </Text>
        <Text style={styles.body}>{t('onboarding.done.body')}</Text>
        <TouchableOpacity
          style={styles.cta}
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.done.cta')}
        >
          <Text style={styles.ctaText}>{t('onboarding.done.cta')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
