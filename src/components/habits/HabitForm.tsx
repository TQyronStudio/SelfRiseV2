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
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { ErrorModal, HelpTooltip } from '@/src/components/common';
import { useTutorialTarget } from '@/src/utils/TutorialTargetHelper';
import { useTutorial } from '@/src/contexts/TutorialContext';

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
  const { state: tutorialState, actions: tutorialActions } = useTutorial();

  // Tutorial target refs
  const habitNameRef = useRef<TextInput>(null);
  const habitColorRef = useRef<View>(null);
  const habitIconRef = useRef<View>(null);
  const habitDaysRef = useRef<View>(null);
  const createButtonRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Tutorial target registration
  const { registerTarget: registerHabitName, unregisterTarget: unregisterHabitName } = useTutorialTarget(
    'habit-name-input',
    habitNameRef as any
  );

  const { registerTarget: registerHabitColor, unregisterTarget: unregisterHabitColor } = useTutorialTarget(
    'habit-color-picker',
    habitColorRef as any
  );

  const { registerTarget: registerHabitIcon, unregisterTarget: unregisterHabitIcon } = useTutorialTarget(
    'habit-icon-picker',
    habitIconRef as any
  );

  const { registerTarget: registerHabitDays, unregisterTarget: unregisterHabitDays } = useTutorialTarget(
    'habit-scheduled-days',
    habitDaysRef as any
  );

  const { registerTarget: registerCreateButton, unregisterTarget: unregisterCreateButton } = useTutorialTarget(
    'create-habit-submit',
    createButtonRef as any
  );

  useEffect(() => {
    registerHabitName();
    registerHabitColor();
    registerHabitIcon();
    registerHabitDays();
    registerCreateButton();

    return () => {
      unregisterHabitName();
      unregisterHabitColor();
      unregisterHabitIcon();
      unregisterHabitDays();
      unregisterCreateButton();
    };
  }, []);

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
  useEffect(() => {
    if (
      tutorialState.isActive &&
      tutorialState.currentStepData?.action === 'type_text' &&
      tutorialState.currentStepData?.target === 'habit-name-input'
    ) {
      // Small delay to ensure modal and spotlight are fully rendered
      setTimeout(() => {
        console.log(`⌨️ [TUTORIAL] Auto-focusing habit name input...`);
        if (habitNameRef.current) {
          habitNameRef.current.focus();
        }
      }, 300);
    }
  }, [tutorialState.isActive, tutorialState.currentStepData?.action, tutorialState.currentStepData?.target]);

  // 🎯 Auto-scroll to Create button during tutorial (step 9: habit-create)
  useEffect(() => {
    if (
      tutorialState.isActive &&
      tutorialState.currentStepData?.id === 'habit-create' &&
      tutorialState.currentStepData?.target === 'create-habit-submit'
    ) {
      // Scroll to bottom where Create button is
      setTimeout(() => {
        console.log(`📜 [TUTORIAL] Auto-scrolling to Create button...`);
        if (scrollViewRef.current && createButtonRef.current) {
          createButtonRef.current.measureLayout(
            scrollViewRef.current as any,
            (x: number, y: number, width: number, height: number) => {
              // 📐 Adaptive scroll offset based on device height
              const screenHeight = require('react-native').Dimensions.get('window').height;
              const topMargin = screenHeight < 700 ? 80 : 120; // Smaller devices: less margin

              scrollViewRef.current?.scrollTo({
                y: Math.max(0, y - topMargin), // Scroll so button is visible with adaptive top margin
                animated: true,
              });
              console.log(`✅ [TUTORIAL] Scrolled to Create button at y=${y}px (margin: ${topMargin}px, screenHeight: ${screenHeight}px)`);

              // Signal that scroll is complete
              setTimeout(() => {
                DeviceEventEmitter.emit('tutorial_scroll_completed');
              }, 400);
            },
            () => {
              console.error('Failed to measure Create button');
            }
          );
        }
      }, 200);
    }
  }, [tutorialState.isActive, tutorialState.currentStepData?.id]);

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
    // Tutorial guard: Prevent early submission if tutorial is active but not on create step
    if (tutorialState.isActive && tutorialState.currentStepData?.id !== 'habit-create') {
      console.log(`🚫 [TUTORIAL] Blocking habit submission - tutorial is on step "${tutorialState.currentStepData?.id}", need to be on "habit-create"`);
      return;
    }

    console.log(`🔍 [DEBUG] handleSubmit called with formData:`, formData);
    console.log(`🔍 [DEBUG] scheduledDays:`, formData.scheduledDays);

    if (!validateForm()) {
      console.log(`❌ [DEBUG] Validation failed! Errors:`, errors);
      return;
    }

    try {
      await onSubmit(formData);
      console.log(`✅ [TUTORIAL] Habit submitted successfully`);

      // Tutorial logic: Advance tutorial after successful habit creation
      if (
        tutorialState.isActive &&
        tutorialState.currentStepData?.action === 'click_element' &&
        tutorialState.currentStepData?.target === 'create-habit-submit'
      ) {
        console.log(`🎯 [TUTORIAL] Habit created, advancing tutorial...`);
        tutorialActions.handleStepAction('click_element');
      }
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

    // Tutorial logic: Show Next button when at least one day is selected
    if (
      tutorialState.isActive &&
      tutorialState.currentStepData?.action === 'select_days' &&
      tutorialState.currentStepData?.target === 'habit-scheduled-days' &&
      newScheduledDays.length > 0
    ) {
      console.log(`📅 [TUTORIAL] Days selected: ${newScheduledDays.length}, enabling Next button...`);
      tutorialActions.showNextButton(true);
    }
  };

  // Handle habit name change with tutorial first character detection
  const handleNameChange = (text: string) => {
    const prevName = formData.name;

    // Update form data
    setFormData(prev => ({ ...prev, name: text }));

    // Tutorial logic: Show Next button when first character is typed
    if (
      tutorialState.isActive &&
      tutorialState.currentStepData?.action === 'type_text' &&
      tutorialState.currentStepData?.target === 'habit-name-input' &&
      tutorialState.currentStepData?.nextTrigger === 'first_character' &&
      prevName.length === 0 &&
      text.length > 0
    ) {
      console.log(`⌨️ [TUTORIAL] First character typed, enabling Next button...`);
      tutorialActions.showNextButton(true);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        scrollEnabled={!tutorialState.isActive} // 🔒 Disable manual scroll during tutorial
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
            placeholderTextColor={Colors.textTertiary}
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
            placeholderTextColor={Colors.textTertiary}
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
                onColorSelect={(color) => {
                  console.log(`🎨 [DEBUG] ColorPicker callback called with color: ${color}`);
                  setFormData(prev => ({ ...prev, color }));

                  // Tutorial logic: Show Next button when color is selected
                  if (
                    tutorialState.isActive &&
                    tutorialState.currentStepData?.action === 'select_option' &&
                    tutorialState.currentStepData?.target === 'habit-color-picker'
                  ) {
                    console.log(`🎨 [TUTORIAL] Color selected: ${color}, enabling Next button...`);
                    tutorialActions.showNextButton(true);
                  } else {
                    console.log(`🎨 [DEBUG] Tutorial state:`, {
                      isActive: tutorialState.isActive,
                      action: tutorialState.currentStepData?.action,
                      target: tutorialState.currentStepData?.target
                    });
                  }
                }}
              />
            </View>
          </View>

          <View style={styles.compactSection}>
            <Text style={styles.label}>{t('habits.form.icon')}</Text>
            <View ref={habitIconRef} nativeID="habit-icon-picker">
              <IconPicker
                selectedIcon={formData.icon}
                onIconSelect={(icon) => {
                  console.log(`🎯 [DEBUG] IconPicker callback called with icon: ${icon}`);
                  setFormData(prev => ({ ...prev, icon }));

                  // Tutorial logic: Show Next button when icon is selected
                  if (
                    tutorialState.isActive &&
                    tutorialState.currentStepData?.action === 'select_option' &&
                    tutorialState.currentStepData?.target === 'habit-icon-picker'
                  ) {
                    console.log(`🎯 [TUTORIAL] Icon selected: ${icon}, enabling Next button...`);
                    tutorialActions.showNextButton(true);
                  }
                }}
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
                // Disable button visually if tutorial is active but not on create step
                (tutorialState.isActive && tutorialState.currentStepData?.id !== 'habit-create') && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={
                isLoading ||
                (tutorialState.isActive && tutorialState.currentStepData?.id !== 'habit-create')
              }
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60, // Extra space to ensure Create button is always visible
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  visualGroup: {
    marginBottom: 24,
    backgroundColor: Colors.backgroundSecondary,
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
    color: Colors.text,
    marginBottom: 8,
  },
  labelWithHelp: {
    flexDirection: 'row',
    alignItems: 'center',
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
  disabledButton: {
    backgroundColor: Colors.backgroundSecondary,
    opacity: 0.6,
  },
});