import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { Fonts } from '@/src/constants/fonts';
import { Layout } from '@/src/constants/dimensions';
import { scaleFont, getCardPadding, isTablet } from '@/src/utils/responsive';
import { ONBOARDING_TOTAL_SCREENS, OnboardingScreen } from '@/src/contexts/TutorialContext';

/**
 * The frame every onboarding screen sits in: progress dots, a skip escape
 * hatch, scrollable body, and a call-to-action pinned above the keyboard.
 *
 * Built once here so screens 1-3 cannot drift apart, and so the fiddly parts
 * (safe areas, keyboard, tablet width, reduce-motion, accessibility) are
 * solved in a single place instead of three times.
 *
 * NOT A <Modal> — see the K2 rule in technical-guides:Tutorial.md. RN modals
 * overlapping a native prompt is what froze iOS on first launch.
 */
export interface OnbScreenContainerProps {
  screen: OnboardingScreen;
  title: string;
  subtitle?: string;
  /** CTA label. Omit the handler to render it disabled (e.g. nothing picked yet). */
  ctaLabel: string;
  onPressCta?: () => void;
  onSkip: () => void;
  children: React.ReactNode;
}

/** Tablets get a centred column — full-width tiles on an iPad look broken. */
export const ONB_MAX_CONTENT_WIDTH = 560;

export function OnbScreenContainer({
  screen,
  title,
  subtitle,
  ctaLabel,
  onPressCta,
  onSkip,
  children,
}: OnbScreenContainerProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const ctaDisabled = !onPressCta;

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    // Centres the column on tablets; a no-op on phones where the screen is
    // narrower than the cap anyway.
    column: {
      flex: 1,
      width: '100%',
      maxWidth: isTablet() ? ONB_MAX_CONTENT_WIDTH : undefined,
      alignSelf: 'center',
      paddingHorizontal: getCardPadding(),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Layout.spacing.md,
    },
    dots: {
      flexDirection: 'row',
      gap: Layout.spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    skipText: {
      fontSize: scaleFont(Fonts.sizes.md),
      color: colors.textSecondary,
    },
    title: {
      fontSize: scaleFont(Fonts.sizes.xl),
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginTop: Layout.spacing.sm,
    },
    subtitle: {
      fontSize: scaleFont(Fonts.sizes.md),
      color: colors.textSecondary,
      marginTop: Layout.spacing.xs,
      marginBottom: Layout.spacing.md,
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      paddingBottom: Layout.spacing.md,
    },
    cta: {
      backgroundColor: ctaDisabled ? colors.border : colors.primary,
      borderRadius: 12,
      minHeight: 48, // comfortably over the 44pt minimum touch target
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: Layout.spacing.md,
    },
    ctaText: {
      fontSize: scaleFont(Fonts.sizes.md),
      fontWeight: 'bold',
      color: ctaDisabled ? colors.textSecondary : colors.white,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.root}
      // On iOS the keyboard overlays the view, so the whole frame shifts; on
      // Android the window resizes and 'height' avoids a double shift. Without
      // this the CTA hides under the keyboard on small screens — the classic
      // way a first-run flow becomes a dead end.
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.column}>
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

          {/* Present on every screen: nobody should be held hostage by onboarding. */}
          <TouchableOpacity
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.skip')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        <TouchableOpacity
          style={styles.cta}
          onPress={onPressCta}
          disabled={ctaDisabled}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          accessibilityState={{ disabled: ctaDisabled }}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
