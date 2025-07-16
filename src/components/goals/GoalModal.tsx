import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal, CreateGoalInput, UpdateGoalInput } from '../../types/goal';
import { GoalForm, GoalFormData } from './GoalForm';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';

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
  const isEditing = !!goal;

  const initialData: GoalFormData | undefined = goal
    ? {
        title: goal.title,
        description: goal.description,
        unit: goal.unit,
        targetValue: goal.targetValue,
        category: goal.category,
        targetDate: goal.targetDate,
      }
    : templateData
    ? {
        title: templateData.title,
        description: '',
        unit: templateData.unit,
        targetValue: templateData.targetValue,
        category: templateData.category,
        targetDate: templateData.targetDate,
      }
    : undefined;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={isLoading}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              
              <Text style={styles.title}>
                {isEditing ? t('goals.editGoal') : t('goals.addGoal')}
              </Text>
              
              <View style={styles.placeholder} />
            </View>

            <GoalForm
              initialData={initialData}
              onSubmit={onSubmit}
              onCancel={onClose}
              isEditing={isEditing}
              isLoading={isLoading}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  keyboardAvoidingView: {
    flex: 1,
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