import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { Fonts } from '@/src/constants/fonts';
import { Layout } from '@/src/constants/dimensions';
import { scaleFont, getCardPadding, isTablet } from '@/src/utils/responsive';
import { ONB_MAX_CONTENT_WIDTH } from './OnbScreenContainer';

/**
 * The one talking screen in onboarding, between the settings questions
 * (language, theme, notifications) and the first real ask.
 *
 * WHY IT EXISTS: without it the flow jumps from system-ish setup straight to
 * "what do you want to do regularly?" — a personal commitment with no warm-up.
 * The third line is doing the real work: saying it takes a minute and that
 * everything stays changeable is what removes the pressure.
 *
 * WHY IT IS EXACTLY ONE SCREEN: the 25-step tutorial this replaces had NINE
 * steps that only talked, and every one of them started as a reasonable idea.
 * Three lines, one button, no feature tour. The old tutorial's second step
 * ("here is your dashboard, here are your streaks") is the thing not to build.
 *
 * No progress dots on purpose — this is not one of the three tasks, and the
 * dots should keep telling the truth about how much is left.
 *
 * Not a <Modal> (rule K2), and `elevation` accompanies `zIndex` because Android
 * orders siblings by elevation.
 */
export interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

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
      width: 88,
      height: 88,
      borderRadius: 44,
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
    tagline: {
      fontSize: scaleFont(Fonts.sizes.md),
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Layout.spacing.sm,
    },
    promise: {
      fontSize: scaleFont(Fonts.sizes.md),
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Layout.spacing.lg,
      lineHeight: scaleFont(Fonts.sizes.md) * 1.5,
    },
    cta: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: Layout.spacing.lg,
    },
    ctaText: {
      fontSize: scaleFont(Fonts.sizes.md),
      fontWeight: 'bold',
      color: colors.white,
    },
  });

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <View style={styles.column}>
        <View style={styles.body}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={40} color={colors.white} />
          </View>

          <Text style={styles.title} accessibilityRole="header">
            {t('onboarding.welcome.title')}
          </Text>
          <Text style={styles.tagline}>{t('onboarding.welcome.tagline')}</Text>
          <Text style={styles.promise}>{t('onboarding.welcome.promise')}</Text>
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.welcome.cta')}
        >
          <Text style={styles.ctaText}>{t('onboarding.welcome.cta')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
