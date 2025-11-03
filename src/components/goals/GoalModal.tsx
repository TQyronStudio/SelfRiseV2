import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal, CreateGoalInput, UpdateGoalInput } from '../../types/goal';
import { GoalForm, GoalFormData } from './GoalForm';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';
import { useTutorial } from '../../contexts/TutorialContext';
import { useTheme } from '../../contexts/ThemeContext';

interface GoalModalProps {
  visible: boolean;
  goal: Goal | undefined;
  templateData?: CreateGoalInput;
  onClose: () => void;
  onSubmit: (data: CreateGoalInput | UpdateGoalInput) => Promise<void>;
  isLoading?: boolean;
}

export function GoalModal({
  visible,
  goal,
  templateData,
  onClose,
  onSubmit,
  isLoading = false,
}: GoalModalProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { state: tutorialState } = useTutorial();
  const isEditing = !!goal;

  const formatDateForInput = (date: string | undefined): string => {
    if (!date) return '';
    // Convert YYYY-MM-DD to DD.MM.YYYY for display
    if (date.includes('-')) {
      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}`;
    }
    return date;
  };

  const initialData: GoalFormData | undefined = goal
    ? {
        title: goal.title,
        description: goal.description,
        unit: goal.unit,
        targetValue: goal.targetValue,
        category: goal.category,
        targetDate: goal.targetDate,
        _displayDate: formatDateForInput(goal.targetDate),
      }
    : templateData
    ? {
        title: templateData.title,
        description: '',
        unit: templateData.unit,
        targetValue: templateData.targetValue,
        category: templateData.category,
        targetDate: templateData.targetDate,
        _displayDate: formatDateForInput(templateData.targetDate),
      }
    : undefined;

  // Styles inside component to access theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 60,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardBackgroundElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontFamily: Fonts.semibold,
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
  });

  // STANDARDÍ React Native Modal s krásným pageSheet stylem
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={tutorialState.isActive ? "fullScreen" : "pageSheet"}
      onRequestClose={tutorialState.isActive ? undefined : onClose}
    >
      <TutorialOverlay>
        <SafeAreaView style={styles.container} nativeID="main-content">
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isEditing ? t('goals.editGoal') : t('goals.addGoal')}
            </Text>
            <View style={styles.placeholder} />
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <GoalForm
              initialData={initialData}
              onSubmit={onSubmit}
              onCancel={onClose}
              isEditing={isEditing}
              isLoading={isLoading}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TutorialOverlay>
    </Modal>
  );
}