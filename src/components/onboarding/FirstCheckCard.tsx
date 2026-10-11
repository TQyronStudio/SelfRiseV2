import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { useHabits } from '@/src/contexts/HabitsContext';
import { Fonts } from '@/src/constants/fonts';
import { Layout } from '@/src/constants/dimensions';
import { scaleFont, getCardPadding, isTablet } from '@/src/utils/responsive';
import { ONB_MAX_CONTENT_WIDTH } from './OnbScreenContainer';
import { formatDateToString } from '@/src/utils/date';
import { countChecksOn, hasNewCheckSince, isHabitCheckedOn } from './checkDetection';
import { askCopyKeys, quotedHabitName, ScreenThreeEnding } from './firstCheckCopy';
import { DayOneCelebration } from './DayOneCelebration';
import { FirstDayAnalytics } from '@/src/services/analytics';

/**
 * Onboarding screen 3 — the payoff.
 *
 * 1. ASK — a card along the bottom. It does NOT cover the app: the user sees the
 *    habit they just made and taps its real checkbox, which pulses
 *    (HabitCompletionButton `highlight`). The card names that habit ("Last step:
 *    tick off “Drink water”"). Its only control is a quiet "I'll do it later":
 *    a user who has not done the habit yet must not be pushed into ticking it,
 *    and nobody may be held hostage by onboarding.
 *
 * 2. ENDING — full screen (DayOneCelebration):
 *    - 'done'  after a real check of that habit (after a short pause, so the
 *              tick and the XP bar register first),
 *    - 'later' after "I'll do it later" — same motivating ending, no rewards.
 *    Its button closes onboarding; only then are the "finished" flags written.
 *    The ending covers the app, so nothing can be earned behind it meanwhile.
 *
 * Which habit: the one screen 1 created in THIS run (TutorialContext
 * `onboardingHabitId`, also persisted for a resume after a kill). When it is
 * unknown (deleted, state lost) the card falls back to generic wording and to
 * the count-based check with a baseline (see checkDetection.ts).
 */
export interface FirstCheckCardProps {
  /** Habit created on screen 1 of this run, or null when unknown. */
  onboardingHabitId: string | null;
  /** Close onboarding (writes the "finished" flags). */
  onDone: () => void;
}

/** Pause after the check before the ending covers the app: the tick and XP gain register first. */
const ENDING_AFTER_CHECK_MS = 1200;

export function FirstCheckCard({ onboardingHabitId, onDone }: FirstCheckCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state: habitsState } = useHabits();

  // "We'll remind you" may only be promised to someone who will get the
  // reminder. Read once on mount; until then (or on failure) the wording that
  // promises nothing is used.
  const [remindersOn, setRemindersOn] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { notificationScheduler } =
          require('@/src/services/notifications') as typeof import('@/src/services/notifications');
        const settings = await notificationScheduler.getSettings();
        if (!cancelled) setRemindersOn(settings.afternoonReminderEnabled);
      } catch (error) {
        console.warn('[ONBOARDING] Could not read reminder settings:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = formatDateToString(new Date());
  const habit = onboardingHabitId
    ? habitsState.habits.find(h => h.id === onboardingHabitId) ?? null
    : null;
  const habitName = habit ? quotedHabitName(habit.name) : null;

  // Fallback only: baseline snapshot on mount, so a Settings restart in the
  // evening (habits already ticked today) does not count as a fresh check.
  const baseline = useRef<number | null>(null);
  if (baseline.current === null) {
    baseline.current = countChecksOn(habitsState.completions, today);
  }

  const checked = habit
    ? isHabitCheckedOn(habitsState.completions, habit.id, today)
    : hasNewCheckSince(habitsState.completions, today, baseline.current);

  const [ending, setEnding] = useState<ScreenThreeEnding | null>(null);

  // A real check → the 'done' ending, after a short pause. Un-ticking within the
  // pause cancels it, so the ending never celebrates a check that was undone.
  useEffect(() => {
    if (!checked || ending !== null) return;
    const timer = setTimeout(() => {
      setEnding('done');
      void FirstDayAnalytics.onboardingCompleted('check');
    }, ENDING_AFTER_CHECK_MS);
    return () => clearTimeout(timer);
  }, [checked, ending]);

  // Tapped within the pause right after a tick: the tick counts — the user
  // gets the 'done' ending they earned, not the no-reward one.
  const handleLater = () => {
    if (ending !== null) return;
    setEnding(checked ? 'done' : 'later');
    void FirstDayAnalytics.onboardingCompleted(checked ? 'check' : 'later');
  };

  // Reading the overview is a post-onboarding activity, so this closes the flow
  // exactly like the main button does and then opens the page. Leaving
  // onboarding active would park the ending behind the reader.
  const handleLearnMore = () => {
    void FirstDayAnalytics.learnMoreOpened();
    onDone();
    router.push('/how-it-works' as any);
  };

  if (ending !== null) {
    return (
      <DayOneCelebration
        ending={ending}
        habitName={habitName}
        remindersOn={remindersOn}
        onContinue={onDone}
        onLearnMore={handleLearnMore}
      />
    );
  }

  const copy = askCopyKeys(habitName !== null);

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
    // Quiet on purpose: the pulsing checkbox is the main action. This is the
    // honest way out for someone who has not done the habit yet.
    later: {
      alignSelf: 'center',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Layout.spacing.md,
      marginTop: Layout.spacing.sm,
    },
    laterText: {
      fontSize: scaleFont(Fonts.sizes.sm),
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
  });

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={3}>
          {t(copy.titleKey, { habit: habitName ?? '' })}
        </Text>
        <Text style={styles.body}>{t(copy.bodyKey)}</Text>

        <TouchableOpacity
          style={styles.later}
          onPress={handleLater}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.done.later')}
        >
          <Text style={styles.laterText}>{t('onboarding.done.later')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
