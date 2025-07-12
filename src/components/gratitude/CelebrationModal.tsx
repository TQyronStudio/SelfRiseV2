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

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'daily_complete' | 'streak_milestone';
  title?: string;
  message?: string;
  streakDays?: number;
}

export default function CelebrationModal({
  visible,
  onClose,
  type,
  title,
  message,
  streakDays,
}: CelebrationModalProps) {
  const { t } = useI18n();

  const getDefaultContent = () => {
    switch (type) {
      case 'daily_complete':
        return {
          title: t('gratitude.celebration.title'),
          message: t('gratitude.celebration.message'),
          emoji: '🎉',
        };
      case 'streak_milestone':
        return {
          title: t('gratitude.milestone.title'),
          message: t('gratitude.milestone.message').replace('{{days}}', String(streakDays)),
          emoji: '🏆',
        };
      default:
        return {
          title: 'Congratulations!',
          message: 'Great job!',
          emoji: '✨',
        };
    }
  };

  const content = {
    title: title || getDefaultContent().title,
    message: message || getDefaultContent().message,
    emoji: getDefaultContent().emoji,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>{content.emoji}</Text>
          
          <Text style={styles.title}>{content.title}</Text>
          
          <Text style={styles.message}>{content.message}</Text>
          
          {type === 'streak_milestone' && streakDays && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{streakDays}</Text>
              <Text style={styles.streakLabel}>DAY{streakDays !== 1 ? 'S' : ''}</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>
              {t('gratitude.celebration.continue')}
            </Text>
          </TouchableOpacity>
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
  streakBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  streakNumber: {
    fontSize: Fonts.sizes.xxl || 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  streakLabel: {
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 1,
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
});