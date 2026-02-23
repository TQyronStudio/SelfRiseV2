import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
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
export default function SettingsScreen() {
  const { t } = useI18n();
  const { colors, themeMode, setThemeMode } = useTheme();
  const { actions: { restartTutorial, clearCrashData } } = useTutorial();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());


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
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to restart tutorial:', error);
      setErrorMessage('Failed to restart tutorial. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsResetting(false);
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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

      {/* Success Modal */}
      <BaseModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        showCloseButton={false}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalEmoji}>✅</Text>
          <Text style={styles.modalTitle}>{t('settings.success')}</Text>
          <Text style={styles.modalMessage}>{t('settings.tutorialResetSuccess')}</Text>
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