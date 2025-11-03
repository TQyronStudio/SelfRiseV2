import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  DeviceEventEmitter,
  Dimensions,
} from 'react-native';
import { GoalCategory } from '../../types/goal';
import { CreateGoalInput, UpdateGoalInput } from '../../types/goal';
import { DateString } from '../../types/common';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../contexts/ThemeContext';
import { ErrorModal } from '@/src/components/common';
import TargetDateConfirmationModal from './TargetDateConfirmationModal';
import { TargetDateStepSelectionModal } from './TargetDateStepSelectionModal';
import { useTutorialTarget } from '@/src/utils/TutorialTargetHelper';
import { useTutorial } from '@/src/contexts/TutorialContext';

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
  const { colors } = useTheme();
  const { state: tutorialState, actions: tutorialActions } = useTutorial();
  const scrollViewRef = useRef<ScrollView>(null);

  // Tutorial target refs
  const goalTitleRef = useRef<TextInput>(null);
  const goalUnitRef = useRef<TextInput>(null);
  const goalTargetRef = useRef<TextInput>(null);
  const goalDateRef = useRef<View>(null);
  const goalCategoryRef = useRef<View>(null);
  const createButtonRef = useRef<View>(null);

  // Tutorial target registration
  const { registerTarget: registerGoalTitle, unregisterTarget: unregisterGoalTitle } = useTutorialTarget(
    'goal-title-input',
    goalTitleRef as any
  );

  const { registerTarget: registerGoalUnit, unregisterTarget: unregisterGoalUnit } = useTutorialTarget(
    'goal-unit-input',
    goalUnitRef as any
  );

  const { registerTarget: registerGoalTarget, unregisterTarget: unregisterGoalTarget } = useTutorialTarget(
    'goal-target-input',
    goalTargetRef as any
  );

  const { registerTarget: registerGoalDate, unregisterTarget: unregisterGoalDate } = useTutorialTarget(
    'goal-date-picker',
    goalDateRef as any
  );

  const { registerTarget: registerGoalCategory, unregisterTarget: unregisterGoalCategory } = useTutorialTarget(
    'goal-category-picker',
    goalCategoryRef as any
  );

  const { registerTarget: registerCreateButton, unregisterTarget: unregisterCreateButton } = useTutorialTarget(
    'create-goal-submit',
    createButtonRef as any
  );
  
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

  useEffect(() => {
    registerGoalTitle();
    registerGoalUnit();
    registerGoalTarget();
    registerGoalDate();
    registerGoalCategory();
    registerCreateButton();

    return () => {
      unregisterGoalTitle();
      unregisterGoalUnit();
      unregisterGoalTarget();
      unregisterGoalDate();
      unregisterGoalCategory();
      unregisterCreateButton();
    };
  }, []);

  // Tutorial auto-scroll support for modal
  useEffect(() => {
    const scrollListener = DeviceEventEmitter.addListener(
      'tutorial_scroll_to',
      ({ y, animated = true }: { y: number; animated?: boolean }) => {
        console.log(`📜 [GOAL_FORM] Tutorial auto-scroll to Y: ${y}`);
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y, animated });

          // Signal that scroll is completed
          setTimeout(() => {
            console.log(`🔄 [GOAL_FORM] Signaling position refresh after scroll`);
            DeviceEventEmitter.emit('tutorial_scroll_completed');
          }, animated ? 300 : 50);
        }
      }
    );

    return () => {
      scrollListener.remove();
    };
  }, []);

  // 🎯 Reset scroll position to top when modal opens during tutorial
  useEffect(() => {
    if (tutorialState.isActive && scrollViewRef.current) {
      console.log(`📜 [TUTORIAL] Resetting GoalForm scroll to top...`);
      // Reset scroll to top immediately when modal opens during tutorial
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }, 50);
    }
  }, []); // Run only once when component mounts

  // 🎯 Auto-scroll to lower fields (goal-unit, goal-target, goal-date, goal-category) during tutorial
  useEffect(() => {
    if (
      tutorialState.isActive &&
      (tutorialState.currentStepData?.id === 'goal-unit' ||
       tutorialState.currentStepData?.id === 'goal-target' ||
       tutorialState.currentStepData?.id === 'goal-date' ||
       tutorialState.currentStepData?.id === 'goal-category')
    ) {
      setTimeout(() => {
        const targetRef =
          tutorialState.currentStepData?.id === 'goal-unit' ? goalUnitRef :
          tutorialState.currentStepData?.id === 'goal-target' ? goalTargetRef :
          tutorialState.currentStepData?.id === 'goal-date' ? goalDateRef :
          goalCategoryRef;

        if (scrollViewRef.current && targetRef.current) {
          console.log(`📜 [TUTORIAL] Auto-scrolling to ${tutorialState.currentStepData?.id}...`);
          targetRef.current.measureLayout(
            scrollViewRef.current as any,
            (x: number, y: number, width: number, height: number) => {
              // Calculate offset to leave space for tutorial text above the field
              const screenHeight = Dimensions.get('window').height;

              // Tutorial card estimated height - LARGE offset pushes field DOWN:
              // Goal-date needs BIG offset so field appears LOW on screen (tutorial text above)
              // - Small screen: 500px card height + padding = field appears lower
              // - Normal screen: 550px card height + padding = field appears lower
              const isGoalDate = tutorialState.currentStepData?.id === 'goal-date';
              const tutorialCardHeight = screenHeight < 700 ?
                (isGoalDate ? 500 : 260) :
                (isGoalDate ? 550 : 290);
              const safeAreaTop = 50; // iOS notch/status bar
              const padding = isGoalDate ? 80 : 20; // Large padding = field lower on screen

              const topOffset = tutorialCardHeight + safeAreaTop + padding;
              // This ensures field appears BELOW tutorial text, not hidden under it

              scrollViewRef.current?.scrollTo({
                y: Math.max(0, y - topOffset),
                animated: true,
              });
              console.log(`✅ [TUTORIAL] Scrolled to ${tutorialState.currentStepData?.id} at y=${y}px (offset: ${topOffset}px)`);

              // Signal scroll completion for spotlight refresh
              setTimeout(() => {
                DeviceEventEmitter.emit('tutorial_scroll_completed');
              }, 400);
            },
            () => {
              console.error(`Failed to measure ${tutorialState.currentStepData?.id}`);
            }
          );
        }
      }, 200);
    }
  }, [tutorialState.isActive, tutorialState.currentStepData?.id]);

  // Auto-focus text/number inputs during tutorial
  // Note: scrollEnabled={false} prevents native scroll-to-focused-input behavior
  useEffect(() => {
    if (
      tutorialState.isActive &&
      (tutorialState.currentStepData?.action === 'type_text' || tutorialState.currentStepData?.action === 'type_number')
    ) {
      const target = tutorialState.currentStepData?.target;
      // Delay to ensure scroll and spotlight are ready
      setTimeout(() => {
        console.log(`⌨️ [TUTORIAL] Auto-focusing input: ${target}`);
        if (target === 'goal-title-input' && goalTitleRef.current) {
          goalTitleRef.current.focus();
        } else if (target === 'goal-unit-input' && goalUnitRef.current) {
          goalUnitRef.current.focus();
        } else if (target === 'goal-target-input' && goalTargetRef.current) {
          goalTargetRef.current.focus();
        }
      }, 500); // Delay after auto-scroll
    }
  }, [tutorialState.isActive, tutorialState.currentStepData?.action, tutorialState.currentStepData?.target]);

  // Tutorial-aware text input handlers
  const handleTitleChange = (text: string) => {
    const prevTitle = formData.title;
    setFormData(prev => ({ ...prev, title: text }));

    // Tutorial logic: Show Next button when first character is typed
    if (
      tutorialState.isActive &&
      tutorialState.currentStepData?.action === 'type_text' &&
      tutorialState.currentStepData?.target === 'goal-title-input' &&
      tutorialState.currentStepData?.nextTrigger === 'first_character' &&
      prevTitle.length === 0 &&
      text.length > 0
    ) {
      console.log(`⌨️ [TUTORIAL] First character typed in goal title, enabling Next button...`);
      tutorialActions.showNextButton(true);
    }
  };

  const handleUnitChange = (text: string) => {
    const prevUnit = formData.unit;
    setFormData(prev => ({ ...prev, unit: text }));

    // Tutorial logic: Show Next button when first character is typed
    if (
      tutorialState.isActive &&
      tutorialState.currentStepData?.action === 'type_text' &&
      tutorialState.currentStepData?.target === 'goal-unit-input' &&
      tutorialState.currentStepData?.nextTrigger === 'first_character' &&
      prevUnit.length === 0 &&
      text.length > 0
    ) {
      console.log(`⌨️ [TUTORIAL] First character typed in goal unit, enabling Next button...`);
      tutorialActions.showNextButton(true);
    }
  };

  const handleTargetChange = (text: string) => {
    const prevTarget = formData.targetValue;
    const numValue = parseInt(text) || 0;
    setFormData(prev => ({ ...prev, targetValue: numValue }));

    // Tutorial logic: Show Next button when first character is typed
    if (
      tutorialState.isActive &&
      tutorialState.currentStepData?.action === 'type_number' &&
      tutorialState.currentStepData?.target === 'goal-target-input' &&
      tutorialState.currentStepData?.nextTrigger === 'first_character' &&
      prevTarget === 0 &&
      numValue > 0
    ) {
      console.log(`🔢 [TUTORIAL] First number typed in goal target, enabling Next button...`);
      tutorialActions.showNextButton(true);
    }
  };

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
    console.log(`🔍 [DEBUG] handleSubmit called with formData:`, formData);

    if (!validateForm()) {
      console.log(`❌ [DEBUG] Validation failed! Errors:`, errors);
      return;
    }

    // Check if target date is missing and show confirmation modal
    // ⚠️ SKIP during tutorial - tutorial creates goal without date confirmation
    if (!formData.targetDate && !tutorialState.isActive) {
      console.log(`📅 [DEBUG] No target date, showing confirmation modal...`);
      setShowDateConfirmation(true);
      return;
    }

    // Proceed with normal submission
    console.log(`✅ [DEBUG] Validation passed, submitting goal...`);
    await submitGoal();
  };

  const submitGoal = async () => {
    console.log(`🚀 [DEBUG] submitGoal called`);
    try {
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        unit: formData.unit.trim(),
        description: formData.description?.trim() || undefined,
        targetDate: formData.targetDate || undefined,
      };

      console.log(`📤 [DEBUG] Calling onSubmit with data:`, submitData);
      await onSubmit(submitData);
      console.log(`✅ [TUTORIAL] Goal submitted successfully, onSubmit completed`);

      // Tutorial logic: Wait for modal to close, THEN advance tutorial
      if (
        tutorialState.isActive &&
        tutorialState.currentStepData?.action === 'click_element' &&
        tutorialState.currentStepData?.target === 'create-goal-submit'
      ) {
        console.log(`🎯 [TUTORIAL] Goal created via Create button, waiting for modal close...`);

        // Wait for modal close animation (300ms) before advancing tutorial
        await new Promise(resolve => setTimeout(resolve, 400));

        console.log(`🎯 [TUTORIAL] Modal closed, advancing tutorial...`);
        tutorialActions.handleStepAction('click_element');
      }
    } catch (error) {
      console.error(`❌ [DEBUG] Error in submitGoal:`, error);
      console.error(`❌ [DEBUG] Error details:`, error instanceof Error ? error.message : String(error));
      setErrorMessage(error instanceof Error ? error.message : t('goals.form.errors.submitFailed'));
      setShowError(true);
    }
  };


  const scrollToInput = (inputPosition: number) => {
    // 🚫 BLOCK auto-scroll during tutorial - it breaks spotlight positioning
    if (tutorialState.isActive) {
      console.log(`🚫 [TUTORIAL] Blocking auto-scroll during tutorial (would scroll to y=${inputPosition})`);
      return;
    }

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

    // Update form data with selected date
    const updatedFormData = {
      ...formData,
      targetDate: dateString,
      _displayDate: displayDate,
    };

    setFormData(updatedFormData);
    setShowDateModal(false);

    // Tutorial logic: Show Next button after date selection
    if (
      tutorialState.isActive &&
      tutorialState.currentStepData?.action === 'select_date' &&
      tutorialState.currentStepData?.target === 'goal-date-picker'
    ) {
      console.log(`📅 [TUTORIAL] Date selected, showing Next button...`);
      tutorialActions.showNextButton(true);
    }
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
      scrollEnabled={!tutorialState.isActive} // 🔒 Disable manual scroll during tutorial
    >
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.form.title')}</Text>
          <TextInput
            ref={goalTitleRef}
            style={[styles.input, errors.title && styles.inputError]}
            placeholder={t('goals.form.placeholders.title')}
            placeholderTextColor={colors.textSecondary}
            value={formData.title}
            onChangeText={handleTitleChange}
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
            placeholderTextColor={colors.textSecondary}
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
          <View ref={goalDateRef} nativeID="goal-date-picker">
            <TouchableOpacity
              style={[styles.input, styles.dateSelector]}
              onPress={() => setShowDateModal(true)}
              disabled={isLoading}
            >
              <Text style={[
                styles.dateText,
                !formData._displayDate && styles.placeholderText
              ]}>
                {formData._displayDate || 'Select target date (optional)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Unit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goals.form.unit')}</Text>
          <TextInput
            ref={goalUnitRef}
            style={[styles.input, errors.unit && styles.inputError]}
            placeholder={t('goals.form.placeholders.unit')}
            placeholderTextColor={colors.textSecondary}
            value={formData.unit}
            onChangeText={handleUnitChange}
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
            ref={goalTargetRef}
            style={[styles.input, errors.targetValue && styles.inputError]}
            placeholder={t('goals.form.placeholders.targetValue')}
            placeholderTextColor={colors.textSecondary}
            value={formData.targetValue > 0 ? formData.targetValue.toString() : ''}
            onChangeText={handleTargetChange}
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
          <View ref={goalCategoryRef} nativeID="goal-category-picker" style={styles.categoryContainer}>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.categoryOption,
                  formData.category === option.value && styles.categoryOptionActive,
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, category: option.value }));
                  // Tutorial: Show Next button after category selection
                  if (
                    tutorialState.isActive &&
                    tutorialState.currentStepData?.action === 'select_option' &&
                    tutorialState.currentStepData?.target === 'goal-category-picker'
                  ) {
                    console.log(`📂 [TUTORIAL] Category selected: ${option.value}, enabling Next button...`);
                    tutorialActions.showNextButton(true);
                  }
                }}
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

          <View ref={createButtonRef} nativeID="create-goal-submit">
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (isLoading || (tutorialState.isActive && tutorialState.currentStepData?.id !== 'goal-create')) && styles.disabledButton
              ]}
              onPress={() => {
                const isDisabled = isLoading || (tutorialState.isActive && tutorialState.currentStepData?.id !== 'goal-create');
                console.log(`🔍 [GOAL_FORM] Create button pressed!`, {
                  isLoading,
                  tutorialActive: tutorialState.isActive,
                  currentStep: tutorialState.currentStepData?.id,
                  isDisabled
                });
                if (!isDisabled) {
                  handleSubmit();
                }
              }}
              disabled={
                isLoading ||
                (tutorialState.isActive && tutorialState.currentStepData?.id !== 'goal-create')
              }
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {isLoading ? t('common.saving') : (isEditing ? t('common.save') : t('common.create'))}
              </Text>
            </TouchableOpacity>
          </View>
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 60,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontFamily: Fonts.medium,
      color: colors.text,
      marginBottom: 8,
    },
    dateHint: {
      fontSize: 12,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      marginBottom: 4,
      fontStyle: 'italic',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      fontFamily: Fonts.regular,
      color: colors.text,
      backgroundColor: colors.cardBackgroundElevated,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: colors.error,
    },
    dateSelector: {
      justifyContent: 'center',
      minHeight: 50,
    },
    dateText: {
      fontSize: 16,
      fontFamily: Fonts.regular,
      color: colors.text,
    },
    placeholderText: {
      color: colors.textSecondary,
    },
    errorText: {
      fontSize: 14,
      color: colors.error,
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
      borderColor: colors.border,
      backgroundColor: colors.cardBackgroundElevated,
    },
    categoryOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryText: {
      fontSize: 14,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
    },
    categoryTextActive: {
      color: '#FFFFFF',
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
      backgroundColor: colors.cardBackgroundElevated,
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    disabledButton: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: Fonts.medium,
    },
    cancelButtonText: {
      color: colors.textSecondary,
    },
    submitButtonText: {
      color: '#FFFFFF',
    },
  });
}