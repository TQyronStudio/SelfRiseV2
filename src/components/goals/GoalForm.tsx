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
import { GoalCategory } from '../../types/goal';
import { CreateGoalInput, UpdateGoalInput } from '../../types/goal';
import { DateString } from '../../types/common';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { ErrorModal } from '@/src/components/common';
import TargetDateConfirmationModal from './TargetDateConfirmationModal';
import { TargetDateStepSelectionModal } from './TargetDateStepSelectionModal';

export type GoalFormData = {
  title: string;
  description: string | undefined;
  unit: string;
  targetValue: number;
  category: GoalCategory;
  targetDate: DateString | undefined;
  _displayDate: string; // For DD.MM.YYYY display format
};

interface GoalFormProps {
  initialData: GoalFormData | undefined;
  onSubmit: (data: CreateGoalInput | UpdateGoalInput) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

const formatDateForInput = (date: DateString | undefined): string => {
  if (!date) return '';
  // Convert YYYY-MM-DD to DD.MM.YYYY for display
  if (date.includes('-')) {
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`;
  }
  return date;
};

export function GoalForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
}: GoalFormProps) {
  const { t } = useI18n();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [formData, setFormData] = useState<GoalFormData>({
    title: initialData?.title || '',
    description: initialData?.description || undefined,
    unit: initialData?.unit || '',
    targetValue: initialData?.targetValue || 0,
    category: initialData?.category || GoalCategory.PERSONAL,
    targetDate: initialData?.targetDate || undefined,
    _displayDate: initialData?.targetDate ? formatDateForInput(initialData.targetDate) : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDateConfirmation, setShowDateConfirmation] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('goals.form.errors.titleRequired');
    } else if (formData.title.trim().length < 2) {
      newErrors.title = t('goals.form.errors.titleTooShort');
    } else if (formData.title.trim().length > 100) {
      newErrors.title = t('goals.form.errors.titleTooLong');
    }

    if (!formData.unit.trim()) {
      newErrors.unit = t('goals.form.errors.unitRequired');
    } else if (formData.unit.trim().length > 20) {
      newErrors.unit = t('goals.form.errors.unitTooLong');
    }

    if (formData.targetValue <= 0) {
      newErrors.targetValue = t('goals.form.errors.targetValueRequired');
    } else if (formData.targetValue > 1000000) {
      newErrors.targetValue = t('goals.form.errors.targetValueTooLarge');
    }

    if (formData.description && formData.description.length > 300) {
      newErrors.description = t('goals.form.errors.descriptionTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Check if target date is missing and show confirmation modal
    if (!formData.targetDate) {
      setShowDateConfirmation(true);
      return;
    }

    // Proceed with normal submission
    await submitGoal();
  };

  const submitGoal = async () => {
    try {
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        unit: formData.unit.trim(),
        description: formData.description?.trim() || undefined,
        targetDate: formData.targetDate || undefined,
      };
      await onSubmit(submitData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('goals.form.errors.submitFailed'));
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

  const handleAddDate = () => {
    setShowDateConfirmation(false);
    setShowDateModal(true);
  };

  const handleContinueWithoutDate = () => {
    setShowDateConfirmation(false);
    // Proceed with goal creation without target date
    submitGoal();
  };

  // Handle date selection from Step-by-Step Selection Modal
  const handleDateSelect = (date: Date) => {
    // Convert Date to YYYY-MM-DD format for internal storage
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString: DateString = `${year}-${month}-${day}` as DateString;
    
    // Convert to DD.MM.YYYY format for display
    const displayDate = `${day}.${month}.${year}`;
    
    setFormData(prev => ({
      ...prev,
      targetDate: dateString,
      _displayDate: displayDate,
    }));
    
    setShowDateModal(false);
  };

  const categoryOptions = [
    { value: GoalCategory.PERSONAL, label: t('goals.categories.personal') },
    { value: GoalCategory.HEALTH, label: t('goals.categories.health') },
    { value: GoalCategory.LEARNING, label: t('goals.categories.learning') },
    { value: GoalCategory.CAREER, label: t('goals.categories.career') },
    { value: GoalCategory.FINANCIAL, label: t('goals.categories.financial') },
    { value: GoalCategory.OTHER, label: t('goals.categories.other') },
  ];

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
      bounces={true}
    >
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.form.title')}</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder={t('goals.form.placeholders.title')}
            placeholderTextColor={Colors.textSecondary}
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            onFocus={() => scrollToInput(0)}
            editable={!isLoading}
            maxLength={100}
            nativeID="goal-title-input"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.form.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.description && styles.inputError]}
            placeholder={t('goals.form.placeholders.description')}
            placeholderTextColor={Colors.textSecondary}
            value={formData.description || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text || undefined }))}
            onFocus={() => scrollToInput(100)}
            multiline
            numberOfLines={3}
            editable={!isLoading}
            maxLength={300}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Target Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.form.targetDate')}</Text>
          <Text style={styles.dateHint}>Tap to open step-by-step date selector</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateSelector]}
            onPress={() => setShowDateModal(true)}
            disabled={isLoading}
            nativeID="goal-date-picker"
          >
            <Text style={[
              styles.dateText, 
              !formData._displayDate && styles.placeholderText
            ]}>
              {formData._displayDate || 'Select target date (optional)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Unit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.form.unit')}</Text>
          <TextInput
            style={[styles.input, errors.unit && styles.inputError]}
            placeholder={t('goals.form.placeholders.unit')}
            placeholderTextColor={Colors.textSecondary}
            value={formData.unit}
            onChangeText={(text) => setFormData(prev => ({ ...prev, unit: text }))}
            onFocus={() => scrollToInput(250)}
            editable={!isLoading}
            maxLength={20}
            nativeID="goal-unit-input"
          />
          {errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}
        </View>

        {/* Target Value */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.form.targetValue')}</Text>
          <TextInput
            style={[styles.input, errors.targetValue && styles.inputError]}
            placeholder={t('goals.form.placeholders.targetValue')}
            placeholderTextColor={Colors.textSecondary}
            value={formData.targetValue > 0 ? formData.targetValue.toString() : ''}
            onChangeText={(text) => {
              const numValue = parseInt(text) || 0;
              setFormData(prev => ({ ...prev, targetValue: numValue }));
            }}
            onFocus={() => scrollToInput(300)}
            keyboardType="numeric"
            editable={!isLoading}
            nativeID="goal-target-input"
          />
          {errors.targetValue && <Text style={styles.errorText}>{errors.targetValue}</Text>}
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.form.category')}</Text>
          <View style={styles.categoryContainer}>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.categoryOption,
                  formData.category === option.value && styles.categoryOptionActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, category: option.value }))}
                disabled={isLoading}
              >
                <Text style={[
                  styles.categoryText,
                  formData.category === option.value && styles.categoryTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
              {isLoading ? t('common.saving') : (isEditing ? t('common.save') : t('common.create'))}
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

      <TargetDateConfirmationModal
        visible={showDateConfirmation}
        onClose={() => setShowDateConfirmation(false)}
        onAddDate={handleAddDate}
        onContinueWithoutDate={handleContinueWithoutDate}
      />

      <TargetDateStepSelectionModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelectDate={handleDateSelect}
        initialDate={formData.targetDate ? new Date(formData.targetDate) : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40, // Extra space at bottom for buttons
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
  dateHint: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontStyle: 'italic',
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
  dateSelector: {
    justifyContent: 'center',
    minHeight: 50,
  },
  dateText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  categoryOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
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