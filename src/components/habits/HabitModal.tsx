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
  StatusBar,
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

  if (Platform.OS === 'android') {
    // Android - BEZ overlay divu!
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
        statusBarTranslucent
        presentationStyle="fullScreen"
      >
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
      </Modal>
    );
  }
  
  // iOS - zachovat původní strukturu
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Pro Android - jednoduchý container bez position absolute
  androidContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: StatusBar.currentHeight || 0,
  },
  // iOS styly zůstávají stejné
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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