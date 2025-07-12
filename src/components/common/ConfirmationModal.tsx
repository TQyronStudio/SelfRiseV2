import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BaseModal from './BaseModal';
import { Colors, Fonts, Layout } from '@/src/constants';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
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
  confirmButtonColor = Colors.error,
  emoji = '❓',
}: ConfirmationModalProps) {
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
            style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]} 
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
}

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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  message: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.border,
    borderRadius: 12,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text,
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
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
  },
});