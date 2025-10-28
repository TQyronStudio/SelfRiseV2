import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { useTutorial } from '@/src/contexts/TutorialContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Fonts, Layout } from '@/src/constants';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';
import BaseModal from '@/src/components/common/BaseModal';
import { NotificationSettings } from '@/src/components/settings/NotificationSettings';

export default function SettingsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { actions: { restartTutorial, clearCrashData } } = useTutorial();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Styles that depend on theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
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

  const handleViewHabitStats = () => {
    router.push('/habit-stats' as any);
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <NotificationSettings />
        </View>

        {/* Habit Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habit Analytics</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleViewHabitStats}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="bar-chart" size={24} color={colors.primary} />
              <Text style={styles.menuItemText}>Individual Habit Stats</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="language" size={24} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, styles.comingSoon]}>
                Language Settings - Coming Soon
              </Text>
            </View>
          </View>
        </View>

        {/* Tutorial */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tutorial</Text>
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
              <Text style={styles.loadingText}>Resetting...</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

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
          <Text style={styles.modalTitle}>Success</Text>
          <Text style={styles.modalMessage}>{t('settings.tutorialResetSuccess')}</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
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
          <Text style={styles.modalTitle}>Error</Text>
          <Text style={styles.modalMessage}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowErrorModal(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>
    </SafeAreaView>
  );
}