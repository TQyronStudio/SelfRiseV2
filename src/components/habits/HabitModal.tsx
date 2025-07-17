// src/components/habits/HabitModal.tsx

import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit, CreateHabitInput, UpdateHabitInput } from '../../types/habit';
import { HabitForm, HabitFormData } from './HabitForm';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';

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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={Platform.OS === 'ios'}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <SafeAreaView style={styles.container}>
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
        ) : (
          // Android specifická implementace bez SafeAreaView
          <View style={styles.androidContainer}>
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
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.8)',
    justifyContent: Platform.OS === 'ios' ? 'flex-end' : 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: 50, // Space for status bar and backdrop visibility
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 1500,
    zIndex: 1500,
  },
  // Android specifický kontejner - úplně jednoduchý bez marginů a borderů
  androidContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    elevation: 9999, // Maximální možná elevation
    zIndex: 9999,
    // Debug styly pro Android
    borderWidth: Platform.OS === 'android' ? 5 : 0,
    borderColor: Platform.OS === 'android' ? 'red' : 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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