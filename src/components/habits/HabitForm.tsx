// src/components/habits/HabitForm.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  DeviceEventEmitter,
} from 'react-native';
import { HabitColor, HabitIcon, DayOfWeek } from '../../types/common';
import { CreateHabitInput, UpdateHabitInput } from '../../types/habit';
import { ColorPicker } from './ColorPicker';
import { IconPicker } from './IconPicker';
import { DayPicker } from './DayPicker';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { ErrorModal, HelpTooltip } from '@/src/components/common';
import { useTheme } from '../../contexts/ThemeContext';

// ZMĚNA: Vytváříme a exportujeme typ pro data formuláře
export type HabitFormData = {
  name: string;
  color: HabitColor;
  icon: HabitIcon;
  scheduledDays: DayOfWeek[];
  description?: string;
};

interface HabitFormProps {
  // ZMĚNA: Používáme náš nový, přesný typ a explicitně povolujeme undefined
  initialData: HabitFormData | undefined;
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
  const { colors } = useTheme();

  // Tutorial target refs
  const habitNameRef = useRef<TextInput>(null);
  const habitColorRef = useRef<View>(null);
  const habitIconRef = useRef<View>(null);
  const habitDaysRef = useRef<View>(null);
  const createButtonRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Tutorial target registration





    // Tutorial auto-scroll support for modal
  useEffect(() => {
    const scrollListener = DeviceEventEmitter.addListener(
      'tutorial_scroll_to',
      ({ y, animated = true }: { y: number; animated?: boolean }) => {
        console.log(`📜 [HABIT_FORM] Tutorial auto-scroll to Y: ${y}`);
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y, animated });

          // Signal that scroll is completed
          setTimeout(() => {
            console.log(`🔄 [HABIT_FORM] Signaling position refresh after scroll`);
            DeviceEventEmitter.emit('tutorial_scroll_completed');
          }, animated ? 300 : 50);
        }
      }
    );

    return () => {
      scrollListener.remove();
    };
  }, []);

  // Auto-focus text input during tutorial
  

  // 🎯 Auto-scroll to Create button during tutorial (step 9: habit-create)
  

  const [formData, setFormData] = useState<HabitFormData>({
    name: initialData?.name || '',
    color: initialData?.color || HabitColor.BLUE,
    icon: initialData?.icon || HabitIcon.FITNESS,
    scheduledDays: initialData?.scheduledDays || [],
    description: initialData?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    console.log(`🔍 [DEBUG] handleSubmit called with formData:`, formData);
    console.log(`🔍 [DEBUG] scheduledDays:`, formData.scheduledDays);

    if (!validateForm()) {
      console.log(`❌ [DEBUG] Validation failed! Errors:`, errors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('habits.form.errors.submitFailed'));
      setShowError(true);
    }
  };

  const handleDayToggle = (day: DayOfWeek) => {
    const newScheduledDays = formData.scheduledDays.includes(day)
      ? formData.scheduledDays.filter(d => d !== day)
      : [...formData.scheduledDays, day];

    console.log(`📅 [DEBUG] DayPicker toggle called with day: ${day}, new days:`, newScheduledDays);

    setFormData(prev => ({
      ...prev,
      scheduledDays: newScheduledDays,
    }));

  };

  const handleNameChange = (text: string) => {
    setFormData(prev => ({ ...prev, name: text }));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 60,
    },
    form: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    visualGroup: {
      marginBottom: 24,
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 16,
    },
    compactSection: {
      marginBottom: 16,
    },
    lastCompactSection: {
      marginBottom: 0,
    },
    label: {
      fontSize: 16,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginBottom: 8,
    },
    labelWithHelp: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      fontFamily: Fonts.regular,
      backgroundColor: colors.cardBackgroundElevated,
      color: colors.text,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      fontFamily: Fonts.regular,
      backgroundColor: colors.cardBackgroundElevated,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: colors.error,
    },
    errorText: {
      fontSize: 12,
      fontFamily: Fonts.regular,
      color: colors.error,
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingBottom: 20,
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
      backgroundColor: colors.cardBackgroundElevated,
      marginRight: 8,
    },
    submitButton: {
      backgroundColor: colors.primary,
      marginLeft: 8,
    },
    cancelButtonText: {
      fontSize: 16,
      fontFamily: Fonts.semibold,
      color: colors.textSecondary,
    },
    submitButtonText: {
      fontSize: 16,
      fontFamily: Fonts.semibold,
      color: colors.textInverse,
    },
    disabledButton: {
      backgroundColor: colors.cardBackgroundElevated,
      opacity: 0.6,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>{t('habits.form.name')}</Text>
          <TextInput
            ref={habitNameRef}
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={handleNameChange}
            placeholder={t('habits.form.namePlaceholder')}
            placeholderTextColor={colors.textTertiary}
            maxLength={50}
            nativeID="habit-name-input"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('habits.form.description')}</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder={t('habits.form.descriptionPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
        </View>

        {/* Visual Properties Group */}
        <View style={styles.visualGroup}>
          <View style={styles.compactSection}>
            <Text style={styles.label}>{t('habits.form.color')}</Text>
            <View ref={habitColorRef} nativeID="habit-color-picker">
              <ColorPicker
                selectedColor={formData.color}
                onColorSelect={(color) => setFormData(prev => ({ ...prev, color }))}
              />
            </View>
          </View>

          <View style={styles.compactSection}>
            <Text style={styles.label}>{t('habits.form.icon')}</Text>
            <View ref={habitIconRef} nativeID="habit-icon-picker">
              <IconPicker
                selectedIcon={formData.icon}
                onIconSelect={(icon) => setFormData(prev => ({ ...prev, icon }))}
              />
            </View>
          </View>

          <View style={[styles.compactSection, styles.lastCompactSection]}>
            <View style={styles.labelWithHelp}>
              <Text style={styles.label}>{t('habits.form.scheduledDays')}</Text>
              <HelpTooltip helpKey="habits.scheduling" />
            </View>
            <View ref={habitDaysRef} nativeID="habit-scheduled-days">
              <DayPicker
                selectedDays={formData.scheduledDays}
                onDayToggle={handleDayToggle}
              />
            </View>
            {errors.scheduledDays && (
              <Text style={styles.errorText}>{errors.scheduledDays}</Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>

          <View ref={createButtonRef} nativeID="create-habit-submit">
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? t('common.update') : t('common.create')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </ScrollView>
      
      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        message={errorMessage}
      />
    </View>
  );
}