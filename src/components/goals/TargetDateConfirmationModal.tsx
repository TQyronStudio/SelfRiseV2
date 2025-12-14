import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Fonts, Layout } from '@/src/constants';

const { width: screenWidth } = Dimensions.get('window');

interface TargetDateConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onAddDate: () => void;
  onContinueWithoutDate: () => void;
}

export default function TargetDateConfirmationModal({
  visible,
  onClose,
  onAddDate,
  onContinueWithoutDate,
}: TargetDateConfirmationModalProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    modal: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 20,
      paddingVertical: Layout.spacing.xl,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      maxWidth: screenWidth * 0.85,
      width: '100%',
    },
    emoji: {
      fontSize: 64,
      marginBottom: Layout.spacing.md,
    },
    title: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    message: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Layout.spacing.lg,
    },
    buttonContainer: {
      width: '100%',
      gap: Layout.spacing.sm,
    },
    button: {
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.xl,
      minWidth: 120,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.border,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    secondaryButtonText: {
      color: colors.textSecondary,
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>📅</Text>

          <Text style={styles.title}>
            {t('goals.targetDateConfirmation.title')}
          </Text>

          <Text style={styles.message}>
            {t('goals.targetDateConfirmation.message')}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onAddDate}
            >
              <Text style={styles.primaryButtonText}>
                {t('goals.targetDateConfirmation.addDate')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onContinueWithoutDate}
            >
              <Text style={styles.secondaryButtonText}>
                {t('goals.targetDateConfirmation.continueWithout')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}