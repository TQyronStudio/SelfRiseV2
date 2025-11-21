import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Gratitude } from '@/src/types/gratitude';
import { Layout, Fonts } from '@/src/constants';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface EditGratitudeModalProps {
  visible: boolean;
  gratitude: Gratitude | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditGratitudeModal({
  visible,
  gratitude,
  onClose,
  onSuccess
}: EditGratitudeModalProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { actions } = useGratitude();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (gratitude) {
      setContent(gratitude.content);
    }
  }, [gratitude]);

  const handleSubmit = async () => {
    if (!gratitude || !content.trim()) return;

    try {
      setIsSubmitting(true);
      await actions.updateGratitude(gratitude.id, { content: content.trim() });
      onSuccess();
    } catch (error) {
      Alert.alert(t('common.error'), t('journal.export.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    onClose();
  };

  if (!gratitude) return null;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary, // Modal background
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardBackgroundElevated, // Elevated header
    },
    closeButton: {
      padding: Layout.spacing.xs,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.sm,
      borderRadius: 8,
    },
    saveButtonDisabled: {
      backgroundColor: colors.textSecondary,
    },
    saveButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    saveButtonTextDisabled: {
      color: colors.white,
    },
    content: {
      flex: 1,
      padding: Layout.spacing.md,
    },
    typeIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Layout.spacing.md,
      padding: Layout.spacing.sm,
      backgroundColor: colors.cardBackgroundElevated, // Elevated card
      borderRadius: 8,
    },
    typeText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    bonusText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFD700', // Keep vibrant gold
      textTransform: 'uppercase',
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.cardBackgroundElevated, // Elevated input
      borderRadius: 12,
      padding: Layout.spacing.md,
      fontSize: 16,
      color: colors.text,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Layout.spacing.md,
    },
    characterCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('gratitude.edit.title')}</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            style={[styles.saveButton, (!content.trim() || isSubmitting) && styles.saveButtonDisabled]}
          >
            <Text style={[
              styles.saveButtonText,
              (!content.trim() || isSubmitting) && styles.saveButtonTextDisabled
            ]}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.typeIndicator}>
            <Text style={styles.typeText}>
              {gratitude.type === 'gratitude' ? '🙏 Gratitude' : '💪 Self-Praise'}
            </Text>
            {gratitude.isBonus && (
              <Text style={styles.bonusText}>{t('gratitude.bonus.label')} ⭐</Text>
            )}
          </View>

          <TextInput
            style={styles.textInput}
            value={content}
            onChangeText={setContent}
            placeholder={t('journal.editPlaceholder')}
            multiline
            autoFocus
            maxLength={500}
            placeholderTextColor={colors.textSecondary}
          />

          <View style={styles.footer}>
            <Text style={styles.characterCount}>
              {content.length}/500
            </Text>
            <Text style={styles.timestamp}>
              Created: {new Date(gratitude.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}