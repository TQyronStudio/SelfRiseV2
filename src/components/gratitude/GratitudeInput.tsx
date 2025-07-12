import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { Colors, Fonts, Layout } from '@/src/constants';
import { today } from '@/src/utils/date';
import { ErrorModal } from '@/src/components/common';

interface GratitudeInputProps {
  onSubmitSuccess?: () => void;
  isBonus?: boolean; // true if this is a bonus gratitude (already have 3+)
}

export default function GratitudeInput({ onSubmitSuccess, isBonus = false }: GratitudeInputProps) {
  const { t } = useI18n();
  const { actions } = useGratitude();
  const [gratitudeText, setGratitudeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    const trimmedText = gratitudeText.trim();
    
    if (!trimmedText) {
      setErrorMessage('Please enter your gratitude');
      setShowError(true);
      return;
    }

    if (trimmedText.length < 3) {
      setErrorMessage('Gratitude must be at least 3 characters long');
      setShowError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      await actions.createGratitude({
        content: trimmedText,
        date: today(),
      });

      setGratitudeText('');
      onSubmitSuccess?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save gratitude');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        placeholder={isBonus ? `${t('gratitude.gratitudePlaceholder')} (optional)` : t('gratitude.gratitudePlaceholder')}
        placeholderTextColor={Colors.textSecondary}
        value={gratitudeText}
        onChangeText={setGratitudeText}
        multiline
        maxLength={200}
        editable={!isSubmitting}
        autoFocus
      />
      
      <View style={styles.footer}>
        <Text style={styles.characterCount}>
          {gratitudeText.length}/200
        </Text>
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            (gratitudeText.trim().length < 3 || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={gratitudeText.trim().length < 3 || isSubmitting}
        >
          <Text style={[
            styles.submitButtonText,
            (gratitudeText.trim().length < 3 || isSubmitting) && styles.submitButtonTextDisabled
          ]}>
            {isSubmitting ? t('common.loading') : t('common.add')}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        message={errorMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Layout.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCount: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
  },
  submitButtonTextDisabled: {
    color: Colors.textSecondary,
  },
});