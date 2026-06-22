import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts } from '@/src/constants/fonts';
import { useTheme, ThemeMode } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import type { SupportedLanguage } from '@/src/utils/i18n';
import {
  getModalWidth,
  getModalPadding,
  getHorizontalMargin,
  scaleFont,
  getIconSize,
  isTablet,
  getScreenSize,
  ScreenSize,
} from '@/src/utils/responsive';

interface OnboardingPreferencesModalProps {
  visible: boolean;
  onComplete: () => void;
}

type PrefsStep = 'language' | 'theme';

const LANGUAGE_OPTIONS: { code: SupportedLanguage; flag: string; labelKey: string }[] = [
  { code: 'en', flag: '🇬🇧', labelKey: 'settings.languageEnglish' },
  { code: 'de', flag: '🇩🇪', labelKey: 'settings.languageGerman' },
  { code: 'es', flag: '🇪🇸', labelKey: 'settings.languageSpanish' },
];

/**
 * Onboarding Preferences Gate - shown ONLY on the very first app launch,
 * before the tutorial's Welcome step.
 *
 * Two sub-screens:
 *  1. Language selection (live switch on tap - whole UI + confirm button translate instantly)
 *  2. Theme selection (live light/dark preview on tap)
 *
 * Not part of TUTORIAL_STEPS, so it carries no "Step X of Y" progress counter.
 */
export const OnboardingPreferencesModal: React.FC<OnboardingPreferencesModalProps> = ({
  visible,
  onComplete,
}) => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { t, currentLanguage, changeLanguage } = useI18n();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<PrefsStep>('language');
  // Local mirror of the chosen theme for the checkmark indicator.
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(
    themeMode === 'dark' ? 'dark' : 'light'
  );

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, step]);

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    // Live switch - re-renders this modal in the chosen language (incl. confirm button)
    await changeLanguage(code);
  };

  const handleSelectTheme = (mode: 'light' | 'dark') => {
    setSelectedTheme(mode);
    // Live preview - ThemeContext re-renders colors instantly
    void setThemeMode(mode as ThemeMode);
  };

  const handleConfirm = () => {
    if (step === 'language') {
      setStep('theme');
    } else {
      onComplete();
    }
  };

  const isLanguageStep = step === 'language';
  const title = isLanguageStep
    ? t('tutorial.languageSetup.title')
    : t('tutorial.themeSetup.title');
  const subtitle = isLanguageStep
    ? t('tutorial.languageSetup.subtitle')
    : t('tutorial.themeSetup.subtitle');
  const confirmLabel = isLanguageStep
    ? t('tutorial.languageSetup.confirm')
    : t('tutorial.themeSetup.confirm');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    wrapper: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: getHorizontalMargin(),
      width: '100%',
    },
    card: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: isTablet() ? 24 : 20,
      padding: getModalPadding(),
      width: getModalWidth(),
      maxWidth: '100%',
      alignItems: 'center',
      borderTopWidth: isTablet() ? 5 : 4,
      borderTopColor: colors.primary,
    },
    emojiContainer: {
      width: isTablet() ? 100 : (getScreenSize() === ScreenSize.SMALL ? 70 : 80),
      height: isTablet() ? 100 : (getScreenSize() === ScreenSize.SMALL ? 70 : 80),
      borderRadius: isTablet() ? 50 : (getScreenSize() === ScreenSize.SMALL ? 35 : 40),
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: isTablet() ? 24 : (getScreenSize() === ScreenSize.SMALL ? 16 : 20),
    },
    emoji: {
      fontSize: scaleFont(40),
    },
    title: {
      fontSize: scaleFont(Fonts.sizes.xxl),
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: isTablet() ? 12 : 8,
      lineHeight: scaleFont(Fonts.sizes.xxl) * 1.2,
    },
    subtitle: {
      fontSize: scaleFont(Fonts.sizes.md),
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: scaleFont(Fonts.sizes.md) * 1.5,
      marginBottom: isTablet() ? 28 : (getScreenSize() === ScreenSize.SMALL ? 18 : 22),
    },
    optionsContainer: {
      width: '100%',
      marginBottom: isTablet() ? 28 : (getScreenSize() === ScreenSize.SMALL ? 18 : 22),
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: isTablet() ? 16 : 14,
      paddingHorizontal: isTablet() ? 20 : 16,
      borderRadius: isTablet() ? 16 : 12,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 2,
      borderColor: 'transparent',
      marginBottom: 10,
    },
    optionSelected: {
      borderColor: colors.primary,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionFlag: {
      fontSize: scaleFont(26),
      marginRight: 14,
    },
    optionIcon: {
      marginRight: 14,
    },
    optionLabel: {
      fontSize: scaleFont(Fonts.sizes.md),
      fontWeight: '600',
      color: colors.textPrimary,
    },
    confirmButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isTablet() ? 18 : (getScreenSize() === ScreenSize.SMALL ? 14 : 16),
      paddingHorizontal: isTablet() ? 40 : (getScreenSize() === ScreenSize.SMALL ? 24 : 32),
      borderRadius: isTablet() ? 16 : 12,
      minWidth: isTablet() ? 240 : (getScreenSize() === ScreenSize.SMALL ? 160 : 200),
      backgroundColor: colors.primary,
    },
    confirmButtonText: {
      fontSize: scaleFont(Fonts.sizes.md),
      fontWeight: '600',
      color: colors.white,
      marginRight: 8,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

        <Animated.View
          style={[
            styles.wrapper,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.card}>
            {/* Emoji */}
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{isLanguageStep ? '🌍' : '🎨'}</Text>
            </View>

            {/* Title + subtitle */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {isLanguageStep
                ? LANGUAGE_OPTIONS.map((opt) => {
                    const selected = currentLanguage === opt.code;
                    return (
                      <TouchableOpacity
                        key={opt.code}
                        style={[styles.option, selected && styles.optionSelected]}
                        onPress={() => handleSelectLanguage(opt.code)}
                        accessible
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={t(opt.labelKey as any)}
                      >
                        <View style={styles.optionLeft}>
                          <Text style={styles.optionFlag}>{opt.flag}</Text>
                          <Text style={styles.optionLabel}>{t(opt.labelKey as any)}</Text>
                        </View>
                        {selected && (
                          <Ionicons name="checkmark-circle" size={getIconSize(24)} color={colors.success} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                : (['light', 'dark'] as const).map((mode) => {
                    const selected = selectedTheme === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.option, selected && styles.optionSelected]}
                        onPress={() => handleSelectTheme(mode)}
                        accessible
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={t(`tutorial.themeSetup.${mode}` as any)}
                      >
                        <View style={styles.optionLeft}>
                          <Ionicons
                            name={mode === 'light' ? 'sunny' : 'moon'}
                            size={getIconSize(24)}
                            color={colors.primary}
                            style={styles.optionIcon}
                          />
                          <Text style={styles.optionLabel}>
                            {t(`tutorial.themeSetup.${mode}` as any)}
                          </Text>
                        </View>
                        {selected && (
                          <Ionicons name="checkmark-circle" size={getIconSize(24)} color={colors.success} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
            </View>

            {/* Confirm button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              accessible
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
              <Ionicons name="arrow-forward" size={getIconSize(20)} color={colors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
