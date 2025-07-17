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
      transparent={Platform.OS === 'ios'}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
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
          // Android specifická implementace bez SafeAreaView
          <KeyboardAvoidingView
            style={styles.androidContainer}
            behavior="height"
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
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.8)',
    justifyContent: Platform.OS === 'ios' ? 'flex-end' : 'center',
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