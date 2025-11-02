// src/components/habits/HabitModal.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit, CreateHabitInput, UpdateHabitInput } from '../../types/habit';
import { HabitForm, HabitFormData } from './HabitForm';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';
import { useTutorial } from '../../contexts/TutorialContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HabitModalProps {
  visible: boolean;
  // TOTO JE FINÁLNÍ A NEJEXPLICITNĚJŠÍ OPRAVA:
  // Místo otazníku říkáme rovnou, že typ je 'Habit' NEBO 'undefined'.
  habit: Habit | undefined;
  onClose: () => void;
  onSubmit: (data: CreateHabitInput | UpdateHabitInput) => Promise<void>;
  isLoading?: boolean;
}

export function HabitModal({
  visible,
  habit,
  onClose,
  onSubmit,
  isLoading = false,
}: HabitModalProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { state: tutorialState } = useTutorial();
  const isEditing = !!habit;

  const initialData: HabitFormData | undefined = habit
    ? {
        name: habit.name,
        color: habit.color,
        icon: habit.icon,
        scheduledDays: habit.scheduledDays,
        ...(habit.description && { description: habit.description }),
      }
    : undefined;

  // STANDARDÍ React Native Modal s krásným pageSheet stylem
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={tutorialState.isActive ? "fullScreen" : "pageSheet"}
      onRequestClose={tutorialState.isActive ? undefined : onClose}
    >
      <TutorialOverlay>
        <SafeAreaView style={styles(colors).container} nativeID="main-content">
          <View style={styles(colors).header}>
            <TouchableOpacity
              style={styles(colors).closeButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles(colors).title}>
              {isEditing ? t('habits.editHabit') : t('habits.addHabit')}
            </Text>
            <View style={styles(colors).placeholder} />
          </View>
          <HabitForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isEditing={isEditing}
            isLoading={isLoading}
          />
        </SafeAreaView>
      </TutorialOverlay>
    </Modal>
  );
}

// Theme-aware styles moved inside component scope
const styles = (colors: any) => StyleSheet.create({
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