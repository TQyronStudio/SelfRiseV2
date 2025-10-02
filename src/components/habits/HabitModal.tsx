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
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';
import { useTutorial } from '../../contexts/TutorialContext';

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
        <SafeAreaView style={styles.container} nativeID="main-content">
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isEditing ? t('habits.editHabit') : t('habits.addHabit')}
            </Text>
            <View style={styles.placeholder} />
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

// STANDARDÍ React Native Modal styly
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 60,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
});