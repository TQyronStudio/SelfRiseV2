import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Colors, Fonts, Layout } from '@/src/constants';

const { width: screenWidth } = Dimensions.get('window');

// Base modal props interface
interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

// Confirmation modal props interface
interface ConfirmationModalProps extends BaseModalProps {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

// Multi-action modal props interface
interface MultiActionModalProps extends BaseModalProps {
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  primaryActionText?: string;
  secondaryActionText?: string;
}

// WarmUpSuccessModal - for successful warm up payments and no frozen days messages
export function WarmUpSuccessModal({ 
  visible, 
  onClose, 
  title, 
  message, 
  buttonText 
}: BaseModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>{title || 'Success!'}</Text>
          <Text style={styles.message}>
            {message || 'Operation completed successfully.'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{buttonText || 'OK'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// WarmUpErrorModal - for warm up payment errors and issues
export function WarmUpErrorModal({ 
  visible, 
  onClose, 
  title, 
  message, 
  buttonText 
}: BaseModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>{title || 'Error'}</Text>
          <Text style={styles.message}>
            {message || 'Something went wrong. Please try again.'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{buttonText || 'OK'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// WarmUpConfirmationModal - for ad watching confirmations and simple confirmations
export function WarmUpConfirmationModal({ 
  visible, 
  onClose, 
  onConfirm,
  title, 
  message, 
  confirmText,
  cancelText 
}: ConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>🔄</Text>
          <Text style={styles.title}>{title || 'Confirmation'}</Text>
          <Text style={styles.message}>
            {message || 'Are you sure you want to continue?'}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                {cancelText || 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onConfirm}>
              <Text style={styles.buttonText}>{confirmText || 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// WarmUpIssueModal - for warm up payment issues with multiple action options
export function WarmUpIssueModal({ 
  visible, 
  onClose,
  onPrimaryAction,
  onSecondaryAction,
  title, 
  message, 
  primaryActionText,
  secondaryActionText 
}: MultiActionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>🛠️</Text>
          <Text style={styles.title}>{title || 'Issue Detected'}</Text>
          <Text style={styles.message}>
            {message || 'There seems to be an issue. Choose how to proceed.'}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onPrimaryAction}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                {primaryActionText || 'Try Again'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onSecondaryAction}>
              <Text style={styles.buttonText}>{secondaryActionText || 'Quick Warm Up'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// QuickWarmUpModal - for quick warm up confirmations
export function QuickWarmUpModal({ 
  visible, 
  onClose, 
  onConfirm,
  title, 
  message, 
  confirmText,
  cancelText 
}: ConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>🔄</Text>
          <Text style={styles.title}>{title || 'Quick Warm Up'}</Text>
          <Text style={styles.message}>
            {message || 'This will warm up your frozen streak without watching ads. Your streak will continue normally. Continue?'}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                {cancelText || 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onConfirm}>
              <Text style={styles.buttonText}>{confirmText || 'Warm Up'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    maxWidth: screenWidth * 0.85,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  emoji: {
    fontSize: 64,
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
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xl,
    minWidth: 120,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  cancelButtonText: {
    color: Colors.text,
  },
});