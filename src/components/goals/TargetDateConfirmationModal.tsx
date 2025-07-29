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
import { Colors, Fonts, Layout } from '@/src/constants';

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
            Add Target Date?
          </Text>
          
          <Text style={styles.message}>
            A goal without a date is just a dream. Setting a target date will help you stay motivated and on track.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={onAddDate}
            >
              <Text style={styles.primaryButtonText}>
                Add Date
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={onContinueWithoutDate}
            >
              <Text style={styles.secondaryButtonText}>
                Continue Without Date
              </Text>
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
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});