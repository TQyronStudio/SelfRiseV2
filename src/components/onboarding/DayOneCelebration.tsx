import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { useAccessibility } from '@/src/hooks/useAccessibility';
import { Fonts } from '@/src/constants/fonts';
import { Layout } from '@/src/constants/dimensions';
import { scaleFont, getCardPadding, isTablet } from '@/src/utils/responsive';
import { formatDateToString } from '@/src/utils/date';
import { ONB_MAX_CONTENT_WIDTH } from './OnbScreenContainer';
import { endingCopyKeys, ScreenThreeEnding } from './firstCheckCopy';

/**
 * The end of onboarding, full screen — the moment the user is sent off with a
 * reason to come back tomorrow.
 *
 * Two honest variants (decided with Petr, 2026-10-11):
 *  - 'done'  — the habit got ticked: "Day 1 done 🔥" plus what it earned
 *              (XP today, level, a 1-day streak). The level-up MODAL is
 *              suppressed during onboarding, so this is where the user first
 *              sees their level.
 *  - 'later' — "I'll do it later": the same motivating ending, but no rewards
 *              and no "done" — instead the concrete task that makes Day 1.
 *              Celebrating a check that did not happen would teach the user
 *              that ticking means nothing.
 *
 * NOT a <Modal> (Tutorial.md rule 1): a full-screen view over the navigator,
 * like screens 1 and 2. It covers the app, so nothing can be earned behind it
 * while onboarding is still "active".
 *
 * Primary action goes into the app; "How it all works" stays a quiet link —
 * reading competes with using, at the exact moment motivation is highest.
 */
export interface DayOneCelebrationProps {
  ending: ScreenThreeEnding;
  /** Name of the onboarding habit, or null when unknown. */
  habitName: string | null;
  /** The afternoon reminder is on — only then may the text promise one. */
  remindersOn: boolean;
  onContinue: () => void;
  onLearnMore: () => void;
}

interface Rewards {
  xpToday: number;
  level: number;
}

export function DayOneCelebration({
  ending,
  habitName,
  remindersOn,
  onContinue,
  onLearnMore,
}: DayOneCelebrationProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { isReduceMotionEnabled } = useAccessibility();

  const copy = endingCopyKeys(ending, remindersOn, habitName !== null);
  const title = t(copy.titleKey);
  const body = t(copy.bodyKey, { habit: habitName ?? '' });
  const reminderLine = copy.reminderLineKey ? t(copy.reminderLineKey) : null;

  // What the check earned. Read from the XP ledger rather than computed here,
  // so it always matches the XP bar. Hidden until loaded — never a flash of 0.
  const [rewards, setRewards] = useState<Rewards | null>(null);
  useEffect(() => {
    if (!copy.showRewards) return;
    let cancelled = false;
    (async () => {
      try {
        const { GamificationService } =
          require('@/src/services/gamificationService') as typeof import('@/src/services/gamificationService');
        const { getCurrentLevel } =
          require('@/src/services/levelCalculation') as typeof import('@/src/services/levelCalculation');
        const today = formatDateToString(new Date());
        const [transactions, totalXP] = await Promise.all([
          GamificationService.getTransactionsByDateRange(today, today),
          GamificationService.getTotalXP(),
        ]);
        const xpToday = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        if (!cancelled) setRewards({ xpToday, level: getCurrentLevel(totalXP) });
      } catch (error) {
        console.warn('[ONBOARDING] Could not load Day 1 rewards:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copy.showRewards]);

  // Entrance: a short rise-in. Reduce-motion users get it without movement.
  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isReduceMotionEnabled) {
      appear.setValue(1);
      return;
    }
    Animated.spring(appear, { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }).start();
  }, [appear, isReduceMotionEnabled]);

  // iOS has no live regions: announce the ending explicitly once.
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(`${title}. ${body}`);
    }
    // Once, on mount — the wording does not change afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      zIndex: 9999,
      ...Platform.select({ android: { elevation: 9999 }, default: {} }),
    },
    column: {
      flex: 1,
      width: '100%',
      maxWidth: isTablet() ? ONB_MAX_CONTENT_WIDTH : undefined,
      alignSelf: 'center',
      paddingHorizontal: getCardPadding(),
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Layout.spacing.lg,
    },
    title: {
      fontSize: scaleFont(Fonts.sizes.xxl),
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    stats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: Layout.spacing.md,
    },
    stat: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 16,
      paddingVertical: Layout.spacing.xs,
      paddingHorizontal: Layout.spacing.md,
      margin: Layout.spacing.xs,
    },
    statText: {
      fontSize: scaleFont(Fonts.sizes.sm),
      fontWeight: '600',
      color: colors.textPrimary,
    },
    // The message of the whole onboarding ("one small step a day — come back
    // tomorrow") is the reason to return, so it gets a card of its own, in
    // full-strength text — not grey small print under the title.
    messageCard: {
      alignSelf: 'stretch',
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 16,
      borderTopWidth: 3,
      borderTopColor: colors.primary,
      paddingVertical: Layout.spacing.lg,
      paddingHorizontal: Layout.spacing.lg,
      marginTop: Layout.spacing.lg,
    },
    text: {
      fontSize: scaleFont(Fonts.sizes.lg),
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: scaleFont(Fonts.sizes.lg) * 1.4,
    },
    reminder: {
      fontSize: scaleFont(Fonts.sizes.md),
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      marginTop: Layout.spacing.sm,
    },
    cta: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Layout.spacing.lg,
    },
    ctaText: {
      fontSize: scaleFont(Fonts.sizes.md),
      fontWeight: 'bold',
      color: colors.white,
    },
    // Secondary on purpose: an option, not a second decision.
    learnMore: {
      alignSelf: 'center',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Layout.spacing.md,
      marginTop: Layout.spacing.xs,
      marginBottom: Layout.spacing.md,
    },
    learnMoreText: {
      fontSize: scaleFont(Fonts.sizes.sm),
      color: colors.textSecondary,
    },
  });

  const animatedStyle = {
    opacity: appear,
    transform: [
      { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
    ],
  };

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <View style={styles.column}>
        <Animated.View style={[styles.body, animatedStyle]}>
          <View style={styles.badge}>
            <Ionicons name={ending === 'done' ? 'flame' : 'leaf'} size={52} color={colors.white} />
          </View>

          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>

          {rewards && (
            <View style={styles.stats}>
              {rewards.xpToday > 0 && (
                <View style={styles.stat}>
                  <Text style={styles.statText}>{t('onboarding.done.statXp', { xp: rewards.xpToday })}</Text>
                </View>
              )}
              <View style={styles.stat}>
                <Text style={styles.statText}>{t('onboarding.done.statLevel', { level: rewards.level })}</Text>
              </View>
              {/* Only for the habit created in this run: it is brand new, so a
                  check today is exactly a 1-day streak. An unknown habit may
                  already have a longer one. */}
              {habitName !== null && (
                <View style={styles.stat}>
                  <Text style={styles.statText}>{t('onboarding.done.statStreak')}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.messageCard}>
            <Text style={styles.text}>{body}</Text>
            {reminderLine && <Text style={styles.reminder}>{reminderLine}</Text>}
          </View>
        </Animated.View>

        <TouchableOpacity
          style={styles.cta}
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.done.cta')}
        >
          <Text style={styles.ctaText}>{t('onboarding.done.cta')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.learnMore}
          onPress={onLearnMore}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.done.learnMore')}
        >
          <Text style={styles.learnMoreText}>{t('onboarding.done.learnMore')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
