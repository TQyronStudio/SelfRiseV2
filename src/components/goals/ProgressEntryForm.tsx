import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
} from 'react-native';
import { AddGoalProgressInput } from '../../types/goal';
import { DateString } from '../../types/common';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { ErrorModal } from '@/src/components/common';
import { today } from '../../utils/date';

export type ProgressEntryFormData = {
  value: number;
  note: string;
  date: DateString;
  progressType: 'add' | 'subtract' | 'set';
};

interface ProgressEntryFormProps {
  goalId: string;
  goalUnit: string;
  currentValue: number;
  targetValue: number;
  onSubmit: (data: AddGoalProgressInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProgressEntryForm({
  goalId,
  goalUnit,
  currentValue,
  targetValue,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProgressEntryFormProps) {
  const { t } = useI18n();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [formData, setFormData] = useState<ProgressEntryFormData>({
    value: 0,
    note: '',
    date: today(),
    progressType: 'add',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.value <= 0) {
      newErrors.value = t('goals.progress.form.errors.valueRequired');
    } else if (formData.value > 1000000) {
      newErrors.value = t('goals.progress.form.errors.valueTooLarge');
    }

    if (formData.note.length > 200) {
      newErrors.note = t('goals.progress.form.errors.noteTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const submitData: AddGoalProgressInput = {
        goalId,
        value: formData.value,
        note: formData.note.trim(),
        date: formData.date,
        progressType: formData.progressType,
      };
      await onSubmit(submitData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('goals.progress.form.errors.submitFailed'));
      setShowError(true);
    }
  };

  const scrollToInput = (inputPosition: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: inputPosition,
        animated: true,
      });
    }, 100);
  };

  const getPreviewValue = () => {
    switch (formData.progressType) {
      case 'add':
        return currentValue + formData.value;
      case 'subtract':
        return Math.max(0, currentValue - formData.value);
      case 'set':
        return formData.value;
      default:
        return currentValue;
    }
  };

  const progressTypeOptions = [
    { value: 'add', label: t('goals.progress.form.types.add'), icon: '+' },
    { value: 'subtract', label: t('goals.progress.form.types.subtract'), icon: '-' },
    { value: 'set', label: t('goals.progress.form.types.set'), icon: '=' },
  ];

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        {/* Progress Type Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.progress.form.progressType')}</Text>
          <View style={styles.typeContainer}>
            {progressTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.typeOption,
                  formData.progressType === option.value && styles.typeOptionActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, progressType: option.value as any }))}
                disabled={isLoading}
              >
                <Text style={[styles.typeIcon, formData.progressType === option.value && styles.typeIconActive]}>
                  {option.icon}
                </Text>
                <Text style={[
                  styles.typeText,
                  formData.progressType === option.value && styles.typeTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Value Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('goals.progress.form.value')} ({goalUnit})
          </Text>
          <TextInput
            style={[styles.input, errors.value && styles.inputError]}
            placeholder={t('goals.progress.form.placeholders.value')}
            placeholderTextColor={Colors.textSecondary}
            value={formData.value > 0 ? formData.value.toString() : ''}
            onChangeText={(text) => {
              const numValue = parseInt(text) || 0;
              setFormData(prev => ({ ...prev, value: numValue }));
            }}
            onFocus={() => scrollToInput(150)}
            keyboardType="numeric"
            editable={!isLoading}
          />
          {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
        </View>

        {/* Progress Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>{t('goals.progress.form.preview')}</Text>
          <Text style={styles.previewValue}>
            {getPreviewValue()} / {targetValue} {goalUnit}
          </Text>
          <Text style={styles.previewPercentage}>
            {Math.round((getPreviewValue() / targetValue) * 100)}%
          </Text>
        </View>

        {/* Note Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.progress.form.note')}</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.note && styles.inputError]}
            placeholder={t('goals.progress.form.placeholders.note')}
            placeholderTextColor={Colors.textSecondary}
            value={formData.note}
            onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
            onFocus={() => scrollToInput(300)}
            multiline
            numberOfLines={3}
            editable={!isLoading}
            maxLength={200}
          />
          {errors.note && <Text style={styles.errorText}>{errors.note}</Text>}
        </View>

        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.progress.form.date')}</Text>
          <TextInput
            style={[styles.input]}
            placeholder={t('goals.progress.form.placeholders.date')}
            placeholderTextColor={Colors.textSecondary}
            value={formData.date}
            onChangeText={(text) => setFormData(prev => ({ ...prev, date: text as DateString }))}
            onFocus={() => scrollToInput(450)}
            editable={!isLoading}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              Keyboard.dismiss();
              onCancel();
            }}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton, isLoading && styles.disabledButton]}
            onPress={() => {
              scrollToInput(500);
              handleSubmit();
            }}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.submitButtonText]}>
              {isLoading ? t('common.saving') : t('goals.progress.form.submit')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        title={t('common.error')}
        message={errorMessage}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeIcon: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  typeIconActive: {
    color: Colors.white,
  },
  typeText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: Colors.white,
  },
  previewContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  previewValue: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  previewPercentage: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
  },
  submitButtonText: {
    color: Colors.white,
  },
});