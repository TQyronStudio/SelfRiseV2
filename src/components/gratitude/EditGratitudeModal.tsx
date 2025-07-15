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
import { Gratitude } from '@/src/types/gratitude';
import { Colors, Layout, Fonts } from '@/src/constants';
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
      Alert.alert('Error', 'Failed to update journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    onClose();
  };

  if (!gratitude) return null;

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
            <IconSymbol name="xmark" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Journal Entry</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            style={[styles.saveButton, (!content.trim() || isSubmitting) && styles.saveButtonDisabled]}
          >
            <Text style={[
              styles.saveButtonText, 
              (!content.trim() || isSubmitting) && styles.saveButtonTextDisabled
            ]}>
              {isSubmitting ? 'Saving...' : 'Save'}
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
              <Text style={styles.bonusText}>BONUS ⭐</Text>
            )}
          </View>

          <TextInput
            style={styles.textInput}
            value={content}
            onChangeText={setContent}
            placeholder="Edit your journal entry..."
            multiline
            autoFocus
            maxLength={500}
            placeholderTextColor={Colors.textSecondary}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeButton: {
    padding: Layout.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: Colors.white,
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
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.gold || '#FFD700',
    textTransform: 'uppercase',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    fontSize: 16,
    color: Colors.text,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Layout.spacing.md,
  },
  characterCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});