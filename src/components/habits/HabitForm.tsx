import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { HabitColor, HabitIcon, DayOfWeek } from '../../types/common';
import { CreateHabitInput, UpdateHabitInput } from '../../types/habit';
import { ColorPicker } from './ColorPicker';
import { IconPicker } from './IconPicker';
import { DayPicker } from './DayPicker';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';

interface HabitFormProps {
  initialData?: {
    name: string;
    color: HabitColor;
    icon: HabitIcon;
    scheduledDays: DayOfWeek[];
    description?: string;
  };
  onSubmit: (data: CreateHabitInput | UpdateHabitInput) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function HabitForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
}: HabitFormProps) {
  const { t } = useI18n();
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    color: initialData?.color || HabitColor.BLUE,
    icon: initialData?.icon || HabitIcon.FITNESS,
    scheduledDays: initialData?.scheduledDays || [],
    description: initialData?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('habits.form.errors.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('habits.form.errors.nameTooShort');
    } else if (formData.name.trim().length > 50) {
      newErrors.name = t('habits.form.errors.nameTooLong');
    }

    if (formData.scheduledDays.length === 0) {
      newErrors.scheduledDays = t('habits.form.errors.daysRequired');
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = t('habits.form.errors.descriptionTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('habits.form.errors.submitFailed')
      );
    }
  };

  const handleDayToggle = (day: DayOfWeek) => {
    setFormData(prev => ({
      ...prev,
      scheduledDays: prev.scheduledDays.includes(day)
        ? prev.scheduledDays.filter(d => d !== day)
        : [...prev.scheduledDays, day],
    }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>{t('habits.form.name')}</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder={t('habits.form.namePlaceholder')}
            placeholderTextColor={Colors.textTertiary}
            maxLength={50}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('habits.form.color')}</Text>
          <ColorPicker
            selectedColor={formData.color}
            onColorSelect={(color) => setFormData(prev => ({ ...prev, color }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('habits.form.icon')}</Text>
          <IconPicker
            selectedIcon={formData.icon}
            onIconSelect={(icon) => setFormData(prev => ({ ...prev, icon }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('habits.form.scheduledDays')}</Text>
          <DayPicker
            selectedDays={formData.scheduledDays}
            onDayToggle={handleDayToggle}
          />
          {errors.scheduledDays && (
            <Text style={styles.errorText}>{errors.scheduledDays}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('habits.form.description')}</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder={t('habits.form.descriptionPlaceholder')}
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isEditing ? t('common.update') : t('common.create')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
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
    backgroundColor: Colors.background,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: Fonts.regular,
    backgroundColor: Colors.background,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.error,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
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
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.textInverse,
  },
});