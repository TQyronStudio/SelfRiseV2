import React, { ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Fonts, Layout } from '@/src/constants';

const { width: screenWidth } = Dimensions.get('window');

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  closeButtonText?: string;
  maxWidth?: number;
  animationType?: 'none' | 'slide' | 'fade';
}

export default function BaseModal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeButtonText = 'Close',
  maxWidth = screenWidth * 0.85,
  animationType = 'fade',
}: BaseModalProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    keyboardView: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    modal: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.xl,
      width: '100%',
    },
    title: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: Layout.spacing.md,
      textAlign: 'center',
    },
    content: {
      marginBottom: Layout.spacing.lg,
    },
    closeButton: {
      backgroundColor: colors.primary,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.lg,
      borderRadius: Layout.borderRadius.md,
      alignItems: 'center',
    },
    closeButtonText: {
      color: colors.white,
      fontSize: Fonts.sizes.md,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { maxWidth }]}>
            {title && (
              <Text style={styles.title}>{title}</Text>
            )}
            
            <View style={styles.content}>
              {children}
            </View>
            
            {showCloseButton && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>{closeButtonText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}