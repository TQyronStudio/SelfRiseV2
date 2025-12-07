import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BaseModal from './BaseModal';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Fonts, Layout } from '@/src/constants';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /**
   * Modal title text. Should be a translated string, e.g. t('common.confirmAction')
   * Default: 'Confirm Action' (for backwards compatibility - callers should provide translated text)
   */
  title?: string;
  /**
   * Confirmation message text. Should be a translated string, e.g. t('habits.deleteConfirmMessage')
   */
  message: string;
  /**
   * Confirm button text. Should be a translated string, e.g. t('common.confirm')
   * Default: 'Confirm' (for backwards compatibility - callers should provide translated text)
   */
  confirmText?: string;
  /**
   * Cancel button text. Should be a translated string, e.g. t('common.cancel')
   * Default: 'Cancel' (for backwards compatibility - callers should provide translated text)
   */
  cancelText?: string;
  confirmButtonColor?: string;
  emoji?: string;
}

export default function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor,
  emoji = '❓',
}: ConfirmationModalProps) {
  const { colors } = useTheme();
  const defaultConfirmColor = confirmButtonColor || colors.error;

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    emoji: {
      fontSize: 48,
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
      flexDirection: 'row',
      gap: Layout.spacing.md,
      width: '100%',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.border,
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: Fonts.sizes.md,
      fontWeight: '500',
    },
    confirmButton: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: colors.white,
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
    },
  });

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      showCloseButton={false}
    >
      <View style={styles.container}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{cancelText}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: defaultConfirmColor }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
}