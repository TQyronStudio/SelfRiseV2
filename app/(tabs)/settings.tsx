import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Switch, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { useTutorial } from '@/src/contexts/TutorialContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Fonts, Layout } from '@/src/constants';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';
import BaseModal from '@/src/components/common/BaseModal';
import { NotificationSettings } from '@/src/components/settings/NotificationSettings';
import { changeLanguage, getCurrentLanguage } from '@/src/utils/i18n';
import { isHapticsEnabled, setHapticsEnabled, HAPTICS_CHANGED_EVENT } from '@/src/services/hapticsService';
import { useHabits } from '@/src/contexts/HabitsContext';
import { useGoals } from '@/src/contexts/GoalsContext';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { useAchievements } from '@/src/contexts/AchievementContext';
import {
  isMarketingDemoModeEnabled,
  MARKETING_DEMO_MODE_CHANGED_EVENT,
  setMarketingDemoModeEnabled,
} from '@/src/services/marketingDemoModeService';
export default function SettingsScreen() {
  const { t } = useI18n();
  const { colors, themeMode, setThemeMode } = useTheme();
  const { actions: { restartTutorial, clearCrashData } } = useTutorial();
  const { actions: habitActions } = useHabits();
  const { actions: goalActions } = useGoals();
  const { actions: gratitudeActions } = useGratitude();
  const { refreshAchievements } = useAchievements();
  const [isResetting, setIsResetting] = useState(false);
  const [isLoadingMarketingDemo, setIsLoadingMarketingDemo] = useState(false);
  const [isClearingMarketingDemo, setIsClearingMarketingDemo] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showClearDemoConfirmation, setShowClearDemoConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [hapticsEnabled, setHapticsEnabledState] = useState(isHapticsEnabled());
  const [isMarketingDemoMode, setIsMarketingDemoMode] = useState(false);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(HAPTICS_CHANGED_EVENT, (value: boolean) => {
      setHapticsEnabledState(value);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    isMarketingDemoModeEnabled()
      .then(setIsMarketingDemoMode)
      .catch(error => {
        console.error('Failed to load marketing demo mode:', error);
      });

    const sub = DeviceEventEmitter.addListener(
      MARKETING_DEMO_MODE_CHANGED_EVENT,
      (value: boolean) => setIsMarketingDemoMode(value)
    );

    return () => sub.remove();
  }, []);

  const handleHapticsToggle = async (value: boolean) => {
    setHapticsEnabledState(value); // immediate UI feedback
    await setHapticsEnabled(value);
  };


  // Styles that depend on theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 80, // Extra padding for banner
    },
    bannerContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.backgroundSecondary,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginBottom: 16,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuItemText: {
      fontSize: 16,
      fontFamily: Fonts.medium,
      color: colors.text,
      marginLeft: 12,
    },
    comingSoon: {
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    menuItemTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
    menuItemDescription: {
      fontSize: 14,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    menuItemDisabled: {
      opacity: 0.6,
    },
    textDisabled: {
      color: colors.textSecondary,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    modalContent: {
      alignItems: 'center',
    },
    modalEmoji: {
      fontSize: 48,
      marginBottom: Layout.spacing.md,
    },
    modalTitle: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    modalMessage: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Layout.spacing.lg,
    },
    modalButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.xl,
      alignItems: 'center',
      minWidth: 100,
    },
    modalButtonText: {
      color: colors.white,
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
    },
  });

  const handleRestartTutorial = () => {
    setShowResetConfirmation(true);
  };

  const performRestart = async () => {
    try {
      setIsResetting(true);
      await restartTutorial();
      await clearCrashData();
      setSuccessMessage(t('settings.tutorialResetSuccess'));
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to restart tutorial:', error);
      setErrorMessage('Failed to restart tutorial. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsResetting(false);
    }
  };

  const handleLoadMarketingDemoData = async (seedLocale?: 'en' | 'de' | 'es') => {
    try {
      setIsLoadingMarketingDemo(true);
      const { loadMarketingDemoData } = await import('@/src/services/marketingDemoDataService');
      const currentAppLanguage = getCurrentLanguage();
      const locale = seedLocale ?? (currentAppLanguage === 'de' || currentAppLanguage === 'es' ? currentAppLanguage : 'en');
      const result = await loadMarketingDemoData(locale);

      await Promise.all([
        habitActions.loadHabits(),
        goalActions.loadGoals(),
        gratitudeActions.forceRefresh(),
        refreshAchievements(),
      ]);

      setIsMarketingDemoMode(true);
      setSuccessMessage(
        `${result.locale.toUpperCase()} marketing demo loaded: ${result.habits} habits, ${result.goals} goals, ${result.journalEntries} journal entries, and ${result.achievements} achievements.`
      );
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to load marketing demo data:', error);
      setErrorMessage('Failed to load marketing demo data. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoadingMarketingDemo(false);
    }
  };

  const handleDisableMarketingDemoMode = async () => {
    try {
      await setMarketingDemoModeEnabled(false);
      setIsMarketingDemoMode(false);
      setSuccessMessage('Marketing demo mode disabled. AdMob banners will show again.');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to disable marketing demo mode:', error);
      setErrorMessage('Failed to disable marketing demo mode. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleClearMarketingDemoData = async () => {
    try {
      setIsClearingMarketingDemo(true);
      const { clearMarketingDemoData } = await import('@/src/services/marketingDemoDataService');
      await clearMarketingDemoData();

      await Promise.all([
        habitActions.loadHabits(),
        goalActions.loadGoals(),
        gratitudeActions.forceRefresh(),
        refreshAchievements(),
      ]);

      setIsMarketingDemoMode(false);
      setSuccessMessage('Marketing demo data cleared. The app is back to an empty clean state.');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to clear marketing demo data:', error);
      setErrorMessage('Failed to clear marketing demo data. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsClearingMarketingDemo(false);
      setShowClearDemoConfirmation(false);
    }
  };

  const handleLanguageChange = async (language: 'en' | 'de' | 'es') => {
    try {
      await changeLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          <NotificationSettings />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>

          {/* Light Mode */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setThemeMode('light')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="sunny" size={24} color={colors.primary} />
              <Text style={styles.menuItemText}>{t('settings.lightMode')}</Text>
            </View>
            {themeMode === 'light' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            )}
          </TouchableOpacity>

          {/* Dark Mode */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setThemeMode('dark')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon" size={24} color={colors.primary} />
              <Text style={styles.menuItemText}>{t('settings.darkMode')}</Text>
            </View>
            {themeMode === 'dark' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            )}
          </TouchableOpacity>

          {/* System Auto */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setThemeMode('system')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="phone-portrait" size={24} color={colors.primary} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>{t('settings.systemAuto')}</Text>
                <Text style={styles.menuItemDescription}>
                  {t('settings.systemAutoDescription')}
                </Text>
              </View>
            </View>
            {themeMode === 'system' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            )}
          </TouchableOpacity>
        </View>

        {/* Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.feedback')}</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>{t('settings.hapticFeedback')}</Text>
                <Text style={styles.menuItemDescription}>
                  {t('settings.hapticFeedbackDescription')}
                </Text>
              </View>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleHapticsToggle}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Language Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>

          {/* English */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleLanguageChange('en')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>🇬🇧</Text>
              <Text style={styles.menuItemText}>{t('settings.languageEnglish')}</Text>
            </View>
            {currentLanguage === 'en' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            )}
          </TouchableOpacity>

          {/* German (Deutsch) */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleLanguageChange('de')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>🇩🇪</Text>
              <Text style={styles.menuItemText}>{t('settings.languageGerman')}</Text>
            </View>
            {currentLanguage === 'de' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            )}
          </TouchableOpacity>

          {/* Spanish (Español) */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleLanguageChange('es')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>🇪🇸</Text>
              <Text style={styles.menuItemText}>{t('settings.languageSpanish')}</Text>
            </View>
            {currentLanguage === 'es' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            )}
          </TouchableOpacity>
        </View>

        {/* Tutorial */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.tutorial')}</Text>
          <TouchableOpacity
            style={[styles.menuItem, isResetting && styles.menuItemDisabled]}
            onPress={handleRestartTutorial}
            disabled={isResetting}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="refresh-circle"
                size={24}
                color={isResetting ? colors.textSecondary : colors.warning}
              />
              <View style={styles.menuItemTextContainer}>
                <Text style={[styles.menuItemText, isResetting && styles.textDisabled]}>
                  {t('settings.tutorialReset')}
                </Text>
                <Text style={[styles.menuItemDescription, isResetting && styles.textDisabled]}>
                  {t('settings.tutorialResetDescription')}
                </Text>
              </View>
            </View>
            {!isResetting && (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
            {isResetting && (
              <Text style={styles.loadingText}>{t('settings.resetting')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Marketing Demo</Text>
            <TouchableOpacity
              style={[styles.menuItem, isLoadingMarketingDemo && styles.menuItemDisabled]}
              onPress={() => handleLoadMarketingDemoData()}
              disabled={isLoadingMarketingDemo}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="sparkles"
                  size={24}
                  color={isLoadingMarketingDemo ? colors.textSecondary : colors.primary}
                />
                <View style={styles.menuItemTextContainer}>
                  <Text style={[styles.menuItemText, isLoadingMarketingDemo && styles.textDisabled]}>
                    {isMarketingDemoMode ? 'Reload Marketing Demo Data' : 'Load Marketing Demo Data'}
                  </Text>
                  <Text style={[styles.menuItemDescription, isLoadingMarketingDemo && styles.textDisabled]}>
                    Uses the current app language for screenshot-ready habits, goals, journal entries, XP, achievements, and Smart Make-up history.
                  </Text>
                </View>
              </View>
              {isLoadingMarketingDemo ? (
                <Text style={styles.loadingText}>Loading...</Text>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, isLoadingMarketingDemo && styles.menuItemDisabled]}
              onPress={() => handleLoadMarketingDemoData('de')}
              disabled={isLoadingMarketingDemo}
            >
              <View style={styles.menuItemLeft}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>🇩🇪</Text>
                <View style={styles.menuItemTextContainer}>
                  <Text style={[styles.menuItemText, isLoadingMarketingDemo && styles.textDisabled]}>
                    Load German Demo Data
                  </Text>
                  <Text style={[styles.menuItemDescription, isLoadingMarketingDemo && styles.textDisabled]}>
                    Force-replaces habits, goals, journal entries, and challenge text with German screenshot data.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, isLoadingMarketingDemo && styles.menuItemDisabled]}
              onPress={() => handleLoadMarketingDemoData('es')}
              disabled={isLoadingMarketingDemo}
            >
              <View style={styles.menuItemLeft}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>🇪🇸</Text>
                <View style={styles.menuItemTextContainer}>
                  <Text style={[styles.menuItemText, isLoadingMarketingDemo && styles.textDisabled]}>
                    Load Spanish Demo Data
                  </Text>
                  <Text style={[styles.menuItemDescription, isLoadingMarketingDemo && styles.textDisabled]}>
                    Force-replaces habits, goals, journal entries, and challenge text with Spanish screenshot data.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, isClearingMarketingDemo && styles.menuItemDisabled]}
              onPress={() => setShowClearDemoConfirmation(true)}
              disabled={isClearingMarketingDemo}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="trash-outline"
                  size={24}
                  color={isClearingMarketingDemo ? colors.textSecondary : colors.error}
                />
                <View style={styles.menuItemTextContainer}>
                  <Text style={[styles.menuItemText, isClearingMarketingDemo && styles.textDisabled]}>
                    Clear Marketing Demo Data
                  </Text>
                  <Text style={[styles.menuItemDescription, isClearingMarketingDemo && styles.textDisabled]}>
                    Removes the seeded demo habits, goals, journal entries, XP, achievements, and challenge data.
                  </Text>
                </View>
              </View>
              {isClearingMarketingDemo ? (
                <Text style={styles.loadingText}>Clearing...</Text>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {isMarketingDemoMode && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDisableMarketingDemoMode}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="eye-outline" size={24} color={colors.warning} />
                  <View style={styles.menuItemTextContainer}>
                    <Text style={styles.menuItemText}>Disable Marketing Demo Mode</Text>
                    <Text style={styles.menuItemDescription}>
                      Keeps the demo data, but turns AdMob banners back on.
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* AdMob Banner - Fixed at bottom */}
      <View style={styles.bannerContainer}>
        <AdBanner />
      </View>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        visible={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
        onConfirm={performRestart}
        title={t('settings.tutorialResetConfirmTitle')}
        message={t('settings.tutorialResetConfirmMessage')}
        confirmText={t('settings.reset')}
        cancelText={t('settings.cancel')}
        confirmButtonColor={colors.warning}
        emoji="🔄"
      />

      <ConfirmationModal
        visible={showClearDemoConfirmation}
        onClose={() => setShowClearDemoConfirmation(false)}
        onConfirm={handleClearMarketingDemoData}
        title="Clear Marketing Demo Data?"
        message="This removes the seeded demo habits, goals, journal entries, XP, achievements, and challenge data. It also turns AdMob banners back on."
        confirmText="Clear"
        cancelText={t('settings.cancel')}
        confirmButtonColor={colors.error}
        emoji="🗑️"
      />

      {/* Success Modal */}
      <BaseModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        showCloseButton={false}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalEmoji}>✅</Text>
          <Text style={styles.modalTitle}>{t('settings.success')}</Text>
          <Text style={styles.modalMessage}>{successMessage}</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>

      {/* Error Modal */}
      <BaseModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        showCloseButton={false}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalEmoji}>❌</Text>
          <Text style={styles.modalTitle}>{t('settings.errorTitle')}</Text>
          <Text style={styles.modalMessage}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowErrorModal(false)}
          >
            <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>

    </SafeAreaView>
  );
}
