import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { Fonts } from '@/src/constants/fonts';
import { Layout } from '@/src/constants/dimensions';
import { scaleFont, getCardPadding, isTablet } from '@/src/utils/responsive';
import { HOW_IT_WORKS_SECTIONS } from '@/src/constants/helpTopics';

/**
 * The one place that answers "how does this app actually work?".
 *
 * The `?` tooltips scattered through the app answer "what is THIS thing?" —
 * they are pulled, one at a time, by someone already looking at the element.
 * Nothing answered the whole-app question, so a user who wanted the overview
 * before starting had nowhere to go. That gap is why onboarding kept getting
 * asked to be longer; the right fix is optional depth, not a longer forced flow.
 *
 * Reachable from Settings and from a quiet secondary link on the last
 * onboarding card. Never forced on anyone.
 *
 * Renders the SAME `help.*` keys the tooltips use (see helpTopics.ts) — the
 * text exists once and is presented twice.
 */

/** Tablets get a centred column; full-width paragraphs on an iPad are unreadable. */
const MAX_CONTENT_WIDTH = 640;

export function HowItWorksScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.md,
      paddingTop: insets.top + Layout.spacing.md,
      backgroundColor: colors.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: scaleFont(Fonts.sizes.lg),
      fontWeight: 'bold',
      color: colors.textInverse,
      textAlign: 'center',
    },
    // Balances the back button so the title stays optically centred.
    headerSpacer: {
      width: 40,
    },
    scroll: {
      flex: 1,
    },
    column: {
      width: '100%',
      maxWidth: isTablet() ? MAX_CONTENT_WIDTH : undefined,
      alignSelf: 'center',
      paddingHorizontal: getCardPadding(),
      paddingBottom: insets.bottom + Layout.spacing.xl,
    },
    intro: {
      fontSize: scaleFont(Fonts.sizes.md),
      color: colors.textSecondary,
      marginTop: Layout.spacing.lg,
      marginBottom: Layout.spacing.sm,
    },
    sectionTitle: {
      fontSize: scaleFont(Fonts.sizes.md),
      fontWeight: 'bold',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: Layout.spacing.xl,
      marginBottom: Layout.spacing.sm,
    },
    card: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
    },
    topicTitle: {
      fontSize: scaleFont(Fonts.sizes.md),
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: Layout.spacing.xs,
    },
    topicContent: {
      fontSize: scaleFont(Fonts.sizes.sm),
      color: colors.textSecondary,
      lineHeight: scaleFont(Fonts.sizes.sm) * 1.5,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('screens.goBack')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('screens.howItWorks')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <Text style={styles.intro}>{t('help.howItWorksIntro')}</Text>

          {HOW_IT_WORKS_SECTIONS.map(section => (
            <View key={section.id}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                {t(`help.${section.titleKey}` as any)}
              </Text>

              {section.topicKeys.map(topicKey => (
                <View key={topicKey} style={styles.card}>
                  <Text style={styles.topicTitle}>
                    {t(`help.${topicKey}.title` as any)}
                  </Text>
                  <Text style={styles.topicContent}>
                    {t(`help.${topicKey}.content` as any)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
