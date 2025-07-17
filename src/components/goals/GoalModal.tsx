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
  StatusBar,
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
      animationType={Platform.OS === 'ios' ? 'fade' : 'slide'}
      transparent={Platform.OS === 'ios'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
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
        ) : (
          // Android - zjednodušená struktura bez overlay div
          <KeyboardAvoidingView
            style={styles.container}
            behavior="height"
            keyboardVerticalOffset={StatusBar.currentHeight || 0}
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
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.5)' : Colors.background,
    justifyContent: Platform.OS === 'ios' ? 'flex-end' : 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    ...(Platform.OS === 'ios' ? {
      marginTop: 50,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    } : {
      paddingTop: StatusBar.currentHeight || 0,
    }),
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