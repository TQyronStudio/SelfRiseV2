import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit, CreateHabitInput, UpdateHabitInput } from '../../types/habit';
import { HabitForm } from './HabitForm';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';

interface HabitModalProps {
  visible: boolean;
  habit?: Habit;
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
  const isEditing = !!habit;

  const initialData = habit ? {
    name: habit.name,
    color: habit.color,
    icon: habit.icon,
    scheduledDays: habit.scheduledDays,
    description: habit.description,
  } : undefined;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Ionicons name="close" size={24} color={COLORS.GRAY_600} />
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.SEMIBOLD,
    color: COLORS.GRAY_800,
  },
  placeholder: {
    width: 40,
  },
});