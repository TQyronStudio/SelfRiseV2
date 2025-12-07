import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BaseModal from './BaseModal';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Fonts, Layout } from '@/src/constants';

interface ErrorModalProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Error modal title text. Should be a translated string, e.g. t('common.error')
   * Default: 'Error' (for backwards compatibility - callers should provide translated text)
   */
  title?: string;
  /**
   * Error message text. Should be a translated string, e.g. t('errors.saveFailed')
   */
  message: string;
  /**
   * Close button text. Should be a translated string, e.g. t('common.ok')
   * Default: 'OK' (for backwards compatibility - callers should provide translated text)
   */
  closeButtonText?: string;
}

export default function ErrorModal({
  visible,
  onClose,
  title = 'Error',
  message,
  closeButtonText = 'OK',
}: ErrorModalProps) {
  const { colors } = useTheme();

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
      color: colors.error,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    message: {
      fontSize: Fonts.sizes.md,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      closeButtonText={closeButtonText}
    >
      <View style={styles.container}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </BaseModal>
  );
}