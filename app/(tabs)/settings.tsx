import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { useTutorial } from '@/src/contexts/TutorialContext';
import { Colors, Fonts, Layout } from '@/src/constants';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';
import BaseModal from '@/src/components/common/BaseModal';

export default function SettingsScreen() {
  const { t } = useI18n();
  const { actions: { restartTutorial, clearCrashData } } = useTutorial();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      <View style={styles.content}>
        {/* Habit Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habit Analytics</Text>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleViewHabitStats}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="bar-chart" size={24} color={Colors.primary} />
              <Text style={styles.menuItemText}>Individual Habit Stats</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="language" size={24} color={Colors.textSecondary} />
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
                color={isResetting ? Colors.textSecondary : Colors.warning}
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
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            )}
            {isResetting && (
              <Text style={styles.loadingText}>Resetting...</Text>
            )}
          </TouchableOpacity>
        </View>
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
        confirmButtonColor={Colors.warning}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
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
    color: Colors.text,
    marginLeft: 12,
  },
  comingSoon: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  menuItemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  textDisabled: {
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  modalMessage: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xl,
    alignItems: 'center',
    minWidth: 100,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
  },
});